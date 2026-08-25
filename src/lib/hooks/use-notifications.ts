// TanStack Query Hooks for Notifications System

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotificationsListAction,
  getNotificationDetailAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  deleteNotificationAction,
  retryNotificationAction,
  getNotificationMetricsAction,
  getCustomerNotificationPreferencesAction,
  updateCustomerNotificationPreferencesAction,
  getStaffNotificationPreferencesAction,
  updateStaffNotificationPreferencesAction,
} from '@/lib/actions/notification.actions';
import type {
  NotificationFilterParams,
  CustomerNotificationPreferences,
  StaffNotificationPreferences,
} from '@/types/notifications.types';

export const NOTIFICATION_QUERY_KEYS = {
  list: (params?: NotificationFilterParams) => ['notifications_list', params] as const,
  detail: (id: string) => ['notification_detail', id] as const,
  metrics: ['notification_metrics'] as const,
  customerPrefs: ['customer_notification_preferences'] as const,
  staffPrefs: ['staff_notification_preferences'] as const,
};

/**
 * Query Notifications List
 */
export function useNotificationsList(params?: NotificationFilterParams) {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.list(params),
    queryFn: () => getNotificationsListAction(params),
  });
}

/**
 * Query Notification Metrics
 */
export function useNotificationMetrics() {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.metrics,
    queryFn: () => getNotificationMetricsAction(),
    refetchInterval: 30000, // Refresh every 30s
  });
}

/**
 * Mutation: Mark Notification as Read
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => markNotificationAsReadAction(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications_list'] });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.metrics });
    },
  });
}

/**
 * Mutation: Mark All Notifications as Read
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsAsReadAction(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications_list'] });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.metrics });
    },
  });
}

/**
 * Mutation: Delete Notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => deleteNotificationAction(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications_list'] });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.metrics });
    },
  });
}

/**
 * Mutation: Retry Failed Notification
 */
export function useRetryNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => retryNotificationAction(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications_list'] });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.metrics });
    },
  });
}

/**
 * Query & Mutation for Staff Preferences
 */
export function useStaffNotificationPreferences() {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.staffPrefs,
    queryFn: () => getStaffNotificationPreferencesAction(),
  });
}

export function useUpdateStaffNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<StaffNotificationPreferences>) =>
      updateStaffNotificationPreferencesAction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.staffPrefs });
    },
  });
}
