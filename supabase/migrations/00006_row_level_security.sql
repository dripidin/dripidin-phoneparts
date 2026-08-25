-- HamzaPhone Migration 00006: Row Level Security (RLS) Policies

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_compatibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.b2b_pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_tier_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_specific_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (id = auth.uid() OR public.has_permission('users.manage') OR public.has_permission('customers.read'));

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid() OR public.has_permission('users.manage'))
    WITH CHECK (id = auth.uid() OR public.has_permission('users.manage'));

-- 2. RBAC Tables (Roles, Permissions, Assignments)
CREATE POLICY "Public read for system roles"
    ON public.roles FOR SELECT
    USING (true);

CREATE POLICY "Staff manage roles"
    ON public.roles FOR ALL
    USING (public.has_permission('users.manage'))
    WITH CHECK (public.has_permission('users.manage'));

CREATE POLICY "Staff read permissions"
    ON public.permissions FOR SELECT
    USING (public.has_permission('users.manage') OR public.is_staff());

CREATE POLICY "Staff view role permissions"
    ON public.role_permissions FOR SELECT
    USING (true);

CREATE POLICY "Users view own roles"
    ON public.user_roles FOR SELECT
    USING (user_id = auth.uid() OR public.has_permission('users.manage'));

CREATE POLICY "Staff manage user roles"
    ON public.user_roles FOR ALL
    USING (public.has_permission('users.manage'))
    WITH CHECK (public.has_permission('users.manage'));

-- 3. Businesses & B2B Members
CREATE POLICY "Members view their own business"
    ON public.businesses FOR SELECT
    USING (
        id = public.get_user_business_id() 
        OR public.has_permission('b2b.read') 
        OR public.has_permission('b2b.approve')
    );

CREATE POLICY "Staff manage businesses"
    ON public.businesses FOR ALL
    USING (public.has_permission('b2b.approve') OR public.has_permission('b2b.manage_pricing'))
    WITH CHECK (public.has_permission('b2b.approve') OR public.has_permission('b2b.manage_pricing'));

CREATE POLICY "Members view business colleagues"
    ON public.business_members FOR SELECT
    USING (
        business_id = public.get_user_business_id()
        OR public.has_permission('b2b.read')
    );

-- 4. Addresses
CREATE POLICY "Users view and manage own addresses"
    ON public.addresses FOR ALL
    USING (
        user_id = auth.uid() 
        OR business_id = public.get_user_business_id()
        OR public.has_permission('customers.read')
    )
    WITH CHECK (
        user_id = auth.uid() 
        OR business_id = public.get_user_business_id()
        OR public.has_permission('customers.update')
    );

-- 5. Catalog (Brands, Categories, Device Models)
CREATE POLICY "Public read active brands"
    ON public.brands FOR SELECT
    USING (is_active = true OR public.has_permission('brands.manage'));

CREATE POLICY "Staff manage brands"
    ON public.brands FOR ALL
    USING (public.has_permission('brands.manage'))
    WITH CHECK (public.has_permission('brands.manage'));

CREATE POLICY "Public read active categories"
    ON public.categories FOR SELECT
    USING (is_active = true OR public.has_permission('categories.manage'));

CREATE POLICY "Staff manage categories"
    ON public.categories FOR ALL
    USING (public.has_permission('categories.manage'))
    WITH CHECK (public.has_permission('categories.manage'));

CREATE POLICY "Public read active device models"
    ON public.device_models FOR SELECT
    USING (is_active = true OR public.has_permission('brands.manage'));

CREATE POLICY "Staff manage device models"
    ON public.device_models FOR ALL
    USING (public.has_permission('brands.manage'))
    WITH CHECK (public.has_permission('brands.manage'));

-- 6. Products & Images
CREATE POLICY "Public read active products"
    ON public.products FOR SELECT
    USING (
        (is_visible = true AND status = 'ACTIVE') 
        OR public.has_permission('products.read')
    );

CREATE POLICY "Staff manage products"
    ON public.products FOR ALL
    USING (public.has_permission('products.update') OR public.has_permission('products.create'))
    WITH CHECK (public.has_permission('products.update') OR public.has_permission('products.create'));

CREATE POLICY "Public read product images"
    ON public.product_images FOR SELECT
    USING (true);

CREATE POLICY "Staff manage product images"
    ON public.product_images FOR ALL
    USING (public.has_permission('products.update'))
    WITH CHECK (public.has_permission('products.update'));

CREATE POLICY "Public read product compatibility"
    ON public.product_compatibility FOR SELECT
    USING (true);

CREATE POLICY "Staff manage product compatibility"
    ON public.product_compatibility FOR ALL
    USING (public.has_permission('products.update'))
    WITH CHECK (public.has_permission('products.update'));

-- 7. Suppliers
CREATE POLICY "Staff read suppliers"
    ON public.suppliers FOR SELECT
    USING (public.has_permission('pricing.read') OR public.has_permission('inventory.read'));

CREATE POLICY "Staff manage suppliers"
    ON public.suppliers FOR ALL
    USING (public.has_permission('settings.manage') OR public.has_permission('pricing.update'))
    WITH CHECK (public.has_permission('settings.manage') OR public.has_permission('pricing.update'));

