// ============================================================
// HAPPY TOOTH v2 — Settings & User Administration Repository
// ============================================================

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type {
  ClinicSetting,
  Profile,
  AuditLogWithActor,
  PaginatedResult,
  PaginationParams,
  UserRole,
} from '@/types';

// ============================================================
// CLINIC SETTINGS
// ============================================================

export async function findClinicSettings(): Promise<ClinicSetting[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('clinic_settings').select('*');
  if (error) throw new Error(`Failed to fetch clinic settings: ${error.message}`);
  return data as ClinicSetting[];
}

export async function updateClinicSetting(key: string, value: string, updatedBy: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('clinic_settings')
    .upsert({ key, value, updated_by: updatedBy }, { onConflict: 'key' });

  if (error) throw new Error(`Failed to update setting ${key}: ${error.message}`);
}

// ============================================================
// USER MANAGEMENT
// ============================================================

export async function findUsers(): Promise<Profile[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch users: ${error.message}`);
  return data as Profile[];
}

export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  if (error) throw new Error(`Failed to update user role: ${error.message}`);
}

export async function updateUserActiveStatus(userId: string, isActive: boolean): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId);

  if (error) throw new Error(`Failed to update user status: ${error.message}`);
}

// ============================================================
// AUDIT LOGS
// ============================================================

export async function findAuditLogs(
  params: PaginationParams & { entityType?: string; actorId?: string }
): Promise<PaginatedResult<AuditLogWithActor>> {
  const supabase = await createServerSupabaseClient();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('audit_logs')
    .select(`
      *,
      actor:profiles!audit_logs_actor_id_fkey (first_name, last_name, email)
    `, { count: 'exact' });

  if (params.entityType) query = query.eq('entity_type', params.entityType);
  if (params.actorId) query = query.eq('actor_id', params.actorId);

  query = query.order('created_at', { ascending: false });
  query = query.range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(`Failed to fetch audit logs: ${error.message}`);

  return {
    data: (data ?? []) as unknown as AuditLogWithActor[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}
