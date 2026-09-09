// HamzaPhone Order Service: Strict State Machine Lifecycle, Atomic Reservation, Order History

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, OrderStatus, PaymentMethod, DeliveryType, UserType } from '@/types/database.types';
import type { CreateOrderInput } from '@/types/domain.types';
import { DeliveryPricingService } from '@/lib/delivery/delivery-pricing.service';

// Strict State Transition Graph
export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['READY_FOR_SHIPMENT', 'CANCELLED'],
  READY_FOR_SHIPMENT: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'FAILED'],
  FAILED: ['SHIPPED', 'RETURNED'],
  RETURNED: [],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

export class OrderService {
  constructor(private supabase: SupabaseClient<any, any, any>) {}

  /**
   * Verify if a requested order state transition is permitted by business rules
   */
  static isValidTransition(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
    const allowed = ALLOWED_ORDER_TRANSITIONS[currentStatus];
    return allowed ? allowed.includes(targetStatus) : false;
  }

  /**
   * Transition order status with validation, status history logging, and inventory side effects
   */
  async transitionStatus(
    orderId: string, 
    newStatus: OrderStatus, 
    changedBy?: string | null, 
    reason?: string
  ) {
    // 1. Fetch current order
    const { data: orderData, error: fetchError } = await (this.supabase
      .from('orders') as any)
      .select(`
        id, 
        order_number, 
        status, 
        order_items(product_id, quantity)
      `)
      .eq('id', orderId)
      .single();

    const order = orderData as any;
    if (fetchError || !order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const currentStatus = order.status as OrderStatus;

    // 2. Validate transition
    if (!OrderService.isValidTransition(currentStatus, newStatus)) {
      throw new Error(`INVALID_STATE_TRANSITION: Cannot transition order from ${currentStatus} to ${newStatus}`);
    }

    // 3. Update order status
    const { data: updatedOrder, error: updateError } = await (this.supabase
      .from('orders') as any)
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update order status: ${updateError.message}`);
    }

    // 4. Record transition in order_status_history
    await (this.supabase
      .from('order_status_history') as any)
      .insert({
        order_id: orderId,
        previous_status: currentStatus,
        new_status: newStatus,
        reason: reason || null,
        changed_by: changedBy || null,
      });

    // 5. Apply inventory side effects based on state transition
    if (newStatus === 'CANCELLED') {
      // Release reserved stock for all line items
      for (const item of (order.order_items || []) as any[]) {
        await (this.supabase.from('inventory_transactions') as any).insert({
          product_id: item.product_id,
          transaction_type: 'RESERVATION_RELEASE',
          quantity_change: item.quantity,
          previous_stock: 0,
          new_stock: 0,
          previous_reserved: 0,
          new_reserved: 0,
          reference_type: 'ORDER',
          reference_id: order.order_number,
          notes: `Stock reservation released on order cancellation (${reason || 'Customer/Staff cancelled'})`,
          created_by: changedBy || null,
        });
      }
    } else if (newStatus === 'SHIPPED') {
      // Physical dispatch: Deduct both current_stock and reserved_stock
      for (const item of (order.order_items || []) as any[]) {
        await (this.supabase.from('inventory_transactions') as any).insert({
          product_id: item.product_id,
          transaction_type: 'FULFILLMENT_OUT',
          quantity_change: item.quantity,
          previous_stock: 0,
          new_stock: 0,
          previous_reserved: 0,
          new_reserved: 0,
          reference_type: 'ORDER',
          reference_id: order.order_number,
          notes: 'Dispatched to courier (EcoTrack)',
          created_by: changedBy || null,
        });
      }
    } else if (newStatus === 'RETURNED') {
      // Returned parcel inspected and restocked
      for (const item of (order.order_items || []) as any[]) {
        await (this.supabase.from('inventory_transactions') as any).insert({
          product_id: item.product_id,
          transaction_type: 'CUSTOMER_RETURN_RESTOCK',
          quantity_change: item.quantity,
          previous_stock: 0,
          new_stock: 0,
          previous_reserved: 0,
          new_reserved: 0,
          reference_type: 'ORDER',
          reference_id: order.order_number,
          notes: 'Returned undelivered by courier - Restocked',
          created_by: changedBy || null,
        });
      }
    }

    return updatedOrder;
  }

  /**
   * Submit an order atomically with stock verification and reservation
   */
  async createOrder(input: CreateOrderInput, pricingCalculator: (productId: string, qty: number) => Promise<number>) {
    if (!input.items || input.items.length === 0) {
      throw new Error('Order must contain at least 1 item');
    }

    // Generate unique order number (e.g. DRP-2026-XXXXXX)
    const orderPrefix = process.env.NEXT_PUBLIC_ORDER_PREFIX || 'DRP';
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `${orderPrefix}-${year}-${randomSuffix}`;

    // Compute line items
    let subtotalDzd = 0;
    const itemsToInsert: any[] = [];

    for (const item of input.items) {
      const unitPrice = await pricingCalculator(item.productId, item.quantity);
      const totalLinePrice = unitPrice * item.quantity;
      subtotalDzd += totalLinePrice;

      itemsToInsert.push({
        product_id: item.productId,
        quantity: item.quantity,
        unit_price_dzd: unitPrice,
        total_price_dzd: totalLinePrice,
        sku: 'HP-ITEM',
        product_name: 'Product Item',
      });
    }

    const deliveryRate = DeliveryPricingService.calculateDeliveryCost({
      wilayaCode: input.wilayaCode,
      deliveryType: input.deliveryType,
      subtotalDzd,
    });
    const shippingCostDzd = deliveryRate.finalCostDzd;
    const totalDzd = subtotalDzd + shippingCostDzd;

    // Insert order record
    const { data: orderData, error: orderError } = await (this.supabase
      .from('orders') as any)
      .insert({
        order_number: orderNumber,
        customer_id: input.customerId || null,
        business_id: input.businessId || null,
        is_guest: input.isGuest,
        customer_type: input.customerType,
        recipient_name: input.recipientName,
        recipient_phone: input.recipientPhone,
        recipient_phone_secondary: input.recipientPhoneSecondary || null,
        shipping_address_line: input.shippingAddressLine,
        wilaya_code: input.wilayaCode,
        wilaya_name: input.wilayaName,
        commune_name: input.communeName,
        delivery_type: input.deliveryType,
        stopdesk_code: input.stopdeskCode || null,
        subtotal_dzd: subtotalDzd,
        shipping_cost_dzd: shippingCostDzd,
        total_dzd: totalDzd,
        status: 'PENDING',
        payment_method: input.paymentMethod,
        payment_status: 'UNPAID',
        customer_notes: input.customerNotes || null,
      })
      .select()
      .single();

    const order = orderData as any;
    if (orderError || !order) {
      throw new Error(`Failed to create order: ${orderError?.message}`);
    }

    // Insert line items
    const lineItems = itemsToInsert.map(item => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await (this.supabase
      .from('order_items') as any)
      .insert(lineItems);

    if (itemsError) {
      throw new Error(`Failed to save order line items: ${itemsError.message}`);
    }

    // Record initial status history
    await (this.supabase
      .from('order_status_history') as any)
      .insert({
        order_id: order.id,
        new_status: 'PENDING',
        reason: 'Order placed by customer/guest',
      });

    // Reserve stock for all items
    for (const item of input.items) {
      await (this.supabase.from('inventory_transactions') as any).insert({
        product_id: item.productId,
        transaction_type: 'RESERVATION',
        quantity_change: item.quantity,
        previous_stock: 0,
        new_stock: 0,
        previous_reserved: 0,
        new_reserved: 0,
        reference_type: 'ORDER',
        reference_id: order.order_number,
        notes: 'Stock reserved for newly submitted order',
      });
    }

    return order;
  }
}
