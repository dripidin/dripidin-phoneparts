// HamzaPhone Order Repository: Multi-Criteria Filter, Itemized Aggregations, Tracking Queries

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, OrderStatus, PaymentMethod } from '@/types/database.types';

export interface OrderFilterParams {
  customerId?: string;
  businessId?: string;
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  wilayaCode?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export class OrderRepository {
  constructor(private supabase: SupabaseClient<any, any, any>) {}

  /**
   * Query orders with customer references, line items, and fulfillment history
   */
  async findMany(params: OrderFilterParams = {}) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const offset = (page - 1) * pageSize;

    let query = (this.supabase
      .from('orders') as any)
      .select(`
        id,
        order_number,
        customer_id,
        business_id,
        is_guest,
        customer_type,
        recipient_name,
        recipient_phone,
        wilaya_code,
        wilaya_name,
        commune_name,
        delivery_type,
        subtotal_dzd,
        shipping_cost_dzd,
        total_dzd,
        status,
        payment_method,
        payment_status,
        tracking_number,
        courier_code,
        created_at,
        updated_at,
        order_items(id, sku, product_name, unit_price_dzd, quantity, total_price_dzd),
        businesses(name, rc_number)
      `, { count: 'exact' });

    if (params.customerId) query = query.eq('customer_id', params.customerId);
    if (params.businessId) query = query.eq('business_id', params.businessId);
    if (params.status) query = query.eq('status', params.status);
    if (params.paymentMethod) query = query.eq('payment_method', params.paymentMethod);
    if (params.wilayaCode) query = query.eq('wilaya_code', params.wilayaCode);
    if (params.startDate) query = query.gte('created_at', params.startDate);
    if (params.endDate) query = query.lte('created_at', params.endDate);

    if (params.search) {
      const term = params.search.trim();
      query = query.or(`order_number.ilike.%${term}%,recipient_name.ilike.%${term}%,recipient_phone.ilike.%${term}%,tracking_number.ilike.%${term}%`);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw new Error(`Order query failed: ${error.message}`);

    return {
      orders: data || [],
      totalCount: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * Find single order by ID with line items and status history
   */
  async findById(orderId: string) {
    const { data, error } = await (this.supabase
      .from('orders') as any)
      .select(`
        *,
        order_items(*),
        order_status_history(*),
        deliveries(*),
        payments(*)
      `)
      .eq('id', orderId)
      .single();

    if (error) return null;
    return data;
  }
}
