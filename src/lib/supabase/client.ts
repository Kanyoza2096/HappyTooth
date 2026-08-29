// ============================================================
// HAPPY TOOTH v2 — Browser-side Supabase Client
// ============================================================
// This client uses ONLY public (NEXT_PUBLIC_*) credentials.
// It is safe for use in Client Components.
// ============================================================

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
