// DRIPIDIN Safe Immutable Default Store Settings & Bidirectional Mappers
// Single Source of Truth for Fallback & Database Serialization

import type { StoreSettings, StoreSettingsDbRow, UpdateStoreSettingsInput } from '@/types/settings.types';
import { ALGERIA_WILAYAS } from '@/lib/utils';

export function resolveWilayaName(code?: number | null): string {
  if (!code) return 'Biskra';
  const found = ALGERIA_WILAYAS.find((w) => w.code === code);
  return found ? found.name : `Wilaya ${code.toString().padStart(2, '0')}`;
}

export const DEFAULT_STORE_SETTINGS: Readonly<StoreSettings> = Object.freeze({
  id: 'default',
  storeName: 'DRIPIDIN',
  legalName: 'DRIPIDIN E-Commerce & Distribution SARL',
  tagline: 'Plateforme E-Commerce & Distribution Mobile en Algérie',
  logoUrl: '/logo.png',
  faviconUrl: '/favicon.ico',
  ogImageUrl: '/og-image.jpg',

  supportEmail: 'contact@dripidin.com',
  supportPhone: '+213 793 73 13 10',
  whatsappPhone: '+213 540 09 51 66',
  addressLine: 'Centre Ville',
  cityCommune: 'Biskra',
  commune: 'Biskra',
  wilayaCode: 7,
  wilayaName: 'Biskra',
  openingHours: 'Samedi - Jeudi : 09h00 - 19h00',

  facebookUrl: 'https://www.facebook.com/dripidin/',
  instagramUrl: 'https://www.instagram.com/dripidin/',
  tiktokUrl: '',
  youtubeUrl: '',
  telegramUrl: '',

  defaultCountryCode: 'DZ',
  defaultLocale: 'fr-DZ',
  currencyCode: 'DZD',
  currencySymbol: 'DA',
  currencyDecimals: 0,
  timezone: 'Africa/Algiers',

  primaryColor: '#F97316',
  primaryColorHover: '#EA580C',
  accentColor: '#10B981',
  backgroundColor: '#FFFFFF',
  foregroundColor: '#111827',
  borderColor: '#E5E7EB',
  fontFamily: 'Inter',
  borderRadiusToken: 'rounded-2xl',

  orderPrefix: 'DRP',
  invoicePrefix: 'FAC',
  proformaPrefix: 'PRO',
  defaultCourierCode: 'ECOTRACK',
  freeShippingThresholdDzd: null,
  taxRatePercent: 0,

  taxRegistrationNumber: '',
  tradeRegisterNumber: '',
  statisticalIdNumber: '',
  taxArticleNumber: '',

  enableB2bWholesale: true,
  enableGuestCheckout: true,
  enableWhatsappOrdering: true,
  enableProductReviews: true,
  enableAnnouncementBar: true,
  announcementBarEnabled: true,
  forceDemoMode: false,

  announcementBarText:
    '🚚 Livraison Express 58 Wilayas disponible avec EcoTrack | Tarifs de gros pour professionnels B2B',
  announcementBarLink: '/register?type=b2b',
  deliveryBadgeText: 'Livraison 58 Wilayas en 24h/48h',
  paymentBadgeText: 'Paiement à la Livraison (COD)',
  warrantyBadgeText: 'Produits 100% Testés & Certifiés',
  supportBadgeText: 'Espace Grossiste B2B',
  returnPolicyText:
    'Échange garanti sous 48h en cas de non-conformité pour les comptes professionnels.',
  footerCopyrightText: '© 2026 DRIPIDIN. Tous droits réservés.',
  footerDescription:
    'Plateforme e-commerce et distribution en Algérie. Présent sur les réseaux sociaux, livraison rapide à domicile et en point relais à travers les 58 Wilayas.',
  coverageWilayasCount: 58,

  metaTitle:
    'DRIPIDIN — Plateforme E-Commerce & Distribution Mobile en Algérie (58 Wilayas)',
  metaDescription:
    'Boutique en ligne DRIPIDIN : Smartphones, accessoires connectés et pièces en Algérie. Vente en gros & détail avec livraison 58 Wilayas COD.',
  metaKeywords:
    'dripidin, ecommerce algerie, smartphones, accessoires mobile, biskra, ecotrack 58 wilayas, grossiste b2b',

  developerName: 'DRIPIDIN Platform',
  developerUrl: 'https://dripidin.com',
  platformVersion: '1.0.0',
  displayDeveloperBadge: false,

  version: 1,
  customMetadata: {},
  updatedAt: '2026-09-09T00:00:00.000Z',
  updatedBy: null,
});

