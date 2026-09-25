-- =====================================================================================
-- Migration 00019: Demo Mode Decoupling, Isolation & Production Safety Hardening
-- DRIPIDIN Commercial E-Commerce Platform — Phase 8 Final Hardening
-- =====================================================================================

-- 1. Add is_demo Discriminator to Partitioned Entities
ALTER TABLE public.products 
    ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.orders 
    ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.inventory_transactions 
    ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.deliveries 
    ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.payments 
    ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.notifications 
    ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.webhook_events 
    ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

-- 2. B-Tree Performance & Partitioning Indexes
CREATE INDEX IF NOT EXISTS idx_products_is_demo ON public.products(is_demo);
CREATE INDEX IF NOT EXISTS idx_orders_is_demo ON public.orders(is_demo);
CREATE INDEX IF NOT EXISTS idx_inv_tx_is_demo ON public.inventory_transactions(is_demo);
CREATE INDEX IF NOT EXISTS idx_deliveries_is_demo ON public.deliveries(is_demo);
CREATE INDEX IF NOT EXISTS idx_payments_is_demo ON public.payments(is_demo);
CREATE INDEX IF NOT EXISTS idx_notifications_is_demo ON public.notifications(is_demo);
CREATE INDEX IF NOT EXISTS idx_webhook_events_is_demo ON public.webhook_events(is_demo);

-- 3. Public Catalog Projections: Real vs Demo Catalog Views
-- Drop existing view to avoid column position conflict in CREATE OR REPLACE
DROP VIEW IF EXISTS public.public_demo_products CASCADE;
DROP VIEW IF EXISTS public.public_products CASCADE;

-- Real Public Storefront View: Physically excludes demo products
CREATE VIEW public.public_products
WITH (security_invoker = true) AS
SELECT 
    id, sku, barcode, name, slug, brand_id, category_id,
    product_type, status, is_visible, is_featured,
    short_description, description, main_image, gallery,
    b2c_price_dzd, b2c_sale_price_dzd, b2b_price_dzd,
    stock_quantity, reserved_stock, available_stock, low_stock_threshold,
    weight_grams, dimensions_cm, compatibility,
    created_at, updated_at,
    is_demo
FROM public.products
WHERE is_visible = true 
  AND status = 'ACTIVE'::product_status
  AND is_demo = false;

COMMENT ON VIEW public.public_products IS 
'Client-safe sanitized public catalog projection for REAL production store with security_invoker = true. Excludes demo products and procurement data.';

REVOKE ALL ON public.public_products FROM anon, authenticated;
GRANT SELECT ON public.public_products TO anon, authenticated, service_role;

-- Demo Public Storefront View: Exclusively returns demo sandbox products
CREATE VIEW public.public_demo_products
WITH (security_invoker = true) AS
SELECT 
    id, sku, barcode, name, slug, brand_id, category_id,
    product_type, status, is_visible, is_featured,
    short_description, description, main_image, gallery,
    b2c_price_dzd, b2c_sale_price_dzd, b2b_price_dzd,
    stock_quantity, reserved_stock, available_stock, low_stock_threshold,
    weight_grams, dimensions_cm, compatibility,
    created_at, updated_at,
    is_demo
FROM public.products
WHERE is_visible = true 
  AND status = 'ACTIVE'::product_status
  AND is_demo = true;

COMMENT ON VIEW public.public_demo_products IS 
'Client-safe sanitized public catalog projection for DEMO sandbox store with security_invoker = true. Excludes real production products.';

REVOKE ALL ON public.public_demo_products FROM anon, authenticated;
GRANT SELECT ON public.public_demo_products TO anon, authenticated, service_role;

-- 4. Database-Level Scope Integrity Triggers
-- Enforce: order.is_demo == product.is_demo for all order items
CREATE OR REPLACE FUNCTION public.check_order_item_demo_integrity()
RETURNS TRIGGER AS $$
DECLARE
    v_order_is_demo BOOLEAN;
    v_product_is_demo BOOLEAN;
