'use server';

// HamzaPhone Inventory Server Actions: Physical/Reserved Stock, Adjustments, Ledger Trail
// Hardened with Immediate Server-Side Permission Verification

import { createServerClient } from '@/lib/auth/server';
import { InventoryService } from '@/lib/services/inventory.service';
import { InventoryAdjustmentSchema } from '@/lib/validation/inventory.schema';
import { requirePermission } from '@/lib/permissions/guards';
import { revalidatePath } from 'next/cache';

export async function getInventoryItemsAdmin(params: {
  search?: string;
  lowStockOnly?: boolean;
  page?: number;
  pageSize?: number;
} = {}) {
  const supabase = await createServerClient();
  await requirePermission(supabase, 'inventory.read');

  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const offset = (page - 1) * pageSize;

  let query = (supabase
    .from('products') as any)
    .select(`
      id,
      sku,
      barcode,
      name,
      main_image,
      stock_quantity,
      reserved_stock,
      available_stock,
      low_stock_threshold,
      brands(name),
      categories(name)
    `, { count: 'exact' });

  if (params.search) {
    const term = params.search.trim();
    query = query.or(`sku.ilike.%${term}%,name.ilike.%${term}%,barcode.eq.${term}`);
  }

  if (params.lowStockOnly) {
    query = query.lte('available_stock', 5);
  }

  query = query.order('name', { ascending: true }).range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(`Failed to load inventory items: ${error.message}`);

  return {
    items: data || [],
    totalCount: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function adjustInventoryAdmin(rawInput: unknown) {
  const supabase = await createServerClient();
  const authContext = await requirePermission(supabase, 'inventory.adjust');
  const parsed = InventoryAdjustmentSchema.parse(rawInput);
  const service = new InventoryService(supabase);

  const result = await service.recordTransaction(parsed, authContext.userId);

  // Record audit log
  await (supabase.from('audit_logs') as any).insert({
    actor_email: authContext.email,
    actor_role: authContext.role,
    action: 'INVENTORY_ADJUSTMENT',
    entity_type: 'PRODUCT',
    entity_id: parsed.productId,
    new_values: {
      transactionType: parsed.transactionType,
      quantityChange: parsed.quantityChange,
      notes: parsed.notes,
      warehouseBin: parsed.warehouseBin,
    },
  });

  revalidatePath('/products');
  revalidatePath('/admin');

  return result;
}

export async function getInventoryHistoryAdmin(productId?: string, limit: number = 50, offset: number = 0) {
  const supabase = await createServerClient();
  await requirePermission(supabase, 'inventory.read');
  const service = new InventoryService(supabase);
  return service.getTransactionHistory(productId, limit, offset);
}
