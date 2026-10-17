import express from 'express';
import helmet from 'helmet';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import cors from 'cors';
import { config } from './config';
import { pool } from './db';
import authRoutes from './routes/auth';
import trackingRoutes from './routes/tracking';
import portalRoutes from './routes/portal';
import chatRoutes from './routes/chat';
import adminRoutes from './routes/admin';

/**
 * Builds the Express app (API + optional static client).
 * Shared by:
 *  - server/src/index.ts  (standalone server: local dev, Render, Replit)
 *  - api/index.ts         (Vercel serverless function)
 * Migrations and admin bootstrap live in index.ts / scripts, not here,
 * because serverless functions should not run startup migrations on every
 * cold boot.
 */
export function createApp(): express.Express {
  const app = express();
  app.set('trust proxy', 1);

  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  const PgSession = connectPgSimple(session);
  app.use(
    session({
      store: new PgSession({ pool, tableName: 'session' }),
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: true,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.isProd,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    })
  );

  app.use('/api/auth', authRoutes);
  app.use('/api/track', trackingRoutes);
  app.use('/api/portal', portalRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/admin', adminRoutes);

  app.use('/api/health', (_req, res) => res.json({ ok: true }));

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
  });

  return app;
}
