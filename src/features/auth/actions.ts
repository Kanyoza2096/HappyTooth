'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  redirectTo: z.string().optional(),
});

export type LoginState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Staff sign-in. Validates credentials against Supabase Auth,
 * then redirects to dashboard (or redirectTo).
 */
export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
    redirectTo: formData.get('redirectTo') || '/',
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: 'Please check your email and password.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { email, password, redirectTo } = parsed.data;
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Generic message — do not leak whether email exists
    return { error: 'Invalid email or password.' };
  }

  // Ensure profile is active
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('id', user.id)
      .single();

    if (profile && profile.is_active === false) {
      await supabase.auth.signOut();
      return { error: 'Your account has been deactivated. Contact an administrator.' };
    }
  }

  const safeRedirect =
    typeof redirectTo === 'string' &&
    redirectTo.startsWith('/') &&
    !redirectTo.startsWith('//')
      ? redirectTo
      : '/';

  redirect(safeRedirect);
}

/**
 * Sign out and return to login.
 */
export async function logoutAction(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect('/login');
}
