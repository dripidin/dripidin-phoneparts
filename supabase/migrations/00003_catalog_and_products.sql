-- HamzaPhone Migration 00003: Catalog, Brands, Categories, Products, Compatibility, Suppliers & Pricing

-- 1. Brands
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_brands_slug ON public.brands(slug);

-- 2. Categories (Nested Tree)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_categories_parent ON public.categories(parent_id);
CREATE INDEX idx_categories_slug ON public.categories(slug);

-- 3. Device Models
CREATE TABLE IF NOT EXISTS public.device_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    model_code VARCHAR(64),               -- e.g. 'SM-G998B', 'A2633'
    release_year INTEGER,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(brand_id, slug)
);
CREATE INDEX idx_device_models_brand ON public.device_models(brand_id);
CREATE INDEX idx_device_models_code ON public.device_models(model_code);

-- 4. Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    code VARCHAR(32) UNIQUE NOT NULL,     -- e.g. 'SUP-SHENZHEN-01', 'SUP-ALGER-LOCAL'
    contact_person VARCHAR(100),
    phone VARCHAR(32),
    email VARCHAR(255),
    country VARCHAR(64) NOT NULL DEFAULT 'China',
    lead_time_days INTEGER NOT NULL DEFAULT 14,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    exchange_rate_to_dzd NUMERIC(10,4) NOT NULL DEFAULT 1.0000,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_suppliers_code ON public.suppliers(code);

-- 5. Products Master Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(64) UNIQUE NOT NULL,
    barcode VARCHAR(64) UNIQUE,
    supplier_sku VARCHAR(64),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    product_type product_type NOT NULL DEFAULT 'AFTERMARKET',
    status product_status NOT NULL DEFAULT 'DRAFT',
    is_visible BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    short_description TEXT,
    description TEXT,
    main_image TEXT NOT NULL,
    gallery TEXT[] NOT NULL DEFAULT '{}',
    
    -- Financials (All in DZD)
    cost_price_dzd NUMERIC(12,2) NOT NULL CHECK (cost_price_dzd >= 0),
    b2c_price_dzd NUMERIC(12,2) NOT NULL CHECK (b2c_price_dzd >= 0),
    b2c_sale_price_dzd NUMERIC(12,2) CHECK (b2c_sale_price_dzd IS NULL OR b2c_sale_price_dzd >= 0),
    b2b_price_dzd NUMERIC(12,2) NOT NULL CHECK (b2b_price_dzd >= 0),
    
    -- Stock Counters
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    reserved_stock INTEGER NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
    available_stock INTEGER GENERATED ALWAYS AS (stock_quantity - reserved_stock) STORED,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
    
    -- Physical Specs
    weight_grams NUMERIC(8,2) NOT NULL DEFAULT 50.00 CHECK (weight_grams > 0),
    dimensions_cm JSONB DEFAULT '{"length": 15, "width": 8, "height": 1}'::jsonb,
    
    -- Denormalized structured compatibility for ultra-fast storefront delivery
    compatibility JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    primary_supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_brand ON public.products(brand_id);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_status_visibility ON public.products(status, is_visible);
CREATE INDEX idx_products_stock ON public.products(stock_quantity, reserved_stock);
CREATE INDEX idx_products_supplier ON public.products(primary_supplier_id);
CREATE INDEX idx_products_compatibility_gin ON public.products USING GIN (compatibility);

-- 6. Product Gallery Images
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_cover BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_product_images_product ON public.product_images(product_id);

-- 7. Normalized Product Compatibility Bridge
CREATE TABLE IF NOT EXISTS public.product_compatibility (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    device_model_id UUID NOT NULL REFERENCES public.device_models(id) ON DELETE CASCADE,
    variant_codes VARCHAR(64)[] NOT NULL DEFAULT '{}', -- e.g. ARRAY['SM-G998B', 'SM-G9980']
    notes VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(product_id, device_model_id)
);
CREATE INDEX idx_prod_compat_product ON public.product_compatibility(product_id);
CREATE INDEX idx_prod_compat_model ON public.product_compatibility(device_model_id);

-- 8. Supplier Products Mapping
CREATE TABLE IF NOT EXISTS public.supplier_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    supplier_sku VARCHAR(64) NOT NULL,
    supplier_product_name VARCHAR(255),
    cost_price_foreign NUMERIC(12,2) NOT NULL,
    foreign_currency VARCHAR(3) NOT NULL,
    cost_price_dzd NUMERIC(12,2) NOT NULL,
    moq INTEGER NOT NULL DEFAULT 1,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(supplier_id, supplier_sku)
);
CREATE INDEX idx_supplier_products_supplier ON public.supplier_products(supplier_id);
CREATE INDEX idx_supplier_products_product ON public.supplier_products(product_id);

-- 9. B2B Pricing Tiers (e.g. Silver, Gold, VIP Distributor)
CREATE TABLE IF NOT EXISTS public.b2b_pricing_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_code VARCHAR(32) UNIQUE NOT NULL,
    tier_name VARCHAR(100) NOT NULL,
    default_discount_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    minimum_monthly_volume_dzd NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Specific B2B Tier Price Overrides
CREATE TABLE IF NOT EXISTS public.b2b_tier_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    tier_id UUID NOT NULL REFERENCES public.b2b_pricing_tiers(id) ON DELETE CASCADE,
    price_dzd NUMERIC(12,2) NOT NULL CHECK (price_dzd >= 0),
    min_quantity INTEGER NOT NULL DEFAULT 1 CHECK (min_quantity >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(product_id, tier_id, min_quantity)
);
CREATE INDEX idx_b2b_tier_prices_product ON public.b2b_tier_prices(product_id);

-- 11. Customer / Business Specific Price Overrides
CREATE TABLE IF NOT EXISTS public.customer_specific_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    custom_price_dzd NUMERIC(12,2) NOT NULL CHECK (custom_price_dzd >= 0),
    valid_until TIMESTAMPTZ,
    notes VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT cust_price_target_check CHECK (user_id IS NOT NULL OR business_id IS NOT NULL),
    UNIQUE(business_id, product_id)
);
CREATE INDEX idx_customer_specific_prices_business ON public.customer_specific_prices(business_id);
CREATE INDEX idx_customer_specific_prices_product ON public.customer_specific_prices(product_id);

-- 12. Immutable Price History Log
CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    price_type VARCHAR(32) NOT NULL, -- 'COST', 'B2C', 'B2C_SALE', 'B2B_BASE', 'TIER_OVERRIDE'
    tier_id UUID REFERENCES public.b2b_pricing_tiers(id) ON DELETE SET NULL,
    old_price_dzd NUMERIC(12,2) NOT NULL,
    new_price_dzd NUMERIC(12,2) NOT NULL,
    change_reason VARCHAR(255) NOT NULL,
    bulk_batch_id UUID,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_price_history_product ON public.price_history(product_id, created_at DESC);
