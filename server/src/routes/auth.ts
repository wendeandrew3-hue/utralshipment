import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db';
import { requireUser } from '../middleware';
import {
  registerSchema, loginSchema, profileSchema, validate,
} from '../validation';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const data = validate(registerSchema, req.body);
  if ('error' in data) return res.status(400).json({ error: data.error });

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [data.email]);
  if (existing.rowCount) return res.status(409).json({ error: 'An account with this email already exists' });

  const hash = await bcrypt.hash(data.password, 12);
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, phone)
     VALUES ($1,$2,$3,$4) RETURNING id, email, full_name, phone`,
    [data.email, hash, data.full_name, data.phone || null]
  );
  const user = result.rows[0];
  req.session.userId = user.id;
  res.json({ user: { id: user.id, email: user.email, full_name: user.full_name, phone: user.phone } });
});

router.post('/login', async (req: Request, res: Response) => {
  const data = validate(loginSchema, req.body);
  if ('error' in data) return res.status(400).json({ error: data.error });

  const result = await pool.query('SELECT * FROM users WHERE email = $1', [data.email]);
  const user = result.rows[0];
  const ok = user && (await bcrypt.compare(data.password, user.password_hash));
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

  req.session.userId = user.id;
  res.json({ user: { id: user.id, email: user.email, full_name: user.full_name, phone: user.phone } });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', requireUser, async (req: Request, res: Response) => {
  const result = await pool.query(
    'SELECT id, email, full_name, phone, created_at FROM users WHERE id = $1',
    [req.userId]
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Account not found' });
  res.json({ user: result.rows[0] });
});

router.put('/profile', requireUser, async (req: Request, res: Response) => {
  const data = validate(profileSchema, req.body);
  if ('error' in data) return res.status(400).json({ error: data.error });
  const result = await pool.query(
    'UPDATE users SET full_name=$1, phone=$2 WHERE id=$3 RETURNING id, email, full_name, phone',
    [data.full_name, data.phone || null, req.userId]
  );
  res.json({ user: result.rows[0] });
});

export default router;
