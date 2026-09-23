-- =====================================================================================
-- Migration 00017: Harden public.public_products View with Security Invoker & Read-Only Grants
-- DRIPIDIN Commercial E-Commerce Platform — Pre-Phase 7 Security Hardening
-- =====================================================================================

-- 1. Alter existing view to enable security_invoker in-place (PostgreSQL 15+)
-- This ensures queries against the view are evaluated with the caller's privileges
-- and subject to Row Level Security (RLS) on the underlying public.products table.
ALTER VIEW public.public_products SET (security_invoker = true);

-- 2. Explicitly re-declare view definition with security_invoker to maintain full schema reproducibility
CREATE OR REPLACE VIEW public.public_products
WITH (security_invoker = true) AS
SELECT 
    id,
    sku,
    barcode,
    name,
    slug,
    brand_id,
    category_id,
    product_type,
    status,
    is_visible,
    is_featured,
    short_description,
    description,
    main_image,
    gallery,
    b2c_price_dzd,
    b2c_sale_price_dzd,
    b2b_price_dzd,
    stock_quantity,
    reserved_stock,
    available_stock,
    low_stock_threshold,
    weight_grams,
    dimensions_cm,
    compatibility,
    created_at,
    updated_at
FROM public.products
WHERE is_visible = true AND status = 'ACTIVE'::product_status;

-- 3. Document security intent via SQL comments
COMMENT ON VIEW public.public_products IS 
'Client-safe sanitized public catalog projection with security_invoker = true. Excludes sensitive procurement costs (cost_price_dzd), supplier SKUs (supplier_sku), and supplier identities (primary_supplier_id). Underlying RLS on public.products is strictly enforced.';

-- 4. Revoke all modification privileges from client-facing roles
REVOKE ALL ON public.public_products FROM anon, authenticated;

-- 5. Grant strictly SELECT to public consumers and system roles
GRANT SELECT ON public.public_products TO anon, authenticated, service_role;
