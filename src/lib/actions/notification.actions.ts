'use server';

// HamzaPhone Notification Server Actions
// Guarded by RBAC permissions with Customer Isolation & Audit Logging

import { createServerClient } from '@/lib/auth/server';
import { requireAuth, requireStaff, requirePermission } from '@/lib/permissions/guards';
import { NotificationService } from '@/lib/notifications/notification.service';
import { TemplateResolver } from '@/lib/notifications/template-engine/template-resolver';
import { QueueProcessor } from '@/lib/notifications/queue-processor';
import type {
  NotificationRecord,
  NotificationFilterParams,
  NotificationOverviewMetrics,
  CustomerNotificationPreferences,
  StaffNotificationPreferences,
  DomainEventPayload,
  NotificationTemplate,
  CreateNotificationTemplateInput,
  TemplateFilterParams,
  DomainEventType,
  NotificationChannelType,
} from '@/types/notifications.types';

/**
 * 1. Get Notifications List (Staff or Customer Context)
 */
export async function getNotificationsListAction(
  params?: NotificationFilterParams,
  customClient?: any
): Promise<NotificationRecord[]> {
  const supabase = customClient || await createServerClient();
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
  const supabase = customClient || await createServerClient();
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
  const supabase = customClient || await createServerClient();
  const authContext = await requireAuth(supabase);

  return NotificationService.markAsRead(notificationId, authContext);
}

/**
 * 4. Mark All Notifications as Read
 */
export async function markAllNotificationsAsReadAction(
  customClient?: any
): Promise<number> {
  const supabase = customClient || await createServerClient();
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
  const supabase = customClient || await createServerClient();
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
  const supabase = customClient || await createServerClient();
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
  const supabase = customClient || await createServerClient();
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
  const supabase = customClient || await createServerClient();
  const authContext = await requireAuth(supabase);

  return NotificationService.getCustomerPreferences(authContext.userId);
}

export async function updateCustomerNotificationPreferencesAction(
  input: Partial<CustomerNotificationPreferences>,
  customClient?: any
): Promise<CustomerNotificationPreferences> {
  const supabase = customClient || await createServerClient();
  const authContext = await requireAuth(supabase);

  return NotificationService.updateCustomerPreferences(authContext.userId, input);
}

/**
 * 9. Staff Preferences Actions
 */
export async function getStaffNotificationPreferencesAction(
  customClient?: any
): Promise<StaffNotificationPreferences> {
  const supabase = customClient || await createServerClient();
  const authContext = await requireStaff(supabase);

  return NotificationService.getStaffPreferences(authContext.userId);
}

export async function updateStaffNotificationPreferencesAction(
  input: Partial<StaffNotificationPreferences>,
  customClient?: any
): Promise<StaffNotificationPreferences> {
  const supabase = customClient || await createServerClient();
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
  const supabase = customClient || await createServerClient();
  // Can be called internally or by staff
  const auth = await supabase.auth.getUser();
  if (!auth.data?.user) {
    throw new Error('Authentication required');
  }

  return NotificationService.dispatchDomainEvent(payload);
}

/**
 * 11. List Notification Templates (Staff: notifications.read)
 */
export async function listNotificationTemplatesAction(
  params?: TemplateFilterParams,
  customClient?: any
): Promise<NotificationTemplate[]> {
  const supabase = customClient || (await createServerClient());
  await requirePermission(supabase, 'notifications.read');

  return TemplateResolver.listTemplates(params, supabase);
}

/**
 * 12. Get Notification Template Detail (Staff: notifications.read)
 */
export async function getNotificationTemplateDetailAction(
  templateId: string,
  customClient?: any
): Promise<NotificationTemplate | null> {
  const supabase = customClient || (await createServerClient());
  await requirePermission(supabase, 'notifications.read');

  return TemplateResolver.getTemplateById(templateId, supabase);
}

/**
 * 13. Save or Update Notification Template (Staff: notifications.manage)
 */
export async function saveNotificationTemplateAction(
  input: CreateNotificationTemplateInput,
  customClient?: any
): Promise<NotificationTemplate> {
  const supabase = customClient || (await createServerClient());
  const authContext = await requirePermission(supabase, 'notifications.manage');

  const saved = await TemplateResolver.saveTemplate(input, authContext.userId, supabase);

  // Record audit entry
  const fromTable = supabase.from ? supabase.from('audit_logs') : null;
  if (fromTable && typeof fromTable.insert === 'function') {
    await fromTable.insert({
      actor_id: authContext.userId,
      actor_email: authContext.email,
      actor_role: authContext.role,
      action: 'NOTIFICATION_TEMPLATE.UPDATE',
      entity_type: 'NOTIFICATION_TEMPLATE',
      entity_id: saved.id,
      new_values: {
        eventType: input.eventType,
        channel: input.channel,
        locale: input.locale || 'fr-DZ',
        version: saved.version,
        isActive: saved.isActive,
      },
    });
  }

  return saved;
}

/**
 * 14. Reset Notification Template to Default (Staff: notifications.manage)
 */
export async function resetNotificationTemplateAction(
  eventType: DomainEventType,
  channel: NotificationChannelType,
  locale: string = 'fr-DZ',
  customClient?: any
): Promise<boolean> {
  const supabase = customClient || (await createServerClient());
  const authContext = await requirePermission(supabase, 'notifications.manage');

  const success = await TemplateResolver.resetToDefault(eventType, channel, locale, authContext.userId, supabase);

  if (success) {
    const fromTable = supabase.from ? supabase.from('audit_logs') : null;
    if (fromTable && typeof fromTable.insert === 'function') {
      await fromTable.insert({
        actor_id: authContext.userId,
        actor_email: authContext.email,
        actor_role: authContext.role,
        action: 'NOTIFICATION_TEMPLATE.RESET',
        entity_type: 'NOTIFICATION_TEMPLATE',
        entity_id: `${eventType}:${channel}:${locale}`,
        new_values: { eventType, channel, locale },
      });
    }
  }

  return success;
}

/**
 * 15. Process Pending Notification Queue (Staff or Internal Cron)
 */
export async function processNotificationQueueAction(
  customClient?: any
): Promise<{ processed: number; succeeded: number; failed: number }> {
  const supabase = customClient || (await createServerClient());
  await requirePermission(supabase, 'notifications.manage');

  return QueueProcessor.processPendingNotifications(undefined, supabase);
}

