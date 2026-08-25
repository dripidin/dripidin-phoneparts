-- HamzaPhone Migration 00004: Inventory Ledger, Carts, Orders, Payments, Logistics, Notifications & Audit Logs

-- 1. Double-Entry Inventory Transactions
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    transaction_type inventory_transaction_type NOT NULL,
    quantity_change INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    previous_reserved INTEGER NOT NULL,
    new_reserved INTEGER NOT NULL,
    reference_type VARCHAR(64),       -- 'ORDER', 'PURCHASE_ORDER', 'IMPORT_BATCH', 'MANUAL_COUNT', 'RMA'
    reference_id VARCHAR(64),         -- Order UUID or Batch reference
    warehouse_bin VARCHAR(32),        -- Shelf location e.g. 'A-12-04'
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_inv_tx_product ON public.inventory_transactions(product_id, created_at DESC);
CREATE INDEX idx_inv_tx_ref ON public.inventory_transactions(reference_type, reference_id);

-- 2. Shopping Carts (Storefront Session & Logged-in Sync)
CREATE TABLE IF NOT EXISTS public.carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    session_id VARCHAR(128),          -- For guest visitors
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT cart_owner_check CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);
CREATE INDEX idx_carts_user ON public.carts(user_id);
CREATE INDEX idx_carts_session ON public.carts(session_id);

CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(cart_id, product_id)
);
CREATE INDEX idx_cart_items_cart ON public.cart_items(cart_id);

-- 3. Orders Master Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(32) UNIQUE NOT NULL, -- e.g. 'HP-2026-004921'
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
    is_guest BOOLEAN NOT NULL DEFAULT false,
    customer_type user_type NOT NULL DEFAULT 'B2C',
    
    -- Recipient & Delivery Contact Info
    recipient_name VARCHAR(150) NOT NULL,
    recipient_phone VARCHAR(32) NOT NULL,
    recipient_phone_secondary VARCHAR(32),
    shipping_address_line TEXT NOT NULL,
    wilaya_code INTEGER NOT NULL CHECK (wilaya_code BETWEEN 1 AND 58),
    wilaya_name VARCHAR(64) NOT NULL,
    commune_name VARCHAR(100) NOT NULL,
    delivery_type delivery_type NOT NULL DEFAULT 'HOME',
    stopdesk_code VARCHAR(32),
    
    -- Financial Totals (All in DZD)
    subtotal_dzd NUMERIC(12,2) NOT NULL CHECK (subtotal_dzd >= 0),
    discount_dzd NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (discount_dzd >= 0),
    shipping_cost_dzd NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (shipping_cost_dzd >= 0),
    total_dzd NUMERIC(12,2) NOT NULL CHECK (total_dzd >= 0),
    
    -- Order State & Payment
    status order_status NOT NULL DEFAULT 'PENDING',
    payment_method payment_method NOT NULL DEFAULT 'CASH_ON_DELIVERY',
    payment_status payment_status NOT NULL DEFAULT 'UNPAID',
    
    -- Courier Link
    tracking_number VARCHAR(64),
    courier_code VARCHAR(32) DEFAULT 'ECOTRACK',
    
    internal_notes TEXT,
    customer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_business ON public.orders(business_id);
CREATE INDEX idx_orders_wilaya ON public.orders(wilaya_code);
CREATE INDEX idx_orders_tracking ON public.orders(tracking_number);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);

-- 4. Order Line Items
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    sku VARCHAR(64) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    unit_price_dzd NUMERIC(12,2) NOT NULL CHECK (unit_price_dzd >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_price_dzd NUMERIC(12,2) NOT NULL CHECK (total_price_dzd >= 0),
    product_type_snapshot product_type,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);

-- 5. Order Status Transition Audit History
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    previous_status order_status,
    new_status order_status NOT NULL,
    reason TEXT,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_order_status_history_order ON public.order_status_history(order_id);

-- 6. Courier Logistics Providers (EcoTrack, Yalidine, etc.)
CREATE TABLE IF NOT EXISTS public.courier_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) UNIQUE NOT NULL,      -- 'ECOTRACK', 'YALIDINE', 'INTERNAL'
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Deliveries / Shipment Records
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    courier_code VARCHAR(32) NOT NULL DEFAULT 'ECOTRACK',
    tracking_number VARCHAR(64) NOT NULL,
    barcode VARCHAR(64),
    status delivery_status NOT NULL DEFAULT 'PENDING',
    label_url TEXT,
    cod_amount_dzd NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    tracking_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    dispatched_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(courier_code, tracking_number)
);
CREATE INDEX idx_deliveries_order ON public.deliveries(order_id);
CREATE INDEX idx_deliveries_tracking ON public.deliveries(tracking_number);

-- 8. Payments Ledger
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_method payment_method NOT NULL,
    payment_status payment_status NOT NULL DEFAULT 'UNPAID',
    amount_dzd NUMERIC(12,2) NOT NULL CHECK (amount_dzd >= 0),
    transaction_reference VARCHAR(128),
    gateway_response JSONB DEFAULT '{}'::jsonb,
    receipt_url TEXT,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_payments_order ON public.payments(order_id);

-- 9. Transactional Notifications Ledger
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    channel notification_channel NOT NULL,
    recipient VARCHAR(255) NOT NULL,       -- Phone number or email
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    status notification_status NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_status ON public.notifications(status);

-- 10. Immutable System Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_email VARCHAR(255) NOT NULL,
    actor_role VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,          -- e.g. 'PRICING.BULK_ADJUST', 'ORDER.STATUS_CHANGE'
    entity_type VARCHAR(64) NOT NULL,     -- e.g. 'PRODUCT', 'ORDER', 'BUSINESS', 'ROLE'
    entity_id VARCHAR(64),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
