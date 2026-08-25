// HamzaPhone Website Settings & Homepage CMS Management Service
// Authoritative, Versioned Configuration Engine with Audit Trail & Cache Revalidation

import type {
  WebsiteSettings,
  SettingsHistoryItem,
  HomepageSection,
  UpdateWebsiteSettingsInput,
  UpdateHomepageSectionInput,
  ReorderHomepageSectionsInput,
} from '@/types/settings-cms.types';
import type { UserAuthContext } from '@/types/rbac.types';

// Persistent In-Memory Settings Store
let activeSettings: WebsiteSettings = {
  storeName: 'HamzaPhone Algérie',
  logoUrl: '/logo.png',
  faviconUrl: '/favicon.ico',
  supportEmail: 'contact@hamzaphone.dz',
  supportPhone: '0550 00 00 00',
  whatsappPhone: '+213550000000',
  addressLine: 'Belfort, Rue des Frères Bouadou, Centre Commercial',
  commune: 'El Harrach',
  wilayaCode: 16,
  wilayaName: 'Alger',
  openingHours: 'Samedi - Jeudi : 08h30 - 18h00',

  facebookUrl: 'https://facebook.com/hamzaphone.dz',
  instagramUrl: 'https://instagram.com/hamzaphone.dz',
  tiktokUrl: 'https://tiktok.com/@hamzaphone.dz',
  youtubeUrl: 'https://youtube.com/@hamzaphonedz',
  telegramUrl: 'https://t.me/hamzaphonedz',

  metaTitle: 'HamzaPhone — N°1 des Pièces Détachées Smartphones en Algérie (58 Wilayas)',
  metaDescription:
    'Écrans OLED Samsung & iPhone, batteries haute capacité, connecteurs de charge, outillage professionnel. Vente en gros & détail avec livraison 58 Wilayas COD.',
  metaKeywords:
    'pièces détachées smartphone, écran samsung, écran iphone, batterie originale, belfort alger, ecotrack 58 wilayas, grossiste b2b',
  ogImageUrl: '/og-image.jpg',

  announcementBarEnabled: true,
  announcementBarText:
    '🚚 Livraison Express 58 Wilayas disponible avec EcoTrack | Tarifs de gros pour ateliers de réparation B2B',
  announcementBarLink: '/register?type=b2b',
  deliveryBadgeText: 'Livraison 58 Wilayas en 24h/48h',
  paymentBadgeText: 'Paiement à la Livraison (COD)',
  warrantyBadgeText: 'Pièces 100% Testées & Garanties',
  supportBadgeText: 'Espace Grossiste B2B & Ateliers',
  returnPolicyText: 'Échange garanti sous 48h en cas de non-conformité pour les comptes professionnels.',
  footerCopyrightText: '© 2026 HamzaPhone Algérie. Tous droits réservés. N°1 de la pièce détachée smartphone en Algérie.',
  footerDescription:
    'Leader algérien de la distribution de pièces détachées smartphone, écrans OLED, batteries haute capacité et outillage professionnel de réparation. Belfort, El Harrach, Alger.',
  coverageWilayasCount: 58,

  version: 1,
  updatedAt: new Date().toISOString(),
  updatedBy: 'system@hamzaphone.dz',
};

// Version History Store
const settingsHistoryStore: SettingsHistoryItem[] = [
  {
    id: 'hist-001',
    version: 1,
    changedBy: 'system@hamzaphone.dz',
    changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    changesSummary: 'Configuration initiale de la boutique HamzaPhone Algérie.',
    previousSettings: {},
    updatedSettings: { ...activeSettings },
  },
];

