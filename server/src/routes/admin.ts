import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { pool } from '../db';
import { authLimiter, requireAdmin, audit } from '../middleware';
import {
  loginSchema, shipmentCreateSchema, shipmentUpdateSchema, eventSchema,
  holdSchema, releaseSchema, chargeSchema, paymentSchema, chatMessageSchema, validate, STATUSES,
  accountUpdateSchema, passwordChangeSchema,
} from '../validation';
import { SETTINGS, getSettings, setSetting } from '../settings';

const router = Router();

async function currentAdmin(req: Request) {
  const result = await pool.query(
    'SELECT id, email, full_name, role FROM admin_users WHERE id = $1',
    [req.session?.adminId]
  );
  return result.rows[0] || null;
}

router.post('/login', authLimiter, async (req: Request, res: Response) => {
  const data = validate(loginSchema, req.body);
  if ('error' in data) return res.status(400).json({ error: data.error });

  const result = await pool.query('SELECT * FROM admin_users WHERE email = $1', [data.email]);
  const admin = result.rows[0];
  const ok = admin && (await bcrypt.compare(data.password, admin.password_hash));
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  req.session.adminId = admin.id;
  res.json({ admin: { id: admin.id, email: admin.email, full_name: admin.full_name, role: admin.role } });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', requireAdmin, async (req: Request, res: Response) => {
  const admin = await currentAdmin(req);
  res.json({ admin });
});

// ---- Overview ----
router.get('/overview', requireAdmin, async (req: Request, res: Response) => {
  const counts = await pool.query(
    `SELECT
       count(*)::int AS total,
       count(*) FILTER (WHERE status IN ('Picked Up','In Transit','Arrived at Sorting Facility','Customs Clearance','Out for Delivery'))::int AS in_transit,
       count(*) FILTER (WHERE status = 'Delivered')::int AS delivered,
       count(*) FILTER (WHERE status = 'On Hold')::int AS on_hold,
       count(*) FILTER (WHERE status = 'Delivery Exception')::int AS exceptions,
       count(*) FILTER (WHERE status IN ('Shipment Registered','Processing'))::int AS pending,
       count(*) FILTER (WHERE status IN ('Picked Up','In Transit','Out for Delivery'))::int AS moving
     FROM shipments`
  );
  const searchesToday = await pool.query(
    `SELECT count(*)::int AS total, count(*) FILTER (WHERE found)::int AS found FROM tracking_searches WHERE created_at >= current_date`
  );
  const customers = await pool.query('SELECT count(*)::int AS total FROM users');
  const unreadChats = await pool.query(
    `SELECT count(*)::int AS total FROM support_messages WHERE sender='customer' AND read_by_admin = false`
  );
  const recentEvents = await pool.query(
    `SELECT e.status, e.description, e.created_at, s.tracking_number
     FROM shipment_events e JOIN shipments s ON s.id = e.shipment_id
     ORDER BY e.created_at DESC LIMIT 10`
  );
  res.json({
    ...counts.rows[0],
    customers: customers.rows[0].total,
    searchesToday: searchesToday.rows[0],
    unreadChats: unreadChats.rows[0].total,
    recentActivity: recentEvents.rows,
  });
});

