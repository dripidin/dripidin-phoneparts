-- HamzaPhone Migration 00007: Storage Buckets, System Roles, Permissions & Seed Data

-- 1. Storage Buckets Setup (Supabase Storage)
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('product-images', 'product-images', true),
    ('b2b-documents', 'b2b-documents', false),
    ('invoices', 'invoices', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Storage Policies for product-images (Public Read, Staff Write)
CREATE POLICY "Public Read Product Images Storage"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Staff Manage Product Images Storage"
ON storage.objects FOR ALL
USING (bucket_id = 'product-images' AND (public.is_staff() OR public.has_permission('products.update')))
WITH CHECK (bucket_id = 'product-images' AND (public.is_staff() OR public.has_permission('products.update')));

-- Storage Policies for b2b-documents (Private)
CREATE POLICY "B2B Upload Documents Storage"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'b2b-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Staff and Owner Read B2B Documents Storage"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'b2b-documents' 
    AND (auth.uid() = owner OR public.has_permission('b2b.approve') OR public.is_staff())
);

-- 2. System Roles Seed
INSERT INTO public.roles (code, name, description, is_system)
VALUES
    ('OWNER', 'Platform Owner', 'Unrestricted administrative superuser access across all modules, secrets, and data.', true),
    ('ADMINISTRATOR', 'Administrator', 'Operations manager with full authority over products, orders, customers, and pricing.', true),
    ('SALES_MANAGER', 'Sales & Commercial Manager', 'Manages B2B business approvals, wholesale pricing contracts, and sales quotas.', true),
    ('ORDER_MANAGER', 'Order Fulfillment Officer', 'Processes orders, generates courier manifests, prints pick lists, and handles returns.', true),
    ('INVENTORY_MANAGER', 'Inventory & Warehouse Lead', 'Manages stock inbound receiving, manual adjustments, cycle counts, and suppliers.', true),
    ('CONTENT_MANAGER', 'Content & Catalog Specialist', 'Creates and edits product details, categories, device compatibility trees, and banners.', true),
    ('SUPPORT', 'Customer Support Representative', 'Read-only access to customer orders with capability to add notes and resend tracking links.', true),
    ('VIEWER', 'Auditor / Viewer', 'Read-only reporting and auditing access across catalog, financials, and logs.', true),
    ('B2B_CUSTOMER', 'Verified B2B Client', 'Repair shop or wholesale buyer with verified B2B wholesale pricing and quick-order tools.', true),
    ('B2C_CUSTOMER', 'Consumer Customer', 'Standard retail buyer with self-service tracking and saved addresses.', true)
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 3. Granular Permissions Seed
INSERT INTO public.permissions (code, resource, action, description)
VALUES
    ('all', 'system', 'all', 'Superuser wildcard permission bypass'),
    
    -- Products & Catalog
    ('products.read', 'products', 'read', 'View catalog products and public specs'),
    ('products.create', 'products', 'create', 'Create new product listings'),
    ('products.update', 'products', 'update', 'Edit product details, images, and compatibility'),
    ('products.delete', 'products', 'delete', 'Archive or delete products'),
    ('products.import', 'products', 'import', 'Upload and process bulk Excel/CSV product imports'),
    ('products.export', 'products', 'export', 'Export product catalogs and spreadsheets'),
    ('products.bulk_update', 'products', 'bulk_update', 'Perform mass batch updates across catalog'),
    ('categories.manage', 'categories', 'manage', 'Create and modify category hierarchies'),
    ('brands.manage', 'brands', 'manage', 'Create and modify phone brands and device models'),

    -- Pricing
    ('pricing.read', 'pricing', 'read', 'View cost prices, margins, and tier prices'),
    ('pricing.update', 'pricing', 'update', 'Modify product retail, sale, or B2B prices'),
    ('pricing.bulk_percentage', 'pricing', 'bulk_percentage', 'Execute bulk percentage price adjustments'),
    ('pricing.b2b_tiers', 'pricing', 'b2b_tiers', 'Manage B2B discount tiers and volume breaks'),
    ('pricing.customer_override', 'pricing', 'customer_override', 'Set bespoke negotiated prices for clients'),

    -- Inventory
    ('inventory.read', 'inventory', 'read', 'View stock levels and inventory ledger'),
    ('inventory.adjust', 'inventory', 'adjust', 'Execute stock adjustments, counts, and write-offs'),
    ('inventory.receive', 'inventory', 'receive', 'Process inbound supplier shipments'),

    -- Orders & Logistics
    ('orders.read', 'orders', 'read', 'View all customer and B2B orders'),
    ('orders.create', 'orders', 'create', 'Create backoffice or manual orders'),
    ('orders.update', 'orders', 'update', 'Modify order details and advance fulfillment states'),
    ('orders.cancel', 'orders', 'cancel', 'Cancel orders and release stock reservations'),
    ('orders.refund', 'orders', 'refund', 'Issue financial refunds or store credits'),
    ('delivery.dispatch', 'delivery', 'dispatch', 'Generate courier manifests with EcoTrack'),
    ('delivery.manage_rates', 'delivery', 'manage_rates', 'Configure 58 Wilaya shipping rate matrix'),

    -- B2B & Customers
    ('customers.read', 'customers', 'read', 'View customer profiles and order histories'),
    ('customers.update', 'customers', 'update', 'Edit customer details or block accounts'),
    ('b2b.read', 'b2b', 'read', 'View B2B business profiles and tax credentials'),
    ('b2b.approve', 'b2b', 'approve', 'Approve or reject B2B wholesale applications'),
    ('b2b.manage_pricing', 'b2b', 'manage_pricing', 'Assign credit limits and B2B tiers to businesses'),

    -- Administration & Governance
    ('users.manage', 'users', 'manage', 'Invite staff members and assign roles'),
    ('settings.manage', 'settings', 'manage', 'Configure site settings, API keys, and notification templates'),
    ('audit.read', 'audit', 'read', 'Inspect immutable activity and change logs')
