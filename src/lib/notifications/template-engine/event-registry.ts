// DRIPIDIN Notification Event Registry
// Single authoritative classification of the 26 core domain events.
// Enforces strict boundary: 15 Admin-Configurable Business Events vs 11 Internal System Ledger Events.

import type {
  DomainEventType,
  NotificationEventDefinition,
} from '@/types/notifications.types';

/**
 * 15 Admin-Configurable Business Events exposed in the Notification Template Editor.
 */
export const CONFIGURABLE_EVENT_REGISTRY: Record<string, NotificationEventDefinition> = {
  'order.created': {
    eventType: 'order.created',
    displayName: 'Commande passée (Client)',
    category: 'COMMERCE',
    audience: 'CUSTOMER',
    defaultChannels: ['DASHBOARD', 'SMS', 'EMAIL'],
    supportedChannels: ['DASHBOARD', 'SMS', 'WHATSAPP', 'EMAIL', 'TELEGRAM'],
    hasSubject: true,
    requiredVariables: ['orderNumber', 'total', 'customerName', 'storeName'],
    optionalVariables: ['itemCount', 'deliveryType', 'wilayaName', 'supportPhone'],
    descriptionFr: 'Déclenché immédiatement après la validation du panier par le client.',
  },
  'order.confirmed': {
    eventType: 'order.confirmed',
    displayName: 'Commande confirmée',
    category: 'COMMERCE',
    audience: 'CUSTOMER',
    defaultChannels: ['DASHBOARD', 'SMS'],
    supportedChannels: ['DASHBOARD', 'SMS', 'WHATSAPP', 'EMAIL', 'TELEGRAM'],
    hasSubject: true,
    requiredVariables: ['orderNumber', 'customerName', 'storeName'],
    optionalVariables: ['total', 'estimatedDeliveryDays', 'supportPhone'],
    descriptionFr: 'Déclenché dès confirmation et acceptation de la commande par la boutique.',
  },
  'order.processing': {
    eventType: 'order.processing',
    displayName: 'Commande en préparation',
    category: 'COMMERCE',
    audience: 'CUSTOMER',
    defaultChannels: ['DASHBOARD'],
    supportedChannels: ['DASHBOARD', 'SMS', 'WHATSAPP', 'EMAIL'],
    hasSubject: true,
    requiredVariables: ['orderNumber', 'customerName', 'storeName'],
    optionalVariables: ['supportPhone'],
    descriptionFr: 'Déclenché lorsque la commande est en cours de préparation en entrepôt.',
  },
  'order.shipped': {
    eventType: 'order.shipped',
    displayName: 'Colis expédié',
    category: 'LOGISTICS',
    audience: 'CUSTOMER',
    defaultChannels: ['DASHBOARD', 'SMS', 'WHATSAPP'],
    supportedChannels: ['DASHBOARD', 'SMS', 'WHATSAPP', 'EMAIL', 'TELEGRAM'],
    hasSubject: true,
    requiredVariables: ['orderNumber', 'customerName', 'trackingNumber', 'storeName'],
    optionalVariables: ['courierName', 'trackingUrl', 'supportPhone'],
    descriptionFr: 'Déclenché lorsque le colis est pris en charge par le transporteur.',
  },
  'order.delivered': {
    eventType: 'order.delivered',
    displayName: 'Colis remis / livré',
    category: 'LOGISTICS',
    audience: 'CUSTOMER',
    defaultChannels: ['DASHBOARD', 'SMS', 'EMAIL'],
    supportedChannels: ['DASHBOARD', 'SMS', 'WHATSAPP', 'EMAIL', 'TELEGRAM'],
    hasSubject: true,
    requiredVariables: ['orderNumber', 'customerName', 'storeName'],
    optionalVariables: ['deliveredAt', 'supportPhone'],
    descriptionFr: 'Déclenché dès confirmation de la remise du colis au client.',
  },
  'order.cancelled': {
    eventType: 'order.cancelled',
    displayName: 'Commande annulée',
    category: 'COMMERCE',
    audience: 'CUSTOMER',
    defaultChannels: ['DASHBOARD', 'SMS', 'EMAIL'],
    supportedChannels: ['DASHBOARD', 'SMS', 'WHATSAPP', 'EMAIL', 'TELEGRAM'],
    hasSubject: true,
    requiredVariables: ['orderNumber', 'customerName', 'storeName'],
    optionalVariables: ['cancellationReason', 'supportPhone'],
    descriptionFr: 'Déclenché en cas d\'annulation de la commande par le client ou le gestionnaire.',
  },
  'order.returned': {
    eventType: 'order.returned',
    displayName: 'Retour de colis',
    category: 'LOGISTICS',
    audience: 'CUSTOMER',
    defaultChannels: ['DASHBOARD', 'SMS'],
    supportedChannels: ['DASHBOARD', 'SMS', 'WHATSAPP', 'EMAIL'],
    hasSubject: true,
    requiredVariables: ['orderNumber', 'customerName', 'storeName'],
    optionalVariables: ['returnReason', 'supportPhone'],
    descriptionFr: 'Déclenché lors du retour de colis non livré à l\'entrepôt.',
  },
  'shipment.in_transit': {
    eventType: 'shipment.in_transit',
    displayName: 'Colis en transit hub',
    category: 'LOGISTICS',
    audience: 'CUSTOMER',
    defaultChannels: ['DASHBOARD', 'SMS'],
    supportedChannels: ['DASHBOARD', 'SMS', 'WHATSAPP', 'EMAIL'],
    hasSubject: true,
    requiredVariables: ['orderNumber', 'trackingNumber', 'storeName'],
    optionalVariables: ['courierName', 'wilayaName'],
    descriptionFr: 'Déclenché lors du scan de transit par le hub logistique.',
  },
  'shipment.out_for_delivery': {
    eventType: 'shipment.out_for_delivery',
    displayName: 'Colis en cours de livraison',
    category: 'LOGISTICS',
    audience: 'CUSTOMER',
    defaultChannels: ['DASHBOARD', 'SMS', 'WHATSAPP'],
    supportedChannels: ['DASHBOARD', 'SMS', 'WHATSAPP', 'EMAIL', 'TELEGRAM'],
    hasSubject: true,
    requiredVariables: ['orderNumber', 'customerName', 'storeName'],
    optionalVariables: ['courierName', 'driverPhone', 'total'],
    descriptionFr: 'Déclenché lorsque le livreur entame la tournée de distribution finale.',
  },
  'shipment.failed': {
    eventType: 'shipment.failed',
    displayName: 'Échec de distribution',
    category: 'LOGISTICS',
    audience: 'CUSTOMER',
    defaultChannels: ['DASHBOARD', 'SMS'],
    supportedChannels: ['DASHBOARD', 'SMS', 'WHATSAPP', 'EMAIL'],
    hasSubject: true,
    requiredVariables: ['orderNumber', 'customerName', 'storeName'],
    optionalVariables: ['failureReason', 'courierName', 'supportPhone'],
    descriptionFr: 'Déclenché lors d\'un échec de livraison (client absent, numéro injoignable).',
  },
  'inventory.low_stock': {
    eventType: 'inventory.low_stock',
    displayName: 'Alerte stock faible Belfort',
    category: 'INVENTORY',
    audience: 'STAFF',
    defaultChannels: ['DASHBOARD'],
    supportedChannels: ['DASHBOARD', 'EMAIL', 'TELEGRAM'],
    hasSubject: true,
    requiredVariables: ['sku', 'productName', 'availableStock', 'threshold'],
    optionalVariables: ['warehouseBin'],
    descriptionFr: 'Alerte interne lorsque le stock physique disponible passe sous le seuil d\'alerte.',
  },
  'inventory.out_of_stock': {
    eventType: 'inventory.out_of_stock',
    displayName: 'Rupture définitive de stock',
    category: 'INVENTORY',
    audience: 'STAFF',
    defaultChannels: ['DASHBOARD'],
    supportedChannels: ['DASHBOARD', 'EMAIL', 'TELEGRAM'],
    hasSubject: true,
    requiredVariables: ['sku', 'productName'],
    optionalVariables: ['lastSupplier'],
    descriptionFr: 'Alerte interne immédiate en cas d\'épuisement total du stock.',
  },
  'b2b.application_received': {
    eventType: 'b2b.application_received',
    displayName: 'Candidature B2B soumise',
    category: 'B2B',
    audience: 'CUSTOMER',
    defaultChannels: ['DASHBOARD', 'EMAIL'],
    supportedChannels: ['DASHBOARD', 'EMAIL', 'SMS', 'WHATSAPP'],
    hasSubject: true,
    requiredVariables: ['customerName', 'businessName', 'storeName'],
    optionalVariables: ['supportPhone'],
    descriptionFr: 'Accusé de réception envoyé lors de la soumission d\'une demande de compte grossiste B2B.',
  },
  'b2b.approved': {
    eventType: 'b2b.approved',
    displayName: 'Compte Grossiste B2B validé',
    category: 'B2B',
    audience: 'CUSTOMER',
    defaultChannels: ['DASHBOARD', 'WHATSAPP', 'EMAIL'],
    supportedChannels: ['DASHBOARD', 'WHATSAPP', 'EMAIL', 'SMS'],
    hasSubject: true,
    requiredVariables: ['customerName', 'businessName', 'storeName', 'adminUrl'],
    optionalVariables: ['discountTier', 'supportPhone'],
    descriptionFr: 'Déclenché dès l\'approbation administrative d\'un compte grossiste B2B.',
  },
  'b2b.rejected': {
    eventType: 'b2b.rejected',
    displayName: 'Candidature B2B refusée',
    category: 'B2B',
    audience: 'CUSTOMER',
    defaultChannels: ['DASHBOARD', 'EMAIL'],
    supportedChannels: ['DASHBOARD', 'EMAIL', 'SMS'],
    hasSubject: true,
    requiredVariables: ['customerName', 'businessName', 'storeName'],
    optionalVariables: ['rejectionReason', 'supportPhone'],
    descriptionFr: 'Notification polie transmise lors du refus d\'une demande de compte grossiste B2B.',
  },
};