// ---- Shipments ----
router.get('/shipments', requireAdmin, async (req: Request, res: Response) => {
  const { status, q, page, from, to } = req.query;
  const settings = await getSettings();
  const limit = Math.min(100, Math.max(10, Number(settings.shipments_per_page) || 20));
  const offset = (Math.max(1, Number(page) || 1) - 1) * limit;
  const params: unknown[] = [];
  const where: string[] = [];

  if (status && STATUSES.includes(status as any)) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  if (from && /^\d{4}-\d{2}-\d{2}$/.test(String(from))) {
    params.push(String(from));
    where.push(`created_at >= $${params.length}::date`);
  }
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(String(to))) {
    params.push(String(to));
    where.push(`created_at < ($${params.length}::date + interval '1 day')`);
  }
  if (q && String(q).trim()) {
    params.push(`%${String(q).trim().toUpperCase()}%`);
    where.push(
      `(UPPER(tracking_number) LIKE $${params.length} OR UPPER(recipient_name) LIKE $${params.length}` +
      ` OR UPPER(sender_name) LIKE $${params.length} OR UPPER(destination) LIKE $${params.length}` +
      ` OR UPPER(COALESCE(recipient_contact,'')) LIKE $${params.length} OR UPPER(COALESCE(sender_contact,'')) LIKE $${params.length})`
    );
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const count = await pool.query(`SELECT count(*)::int AS total FROM shipments ${whereSql}`, params);
  const rows = await pool.query(
    `SELECT * FROM shipments ${whereSql} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );
  res.json({ shipments: rows.rows, total: count.rows[0].total, page: Math.max(1, Number(page) || 1), limit });
});

function trackingCodeRegex(prefix: string): RegExp {
  const p = prefix.replace(/[^A-Za-z0-9]/g, '') || 'UTS';
  return new RegExp(`\\b${p}[A-Z0-9]{4,}\\b`, 'g');
}

async function generateTrackingNumber(prefix: string): Promise<string> {
  const clean = (prefix.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'UTS').slice(0, 10);
  // Retry loop guards against the astronomically rare unique-index collision
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = clean + crypto.randomBytes(5).toString('hex').toUpperCase();
    const clash = await pool.query('SELECT 1 FROM shipments WHERE tracking_number = $1', [candidate]);
    if (!clash.rowCount) return candidate;
  }
  throw new Error('Could not generate a unique tracking number. Please retry.');
}

router.post('/shipments', requireAdmin, async (req: Request, res: Response) => {
  const data = validate(shipmentCreateSchema, req.body);
  if ('error' in data) return res.status(400).json({ error: data.error });

  let userId: number | null = null;
  if (data.user_email) {
    const u = await pool.query('SELECT id FROM users WHERE email = $1', [data.user_email]);
    if (!u.rowCount) return res.status(400).json({ error: 'No customer account with this email' });
    userId = u.rows[0].id;
  }

  const admin = await currentAdmin(req);
  const initialStatus = data.initial_status || 'Shipment Registered';
  const prefixSetting = (await getSettings()).tracking_prefix || 'UTS';
  const trackingNumber = await generateTrackingNumber(prefixSetting);

  let created: any;
  try {
    const result = await pool.query(
      `INSERT INTO shipments
        (tracking_number, user_id, sender_name, sender_contact, recipient_name, recipient_contact,
         origin, destination, service_type, package_description, weight_kg, estimated_delivery,
         status, admin_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [
        trackingNumber, userId, data.sender_name || 'Not specified', data.sender_contact || null,
        data.recipient_name, data.recipient_contact || null, data.origin, data.destination,
        data.service_type, data.package_description || null, data.weight_kg ?? null,
        data.estimated_delivery || null, initialStatus, data.admin_notes || null,
      ]
    );
    created = result;
  } catch (err: any) {
    // Second line of defence against a code collision on the unique index
    if (err?.code === '23505' && /tracking_number/.test(String(err?.constraint || ''))) {
      const retry = await generateTrackingNumber(prefixSetting);
      created = await pool.query(
        `INSERT INTO shipments
          (tracking_number, user_id, sender_name, sender_contact, recipient_name, recipient_contact,
           origin, destination, service_type, package_description, weight_kg, estimated_delivery,
           status, admin_notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
        [
          retry, userId, data.sender_name || 'Not specified', data.sender_contact || null,
          data.recipient_name, data.recipient_contact || null, data.origin, data.destination,
          data.service_type, data.package_description || null, data.weight_kg ?? null,
          data.estimated_delivery || null, initialStatus, data.admin_notes || null,
        ]
      );
    } else {
      throw err;
    }
  }
  const shipment = created.rows[0];
  await pool.query(
    `INSERT INTO shipment_events (shipment_id, status, description) VALUES ($1,$2,$3)`,
    [shipment.id, initialStatus, `Shipment registered from ${shipment.origin} to ${shipment.destination}`]
  );
  await audit(admin!.id, admin!.full_name, 'create', 'shipment', shipment.id, { tracking_number: shipment.tracking_number });
  res.json({ shipment });
});

router.get('/shipments/:id', requireAdmin, async (req: Request, res: Response) => {
  const s = await pool.query('SELECT * FROM shipments WHERE id = $1', [req.params.id]);
  if (!s.rowCount) return res.status(404).json({ error: 'Shipment not found' });
  const events = await pool.query(
    'SELECT * FROM shipment_events WHERE shipment_id = $1 ORDER BY created_at DESC', [req.params.id]
  );
  const charges = await pool.query(
    'SELECT * FROM shipment_charges WHERE shipment_id = $1 ORDER BY created_at ASC', [req.params.id]
  );
  const owner = s.rows[0].user_id
    ? (await pool.query('SELECT id, email, full_name, phone FROM users WHERE id = $1', [s.rows[0].user_id])).rows[0]
    : null;
  res.json({ shipment: s.rows[0], events: events.rows, charges: charges.rows, owner });
});

router.put('/shipments/:id', requireAdmin, async (req: Request, res: Response) => {
  const data = validate(shipmentUpdateSchema, req.body);
  if ('error' in data) return res.status(400).json({ error: data.error });

  const existing = await pool.query('SELECT * FROM shipments WHERE id = $1', [req.params.id]);
  if (!existing.rowCount) return res.status(404).json({ error: 'Shipment not found' });
  const prev = existing.rows[0];

  let userId = prev.user_id;
  if (data.user_email !== undefined) {
    if (data.user_email === '') userId = null;
    else {
      const u = await pool.query('SELECT id FROM users WHERE email = $1', [data.user_email]);
      if (!u.rowCount) return res.status(400).json({ error: 'No customer account with this email' });
      userId = u.rows[0].id;
    }
  }

  const updated = await pool.query(
    `UPDATE shipments SET
       sender_name=$1, sender_contact=$2, recipient_name=$3, recipient_contact=$4,
       origin=$5, destination=$6, service_type=$7, package_description=$8,
       weight_kg=$9, estimated_delivery=$10, user_id=$11, admin_notes=$13, updated_at=now()
     WHERE id=$12 RETURNING *`,
    [
      data.sender_name !== undefined ? (data.sender_name || 'Not specified') : prev.sender_name,
      data.sender_contact !== undefined ? (data.sender_contact || null) : prev.sender_contact,
      data.recipient_name ?? prev.recipient_name,
      data.recipient_contact !== undefined ? (data.recipient_contact || null) : prev.recipient_contact,
      data.origin ?? prev.origin, data.destination ?? prev.destination,
      data.service_type ?? prev.service_type, data.package_description ?? prev.package_description,
      data.weight_kg !== undefined ? data.weight_kg : prev.weight_kg,
      data.estimated_delivery !== undefined ? data.estimated_delivery : prev.estimated_delivery,
      userId, req.params.id,
      data.admin_notes !== undefined ? (data.admin_notes || null) : prev.admin_notes,
    ]
  );

  const admin = await currentAdmin(req);
  await audit(admin!.id, admin!.full_name, 'update', 'shipment', req.params.id, { changed: Object.keys(data) });
  res.json({ shipment: updated.rows[0] });
});

// Status update creates a tracking event
router.post('/shipments/:id/events', requireAdmin, async (req: Request, res: Response) => {
  const data = validate(eventSchema, req.body);
  if ('error' in data) return res.status(400).json({ error: data.error });

  const s = await pool.query('SELECT * FROM shipments WHERE id = $1', [req.params.id]);
  if (!s.rowCount) return res.status(404).json({ error: 'Shipment not found' });

  const ev = await pool.query(
    `INSERT INTO shipment_events (shipment_id, status, description, location) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.params.id, data.status, data.description, data.location || null]
  );
  await pool.query(
    `UPDATE shipments SET status=$1, updated_at=now(),
       hold_reason = CASE WHEN $1 = 'On Hold' THEN hold_reason ELSE NULL END,
       hold_notes  = CASE WHEN $1 = 'On Hold' THEN hold_notes  ELSE NULL END,
       delivered_at = CASE WHEN $1 = 'Delivered' THEN now() ELSE delivered_at END
     WHERE id = $2`,
    [data.status, req.params.id]
  );

  const admin = await currentAdmin(req);
  await audit(admin!.id, admin!.full_name, 'status_update', 'shipment', req.params.id,
    { status: data.status, description: data.description });
  res.json({ event: ev.rows[0] });
});

router.post('/shipments/:id/hold', requireAdmin, async (req: Request, res: Response) => {
  const data = validate(holdSchema, req.body);
  if ('error' in data) return res.status(400).json({ error: data.error });

  const s = await pool.query('SELECT * FROM shipments WHERE id = $1', [req.params.id]);
  if (!s.rowCount) return res.status(404).json({ error: 'Shipment not found' });

  await pool.query(
    `UPDATE shipments SET status='On Hold', hold_reason=$1, hold_notes=$2, updated_at=now() WHERE id=$3`,
    [data.reason, data.notes || null, req.params.id]
  );
  await pool.query(
    `INSERT INTO shipment_events (shipment_id, status, description) VALUES ($1,'On Hold',$2)`,
    [req.params.id, `Shipment placed on hold: ${data.reason}`]
  );
  if (data.charge_description && data.charge_amount !== undefined && data.charge_amount > 0) {
    const admin = await currentAdmin(req);
    await pool.query(
      `INSERT INTO shipment_charges (shipment_id, description, amount, currency, created_by)
       VALUES ($1,$2,$3,'USD',$4)`,
      [req.params.id, data.charge_description, data.charge_amount, admin!.id]
    );
  }

  const admin = await currentAdmin(req);
  await audit(admin!.id, admin!.full_name, 'hold', 'shipment', req.params.id,
    { reason: data.reason, charge: data.charge_amount ?? null });
  res.json({ ok: true });
});

router.post('/shipments/:id/release', requireAdmin, async (req: Request, res: Response) => {
  const data = validate(releaseSchema, req.body);
  if ('error' in data) return res.status(400).json({ error: data.error });

  const s = await pool.query('SELECT * FROM shipments WHERE id = $1', [req.params.id]);
  if (!s.rowCount) return res.status(404).json({ error: 'Shipment not found' });
  if (s.rows[0].status !== 'On Hold') return res.status(400).json({ error: 'Shipment is not on hold' });

  const pending = await pool.query(
    `SELECT count(*)::int AS n FROM shipment_charges WHERE shipment_id=$1 AND status='pending'`,
    [req.params.id]
  );
  if (pending.rows[0].n > 0) {
    return res.status(400).json({ error: 'Cannot release: shipment still has pending charges. Record or waive the payment first.' });
  }

  await pool.query(
    `UPDATE shipments SET status='In Transit', hold_reason=NULL, hold_notes=NULL, updated_at=now() WHERE id=$1`,
    [req.params.id]
  );
  await pool.query(
    `INSERT INTO shipment_events (shipment_id, status, description) VALUES ($1,'In Transit',$2)`,
    [req.params.id, data.notes ? `Shipment released: ${data.notes}` : 'Shipment released from hold and back in transit']
  );
  const admin = await currentAdmin(req);
  await audit(admin!.id, admin!.full_name, 'release', 'shipment', req.params.id, { notes: data.notes || null });
  res.json({ ok: true });
});

// ---- Charges & payments ----
router.post('/shipments/:id/charges', requireAdmin, async (req: Request, res: Response) => {
  const data = validate(chargeSchema, req.body);
  if ('error' in data) return res.status(400).json({ error: data.error });

  const s = await pool.query('SELECT id FROM shipments WHERE id = $1', [req.params.id]);
  if (!s.rowCount) return res.status(404).json({ error: 'Shipment not found' });

  const admin = await currentAdmin(req);
  const charge = await pool.query(
    `INSERT INTO shipment_charges (shipment_id, description, amount, currency, created_by)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.params.id, data.description, data.amount, data.currency, admin!.id]
  );
  await audit(admin!.id, admin!.full_name, 'charge_add', 'shipment', req.params.id,
    { description: data.description, amount: data.amount });
  res.json({ charge: charge.rows[0] });
});

// Record a verified payment (entered by staff after confirming with the payment provider / bank)
router.post('/charges/:chargeId/pay', requireAdmin, async (req: Request, res: Response) => {
  const data = validate(paymentSchema, req.body);
  if ('error' in data) return res.status(400).json({ error: data.error });

  const c = await pool.query('SELECT * FROM shipment_charges WHERE id = $1', [req.params.chargeId]);
  if (!c.rowCount) return res.status(404).json({ error: 'Charge not found' });

  const admin = await currentAdmin(req);
  await pool.query(
    `UPDATE shipment_charges SET status='paid', paid_at=now() WHERE id=$1`,
    [req.params.chargeId]
  );
  await pool.query(
    `INSERT INTO payment_records (charge_id, amount, method, reference, recorded_by)
     VALUES ($1,$2,$3,$4,$5)`,
    [c.rows[0].id, c.rows[0].amount, data.method, data.reference, admin!.id]
  );
  await audit(admin!.id, admin!.full_name, 'payment_record', 'charge', req.params.chargeId,
    { amount: c.rows[0].amount, method: data.method, reference: data.reference });
  res.json({ ok: true });
});

router.post('/charges/:chargeId/waive', requireAdmin, async (req: Request, res: Response) => {
  const c = await pool.query('SELECT * FROM shipment_charges WHERE id = $1', [req.params.chargeId]);
  if (!c.rowCount) return res.status(404).json({ error: 'Charge not found' });
  await pool.query(`UPDATE shipment_charges SET status='waived' WHERE id=$1`, [req.params.chargeId]);
  const admin = await currentAdmin(req);
  await audit(admin!.id, admin!.full_name, 'charge_waive', 'charge', req.params.chargeId, null);
  res.json({ ok: true });
});

// ---- Customers ----
router.get('/customers', requireAdmin, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT u.id, u.email, u.full_name, u.phone, u.created_at,
            count(s.id)::int AS shipment_count
     FROM users u LEFT JOIN shipments s ON s.user_id = u.id
     GROUP BY u.id ORDER BY u.created_at DESC`
  );
  res.json({ customers: result.rows });
});

// ---- Chat inbox ----
router.get('/chat/conversations', requireAdmin, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT c.*,
            (SELECT count(*)::int FROM support_messages m
              WHERE m.conversation_id = c.id AND m.sender='customer' AND m.read_by_admin = false) AS unread,
            (SELECT m.body FROM support_messages m
              WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_message
     FROM support_conversations c
     ${req.query.status && String(req.query.status) !== 'all'
       ? "WHERE c.status = $1"
       : ''}
     ORDER BY c.last_message_at DESC`,
    req.query.status && String(req.query.status) !== 'all' ? [String(req.query.status)] : []
  );
  const online = await pool.query(`SELECT value FROM app_settings WHERE key='chat_online'`);
  res.json({ conversations: result.rows, online: online.rows[0]?.value === 'true' });
});

router.post('/chat/availability', requireAdmin, async (req: Request, res: Response) => {
  const online = !!req.body.online;
  await pool.query(
    `INSERT INTO app_settings (key, value) VALUES ('chat_online', $1)
     ON CONFLICT (key) DO UPDATE SET value = $1`,
    [String(online)]
  );
  const admin = await currentAdmin(req);
  await audit(admin!.id, admin!.full_name, 'chat_availability', 'settings', null, { online });
  res.json({ online });
});

router.get('/chat/conversations/:id/messages', requireAdmin, async (req: Request, res: Response) => {
  const conv = await pool.query('SELECT * FROM support_conversations WHERE id = $1', [req.params.id]);
  if (!conv.rowCount) return res.status(404).json({ error: 'Conversation not found' });
  const msgs = await pool.query(
    'SELECT * FROM support_messages WHERE conversation_id = $1 ORDER BY id ASC', [req.params.id]
  );
  await pool.query(
    `UPDATE support_messages SET read_by_admin = true WHERE conversation_id = $1 AND sender='customer'`,
    [req.params.id]
  );
  res.json({ conversation: conv.rows[0], messages: msgs.rows });
});

router.post('/chat/conversations/:id/messages', requireAdmin, async (req: Request, res: Response) => {
  const data = validate(chatMessageSchema, req.body);
  if ('error' in data) return res.status(400).json({ error: data.error });
  const admin = await currentAdmin(req);
  const msg = await pool.query(
    `INSERT INTO support_messages (conversation_id, sender, sender_name, body)
     VALUES ($1,'agent','Abigail',$2) RETURNING *`,
    [req.params.id, data.body]
  );
  await pool.query('UPDATE support_conversations SET last_message_at = now() WHERE id = $1', [req.params.id]);
  res.json({ message: msg.rows[0] });
});

router.post('/chat/conversations/:id/close', requireAdmin, async (req: Request, res: Response) => {
  await pool.query(`UPDATE support_conversations SET status='closed' WHERE id=$1`, [req.params.id]);
  const admin = await currentAdmin(req);
  await audit(admin!.id, admin!.full_name, 'chat_close', 'conversation', req.params.id, null);
  res.json({ ok: true });
});

router.post('/chat/conversations/:id/reopen', requireAdmin, async (req: Request, res: Response) => {
  await pool.query(`UPDATE support_conversations SET status='open' WHERE id=$1`, [req.params.id]);
  const admin = await currentAdmin(req);
  await audit(admin!.id, admin!.full_name, 'chat_reopen', 'conversation', req.params.id, null);
  res.json({ ok: true });
});

// Shipments referenced in this conversation (by tracking code mentioned in messages)
router.get('/chat/conversations/:id/shipments', requireAdmin, async (req: Request, res: Response) => {
  const msgs = await pool.query(
    'SELECT body FROM support_messages WHERE conversation_id = $1', [req.params.id]
  );
  const prefixSetting = (await getSettings()).tracking_prefix || 'UTS';
  const regex = trackingCodeRegex(prefixSetting);
  const codes = new Set<string>();
  for (const m of msgs.rows) {
    for (const match of String(m.body).toUpperCase().matchAll(regex)) codes.add(match[0]);
  }
  if (!codes.size) return res.json({ shipments: [] });
  const rows = await pool.query(
    `SELECT s.id, s.tracking_number, s.recipient_name, s.destination, s.status, s.origin,
            (SELECT e.status FROM shipment_events e WHERE e.shipment_id = s.id
              ORDER BY e.created_at DESC LIMIT 1) AS latest_event_status,
            (SELECT e.description FROM shipment_events e WHERE e.shipment_id = s.id
              ORDER BY e.created_at DESC LIMIT 1) AS latest_event_description
     FROM shipments s WHERE s.tracking_number = ANY($1)`,
    [Array.from(codes)]
  );
  res.json({ shipments: rows.rows });
});

// ---- Settings ----
router.get('/settings', requireAdmin, async (_req: Request, res: Response) => {
  const values = await getSettings();
  res.json({ settings: SETTINGS, values });
});

router.put('/settings', requireAdmin, async (req: Request, res: Response) => {
  const updates = req.body && typeof req.body === 'object' ? req.body : {};
  const applied: Record<string, string> = {};
  for (const def of SETTINGS) {
    if (!(def.key in updates)) continue;
    const raw = updates[def.key];
    let value: string;
    if (def.type === 'boolean') {
      if (typeof raw !== 'boolean') return res.status(400).json({ error: `${def.key} must be a boolean` });
      value = String(raw);
    } else if (def.type === 'integer') {
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1 || n > 100) return res.status(400).json({ error: `${def.key} must be a whole number between 1 and 100` });
      value = String(n);
    } else {
      if (typeof raw !== 'string') return res.status(400).json({ error: `${def.key} must be text` });
      const trimmed = raw.trim().slice(0, 300);
      if (def.key === 'tracking_prefix' && !/^[A-Za-z0-9]{3,10}$/.test(trimmed)) {
        return res.status(400).json({ error: 'Tracking code prefix must be 3-10 letters or digits' });
      }
      if (def.key === 'default_new_status' && !STATUSES.includes(trimmed as any)) {
        return res.status(400).json({ error: 'Unknown status' });
      }
      value = trimmed;
    }
    await setSetting(def.key, value);
    applied[def.key] = value;
  }
  const admin = await currentAdmin(req);
  await audit(admin!.id, admin!.full_name, 'settings_update', 'settings', null, { keys: Object.keys(applied) });
  const values = await getSettings();
  res.json({ ok: true, saved: applied, values });
});

// ---- Admin account & security ----
router.put('/account', requireAdmin, async (req: Request, res: Response) => {
  const data = validate(accountUpdateSchema, req.body);
  if ('error' in data) return res.status(400).json({ error: data.error });
  const clash = await pool.query('SELECT id FROM admin_users WHERE email = $1 AND id <> $2', [data.email, req.session!.adminId]);
  if (clash.rowCount) return res.status(400).json({ error: 'That email is already used by another administrator' });
  const updated = await pool.query(
    'UPDATE admin_users SET email=$1, full_name=$2 WHERE id=$3 RETURNING id, email, full_name, role',
    [data.email, data.full_name, req.session!.adminId]
  );
  const admin = await currentAdmin(req);
  await audit(admin!.id, admin!.full_name, 'account_update', 'admin', admin!.id, { email: data.email });
  res.json({ admin: updated.rows[0] });
});

router.put('/account/password', requireAdmin, async (req: Request, res: Response) => {
  const data = validate(passwordChangeSchema, req.body);
  if ('error' in data) return res.status(400).json({ error: data.error });
  const result = await pool.query('SELECT * FROM admin_users WHERE id = $1', [req.session!.adminId]);
  const admin = result.rows[0];
  if (!admin || !(await bcrypt.compare(data.current_password, admin.password_hash))) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  const hash = await bcrypt.hash(data.new_password, 12);
  await pool.query('UPDATE admin_users SET password_hash=$1 WHERE id=$2', [hash, admin.id]);
  await audit(admin.id, admin.full_name, 'password_change', 'admin', admin.id, null);
  res.json({ ok: true });
});

// ---- Analytics ----
router.get('/analytics', requireAdmin, async (req: Request, res: Response) => {
  const range = String(req.query.range || 'week');

  const intervals: Record<string, string> = {
    day: "date_trunc('hour', created_at)",
    week: "date_trunc('day', created_at)",
    month: "date_trunc('day', created_at)",
  };
  const since: Record<string, string> = {
    day: "created_at >= now() - interval '24 hours'",
    week: "created_at >= now() - interval '7 days'",
    month: "created_at >= now() - interval '30 days'",
  };
  const bucket = intervals[range] || intervals.week;
  const window = since[range] || since.week;

  const overTime = await pool.query(
    `SELECT ${bucket} AS bucket, count(*)::int AS total,
            count(*) FILTER (WHERE found)::int AS found
     FROM tracking_searches WHERE ${window}
     GROUP BY bucket ORDER BY bucket ASC`
  );
  const totals = await pool.query(
    `SELECT count(*)::int AS total,
            count(*) FILTER (WHERE found)::int AS found,
            count(*) FILTER (WHERE NOT found)::int AS not_found
     FROM tracking_searches WHERE ${window}`
  );
  const topNumbers = await pool.query(
    `SELECT tracking_number, count(*)::int AS searches, max(created_at) AS last_searched
     FROM tracking_searches WHERE ${window}
     GROUP BY tracking_number ORDER BY searches DESC LIMIT 10`
  );
  const daily = await pool.query(
    `SELECT count(*)::int AS total FROM tracking_searches WHERE created_at >= current_date`
  );
  const weekly = await pool.query(
    `SELECT count(*)::int AS total FROM tracking_searches WHERE created_at >= current_date - 7`
  );
  const monthly = await pool.query(
    `SELECT count(*)::int AS total FROM tracking_searches WHERE created_at >= current_date - 30`
  );
  res.json({
    overTime: overTime.rows,
    totals: totals.rows[0],
    topNumbers: topNumbers.rows,
    summaries: { daily: daily.rows[0].total, weekly: weekly.rows[0].total, monthly: monthly.rows[0].total },
  });
});

// ---- Audit log ----
router.get('/audit', requireAdmin, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT a.*, (SELECT count(*) OVER())::int AS total FROM audit_logs a
     ORDER BY created_at DESC LIMIT 100`
  );
  res.json({ logs: result.rows });
});

export default router;