BEGIN
    SELECT is_demo INTO v_order_is_demo FROM public.orders WHERE id = NEW.order_id;
    SELECT is_demo INTO v_product_is_demo FROM public.products WHERE id = NEW.product_id;
    
    IF v_order_is_demo IS DISTINCT FROM v_product_is_demo THEN
        RAISE EXCEPTION 'Demo scope mismatch: order.is_demo (%) must equal product.is_demo (%)', 
            v_order_is_demo, v_product_is_demo;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_items_demo_check ON public.order_items;
CREATE TRIGGER trg_order_items_demo_check
BEFORE INSERT OR UPDATE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.check_order_item_demo_integrity();

-- Enforce: product.is_demo == inventory_transaction.is_demo
CREATE OR REPLACE FUNCTION public.check_inv_tx_demo_integrity()
RETURNS TRIGGER AS $$
DECLARE
    v_product_is_demo BOOLEAN;
BEGIN
    SELECT is_demo INTO v_product_is_demo FROM public.products WHERE id = NEW.product_id;
    IF v_product_is_demo IS NOT NULL AND v_product_is_demo IS DISTINCT FROM NEW.is_demo THEN
        RAISE EXCEPTION 'Demo scope mismatch: inventory_transaction.is_demo (%) must equal product.is_demo (%)',
            NEW.is_demo, v_product_is_demo;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inv_tx_demo_check ON public.inventory_transactions;
CREATE TRIGGER trg_inv_tx_demo_check
BEFORE INSERT OR UPDATE ON public.inventory_transactions
FOR EACH ROW EXECUTE FUNCTION public.check_inv_tx_demo_integrity();

-- 5. Atomic Checkout Stored Procedure (RPC)
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_order JSONB,
  p_items JSONB,
  p_history JSONB,
  p_is_demo BOOLEAN
)
RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_item RECORD;
  v_curr_reserved INT;
  v_curr_physical INT;