CREATE POLICY "Staff read supplier products"
    ON public.supplier_products FOR SELECT
    USING (public.has_permission('pricing.read') OR public.has_permission('inventory.read'));

-- 8. Pricing & Price History
CREATE POLICY "Staff read B2B pricing tiers"
    ON public.b2b_pricing_tiers FOR SELECT
    USING (true);

CREATE POLICY "Staff manage B2B pricing tiers"
    ON public.b2b_pricing_tiers FOR ALL
    USING (public.has_permission('pricing.b2b_tiers'))
    WITH CHECK (public.has_permission('pricing.b2b_tiers'));

CREATE POLICY "B2B and Staff view tier prices"
    ON public.b2b_tier_prices FOR SELECT
    USING (
        public.is_staff()
        OR public.get_user_role() = 'B2B_CUSTOMER'
        OR public.has_permission('pricing.read')
    );

CREATE POLICY "Staff view and manage customer specific prices"
    ON public.customer_specific_prices FOR ALL
    USING (
        business_id = public.get_user_business_id()
        OR user_id = auth.uid()
        OR public.has_permission('pricing.customer_override')
        OR public.has_permission('pricing.read')
    )
    WITH CHECK (public.has_permission('pricing.customer_override'));

CREATE POLICY "Staff view price history"
    ON public.price_history FOR SELECT
    USING (public.has_permission('pricing.read'));

-- 9. Inventory Ledger
CREATE POLICY "Staff view inventory ledger"
    ON public.inventory_transactions FOR SELECT
    USING (public.has_permission('inventory.read'));

CREATE POLICY "Staff record inventory adjustments"
    ON public.inventory_transactions FOR INSERT
    WITH CHECK (public.has_permission('inventory.adjust') OR public.has_permission('orders.update'));

-- 10. Shopping Carts
CREATE POLICY "Users manage their own carts"
    ON public.carts FOR ALL
    USING (user_id = auth.uid() OR business_id = public.get_user_business_id())
    WITH CHECK (user_id = auth.uid() OR business_id = public.get_user_business_id());

CREATE POLICY "Users manage their own cart items"
    ON public.cart_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.carts c 
            WHERE c.id = cart_items.cart_id 
              AND (c.user_id = auth.uid() OR c.business_id = public.get_user_business_id())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.carts c 
            WHERE c.id = cart_items.cart_id 
              AND (c.user_id = auth.uid() OR c.business_id = public.get_user_business_id())
        )
    );

-- 11. Orders & Order Items
CREATE POLICY "Customers and staff view orders"
    ON public.orders FOR SELECT
    USING (
        customer_id = auth.uid()
        OR business_id = public.get_user_business_id()
        OR public.has_permission('orders.read')
    );

CREATE POLICY "Customers create orders"
    ON public.orders FOR INSERT
    WITH CHECK (
        customer_id = auth.uid()
        OR customer_id IS NULL -- Guest order creation
        OR public.has_permission('orders.create')
    );

CREATE POLICY "Staff update orders"
    ON public.orders FOR UPDATE
    USING (public.has_permission('orders.update'))
    WITH CHECK (public.has_permission('orders.update'));

CREATE POLICY "Users view relevant order items"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
              AND (o.customer_id = auth.uid() OR o.business_id = public.get_user_business_id() OR public.has_permission('orders.read'))
        )
    );

CREATE POLICY "Order status history view"
    ON public.order_status_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_status_history.order_id
              AND (o.customer_id = auth.uid() OR o.business_id = public.get_user_business_id() OR public.has_permission('orders.read'))
        )
    );

-- 12. Deliveries, Courier Providers & Payments
CREATE POLICY "Public read active courier providers"
    ON public.courier_providers FOR SELECT
    USING (true);

CREATE POLICY "Users view related deliveries"
    ON public.deliveries FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = deliveries.order_id
              AND (o.customer_id = auth.uid() OR o.business_id = public.get_user_business_id() OR public.has_permission('orders.read'))
        )
    );

CREATE POLICY "Staff manage deliveries"
    ON public.deliveries FOR ALL
    USING (public.has_permission('delivery.dispatch') OR public.has_permission('orders.update'))
    WITH CHECK (public.has_permission('delivery.dispatch') OR public.has_permission('orders.update'));

CREATE POLICY "Users view related payments"
    ON public.payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = payments.order_id
              AND (o.customer_id = auth.uid() OR o.business_id = public.get_user_business_id() OR public.has_permission('orders.read'))
        )
    );

CREATE POLICY "Staff manage payments"
    ON public.payments FOR ALL
    USING (public.has_permission('orders.update') OR public.has_permission('orders.refund'))
    WITH CHECK (public.has_permission('orders.update') OR public.has_permission('orders.refund'));

-- 13. Notifications
CREATE POLICY "Users view their own notifications"
    ON public.notifications FOR SELECT
    USING (user_id = auth.uid() OR public.has_permission('settings.manage'));

-- 14. Audit Logs (Immutable append-only)
CREATE POLICY "Authorized staff view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.has_permission('audit.read'));

CREATE POLICY "System insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (true);
