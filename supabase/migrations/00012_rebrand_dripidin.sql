-- Migration 00012: Rebrand Platform to DRIPIDIN
-- Purpose: Additive database updates to synchronize store profiles, provider records, admin user defaults, and SKU taxonomy from HamzaPhone to DRIPIDIN

-- 1. Update Courier Providers Default internal naming
UPDATE public.courier_providers 
SET 
    name = 'DRIPIDIN Magasin / Livraison Propre',
    config = '{"description": "Livraison directe ou retrait au point de distribution DRIPIDIN"}'::jsonb
WHERE code = 'INTERNAL' OR name ILIKE '%HamzaPhone%';

-- 2. Update Default Businesses & Store Entities
UPDATE public.businesses
SET 
    name = 'DRIPIDIN',
    trade_name = 'DRIPIDIN',
    email = 'metachagour@gmail.com',
    phone = '+213 793 73 13 10'
WHERE name ILIKE '%HamzaPhone%' OR trade_name ILIKE '%HamzaPhone%';

-- 3. Update Default Admin User Profiles
UPDATE public.profiles
SET 
    email = 'metachagour@gmail.com',
    full_name = 'Chagour Imed Eddine',
    phone = '+213 793 73 13 10'
WHERE email ILIKE '%admin@hamzaphone.dz%' OR email ILIKE '%hamzaphone.dz%';

-- 4. Update Product SKU Taxonomy from HP- to DRP-
UPDATE public.products
SET 
    sku = 'DRP-' || SUBSTRING(sku FROM 4)
WHERE sku LIKE 'HP-%';

-- 5. Update Supplier Product SKUs
UPDATE public.supplier_products
SET 
    supplier_sku = 'DRP-' || SUBSTRING(supplier_sku FROM 4)
WHERE supplier_sku LIKE 'HP-%';

-- 6. Update Product Search Vectors after SKU reindexing
UPDATE public.products
SET updated_at = NOW()
WHERE sku LIKE 'DRP-%';
