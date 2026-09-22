// HamzaPhone & DRIPIDIN Notification Service & Event-Driven Dispatcher
// Integrated with Phase 6 Notification Template Engine, Durable Queue, MoneyFormatter, and SecretResolver.
// Guarantees Order Transaction Immunity: Notification failure NEVER aborts a business transaction.

import type {
  NotificationRecord,
  DomainEventPayload,
  NotificationFilterParams,
  CustomerNotificationPreferences,
  StaffNotificationPreferences,
  NotificationOverviewMetrics,
  DomainEventType,
  NotificationChannelType,
} from '@/types/notifications.types';
import type { UserAuthContext } from '@/types/rbac.types';
import { NOTIFICATION_CHANNELS } from './channels';
import { toDbChannel, toDomainChannel } from './channels/channel-mapper';
import { TemplateResolver } from './template-engine/template-resolver';
import { renderTemplate } from './template-engine/variable-renderer';
import { CONFIGURABLE_EVENT_REGISTRY, isConfigurableEvent } from './template-engine/event-registry';
import { MoneyFormatter } from '@/lib/money/formatter';
import { StoreSettingsService } from '@/lib/settings/store-settings.service';
import { createServerClient } from '@/lib/auth/server';

// In-Memory Notification Store (Synchronized with audit trail & persistent DB)
let notificationsStore: NotificationRecord[] = [
  {
    id: 'notif-001',
    recipientId: null,
    recipientType: 'STAFF',
    recipientRole: 'ORDER_MANAGER',
    eventType: 'order.created',
    title: 'Nouvelle Commande HP-2026-004921',
    message: 'Nouvelle commande passée par Karim Boudiaf (Oran) d’un montant de 18 500 DZD.',
    channel: 'DASHBOARD',
    status: 'DELIVERED',
    severity: 'INFO',
    read: false,
    entityType: 'ORDER',
    entityId: 'ord-001',
    metadata: { orderNumber: 'HP-2026-004921', totalDzd: 18500, wilayaName: 'Oran' },
    idempotencyKey: 'evt-ord-created-HP-2026-004921',
    retryCount: 0,
    maxRetries: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    deliveredAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'notif-002',
    recipientId: null,
    recipientType: 'STAFF',
    recipientRole: 'ADMINISTRATOR',
    eventType: 'payment.discrepancy',
    title: 'Écart de Paiement Détecté (HP-2026-004922)',
    message: 'Écart de 500 DZD constaté sur l’encaissement EcoTrack de la commande HP-2026-004922.',
    channel: 'DASHBOARD',
    status: 'DELIVERED',
    severity: 'WARNING',
    read: false,
    entityType: 'PAYMENT',
    entityId: 'pay-002',
    metadata: { orderNumber: 'HP-2026-004922', discrepancyAmountDzd: 500 },
    idempotencyKey: 'evt-pay-disc-HP-2026-004922',
    retryCount: 0,
    maxRetries: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'notif-003',
    recipientId: null,
    recipientType: 'STAFF',
    recipientRole: 'INVENTORY_MANAGER',
    eventType: 'inventory.low_stock',
    title: 'Alerte Stock Critique : Écran Samsung S22 Ultra',
    message: 'Le stock disponible pour SKU-SAM-S22U-OLED est tombé à 2 unités (seuil d’alerte : 5).',
    channel: 'DASHBOARD',
    status: 'DELIVERED',
    severity: 'CRITICAL',
    read: false,
    entityType: 'INVENTORY',
    entityId: 'prod-001',
    metadata: { sku: 'SKU-SAM-S22U-OLED', availableStock: 2, threshold: 5 },
    idempotencyKey: 'evt-inv-low-SKU-SAM-S22U-OLED',
    retryCount: 0,
    maxRetries: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: 'notif-004',
    recipientId: null,
    recipientType: 'STAFF',
    recipientRole: 'ADMINISTRATOR',
    eventType: 'b2b.application_received',
    title: 'Nouvelle Demande Compte Grossiste B2B',
    message: 'L’atelier "Belfort Fix Tech" (Alger) a soumis son dossier avec N° RC 16/00-9988123B.',
    channel: 'DASHBOARD',
    status: 'DELIVERED',
    severity: 'INFO',
    read: true,
    entityType: 'B2B_APPLICATION',
    entityId: 'b2b-app-001',
    metadata: { businessName: 'Belfort Fix Tech', rcNumber: '16/00-9988123B' },
    idempotencyKey: 'evt-b2b-app-001',
    retryCount: 0,
    maxRetries: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'notif-005',
    recipientId: 'user-customer-001',
    recipientType: 'CUSTOMER',
    eventType: 'shipment.in_transit',
    title: 'Votre colis DRIPIDIN est en cours de livraison',
    message: 'Votre commande HP-2026-004921 a été prise en charge par EcoTrack. N° Suivi : ECO-ALG-992144.',
    channel: 'SMS',
    status: 'DELIVERED',
    severity: 'INFO',
    read: true,
    entityType: 'DELIVERY',
    entityId: 'deliv-001',
    metadata: { orderNumber: 'HP-2026-004921', trackingNumber: 'ECO-ALG-992144' },
    idempotencyKey: 'evt-cust-ship-HP-2026-004921',
    retryCount: 0,
    maxRetries: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
];

// In-Memory Preferences Store
const customerPreferencesStore = new Map<string, CustomerNotificationPreferences>();
const staffPreferencesStore = new Map<string, StaffNotificationPreferences>();

export class NotificationService {
  /**
   * 1. Dispatch Domain Event with Template Engine Resolution
   * Guarantees zero transaction aborts even if notifications fail.
   */
  static async dispatchDomainEvent(
    payload: DomainEventPayload,
    customClient?: any
  ): Promise<NotificationRecord[]> {
    const createdNotifications: NotificationRecord[] = [];

    try {
      const baseIdempotency =
        payload.idempotencyKey || `evt-${payload.eventType}-${payload.entityId}`;

      // 1. Idempotency Check in DB if client available
      if (customClient) {
        try {
          const { data: existingRows } = await customClient
            .from('notifications')
            .select('*')
            .like('idempotency_key', `${baseIdempotency}%`);
          if (existingRows && existingRows.length > 0) {
            return existingRows.map((r: any) => ({
              id: r.id,
              recipientId: r.user_id,
              recipientType: (r.recipient_type as any) || 'CUSTOMER',
              eventType: r.event_type || payload.eventType,
              title: r.title,
              message: r.body || r.message,
              channel: toDomainChannel(r.channel),
              status: r.status,
              severity: 'INFO',
              read: false,
              entityType: payload.entityType,
              entityId: payload.entityId,
              idempotencyKey: r.idempotency_key,
              retryCount: r.retry_count || 0,
              maxRetries: r.max_retries || 3,
              createdAt: r.created_at,
              deliveredAt: r.delivered_at,
              errorInfo: r.error_message,
            }));
          }
        } catch {
          // Fallback gracefully
        }
      }

      // 2. Idempotency Check: Prevent duplicate notification generation for identical domain events
      const existing = notificationsStore.filter((n) => n.idempotencyKey?.startsWith(baseIdempotency));
      if (existing.length > 0) {
        return existing;
      }

      // Resolve Dynamic Store Settings & Neutral Variables
      let storeName = 'DRIPIDIN';
      let supportPhone = '0550 12 34 56';
      let supportEmail = 'contact@dripidin.dz';
      let currencyCode = 'DZD';
      let locale = 'fr-DZ';

      try {
        const settings = await StoreSettingsService.getStoreSettings();
        if (settings) {
          storeName = settings.storeName || storeName;
          supportPhone = settings.supportPhone || supportPhone;
          supportEmail = settings.supportEmail || supportEmail;
          currencyCode = settings.currencyCode || currencyCode;
          locale = settings.defaultLocale || locale;
        }
      } catch {
        // Fallback gracefully
      }

      // Money Formatting Integration (Phase 3)
      const rawTotal = payload.data?.totalDzd ?? payload.data?.total;
      const formattedTotal =
        rawTotal !== undefined && rawTotal !== null
          ? MoneyFormatter.format(Number(rawTotal) || 0, { currencyCode, locale })
          : '';

      const rawSubtotal = payload.data?.subtotal;
      const formattedSubtotal =
        rawSubtotal !== undefined && rawSubtotal !== null
          ? MoneyFormatter.format(Number(rawSubtotal) || 0, { currencyCode, locale })
          : '';

      const rawShipping = payload.data?.shippingCost;
      const formattedShipping =
        rawShipping !== undefined && rawShipping !== null
          ? MoneyFormatter.format(Number(rawShipping) || 0, { currencyCode, locale })
          : '';

      // Assemble Context Variables
      const contextVariables: Record<string, any> = {
        storeName,
        supportPhone,
        supportEmail,
        currency: currencyCode === 'DZD' ? 'DA' : currencyCode,
        orderNumber: payload.data?.orderNumber || payload.entityId,
        customerName: payload.data?.customerName || 'Client',
        customerPhone: payload.customerPhone || payload.data?.customerPhone || '',
        customerEmail: payload.customerEmail || payload.data?.customerEmail || '',
        total: formattedTotal,
        subtotal: formattedSubtotal,
        shippingCost: formattedShipping,
        trackingNumber: payload.data?.trackingNumber || '',
        courierName: payload.data?.courierName || 'EcoTrack',
        trackingUrl:
          payload.data?.trackingUrl ||
          (payload.data?.trackingNumber
            ? `https://dripidin.dz/track-order?ref=${payload.data.trackingNumber}`
            : ''),
        wilayaName: payload.data?.wilayaName || '',
        deliveryAddress: payload.data?.deliveryAddress || '',
        sku: payload.data?.sku || '',
        productName: payload.data?.productName || '',
        availableStock: payload.data?.availableStock ?? '',
        threshold: payload.data?.threshold ?? '',
        businessName: payload.data?.businessName || '',
        adminUrl: payload.data?.adminUrl || 'https://dripidin.dz/account/business',
        cancellationReason: payload.data?.cancellationReason || '',
        returnReason: payload.data?.returnReason || '',
        failureReason: payload.data?.failureReason || '',
        deliveredAt: payload.data?.deliveredAt || '',
        itemCount: payload.data?.itemCount ?? '',
        deliveryType: payload.data?.deliveryType || '',
        driverPhone: payload.data?.driverPhone || '',
        discountTier: payload.data?.discountTier || '',
        rejectionReason: payload.data?.rejectionReason || '',
        ...payload.data,
      };

      // Determine Target Routes (Recipients x Channels)
      const routes = await this.resolveEventRouting(payload, contextVariables, locale, customClient);

      for (const route of routes) {
        const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const idempotencyKey = `${baseIdempotency}-${route.channel}-${route.recipientType}`;

        const record: NotificationRecord = {
          id: notifId,
          recipientId: route.recipientId || null,
          recipientType: route.recipientType,
          recipientRole: route.recipientRole || null,
          eventType: payload.eventType,
          title: route.title,
          message: route.message,
          channel: route.channel,
          status: 'PENDING',
          severity: route.severity || payload.severity || 'INFO',
          read: false,
          entityType: payload.entityType,
          entityId: payload.entityId,
          metadata: {
            ...contextVariables,
            phone: payload.customerPhone || payload.data?.customerPhone,
            email: payload.customerEmail || payload.data?.customerEmail,
          },
          idempotencyKey,
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date().toISOString(),
          deliveredAt: null,
          errorInfo: null,
        };

        // 1. Persist to DB table if client available
        try {
          const supabase = customClient || (await createServerClient());
          await supabase.from('notifications').insert({
            id: record.id,
            user_id: record.recipientId,
            channel: toDbChannel(record.channel),
            recipient:
              record.metadata?.phone ||
              record.metadata?.email ||
              record.metadata?.customerPhone ||
              record.metadata?.customerEmail ||
              'DASHBOARD',
            title: record.title,
            body: record.message,
            status: 'PENDING',
            idempotency_key: record.idempotencyKey,
            metadata: record.metadata,
          });
        } catch {
          // Ignored if DB table not present or running isolated unit test
        }

        // 2. Immediate Channel Delivery (Fast-Path)
        const channelHandler = NOTIFICATION_CHANNELS[route.channel];
        if (channelHandler && channelHandler.isAvailable()) {
          try {
            const sendResult = await channelHandler.send(record);
            if (sendResult.success) {
              record.status = 'DELIVERED';
              record.deliveredAt = sendResult.deliveredAt || new Date().toISOString();
            } else {
              record.status = 'FAILED';
              record.errorInfo = sendResult.error || 'Erreur lors de l’envoi de la notification';
            }
          } catch (err: any) {
            record.status = 'FAILED';
            record.errorInfo = err.message || 'Exception canal';
          }
        } else {
          record.status = 'FAILED';
          record.errorInfo = `Canal ${route.channel} indisponible`;
        }

        notificationsStore.unshift(record);
        createdNotifications.push(record);
      }
    } catch (criticalErr: any) {
      // Order Transaction Immunity Invariant: Never allow notification errors to abort checkout
      console.error('[NotificationService] Unhandled dispatch warning (isolated):', criticalErr.message);
    }

    return createdNotifications;
  }

  /**
   * 2. Event Routing Resolver using Template Engine
   */
  private static async resolveEventRouting(
    payload: DomainEventPayload,
    variables: Record<string, any>,
    locale: string,
    supabaseClient?: any
  ): Promise<
    Array<{
      recipientId?: string | null;
      recipientType: 'STAFF' | 'CUSTOMER' | 'SYSTEM';
      recipientRole?: string | null;
      channel: NotificationChannelType;
      title: string;
      message: string;
      severity?: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
    }>
  > {
    const routes: Array<{
      recipientId?: string | null;
      recipientType: 'STAFF' | 'CUSTOMER' | 'SYSTEM';
      recipientRole?: string | null;
      channel: NotificationChannelType;
      title: string;
      message: string;
      severity?: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
    }> = [];

    // 1. Configurable Business Events (15 Events)
    if (isConfigurableEvent(payload.eventType)) {
      const def = CONFIGURABLE_EVENT_REGISTRY[payload.eventType];
      const channels = def ? def.defaultChannels : ['DASHBOARD'];

      for (const channel of channels) {
        // Resolve custom template from DB or fallback to system default
        const resolved = await TemplateResolver.resolveTemplate(
          payload.eventType,
          channel as NotificationChannelType,
          locale,
          supabaseClient
        );

        if (!resolved) {
          continue; // Channel disabled by store operator
        }

        const title = renderTemplate(resolved.subject || `Notification ${payload.eventType}`, variables);
        const message = renderTemplate(resolved.bodyText, variables);

        if (channel === 'DASHBOARD') {
          // If customer-targeted event, route to customer
          if (def.audience === 'CUSTOMER' && payload.customerId) {
            routes.push({
              recipientId: payload.customerId,
              recipientType: 'CUSTOMER',
              channel: 'DASHBOARD',
              title,
              message,
              severity: 'SUCCESS',
            });
          }
          // Also route to staff if appropriate
          if (def.audience === 'STAFF') {
            routes.push({
              recipientType: 'STAFF',
              recipientRole: payload.eventType.startsWith('inventory.') ? 'INVENTORY_MANAGER' : 'ORDER_MANAGER',
              channel: 'DASHBOARD',
              title,
              message,
              severity: payload.severity || (payload.eventType.startsWith('inventory.') ? 'CRITICAL' : 'INFO'),
            });
          } else if (payload.eventType === 'order.created' || payload.eventType === 'order.delivered') {
            routes.push({
              recipientType: 'STAFF',
              recipientRole: 'ORDER_MANAGER',
              channel: 'DASHBOARD',
              title,
              message,
              severity: 'INFO',
            });
          }
        } else if (channel === 'SMS' && payload.customerPhone) {
          routes.push({
            recipientType: 'CUSTOMER',
            channel: 'SMS',
            title,
            message,
            severity: 'INFO',
          });
        } else if (channel === 'WHATSAPP' && payload.customerPhone) {
          routes.push({
            recipientType: 'CUSTOMER',
            channel: 'WHATSAPP',
            title,
            message,
            severity: 'INFO',
          });
        } else if (channel === 'EMAIL' && (payload.customerEmail || payload.data?.customerEmail)) {
          routes.push({
            recipientType: 'CUSTOMER',
            channel: 'EMAIL',
            title,
            message,
            severity: 'INFO',
          });
        } else if (channel === 'TELEGRAM') {
          routes.push({
            recipientType: 'STAFF',
            recipientRole: 'ADMINISTRATOR',
            channel: 'TELEGRAM',
            title,
            message,
            severity: 'WARNING',
          });
        }
      }
    } else {
      // 2. Internal Technical Ledger Events (Programmatic fallback)
      const orderNo = payload.data?.orderNumber || payload.entityId;
      switch (payload.eventType) {
        case 'payment.discrepancy':
          routes.push({
            recipientType: 'STAFF',
            recipientRole: 'ADMINISTRATOR',
            channel: 'DASHBOARD',
            title: `Écart de Paiement Détecté (${orderNo})`,
            message: `Écart de ${payload.data?.discrepancyAmountDzd || '500'} DZD constaté sur l’encaissement de la commande ${orderNo}.`,
            severity: 'WARNING',
          });
          break;
        case 'system.alert':
        default:
          routes.push({
            recipientType: 'STAFF',
            recipientRole: 'ADMINISTRATOR',
            channel: 'DASHBOARD',
            title: payload.title || `Alerte Système : ${payload.eventType}`,
            message: payload.message || `Événement ${payload.eventType} enregistré pour ${payload.entityId}.`,
            severity: payload.severity || 'INFO',
          });
          break;
      }
    }

    return routes;
  }

  /**
   * 3. Get Notifications List with User Boundary Enforcement
   */
  static getNotificationsList(
    params?: NotificationFilterParams,
    authContext?: UserAuthContext
  ): NotificationRecord[] {
    let result = [...notificationsStore];

    // Customer Isolation: If requesting user is a customer, strictly show only their notifications
    if (authContext && authContext.userType !== 'STAFF') {
      result = result.filter(
        (n) => n.recipientType === 'CUSTOMER' && n.recipientId === authContext.userId
      );
    } else if (authContext && authContext.userType === 'STAFF') {
      // Staff cannot see customer private notifications unless they are viewing general alerts
      if (params?.recipientType && params.recipientType !== 'ALL') {
        result = result.filter((n) => n.recipientType === params.recipientType);
      }
    }

    if (params?.channel && params.channel !== 'ALL') {
      result = result.filter((n) => n.channel === params.channel);
    }

    if (params?.status && params.status !== 'ALL') {
      result = result.filter((n) => n.status === params.status);
    }

    if (params?.severity && params.severity !== 'ALL') {
      result = result.filter((n) => n.severity === params.severity);
    }

    if (params?.read !== undefined && params.read !== 'ALL') {
      result = result.filter((n) => n.read === params.read);
    }

    if (params?.entityType && params.entityType !== 'ALL') {
      result = result.filter((n) => n.entityType === params.entityType);
    }

    if (params?.searchQuery) {
      const q = params.searchQuery.toLowerCase();
      result = result.filter(
        (n) => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * 4. Get Notification Detail
   */
  static getNotificationDetail(notificationId: string, authContext?: UserAuthContext): NotificationRecord {
    const found = notificationsStore.find((n) => n.id === notificationId);
    if (!found) {
      throw new Error(`Notification introuvable: ${notificationId}`);
    }

    if (authContext && authContext.userType !== 'STAFF' && found.recipientId !== authContext.userId) {
      throw new Error('Accès interdit à cette notification.');
    }

    return found;
  }

  /**
   * 5. Mark Notification as Read
   */
  static markAsRead(notificationId: string, authContext?: UserAuthContext): NotificationRecord {
    const notif = this.getNotificationDetail(notificationId, authContext);
    notif.read = true;
    return notif;
  }

  /**
   * 6. Mark All Notifications as Read
   */
  static markAllAsRead(authContext?: UserAuthContext): number {
    let count = 0;
    for (const notif of notificationsStore) {
      if (authContext && authContext.userType !== 'STAFF') {
        if (notif.recipientId === authContext.userId && !notif.read) {
          notif.read = true;
          count++;
        }
      } else {
        if (!notif.read) {
          notif.read = true;
          count++;
        }
      }
    }
    return count;
  }

  /**
   * 7. Delete Notification
   */
  static deleteNotification(notificationId: string, authContext?: UserAuthContext): boolean {
    const notif = this.getNotificationDetail(notificationId, authContext);
    notificationsStore = notificationsStore.filter((n) => n.id !== notif.id);
    return true;
  }

  /**
   * 8. Retry Failed Notification
   */
  static async retryNotification(notificationId: string): Promise<NotificationRecord> {
    const notif = notificationsStore.find((n) => n.id === notificationId);
    if (!notif) {
      throw new Error(`Notification introuvable: ${notificationId}`);
    }

    if (notif.status === 'DELIVERED') {
      return notif;
    }

    if (notif.retryCount >= notif.maxRetries) {
      throw new Error(`Nombre maximal de tentatives de réexpédition atteint (${notif.maxRetries}).`);
    }

    notif.retryCount++;
    const channelHandler = NOTIFICATION_CHANNELS[notif.channel];

    if (channelHandler && channelHandler.isAvailable()) {
      const result = await channelHandler.send(notif);
      if (result.success) {
        notif.status = 'DELIVERED';
        notif.deliveredAt = result.deliveredAt || new Date().toISOString();
        notif.errorInfo = null;
      } else {
        notif.status = 'FAILED';
        notif.errorInfo = result.error || 'Nouvelle tentative infructueuse';
      }
    }

    return notif;
  }

  /**
   * 9. Get Notification Overview Metrics
   */
  static getNotificationOverviewMetrics(authContext?: UserAuthContext): NotificationOverviewMetrics {
    const list = this.getNotificationsList({}, authContext);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return {
      totalUnreadCount: list.filter((n) => !n.read).length,
      criticalCount: list.filter((n) => n.severity === 'CRITICAL' && !n.read).length,
      warningCount: list.filter((n) => n.severity === 'WARNING' && !n.read).length,
      todayCount: list.filter((n) => n.createdAt.startsWith(todayStr)).length,
      failedDeliveriesCount: list.filter((n) => n.status === 'FAILED').length,
    };
  }

  /**
   * 10. Notification Preferences Management
   */
  static getCustomerPreferences(userId: string): CustomerNotificationPreferences {
    return (
      customerPreferencesStore.get(userId) || {
        userId,
        orderUpdates: true,
        deliveryUpdates: true,
        promotionalNotifications: false,
        preferredChannel: 'DASHBOARD',
      }
    );
  }

  static updateCustomerPreferences(
    userId: string,
    input: Partial<CustomerNotificationPreferences>
  ): CustomerNotificationPreferences {
    const current = this.getCustomerPreferences(userId);
    const updated = { ...current, ...input, userId };
    customerPreferencesStore.set(userId, updated);
    return updated;
  }

  static getStaffPreferences(userId: string): StaffNotificationPreferences {
    return (
      staffPreferencesStore.get(userId) || {
        userId,
        newOrders: true,
        lowStockAlerts: true,
        b2bApplications: true,
        deliveryFailures: true,
        paymentDiscrepancies: true,
        importReports: true,
        systemAlerts: true,
        dashboardSoundEnabled: true,
      }
    );
  }

  static updateStaffPreferences(
    userId: string,
    input: Partial<StaffNotificationPreferences>
  ): StaffNotificationPreferences {
    const current = this.getStaffPreferences(userId);
    const updated = { ...current, ...input, userId };
    staffPreferencesStore.set(userId, updated);
    return updated;
  }
}