/**
 * Maps a raw database row from public.store_settings into the domain StoreSettings model.
 */
export function mapRowToStoreSettings(row: any): StoreSettings {
  if (!row) {
    return { ...DEFAULT_STORE_SETTINGS };
  }

  const wilayaCode = typeof row.wilaya_code === 'number' ? row.wilaya_code : DEFAULT_STORE_SETTINGS.wilayaCode;
  const cityCommune = row.city_commune ?? DEFAULT_STORE_SETTINGS.cityCommune;
  const enableAnnouncementBar = typeof row.enable_announcement_bar === 'boolean'
    ? row.enable_announcement_bar
    : DEFAULT_STORE_SETTINGS.enableAnnouncementBar;

  return {
    id: row.id || 'default',
    storeName: row.store_name ?? DEFAULT_STORE_SETTINGS.storeName,
    legalName: row.legal_name ?? DEFAULT_STORE_SETTINGS.legalName,
    tagline: row.tagline ?? DEFAULT_STORE_SETTINGS.tagline,
    logoUrl: row.logo_url ?? DEFAULT_STORE_SETTINGS.logoUrl,
    faviconUrl: row.favicon_url ?? DEFAULT_STORE_SETTINGS.faviconUrl,
    ogImageUrl: row.og_image_url ?? DEFAULT_STORE_SETTINGS.ogImageUrl,

    supportEmail: row.support_email ?? DEFAULT_STORE_SETTINGS.supportEmail,
    supportPhone: row.support_phone ?? DEFAULT_STORE_SETTINGS.supportPhone,
    whatsappPhone: row.whatsapp_phone ?? DEFAULT_STORE_SETTINGS.whatsappPhone,
    addressLine: row.address_line ?? DEFAULT_STORE_SETTINGS.addressLine,
    cityCommune,
    commune: cityCommune,
    wilayaCode,
    wilayaName: resolveWilayaName(wilayaCode),
    openingHours: row.opening_hours ?? DEFAULT_STORE_SETTINGS.openingHours,

    facebookUrl: row.facebook_url ?? DEFAULT_STORE_SETTINGS.facebookUrl,
    instagramUrl: row.instagram_url ?? DEFAULT_STORE_SETTINGS.instagramUrl,
    tiktokUrl: row.tiktok_url ?? DEFAULT_STORE_SETTINGS.tiktokUrl,
    youtubeUrl: row.youtube_url ?? DEFAULT_STORE_SETTINGS.youtubeUrl,
    telegramUrl: row.telegram_url ?? DEFAULT_STORE_SETTINGS.telegramUrl,

    defaultCountryCode: row.default_country_code ?? DEFAULT_STORE_SETTINGS.defaultCountryCode,
    defaultLocale: row.default_locale ?? DEFAULT_STORE_SETTINGS.defaultLocale,
    currencyCode: row.currency_code ?? DEFAULT_STORE_SETTINGS.currencyCode,
    currencySymbol: row.currency_symbol ?? DEFAULT_STORE_SETTINGS.currencySymbol,
    currencyDecimals: typeof row.currency_decimals === 'number'
      ? row.currency_decimals
      : DEFAULT_STORE_SETTINGS.currencyDecimals,
    timezone: row.timezone ?? DEFAULT_STORE_SETTINGS.timezone,

    primaryColor: row.primary_color ?? DEFAULT_STORE_SETTINGS.primaryColor,
    primaryColorHover: row.primary_color_hover ?? DEFAULT_STORE_SETTINGS.primaryColorHover,
    accentColor: row.accent_color ?? DEFAULT_STORE_SETTINGS.accentColor,
    backgroundColor: row.background_color ?? DEFAULT_STORE_SETTINGS.backgroundColor,
    foregroundColor: row.foreground_color ?? DEFAULT_STORE_SETTINGS.foregroundColor,
    borderColor: row.border_color ?? DEFAULT_STORE_SETTINGS.borderColor,
    fontFamily: row.font_family ?? DEFAULT_STORE_SETTINGS.fontFamily,
    borderRadiusToken: row.border_radius_token ?? DEFAULT_STORE_SETTINGS.borderRadiusToken,

    orderPrefix: row.order_prefix ?? DEFAULT_STORE_SETTINGS.orderPrefix,
    invoicePrefix: row.invoice_prefix ?? DEFAULT_STORE_SETTINGS.invoicePrefix,
    proformaPrefix: row.proforma_prefix ?? DEFAULT_STORE_SETTINGS.proformaPrefix,
    defaultCourierCode: row.default_courier_code ?? DEFAULT_STORE_SETTINGS.defaultCourierCode,
    freeShippingThresholdDzd: row.free_shipping_threshold_dzd !== null && row.free_shipping_threshold_dzd !== undefined
      ? Number(row.free_shipping_threshold_dzd)
      : null,
    taxRatePercent: typeof row.tax_rate_percent === 'number'
      ? row.tax_rate_percent
      : (row.tax_rate_percent ? Number(row.tax_rate_percent) : DEFAULT_STORE_SETTINGS.taxRatePercent),

    taxRegistrationNumber: row.tax_registration_number ?? DEFAULT_STORE_SETTINGS.taxRegistrationNumber,
    tradeRegisterNumber: row.trade_register_number ?? DEFAULT_STORE_SETTINGS.tradeRegisterNumber,
    statisticalIdNumber: row.statistical_id_number ?? DEFAULT_STORE_SETTINGS.statisticalIdNumber,
    taxArticleNumber: row.tax_article_number ?? DEFAULT_STORE_SETTINGS.taxArticleNumber,

    enableB2bWholesale: typeof row.enable_b2b_wholesale === 'boolean'
      ? row.enable_b2b_wholesale
      : DEFAULT_STORE_SETTINGS.enableB2bWholesale,
    enableGuestCheckout: typeof row.enable_guest_checkout === 'boolean'
      ? row.enable_guest_checkout
      : DEFAULT_STORE_SETTINGS.enableGuestCheckout,
    enableWhatsappOrdering: typeof row.enable_whatsapp_ordering === 'boolean'
      ? row.enable_whatsapp_ordering
      : DEFAULT_STORE_SETTINGS.enableWhatsappOrdering,
    enableProductReviews: typeof row.enable_product_reviews === 'boolean'
      ? row.enable_product_reviews
      : DEFAULT_STORE_SETTINGS.enableProductReviews,
    enableAnnouncementBar,
    announcementBarEnabled: enableAnnouncementBar,
    forceDemoMode: typeof row.force_demo_mode === 'boolean'
      ? row.force_demo_mode
      : DEFAULT_STORE_SETTINGS.forceDemoMode,

    announcementBarText: row.announcement_bar_text ?? DEFAULT_STORE_SETTINGS.announcementBarText,
    announcementBarLink: row.announcement_bar_link ?? DEFAULT_STORE_SETTINGS.announcementBarLink,
    deliveryBadgeText: row.delivery_badge_text ?? DEFAULT_STORE_SETTINGS.deliveryBadgeText,
    paymentBadgeText: row.payment_badge_text ?? DEFAULT_STORE_SETTINGS.paymentBadgeText,
    warrantyBadgeText: row.warranty_badge_text ?? DEFAULT_STORE_SETTINGS.warrantyBadgeText,
    supportBadgeText: row.support_badge_text ?? DEFAULT_STORE_SETTINGS.supportBadgeText,
    returnPolicyText: row.return_policy_text ?? DEFAULT_STORE_SETTINGS.returnPolicyText,
    footerCopyrightText: row.footer_copyright_text ?? DEFAULT_STORE_SETTINGS.footerCopyrightText,
    footerDescription: row.footer_description ?? DEFAULT_STORE_SETTINGS.footerDescription,
    coverageWilayasCount: typeof row.coverage_wilayas_count === 'number'
      ? row.coverage_wilayas_count
      : DEFAULT_STORE_SETTINGS.coverageWilayasCount,

    metaTitle: row.meta_title ?? DEFAULT_STORE_SETTINGS.metaTitle,
    metaDescription: row.meta_description ?? DEFAULT_STORE_SETTINGS.metaDescription,
    metaKeywords: row.meta_keywords ?? DEFAULT_STORE_SETTINGS.metaKeywords,

    developerName: row.developer_name ?? DEFAULT_STORE_SETTINGS.developerName,
    developerUrl: row.developer_url ?? DEFAULT_STORE_SETTINGS.developerUrl,
    platformVersion: row.platform_version ?? DEFAULT_STORE_SETTINGS.platformVersion,
    displayDeveloperBadge: typeof row.display_developer_badge === 'boolean'
      ? row.display_developer_badge
      : DEFAULT_STORE_SETTINGS.displayDeveloperBadge,

    version: typeof row.version === 'number' ? row.version : DEFAULT_STORE_SETTINGS.version,
    customMetadata: row.custom_metadata && typeof row.custom_metadata === 'object'
      ? row.custom_metadata
      : DEFAULT_STORE_SETTINGS.customMetadata,
    updatedAt: row.updated_at ?? DEFAULT_STORE_SETTINGS.updatedAt,
    updatedBy: row.updated_by ?? DEFAULT_STORE_SETTINGS.updatedBy,
  };
}

