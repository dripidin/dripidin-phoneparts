'use server';

// HamzaPhone Order Server Actions: Filtered Orders, Details, State Transitions, Internal Notes
// Hardened with Immediate Server-Side Permission Verification

import { createServerClient } from '@/lib/auth/server';
import { OrderRepository, type OrderFilterParams } from '@/lib/repositories/order.repository';
import { OrderService } from '@/lib/services/order.service';
import { requirePermission } from '@/lib/permissions/guards';
import type { OrderStatus } from '@/types/database.types';

export async function getOrdersAdmin(params: OrderFilterParams = {}) {
  const supabase = await createServerClient();
  await requirePermission(supabase, 'orders.read');
  const repo = new OrderRepository(supabase);
  return repo.findMany(params);
}

export async function getOrderDetailsAdmin(orderId: string) {
  const supabase = await createServerClient();
  await requirePermission(supabase, 'orders.read');
  const repo = new OrderRepository(supabase);
  return repo.findById(orderId);
}

export async function updateOrderStatusAdmin(
  orderId: string, 
  newStatus: OrderStatus, 
  reason?: string
) {
  const supabase = await createServerClient();
  const authContext = await requirePermission(supabase, 'orders.update');
  const service = new OrderService(supabase);

  const updatedOrder = await service.transitionStatus(orderId, newStatus, authContext.userId, reason);

  // Record audit log
  await (supabase.from('audit_logs') as any).insert({
    actor_email: authContext.email,
    actor_role: authContext.role,
    action: 'ORDER_STATUS_TRANSITION',
    entity_type: 'ORDER',
    entity_id: orderId,
    new_values: {
      newStatus,
      reason,
    },
  });

  return updatedOrder;
}

export async function updateOrderNotesAdmin(orderId: string, internalNotes: string) {
  const supabase = await createServerClient();
  await requirePermission(supabase, 'orders.update');

  const { data, error } = await (supabase
    .from('orders') as any)
    .update({
      internal_notes: internalNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update internal notes: ${error.message}`);
  return data;
}
