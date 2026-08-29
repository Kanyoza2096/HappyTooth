# Security notes — Happy Tooth v2

## Credentials

- Never commit `.env`, `.env.local`, or files containing real Supabase keys or database passwords.
- `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security. Keep it server-side only.
- If a service-role key was ever committed or shared, **rotate it immediately** in the Supabase dashboard and update all deployment environments.

## Auth & access control

- Middleware refreshes sessions and redirects unauthenticated users to `/login`.
- Services call `requireAuth()` and permission/role assertions before mutations.
- Postgres RLS is enabled on domain tables; repositories use the user-scoped Supabase client.
- Deactivated profiles (`is_active = false`) are blocked at login and at `requireAuth()`.

## Payments

- Amounts and discounts are calculated on the server.
- Overpayment is rejected.
- Idempotency keys are unique; retries return the existing payment.

## Reporting issues

Treat clinical and financial data as sensitive. Restrict repository access and production DB credentials to authorized operators only.
