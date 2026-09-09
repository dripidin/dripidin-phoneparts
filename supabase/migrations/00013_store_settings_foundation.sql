-- HamzaPhone / DRIPIDIN Migration 00013: Store Settings Foundation
-- Authoritative, persistent singleton configuration table for buyer-editable store identity, branding, and commerce defaults.

CREATE TABLE IF NOT EXISTS public.store_settings (
    -- Singleton primary key enforcement
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
    primary_color VARCHAR(16) NOT NULL DEFAULT '#F97316',
    primary_color_hover VARCHAR(16) NOT NULL DEFAULT '#EA580C',
    accent_color VARCHAR(16) NOT NULL DEFAULT '#10B981',
    background_color VARCHAR(16) NOT NULL DEFAULT '#FFFFFF',
    foreground_color VARCHAR(16) NOT NULL DEFAULT '#111827',
    border_color VARCHAR(16) NOT NULL DEFAULT '#E5E7EB',
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
    tax_registration_number VARCHAR(64) DEFAULT '',
    trade_register_number VARCHAR(64) DEFAULT '',
    statistical_id_number VARCHAR(64) DEFAULT '',
    tax_article_number VARCHAR(64) DEFAULT '',

    -- 8. Storefront Feature Toggles
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

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trg_store_settings_updated_at ON public.store_settings;
CREATE TRIGGER trg_store_settings_updated_at
BEFORE UPDATE ON public.store_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Policy: Everyone can read store settings (SSR & Storefront hydration)
DROP POLICY IF EXISTS "Public Read Store Settings" ON public.store_settings;
CREATE POLICY "Public Read Store Settings"
ON public.store_settings FOR SELECT
USING (true);

-- 2. Staff Manage Policy: Only authenticated staff with 'settings.manage' or 'all' can update
DROP POLICY IF EXISTS "Staff Manage Store Settings" ON public.store_settings;
CREATE POLICY "Staff Manage Store Settings"
ON public.store_settings FOR UPDATE
USING (
    public.is_staff() AND public.has_permission('settings.manage')
)
WITH CHECK (
    public.is_staff() AND public.has_permission('settings.manage')
);

-- 3. Staff Insert Policy: If singleton row is missing, authorized staff can insert id='default'
DROP POLICY IF EXISTS "Staff Insert Store Settings" ON public.store_settings;
CREATE POLICY "Staff Insert Store Settings"
ON public.store_settings FOR INSERT
WITH CHECK (
    id = 'default' AND public.is_staff() AND public.has_permission('settings.manage')
);

-- Seed initial singleton row with verified defaults
INSERT INTO public.store_settings (
    id,
    store_name,
    legal_name,
    tagline,
    support_email,
    support_phone,
    whatsapp_phone,
    city_commune,
    wilaya_code,
    currency_code,
    currency_symbol,
    currency_decimals,
    default_country_code,
    default_locale,
    order_prefix
)
VALUES (
    'default',
    'DRIPIDIN',
    'DRIPIDIN E-Commerce & Distribution SARL',
    'Plateforme E-Commerce & Distribution Mobile en Algérie',
    'metachagour@gmail.com',
    '+213 793 73 13 10',
    '+213 540 09 51 66',
    'Biskra',
    7,
    'DZD',
    'DA',
    0,
    'DZ',
    'fr-DZ',
    'DRP'
)
ON CONFLICT (id) DO NOTHING;
