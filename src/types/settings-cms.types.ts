// HamzaPhone Global Website Settings & Structured CMS Types

export interface WebsiteSettings {
  // General Identity & Store
  storeName: string;
  logoUrl: string;
  faviconUrl: string;
  supportEmail: string;
  supportPhone: string;
  whatsappPhone: string;
  addressLine: string;
  commune: string;
  wilayaCode: number;
  wilayaName: string;
  openingHours: string;

  // Social Links
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  telegramUrl: string;

  // SEO & OpenGraph
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogImageUrl: string;

  // Storefront Trust & Messaging
  announcementBarEnabled: boolean;
  announcementBarText: string;
  announcementBarLink: string;
  deliveryBadgeText: string;
  paymentBadgeText: string;
  warrantyBadgeText: string;
  supportBadgeText: string;
  returnPolicyText: string;
  footerCopyrightText: string;
  footerDescription: string;
  coverageWilayasCount: number;

  // Metadata
  version: number;
  updatedAt: string;
  updatedBy: string;
}

export interface SettingsHistoryItem {
  id: string;
  version: number;
  changedBy: string;
  changedAt: string;
  changesSummary: string;
  previousSettings: Partial<WebsiteSettings>;
  updatedSettings: Partial<WebsiteSettings>;
}

export interface HomepageSection {
  id: string;
  sectionKey: string;
  name: string;
  enabled: boolean;
  orderIndex: number;
  title: string;
  subtitle: string;
  content?: string;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  badgeText?: string | null;
  metadata?: Record<string, any>;
  updatedAt: string;
  updatedBy: string;
}

export interface UpdateWebsiteSettingsInput {
  storeName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  whatsappPhone?: string;
  addressLine?: string;
  commune?: string;
  wilayaCode?: number;
  wilayaName?: string;
  openingHours?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  telegramUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImageUrl?: string;
  announcementBarEnabled?: boolean;
  announcementBarText?: string;
  announcementBarLink?: string;
  deliveryBadgeText?: string;
  paymentBadgeText?: string;
  warrantyBadgeText?: string;
  supportBadgeText?: string;
  returnPolicyText?: string;
  footerCopyrightText?: string;
  footerDescription?: string;
  coverageWilayasCount?: number;
}

export interface UpdateHomepageSectionInput {
  name?: string;
  enabled?: boolean;
  orderIndex?: number;
  title?: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  badgeText?: string | null;
  metadata?: Record<string, any>;
}

export interface ReorderHomepageSectionsInput {
  orderedSectionIds: string[];
}
