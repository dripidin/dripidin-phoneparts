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
  storeName: 'DRIPIDIN',
  logoUrl: '/logo.png',
  faviconUrl: '/favicon.ico',
  supportEmail: 'metachagour@gmail.com',
  supportPhone: '+213 793 73 13 10',
  whatsappPhone: '+213 540 09 51 66',
  addressLine: '',
  commune: 'Biskra',
  wilayaCode: 7,
  wilayaName: 'Biskra',
  openingHours: 'Samedi - Jeudi : 09h00 - 19h00',

  facebookUrl: 'https://www.facebook.com/dripidin/',
  instagramUrl: 'https://www.instagram.com/dripidin/',
  tiktokUrl: '',
  youtubeUrl: '',
  telegramUrl: '',

  metaTitle: 'DRIPIDIN — Plateforme E-Commerce & Distribution Mobile en Algérie (58 Wilayas)',
  metaDescription:
    'Boutique en ligne DRIPIDIN : Smartphones, accessoires connectés et produits high-tech en Algérie. Vente en gros & détail avec livraison 58 Wilayas COD.',
  metaKeywords:
    'dripidin, ecommerce algerie, smartphones, accessoires mobile, biskra, ecotrack 58 wilayas, grossiste b2b',
  ogImageUrl: '/og-image.jpg',

  announcementBarEnabled: true,
  announcementBarText:
    '🚚 Livraison Express 58 Wilayas disponible avec EcoTrack | Tarifs de gros pour professionnels B2B',
  announcementBarLink: '/register?type=b2b',
  deliveryBadgeText: 'Livraison 58 Wilayas en 24h/48h',
  paymentBadgeText: 'Paiement à la Livraison (COD)',
  warrantyBadgeText: 'Produits 100% Testés & Certifiés',
  supportBadgeText: 'Espace Grossiste B2B',
  returnPolicyText: 'Échange garanti sous 48h en cas de non-conformité pour les comptes professionnels.',
  footerCopyrightText: '© 2026 DRIPIDIN. Tous droits réservés.',
  footerDescription:
    'Plateforme e-commerce et distribution en Algérie. Présent sur les réseaux sociaux, livraison rapide à domicile et en point relais à travers les 58 Wilayas.',
  coverageWilayasCount: 58,

  version: 1,
  updatedAt: new Date().toISOString(),
  updatedBy: 'metachagour@gmail.com',
};

// Version History Store
const settingsHistoryStore: SettingsHistoryItem[] = [
  {
    id: 'hist-001',
    version: 1,
    changedBy: 'metachagour@gmail.com',
    changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    changesSummary: 'Configuration initiale de la boutique DRIPIDIN Algérie.',
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
    title: 'Smartphones & Équipements Mobiles, Livrés en 48h dans 58 Wilayas.',
    subtitle:
      'Produits de qualité, accessoires connectés et matériel certifié. Stock réel garanti pour particuliers et professionnels.',
    imageUrl: '/images/hero-banner.webp',
    ctaLabel: 'Explorer tout le catalogue',
    ctaUrl: '/products',
    badgeText: 'Plateforme E-Commerce DRIPIDIN',
    updatedAt: new Date().toISOString(),
    updatedBy: 'metachagour@gmail.com',
  },
  {
    id: 'sec-trust',
    sectionKey: 'trust_badges',
    name: 'Piliers de Réassurance & Garanties',
    enabled: true,
    orderIndex: 2,
    title: 'Garanties & Engagements DRIPIDIN',
    subtitle: 'Pourquoi nos clients et partenaires nous font confiance en Algérie.',
    updatedAt: new Date().toISOString(),
    updatedBy: 'metachagour@gmail.com',
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
    updatedBy: 'metachagour@gmail.com',
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
    updatedBy: 'metachagour@gmail.com',
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
    updatedBy: 'metachagour@gmail.com',
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
    updatedBy: 'metachagour@gmail.com',
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
    updatedBy: 'metachagour@gmail.com',
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
    updatedBy: 'metachagour@gmail.com',
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
    updatedBy: 'metachagour@gmail.com',
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
    updatedBy: 'metachagour@gmail.com',
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
