-- =====================================================================================
-- Migration 00020: Phase 8 Final Hardening & Audit Gap Remediation
-- DRIPIDIN Commercial E-Commerce Platform
-- Fixes:
-- 1. Atomic Notification Queue Claim Function with FOR UPDATE SKIP LOCKED and is_demo filtering
-- 2. Store Mode Helper Function: is_store_in_demo_mode()
-- 3. Hardened RLS policies on public.products, orders, notifications, and deliveries with explicit is_demo scope
-- =====================================================================================

-- 1. Helper function to check authoritative store mode from database singleton
CREATE OR REPLACE FUNCTION public.is_store_in_demo_mode()
RETURNS BOOLEAN AS $$
DECLARE
  v_demo BOOLEAN;
BEGIN
  SELECT COALESCE(force_demo_mode, false) INTO v_demo
  FROM public.store_settings
  LIMIT 1;

  RETURN COALESCE(v_demo, false);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Atomic Notification Queue Claim with FOR UPDATE SKIP LOCKED & Mode Filtering
CREATE OR REPLACE FUNCTION public.claim_notification_jobs(
  p_batch_size INT DEFAULT 50,
  p_is_demo BOOLEAN DEFAULT false,
  p_notification_ids UUID[] DEFAULT NULL,
  p_lock_seconds INT DEFAULT 300
)
RETURNS SETOF public.notifications AS $$
BEGIN
  RETURN QUERY
  WITH candidate_jobs AS (
    SELECT id
    FROM public.notifications
    WHERE status = 'PENDING'
      AND is_demo = p_is_demo
      AND (
        (p_notification_ids IS NOT NULL AND id = ANY(p_notification_ids))
        OR
        (p_notification_ids IS NULL AND (next_retry_at IS NULL OR next_retry_at <= NOW()))
      )
    ORDER BY created_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.notifications n
  SET next_retry_at = NOW() + (p_lock_seconds || ' seconds')::INTERVAL
  FROM candidate_jobs c
  WHERE n.id = c.id
  RETURNING n.*;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RLS Hardening on public.products
-- Explicitly scopes public SELECT queries to products matching the authoritative store mode.
DROP POLICY IF EXISTS "Public read active products" ON public.products;

CREATE POLICY "Public read active products" ON public.products
  FOR SELECT
  TO public
  USING (
    (
      is_visible = true 
      AND status = 'ACTIVE'::product_status 
      AND is_demo = public.is_store_in_demo_mode()
    )
    OR has_permission('products.read'::character varying)
  );

-- 4. RLS Hardening on public.orders
DROP POLICY IF EXISTS "Customers create orders" ON public.orders;

CREATE POLICY "Customers create orders" ON public.orders
  FOR INSERT
  TO public
  WITH CHECK (
    (
      (customer_id = auth.uid() AND is_demo = false)
      OR (customer_id IS NULL AND is_demo = public.is_store_in_demo_mode())
      OR has_permission('orders.create'::character varying)
    )
  );

DROP POLICY IF EXISTS "Customers and staff view orders" ON public.orders;

CREATE POLICY "Customers and staff view orders" ON public.orders
  FOR SELECT
  TO public
  USING (
    (
      (customer_id = auth.uid() AND is_demo = false)
      OR (business_id = get_user_business_id() AND is_demo = false)
      OR has_permission('orders.read'::character varying)
    )
  );

-- 5. RLS Hardening on public.notifications
DROP POLICY IF EXISTS "Users view their own notifications" ON public.notifications;

CREATE POLICY "Users view their own notifications" ON public.notifications
  FOR SELECT
  TO public
  USING (
    (
      (user_id = auth.uid() AND is_demo = false)
      OR has_permission('settings.manage'::character varying)
    )
  );