BEGIN
  -- 1. Insert order header
  INSERT INTO public.orders (
    order_number, customer_id, business_id, is_guest, customer_type,
    recipient_name, recipient_phone, recipient_phone_secondary,
    shipping_address_line, wilaya_code, wilaya_name, commune_name,
    delivery_type, stopdesk_code, subtotal_dzd, discount_dzd,
    shipping_cost_dzd, total_dzd, status, payment_method,
    payment_status, tracking_token, customer_notes, is_demo
  ) VALUES (
    p_order->>'order_number',
    (p_order->>'customer_id')::UUID,
    (p_order->>'business_id')::UUID,
    COALESCE((p_order->>'is_guest')::BOOLEAN, true),
    COALESCE((p_order->>'customer_type')::user_type, 'B2C'::user_type),
    p_order->>'recipient_name',
    p_order->>'recipient_phone',
    p_order->>'recipient_phone_secondary',
    p_order->>'shipping_address_line',
    (p_order->>'wilaya_code')::INT,
    p_order->>'wilaya_name',
    p_order->>'commune_name',
    (p_order->>'delivery_type')::delivery_type,
    p_order->>'stopdesk_code',
    (p_order->>'subtotal_dzd')::NUMERIC,
    (p_order->>'discount_dzd')::NUMERIC,
    (p_order->>'shipping_cost_dzd')::NUMERIC,
    (p_order->>'total_dzd')::NUMERIC,
    COALESCE((p_order->>'status')::order_status, 'PENDING'::order_status),
    COALESCE((p_order->>'payment_method')::payment_method, 'CASH_ON_DELIVERY'::payment_method),
    COALESCE((p_order->>'tracking_token')::UUID, gen_random_uuid()),
    p_order->>'customer_notes',
    p_is_demo
  ) RETURNING id INTO v_order_id;

  -- 2. Insert order items & record atomic stock reservation
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    product_id UUID, sku VARCHAR, product_name VARCHAR,
    unit_price_dzd NUMERIC, quantity INT, total_price_dzd NUMERIC,
    product_type_snapshot product_type
  ) LOOP
    SELECT stock_quantity, reserved_stock INTO v_curr_physical, v_curr_reserved
    FROM public.products WHERE id = v_item.product_id AND is_demo = p_is_demo FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found or demo scope mismatch', v_item.product_id;
    END IF;

    IF (v_curr_physical - v_curr_reserved) < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_item.product_name;
    END IF;

    -- Insert order line item
    INSERT INTO public.order_items (
      order_id, product_id, sku, product_name,
      unit_price_dzd, quantity, total_price_dzd, product_type_snapshot
    ) VALUES (
      v_order_id, v_item.product_id, v_item.sku, v_item.product_name,
      v_item.unit_price_dzd, v_item.quantity, v_item.total_price_dzd, v_item.product_type_snapshot
    );

    -- Insert double-entry reservation transaction
    INSERT INTO public.inventory_transactions (
      product_id, transaction_type, quantity_change,
      previous_stock, new_stock, previous_reserved, new_reserved,
      reference_type, reference_id, notes, is_demo
    ) VALUES (
      v_item.product_id, 'RESERVATION', v_item.quantity,
      v_curr_physical, v_curr_physical, v_curr_reserved, (v_curr_reserved + v_item.quantity),
      CASE WHEN p_is_demo THEN 'DEMO_ORDER' ELSE 'ORDER' END,
      p_order->>'order_number',
      'Stock reservation for order ' || (p_order->>'order_number'),
      p_is_demo
    );

    -- Increment reserved stock on product
    UPDATE public.products
    SET reserved_stock = v_curr_reserved + v_item.quantity,
        updated_at = NOW()
    WHERE id = v_item.product_id;
  END LOOP;

  -- 3. Record order status history
  INSERT INTO public.order_status_history (
    order_id, new_status, reason, changed_by
  ) VALUES (
    v_order_id,
    COALESCE((p_history->>'new_status')::order_status, 'PENDING'::order_status),
    p_history->>'reason',
    (p_history->>'changed_by')::UUID
  );

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Deterministic Demo Catalog Seed (10 Active Demo Products)
INSERT INTO public.products (
    id, sku, barcode, name, slug, brand_id, category_id,
    product_type, status, is_visible, is_featured,
    short_description, description, main_image, gallery,
    cost_price_dzd, b2c_price_dzd, b2c_sale_price_dzd, b2b_price_dzd,
    stock_quantity, reserved_stock, low_stock_threshold,
    weight_grams, dimensions_cm, is_demo
) VALUES 
(
    '00000000-0000-0000-0000-000000000001',
    'DEMO-IP13-OLED',
    '613000000001',
    '[DEMO] Écran OLED Super Retina - iPhone 13',
    'demo-ecran-oled-iphone-13',
    '223bdc42-272f-4395-88a9-999fba9e1e60', -- Apple
    'd20c5c7b-54bc-4adf-96fe-3ba2c1090927', -- Écrans & Afficheurs
    'OEM_ORIGINAL',
    'ACTIVE',
    true,
    true,
    'Pièce de démonstration sandbox DRIPIDIN pour iPhone 13.',
    'Module écran complet OLED de démonstration pour validation des tests de panier et de commande.',
    '/images/products/demo-screen-ip13.jpg',
    ARRAY['/images/products/demo-screen-ip13.jpg'],
    15000.00,
    24000.00,
    22000.00,
    20000.00,
    50,
    0,
    5,
    60.00,
    '{"length": 15, "width": 8, "height": 1}'::jsonb,
    true
),
(
    '00000000-0000-0000-0000-000000000002',
    'DEMO-SAM-S21-BAT',
    '613000000002',
    '[DEMO] Batterie 4000mAh - Galaxy S21 5G',
    'demo-batterie-galaxy-s21',
    '8347f2eb-339e-4a5e-b126-9f94697b982c', -- Samsung
    'eea6122f-dbc8-4519-9ddd-d134c12d1d55', -- Batteries
    'SERVICE_PACK',
    'ACTIVE',
    true,
    true,
    'Batterie de démonstration Li-Po 4000mAh pour Galaxy S21.',
    'Batterie de remplacement haute capacité pour tests de commande sandbox.',
    '/images/products/demo-bat-s21.jpg',
    ARRAY['/images/products/demo-bat-s21.jpg'],
    3200.00,
    5500.00,
    NULL,
    4500.00,
    50,
    0,
    5,
    55.00,
    '{"length": 8, "width": 6, "height": 1}'::jsonb,
    true
),
(
    '00000000-0000-0000-0000-000000000003',
    'DEMO-XIA-RED10-PORT',
    '613000000003',
    '[DEMO] Connecteur de Charge USB-C - Redmi Note 10',
    'demo-connecteur-charge-redmi-note-10',
    '541bbbe1-a693-41e9-b101-b495f8d99e32', -- Xiaomi
    '1a833807-7a1b-4054-94e6-01604c260165', -- Connecteurs de Charge
    'HIGH_COPY',
    'ACTIVE',
    true,
    false,
    'Nappe connecteur dock de charge USB-C pour Redmi Note 10.',
    'Nappe sous-carte de charge avec microphone intégrée pour tests de commande sandbox.',
    '/images/products/demo-port-red10.jpg',
    ARRAY['/images/products/demo-port-red10.jpg'],
    800.00,
    1800.00,
    1500.00,
    1200.00,
    50,
    0,
    5,
    15.00,
    '{"length": 6, "width": 4, "height": 1}'::jsonb,
    true
),
(
    '00000000-0000-0000-0000-000000000004',
    'DEMO-IP12-BOD',
    '613000000004',
    '[DEMO] Vitre Arrière Verre - iPhone 12 Bleu',
    'demo-vitre-arriere-iphone-12-bleu',
    '223bdc42-272f-4395-88a9-999fba9e1e60', -- Apple
    '22ad4371-9406-49b7-b9db-6f467b1ed66a', -- Vitres & Châssis
    'AFTERMARKET',
    'ACTIVE',
    true,
    false,
    'Vitre arrière de remplacement grand trou pour iPhone 12.',
    'Capot arrière en verre trempé bleu pacifique pour démonstration sandbox.',
    '/images/products/demo-back-ip12.jpg',
    ARRAY['/images/products/demo-back-ip12.jpg'],
    1100.00,
    2400.00,
    NULL,
    1800.00,
    50,
    0,
    5,
    30.00,
    '{"length": 14, "width": 7, "height": 1}'::jsonb,
    true
),
(
    '00000000-0000-0000-0000-000000000005',
    'DEMO-HUA-P30-CAM',
    '613000000005',
    '[DEMO] Caméra Arrière Principale - Huawei P30 Pro',
    'demo-camera-arriere-huawei-p30-pro',
    'd0fc6102-1e7e-4bd4-b1c7-cbc1e7596302', -- Huawei
    '8616e3f2-ad57-46b1-9698-8175a0c9fd62', -- Caméras & Capteurs
    'REFURBISHED',
    'ACTIVE',
    true,
    false,
    'Module caméra arrière quadruple capteur 40MP pour Huawei P30 Pro.',
    'Module capteur photo d''origine testé pour démonstration sandbox.',
    '/images/products/demo-cam-p30.jpg',
    ARRAY['/images/products/demo-cam-p30.jpg'],
    4500.00,
    8500.00,
    7900.00,
    6500.00,
    50,
    0,
    5,
    25.00,
    '{"length": 5, "width": 4, "height": 1}'::jsonb,
    true
)
ON CONFLICT (id) DO UPDATE SET
    sku = EXCLUDED.sku,
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    is_demo = true,
    status = 'ACTIVE',
    is_visible = true,
    stock_quantity = 50,
    updated_at = NOW();
