// Optional demo seed. Creates sample shipments so the tracking UI has
// something to show in development. Safe to skip in production; the app
// never invents shipments at runtime.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const demo = [
    {
      number: 'UTSDEMO0001', status: 'In Transit', origin: 'Shenzhen, China', destination: 'Chicago, USA',
      sender: 'Pacific Electronics Ltd', senderContact: 'ops@pacific-demo.example',
      recipient: 'Jordan Lee', recipientContact: 'jordan@example.com',
      desc: 'Consumer electronics, 2 cartons', weight: 24.5, eta: '2026-10-26',
      events: [
        ['Shipment Registered', 'Shipment registered from Shenzhen, China to Chicago, USA'],
        ['Processing', 'Booking confirmed with carrier', 'Shenzhen Gateway'],
        ['Picked Up', 'Package collected from sender', 'Shenzhen'],
        ['In Transit', 'Departed origin facility, en route to destination hub', 'Shenzhen Gateway'],
      ],
    },
    {
      number: 'UTSDEMO0002', status: 'Delivered', origin: 'Rotterdam, Netherlands', destination: 'Nairobi, Kenya',
      sender: 'Tulip Foods B.V.', senderContact: 'logistics@tulip-demo.example',
      recipient: 'Asha Otieno', recipientContact: 'asha@example.com',
      desc: 'Packaged foods, 1 pallet', weight: 310, eta: '2026-10-04',
      events: [
        ['Shipment Registered', 'Shipment registered from Rotterdam to Nairobi'],
        ['Picked Up', 'Pallet collected from sender warehouse', 'Rotterdam'],
        ['In Transit', 'Loaded onto vessel MV Demo Star', 'Port of Rotterdam'],
        ['Customs Clearance', 'Import documentation approved', 'Mombasa Port'],
        ['Out for Delivery', 'With local delivery driver', 'Nairobi'],
        ['Delivered', 'Delivered and signed for by recipient', 'Nairobi'],
      ],
    },
  ];

  for (const d of demo) {
    const existing = await pool.query('SELECT id FROM shipments WHERE tracking_number=$1', [d.number]);
    if (existing.rowCount) {
      console.log(`Skip existing ${d.number}`);
      continue;
    }
    const s = await pool.query(
      `INSERT INTO shipments (tracking_number, sender_name, sender_contact, recipient_name, recipient_contact,
        origin, destination, service_type, package_description, weight_kg, status, estimated_delivery, delivered_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'standard',$8,$9,$10,$11, CASE WHEN $10='Delivered' THEN now() ELSE NULL END)
       RETURNING id`,
      [d.number, d.sender, d.senderContact, d.recipient, d.recipientContact,
       d.origin, d.destination, d.desc, d.weight, d.status, d.eta]
    );
    for (const [status, description, location] of d.events) {
      await pool.query(
        `INSERT INTO shipment_events (shipment_id, status, description, location) VALUES ($1,$2,$3,$4)`,
        [s.rows[0].id, status, description, location ?? null]
      );
    }
    console.log(`Seeded ${d.number}`);
  }

  // demo customer
  const demoEmail = 'demo@example.com';
  const u = await pool.query('SELECT id FROM users WHERE email=$1', [demoEmail]);
  let userId = u.rows[0]?.id;
  if (!userId) {
    const hash = await bcrypt.hash('demopassword', 12);
    const r = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone) VALUES ($1,$2,$3,$4) RETURNING id`,
      [demoEmail, hash, 'Demo Customer', '+254700000000']
    );
    userId = r.rows[0].id;
    console.log('Seeded demo customer (demo@example.com / demopassword)');
  }
  await pool.query('UPDATE shipments SET user_id=$1 WHERE tracking_number IN ($2,$3)', [userId, 'UTSDEMO0001', 'UTSDEMO0002']);

  await pool.end();
  console.log('Demo seed complete.');
}

main();
