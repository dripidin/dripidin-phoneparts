'use server';

// HamzaPhone Customer & B2B Server Actions: B2C Profiles, B2B Applications, Tax Credential Verification
// Hardened with Immediate Server-Side Permission Verification

import { createServerClient } from '@/lib/auth/server';
import { B2BService, type B2BApprovalInput } from '@/lib/services/b2b.service';
import { requirePermission } from '@/lib/permissions/guards';
import type { B2BStatus } from '@/types/database.types';

export async function getB2CCustomersAdmin(params: {
  search?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const supabase = await createServerClient();
  await requirePermission(supabase, 'customers.read');

  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const offset = (page - 1) * pageSize;

  let query = (supabase
    .from('profiles') as any)
    .select(`
      id,
      email,
      full_name,
      phone,
      phone_secondary,
      avatar_url,
      user_type,
      is_active,
      created_at,
      addresses(wilaya_name, commune_name, address_line, is_default)
    `, { count: 'exact' })
    .eq('user_type', 'B2C');

  if (params.search) {
    const term = params.search.trim();
    query = query.or(`email.ilike.%${term}%,full_name.ilike.%${term}%,phone.ilike.%${term}%`);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(`Failed to load B2C customers: ${error.message}`);

  return {
    customers: data || [],
    totalCount: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function getCustomerDetailsAdmin(customerId: string) {
  const supabase = await createServerClient();
  await requirePermission(supabase, 'customers.read');

  const { data: profile, error } = await (supabase
    .from('profiles') as any)
    .select(`
      *,
      addresses(*),
      orders(id, order_number, total_dzd, status, created_at)
    `)
    .eq('id', customerId)
    .single();

  if (error) return null;
  return profile;
}

// --- B2B Wholesale Accounts ---

export async function getB2BAccountsAdmin(status?: B2BStatus) {
  const supabase = await createServerClient();
  await requirePermission(supabase, 'b2b.read');

  let query = (supabase
    .from('businesses') as any)
    .select(`
      id,
      name,
      trade_name,
      rc_number,
      nif,
      nis,
      wilaya_name,
      commune_name,
      phone,
      email,
      status,
      tier_code,
      credit_limit_dzd,
      payment_terms,
      document_urls,
      created_at,
      verified_at,
      business_members(
        id,
        role,
        is_primary_contact,
        profiles(id, full_name, email, phone)
      )
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load B2B accounts: ${error.message}`);
  return data || [];
}

export async function reviewB2BAccountAdmin(input: B2BApprovalInput) {
  const supabase = await createServerClient();
  const authContext = await requirePermission(supabase, 'b2b.approve');
  const service = new B2BService(supabase);

  const business = await service.reviewApplication({
    ...input,
    reviewerId: authContext.userId,
  });

  // Record audit log
  await (supabase.from('audit_logs') as any).insert({
    actor_email: authContext.email,
    actor_role: authContext.role,
    action: `B2B_APPLICATION_${input.status}`,
    entity_type: 'BUSINESS',
    entity_id: input.businessId,
    new_values: {
      status: input.status,
      tierCode: input.tierCode,
      creditLimitDzd: input.creditLimitDzd,
      paymentTerms: input.paymentTerms,
      notes: input.rejectionReason,
    },
  });

  return business;
}
