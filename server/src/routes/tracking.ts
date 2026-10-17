import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { trackLimiter } from '../middleware';
import { trackSchema, validate } from '../validation';

const router = Router();

// Mask a contact string so personal information stays protected in public lookups
function maskContact(contact: string): string {
  if (contact.includes('@')) {
    const [name, domain] = contact.split('@');
    const shown = name.slice(0, 1) + '***';
    return `${shown}@${domain}`;
  }
  const digits = contact.replace(/\D/g, '');
  if (digits.length >= 4) {
    const visible = digits.slice(-2);
    const tail = contact.endsWith(visible) ? visible : contact.slice(-2);
    return '*'.repeat(Math.max(contact.length - 2, 2)) + tail;
  }
  return '***';
}

export async function lookupShipment(trackingNumber: string) {
  const result = await pool.query('SELECT * FROM shipments WHERE tracking_number = $1', [trackingNumber]);
  return result.rows[0] || null;
}

export async function publicView(shipment: any, includeFullContact: boolean) {
  const events = await pool.query(
    `SELECT status, description, location, created_at FROM shipment_events
     WHERE shipment_id = $1 ORDER BY created_at ASC`,
    [shipment.id]
  );
  const charges = await pool.query(
    `SELECT description, amount, currency, status, created_at FROM shipment_charges
     WHERE shipment_id = $1 ORDER BY created_at ASC`,
    [shipment.id]
  );
  return {
    tracking_number: shipment.tracking_number,
    status: shipment.status,
    origin: shipment.origin,
    destination: shipment.destination,
    service_type: shipment.service_type,
    package_description: shipment.package_description,
    weight_kg: shipment.weight_kg,
    estimated_delivery: shipment.estimated_delivery,
    delivered_at: shipment.delivered_at,
    hold_reason: shipment.status === 'On Hold' ? shipment.hold_reason : null,
    hold_notes: shipment.status === 'On Hold' ? shipment.hold_notes : null,
    sender_name: shipment.sender_name,
    sender_contact: includeFullContact ? shipment.sender_contact : maskContact(shipment.sender_contact),
    recipient_name: shipment.recipient_name,
    recipient_contact: includeFullContact ? shipment.recipient_contact : maskContact(shipment.recipient_contact),
    created_at: shipment.created_at,
    events: events.rows,
    charges: charges.rows,
  };
}

router.post('/', trackLimiter, async (req: Request, res: Response) => {
  const data = validate(trackSchema, req.body);
  if ('error' in data) return res.status(400).json({ error: data.error });

  const trackingNumber = data.trackingNumber.toUpperCase();
  const shipment = await lookupShipment(trackingNumber);

  // Server-side analytics event: one row per lookup, no IP or raw user data stored
  await pool.query(
    'INSERT INTO tracking_searches (tracking_number, found, user_id) VALUES ($1,$2,$3)',
    [trackingNumber, !!shipment, req.session?.userId ?? null]
  );

  if (!shipment) {
    return res.status(404).json({ error: 'No shipment found for this tracking number. Please check the number and try again.' });
  }
  res.json({ shipment: await publicView(shipment, false) });
});

export default router;
