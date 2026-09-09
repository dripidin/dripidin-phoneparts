'use server';

// HamzaPhone Supplier Server Actions: Supplier Catalog, Product Relations, Contact Info
// Hardened with Immediate Server-Side Permission Verification

import { createServerClient } from '@/lib/auth/server';
import { requirePermission, requireStaff } from '@/lib/permissions/guards';

export async function getSuppliersAdmin() {
  const supabase = await createServerClient();
  await requireStaff(supabase);

  try {
    const { data, error } = await (supabase
      .from('suppliers') as any)
      .select(`
        id,
        code,
        name,
        contact_person,
        email,
        phone,
        country,
        currency,
        lead_time_days,
        is_active,
        created_at
      `)
      .order('name', { ascending: true });

    if (error) {
      console.error('[getSuppliersAdmin] Supabase error:', error.message);
      throw new Error(`Impossible de charger les fournisseurs: ${error.message}`);
    }
    return data || [];
  } catch (err: any) {
    console.error('[getSuppliersAdmin] Error:', err.message);
    throw new Error(err.message || 'Erreur lors du chargement des fournisseurs');
  }
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
  const supabase = await createServerClient();
  const authContext = await requirePermission(supabase, 'settings.manage');

  try {
    const { data, error } = await (supabase
      .from('suppliers') as any)
      .insert({
        code: input.code.toUpperCase(),
        name: input.name,
        contact_person: input.contactName || null,
        email: input.email || null,
        phone: input.phone || null,
        country: input.country || 'China',
        currency: input.currency || 'USD',
        lead_time_days: input.leadTimeDays || 14,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[createSupplierAdmin] Supabase insert error:', error.message);
      throw new Error(`Erreur lors de l'enregistrement du fournisseur: ${error.message}`);
    }

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
  } catch (err: any) {
    console.error('[createSupplierAdmin] Error:', err.message);
    throw new Error(err.message || 'Erreur lors de la création du fournisseur');
  }
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
  const supabase = await createServerClient();
  const authContext = await requirePermission(supabase, 'settings.manage');

  try {
    const { data, error } = await (supabase
      .from('suppliers') as any)
      .update({
        name: input.name,
        contact_person: input.contactName,
        email: input.email,
        phone: input.phone,
        country: input.country,
        currency: input.currency,
        lead_time_days: input.leadTimeDays,
        is_active: input.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[updateSupplierAdmin] Supabase update error:', error.message);
      throw new Error(`Erreur lors de la mise à jour du fournisseur: ${error.message}`);
    }

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
  } catch (err: any) {
    console.error('[updateSupplierAdmin] Error:', err.message);
    throw new Error(err.message || 'Erreur lors de la modification du fournisseur');
  }
}

export async function getSupplierProductsAdmin(supplierId: string) {
  const supabase = await createServerClient();
  await requirePermission(supabase, 'pricing.read');

  try {
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

    if (error) {
      console.error('[getSupplierProductsAdmin] Supabase error:', error.message);
      throw new Error(`Erreur lors du chargement des produits fournisseurs: ${error.message}`);
    }
    return data || [];
  } catch (err: any) {
    console.error('[getSupplierProductsAdmin] Error:', err.message);
    throw new Error(err.message || 'Erreur lors du chargement des produits fournisseurs');
  }
}