export const CONFIGURABLE_EVENT_TYPES = Object.keys(CONFIGURABLE_EVENT_REGISTRY) as DomainEventType[];
export const NOTIFICATION_EVENT_REGISTRY = CONFIGURABLE_EVENT_REGISTRY;

/**
 * 11 Internal Technical & System Ledger Events.
 * Never exposed to store operators in the Template Editor; formatting is programmatic.
 */
export const INTERNAL_LEDGER_EVENTS: Record<string, { description: string; purpose: string }> = {
  'payment.discrepancy': {
    description: 'Écart de paiement COD',
    purpose: 'Alerte comptable interne lorsque l\'encaissement livreur diffère du montant attendu.',
  },
  'shipment.created': {
    description: 'Création bordereau',
    purpose: 'Initialisation technique du tracking transporteur.',
  },
  'shipment.delivered': {
    description: 'Livraison transporteur (brute)',
    purpose: 'Webhook d\'ingestion logistique brut (normalisé en order.delivered).',
  },
  'shipment.returned': {
    description: 'Retour transporteur (brut)',
    purpose: 'Webhook d\'ingestion logistique brut (normalisé en order.returned).',
  },
  'cod.collected': {
    description: 'Encaissement COD au pas de porte',
    purpose: 'Écriture comptable lors de l\'encaissement physique par le livreur.',
  },
  'cod.remitted': {
    description: 'Virement de reversement COD',
    purpose: 'Écriture comptable lors du virement bancaire du transporteur.',
  },
  'payment.reconciled': {
    description: 'Rapprochement bancaire effectué',
    purpose: 'Clôture de lot de rapprochement financier.',
  },
  'b2b.suspended': {
    description: 'Suspension de compte B2B',
    purpose: 'Journal d\'audit de sécurité lors du gel d\'un profil grossiste.',
  },
  'import.completed': {
    description: 'Import catalogue terminé',
    purpose: 'Notification toast d\'achèvement de traitement de fichier CSV.',
  },
  'import.partial': {
    description: 'Import catalogue partiel',
    purpose: 'Notification toast d\'avertissement de lignes invalides lors de l\'import.',
  },
  'import.failed': {
    description: 'Échec import catalogue',
    purpose: 'Notification toast d\'erreur de format de fichier d\'import.',
  },
  'system.alert': {
    description: 'Alerte administrative de diffusion',
    purpose: 'Bannière d\'urgence ad-hoc diffusée en temps réel aux utilisateurs.',
  },
};

export function isConfigurableEvent(eventType: string): boolean {
  return Object.prototype.hasOwnProperty.call(CONFIGURABLE_EVENT_REGISTRY, eventType);
}

export function isInternalLedgerEvent(eventType: string): boolean {
  return Object.prototype.hasOwnProperty.call(INTERNAL_LEDGER_EVENTS, eventType);
}

export function getConfigurableEventDefinition(eventType: DomainEventType | string): NotificationEventDefinition | undefined {
  return CONFIGURABLE_EVENT_REGISTRY[eventType];
}

export function getAllConfigurableEvents(): NotificationEventDefinition[] {
  return Object.values(CONFIGURABLE_EVENT_REGISTRY);
}
