-- HamzaPhone Migration 00008: Additional Entities, Security Optimizations & Algerian Wilayas Rate Matrix

-- 1. Add tracking_token to Orders Table for Secure Guest Tracking (Fix for CRIT-02)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tracking_token UUID NOT NULL DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON public.orders(tracking_token);

-- 2. Asynchronous Import Jobs & Staging Table (Fix for HIGH-05)
CREATE TABLE IF NOT EXISTS public.import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(512),
    import_type VARCHAR(32) NOT NULL DEFAULT 'FULL_CATALOG', -- 'FULL_CATALOG', 'PRICES_ONLY', 'STOCK_ONLY', 'COMPATIBILITY'
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED')),
    total_rows INT NOT NULL DEFAULT 0,
    created_rows INT NOT NULL DEFAULT 0,
    updated_rows INT NOT NULL DEFAULT 0,
    error_rows INT NOT NULL DEFAULT 0,
    errors_summary JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON public.import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created_by ON public.import_jobs(created_by);

-- 3. Back-in-Stock Customer Subscriptions
CREATE TABLE IF NOT EXISTS public.stock_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_notified BOOLEAN NOT NULL DEFAULT false,
    notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_product ON public.stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_email ON public.stock_alerts(email);

-- 4. Customer Verified Reviews & Social Proof
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    author_name VARCHAR(100) NOT NULL,
    city VARCHAR(64),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_verified_purchase BOOLEAN NOT NULL DEFAULT true,
    is_approved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_approved ON public.product_reviews(is_approved);

-- 5. Algerian Wilayas (58 Wilayas) Reference Table & Shipping Rate Matrix
CREATE TABLE IF NOT EXISTS public.wilayas (
    code INTEGER PRIMARY KEY CHECK (code BETWEEN 1 AND 58),
    name_fr VARCHAR(64) NOT NULL,
    name_ar VARCHAR(64) NOT NULL,
    zone VARCHAR(32) NOT NULL DEFAULT 'NORD', -- 'NORD', 'HAUTS_PLATEAUX', 'SUD', 'GRAND_SUD'
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.delivery_rate_matrix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wilaya_code INTEGER NOT NULL REFERENCES public.wilayas(code) ON DELETE CASCADE,
    courier_code VARCHAR(32) NOT NULL DEFAULT 'ECOTRACK',
    home_delivery_dzd NUMERIC(10,2) NOT NULL DEFAULT 600.00 CHECK (home_delivery_dzd >= 0),
    stopdesk_delivery_dzd NUMERIC(10,2) NOT NULL DEFAULT 400.00 CHECK (stopdesk_delivery_dzd >= 0),
    estimated_days_min INTEGER NOT NULL DEFAULT 1,
    estimated_days_max INTEGER NOT NULL DEFAULT 3,
    free_shipping_threshold_dzd NUMERIC(12,2) DEFAULT 20000.00,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(wilaya_code, courier_code)
);
CREATE INDEX IF NOT EXISTS idx_delivery_rate_matrix_wilaya ON public.delivery_rate_matrix(wilaya_code);

-- 6. Expression Trigram GIN Index for Compatibility Searches (Fix for CRIT-05)
CREATE INDEX IF NOT EXISTS idx_products_compat_trgm 
ON public.products USING GIN ((compatibility::text) gin_trgm_ops);

-- 7. Public Sanitized Catalog View to Shield Cost Price & Supplier Margins (Fix for CRIT-01)
CREATE OR REPLACE VIEW public.public_products AS
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
WHERE is_visible = true AND status = 'ACTIVE';

