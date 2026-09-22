// DRIPIDIN Controlled Template Variable Registry
// Strict definition of approved variable tokens, formatting sources, and validation rules.
// Prevents arbitrary object traversal, prototype inspection, and secret leakage.

import { CONFIGURABLE_EVENT_REGISTRY } from './event-registry';

export interface VariableDefinition {
  token: string;
  description: string;
  source: string;
  type: 'string' | 'number' | 'money';
  example: string;
}

export const GLOBAL_STORE_VARIABLES: Record<string, VariableDefinition> = {
  storeName: {
    token: 'storeName',
    description: 'Nom commercial de la boutique',
    source: 'StoreSettingsService',
    type: 'string',
    example: 'HamzaPhone',
  },
  supportPhone: {
    token: 'supportPhone',
    description: 'Numéro de téléphone du service client',
    source: 'StoreSettingsService',
    type: 'string',
    example: '0550 12 34 56',
  },
  supportEmail: {
    token: 'supportEmail',
    description: 'Email officiel du support',
    source: 'StoreSettingsService',
    type: 'string',
    example: 'contact@dripidin.dz',
  },
  currency: {
    token: 'currency',
    description: 'Symbole ou code de devise de la boutique',
    source: 'StoreSettingsService',
    type: 'string',
    example: 'DA',
  },
};

export const CONTEXT_VARIABLES: Record<string, VariableDefinition> = {
  customerName: {
    token: 'customerName',
    description: 'Nom complet du client',
    source: 'Order / Profile Entity',
    type: 'string',
    example: 'Karim Boudiaf',
  },
  customerPhone: {
    token: 'customerPhone',
    description: 'Numéro de téléphone du destinataire',
    source: 'Order / Profile Entity',
    type: 'string',
    example: '0555 11 22 33',
  },
  orderNumber: {
    token: 'orderNumber',
    description: 'Numéro de commande normalisé',
    source: 'Order Entity',
    type: 'string',
    example: 'HP-2026-004921',
  },
  total: {
    token: 'total',
    description: 'Montant total formaté avec devise',
    source: 'MoneyFormatter',
    type: 'money',
    example: '18 500 DA',
  },
  subtotal: {
    token: 'subtotal',
    description: 'Sous-total des articles hors livraison',
    source: 'MoneyFormatter',
    type: 'money',
    example: '17 700 DA',
  },
  shippingCost: {
    token: 'shippingCost',
    description: 'Frais de livraison formatés',
    source: 'MoneyFormatter',
    type: 'money',
    example: '800 DA',
  },
  trackingNumber: {
    token: 'trackingNumber',
    description: 'Numéro de suivi du colis transporteur',
    source: 'Logistics Record',
    type: 'string',
    example: 'ECO-ALG-992144',
  },
  courierName: {
    token: 'courierName',
    description: 'Nom commercial du transporteur',
    source: 'Logistics Record',
    type: 'string',
    example: 'EcoTrack Express',
  },
  trackingUrl: {
    token: 'trackingUrl',
    description: 'Lien direct vers la page de suivi du colis',
    source: 'Logistics Record',
    type: 'string',
    example: 'https://dripidin.dz/track-order?ref=ECO-ALG-992144',
  },
  wilayaName: {
    token: 'wilayaName',
    description: 'Nom de la Wilaya de destination',
    source: 'Order Entity',
    type: 'string',
    example: 'Oran',
  },
  deliveryAddress: {
    token: 'deliveryAddress',
    description: 'Adresse complète de livraison',
    source: 'Order Entity',
    type: 'string',
    example: 'Cité 500 Logements, Bâtiment B, Oran',
  },
  sku: {
    token: 'sku',
    description: 'Code SKU du produit',
    source: 'Inventory Entity',
    type: 'string',
    example: 'SKU-SAM-S22U-OLED',
  },
  productName: {
    token: 'productName',
    description: 'Nom ou désignation du produit',
    source: 'Product Entity',
    type: 'string',
    example: 'Écran OLED Samsung S22 Ultra',
  },
  availableStock: {
    token: 'availableStock',
    description: 'Quantité de stock disponible actuelle',
    source: 'Inventory Entity',
    type: 'number',
    example: '2',
  },
  threshold: {
    token: 'threshold',
    description: 'Seuil d\'alerte de stock bas',
    source: 'Inventory Entity',
    type: 'number',
    example: '5',
  },
  businessName: {
    token: 'businessName',
    description: 'Raison sociale de l\'atelier ou entreprise B2B',
    source: 'B2B Entity',
    type: 'string',
    example: 'Belfort Fix Tech',
  },
  adminUrl: {
    token: 'adminUrl',
    description: 'Lien vers le tableau de bord B2B',
    source: 'System Settings',
    type: 'string',
    example: 'https://dripidin.dz/account/business',
  },
  cancellationReason: {
    token: 'cancellationReason',
    description: 'Motif d\'annulation de la commande',
    source: 'Order Entity',
    type: 'string',
    example: 'Rupture temporaire chez le fournisseur',
  },
  returnReason: {
    token: 'returnReason',
    description: 'Motif de retour du colis',
    source: 'Delivery Entity',
    type: 'string',
    example: 'Client injoignable après 3 tentatives',
  },
  failureReason: {
    token: 'failureReason',
    description: 'Motif de l\'échec de distribution',
    source: 'Delivery Entity',
    type: 'string',
    example: 'Adresse introuvable',
  },
  deliveredAt: {
    token: 'deliveredAt',
    description: 'Date et heure de livraison',
    source: 'Delivery Entity',
    type: 'string',
    example: '22/09/2026 à 14:30',
  },
  itemCount: {
    token: 'itemCount',
    description: 'Nombre d\'articles dans la commande',
    source: 'Order Entity',
    type: 'number',
    example: '3',
  },
  deliveryType: {
    token: 'deliveryType',
    description: 'Mode de livraison (À domicile / Stopdesk)',
    source: 'Order Entity',
    type: 'string',
    example: 'À domicile',
  },
  driverPhone: {
    token: 'driverPhone',
    description: 'Numéro de téléphone du livreur',
    source: 'Delivery Entity',
    type: 'string',
    example: '0661 99 88 77',
  },
  discountTier: {
    token: 'discountTier',
    description: 'Niveau de remise B2B accordé',
    source: 'B2B Entity',
    type: 'string',
    example: 'Grossiste Bronze (-15%)',
  },
  rejectionReason: {
    token: 'rejectionReason',
    description: 'Motif du refus du compte B2B',
    source: 'B2B Entity',
    type: 'string',
    example: 'Numéro de registre du commerce invalide',
  },
};

