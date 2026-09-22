// HamzaPhone Notification Domain & Event Dispatcher Types

import type { AppRoleCode } from './rbac.types';

export type NotificationChannelType = 'DASHBOARD' | 'EMAIL' | 'SMS' | 'WHATSAPP' | 'TELEGRAM';

export type NotificationStatus = 'PENDING' | 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED';

export type NotificationSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';

export type NotificationRecipientType = 'STAFF' | 'CUSTOMER' | 'SYSTEM';

export type NotificationEntityType =
  | 'ORDER'
  | 'DELIVERY'
  | 'PAYMENT'
  | 'INVENTORY'
  | 'B2B_APPLICATION'
  | 'IMPORT'
  | 'SYSTEM';

export type DomainEventType =
  // Order Events
  | 'order.created'
  | 'order.confirmed'
  | 'order.processing'
  | 'order.shipped'
  | 'order.delivered'
  | 'order.cancelled'
  | 'order.returned'
  // Delivery / Logistics Events
  | 'shipment.created'
  | 'shipment.in_transit'
  | 'shipment.out_for_delivery'
  | 'shipment.delivered'
  | 'shipment.failed'
  | 'shipment.returned'
  // Payment & COD Reconciliation Events
  | 'cod.collected'
  | 'cod.remitted'
  | 'payment.reconciled'
  | 'payment.discrepancy'
  // Inventory Events
  | 'inventory.low_stock'
  | 'inventory.out_of_stock'
  // B2B Customer Events
  | 'b2b.application_received'
  | 'b2b.approved'
  | 'b2b.rejected'
  | 'b2b.suspended'
  // Import / Export Events
  | 'import.completed'
  | 'import.partial'
  | 'import.failed'
  // System Alert Events
  | 'system.alert';

export interface NotificationRecord {
  id: string;
  recipientId?: string | null;
  recipientType: NotificationRecipientType;
  recipientRole?: AppRoleCode | string | null;
  eventType: DomainEventType;
  title: string;
  message: string;
  channel: NotificationChannelType;
  status: NotificationStatus;
  severity: NotificationSeverity;
  read: boolean;
  entityType: NotificationEntityType;
  entityId: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string | null;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  deliveredAt?: string | null;
  errorInfo?: string | null;
}

export interface DomainEventPayload {
  eventType: DomainEventType;
  entityType: NotificationEntityType;
  entityId: string;
  customerId?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  severity?: NotificationSeverity;
  title?: string;
  message?: string;
  data?: Record<string, any>;
  idempotencyKey?: string;
}

export interface ChannelSendResult {
  success: boolean;
  channel: NotificationChannelType;
  externalMessageId?: string;
  deliveredAt?: string;
  error?: string;
}

export interface NotificationChannel {
  readonly channelType: NotificationChannelType;
  isAvailable(): boolean;
  send(notification: NotificationRecord): Promise<ChannelSendResult>;
}

export interface NotificationFilterParams {
  recipientId?: string;
  recipientType?: NotificationRecipientType | 'ALL';
  channel?: NotificationChannelType | 'ALL';
  status?: NotificationStatus | 'ALL';
  severity?: NotificationSeverity | 'ALL';
  read?: boolean | 'ALL';
  entityType?: NotificationEntityType | 'ALL';
  searchQuery?: string;
}

export interface CustomerNotificationPreferences {
  userId: string;
  orderUpdates: boolean;
  deliveryUpdates: boolean;
  promotionalNotifications: boolean;
  preferredChannel: NotificationChannelType;
}

export interface StaffNotificationPreferences {
  userId: string;
  newOrders: boolean;
  lowStockAlerts: boolean;
  b2bApplications: boolean;
  deliveryFailures: boolean;
  paymentDiscrepancies: boolean;
  importReports: boolean;
  systemAlerts: boolean;
  dashboardSoundEnabled: boolean;
}

export interface NotificationOverviewMetrics {
  totalUnreadCount: number;
  criticalCount: number;
  warningCount: number;
  todayCount: number;
  failedDeliveriesCount: number;
}

// =========================================================================
// Phase 6: Notification Template Engine Types
// =========================================================================

export type NotificationAudience = 'CUSTOMER' | 'STAFF' | 'SYSTEM';
export type NotificationCategory =
  | 'TRANSACTIONAL'
  | 'OPERATIONAL'
  | 'MARKETING'
  | 'COMMERCE'
  | 'LOGISTICS'
  | 'B2B'
  | 'INVENTORY'
  | 'PAYMENT'
  | 'AUTH';

export interface NotificationTemplate {
  id: string;
  eventType: DomainEventType;
  channel: NotificationChannelType;
  locale: string;
  subject?: string | null;
  bodyText: string;
  bodyHtml?: string | null;
  isActive: boolean;
  isSystemDefault: boolean;
  version: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string | null;
}

export interface CreateNotificationTemplateInput {
  eventType: DomainEventType;
  channel: NotificationChannelType;
  locale?: string;
  subject?: string | null;
  bodyText: string;
  bodyHtml?: string | null;
  isActive?: boolean;
  isSystemDefault?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateNotificationTemplateInput {
  subject?: string | null;
  bodyText?: string;
  bodyHtml?: string | null;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface TemplateFilterParams {
  eventType?: DomainEventType | 'ALL';
  channel?: NotificationChannelType | 'ALL';
  locale?: string;
  isActive?: boolean;
}

export interface NotificationEventDefinition<TData = Record<string, any>> {
  readonly eventType: DomainEventType;
  readonly category: NotificationCategory;
  readonly audience: NotificationAudience;
  readonly defaultChannels: readonly NotificationChannelType[];
  readonly supportedChannels?: readonly NotificationChannelType[];
  readonly displayName?: string;
  readonly descriptionFr: string;
  readonly hasSubject?: boolean;
  readonly requiredVariables: readonly string[];
  readonly optionalVariables: readonly string[];
}

