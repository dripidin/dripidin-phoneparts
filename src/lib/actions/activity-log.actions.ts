'use server';

// HamzaPhone Activity Log Server Actions: Immutable Audit Trail Queries
// Hardened with Immediate Server-Side Permission Verification

import { createServerClient } from '@/lib/auth/server';
import { requirePermission } from '@/lib/permissions/guards';

export async function getActivityLogsAdmin(params: {
  entityType?: string;
  action?: string;
  actorEmail?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const supabase = createServerClient();
  await requirePermission(supabase, 'audit.read');

  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 25));
  const offset = (page - 1) * pageSize;

  let query = (supabase
    .from('audit_logs') as any)
    .select('*', { count: 'exact' });

  if (params.entityType) query = query.eq('entity_type', params.entityType);
  if (params.action) query = query.eq('action', params.action);
  if (params.actorEmail) query = query.ilike('actor_email', `%${params.actorEmail}%`);

  query = query.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(`Failed to load activity logs: ${error.message}`);

  return {
    logs: data || [],
    totalCount: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}
