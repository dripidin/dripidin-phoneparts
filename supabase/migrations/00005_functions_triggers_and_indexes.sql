-- HamzaPhone Migration 00005: Functions, Triggers, Full-Text Search & Real-time Stock Automation

-- 1. Helper Functions for RBAC & Authorization
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS VARCHAR AS $$
    SELECT r.code 
    FROM public.roles r
    JOIN public.user_roles ur ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.has_permission(required_perm VARCHAR)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.permissions p
        JOIN public.role_permissions rp ON rp.permission_id = p.id
        JOIN public.user_roles ur ON ur.role_id = rp.role_id
        WHERE ur.user_id = auth.uid()
          AND (p.code = required_perm OR p.code = 'all')
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles pr
        WHERE pr.id = auth.uid()
          AND pr.user_type = 'STAFF'
          AND pr.is_active = true
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_business_id()
RETURNS UUID AS $$
    SELECT business_id
    FROM public.business_members
    WHERE user_id = auth.uid()
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Generic updated_at Timestamp Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach updated_at triggers
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
          AND table_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON public.%I', t);
        EXECUTE format('CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()', t);
    END LOOP;
END $$;

-- 3. Automatic Product Search Vector Generation
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text AS $$
    SELECT public.unaccent($1);
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(sku, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(barcode, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(supplier_sku, '')), 'A') ||
    setweight(to_tsvector('french', public.immutable_unaccent(coalesce(name, ''))), 'B') ||
    setweight(to_tsvector('simple', coalesce(compatibility::text, '')), 'B') ||
    setweight(to_tsvector('french', public.immutable_unaccent(coalesce(short_description, ''))), 'C') ||
    setweight(to_tsvector('french', public.immutable_unaccent(coalesce(description, ''))), 'D')
) STORED;

CREATE INDEX IF NOT EXISTS idx_products_search_vector ON public.products USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_products_sku_trgm ON public.products USING GIN (sku gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_supplier_sku_trgm ON public.products USING GIN (supplier_sku gin_trgm_ops);

-- 4. Instant Search RPC Function (Sub-50ms)
CREATE OR REPLACE FUNCTION public.search_products_instant(
    search_query TEXT,
    filter_brand_id UUID DEFAULT NULL,
    filter_category_id UUID DEFAULT NULL,
    max_results INT DEFAULT 8
)
RETURNS TABLE (
    id UUID,
    sku VARCHAR,
    barcode VARCHAR,
    name VARCHAR,
    slug VARCHAR,
    main_image TEXT,
    product_type product_type,
    b2c_price NUMERIC,
    b2c_sale_price NUMERIC,
    available_stock INT,
    relevance_score FLOAT
) AS $$
DECLARE
    cleaned_query TEXT := trim(search_query);
    formatted_tsquery tsquery;
BEGIN
    IF cleaned_query = '' OR cleaned_query IS NULL THEN
        RETURN;
    END IF;

    -- Form prefix query e.g. 'samsung:* & s21:*'
    formatted_tsquery := to_tsquery('simple', string_agg(quote_literal(term) || ':*', ' & '))
        FROM unnest(string_to_array(cleaned_query, ' ')) AS term
        WHERE length(term) > 0;

    RETURN QUERY
    SELECT 
        p.id,
        p.sku,
        p.barcode,
        p.name,
        p.slug,
        p.main_image,
        p.product_type,
        p.b2c_price_dzd AS b2c_price,
        p.b2c_sale_price_dzd AS b2c_sale_price,
        p.available_stock,
        (
            -- Exact SKU match boost
            (CASE WHEN p.sku ILIKE cleaned_query || '%' THEN 100.0 ELSE 0.0 END) +
            (CASE WHEN p.barcode = cleaned_query THEN 120.0 ELSE 0.0 END) +
            -- Full-text rank
            (COALESCE(ts_rank_cd(p.search_vector, formatted_tsquery), 0.0) * 50.0) +
            -- Trigram name similarity
            (similarity(p.name, cleaned_query) * 30.0) +
            -- In-stock bonus
            (CASE WHEN p.available_stock > 0 THEN 10.0 ELSE 0.0 END)
        )::FLOAT AS relevance_score
    FROM public.products p
    WHERE 
        p.status = 'ACTIVE' 
        AND p.is_visible = true
        AND (filter_brand_id IS NULL OR p.brand_id = filter_brand_id)
        AND (filter_category_id IS NULL OR p.category_id = filter_category_id)
        AND (
            p.search_vector @@ formatted_tsquery
            OR p.sku ILIKE '%' || cleaned_query || '%'
            OR p.barcode ILIKE '%' || cleaned_query || '%'
            OR p.name % cleaned_query
            OR p.compatibility::text ILIKE '%' || cleaned_query || '%'
        )
    ORDER BY relevance_score DESC, p.available_stock DESC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. Stock Automation Trigger on Inventory Transactions
CREATE OR REPLACE FUNCTION public.process_inventory_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Depending on transaction type, adjust stock_quantity and reserved_stock
    IF NEW.transaction_type = 'RECEIVING' OR NEW.transaction_type = 'CUSTOMER_RETURN_RESTOCK' THEN
        UPDATE public.products
        SET stock_quantity = stock_quantity + NEW.quantity_change
        WHERE id = NEW.product_id;

    ELSIF NEW.transaction_type = 'RESERVATION' THEN
        UPDATE public.products
        SET reserved_stock = reserved_stock + NEW.quantity_change
        WHERE id = NEW.product_id;

    ELSIF NEW.transaction_type = 'RESERVATION_RELEASE' THEN
        UPDATE public.products
        SET reserved_stock = GREATEST(0, reserved_stock - NEW.quantity_change)
        WHERE id = NEW.product_id;

    ELSIF NEW.transaction_type = 'FULFILLMENT_OUT' THEN
        UPDATE public.products
        SET stock_quantity = GREATEST(0, stock_quantity - NEW.quantity_change),
            reserved_stock = GREATEST(0, reserved_stock - NEW.quantity_change)
        WHERE id = NEW.product_id;

    ELSIF NEW.transaction_type = 'DAMAGED_WRITEOFF' OR NEW.transaction_type = 'SUPPLIER_RETURN' THEN
        UPDATE public.products
        SET stock_quantity = GREATEST(0, stock_quantity - NEW.quantity_change)
        WHERE id = NEW.product_id;

    ELSIF NEW.transaction_type = 'MANUAL_ADJUSTMENT' THEN
        UPDATE public.products
        SET stock_quantity = NEW.new_stock
        WHERE id = NEW.product_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inventory_transaction ON public.inventory_transactions;
CREATE TRIGGER trg_inventory_transaction
    AFTER INSERT ON public.inventory_transactions
    FOR EACH ROW EXECUTE FUNCTION public.process_inventory_transaction();
