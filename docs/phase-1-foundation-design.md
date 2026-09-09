# DRIPIDIN — Phase 1: Foundation & Persistent Store Settings Architecture Design

> **Document Type**: Architectural Specification & Implementation Blueprint  
> **Phase**: PHASE 1 — Configuration Foundation & Persistent Store Settings  
> **Status**: APPROVED FOR REVIEW (Read-Only Blueprint — Implementation Pending)  
> **Target Platform**: DRIPIDIN E-Commerce Engine (Reusable Commercial Template)  
> **Baseline Engine**: Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4, Supabase PostgreSQL (RLS)  
> **Target Date**: September 2026  

---

## 1. Executive Summary & Objective

The existing DRIPIDIN platform currently stores store configuration (store name, phone numbers, WhatsApp dispatch, physical address, SEO metadata, trust badges, and homepage CMS sections) inside an **ephemeral in-memory JavaScript singleton** ([`SettingsCmsService.activeSettings`](file:///d:/Websites%20On%20Line/hamzaphone/src/lib/settings/settings-cms.service.ts#L15-L58)).

```
CURRENT VULNERABLE ARCHITECTURE (IN-MEMORY ONLY):
┌─────────────────────────┐      writes      ┌───────────────────────────────┐
│ Admin UI Settings Form  ├─────────────────►│ in-memory: activeSettings    │
└─────────────────────────┘                  └──────────────┬────────────────┘
                                                            │ resets to code defaults
                                                            ▼ on serverless cold-start
                                             ┌───────────────────────────────┐
                                             │ Hard-coded TS Code Constants  │
                                             └───────────────────────────────┘
```

In serverless hosting environments (Vercel, AWS Lambda, Cloudflare Workers), containers are ephemeral:
1. When containers spin down after inactivity, any updates made by the merchant via the Admin UI evaporate.
2. Multi-region or multi-instance deployments create desynchronized split-brain states where different users see different settings.
3. Every deployment or code push resets all store settings to hard-coded code constants.

### Phase 1 Primary Objective
Replace this architectural limitation with a **production-grade, persistent, database-backed store configuration engine** in Supabase PostgreSQL that serves as the single source of truth for buyer-editable store settings, while preserving:
- **Zero code changes required** for a buyer to configure their business identity.
- **Sub-millisecond read latency** via cached server accessors (`unstable_cache` with tag-based revalidation).
- **100% backward compatibility** with existing storefront components, hooks, and Algerian commerce logic.
- **Deterministic fallback hierarchy** that guarantees the application never crashes or displays blank screens if the database is unreachable.

---

## 2. Step 1: Read-Only Current-State Architecture Analysis

### 2.1 Inspection of Existing Settings Components

| Component / File | Current Role | Current Implementation & Critical Findings |
| :--- | :--- | :--- |
| [`SettingsCmsService`](file:///d:/Websites%20On%20Line/hamzaphone/src/lib/settings/settings-cms.service.ts) | Settings Provider | Holds mutable module variable `let activeSettings: WebsiteSettings = { ... }`. Contains hard-coded fallback brand `'DRIPIDIN'`, contact info, and 10 homepage sections. Zero database interaction. |
| [`IntegrationConfigService`](file:///d:/Websites%20On%20Line/hamzaphone/src/lib/config/integration-config.service.ts) | Integration Settings | Holds in-memory `persistentStateStore` for integrations. Reads secrets from `process.env`. Hard-codes auto-demo mode on `*.vercel.app`. |
| [`DeliveryPricingService`](file:///d:/Websites%20On%20Line/hamzaphone/src/lib/delivery/delivery-pricing.service.ts) | Delivery Pricing | Calculates delivery rates for 58 Wilayas using hard-coded pricing constants (400/600 DZD) despite table `delivery_rate_matrix` existing in the DB. |
| [`settings-cms.actions.ts`](file:///d:/Websites%20On%20Line/hamzaphone/src/lib/actions/settings-cms.actions.ts) | Server Actions | Calls `SettingsCmsService` in-memory methods. Validates RBAC permission `settings.manage` and `cms.manage`. Emits audit logs to `audit_logs` table. Calls `revalidatePath('/')`. |
| [`use-settings-cms.ts`](file:///d:/Websites%20On%20Line/hamzaphone/src/lib/hooks/use-settings-cms.ts) | Client Hook Layer | TanStack Query hooks (`useWebsiteSettings`, `useUpdateWebsiteSettings`, `useHomepageSections`). Uses query keys `['website_settings']`. |
| [`website-settings-view.tsx`](file:///d:/Websites%20On%20Line/hamzaphone/src/components/admin/views/website-settings-view.tsx) | Admin UI | Form workstation with 5 tabs (`IDENTITY`, `SOCIAL_SEO`, `MESSAGING`, `CMS_HOMEPAGE`, `HISTORY`). Form state feeds into `updateWebsiteSettingsAction`. |
| [`storefront-header.tsx`](file:///d:/Websites%20On%20Line/hamzaphone/src/components/storefront/layout/storefront-header.tsx) | Storefront Consumer | Consumes `useWebsiteSettings()` for announcement text and phone, but hard-codes logo SVG and brand name `DRIPIDIN` in JSX. |
| [`storefront-footer.tsx`](file:///d:/Websites%20On%20Line/hamzaphone/src/components/storefront/layout/storefront-footer.tsx) | Storefront Consumer | Consumes `useWebsiteSettings()` for address and contact, but hard-codes logo SVG, brand name `DRIPIDIN`, and smartphone categories in JSX. |
| [`layout.tsx`](file:///d:/Websites%20On%20Line/hamzaphone/src/app/layout.tsx) | Root Metadata | Exports static `metadata: Metadata` with hard-coded title `'DRIPIDIN'`, description, and author `'Chagour Imed Eddine'`. Does not query settings. |
| [`checkout.service.ts`](file:///d:/Websites%20On%20Line/hamzaphone/src/lib/services/checkout.service.ts) | Commerce Engine | Directly reads `process.env.NEXT_PUBLIC_ORDER_PREFIX || 'DRP'` for order numbers. Bypasses settings layer. |
| [`order.service.ts`](file:///d:/Websites%20On%20Line/hamzaphone/src/lib/services/order.service.ts) | Commerce Engine | Directly reads `process.env.NEXT_PUBLIC_ORDER_PREFIX || 'DRP'`. Bypasses settings layer. |
| [`utils.ts`](file:///d:/Websites%20On%20Line/hamzaphone/src/lib/utils.ts) | Utilities | Hard-codes `Intl.NumberFormat('fr-DZ', { currency: 'DZD' }).replace('DZD', 'DA')` in `formatDZD`. |

### 2.2 Current Dependency Map vs. Target Architecture

#### Current State (Broken on Cold Start):
```
[Client Browser] ──(TanStack Query)──► [useWebsiteSettings Hook]
                                                │
                                      (Server Action)
                                                ▼
                                   [getWebsiteSettingsAction]
                                                │
                                          (In-Memory)
                                                ▼
                                    [SettingsCmsService]
                                  (activeSettings in RAM)
                                           ▲     │
                               (Cold start)│     │(Updates)
                                           │     ▼
                                  [Hardcoded Defaults]
```

#### Target State (Persistent, High Performance, Cached):
```
[Client Browser] ──(TanStack Query)──► [useWebsiteSettings Hook]
                                                │
                                      (Server Action)
                                                ▼
                                  [getStoreSettingsAction]
                                                │
                                         (Tag-Cached)
                                                ▼
                                      [StoreSettingsService]
                                         (unstable_cache)
                                                │
                                        (DB Query / RLS)
                                                ▼
                                   [StoreSettingsRepository]
                                                │
                                           (PostgreSQL)
                                                ▼
                                  [public.store_settings Table]
                                                │
                                    (Fallback if DB Empty)
                                                ▼
                                 [DEFAULT_STORE_SETTINGS Const]
```

### 2.3 Boundary Categorization of All Configuration Parameters

| Parameter | Current Classification | Proper Destination Layer | Storage Medium | Justification |
| :--- | :--- | :--- | :--- | :--- |
| Store Name | `STORE_SETTING` | **Store Settings** | DB (`store_settings.store_name`) | Buyer-editable identity. |
| Legal / Company Name | `STORE_SETTING` | **Store Settings** | DB (`store_settings.legal_name`) | Required on official invoices and legal disclosures. |
| Support Email & Phones | `STORE_SETTING` | **Store Settings** | DB (`store_settings.support_email`, etc.) | Buyer-editable contact points. |
| Physical Address / Wilaya | `STORE_SETTING` | **Store Settings** | DB (`store_settings.address_line`, etc.) | Physical location of the store/dispatch warehouse. |
| Brand Colors / Theme | `STORE_SETTING` | **Store Settings / Branding** | DB (`store_settings.primary_color`, etc.) | Visual customization for merchant branding. |
| Order & Invoice Prefix | `STORE_SETTING` | **Store Settings / Commerce** | DB (`store_settings.order_prefix`, etc.) | Business preference for sequential document IDs. |
| Currency Code & Symbol | `STORE_SETTING` | **Store Settings / Regional** | DB (`store_settings.currency_code`, etc.) | Enables non-Algerian merchants to set USD/EUR/SAR. |
| 58 Wilayas Matrix | `COUNTRY_DEFAULT` | **CountryProfile (Algeria)** | DB (`wilayas`, `delivery_rate_matrix`) | National administrative geography; not store-specific. |
| EcoTrack Integration | `PLATFORM_SETTING` | **Logistics Providers** | DB (`courier_providers`) + Encrypted Secret | Pluggable delivery provider contract. |
| Phone Validation Regex | `COUNTRY_DEFAULT` | **CountryProfile Strategy** | Code Strategy Layer (`AlgeriaCountryProfile`) | Strict standard format (`05/06/07`); country-dependent. |
| Supabase URL & Anon Key | `ENVIRONMENT_SETTING` | **Infrastructure Config** | Environment Variables (`.env`) | Immutable build-time and hosting infrastructure anchor. |
| Service Role Key | `SECRET` | **Infrastructure Secret** | Environment Variable (`process.env`) | Superuser server key; MUST NEVER be in DB table. |
| EcoTrack / SMS / Meta Tokens | `SECRET` | **Integration Secrets** | Environment / AES-256 Vault | Third-party credentials; MUST NEVER be in plaintext DB. |
| Developer Attribution | `PLATFORM_SETTING` | **Template Platform Layer** | Static Platform Metadata | Creator attribution must not be owned/altered as store identity. |

### 2.4 Existing Duplication of Identity Across the Codebase

1. **Store Name**:
   - Hard-coded as `"DRIPIDIN"` in `layout.tsx:8`, `storefront-header.tsx:101`, `storefront-footer.tsx:98`, `admin-sidebar.tsx:141`, `overview-view.tsx:56`, and `notification.service.ts:256`.
   - Hard-coded as `"HamzaPhone"` in `search/page.tsx:29`, `checkout/page.tsx:9`, `cart/page.tsx:9`, `login/page.tsx:10`, `register/page.tsx:10`, `error.tsx:19`, `product-info.tsx:55`, `product-card.tsx:100`, `admin-store.ts:49`, and `recommendation.service.ts:147`.
2. **Order Number Prefix**:
   - Hard-coded as `'DRP'` in `checkout.service.ts:417` and `order.service.ts:158`.
   - Hard-coded as `'HP-'` in `notification.service.ts:25,46,109` and `mock-data.ts:180-260`.
3. **Contact Information**:
   - Hard-coded across `settings-cms.service.ts`, `storefront-footer.tsx`, and `product-info.tsx`.

### 2.5 Migration Risks & Architectural Pitfalls

1. **Server / Client Boundary Violations**:
   - In Next.js 16, direct database calls or Node.js crypto operations cannot occur in Client Components (`'use client'`).
   - *Mitigation*: All database queries reside in a server-only repository (`StoreSettingsRepository`). Client components access settings through Server Actions or SSR props.
2. **Stale Cached Settings**:
   - In-memory caching without revalidation causes updates made in the Admin UI to not appear on the storefront.
   - *Mitigation*: Next.js `unstable_cache` keyed by `['store_settings']` paired with explicit `revalidateTag('store_settings')` executed immediately in the update server action.
3. **SSR / Hydration Inconsistency**:
   - If the server renders settings from static fallback but the client fetches dynamic DB settings upon mount, a React hydration mismatch error will trigger.
   - *Mitigation*: Root layout and Server Components must read authoritative cached settings directly during SSR, passing initialized settings to providers.
4. **Missing Row / Empty Database State**:
   - If a new buyer installs the template without running a seed script, queries for `store_settings` could return `null`, causing fatal crashes.
   - *Mitigation*: Strict null-coalescing with an immutable `DEFAULT_STORE_SETTINGS` object. If the DB row is missing, the service returns the safe default and lazily initializes the singleton row.
5. **RLS & Security Exposure**:
   - If `store_settings` includes sensitive credentials, a public `SELECT` RLS policy would leak API keys to anonymous visitors.
   - *Mitigation*: `store_settings` contains ONLY public-safe store parameters. All secrets are excluded from this table. RLS permits public `SELECT`, while `UPDATE` is strictly restricted to staff with `settings.manage` permission.

---

## 3. Step 2: Persistent Model Design (`public.store_settings`)

### 3.1 Design Principles
1. **Single-Tenant Singleton Row**: Exactly one row exists with `id = 'default'`. This prevents multi-row ambiguity while allowing simple relational foreign keys if needed.
2. **Typed Column Schema**: Avoid untyped single-column JSON blobs for core identity, localization, and commerce fields to ensure schema validation, indexing, and type generation.
3. **Extensibility**: Include a `custom_metadata JSONB` column for future plugins or merchant-specific key-value pairs.
4. **Audit Metadata**: Track `version`, `updated_at`, and `updated_by` (UUID referencing `profiles.id`).

### 3.2 Complete PostgreSQL Schema Definition

```sql
-- Migration: 00013_store_settings_foundation.sql
-- Description: Singleton table for persistent store settings, localization, and branding

CREATE TABLE IF NOT EXISTS public.store_settings (
    -- Singleton primary key
    id VARCHAR(32) PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),

    -- 1. Store Identity
    store_name VARCHAR(128) NOT NULL DEFAULT 'DRIPIDIN',
    legal_name VARCHAR(255) DEFAULT 'DRIPIDIN E-Commerce & Distribution SARL',
    tagline VARCHAR(255) DEFAULT 'Plateforme E-Commerce & Distribution Mobile en Algérie',
    logo_url TEXT DEFAULT '/logo.png',
    favicon_url TEXT DEFAULT '/favicon.ico',
    og_image_url TEXT DEFAULT '/og-image.jpg',

    -- 2. Contact Information & Physical Headquarters
    support_email VARCHAR(128) NOT NULL DEFAULT 'contact@dripidin.com',
    support_phone VARCHAR(32) NOT NULL DEFAULT '+213 793 73 13 10',
    whatsapp_phone VARCHAR(32) DEFAULT '+213 540 09 51 66',
    address_line TEXT DEFAULT 'Centre Ville',
    city_commune VARCHAR(64) DEFAULT 'Biskra',
    wilaya_code INTEGER DEFAULT 7 REFERENCES public.wilayas(code),
    opening_hours TEXT DEFAULT 'Samedi - Jeudi : 09h00 - 19h00',

    -- 3. Social Channels
    facebook_url TEXT DEFAULT 'https://www.facebook.com/dripidin/',
    instagram_url TEXT DEFAULT 'https://www.instagram.com/dripidin/',
    tiktok_url TEXT DEFAULT '',
    youtube_url TEXT DEFAULT '',
    telegram_url TEXT DEFAULT '',

    -- 4. Localization & Regional Defaults
    default_country_code VARCHAR(4) NOT NULL DEFAULT 'DZ',
    default_locale VARCHAR(16) NOT NULL DEFAULT 'fr-DZ',
    currency_code VARCHAR(8) NOT NULL DEFAULT 'DZD',
    currency_symbol VARCHAR(8) NOT NULL DEFAULT 'DA',
    currency_decimals INTEGER NOT NULL DEFAULT 0 CHECK (currency_decimals >= 0 AND currency_decimals <= 4),
    timezone VARCHAR(64) NOT NULL DEFAULT 'Africa/Algiers',

    -- 5. Branding & Visual Design Tokens
    primary_color VARCHAR(16) NOT NULL DEFAULT '#F97316',      -- Tailwind orange-500
    primary_color_hover VARCHAR(16) NOT NULL DEFAULT '#EA580C',-- Tailwind orange-600
    accent_color VARCHAR(16) NOT NULL DEFAULT '#10B981',       -- Tailwind emerald-500
    font_family VARCHAR(64) NOT NULL DEFAULT 'Inter',
    border_radius_token VARCHAR(16) NOT NULL DEFAULT 'rounded-2xl',

    -- 6. Commerce Core Defaults (Store-level only)
    order_prefix VARCHAR(16) NOT NULL DEFAULT 'DRP',
    invoice_prefix VARCHAR(16) NOT NULL DEFAULT 'FAC',
    proforma_prefix VARCHAR(16) NOT NULL DEFAULT 'PRO',
    default_courier_code VARCHAR(32) DEFAULT 'ECOTRACK',
    free_shipping_threshold_dzd NUMERIC(12,2) DEFAULT NULL,
    tax_rate_percent NUMERIC(5,2) DEFAULT 0.00 CHECK (tax_rate_percent >= 0),

    -- 7. Legal & Fiscal Credentials (Displayed on Invoices/B2B Proformas)
    tax_registration_number VARCHAR(64) DEFAULT '',   -- NIF
    trade_register_number VARCHAR(64) DEFAULT '',     -- RC
    statistical_id_number VARCHAR(64) DEFAULT '',     -- NIS
    tax_article_number VARCHAR(64) DEFAULT '',        -- Article d'Imposition

    -- 8. Storefront Feature Toggles (Buyer-configurable flags)
    enable_b2b_wholesale BOOLEAN NOT NULL DEFAULT true,
    enable_guest_checkout BOOLEAN NOT NULL DEFAULT true,
    enable_whatsapp_ordering BOOLEAN NOT NULL DEFAULT true,
    enable_product_reviews BOOLEAN NOT NULL DEFAULT true,
    enable_announcement_bar BOOLEAN NOT NULL DEFAULT true,
    force_demo_mode BOOLEAN NOT NULL DEFAULT false,

    -- 9. Storefront Badges & Trust Messaging
    announcement_bar_text TEXT DEFAULT '🚚 Livraison Express 58 Wilayas disponible avec EcoTrack | Tarifs de gros pour professionnels B2B',
    announcement_bar_link TEXT DEFAULT '/register?type=b2b',
    delivery_badge_text TEXT DEFAULT 'Livraison 58 Wilayas en 24h/48h',
    payment_badge_text TEXT DEFAULT 'Paiement à la Livraison (COD)',
    warranty_badge_text TEXT DEFAULT 'Produits 100% Testés & Certifiés',
    support_badge_text TEXT DEFAULT 'Espace Grossiste B2B',
    return_policy_text TEXT DEFAULT 'Échange garanti sous 48h en cas de non-conformité pour les comptes professionnels.',
    footer_copyright_text TEXT DEFAULT '© 2026 DRIPIDIN. Tous droits réservés.',
    footer_description TEXT DEFAULT 'Plateforme e-commerce et distribution en Algérie. Présent sur les réseaux sociaux, livraison rapide à domicile et en point relais à travers les 58 Wilayas.',
    coverage_wilayas_count INTEGER NOT NULL DEFAULT 58,

    -- 10. SEO Defaults
    meta_title TEXT DEFAULT 'DRIPIDIN — Plateforme E-Commerce & Distribution Mobile en Algérie (58 Wilayas)',
    meta_description TEXT DEFAULT 'Boutique en ligne DRIPIDIN : Smartphones, accessoires connectés et pièces en Algérie. Vente en gros & détail avec livraison 58 Wilayas COD.',
    meta_keywords TEXT DEFAULT 'dripidin, ecommerce algerie, smartphones, accessoires mobile, biskra, ecotrack 58 wilayas, grossiste b2b',

    -- 11. Developer Platform Attribution (Separate from Store Identity)
    developer_name VARCHAR(64) NOT NULL DEFAULT 'DRIPIDIN Platform',
    developer_url TEXT DEFAULT 'https://dripidin.com',
    platform_version VARCHAR(32) NOT NULL DEFAULT '1.0.0',
    display_developer_badge BOOLEAN NOT NULL DEFAULT false,

    -- 12. Versioning & Audit Metadata
    version INTEGER NOT NULL DEFAULT 1,
    custom_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Row Level Security
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Public can read store settings (required for Storefront SSR and Client Hydration)
CREATE POLICY "Public Read Store Settings"
ON public.store_settings FOR SELECT
USING (true);

-- Only authenticated staff members with 'settings.manage' permission can update
CREATE POLICY "Staff Manage Store Settings"
ON public.store_settings FOR UPDATE
USING (
    public.is_staff() AND public.has_permission('settings.manage')
)
WITH CHECK (
    public.is_staff() AND public.has_permission('settings.manage')
);
```

---

## 4. Step 3: Multi-Layer Configuration Boundary

To prevent architectural degradation where settings from different operational domains are dumped into a single table, the platform enforces strict boundaries across 5 distinct layers:

```
┌────────────────────────────────────────────────────────────────────────┐
│  LAYER A: STORE SETTINGS (Database: public.store_settings)             │
│  Buyer-configurable store identity, brand colors, contact, typography   │
├────────────────────────────────────────────────────────────────────────┤
│  LAYER B: COUNTRY PROFILE (Database: public.wilayas, rate_matrix)      │
│  58 Wilayas, Algerian logistics zones, phone regex, COD dominance      │
├────────────────────────────────────────────────────────────────────────┤
│  LAYER C: COMMERCE / BIZ MODEL (Database: products, b2b_tiers)         │
│  Smartphones, spare parts, fashion, food; pricing models, categories   │
├────────────────────────────────────────────────────────────────────────┤
│  LAYER D: INFRASTRUCTURE CONFIG (Environment: process.env)             │
│  NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SITE_URL, NODE_ENV              │
├────────────────────────────────────────────────────────────────────────┤
│  LAYER E: INTEGRATION SECRETS (Environment / Encrypted Vault)          │
│  ECOTRACK_API_TOKEN, SMS_GATEWAY_API_KEY, WHATSAPP_CLOUD_API_TOKEN     │
└────────────────────────────────────────────────────────────────────────┘
```

### Layer A: Store Settings (`public.store_settings`)
- **Owner**: Store Merchant / Platform Buyer.
- **Mutability**: Dynamic (editable at runtime via Admin UI).
- **Scope**: Branding, visual tokens, store contact, order prefixes, storefront badges, social links, feature toggles.
- **Security**: Publicly readable; staff write with `settings.manage`.

### Layer B: CountryProfile (`AlgeriaCountryProfile` Architecture)
- **Owner**: Country / Regional Market Strategy.
- **Mutability**: Semi-static (seeded in database tables `wilayas`, `delivery_rate_matrix`).
- **Scope**: 
  - National subdivision registry (58 Wilayas with codes 01–58).
  - Logistics regional zones (`NORD`, `HAUTS_PLATEAUX`, `SUD`, `GRAND_SUD`).
  - Mobile phone format validation regex (`/^(?:\+213|0)[5-7]\d{8}$/`).
  - Cash-on-Delivery (COD) default status.
- **Preservation Guarantee**: Algeria logic remains fully intact and is encapsulated so that adding another country profile in the future does not alter core store settings.

### Layer C: Commerce / Business Model
- **Owner**: Catalog & Merchandising Managers.
- **Scope**: Products, Categories, Brands, Suppliers, Inventory Ledger, Device Compatibility Matrix, B2B Pricing Tiers.
- **Rule**: Does NOT bleed into `store_settings`. A merchant selling apparel or cosmetics disables `enable_device_compatibility` and defines clothing categories without altering the store settings engine.

### Layer D: Infrastructure Configuration
- **Owner**: DevOps / Hosting Platform (Vercel, Supabase Cloud, Docker).
- **Storage**: Strictly in environment variables (`.env`).
- **Variables**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `NODE_ENV`.
- **Rule**: Never stored in database tables.

### Layer E: Integration Secrets
- **Owner**: Third-party Service Accounts (EcoTrack, MaghrebSMS, Meta WhatsApp, Resend, Telegram).
- **Storage**: Server environment variables or an encrypted Vault table (`vault.decrypted_secrets` via AES-256).
- **Rule**: **ABSOLUTELY FORBIDDEN in plaintext `store_settings` columns**. Admin UI displays only presence status (`'Configured' | 'Missing'`).

---

## 5. Step 4: Deterministic Fallback Hierarchy

To ensure the storefront never breaks during cold-starts, migrations, or database downtime, access to store settings follows a deterministic, 3-tier hierarchy:

```
TIER 1: Cached Database Settings (Next.js unstable_cache, tag: 'store_settings')
   │
   ▼ (if cache miss or DB query error)
TIER 2: Direct Database Singleton Query (public.store_settings WHERE id = 'default')
   │
   ▼ (if table empty or connection error)
TIER 3: Safe Immutable Static Defaults (DEFAULT_STORE_SETTINGS constant in TypeScript)
```

### 5.1 Safe Immutable Fallback Constant (`DEFAULT_STORE_SETTINGS`)
Located in [`src/lib/settings/default-settings.ts`](file:///d:/Websites%20On%20Line/hamzaphone/src/lib/settings/default-settings.ts):

```typescript
import type { StoreSettings } from '@/types/settings.types';

export const DEFAULT_STORE_SETTINGS: Readonly<StoreSettings> = Object.freeze({
  id: 'default',
  storeName: 'DRIPIDIN',
  legalName: 'DRIPIDIN E-Commerce & Distribution SARL',
  tagline: 'Plateforme E-Commerce & Distribution Mobile en Algérie',
  logoUrl: '/logo.png',
  faviconUrl: '/favicon.ico',
  ogImageUrl: '/og-image.jpg',

  supportEmail: 'metachagour@gmail.com',
  supportPhone: '+213 793 73 13 10',
  whatsappPhone: '+213 540 09 51 66',
  addressLine: 'Centre Ville',
  cityCommune: 'Biskra',
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
  forceDemoMode: false,

  announcementBarText: '🚚 Livraison Express 58 Wilayas disponible avec EcoTrack | Tarifs de gros pour professionnels B2B',
  announcementBarLink: '/register?type=b2b',
  deliveryBadgeText: 'Livraison 58 Wilayas en 24h/48h',
  paymentBadgeText: 'Paiement à la Livraison (COD)',
  warrantyBadgeText: 'Produits 100% Testés & Certifiés',
  supportBadgeText: 'Espace Grossiste B2B',
  returnPolicyText: 'Échange garanti sous 48h en cas de non-conformité pour les comptes professionnels.',
  footerCopyrightText: '© 2026 DRIPIDIN. Tous droits réservés.',
  footerDescription: 'Plateforme e-commerce et distribution en Algérie. Présent sur les réseaux sociaux, livraison rapide à domicile et en point relais à travers les 58 Wilayas.',
  coverageWilayasCount: 58,

  metaTitle: 'DRIPIDIN — Plateforme E-Commerce & Distribution Mobile en Algérie (58 Wilayas)',
  metaDescription: 'Boutique en ligne DRIPIDIN : Smartphones, accessoires connectés et produits high-tech en Algérie. Vente en gros & détail avec livraison 58 Wilayas COD.',
  metaKeywords: 'dripidin, ecommerce algerie, smartphones, accessoires mobile, biskra, ecotrack 58 wilayas, grossiste b2b',

  developerName: 'DRIPIDIN Platform',
  developerUrl: 'https://dripidin.com',
  platformVersion: '1.0.0',
  displayDeveloperBadge: false,

  version: 1,
  customMetadata: {},
  updatedAt: '2026-09-09T00:00:00.000Z',
  updatedBy: null,
});
```

### 5.2 Deep-Merge Fallback Algorithm
If a buyer adds or updates settings, but optional columns in the database contain `NULL`, the service merges the DB row over `DEFAULT_STORE_SETTINGS`:
```typescript
function mergeSettings(dbRow: Partial<StoreSettings> | null): StoreSettings {
  if (!dbRow) return { ...DEFAULT_STORE_SETTINGS };
  return {
    ...DEFAULT_STORE_SETTINGS,
    ...Object.fromEntries(
      Object.entries(dbRow).filter(([_, v]) => v !== null && v !== undefined)
    ),
  };
}
```

---

## 6. Step 5: Proposed Implementation Plan

### 6.1 Database Migration
**File**: `supabase/migrations/00013_store_settings_foundation.sql`
1. Creates table `public.store_settings`.
2. Inserts default singleton record (`id = 'default'`) populated with the active DRIPIDIN configuration.
3. Enables RLS: Public `SELECT`, Staff `UPDATE` requiring `has_permission('settings.manage')`.
4. Creates trigger to auto-update `updated_at` on modification.

### 6.2 Service & Repository Layer Architecture
Two distinct modules will be introduced:
1. **[`StoreSettingsRepository`](file:///d:/Websites%20On%20Line/hamzaphone/src/lib/repositories/store-settings.repository.ts)**:
   - Server-only (`import 'server-only'`).
   - Executes raw Supabase queries against `public.store_settings`.
   - Maps database snake_case columns to TypeScript camelCase model.
2. **[`StoreSettingsService`](file:///d:/Websites%20On%20Line/hamzaphone/src/lib/settings/store-settings.service.ts)**:
   - Wraps database calls with Next.js `unstable_cache`.
   - Cache key: `['store_settings_cache']`, Cache tag: `'store_settings'`.
   - Validates input schemas before writing to the database.
   - Provides synchronous fallback merging.

### 6.3 Server Actions Adaptation
**File**: [`src/lib/actions/settings-cms.actions.ts`](file:///d:/Websites%20On%20Line/hamzaphone/src/lib/actions/settings-cms.actions.ts)
- `getWebsiteSettingsAction()`: Redirects from in-memory service to `StoreSettingsService.getStoreSettings()`.
- `updateWebsiteSettingsAction()`:
  1. Enforces `requirePermission(supabase, 'settings.manage')`.
  2. Persists updates to `public.store_settings` via `StoreSettingsRepository.updateStoreSettings()`.
  3. Writes audit trail record to `audit_logs`.
  4. Triggers cache invalidation:
     ```typescript
     revalidateTag('store_settings');
     safeRevalidate('/');
     safeRevalidate('/admin');
     ```

### 6.4 Backward Compatibility Layer
The legacy `WebsiteSettings` interface in `src/types/settings-cms.types.ts` will extend or alias `StoreSettings`. All existing getters, hooks, and views will continue to function without property name discrepancies:
- `settings.storeName`
- `settings.supportPhone`
- `settings.whatsappPhone`
- `settings.deliveryBadgeText`
- `settings.announcementBarEnabled`

### 6.5 Exact Files Expected to Change in Phase 1 Implementation

#### Database Migration
- `supabase/migrations/00013_store_settings_foundation.sql` `[NEW]`

#### Type Definitions
- `src/types/settings.types.ts` `[NEW]` (Authoritative domain types)
- `src/types/settings-cms.types.ts` `[MODIFY]` (Aliased for backward compatibility)

#### Data & Service Layer
- `src/lib/settings/default-settings.ts` `[NEW]` (Immutable static fallback)
- `src/lib/repositories/store-settings.repository.ts` `[NEW]` (PostgreSQL RLS data access)
- `src/lib/settings/store-settings.service.ts` `[NEW]` (Cached business service)
- `src/lib/settings/settings-cms.service.ts` `[MODIFY]` (Delegates to `StoreSettingsService`)

#### Server Actions
- `src/lib/actions/settings-cms.actions.ts` `[MODIFY]` (Persists to DB, tags revalidation)

#### Automated Verification Tests
- `src/lib/settings/store-settings.test.ts` `[NEW]` (Verifies fallback, DB persistence, validation, cache tag revalidation)

---

## 7. Rollback Strategy

If any regression occurs during migration testing, the rollback strategy is immediate and non-destructive:

1. **Code Revert**: Revert `settings-cms.actions.ts` to call the in-memory `SettingsCmsService` fallback.
2. **Database Rollback**:
   ```sql
   DROP POLICY IF EXISTS "Staff Manage Store Settings" ON public.store_settings;
   DROP POLICY IF EXISTS "Public Read Store Settings" ON public.store_settings;
   DROP TABLE IF EXISTS public.store_settings CASCADE;
   ```
3. **Zero Production Risk**: Because `00013` is an additive migration (creates a new table and does NOT alter existing `orders`, `products`, `users`, or `deliveries`), rolling it back has zero impact on live customer orders or catalog data.

---

## 8. IMPLEMENTATION READINESS

```
============================================================
              PHASE 1 IMPLEMENTATION READINESS
============================================================
  STATUS: READY
  BLOCKERS: NONE
============================================================
```

### Readiness Evaluation
- **Architecture**: Complete and decoupled. The boundary between Store Settings, CountryProfile, Commerce Model, Infrastructure, and Secrets is rigorously defined.
- **Database**: Supabase PostgreSQL database is active and connected (`ljvyjueqkgttbzmfvhou`). Migrations 00001 through 00012 are verified. Migration 00013 is fully designed and additive.
- **Security**: Strict RLS policies established. Plaintext secret persistence is explicitly prohibited. RBAC permission `settings.manage` is enforced.
- **Performance**: High-throughput SSR supported via Next.js 16 `unstable_cache` with tag-based invalidation (`revalidateTag('store_settings')`).
- **Algeria Feature Preservation**: 58-Wilaya delivery matrix, EcoTrack courier integration, and Algerian regional defaults remain 100% functional and protected.

*The architecture design is complete. Ready to proceed to Phase 1 implementation upon user instruction.*