// Structured Homepage Sections
let homepageSectionsStore: HomepageSection[] = [
  {
    id: 'sec-hero',
    sectionKey: 'hero',
    name: 'Bannière Héro & Barre de Recherche Immédiate',
    enabled: true,
    orderIndex: 1,
    title: 'Toutes vos Pièces Smartphones, Livrées en 48h dans 58 Wilayas.',
    subtitle:
      'Écrans OLED, batteries originales, connecteurs et outillage professionnel. Stock réel garanti pour particuliers et ateliers de réparation.',
    imageUrl: '/images/hero-banner.webp',
    ctaLabel: 'Explorer tout le catalogue',
    ctaUrl: '/products',
    badgeText: 'N°1 de la pièce détachée smartphone en Algérie',
    updatedAt: new Date().toISOString(),
    updatedBy: 'system@hamzaphone.dz',
  },
  {
    id: 'sec-trust',
    sectionKey: 'trust_badges',
    name: 'Piliers de Réassurance & Garanties',
    enabled: true,
    orderIndex: 2,
    title: 'Garanties & Engagements HamzaPhone',
    subtitle: 'Pourquoi plus de 1 200 ateliers nous font confiance en Algérie.',
    updatedAt: new Date().toISOString(),
    updatedBy: 'system@hamzaphone.dz',
  },
  {
    id: 'sec-categories',
    sectionKey: 'featured_categories',
    name: 'Grille des Catégories de Pièces',
    enabled: true,
    orderIndex: 3,
    title: 'Explorez par Type de Composant',
    subtitle: 'Écrans, batteries, connecteurs, caméras, vitres tactiles et outillage de précision.',
    ctaLabel: 'Voir toutes les catégories',
    ctaUrl: '/products',
    updatedAt: new Date().toISOString(),
    updatedBy: 'system@hamzaphone.dz',
  },
  {
    id: 'sec-featured-products',
    sectionKey: 'featured_products',
    name: 'Rail Produits Populaires & Meilleures Ventes',
    enabled: true,
    orderIndex: 4,
    title: 'Pièces Populaires & Meilleures Ventes',
    subtitle: 'Les écrans OLED, batteries et composants les plus demandés ce mois.',
    badgeText: 'Sélection Top Ventes',
    updatedAt: new Date().toISOString(),
    updatedBy: 'system@hamzaphone.dz',
  },
  {
    id: 'sec-b2b',
    sectionKey: 'b2b_wholesale',
    name: 'Bannière Appel à l’Action Espace Pro B2B',
    enabled: true,
    orderIndex: 5,
    title: 'Vous êtes Réparateur ou Revendeur ? Rejoignez l’Espace Pro B2B',
    subtitle:
      'Bénéficiez de remises grossistes dégressives, facturation proforma et expédition prioritaire dans les 58 Wilayas.',
    ctaLabel: 'Créer un Compte Pro B2B',
    ctaUrl: '/register?type=b2b',
    badgeText: 'Réservé aux Professionnels',
    updatedAt: new Date().toISOString(),
    updatedBy: 'system@hamzaphone.dz',
  },
  {
    id: 'sec-new-arrivals',
    sectionKey: 'new_arrivals',
    name: 'Rail Nouveaux Arrivages en Stock',
    enabled: true,
    orderIndex: 6,
    title: 'Nouveaux Arrivages en Stock',
    subtitle: 'Dernières pièces et accessoires compatibles récemment ajoutés au catalogue.',
    badgeText: 'Arrivages Récents',
    ctaLabel: 'Voir toutes les nouveautés',
    ctaUrl: '/products?sortBy=newest',
    updatedAt: new Date().toISOString(),
    updatedBy: 'system@hamzaphone.dz',
  },
  {
    id: 'sec-brands',
    sectionKey: 'brands',
    name: 'Bandeau des Marques Smartphones Supportées',
    enabled: true,
    orderIndex: 7,
    title: 'Marques Compatibles Prises en Charge',
    subtitle: 'Samsung Galaxy, Apple iPhone, Xiaomi, Redmi, Oppo, Realme, Huawei, Infinix, Tecno.',
    updatedAt: new Date().toISOString(),
    updatedBy: 'system@hamzaphone.dz',
  },
  {
    id: 'sec-reviews',
    sectionKey: 'reviews',
    name: 'Témoignages & Avis d’Ateliers Partenaires',
    enabled: true,
    orderIndex: 8,
    title: 'Ce que disent nos Ateliers Partenaires',
    subtitle: 'Retours d’expérience de réparateurs professionnels à Alger, Oran, Constantine et Sétif.',
    updatedAt: new Date().toISOString(),
    updatedBy: 'system@hamzaphone.dz',
  },
  {
    id: 'sec-delivery',
    sectionKey: 'delivery_coverage',
    name: 'Section Couverture Logistique 58 Wilayas',
    enabled: true,
    orderIndex: 9,
    title: 'Livraison Rapide sur l’Ensemble du Territoire National',
    subtitle: 'Partenariat certifié avec EcoTrack & Yalidine Express pour une livraison à domicile ou en stopdesk.',
    updatedAt: new Date().toISOString(),
    updatedBy: 'system@hamzaphone.dz',
  },
  {
    id: 'sec-faq',
    sectionKey: 'faq',
    name: 'Foire Aux Questions (FAQ)',
    enabled: true,
    orderIndex: 10,
    title: 'Questions Fréquentes sur la Commande & la Garantie',
    subtitle: 'Délais d’expédition, conditions de test des écrans et modalités de paiement à la livraison (COD).',
    updatedAt: new Date().toISOString(),
    updatedBy: 'system@hamzaphone.dz',
  },
];

