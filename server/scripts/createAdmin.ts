// Securely creates the first administrator account.
// Run: npm run create-admin -- --email admin@example.com --name "Admin"
// The password is read from the ADMIN_PASSWORD environment variable,
// or prompted for interactively. It is never stored in plain text.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import readline from 'readline';
import { Pool } from 'pg';

const args = process.argv.slice(2);
function arg(name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

async function main() {
  const email = arg('email');
  const name = arg('name');
  if (!email || !name) {
    console.log('Usage: npm run create-admin -- --email admin@example.com --name "Admin Name"');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Copy server/.env.example to server/.env first.');
    process.exit(1);
  }

  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    password = await new Promise<string>((resolve) => {
      rl.question('Choose an admin password (min 8 chars): ', (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }
  if (!password || password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  const result = await pool.query(
    `INSERT INTO admin_users (email, password_hash, full_name, role)
     VALUES ($1,$2,$3,'superadmin')
     ON CONFLICT (email) DO UPDATE SET password_hash = $2, full_name = $3
     RETURNING id, email`,
    [email.toLowerCase(), hash, name]
  );
  console.log(`Administrator ready: ${result.rows[0].email}`);
  await pool.end();
}

main();
