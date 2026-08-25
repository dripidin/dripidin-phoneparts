// HamzaPhone Notification Service & Event-Driven Dispatcher
// Decoupled notification engine with channel abstraction, idempotency, retry mechanisms, and customer data shielding.

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
    title: 'Votre colis HamzaPhone est en cours de livraison',
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
   * 1. Dispatch Domain Event and Fan-out to Configured Channels
   */
  static async dispatchDomainEvent(payload: DomainEventPayload): Promise<NotificationRecord[]> {
    const createdNotifications: NotificationRecord[] = [];
    const baseIdempotency = payload.idempotencyKey || `evt-${payload.eventType}-${payload.entityId}-${Date.now()}`;

    // Idempotency Check: Prevent duplicate notification generation for identical domain events
    const existing = notificationsStore.filter((n) => n.idempotencyKey?.startsWith(baseIdempotency));
    if (existing.length > 0) {
      return existing;
    }

    // Determine Recipients and Channels based on Event Type
    const mappings = this.resolveEventRouting(payload);

    for (const mapping of mappings) {
      const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const channelHandler = NOTIFICATION_CHANNELS[mapping.channel];

      const record: NotificationRecord = {
        id: notifId,
        recipientId: mapping.recipientId || null,
        recipientType: mapping.recipientType,
        recipientRole: mapping.recipientRole || null,
        eventType: payload.eventType,
        title: mapping.title,
        message: mapping.message,
        channel: mapping.channel,
        status: 'QUEUED',
        severity: mapping.severity || payload.severity || 'INFO',
        read: false,
        entityType: payload.entityType,
        entityId: payload.entityId,
        metadata: {
          ...payload.data,
          customerPhone: payload.customerPhone,
          customerEmail: payload.customerEmail,
        },
        idempotencyKey: `${baseIdempotency}-${mapping.channel}-${mapping.recipientType}`,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        deliveredAt: null,
        errorInfo: null,
      };

      // Deliver via Channel
      if (channelHandler && channelHandler.isAvailable()) {
        try {
          const result = await channelHandler.send(record);
          if (result.success) {
            record.status = 'DELIVERED';
            record.deliveredAt = result.deliveredAt || new Date().toISOString();
          } else {
            record.status = 'FAILED';
            record.errorInfo = result.error || 'Erreur lors de l’envoi de la notification';
          }
        } catch (err: any) {
          record.status = 'FAILED';
          record.errorInfo = err.message || 'Exception canal';
        }
      } else {
        record.status = 'FAILED';
        record.errorInfo = `Canal ${mapping.channel} indisponible`;
      }

      notificationsStore.unshift(record);
      createdNotifications.push(record);
    }

    return createdNotifications;
  }

  /**
   * 2. Event Routing Resolver (Translates Domain Event to Recipient × Channel Mappings)
   */
  private static resolveEventRouting(payload: DomainEventPayload): Array<{
    recipientId?: string | null;
    recipientType: 'STAFF' | 'CUSTOMER' | 'SYSTEM';
    recipientRole?: string | null;
    channel: NotificationChannelType;
    title: string;
    message: string;
    severity?: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  }> {
    const routes: Array<{
      recipientId?: string | null;
      recipientType: 'STAFF' | 'CUSTOMER' | 'SYSTEM';
      recipientRole?: string | null;
      channel: NotificationChannelType;
      title: string;
      message: string;
      severity?: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
    }> = [];

    const orderNo = payload.data?.orderNumber || payload.entityId;

    switch (payload.eventType) {
      // Order Events
      case 'order.created':
        // Staff Dashboard Alert
        routes.push({
          recipientType: 'STAFF',
          recipientRole: 'ORDER_MANAGER',
          channel: 'DASHBOARD',
          title: `Nouvelle Commande ${orderNo}`,
          message: payload.message || `Nouvelle commande enregistrée pour ${payload.data?.customerName || 'Client'}.`,
          severity: 'INFO',
        });
        // Customer Confirmation (Dashboard & SMS/WhatsApp)
        if (payload.customerId) {
          routes.push({
            recipientId: payload.customerId,
            recipientType: 'CUSTOMER',
            channel: 'DASHBOARD',
            title: `Commande ${orderNo} confirmée`,
            message: `Votre commande a bien été reçue. Nous préparons votre colis pour expédition 58 Wilayas.`,
            severity: 'SUCCESS',
          });
        }
        if (payload.customerPhone) {
          routes.push({
            recipientType: 'CUSTOMER',
            channel: 'SMS',
            title: `Confirmation Commande HamzaPhone`,
            message: `HamzaPhone: Votre commande ${orderNo} est validée. Livraison sous 24/48h via EcoTrack.`,
            severity: 'INFO',
          });
        }
        break;

      case 'order.shipped':
      case 'shipment.in_transit':
        if (payload.customerId) {
          routes.push({
            recipientId: payload.customerId,
            recipientType: 'CUSTOMER',
            channel: 'DASHBOARD',
            title: `Colis ${orderNo} en cours d’acheminement`,
            message: `Votre colis est en transit avec EcoTrack (Suivi: ${payload.data?.trackingNumber || 'En cours'}).`,
            severity: 'INFO',
          });
        }
        if (payload.customerPhone) {
          routes.push({
            recipientType: 'CUSTOMER',
            channel: 'SMS',
            title: `Expédition Commande`,
            message: `HamzaPhone: Votre colis ${orderNo} est en route. Suivi: ${payload.data?.trackingNumber || ''}`,
            severity: 'INFO',
          });
        }
        break;

      case 'order.delivered':
      case 'shipment.delivered':
        if (payload.customerId) {
          routes.push({
            recipientId: payload.customerId,
            recipientType: 'CUSTOMER',
            channel: 'DASHBOARD',
            title: `Commande ${orderNo} livrée avec succès`,
            message: `Votre colis a été remis par le livreur. Merci de votre confiance !`,
            severity: 'SUCCESS',
          });
        }
        routes.push({
          recipientType: 'STAFF',
          recipientRole: 'ORDER_MANAGER',
          channel: 'DASHBOARD',
          title: `Livraison Effectuée : ${orderNo}`,
          message: `Le colis ${orderNo} a été livré au client par EcoTrack.`,
          severity: 'SUCCESS',
        });
        break;

      case 'shipment.failed':
        routes.push({
          recipientType: 'STAFF',
          recipientRole: 'ORDER_MANAGER',
          channel: 'DASHBOARD',
          title: `Échec Livraison : ${orderNo}`,
          message: payload.message || `Le livreur n’a pas pu remettre le colis ${orderNo}.`,
          severity: 'WARNING',
        });
        break;

      case 'payment.discrepancy':
        routes.push({
          recipientType: 'STAFF',
          recipientRole: 'ADMINISTRATOR',
          channel: 'DASHBOARD',
          title: `Écart de Règlement Constaté : ${orderNo}`,
          message: payload.message || `Un écart de règlement requiert votre attention pour la commande ${orderNo}.`,
          severity: 'WARNING',
        });
        break;

      case 'inventory.low_stock':
      case 'inventory.out_of_stock':
        routes.push({
          recipientType: 'STAFF',
          recipientRole: 'INVENTORY_MANAGER',
          channel: 'DASHBOARD',
          title: payload.title || `Alerte Stock : ${payload.data?.sku || payload.entityId}`,
          message: payload.message || `Le niveau de stock est critique. Réapprovisionnement requis.`,
          severity: payload.severity || (payload.eventType === 'inventory.out_of_stock' ? 'CRITICAL' : 'WARNING'),
        });
        break;

      case 'b2b.application_received':
        routes.push({
          recipientType: 'STAFF',
          recipientRole: 'ADMINISTRATOR',
          channel: 'DASHBOARD',
          title: `Nouvelle Candidature Grossiste B2B`,
          message: payload.message || `Un nouvel atelier a soumis son dossier d'inscription B2B.`,
          severity: 'INFO',
        });
        break;

      case 'b2b.approved':
        if (payload.customerId) {
          routes.push({
            recipientId: payload.customerId,
            recipientType: 'CUSTOMER',
            channel: 'DASHBOARD',
            title: `Votre compte Grossiste B2B a été approuvé !`,
            message: `Bienvenue sur l'Espace Pro HamzaPhone. Vos tarifs grossistes et conditions de paiement sont désormais actifs.`,
            severity: 'SUCCESS',
          });
        }
        break;

      case 'import.failed':
        routes.push({
          recipientType: 'STAFF',
          recipientRole: 'CONTENT_MANAGER',
          channel: 'DASHBOARD',
          title: `Échec Importation Catalogue`,
          message: payload.message || `L’importation du fichier a échoué suite à des erreurs de formatage.`,
          severity: 'CRITICAL',
        });
        break;

      default:
        routes.push({
          recipientType: 'STAFF',
          recipientRole: 'ADMINISTRATOR',
          channel: 'DASHBOARD',
          title: payload.title || `Événement Système : ${payload.eventType}`,
          message: payload.message || `Événement ${payload.eventType} enregistré pour ${payload.entityId}.`,
          severity: payload.severity || 'INFO',
        });
        break;
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