/**
 * Maps partial update input into snake_case database columns.
 */
export function mapInputToRow(input: UpdateStoreSettingsInput): Record<string, any> {
  const row: Record<string, any> = {};

  if (input.storeName !== undefined) row.store_name = input.storeName.trim();
  if (input.legalName !== undefined) row.legal_name = input.legalName.trim();
  if (input.tagline !== undefined) row.tagline = input.tagline.trim();
  if (input.logoUrl !== undefined) row.logo_url = input.logoUrl;
  if (input.faviconUrl !== undefined) row.favicon_url = input.faviconUrl;
  if (input.ogImageUrl !== undefined) row.og_image_url = input.ogImageUrl;

  if (input.supportEmail !== undefined) row.support_email = input.supportEmail.trim();
  if (input.supportPhone !== undefined) row.support_phone = input.supportPhone.trim();
  if (input.whatsappPhone !== undefined) row.whatsapp_phone = input.whatsappPhone.trim();
  if (input.addressLine !== undefined) row.address_line = input.addressLine.trim();

  // Support both cityCommune and commune aliases
  const communeVal = input.cityCommune !== undefined ? input.cityCommune : input.commune;
  if (communeVal !== undefined) row.city_commune = communeVal.trim();

  if (input.wilayaCode !== undefined) row.wilaya_code = input.wilayaCode;
  if (input.openingHours !== undefined) row.opening_hours = input.openingHours.trim();

  if (input.facebookUrl !== undefined) row.facebook_url = input.facebookUrl.trim();
  if (input.instagramUrl !== undefined) row.instagram_url = input.instagramUrl.trim();
  if (input.tiktokUrl !== undefined) row.tiktok_url = input.tiktokUrl.trim();
  if (input.youtubeUrl !== undefined) row.youtube_url = input.youtubeUrl.trim();
  if (input.telegramUrl !== undefined) row.telegram_url = input.telegramUrl.trim();

  if (input.defaultCountryCode !== undefined) row.default_country_code = input.defaultCountryCode.trim().toUpperCase();
  if (input.defaultLocale !== undefined) row.default_locale = input.defaultLocale.trim();
  if (input.currencyCode !== undefined) row.currency_code = input.currencyCode.trim().toUpperCase();
  if (input.currencySymbol !== undefined) row.currency_symbol = input.currencySymbol.trim();
  if (input.currencyDecimals !== undefined) row.currency_decimals = input.currencyDecimals;
  if (input.timezone !== undefined) row.timezone = input.timezone.trim();

  if (input.primaryColor !== undefined) row.primary_color = input.primaryColor.trim();
  if (input.primaryColorHover !== undefined) row.primary_color_hover = input.primaryColorHover.trim();
  if (input.accentColor !== undefined) row.accent_color = input.accentColor.trim();
  if (input.backgroundColor !== undefined) row.background_color = input.backgroundColor.trim();
  if (input.foregroundColor !== undefined) row.foreground_color = input.foregroundColor.trim();
  if (input.borderColor !== undefined) row.border_color = input.borderColor.trim();
  if (input.fontFamily !== undefined) row.font_family = input.fontFamily.trim();
  if (input.borderRadiusToken !== undefined) row.border_radius_token = input.borderRadiusToken.trim();

  if (input.orderPrefix !== undefined) row.order_prefix = input.orderPrefix.trim().toUpperCase();
  if (input.invoicePrefix !== undefined) row.invoice_prefix = input.invoicePrefix.trim().toUpperCase();
  if (input.proformaPrefix !== undefined) row.proforma_prefix = input.proformaPrefix.trim().toUpperCase();
  if (input.defaultCourierCode !== undefined) row.default_courier_code = input.defaultCourierCode.trim().toUpperCase();
  if (input.freeShippingThresholdDzd !== undefined) row.free_shipping_threshold_dzd = input.freeShippingThresholdDzd;
  if (input.taxRatePercent !== undefined) row.tax_rate_percent = input.taxRatePercent;

  if (input.taxRegistrationNumber !== undefined) row.tax_registration_number = input.taxRegistrationNumber.trim();
  if (input.tradeRegisterNumber !== undefined) row.trade_register_number = input.tradeRegisterNumber.trim();
  if (input.statisticalIdNumber !== undefined) row.statistical_id_number = input.statisticalIdNumber.trim();
  if (input.taxArticleNumber !== undefined) row.tax_article_number = input.taxArticleNumber.trim();

  if (input.enableB2bWholesale !== undefined) row.enable_b2b_wholesale = input.enableB2bWholesale;
  if (input.enableGuestCheckout !== undefined) row.enable_guest_checkout = input.enableGuestCheckout;
  if (input.enableWhatsappOrdering !== undefined) row.enable_whatsapp_ordering = input.enableWhatsappOrdering;
  if (input.enableProductReviews !== undefined) row.enable_product_reviews = input.enableProductReviews;

  // Support both enableAnnouncementBar and announcementBarEnabled
  const annBarVal = input.enableAnnouncementBar !== undefined ? input.enableAnnouncementBar : input.announcementBarEnabled;
  if (annBarVal !== undefined) row.enable_announcement_bar = annBarVal;

  if (input.forceDemoMode !== undefined) row.force_demo_mode = input.forceDemoMode;

  if (input.announcementBarText !== undefined) row.announcement_bar_text = input.announcementBarText;
  if (input.announcementBarLink !== undefined) row.announcement_bar_link = input.announcementBarLink;
  if (input.deliveryBadgeText !== undefined) row.delivery_badge_text = input.deliveryBadgeText;
  if (input.paymentBadgeText !== undefined) row.payment_badge_text = input.paymentBadgeText;
  if (input.warrantyBadgeText !== undefined) row.warranty_badge_text = input.warrantyBadgeText;
  if (input.supportBadgeText !== undefined) row.support_badge_text = input.supportBadgeText;
  if (input.returnPolicyText !== undefined) row.return_policy_text = input.returnPolicyText;
  if (input.footerCopyrightText !== undefined) row.footer_copyright_text = input.footerCopyrightText;
  if (input.footerDescription !== undefined) row.footer_description = input.footerDescription;
  if (input.coverageWilayasCount !== undefined) row.coverage_wilayas_count = input.coverageWilayasCount;

  if (input.metaTitle !== undefined) row.meta_title = input.metaTitle;
  if (input.metaDescription !== undefined) row.meta_description = input.metaDescription;
  if (input.metaKeywords !== undefined) row.meta_keywords = input.metaKeywords;

  if (input.developerName !== undefined) row.developer_name = input.developerName;
  if (input.developerUrl !== undefined) row.developer_url = input.developerUrl;
  if (input.platformVersion !== undefined) row.platform_version = input.platformVersion;
  if (input.displayDeveloperBadge !== undefined) row.display_developer_badge = input.displayDeveloperBadge;

  if (input.customMetadata !== undefined) row.custom_metadata = input.customMetadata;

  return row;
}

