import path from 'path';
import express from 'express';
import helmet from 'helmet';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import cors from 'cors';
import { config } from './config';
import { pool, migrate } from './db';
import authRoutes from './routes/auth';
import trackingRoutes from './routes/tracking';
import portalRoutes from './routes/portal';
import chatRoutes from './routes/chat';
import adminRoutes from './routes/admin';

async function main() {
  await migrate();

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

  app.use('/api/health', (req, res) => res.json({ ok: true }));

  // Serve the built React client
  const dist = path.resolve(__dirname, config.clientDist);
  app.use(express.static(dist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(dist, 'index.html'));
  });

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
  });

  app.listen(config.port, () => {
    console.log(`Utralshipment server running on port ${config.port}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
