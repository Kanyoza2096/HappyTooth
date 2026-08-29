# HAPPY TOOTH v2 — Dental Practice Management System

A secure, full-stack dental practice management system built with **Next.js (App Router)**, **TypeScript**, **Supabase (PostgreSQL, Auth, RLS)**, and **Tailwind CSS**.

---

## Architecture

```
UI (Server Components + Server Actions)
        │
        ▼
Domain Services  (authz, validation, audit, business rules)
        │
        ▼
Repositories     (data access, RLS-aware Supabase client)
        │
        ▼
Supabase         PostgreSQL + Auth + Row Level Security
```

---

## Features

| Module | Capabilities |
|--------|----------------|
| **Patients** | Demographics, contacts, medical alerts, soft-delete, live balances |
| **Appointments** | Scheduling with practitioner conflict detection, status lifecycle |
| **Visits / Clinical** | Encounters, notes, diagnosis |
| **Procedures** | Catalog with fee schedules |
| **Treatment plans** | Multi-step plans and estimates |
| **Invoicing** | Server-calculated totals, discounts, balance tracking |
| **Payments & receipts** | Idempotent payments, sequential `HT-XXXXXX` receipts |
| **Expenses** | Clinic cost tracking |
| **Reports** | Aggregated metrics + charts |
| **Settings** | Users, clinic config, immutable audit log |
| **Security** | RBAC + RLS, session middleware, security headers, CSP |

---

## Quick start

### Prerequisites

- Node.js **20+**
- A Supabase project (or local Supabase CLI)

### 1. Install

```bash
npm install
```

### 2. Environment

```bash
cp .env.local.example .env.local
```

Fill in:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (browser-safe; RLS applies) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (server/scripts only) |
| `DATABASE_URL` | Postgres URI for migration scripts |

### 3. Database

Apply migrations in order (SQL Editor or script):

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_functions.sql`
4. `supabase/migrations/004_indexes.sql`
5. `supabase/seed.sql`

Or with a connection string:

```bash
npm run db:migrate
# or
npm run db:apply
```

### 4. First admin user

1. Create a user in **Supabase Auth** (email/password).
2. Insert a matching row in `profiles` with `role = 'super_admin'` and `is_active = true`.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm run check` | typecheck + lint |
| `npm run db:migrate` | Push ordered migrations via `DATABASE_URL` |
| `npm run db:apply` | Apply `scripts/combined_migration.sql` |

---

## Production checklist

Before go-live:

- [ ] **Secrets**: No service-role keys or DB passwords in git. Rotate any previously leaked keys.
- [ ] **Env**: Production env vars set on the host (Render/Vercel/etc.). Never commit `.env.local`.
- [ ] **Migrations**: Schema, RLS, functions, indexes, and seed applied on production DB.
- [ ] **Auth**: At least one active `super_admin` profile linked to a Supabase Auth user.
- [ ] **HTTPS**: TLS terminated at the edge; HSTS enabled via app headers.
- [ ] **Middleware**: Root `middleware.ts` is present and refreshes sessions.
- [ ] **Build**: `npm run check && npm run build` succeeds.
- [ ] **Health**: `GET /api/health` returns `{ status: "ok" }` for uptime monitors.
- [ ] **Backup**: Supabase PITR / scheduled backups enabled for the project.
- [ ] **Monitoring**: Attach error tracking (e.g. Sentry) to `error.tsx` / server logs.

### Deploy (Render)

`render.yaml` is included.

1. Connect the repo to Render.
2. Set env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
3. Build: `npm ci --include=dev && npm run build`
4. Start: `npm start`

---

## Security model

- **Authentication**: Supabase Auth (cookie session via `@supabase/ssr`).
- **Route protection**: Next.js middleware redirects unauthenticated users to `/login`.
- **Authorization**: Permission checks in services **and** Postgres RLS.
- **Data access**: Repositories use the user-scoped client (RLS enforced). Service-role client is isolated and never imported in client code.
- **Payments**: Server-side amount math, overpayment guards, idempotency keys with unique constraint.
- **Receipts**: Sequential numbers from DB sequences/triggers (`HT-XXXXXX`).
- **Audit**: Immutable audit log for sensitive mutations.
- **Headers**: HSTS, CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy.

---

## Project layout (high level)

```
src/
  app/                 # App Router pages + API routes
  components/          # UI + layout
  features/*/actions.ts# Server Actions per domain
  lib/                 # Supabase clients, validation, utils
  server/
    auth/              # Session helpers
    authorization/     # RBAC
    repositories/      # Data access
    services/          # Business logic
  types/               # Shared TypeScript types
supabase/migrations/   # Schema, RLS, functions, indexes
scripts/               # Migration helpers (env-driven only)
```

---

## License

Private — all rights reserved.