/**
 * Returns the full set of allowed variable tokens for a given event.
 * Combines global store variables with the event's required and optional variables.
 */
export function getAllowedTokensForEvent(eventType: string): Set<string> {
  const allowed = new Set<string>(Object.keys(GLOBAL_STORE_VARIABLES));
  const def = CONFIGURABLE_EVENT_REGISTRY[eventType];
  if (def) {
    for (const v of def.requiredVariables) allowed.add(v);
    for (const v of def.optionalVariables) allowed.add(v);
  }
  return allowed;
}

/**
 * Validates whether a token is allowed for a specific event.
 */
export function isValidTokenForEvent(token: string, eventType: string): boolean {
  return getAllowedTokensForEvent(eventType).has(token);
}

/**
 * Returns variable definitions available for display in the template editor.
 */
export function getVariableDefinitionsForEvent(eventType: string): VariableDefinition[] {
  const allowed = getAllowedTokensForEvent(eventType);
  const result: VariableDefinition[] = [];

  for (const token of allowed) {
    if (GLOBAL_STORE_VARIABLES[token]) {
      result.push(GLOBAL_STORE_VARIABLES[token]);
    } else if (CONTEXT_VARIABLES[token]) {
      result.push(CONTEXT_VARIABLES[token]);
    } else {
      result.push({
        token,
        description: `Variable ${token}`,
        source: 'Context Payload',
        type: 'string',
        example: `[${token}]`,
      });
    }
  }

  return result;
}

/**
 * Deterministic synthetic preview data for safe Template Editor live preview.
 * Strictly free of real customer PII.
 */
export const SAMPLE_PREVIEW_DATA: Record<string, string | number> = {
  storeName: 'Dripidin Phoneparts',
  supportPhone: '+213 550 12 34 56',
  supportEmail: 'contact@dripidin.dz',
  currency: 'DA',
  customerName: 'Karim Boudiaf',
  customerPhone: '+213 661 23 45 67',
  orderNumber: 'CMD-2026-0892',
  total: '18 500 DA',
  subtotal: '17 700 DA',
  shippingCost: '800 DA',
  itemCount: 3,
  deliveryType: 'HOME_DELIVERY',
  wilayaName: 'Alger',
  deliveryAddress: '14 Rue Didouche Mourad, Alger Centre',
  trackingNumber: 'ECO-ALG-99824',
  courierName: 'EcoTrack Algérie',
  trackingUrl: 'https://ecotrack.dz/tracking/ECO-ALG-99824',
  estimatedDeliveryDays: 2,
  paymentMethod: 'CASH_ON_DELIVERY',
  amount: '18 500 DA',
  discrepancyAmount: '500 DA',
  sku: 'ECR-IP13P-ORG',
  productName: 'Écran OLED iPhone 13 Pro Reconditionné',
  availableStock: 2,
  threshold: 5,
  warehouseName: 'Dépôt Central Belfort',
  warehouseBin: 'B-04-A',
  lastSupplier: 'Belfort Electronics',
  businessName: 'Atelier Réparation Express',
  companyName: 'Atelier Réparation Express',
  discountTier: 'Grossiste B2B VIP (-15%)',
  adminUrl: 'https://dripidin.dz/admin/b2b',
  rejectionReason: 'Registre de commerce incomplet',
  cancellationReason: 'Demande client avant expédition',
  returnReason: 'Client absent après 3 tentatives de livraison',
  failureReason: 'Numéro de téléphone injoignable',
  driverPhone: '+213 551 98 76 54',
  deliveredAt: '22/09/2026 15:45',
  otpCode: '849201',
  verificationUrl: 'https://dripidin.dz/auth/verify?token=preview-test',
  resetUrl: 'https://dripidin.dz/auth/reset?token=preview-test',
  ipAddress: '105.101.44.12',
  loginTime: '22/09/2026 14:32',
};
