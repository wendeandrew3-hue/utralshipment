-- 002: Admin dashboard upgrade.
-- Adds internal admin notes to shipments and relaxes NOT NULL constraints so
-- guest shipments (no customer email/phone) can be created. All changes are
-- additive or constraint-relaxing: no data is touched.

-- Internal notes visible only to administrators (never exposed on public tracking)
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Sender/recipient contact details are optional for guest shipments
ALTER TABLE shipments ALTER COLUMN sender_contact DROP NOT NULL;
ALTER TABLE shipments ALTER COLUMN recipient_contact DROP NOT NULL;
ALTER TABLE shipments ALTER COLUMN sender_name DROP NOT NULL;

-- Optional customer phone voluntarily shared in live chat
ALTER TABLE support_conversations ADD COLUMN IF NOT EXISTS customer_phone TEXT;
