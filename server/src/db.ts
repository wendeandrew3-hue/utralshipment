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
