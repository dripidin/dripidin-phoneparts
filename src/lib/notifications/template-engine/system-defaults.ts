// DRIPIDIN Immutable System Default Notification Templates
// Compiled TypeScript fallbacks: guaranteed to exist even if database tables or custom templates are unavailable.
// Neutral wording: Uses dynamic variables {{storeName}}, {{courierName}}, {{supportPhone}} instead of hardcoded brands.

import type { DomainEventType, NotificationChannelType } from '@/types/notifications.types';

export interface SystemTemplatePayload {
  subject?: string;
  bodyText: string;
  bodyHtml?: string;
}

export const SYSTEM_DEFAULT_TEMPLATES: Record<
  string, // key: `${eventType}:${channel}:${locale}`
  SystemTemplatePayload
> = {
  // -------------------------------------------------------------------------
  // 1. order.created
  // -------------------------------------------------------------------------
  'order.created:DASHBOARD:fr-DZ': {
    subject: 'Nouvelle Commande {{orderNumber}}',
    bodyText: 'Nouvelle commande {{orderNumber}} enregistrée pour {{customerName}} d\'un montant de {{total}}.',
  },
  'order.created:SMS:fr-DZ': {
    bodyText: '{{storeName}}: Votre commande {{orderNumber}} de {{total}} est confirmee. Nous preparons votre colis.',
  },
  'order.created:EMAIL:fr-DZ': {
    subject: 'Confirmation de votre commande {{orderNumber}} - {{storeName}}',
    bodyText: 'Bonjour {{customerName}},\n\nNous avons bien reçu votre commande {{orderNumber}} d\'un montant total de {{total}}.\n\nMerci de votre confiance !\nL\'équipe {{storeName}} - {{supportPhone}}',
    bodyHtml: '<div style="font-family:sans-serif;line-height:1.6;color:#333;"><h2 style="color:#f97316;">Confirmation de commande</h2><p>Bonjour <strong>{{customerName}}</strong>,</p><p>Votre commande <strong>#{{orderNumber}}</strong> d\'un montant de <strong>{{total}}</strong> a bien été enregistrée.</p><p>Nous préparons vos articles avec soin.</p><hr style="border:none;border-top:1px solid #eee;margin:20px 0;"/><p style="font-size:12px;color:#777;">{{storeName}} — Contact : {{supportPhone}}</p></div>',
  },

  // -------------------------------------------------------------------------
  // 2. order.confirmed
  // -------------------------------------------------------------------------
  'order.confirmed:DASHBOARD:fr-DZ': {
    subject: 'Commande {{orderNumber}} validée',
    bodyText: 'La commande {{orderNumber}} a été validée par la boutique et est prête pour préparation.',
  },
  'order.confirmed:SMS:fr-DZ': {
    bodyText: '{{storeName}}: Votre commande {{orderNumber}} est validee par notre equipe. Preparation en cours.',
  },

  // -------------------------------------------------------------------------
  // 3. order.processing
  // -------------------------------------------------------------------------
  'order.processing:DASHBOARD:fr-DZ': {
    subject: 'Commande {{orderNumber}} en préparation',
    bodyText: 'Votre commande {{orderNumber}} est actuellement en cours de préparation dans notre entrepôt.',
  },

  // -------------------------------------------------------------------------
  // 4. order.shipped
  // -------------------------------------------------------------------------
  'order.shipped:DASHBOARD:fr-DZ': {
    subject: 'Colis {{orderNumber}} expédié',
    bodyText: 'Le colis pour la commande {{orderNumber}} a été remis au transporteur {{courierName}}. N° Suivi : {{trackingNumber}}.',
  },
  'order.shipped:SMS:fr-DZ': {
    bodyText: '{{storeName}}: Votre colis {{orderNumber}} est expedie via {{courierName}}. N° Suivi: {{trackingNumber}}.',
  },
  'order.shipped:WHATSAPP:fr-DZ': {
    bodyText: 'Bonjour {{customerName}}, votre commande {{orderNumber}} a été expédiée via {{courierName}}. Suivez votre livraison ici : {{trackingUrl}}',
  },

  // -------------------------------------------------------------------------
  // 5. order.delivered
  // -------------------------------------------------------------------------
  'order.delivered:DASHBOARD:fr-DZ': {
    subject: 'Commande {{orderNumber}} livrée',
    bodyText: 'Le colis pour la commande {{orderNumber}} a été remis au client avec succès.',
  },
  'order.delivered:SMS:fr-DZ': {
    bodyText: '{{storeName}}: Votre commande {{orderNumber}} a ete livree. Merci de votre confiance !',
  },
  'order.delivered:EMAIL:fr-DZ': {
    subject: 'Votre commande {{orderNumber}} a été livrée - {{storeName}}',
    bodyText: 'Bonjour {{customerName}},\n\nVotre colis pour la commande {{orderNumber}} a été livré. Nous espérons que vos articles vous apportent entière satisfaction.\n\nCordialement,\n{{storeName}}',
    bodyHtml: '<div style="font-family:sans-serif;line-height:1.6;color:#333;"><h2 style="color:#22c55e;">Commande Livrée !</h2><p>Bonjour <strong>{{customerName}}</strong>,</p><p>Votre colis pour la commande <strong>#{{orderNumber}}</strong> vous a été remis avec succès.</p><p>Merci d\'avoir choisi <strong>{{storeName}}</strong>.</p></div>',
  },

  // -------------------------------------------------------------------------
  // 6. order.cancelled
  // -------------------------------------------------------------------------
  'order.cancelled:DASHBOARD:fr-DZ': {
    subject: 'Commande {{orderNumber}} annulée',
    bodyText: 'La commande {{orderNumber}} a été annulée. Motif : {{cancellationReason}}.',
  },
  'order.cancelled:SMS:fr-DZ': {
    bodyText: '{{storeName}}: Votre commande {{orderNumber}} a ete annulee. Contactez le {{supportPhone}} pour toute information.',
  },
  'order.cancelled:EMAIL:fr-DZ': {
    subject: 'Notification d\'annulation : Commande {{orderNumber}}',
    bodyText: 'Bonjour {{customerName}},\n\nVotre commande {{orderNumber}} a été annulée pour la raison suivante : {{cancellationReason}}.\n\nNotre équipe reste à votre disposition au {{supportPhone}}.\n\n{{storeName}}',
    bodyHtml: '<div style="font-family:sans-serif;line-height:1.6;color:#333;"><h2 style="color:#ef4444;">Commande Annulée</h2><p>Bonjour <strong>{{customerName}}</strong>,</p><p>Votre commande <strong>#{{orderNumber}}</strong> a été annulée.</p><p><em>Motif : {{cancellationReason}}</em></p><p>N\'hésitez pas à nous contacter au {{supportPhone}}.</p></div>',
  },

  // -------------------------------------------------------------------------
  // 7. order.returned
  // -------------------------------------------------------------------------
  'order.returned:DASHBOARD:fr-DZ': {
    subject: 'Retour colis enregistré : Commande {{orderNumber}}',
    bodyText: 'Le colis pour la commande {{orderNumber}} a été retourné à l\'entrepôt. Motif : {{returnReason}}.',
  },
  'order.returned:SMS:fr-DZ': {
    bodyText: '{{storeName}}: Votre colis {{orderNumber}} n\'a pas pu etre livre et a ete retourne a notre entrepot.',
  },

  // -------------------------------------------------------------------------
  // 8. shipment.in_transit
  // -------------------------------------------------------------------------
  'shipment.in_transit:DASHBOARD:fr-DZ': {
    subject: 'Colis {{orderNumber}} en transit',
    bodyText: 'Le colis {{orderNumber}} est en cours d\'acheminement vers le centre de distribution de {{wilayaName}}.',
  },
  'shipment.in_transit:SMS:fr-DZ': {
    bodyText: '{{storeName}}: Votre colis {{orderNumber}} est en transit vers {{wilayaName}}. Suivi: {{trackingNumber}}.',
  },

  // -------------------------------------------------------------------------
  // 9. shipment.out_for_delivery
  // -------------------------------------------------------------------------
  'shipment.out_for_delivery:DASHBOARD:fr-DZ': {
    subject: 'Colis {{orderNumber}} en cours de livraison',
    bodyText: 'Le livreur {{courierName}} est en route pour vous livrer la commande {{orderNumber}}.',
  },
  'shipment.out_for_delivery:SMS:fr-DZ': {
    bodyText: '{{storeName}}: Votre livreur est en route avec votre commande {{orderNumber}}. Montant COD a preparer: {{total}}.',
  },
  'shipment.out_for_delivery:WHATSAPP:fr-DZ': {
    bodyText: 'Bonjour {{customerName}}, votre commande {{orderNumber}} est en cours de livraison aujourd\'hui. Veuillez préparer le montant de {{total}} pour le livreur.',
  },

  // -------------------------------------------------------------------------
  // 10. shipment.failed
  // -------------------------------------------------------------------------
  'shipment.failed:DASHBOARD:fr-DZ': {
    subject: 'Échec de livraison : Commande {{orderNumber}}',
    bodyText: 'La tentative de livraison pour la commande {{orderNumber}} a échoué. Motif : {{failureReason}}.',
  },
  'shipment.failed:SMS:fr-DZ': {
    bodyText: '{{storeName}}: La livraison de votre commande {{orderNumber}} a echoue ({{failureReason}}). Contactez-nous: {{supportPhone}}.',
  },

  // -------------------------------------------------------------------------
  // 11. inventory.low_stock
  // -------------------------------------------------------------------------
  'inventory.low_stock:DASHBOARD:fr-DZ': {
    subject: 'Alerte Stock Bas : {{productName}}',
    bodyText: 'Le stock pour {{productName}} (SKU: {{sku}}) est tombé à {{availableStock}} unités (seuil : {{threshold}}).',
  },
  'inventory.low_stock:TELEGRAM:fr-DZ': {
    bodyText: '⚠️ ALERTE STOCK BAS\nProduit: {{productName}}\nSKU: {{sku}}\nStock restant: {{availableStock}} (Seuil: {{threshold}})\nBoutique: {{storeName}}',
  },

  // -------------------------------------------------------------------------
  // 12. inventory.out_of_stock
  // -------------------------------------------------------------------------
  'inventory.out_of_stock:DASHBOARD:fr-DZ': {
    subject: 'RUPTURE DE STOCK : {{productName}}',
    bodyText: 'Le produit {{productName}} (SKU: {{sku}}) est désormais en rupture totale de stock (0 unité).',
  },
  'inventory.out_of_stock:TELEGRAM:fr-DZ': {
    bodyText: '🚨 RUPTURE DE STOCK IMMÉDIATE\nProduit: {{productName}}\nSKU: {{sku}}\nStock: 0\nRéapprovisionnement requis pour {{storeName}} !',
  },

  // -------------------------------------------------------------------------
  // 13. b2b.application_received
  // -------------------------------------------------------------------------
  'b2b.application_received:DASHBOARD:fr-DZ': {
    subject: 'Nouvelle demande grossiste B2B : {{businessName}}',
    bodyText: 'L\'établissement {{businessName}} représenté par {{customerName}} a soumis son dossier de compte grossiste B2B.',
  },
  'b2b.application_received:EMAIL:fr-DZ': {
    subject: 'Accusé de réception - Demande Compte B2B {{storeName}}',
    bodyText: 'Bonjour {{customerName}},\n\nNous avons bien reçu votre demande de compte grossiste pour l\'établissement {{businessName}}.\n\nNotre équipe examine actuellement vos justificatifs légaux.\n\nCordialement,\n{{storeName}}',
    bodyHtml: '<div style="font-family:sans-serif;line-height:1.6;color:#333;"><h2 style="color:#f97316;">Demande de Compte Grossiste B2B Reçue</h2><p>Bonjour <strong>{{customerName}}</strong>,</p><p>Votre dossier pour l\'établissement <strong>{{businessName}}</strong> est en cours d\'examen par nos gestionnaires.</p><p>Nous vous répondrons dans les plus brefs délais.</p><hr/><p>{{storeName}}</p></div>',
  },

  // -------------------------------------------------------------------------
  // 14. b2b.approved
  // -------------------------------------------------------------------------
  'b2b.approved:DASHBOARD:fr-DZ': {
    subject: 'Compte B2B approuvé : {{businessName}}',
    bodyText: 'Le compte grossiste pour {{businessName}} a été approuvé avec succès.',
  },
  'b2b.approved:WHATSAPP:fr-DZ': {
    bodyText: 'Félicitations {{customerName}} ! Votre compte grossiste B2B pour {{businessName}} a été validé sur {{storeName}}. Vos tarifs professionnels sont actifs : {{adminUrl}}',
  },
  'b2b.approved:EMAIL:fr-DZ': {
    subject: 'Validation de votre compte Grossiste B2B - {{storeName}}',
    bodyText: 'Bonjour {{customerName}},\n\nNous avons le plaisir de vous informer que votre compte grossiste B2B pour {{businessName}} a été approuvé.\n\nAccédez à vos remises exclusives sur : {{adminUrl}}\n\nBienvenue,\nL\'équipe {{storeName}}',
    bodyHtml: '<div style="font-family:sans-serif;line-height:1.6;color:#333;"><h2 style="color:#22c55e;">Compte Grossiste B2B Validé !</h2><p>Bonjour <strong>{{customerName}}</strong>,</p><p>Votre atelier <strong>{{businessName}}</strong> bénéficie désormais des tarifs grossistes sur <strong>{{storeName}}</strong>.</p><p><a href="{{adminUrl}}" style="background:#f97316;color:white;padding:10px 18px;text-decoration:none;border-radius:6px;display:inline-block;">Accéder au Catalogue B2B</a></p></div>',
  },

  // -------------------------------------------------------------------------
  // 15. b2b.rejected
  // -------------------------------------------------------------------------
  'b2b.rejected:DASHBOARD:fr-DZ': {
    subject: 'Demande B2B non retenue : {{businessName}}',
    bodyText: 'La demande de compte grossiste pour {{businessName}} a été refusée. Motif : {{rejectionReason}}.',
  },
  'b2b.rejected:EMAIL:fr-DZ': {
    subject: 'Information relative à votre demande B2B - {{storeName}}',
    bodyText: 'Bonjour {{customerName}},\n\nVotre demande de compte grossiste B2B pour {{businessName}} n\'a pas pu être validée pour le motif suivant : {{rejectionReason}}.\n\nPour toute réclamation : {{supportEmail}}.\n\n{{storeName}}',
    bodyHtml: '<div style="font-family:sans-serif;line-height:1.6;color:#333;"><h2>Information concernant votre demande B2B</h2><p>Bonjour <strong>{{customerName}}</strong>,</p><p>Votre dossier pour <strong>{{businessName}}</strong> n\'a pas pu être accepté.</p><p><em>Motif : {{rejectionReason}}</em></p><p>Contactez le support au {{supportEmail}} pour réexaminer votre dossier.</p></div>',
  },
};

/**
 * Retrieves the compiled immutable system default template for an event, channel, and locale.
 */
export function getSystemDefaultTemplate(
  eventType: DomainEventType | string,
  channel: NotificationChannelType,
  locale: string = 'fr-DZ'
): SystemTemplatePayload | undefined {
  // 1. Try exact match (e.g. order.created:SMS:fr-DZ)
  const key = `${eventType}:${channel}:${locale}`;
  if (SYSTEM_DEFAULT_TEMPLATES[key]) {
    return SYSTEM_DEFAULT_TEMPLATES[key];
  }

  // 2. Try default store fallback locale (fr-DZ)
  const fallbackKey = `${eventType}:${channel}:fr-DZ`;
  return SYSTEM_DEFAULT_TEMPLATES[fallbackKey];
}
