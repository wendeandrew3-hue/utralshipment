import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { pool } from './db';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: number;
    adminId?: number;
  }
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

export const trackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many tracking requests. Please slow down.' },
});

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  message: { error: 'Too many messages. Please slow down.' },
});

function notAuthenticated(res: Response) {
  res.status(401).json({ error: 'Not authenticated' });
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId) {
    req.userId = req.session.userId as number;
    return next();
  }
  notAuthenticated(res);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.adminId) {
    req.adminId = req.session.adminId as number;
    return next();
  }
  notAuthenticated(res);
}

export function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export async function audit(
  adminId: number | undefined,
  adminName: string,
  action: string,
  entity: string,
  entityId: string | number | null,
  details?: unknown
) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (admin_id, admin_name, action, entity, entity_id, details)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [adminId, adminName, action, entity, entityId == null ? null : String(entityId), details ? JSON.stringify(details) : null]
    );
  } catch (e) {
    console.error('audit log failed', e);
  }
}
