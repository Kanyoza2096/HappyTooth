// ============================================================
// HAPPY TOOTH v2 — Admin Supabase Client (Service Role)
// ============================================================
// WARNING: This client bypasses RLS.
// NEVER import this file in client-side code.
// NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser.
// Prefer the user-scoped client for normal app data access.
// ============================================================

import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error(
      'createAdminClient() must not be called in the browser. ' +
        'This would expose the service role key.'
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase admin credentials. ' +
        'Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
