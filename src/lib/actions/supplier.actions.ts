'use server';

// HamzaPhone Supplier Server Actions: Supplier Catalog, Product Relations, Contact Info
// Hardened with Immediate Server-Side Permission Verification

import { createServerClient } from '@/lib/auth/server';
import { requirePermission, requireStaff } from '@/lib/permissions/guards';

export async function getSuppliersAdmin() {
  const supabase = createServerClient();
  await requireStaff(supabase);

  const { data, error } = await (supabase
    .from('suppliers') as any)
    .select(`
      id,
      code,
      name,
      contact_name,
      email,
      phone,
      country,
      currency,
      lead_time_days,
      is_active,
      created_at
    `)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to load suppliers: ${error.message}`);
  return data || [];
}

export async function createSupplierAdmin(input: {
  code: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string;
  currency?: string;
  leadTimeDays?: number;
  notes?: string | null;
}) {
  const supabase = createServerClient();
  const authContext = await requirePermission(supabase, 'settings.manage');

  const { data, error } = await (supabase
    .from('suppliers') as any)
    .insert({
      code: input.code.toUpperCase(),
      name: input.name,
      contact_name: input.contactName || null,
      email: input.email || null,
      phone: input.phone || null,
      country: input.country || 'China',
      currency: input.currency || 'USD',
      lead_time_days: input.leadTimeDays || 14,
      notes: input.notes || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create supplier: ${error.message}`);

  // Record audit log
  await (supabase.from('audit_logs') as any).insert({
    actor_email: authContext.email,
    actor_role: authContext.role,
    action: 'CREATE_SUPPLIER',
    entity_type: 'SUPPLIER',
    entity_id: data.id,
    new_values: data,
  });

  return data;
}

export async function updateSupplierAdmin(id: string, input: {
  name?: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string;
  currency?: string;
  leadTimeDays?: number;
  isActive?: boolean;
  notes?: string | null;
}) {
  const supabase = createServerClient();
  const authContext = await requirePermission(supabase, 'settings.manage');

  const { data, error } = await (supabase
    .from('suppliers') as any)
    .update({
      name: input.name,
      contact_name: input.contactName,
      email: input.email,
      phone: input.phone,
      country: input.country,
      currency: input.currency,
      lead_time_days: input.leadTimeDays,
      is_active: input.isActive,
      notes: input.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update supplier: ${error.message}`);

  // Record audit log
  await (supabase.from('audit_logs') as any).insert({
    actor_email: authContext.email,
    actor_role: authContext.role,
    action: 'UPDATE_SUPPLIER',
    entity_type: 'SUPPLIER',
    entity_id: id,
    new_values: data,
  });

  return data;
}

export async function getSupplierProductsAdmin(supplierId: string) {
  const supabase = createServerClient();
  await requirePermission(supabase, 'pricing.read');

  const { data, error } = await (supabase
    .from('supplier_products') as any)
    .select(`
      id,
      supplier_sku,
      supplier_price_usd,
      supplier_price_dzd,
      is_primary,
      lead_time_days,
      last_synced_at,
      products(id, sku, name, b2c_price_dzd, available_stock)
    `)
    .eq('supplier_id', supplierId);

  if (error) throw new Error(`Failed to load supplier products: ${error.message}`);
  return data || [];
}