/**
 * Merges a partial StoreSettings object or database row with DEFAULT_STORE_SETTINGS.
 * Deterministic and side-effect free: guarantees that no field is undefined.
 */
export function mergeWithDefaultSettings(settings: Partial<StoreSettings> | null): StoreSettings {
  if (!settings) {
    return { ...DEFAULT_STORE_SETTINGS };
  }

  const merged = {
    ...DEFAULT_STORE_SETTINGS,
    ...Object.fromEntries(
      Object.entries(settings).filter(([_, v]) => v !== undefined && v !== null)
    ),
  };

  // Re-synchronize aliases
  if (settings.cityCommune !== undefined && settings.cityCommune !== null) {
    merged.commune = settings.cityCommune;
  } else if (settings.commune !== undefined && settings.commune !== null) {
    merged.cityCommune = settings.commune;
  }

  if (settings.enableAnnouncementBar !== undefined && settings.enableAnnouncementBar !== null) {
    merged.announcementBarEnabled = settings.enableAnnouncementBar;
  } else if (settings.announcementBarEnabled !== undefined && settings.announcementBarEnabled !== null) {
    merged.enableAnnouncementBar = settings.announcementBarEnabled;
  }

  if (merged.wilayaCode) {
    merged.wilayaName = resolveWilayaName(merged.wilayaCode);
  }

  return merged;
}