ON CONFLICT (code) DO NOTHING;

-- 4. Role-Permission Assignments
DO $$
DECLARE
    role_rec RECORD;
    perm_rec RECORD;
BEGIN
    -- OWNER gets 'all'
    FOR role_rec IN SELECT id FROM public.roles WHERE code = 'OWNER' LOOP
        FOR perm_rec IN SELECT id FROM public.permissions WHERE code = 'all' LOOP
            INSERT INTO public.role_permissions (role_id, permission_id) 
            VALUES (role_rec.id, perm_rec.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;

    -- ADMINISTRATOR gets all except 'all'
    FOR role_rec IN SELECT id FROM public.roles WHERE code = 'ADMINISTRATOR' LOOP
        FOR perm_rec IN SELECT id FROM public.permissions WHERE code != 'all' LOOP
            INSERT INTO public.role_permissions (role_id, permission_id) 
            VALUES (role_rec.id, perm_rec.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;

    -- SALES_MANAGER
    FOR role_rec IN SELECT id FROM public.roles WHERE code = 'SALES_MANAGER' LOOP
        FOR perm_rec IN SELECT id FROM public.permissions WHERE code IN (
            'products.read', 'products.export',
            'pricing.read', 'pricing.update', 'pricing.bulk_percentage', 'pricing.b2b_tiers', 'pricing.customer_override',
            'orders.read', 'orders.create',
            'customers.read', 'customers.update', 'b2b.read', 'b2b.approve', 'b2b.manage_pricing',
            'inventory.read'
        ) LOOP
            INSERT INTO public.role_permissions (role_id, permission_id) 
            VALUES (role_rec.id, perm_rec.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;

    -- ORDER_MANAGER
    FOR role_rec IN SELECT id FROM public.roles WHERE code = 'ORDER_MANAGER' LOOP
        FOR perm_rec IN SELECT id FROM public.permissions WHERE code IN (
            'products.read', 'inventory.read',
            'orders.read', 'orders.create', 'orders.update', 'orders.cancel',
            'delivery.dispatch', 'customers.read'
        ) LOOP
            INSERT INTO public.role_permissions (role_id, permission_id) 
            VALUES (role_rec.id, perm_rec.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;

    -- INVENTORY_MANAGER
    FOR role_rec IN SELECT id FROM public.roles WHERE code = 'INVENTORY_MANAGER' LOOP
        FOR perm_rec IN SELECT id FROM public.permissions WHERE code IN (
            'products.read', 'products.export', 'products.import',
            'inventory.read', 'inventory.adjust', 'inventory.receive'
        ) LOOP
            INSERT INTO public.role_permissions (role_id, permission_id) 
            VALUES (role_rec.id, perm_rec.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;

    -- CONTENT_MANAGER
    FOR role_rec IN SELECT id FROM public.roles WHERE code = 'CONTENT_MANAGER' LOOP
        FOR perm_rec IN SELECT id FROM public.permissions WHERE code IN (
            'products.read', 'products.create', 'products.update', 'products.import', 'products.export', 'products.bulk_update',
            'categories.manage', 'brands.manage'
        ) LOOP
            INSERT INTO public.role_permissions (role_id, permission_id) 
            VALUES (role_rec.id, perm_rec.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;

    -- SUPPORT
    FOR role_rec IN SELECT id FROM public.roles WHERE code = 'SUPPORT' LOOP
        FOR perm_rec IN SELECT id FROM public.permissions WHERE code IN (
            'products.read', 'orders.read', 'customers.read'
        ) LOOP
            INSERT INTO public.role_permissions (role_id, permission_id) 
            VALUES (role_rec.id, perm_rec.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;

    -- VIEWER
    FOR role_rec IN SELECT id FROM public.roles WHERE code = 'VIEWER' LOOP
        FOR perm_rec IN SELECT id FROM public.permissions WHERE code IN (
            'products.read', 'products.export', 'pricing.read', 'inventory.read', 'orders.read', 'customers.read', 'audit.read'
        ) LOOP
            INSERT INTO public.role_permissions (role_id, permission_id) 
            VALUES (role_rec.id, perm_rec.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;

    -- B2C & B2B CUSTOMER
    FOR role_rec IN SELECT id FROM public.roles WHERE code IN ('B2C_CUSTOMER', 'B2B_CUSTOMER') LOOP
        FOR perm_rec IN SELECT id FROM public.permissions WHERE code IN ('products.read', 'orders.create') LOOP
            INSERT INTO public.role_permissions (role_id, permission_id) 
            VALUES (role_rec.id, perm_rec.id) ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- 5. Seed B2B Pricing Tiers
INSERT INTO public.b2b_pricing_tiers (tier_code, tier_name, default_discount_percentage, minimum_monthly_volume_dzd)
VALUES
    ('TIER_1', 'Standard Repair Shop', 0.00, 0.00),
    ('TIER_2', 'Silver Repair Partner', 5.00, 200000.00),
    ('TIER_3', 'Gold Fleet Workshop', 10.00, 500000.00),
    ('VIP_DISTRIBUTOR', 'VIP Regional Distributor', 15.00, 1500000.00)
ON CONFLICT (tier_code) DO NOTHING;

-- 6. Seed Courier Providers
INSERT INTO public.courier_providers (code, name, is_active, config)
VALUES
    ('ECOTRACK', 'EcoTrack Express Algeria', true, '{"tracking_url": "https://ecotrack.dz/track/", "auto_dispatch": true}'::jsonb),
    ('YALIDINE', 'Yalidine Fast Logistics', true, '{"tracking_url": "https://yalidine.app/tracking/", "auto_dispatch": false}'::jsonb),
    ('INTERNAL', 'HamzaPhone Magasin / Livraison Propre', true, '{"description": "Livraison directe ou retrait au magasin"}'::jsonb)
ON CONFLICT (code) DO NOTHING;
