import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { config } from './config';

export const pool = new Pool({ connectionString: config.databaseUrl });

export async function migrate(): Promise<void> {
  const dir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    // pg executes multi-statement files in one implicit transaction
    await pool.query(sql);
    console.log(`Migration applied: ${file}`);
  }
}

// CLI entry: npm run migrate
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('Migrations complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err.message);
      process.exit(1);
    });
}

import bcrypt from 'bcryptjs';

/**
 * One-time first-admin bootstrap.
 * Runs only when admin_users is empty AND ADMIN_EMAIL + ADMIN_PASSWORD are set.
 * After the first admin exists, this never touches anything again, so the
 * env vars can be removed from the dashboard once setup is done.
 */
export async function ensureBootstrapAdmin(): Promise<void> {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return;
  const existing = await pool.query('SELECT 1 FROM admin_users LIMIT 1');
  if (existing.rowCount && existing.rowCount > 0) return;
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await pool.query(
    'INSERT INTO admin_users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4)',
    [ADMIN_EMAIL.toLowerCase(), hash, 'Administrator', 'superadmin']
  );
  console.log(`First admin created: ${ADMIN_EMAIL}`);
}
