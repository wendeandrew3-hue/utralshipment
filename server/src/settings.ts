import { pool } from './db';

/**
 * Application settings registry. Every key here is read by a real feature:
 * nothing decorative. Defaults match the live business details exactly, so
 * a fresh install behaves identically to the original hardcoded values.
 */
export interface SettingDef {
  key: string;
  type: 'string' | 'boolean' | 'integer';
  default: string;
  section:
    | 'general' | 'company' | 'tracking' | 'support' | 'notifications' | 'website';
  label: string;
  help?: string;
}

export const SETTINGS: SettingDef[] = [
  // General
  { key: 'shipments_per_page', type: 'integer', default: '20', section: 'general',
    label: 'Shipments per page', help: 'Rows shown on the shipments list (10-100).' },
  { key: 'default_new_status', type: 'string', default: 'Shipment Registered', section: 'general',
    label: 'Initial status for new shipments', help: 'Pre-selected when creating a shipment.' },
  // Company information
  { key: 'company_name', type: 'string', default: 'Utralshipment', section: 'company', label: 'Company name' },
  { key: 'company_tagline', type: 'string', default: 'Global Shipping & Logistics', section: 'company', label: 'Tagline' },
  // Shipment & tracking
  { key: 'tracking_prefix', type: 'string', default: 'UTS', section: 'tracking',
    label: 'Tracking code prefix', help: '3-10 letters/digits. New codes start with this.' },
  { key: 'tracking_show_eta', type: 'boolean', default: 'true', section: 'tracking',
    label: 'Show estimated delivery date on public tracking', help: 'Turn off to keep ETA private.' },
  { key: 'tracking_show_people', type: 'boolean', default: 'true', section: 'tracking',
    label: 'Show sender/recipient names on public tracking', help: 'Contacts are always masked publicly.' },
  // Customer support & live chat
  { key: 'support_agent_name', type: 'string', default: 'Abigail', section: 'support', label: 'Live chat agent name' },
  { key: 'support_phone', type: 'string', default: '+1 201-603-2142', section: 'support', label: 'Support phone' },
  { key: 'support_email', type: 'string', default: 'Utralshipment@gmail.com', section: 'support', label: 'Support email' },
  { key: 'chat_online', type: 'boolean', default: 'false', section: 'support', label: 'Live chat online' },
  // Notifications (drives the admin topbar notification bell)
  { key: 'notify_chat_unread', type: 'boolean', default: 'true', section: 'notifications',
    label: 'Notify about unread chat messages' },
  { key: 'notify_attention_shipments', type: 'boolean', default: 'true', section: 'notifications',
    label: 'Notify about shipments needing attention', help: 'On-hold and exception shipments.' },
  // Website configuration (public pages read these)
  { key: 'site_announcement', type: 'string', default: '', section: 'website',
    label: 'Public site announcement', help: 'Shows a notice bar on the homepage. Leave empty for none.' },
  { key: 'maintenance_mode', type: 'boolean', default: 'false', section: 'website',
    label: 'Maintenance mode', help: 'Public tracking shows a maintenance notice; admin keeps working.' },
];

export async function getSettings(): Promise<Record<string, string>> {
  const result = await pool.query('SELECT key, value FROM app_settings');
  const map: Record<string, string> = {};
  for (const def of SETTINGS) map[def.key] = def.default;
  for (const row of result.rows) {
    if (map[row.key] !== undefined) map[row.key] = row.value;
  }
  return map;
}

export async function getSetting(key: string): Promise<string | null> {
  const def = SETTINGS.find((d) => d.key === key);
  if (!def) return null;
  const result = await pool.query('SELECT value FROM app_settings WHERE key = $1', [key]);
  return result.rows[0]?.value ?? def.default;
}

export async function getBoolean(key: string, fallback: boolean): Promise<boolean> {
  const v = await getSetting(key);
  if (v === null) return fallback;
  return v === 'true';
}

export async function setSetting(key: string, value: string): Promise<void> {
  await pool.query(
    `INSERT INTO app_settings (key, value) VALUES ($1,$2)
     ON CONFLICT (key) DO UPDATE SET value = $2`,
    [key, value]
  );
}
