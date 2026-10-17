import path from 'path';
import express from 'express';
import { config } from './config';
import { pool, migrate, ensureBootstrapAdmin } from './db';
import { createApp } from './app';

async function main() {
  await migrate();
  await ensureBootstrapAdmin();

  const app = createApp();

  // Serve the built React client (standalone mode only)
  const dist = path.resolve(__dirname, config.clientDist);
  app.use(express.static(dist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(dist, 'index.html'));
  });

  app.listen(config.port, () => {
    console.log(`Utralshipment server running on port ${config.port}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
