'use server';

// HamzaPhone Category & Brand Server Actions: CRUD, Slugs, Hierarchy
// Hardened with Immediate Server-Side Permission Verification

import { createServerClient } from '@/lib/auth/server';
import { requirePermission, requireStaff } from '@/lib/permissions/guards';

export async function getCategoriesAdmin() {
  const supabase = createServerClient();
  await requireStaff(supabase);

  const { data, error } = await (supabase
    .from('categories') as any)
    .select(`
      id,
      name,
      slug,
      parent_id,
      image_url,
      display_order,
      is_active,
      created_at
    `)
    .order('display_order', { ascending: true });

  if (error) throw new Error(`Failed to load categories: ${error.message}`);
  return data || [];
}

export async function createCategoryAdmin(input: {
  name: string;
  slug?: string;
  parentId?: string | null;
  imageUrl?: string | null;
  displayOrder?: number;
}) {
  const supabase = createServerClient();
  await requirePermission(supabase, 'categories.manage');

  const slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]/g, '-');

  const { data, error } = await (supabase
    .from('categories') as any)
    .insert({
      name: input.name,
      slug,
      parent_id: input.parentId || null,
      image_url: input.imageUrl || null,
      display_order: input.displayOrder || 0,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create category: ${error.message}`);
  return data;
}

export async function updateCategoryAdmin(id: string, input: {
  name?: string;
  slug?: string;
  parentId?: string | null;
  imageUrl?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}) {
  const supabase = createServerClient();
  await requirePermission(supabase, 'categories.manage');

  const { data, error } = await (supabase
    .from('categories') as any)
    .update({
      name: input.name,
      slug: input.slug,
      parent_id: input.parentId,
      image_url: input.imageUrl,
      display_order: input.displayOrder,
      is_active: input.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update category: ${error.message}`);
  return data;
}

export async function deleteCategoryAdmin(id: string) {
  const supabase = createServerClient();
  await requirePermission(supabase, 'categories.manage');

  const { error } = await (supabase
    .from('categories') as any)
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Failed to delete category: ${error.message}`);
  return { success: true };
}

// --- Brands ---

export async function getBrandsAdmin() {
  const supabase = createServerClient();
  await requireStaff(supabase);

  const { data, error } = await (supabase
    .from('brands') as any)
    .select(`
      id,
      name,
      slug,
      logo_url,
      is_active,
      created_at
    `)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to load brands: ${error.message}`);
  return data || [];
}

export async function createBrandAdmin(input: {
  name: string;
  slug?: string;
  logoUrl?: string | null;
}) {
  const supabase = createServerClient();
  await requirePermission(supabase, 'brands.manage');

  const slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]/g, '-');

  const { data, error } = await (supabase
    .from('brands') as any)
    .insert({
      name: input.name,
      slug,
      logo_url: input.logoUrl || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create brand: ${error.message}`);
  return data;
}

export async function updateBrandAdmin(id: string, input: {
  name?: string;
  slug?: string;
  logoUrl?: string | null;
  isActive?: boolean;
}) {
  const supabase = createServerClient();
  await requirePermission(supabase, 'brands.manage');

  const { data, error } = await (supabase
    .from('brands') as any)
    .update({
      name: input.name,
      slug: input.slug,
      logo_url: input.logoUrl,
      is_active: input.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update brand: ${error.message}`);
  return data;
}

export async function deleteBrandAdmin(id: string) {
  const supabase = createServerClient();
  await requirePermission(supabase, 'brands.manage');

  const { error } = await (supabase
    .from('brands') as any)
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Failed to delete brand: ${error.message}`);
  return { success: true };
}
