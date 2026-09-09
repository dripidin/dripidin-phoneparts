// DRIPIDIN Store Settings Domain Types
// Authoritative TypeScript interfaces for persistent database-backed store configuration.

export interface StoreSettings {
  // Singleton identifier
  id: string;

  // 1. Store Identity
  storeName: string;
  legalName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  ogImageUrl: string;

  // 2. Contact Information & Physical Headquarters
  supportEmail: string;
  supportPhone: string;
  whatsappPhone: string;
  addressLine: string;
  cityCommune: string;
  commune: string; // Compatibility alias for cityCommune
  wilayaCode: number;
  wilayaName: string; // Enriched/resolved representation
  openingHours: string;

  // 3. Social Channels
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  telegramUrl: string;

  // 4. Localization & Regional Defaults
  defaultCountryCode: string;
  defaultLocale: string;
  currencyCode: string;
  currencySymbol: string;
  currencyDecimals: number;
  timezone: string;

  // 5. Branding & Visual Design Tokens
  primaryColor: string;
  primaryColorHover: string;
  accentColor: string;
  backgroundColor: string;
  foregroundColor: string;
  borderColor: string;
  fontFamily: string;
  borderRadiusToken: string;

  // 6. Commerce Core Defaults (Store-level only)
  orderPrefix: string;
  invoicePrefix: string;
  proformaPrefix: string;
  defaultCourierCode: string;
  freeShippingThresholdDzd: number | null;
  taxRatePercent: number;

  // 7. Legal & Fiscal Credentials (Displayed on Invoices/B2B Proformas)
  taxRegistrationNumber: string; // NIF
  tradeRegisterNumber: string;   // RC
  statisticalIdNumber: string;   // NIS
  taxArticleNumber: string;      // Article d'Imposition

  // 8. Storefront Feature Toggles
  enableB2bWholesale: boolean;
  enableGuestCheckout: boolean;
  enableWhatsappOrdering: boolean;
  enableProductReviews: boolean;
  enableAnnouncementBar: boolean;
  announcementBarEnabled: boolean; // Compatibility alias for enableAnnouncementBar
  forceDemoMode: boolean;

  // 9. Storefront Badges & Trust Messaging
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

  // 10. SEO Defaults
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;

  // 11. Developer Platform Attribution (Separate from Store Identity)
  developerName: string;
  developerUrl: string;
  platformVersion: string;
  displayDeveloperBadge: boolean;

  // 12. Versioning & Audit Metadata
  version: number;
  customMetadata: Record<string, any>;
  updatedAt: string;
  updatedBy: string | null;
}

export interface UpdateStoreSettingsInput {
  // Store Identity
  storeName?: string;
  legalName?: string;
  tagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
  ogImageUrl?: string;

  // Contact & Location
  supportEmail?: string;
  supportPhone?: string;
  whatsappPhone?: string;
  addressLine?: string;
  cityCommune?: string;
  commune?: string; // Compatibility alias
  wilayaCode?: number;
  wilayaName?: string;
  openingHours?: string;

  // Social
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  telegramUrl?: string;

  // Localization
  defaultCountryCode?: string;
  defaultLocale?: string;
  currencyCode?: string;
  currencySymbol?: string;
  currencyDecimals?: number;
  timezone?: string;

  // Branding Tokens
  primaryColor?: string;
  primaryColorHover?: string;
  accentColor?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  borderColor?: string;
  fontFamily?: string;
  borderRadiusToken?: string;

  // Commerce Defaults
  orderPrefix?: string;
  invoicePrefix?: string;
  proformaPrefix?: string;
  defaultCourierCode?: string;
  freeShippingThresholdDzd?: number | null;
  taxRatePercent?: number;

  // Legal & Fiscal
  taxRegistrationNumber?: string;
  tradeRegisterNumber?: string;
  statisticalIdNumber?: string;
  taxArticleNumber?: string;

  // Feature Toggles
  enableB2bWholesale?: boolean;
  enableGuestCheckout?: boolean;
  enableWhatsappOrdering?: boolean;
  enableProductReviews?: boolean;
  enableAnnouncementBar?: boolean;
  announcementBarEnabled?: boolean; // Compatibility alias
  forceDemoMode?: boolean;

  // Badges & Trust
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

  // SEO Defaults
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;

  // Attribution
  developerName?: string;
  developerUrl?: string;
  platformVersion?: string;
  displayDeveloperBadge?: boolean;

  // Custom Metadata
  customMetadata?: Record<string, any>;
}

// Direct Database Row Type
export interface StoreSettingsDbRow {
  id: string;
  store_name: string;
  legal_name: string | null;
  tagline: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  og_image_url: string | null;
  support_email: string;
  support_phone: string;
  whatsapp_phone: string | null;
  address_line: string | null;
  city_commune: string | null;
  wilaya_code: number | null;
  opening_hours: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  telegram_url: string | null;
  default_country_code: string;
  default_locale: string;
  currency_code: string;
  currency_symbol: string;
  currency_decimals: number;
  timezone: string;
  primary_color: string;
  primary_color_hover: string;
  accent_color: string;
  background_color: string;
  foreground_color: string;
  border_color: string;
  font_family: string;
  border_radius_token: string;
  order_prefix: string;
  invoice_prefix: string;
  proforma_prefix: string;
  default_courier_code: string | null;
  free_shipping_threshold_dzd: number | null;
  tax_rate_percent: number | null;
  tax_registration_number: string | null;
  trade_register_number: string | null;
  statistical_id_number: string | null;
  tax_article_number: string | null;
  enable_b2b_wholesale: boolean;
  enable_guest_checkout: boolean;
  enable_whatsapp_ordering: boolean;
  enable_product_reviews: boolean;
  enable_announcement_bar: boolean;
  force_demo_mode: boolean;
  announcement_bar_text: string | null;
  announcement_bar_link: string | null;
  delivery_badge_text: string | null;
  payment_badge_text: string | null;
  warranty_badge_text: string | null;
  support_badge_text: string | null;
  return_policy_text: string | null;
  footer_copyright_text: string | null;
  footer_description: string | null;
  coverage_wilayas_count: number;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  developer_name: string;
  developer_url: string | null;
  platform_version: string;
  display_developer_badge: boolean;
  version: number;
  custom_metadata: Record<string, any>;
  updated_at: string;
  updated_by: string | null;
}