export class SettingsCmsService {
  /**
   * 1. Get Active Website Settings
   */
  static getWebsiteSettings(): WebsiteSettings {
    return { ...activeSettings };
  }

  /**
   * 2. Update Website Settings with Versioning & Audit Recording
   */
  static updateWebsiteSettings(
    input: UpdateWebsiteSettingsInput,
    authContext: UserAuthContext
  ): WebsiteSettings {
    // Sanitize & Validate input
    if (input.storeName !== undefined && !input.storeName.trim()) {
      throw new Error('Le nom du magasin ne peut pas être vide.');
    }
    if (input.supportPhone !== undefined && !input.supportPhone.trim()) {
      throw new Error('Le numéro de téléphone du support est obligatoire.');
    }

    const previous = { ...activeSettings };
    const newVersion = activeSettings.version + 1;

    activeSettings = {
      ...activeSettings,
      ...input,
      version: newVersion,
      updatedAt: new Date().toISOString(),
      updatedBy: authContext.email,
    };

    // Summarize changes
    const changedKeys = Object.keys(input) as Array<keyof UpdateWebsiteSettingsInput>;
    const summary = `Mise à jour de ${changedKeys.length} paramètre(s) : ${changedKeys.join(', ')}`;

    settingsHistoryStore.unshift({
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      version: newVersion,
      changedBy: authContext.email,
      changedAt: activeSettings.updatedAt,
      changesSummary: summary,
      previousSettings: previous,
      updatedSettings: { ...activeSettings },
    });

    return { ...activeSettings };
  }

  /**
   * 3. Get Settings Version History
   */
  static getSettingsHistory(): SettingsHistoryItem[] {
    return [...settingsHistoryStore];
  }

  /**
   * 4. Get Homepage CMS Sections Ordered by Index
   */
  static getHomepageSections(includeDisabled: boolean = true): HomepageSection[] {
    let list = [...homepageSectionsStore];
    if (!includeDisabled) {
      list = list.filter((s) => s.enabled);
    }
    return list.sort((a, b) => a.orderIndex - b.orderIndex);
  }

  /**
   * 5. Update Homepage CMS Section
   */
  static updateHomepageSection(
    sectionId: string,
    input: UpdateHomepageSectionInput,
    authContext: UserAuthContext
  ): HomepageSection {
    const section = homepageSectionsStore.find((s) => s.id === sectionId);
    if (!section) {
      throw new Error(`Section CMS introuvable: ${sectionId}`);
    }

    if (input.title !== undefined && !input.title.trim()) {
      throw new Error('Le titre de la section ne peut pas être vide.');
    }

    Object.assign(section, {
      ...input,
      updatedAt: new Date().toISOString(),
      updatedBy: authContext.email,
    });

    return { ...section };
  }

  /**
   * 6. Toggle Section Visibility
   */
  static toggleHomepageSection(
    sectionId: string,
    enabled: boolean,
    authContext: UserAuthContext
  ): HomepageSection {
    return this.updateHomepageSection(sectionId, { enabled }, authContext);
  }

  /**
   * 7. Reorder Homepage Sections
   */
  static reorderHomepageSections(
    input: ReorderHomepageSectionsInput,
    authContext: UserAuthContext
  ): HomepageSection[] {
    input.orderedSectionIds.forEach((id, index) => {
      const section = homepageSectionsStore.find((s) => s.id === id);
      if (section) {
        section.orderIndex = index + 1;
        section.updatedAt = new Date().toISOString();
        section.updatedBy = authContext.email;
      }
    });

    return this.getHomepageSections(true);
  }
}
