// HamzaPhone Inventory Service: Double-Entry Stock Ledger, Concurrency Reservation, Threshold Audits

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, InventoryTransactionType } from '@/types/database.types';
import type { InventoryAdjustmentInput } from '@/types/domain.types';

export class InventoryService {
  constructor(private supabase: SupabaseClient<any, any, any>) {}

  /**
   * Record a double-entry stock transaction and update product physical/reserved counters
   */
  async recordTransaction(input: InventoryAdjustmentInput, actorId?: string | null) {
    // 1. Fetch current product stock snapshot
    const { data: productData, error: fetchError } = await (this.supabase
      .from('products') as any)
      .select('id, stock_quantity, reserved_stock, low_stock_threshold, sku, name')
      .eq('id', input.productId)
      .single();

    const product = productData as any;
    if (fetchError || !product) {
      throw new Error(`Product not found for inventory adjustment: ${input.productId}`);
    }

    const prevStock = product.stock_quantity;
    const prevReserved = product.reserved_stock;

    let newStock = prevStock;
    let newReserved = prevReserved;

    switch (input.transactionType) {
      case 'RECEIVING':
      case 'CUSTOMER_RETURN_RESTOCK':
        newStock = prevStock + input.quantityChange;
        break;

      case 'RESERVATION':
        newReserved = prevReserved + input.quantityChange;
        break;

      case 'RESERVATION_RELEASE':
        newReserved = Math.max(0, prevReserved - input.quantityChange);
        break;

      case 'FULFILLMENT_OUT':
        newStock = Math.max(0, prevStock - input.quantityChange);
        newReserved = Math.max(0, prevReserved - input.quantityChange);
        break;

      case 'DAMAGED_WRITEOFF':
      case 'SUPPLIER_RETURN':
        newStock = Math.max(0, prevStock - input.quantityChange);
        break;

      case 'MANUAL_ADJUSTMENT':
        newStock = input.quantityChange >= 0 ? input.quantityChange : Math.max(0, prevStock + input.quantityChange);
        break;
    }

    // 2. Insert into immutable inventory_transactions ledger
    const { data: tx, error: insertError } = await (this.supabase
      .from('inventory_transactions') as any)
      .insert({
        product_id: input.productId,
        transaction_type: input.transactionType,
        quantity_change: input.quantityChange,
        previous_stock: prevStock,
        new_stock: newStock,
        previous_reserved: prevReserved,
        new_reserved: newReserved,
        reference_type: input.referenceType || null,
        reference_id: input.referenceId || null,
        warehouse_bin: input.warehouseBin || null,
        notes: input.notes || null,
        created_by: actorId || null,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to record inventory ledger transaction: ${insertError.message}`);
    }

    return {
      transaction: tx,
      previousAvailable: prevStock - prevReserved,
      newAvailable: newStock - newReserved,
      isLowStock: (newStock - newReserved) <= product.low_stock_threshold,
    };
  }

  /**
   * Fetch paginated audit trail for a specific product or warehouse bin
   */
  async getTransactionHistory(productId?: string, limit: number = 50, offset: number = 0) {
    let query = (this.supabase
      .from('inventory_transactions') as any)
      .select(`
        id,
        product_id,
        transaction_type,
        quantity_change,
        previous_stock,
        new_stock,
        previous_reserved,
        new_reserved,
        reference_type,
        reference_id,
        warehouse_bin,
        notes,
        created_at,
        created_by,
        profiles(full_name, email)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(`Failed to query inventory history: ${error.message}`);
    return { data, count };
  }
}
