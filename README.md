# Utralshipment.com — Shipping & Logistics Platform

A complete, custom-coded shipping and logistics platform: marketing website, real
database-backed shipment tracking, customer portal, support chat (agent name:
Abigail), secure admin dashboard, hold/release with documented charges, and
daily tracking analytics.

- **Frontend:** React 18 + TypeScript + Tailwind CSS (Vite)
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL
- **Auth:** Session-based (httpOnly cookies), bcrypt password hashing
- **Company details used throughout:** support phone +1 201-603-2142, email Utralshipment@gmail.com

---

## 1. Quick start (development)

Prerequisites: Node.js 20+, a PostgreSQL database.

```bash
# from the project root
npm run setup                      # installs server + client dependencies

# configure environment
cp server/.env.example server/.env
# edit server/.env and set DATABASE_URL + a long random SESSION_SECRET

# create all tables
npm run migrate --prefix server

# create your first admin (see section 5)
npm run create-admin --prefix server -- --email admin@example.com --name "Site Admin"

# run the app (server on :8080, client dev server on :5173)
npm run dev
```

Open http://localhost:5173 (the dev server proxies /api to :8080).

Optional demo data (development only):

```bash
npm run seed-demo --prefix server
```

## 2. Running on Replit

1. Import this repository as a Replit Node.js repl. PostgreSQL is available via
   the Replit database module (the `.replit` file already declares it).
2. Open the **Secrets** tab and add:
   - `DATABASE_URL` — your Replit Postgres connection string
   - `SESSION_SECRET` — any long random string
3. Press **Run**. The `.replit` run command installs dependencies, migrates the
   database, and starts the app.
4. In the Shell tab, create your first admin:
   `npm run create-admin --prefix server -- --email you@example.com --name "You"`
   (it prompts for the password, or reads `ADMIN_PASSWORD` from Secrets).

## 3. Production build

```bash
npm run build          # builds the React client to client/dist
npm run start --prefix server   # Express serves the API + the built client on one port
```

Set `NODE_ENV=production` so session cookies are marked `secure` (requires HTTPS).

Deploy anywhere that runs Node + PostgreSQL (Render, Railway, Fly.io, a VPS...):
provision PostgreSQL, set `DATABASE_URL` and `SESSION_SECRET`, run the two
commands above, and point your reverse proxy / domain at the server port.

## 4. Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `SESSION_SECRET` | yes in prod | Session signing key. Generate with `openssl rand -hex 32` |
| `PORT` | no (default 8080) | HTTP port |
| `NODE_ENV` | no | Set to `production` when serving over HTTPS |

Never commit `.env` (it is git-ignored). No API keys are required.

## 5. Creating the first administrator securely

```bash
npm run create-admin --prefix server -- --email admin@example.com --name "Site Admin"
```

- With `ADMIN_PASSWORD` unset, it prompts interactively and never echoes the password.
- Passwords are hashed with bcrypt (cost 12) before storage. Nothing is stored in plain text.
- Admin accounts live in a separate `admin_users` table, separate from customer accounts.
- Every admin login attempt is rate-limited; every admin change is written to the audit log.

## 6. What each role can do

**Public visitors:** track any real shipment number (masked recipient contact),
browse services/about/FAQ/contact, chat with support (guest chat works too).

**Registered customers (portal):** see only their own shipments, full unmasked
details of shipments they own, their documented charges and payment status,
their own tracking activity history, update profile, and chat with support.

**Admins (dashboard at /admin):** overview stats, create/edit shipments
(tracking numbers auto-generated as `UTS` + 10 hex chars), add status events
(10 statuses incl. On Hold, Customs Clearance, Delivery Exception), place
holds with reason + notes + optional documented charge, record verified
payments or waive charges, release shipments (blocked while a charge is
pending), manage customers, reply in the support inbox as **Abigail**,
toggle live-chat online/offline, view tracking analytics (per day/week/month,
most-searched numbers, found vs not-found), and read the full audit log.

## 7. Security notes

- bcrypt password hashing; sessions in httpOnly, sameSite=lax cookies
- Role checks on every portal/admin endpoint (server-side)
- Zod validation on all input; parameterized SQL everywhere (no string-built queries)
- Rate limiting on login, tracking, and chat endpoints
- Helmet security headers
- Public tracking masks recipient contact; full data requires ownership
- Tracking analytics record only the number, found flag, and (if signed in) user id — no IP addresses
- Audit log of every administrative action with admin name, action, entity, and details
- Release is refused while documented charges are pending, and payment status is
  only set by staff after verifying the payment — no self-service "mark paid"

## 8. Known implementation choices

- Chat is database-backed with short-interval polling rather than WebSockets:
  simpler to operate on a single server, no sticky sessions needed, and messages
  are real DB rows either way.
- Payments are recorded by staff after verifying the transfer (no payment gateway
  is bundled). If you add a gateway later, verify payment server-side before
  flipping charge status.
- The in-memory rate limiter fits a single instance; for multiple instances,
  switch `express-rate-limit` to a Redis store.

## 9. Project layout

```
server/
  migrations/001_init.sql     # all tables
  src/index.ts                # app entry (API + static client serving)
  src/routes/auth.ts          # customer accounts
  src/routes/tracking.ts      # public tracking + analytics recording
  src/routes/portal.ts        # customer portal data
  src/routes/chat.ts          # customer chat
  src/routes/admin.ts         # admin dashboard API
  src/middleware.ts           # auth guards, rate limiters, audit helper
  src/validation.ts           # zod schemas
  scripts/createAdmin.ts      # secure first-admin creation
  scripts/seedDemo.ts         # optional dev demo data
client/
  src/pages/public/           # Home, Track, Services, About, Contact, FAQ
  src/pages/auth/             # Login, Register
  src/pages/portal/           # customer portal
  src/pages/admin/            # admin dashboard
  src/components/             # Layout, ChatWidget, TrackingTimeline
```

## 10. Operating checklist

- [ ] Register a customer account to test the portal
- [ ] Admin: create a shipment, link it to the customer email
- [ ] Customer: track the number publicly (masked) and in the portal (full)
- [ ] Admin: add status events, watch the timeline update
- [ ] Admin: place a hold with a charge → customer sees reason + charge
- [ ] Admin: record payment → release shipment
- [ ] Support: toggle chat online, reply as Abigail, confirm unread badges clear
- [ ] Analytics: confirm lookups appear in day/week/month views
