-- Utralshipment initial schema
CREATE TABLE IF NOT EXISTS admin_users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  phone         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shipments (
  id                  SERIAL PRIMARY KEY,
  tracking_number     TEXT NOT NULL UNIQUE,
  user_id             INTEGER REFERENCES users(id) ON DELETE SET NULL,
  sender_name         TEXT NOT NULL,
  sender_contact      TEXT NOT NULL,
  recipient_name      TEXT NOT NULL,
  recipient_contact   TEXT NOT NULL,
  origin              TEXT NOT NULL,
  destination         TEXT NOT NULL,
  service_type        TEXT NOT NULL DEFAULT 'standard',
  package_description TEXT,
  weight_kg           NUMERIC(10,2),
  status              TEXT NOT NULL DEFAULT 'Shipment Registered'
                    CHECK (status IN (
                      'Shipment Registered','Processing','Picked Up','In Transit',
                      'Arrived at Sorting Facility','Customs Clearance','On Hold',
                      'Out for Delivery','Delivered','Delivery Exception'
                    )),
  hold_reason         TEXT,
  hold_notes          TEXT,
  estimated_delivery  DATE,
  delivered_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipments_user ON shipments(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);

CREATE TABLE IF NOT EXISTS shipment_events (
  id           SERIAL PRIMARY KEY,
  shipment_id  INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  status       TEXT NOT NULL,
  description  TEXT NOT NULL,
  location     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_shipment ON shipment_events(shipment_id);

CREATE TABLE IF NOT EXISTS shipment_charges (
  id           SERIAL PRIMARY KEY,
  shipment_id  INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  description  TEXT NOT NULL,
  amount       NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency     TEXT NOT NULL DEFAULT 'USD',
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','waived')),
  created_by   INTEGER REFERENCES admin_users(id),
  paid_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_charges_shipment ON shipment_charges(shipment_id);

CREATE TABLE IF NOT EXISTS payment_records (
  id           SERIAL PRIMARY KEY,
  charge_id    INTEGER NOT NULL REFERENCES shipment_charges(id) ON DELETE CASCADE,
  amount       NUMERIC(12,2) NOT NULL,
  method       TEXT NOT NULL,
  reference    TEXT NOT NULL,
  recorded_by  INTEGER REFERENCES admin_users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_conversations (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  guest_token     TEXT,
  customer_name   TEXT NOT NULL,
  customer_email  TEXT,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_conv_user ON support_conversations(user_id);

CREATE TABLE IF NOT EXISTS support_messages (
  id               SERIAL PRIMARY KEY,
  conversation_id  INTEGER NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  sender           TEXT NOT NULL CHECK (sender IN ('customer','agent')),
  sender_name      TEXT NOT NULL,
  body             TEXT NOT NULL,
  read_by_admin    BOOLEAN NOT NULL DEFAULT false,
  read_by_customer BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_msg_conv ON support_messages(conversation_id);

CREATE TABLE IF NOT EXISTS tracking_searches (
  id              SERIAL PRIMARY KEY,
  tracking_number TEXT NOT NULL,
  found           BOOLEAN NOT NULL,
  user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_searches_created ON tracking_searches(created_at);

CREATE TABLE IF NOT EXISTS audit_logs (
  id         SERIAL PRIMARY KEY,
  admin_id   INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  admin_name TEXT,
  action     TEXT NOT NULL,
  entity     TEXT NOT NULL,
  entity_id  TEXT,
  details    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO app_settings (key, value) VALUES ('chat_online', 'false')
  ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS "session" (
  "sid"    varchar NOT NULL COLLATE "default",
  "sess"   json NOT NULL,
  "expire" timestamp(6) NOT NULL
) WITH (OIDS=FALSE);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'session_pkey'
  ) THEN
    ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