-- 8. Secure RPC for Masked Guest Order Tracking (Fix for CRIT-02)
CREATE OR REPLACE FUNCTION public.get_guest_order_tracking(
    p_order_number VARCHAR,
    p_phone VARCHAR,
    p_tracking_token UUID DEFAULT NULL
)
RETURNS TABLE (
    order_number VARCHAR,
    status order_status,
    created_at TIMESTAMPTZ,
    recipient_masked_name VARCHAR,
    wilaya_name VARCHAR,
    commune_name VARCHAR,
    delivery_type delivery_type,
    tracking_number VARCHAR,
    courier_code VARCHAR,
    total_dzd NUMERIC,
    item_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.order_number,
        o.status,
        o.created_at,
        (SUBSTRING(o.recipient_name FROM 1 FOR 1) || '*** ' || COALESCE(SPLIT_PART(o.recipient_name, ' ', 2), ''))::VARCHAR AS recipient_masked_name,
        o.wilaya_name,
        o.commune_name,
        o.delivery_type,
        o.tracking_number,
        o.courier_code,
        o.total_dzd,
        COUNT(oi.id) AS item_count
    FROM public.orders o
    LEFT JOIN public.order_items oi ON oi.order_id = o.id
    WHERE o.order_number = p_order_number
      AND (
          (p_tracking_token IS NOT NULL AND o.tracking_token = p_tracking_token)
          OR (o.recipient_phone = p_phone OR o.recipient_phone_secondary = p_phone)
      )
    GROUP BY o.id, o.order_number, o.status, o.created_at, o.recipient_name, o.wilaya_name, o.commune_name, o.delivery_type, o.tracking_number, o.courier_code, o.total_dzd
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 9. Atomic Stock Reservation Function for High-Concurrency Checkout (Fix for HIGH-10)
CREATE OR REPLACE FUNCTION public.reserve_order_stock(
    p_order_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    item RECORD;
    v_available INT;
BEGIN
    -- Loop through all items of the order, locking rows
    FOR item IN 
        SELECT oi.product_id, oi.quantity, p.available_stock, p.sku
        FROM public.order_items oi
        JOIN public.products p ON p.id = oi.product_id
        WHERE oi.order_id = p_order_id
        FOR UPDATE OF p
    LOOP
        -- Check if enough available stock
        IF item.available_stock < item.quantity THEN
            RAISE EXCEPTION 'INSUFFICIENT_STOCK: Product % (SKU: %) has only % available, % requested',
                item.product_id, item.sku, item.available_stock, item.quantity;
        END IF;

        -- Insert inventory transaction (which triggers stock reservation update)
        INSERT INTO public.inventory_transactions (
            product_id,
            transaction_type,
            quantity_change,
            previous_stock,
            new_stock,
            previous_reserved,
            new_reserved,
            reference_type,
            reference_id,
            notes
        )
        SELECT 
            p.id,
            'RESERVATION'::inventory_transaction_type,
            item.quantity,
            p.stock_quantity,
            p.stock_quantity,
            p.reserved_stock,
            p.reserved_stock + item.quantity,
            'ORDER',
            p_order_id::VARCHAR,
            'Atomic checkout reservation'
        FROM public.products p
        WHERE p.id = item.product_id;
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Enable RLS on New Tables
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wilayas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_rate_matrix ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active wilayas"
    ON public.wilayas FOR SELECT
    USING (is_active = true);

CREATE POLICY "Public read active delivery rates"
    ON public.delivery_rate_matrix FOR SELECT
    USING (is_available = true);

CREATE POLICY "Staff manage wilayas and rates"
    ON public.wilayas FOR ALL
    USING (public.has_permission('settings.manage') OR public.has_permission('delivery.manage_rates'))
    WITH CHECK (public.has_permission('settings.manage') OR public.has_permission('delivery.manage_rates'));

CREATE POLICY "Staff manage delivery rate matrix"
    ON public.delivery_rate_matrix FOR ALL
    USING (public.has_permission('delivery.manage_rates'))
    WITH CHECK (public.has_permission('delivery.manage_rates'));

CREATE POLICY "Staff view and manage import jobs"
    ON public.import_jobs FOR ALL
    USING (public.has_permission('products.import') OR public.is_staff())
    WITH CHECK (public.has_permission('products.import') OR public.is_staff());

CREATE POLICY "Public insert stock alerts"
    ON public.stock_alerts FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Staff view stock alerts"
    ON public.stock_alerts FOR SELECT
    USING (public.has_permission('inventory.read') OR public.is_staff());

CREATE POLICY "Public read approved product reviews"
    ON public.product_reviews FOR SELECT
    USING (is_approved = true OR public.has_permission('products.update'));

CREATE POLICY "Customers create product reviews"
    ON public.product_reviews FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Staff manage product reviews"
    ON public.product_reviews FOR ALL
    USING (public.has_permission('products.update'))
    WITH CHECK (public.has_permission('products.update'));
