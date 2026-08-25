'use server';

// HamzaPhone Pricing Server Actions: Direct Price Edits, Bulk Adjustment Preview & Batch Application
// Hardened with Immediate Server-Side Permission Verification

import { createServerClient } from '@/lib/auth/server';
import { PricingService } from '@/lib/services/pricing.service';
import { BulkPriceAdjustmentSchema } from '@/lib/validation/pricing.schema';
import { requirePermission } from '@/lib/permissions/guards';
import type { BulkPriceAdjustmentInput } from '@/types/domain.types';
import { revalidatePath } from 'next/cache';

export async function updateProductPriceDirectAdmin(
  productId: string, 
  prices: {
    costPriceDzd: number;
    b2cPriceDzd: number;
    b2cSalePriceDzd?: number | null;
    b2bPriceDzd: number;
  }
) {
  const supabase = createServerClient();
  const authContext = await requirePermission(supabase, 'pricing.update');

  const { data: currentProduct } = await (supabase
    .from('products') as any)
    .select('cost_price_dzd, b2c_price_dzd, b2c_sale_price_dzd, b2b_price_dzd')
    .eq('id', productId)
    .single();

  const { data: updatedProduct, error } = await (supabase
    .from('products') as any)
    .update({
      cost_price_dzd: prices.costPriceDzd,
      b2c_price_dzd: prices.b2cPriceDzd,
      b2c_sale_price_dzd: prices.b2cSalePriceDzd || null,
      b2b_price_dzd: prices.b2bPriceDzd,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update product prices: ${error.message}`);

  // Record price history
  await (supabase.from('price_history') as any).insert({
    product_id: productId,
    price_type: 'B2C_RETAIL',
    old_price_dzd: currentProduct?.b2c_price_dzd || prices.b2cPriceDzd,
    new_price_dzd: prices.b2cPriceDzd,
    change_reason: 'Direct price update in pricing manager',
  });

  // Record audit log
  await (supabase.from('audit_logs') as any).insert({
    actor_email: authContext.email,
    actor_role: authContext.role,
    action: 'DIRECT_PRICE_UPDATE',
    entity_type: 'PRODUCT',
    entity_id: productId,
    old_values: currentProduct,
    new_values: prices,
  });

  revalidatePath('/products');
  revalidatePath('/');
  revalidatePath('/admin');

  return updatedProduct;
}

export async function previewBulkPriceAdjustmentAdmin(rawInput: unknown) {
  const supabase = createServerClient();
  await requirePermission(supabase, 'pricing.bulk_percentage');
  const parsed = BulkPriceAdjustmentSchema.parse(rawInput);

  let query = (supabase
    .from('products') as any)
    .select('id, sku, name, cost_price_dzd, b2c_price_dzd, b2b_price_dzd')
    .eq('status', 'ACTIVE');

  if (parsed.scope === 'SELECTED_SKUS' && parsed.selectedSkus?.length) {
    query = query.in('sku', parsed.selectedSkus);
  } else if (parsed.scope === 'CATEGORY' && parsed.scopeTargetId) {
    query = query.eq('category_id', parsed.scopeTargetId);
  } else if (parsed.scope === 'BRAND' && parsed.scopeTargetId) {
    query = query.eq('brand_id', parsed.scopeTargetId);
  } else if (parsed.scope === 'SUPPLIER' && parsed.scopeTargetId) {
    query = query.eq('supplier_id', parsed.scopeTargetId);
  }

  const { data: products, error } = await query;
  if (error) throw new Error(`Failed to fetch products for pricing preview: ${error.message}`);

  const preview = PricingService.previewBulkAdjustment(
    (products || []).map((p: any) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      cost_price_dzd: Number(p.cost_price_dzd) || 0,
      b2c_price_dzd: Number(p.b2c_price_dzd) || 0,
      b2b_price_dzd: Number(p.b2b_price_dzd) || 0,
    })),
    parsed as BulkPriceAdjustmentInput,
    5.0
  );

  return {
    preview,
    totalProductsAffected: preview.length,
    warningCount: preview.filter(p => p.isBelowCostWarning).length,
  };
}

export async function applyBulkPriceAdjustmentAdmin(rawInput: unknown) {
  const supabase = createServerClient();
  const authContext = await requirePermission(supabase, 'pricing.bulk_percentage');
  const parsed = BulkPriceAdjustmentSchema.parse(rawInput);

  const { preview } = await previewBulkPriceAdjustmentAdmin(parsed);

  if (preview.length === 0) {
    return { appliedCount: 0, message: 'No products matched the bulk adjustment criteria' };
  }

  // Execute batch update
  const batchId = `BULK-PRICE-${Date.now()}`;
  let appliedCount = 0;

  for (const item of preview) {
    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };
    if (parsed.targetField === 'B2C_PRICE' || parsed.targetField === 'BOTH') {
      updatePayload.b2c_price_dzd = item.newB2cPriceDzd;
    }
    if (parsed.targetField === 'B2B_PRICE' || parsed.targetField === 'BOTH') {
      updatePayload.b2b_price_dzd = item.newB2bPriceDzd;
    }

    await (supabase.from('products') as any)
      .update(updatePayload)
      .eq('id', item.productId);

    // Record price history
    await (supabase.from('price_history') as any).insert({
      product_id: item.productId,
      price_type: parsed.targetField === 'B2B_PRICE' ? 'B2B_BASE' : 'B2C_RETAIL',
      old_price_dzd: item.oldB2cPriceDzd,
      new_price_dzd: item.newB2cPriceDzd,
      change_reason: `Bulk % Adjustment (${parsed.percentageChange}%)`,
      bulk_batch_id: batchId,
    });

    appliedCount++;
  }

  // Record audit log
  await (supabase.from('audit_logs') as any).insert({
    actor_email: authContext.email,
    actor_role: authContext.role,
    action: 'BULK_PRICE_ADJUSTMENT',
    entity_type: 'PRICE_HISTORY',
    entity_id: batchId,
    new_values: {
      percentageChange: parsed.percentageChange,
      scope: parsed.scope,
      targetField: parsed.targetField,
      appliedCount,
    },
  });

  revalidatePath('/products');
  revalidatePath('/');
  revalidatePath('/admin');

  return {
    success: true,
    appliedCount,
    batchId,
  };
}
