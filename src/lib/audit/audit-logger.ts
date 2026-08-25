// Audit Logging Service for HamzaPhone: Capturing Actor, Action, Entity, Diffs & Timestamps

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/database.types';

export interface AuditEventPayload {
  actorId?: string | null;
  actorEmail: string;
  actorRole: string;
  action: string; // e.g. 'PRODUCT.CREATE', 'PRICING.BULK_ADJUST', 'ORDER.STATE_CHANGE'
  entityType: string; // e.g. 'PRODUCT', 'PRICE', 'ORDER', 'BUSINESS', 'ROLE'
  entityId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditLogger {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Insert an immutable audit record
   */
  async log(payload: AuditEventPayload): Promise<void> {
    try {
      const insertData: Database['public']['Tables']['audit_logs']['Insert'] = {
        actor_id: payload.actorId || null,
        actor_email: payload.actorEmail,
        actor_role: payload.actorRole,
        action: payload.action,
        entity_type: payload.entityType,
        entity_id: payload.entityId || null,
        old_values: (payload.oldValues as Json) || null,
        new_values: (payload.newValues as Json) || null,
        ip_address: payload.ipAddress || null,
        user_agent: payload.userAgent || null,
      };

      const { error } = await this.supabase
        .from('audit_logs')
        .insert(insertData as any);

      if (error) {
        console.error('[AuditLogger] Failed to write audit record:', error.message);
      }
    } catch (err) {
      console.error('[AuditLogger] Unexpected error during audit write:', err);
    }
  }
}
