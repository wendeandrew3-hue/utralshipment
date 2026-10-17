import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { chatLimiter } from '../middleware';
import { chatStartSchema, chatMessageSchema, validate } from '../validation';

const router = Router();

async function getSetting(key: string): Promise<string> {
  const result = await pool.query('SELECT value FROM app_settings WHERE key = $1', [key]);
  return result.rows[0]?.value ?? 'false';
}

function guestToken(req: Request): string | null {
  return (req.session && (req.session as any).chatToken) || null;
}

// Customer-facing chat status
router.get('/status', async (req: Request, res: Response) => {
  const online = (await getSetting('chat_online')) === 'true';
  res.json({ online, agentName: 'Abigail', email: 'Utralshipment@gmail.com', phone: '+1 201-603-2142' });
});

// Start or resume a conversation
router.post('/conversations', async (req: Request, res: Response) => {
  const data = validate(chatStartSchema, req.body);
  if ('error' in data) return res.status(400).json({ error: data.error });

  const userId = req.session?.userId ?? null;
  let token = guestToken(req);

  if (userId) {
    const existing = await pool.query(
      `SELECT * FROM support_conversations WHERE user_id = $1 AND status = 'open' ORDER BY id DESC LIMIT 1`,
      [userId]
    );
    if (existing.rowCount) return res.json({ conversation: existing.rows[0] });
  } else if (token) {
    const existing = await pool.query(
      `SELECT * FROM support_conversations WHERE guest_token = $1 AND status = 'open' ORDER BY id DESC LIMIT 1`,
      [token]
    );
    if (existing.rowCount) return res.json({ conversation: existing.rows[0] });
  }

  if (!token) {
    token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    (req.session as any).chatToken = token;
  }

  const user = userId
    ? (await pool.query('SELECT full_name, email FROM users WHERE id = $1', [userId])).rows[0]
    : null;

  const created = await pool.query(
    `INSERT INTO support_conversations (user_id, guest_token, customer_name, customer_email)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [userId, token, user?.full_name || data.name, user?.email || data.email || null]
  );
  res.json({ conversation: created.rows[0] });
});

router.post('/conversations/:id/messages', chatLimiter, async (req: Request, res: Response) => {
  const data = validate(chatMessageSchema, req.body);
  if ('error' in data) return res.status(400).json({ error: data.error });

  const conv = await pool.query('SELECT * FROM support_conversations WHERE id = $1', [req.params.id]);
  const conversation = conv.rows[0];
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

  const userId = req.session?.userId ?? null;
  const token = guestToken(req);
  const owns = (userId && conversation.user_id === userId) || (!conversation.user_id && conversation.guest_token === token);
  if (!owns) return res.status(403).json({ error: 'Not authorized for this conversation' });

  const msg = await pool.query(
    `INSERT INTO support_messages (conversation_id, sender, sender_name, body)
     VALUES ($1,'customer',$2,$3) RETURNING *`,
    [conversation.id, conversation.customer_name, data.body]
  );
  await pool.query('UPDATE support_conversations SET last_message_at = now() WHERE id = $1', [conversation.id]);
  res.json({ message: msg.rows[0] });
});

// Poll messages. Marks agent messages as read by customer.
router.get('/conversations/:id/messages', async (req: Request, res: Response) => {
  const conv = await pool.query('SELECT * FROM support_conversations WHERE id = $1', [req.params.id]);
  const conversation = conv.rows[0];
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

  const userId = req.session?.userId ?? null;
  const token = guestToken(req);
  const owns = (userId && conversation.user_id === userId) || (!conversation.user_id && conversation.guest_token === token);
  if (!owns) return res.status(403).json({ error: 'Not authorized for this conversation' });

  const after = Number(req.query.after) || 0;
  const msgs = await pool.query(
    `SELECT * FROM support_messages WHERE conversation_id = $1 AND id > $2 ORDER BY id ASC`,
    [conversation.id, after]
  );
  await pool.query(
    `UPDATE support_messages SET read_by_customer = true WHERE conversation_id = $1 AND sender = 'agent'`,
    [conversation.id]
  );
  res.json({ messages: msgs.rows });
});

export default router;
