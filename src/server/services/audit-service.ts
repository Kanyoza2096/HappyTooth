// ============================================================
// HAPPY TOOTH v2 — Audit Logging Service
// ============================================================
// Records all sensitive mutations for accountability.
// Uses the admin client to bypass RLS for inserting logs.
// ============================================================

import { createAdminClient } from '@/lib/supabase/admin';
import type { AuditAction } from '@/types';

interface AuditLogEntry {
  actorId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Record an audit log entry.
 * Uses service-role client to bypass RLS (audit_logs has no insert policy for users).
 * 
 * This function should NEVER throw — audit logging failure
 * should not prevent the primary operation from completing.
 */
export async function recordAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = createAdminClient();

    await supabase.from('audit_logs').insert({
      actor_id: entry.actorId,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId || null,
      metadata: entry.metadata || null,
      ip_address: entry.ipAddress || null,
    });
  } catch (error) {
    // Log to console but don't throw — audit failure should not
    // break the primary operation
    console.error('[AUDIT] Failed to record audit log:', {
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Create a scoped audit logger for a specific actor.
 * Useful when performing multiple operations in a single request.
 */
export function createAuditLogger(actorId: string, ipAddress?: string) {
  return {
    log: (
      action: AuditAction,
      entityType: string,
      entityId?: string,
      metadata?: Record<string, unknown>
    ) => recordAuditLog({ actorId, action, entityType, entityId, metadata, ipAddress }),
  };
}
