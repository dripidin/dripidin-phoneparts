'use server';

// HamzaPhone Notification Server Actions
// Guarded by RBAC permissions with Customer Isolation & Audit Logging

import { createServerClient } from '@/lib/auth/server';
import { requireAuth, requireStaff, requirePermission } from '@/lib/permissions/guards';
import { NotificationService } from '@/lib/notifications/notification.service';
import type {
  NotificationRecord,
  NotificationFilterParams,
  NotificationOverviewMetrics,
  CustomerNotificationPreferences,
  StaffNotificationPreferences,
  DomainEventPayload,
} from '@/types/notifications.types';

/**
 * 1. Get Notifications List (Staff or Customer Context)
 */
export async function getNotificationsListAction(
  params?: NotificationFilterParams,
  customClient?: any
): Promise<NotificationRecord[]> {
  const supabase = customClient || createServerClient();
  const authContext = await requireAuth(supabase);

  // If staff, verify notifications.read permission
  if (authContext.userType === 'STAFF') {
    await requirePermission(supabase, 'notifications.read');
  }

  return NotificationService.getNotificationsList(params, authContext);
}

/**
 * 2. Get Notification Detail
 */
export async function getNotificationDetailAction(
  notificationId: string,
  customClient?: any
): Promise<NotificationRecord> {
  const supabase = customClient || createServerClient();
  const authContext = await requireAuth(supabase);

  if (authContext.userType === 'STAFF') {
    await requirePermission(supabase, 'notifications.read');
  }

  return NotificationService.getNotificationDetail(notificationId, authContext);
}

/**
 * 3. Mark Notification as Read
 */
export async function markNotificationAsReadAction(
  notificationId: string,
  customClient?: any
): Promise<NotificationRecord> {
  const supabase = customClient || createServerClient();
  const authContext = await requireAuth(supabase);

  return NotificationService.markAsRead(notificationId, authContext);
}

/**
 * 4. Mark All Notifications as Read
 */
export async function markAllNotificationsAsReadAction(
  customClient?: any
): Promise<number> {
  const supabase = customClient || createServerClient();
  const authContext = await requireAuth(supabase);

  return NotificationService.markAllAsRead(authContext);
}

/**
 * 5. Delete Notification
 */
export async function deleteNotificationAction(
  notificationId: string,
  customClient?: any
): Promise<boolean> {
  const supabase = customClient || createServerClient();
  const authContext = await requireAuth(supabase);

  return NotificationService.deleteNotification(notificationId, authContext);
}

/**
 * 6. Retry Failed Notification (Staff only)
 */
export async function retryNotificationAction(
  notificationId: string,
  customClient?: any
): Promise<NotificationRecord> {
  const supabase = customClient || createServerClient();
  const authContext = await requirePermission(supabase, 'notifications.manage');

  const updated = await NotificationService.retryNotification(notificationId);

  const fromTable = supabase.from ? supabase.from('audit_logs') : null;
  if (fromTable && typeof fromTable.insert === 'function') {
    await fromTable.insert({
      actor_email: authContext.email,
      actor_role: authContext.role,
      action: 'NOTIFICATION_RETRIED',
      entity_type: 'NOTIFICATION',
      entity_id: notificationId,
      new_values: { status: updated.status, retryCount: updated.retryCount },
    });
  }

  return updated;
}

/**
 * 7. Get Notification Metrics
 */
export async function getNotificationMetricsAction(
  customClient?: any
): Promise<NotificationOverviewMetrics> {
  const supabase = customClient || createServerClient();
  const authContext = await requireAuth(supabase);

  if (authContext.userType === 'STAFF') {
    await requirePermission(supabase, 'notifications.read');
  }

  return NotificationService.getNotificationOverviewMetrics(authContext);
}

/**
 * 8. Customer Preferences Actions
 */
export async function getCustomerNotificationPreferencesAction(
  customClient?: any
): Promise<CustomerNotificationPreferences> {
  const supabase = customClient || createServerClient();
  const authContext = await requireAuth(supabase);

  return NotificationService.getCustomerPreferences(authContext.userId);
}

export async function updateCustomerNotificationPreferencesAction(
  input: Partial<CustomerNotificationPreferences>,
  customClient?: any
): Promise<CustomerNotificationPreferences> {
  const supabase = customClient || createServerClient();
  const authContext = await requireAuth(supabase);

  return NotificationService.updateCustomerPreferences(authContext.userId, input);
}

/**
 * 9. Staff Preferences Actions
 */
export async function getStaffNotificationPreferencesAction(
  customClient?: any
): Promise<StaffNotificationPreferences> {
  const supabase = customClient || createServerClient();
  const authContext = await requireStaff(supabase);

  return NotificationService.getStaffPreferences(authContext.userId);
}

export async function updateStaffNotificationPreferencesAction(
  input: Partial<StaffNotificationPreferences>,
  customClient?: any
): Promise<StaffNotificationPreferences> {
  const supabase = customClient || createServerClient();
  const authContext = await requireStaff(supabase);

  return NotificationService.updateStaffPreferences(authContext.userId, input);
}

/**
 * 10. Dispatch Domain Event Action
 */
export async function dispatchDomainEventAction(
  payload: DomainEventPayload,
  customClient?: any
): Promise<NotificationRecord[]> {
  const supabase = customClient || createServerClient();
  // Can be called internally or by staff
  const auth = await supabase.auth.getUser();
  if (!auth.data?.user) {
    throw new Error('Authentication required');
  }

  return NotificationService.dispatchDomainEvent(payload);
}
