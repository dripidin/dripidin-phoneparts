'use server';

// HamzaPhone Admin Overview Actions: Aggregated Analytics & Recent Feed Queries

import { createServerClient } from '@/lib/auth/server';
import { requireStaff } from '@/lib/permissions/guards';
import { PermissionsService } from '@/lib/permissions/permissions-service';

export interface DashboardOverviewStats {
  metrics: {
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalOrders: number;
    pendingOrders: number;
    processingOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    b2cCustomersCount: number;
    b2bCustomersCount: number;
    totalRevenueDzd: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    recipientName: string;
    wilayaName: string;
    totalDzd: number;
    status: string;
    createdAt: string;
  }>;
  recentActivity: Array<{
    id: string;
    actorEmail: string;
    action: string;
    entityType: string;
    createdAt: string;
  }>;
}

export async function getDashboardOverviewStats(): Promise<DashboardOverviewStats> {
  const supabase = await createServerClient();
  await requireStaff(supabase);

  // Execute aggregated count queries in parallel
  const [
    productsRes,
    ordersRes,
    b2cRes,
    b2bRes,
    recentOrdersRes,
    recentActivityRes,
  ] = await Promise.all([
    // Products stats
    (supabase.from('products') as any)
      .select('id, status, stock_quantity, reserved_stock, low_stock_threshold'),
    
    // Orders stats
    (supabase.from('orders') as any)
      .select('id, status, total_dzd'),

    // B2C profiles
    (supabase.from('profiles') as any)
      .select('id', { count: 'exact', head: true })
      .eq('user_type', 'B2C'),

    // B2B businesses
    (supabase.from('businesses') as any)
      .select('id', { count: 'exact', head: true })
      .eq('status', 'APPROVED'),

    // Recent 5 orders
    (supabase.from('orders') as any)
      .select('id, order_number, recipient_name, wilaya_name, total_dzd, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5),

    // Recent 10 activity logs
    (supabase.from('audit_logs') as any)
      .select('id, actor_email, action, entity_type, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const products = (productsRes.data || []) as any[];
  const orders = (ordersRes.data || []) as any[];

  // Calculate product stock metrics
  let totalProducts = products.length;
  let activeProducts = 0;
  let lowStockProducts = 0;
  let outOfStockProducts = 0;

  for (const p of products) {
    if (p.status === 'ACTIVE') activeProducts++;
    const available = p.stock_quantity - p.reserved_stock;
    if (available <= 0) {
      outOfStockProducts++;
    } else if (available <= p.low_stock_threshold) {
      lowStockProducts++;
    }
  }

  // Calculate order metrics and total revenue
  let totalOrders = orders.length;
  let pendingOrders = 0;
  let processingOrders = 0;
  let deliveredOrders = 0;
  let cancelledOrders = 0;
  let totalRevenueDzd = 0;

  for (const o of orders) {
    if (o.status === 'PENDING') pendingOrders++;
    else if (o.status === 'PROCESSING' || o.status === 'CONFIRMED' || o.status === 'READY_FOR_SHIPMENT') processingOrders++;
    else if (o.status === 'DELIVERED') {
      deliveredOrders++;
      totalRevenueDzd += Number(o.total_dzd) || 0;
    } else if (o.status === 'CANCELLED') cancelledOrders++;
  }

  return {
    metrics: {
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalOrders,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      cancelledOrders,
      b2cCustomersCount: b2cRes.count || 0,
      b2bCustomersCount: b2bRes.count || 0,
      totalRevenueDzd,
    },
    recentOrders: (recentOrdersRes.data || []).map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number,
      recipientName: o.recipient_name,
      wilayaName: o.wilaya_name,
      totalDzd: Number(o.total_dzd) || 0,
      status: o.status,
      createdAt: o.created_at,
    })),
    recentActivity: (recentActivityRes.data || []).map((a: any) => ({
      id: a.id,
      actorEmail: a.actor_email,
      action: a.action,
      entityType: a.entity_type,
      createdAt: a.created_at,
    })),
  };
}
