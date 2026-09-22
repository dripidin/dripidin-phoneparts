-- =====================================================================================
-- Migration 00016: Notification Template Engine & Durable Asynchronous Dispatch Schema
-- DRIPIDIN Commercial E-Commerce Platform — Phase 6
-- =====================================================================================

-- 1. Additive enum extension for Telegram channel
DO $$ BEGIN
    ALTER TYPE notification_channel ADD VALUE IF NOT EXISTS 'TELEGRAM';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Dedicated Single-Tenant Notification Templates Table
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(64) NOT NULL,
    channel notification_channel NOT NULL,
    locale VARCHAR(10) NOT NULL DEFAULT 'fr-DZ',
    subject VARCHAR(255),                     -- Applicable for EMAIL and IN_APP
    body_text TEXT NOT NULL,                  -- Plain text body (mandatory for all channels)
    body_html TEXT,                           -- Sanitized HTML body (optional, for EMAIL)
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_system_default BOOLEAN NOT NULL DEFAULT false,
    version INTEGER NOT NULL DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Composite Uniqueness: Exactly one template per Event x Channel x Locale
    CONSTRAINT uq_notification_template_identity UNIQUE (event_type, channel, locale)
);

-- Indices for high-speed runtime resolution
CREATE INDEX IF NOT EXISTS idx_notification_templates_lookup 
    ON public.notification_templates(event_type, channel, locale, is_active);
CREATE INDEX IF NOT EXISTS idx_notification_templates_channel
    ON public.notification_templates(channel);

-- 3. Non-Destructive Enhancements to Existing public.notifications for Durable Queueing
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255);
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS max_retries INTEGER NOT NULL DEFAULT 3;

-- Unique constraint for deterministic deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_idempotency_key 
    ON public.notifications(idempotency_key) 
    WHERE idempotency_key IS NOT NULL;

-- Queue processor index for rapid claiming of pending jobs
CREATE INDEX IF NOT EXISTS idx_notifications_pending_queue 
    ON public.notifications(status, next_retry_at) 
    WHERE status = 'PENDING';

-- 4. Row Level Security (RLS) on notification_templates
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Deny all access to anonymous users
DROP POLICY IF EXISTS "Public anonymous cannot view notification templates" ON public.notification_templates;
CREATE POLICY "Public anonymous cannot view notification templates"
    ON public.notification_templates FOR SELECT
    TO anon
    USING (false);

-- Staff read access: requires notifications.read or notifications.manage
DROP POLICY IF EXISTS "Staff can read notification templates" ON public.notification_templates;
CREATE POLICY "Staff can read notification templates"
    ON public.notification_templates FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.role_permissions rp ON ur.role_id = rp.role_id
            JOIN public.permissions p ON rp.permission_id = p.id
            WHERE ur.user_id = auth.uid()
            AND p.code IN ('notifications.read', 'notifications.manage')
        )
    );

-- Staff modification access: requires notifications.manage
DROP POLICY IF EXISTS "Staff can modify notification templates" ON public.notification_templates;
CREATE POLICY "Staff can modify notification templates"
    ON public.notification_templates FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.role_permissions rp ON ur.role_id = rp.role_id
            JOIN public.permissions p ON rp.permission_id = p.id
            WHERE ur.user_id = auth.uid()
            AND p.code = 'notifications.manage'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.role_permissions rp ON ur.role_id = rp.role_id
            JOIN public.permissions p ON rp.permission_id = p.id
            WHERE ur.user_id = auth.uid()
            AND p.code = 'notifications.manage'
        )
    );

-- 5. Seed Granular RBAC Permissions
INSERT INTO public.permissions (code, resource, action, description)
VALUES 
    ('notifications.read', 'notifications', 'read', 'View notification logs, metrics, and template configurations'),
    ('notifications.manage', 'notifications', 'manage', 'Create, customize, and reset notification templates and retry failed dispatches')
ON CONFLICT (code) DO NOTHING;

-- Grant permissions to administrative roles
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.code IN ('OWNER', 'ADMIN') 
  AND p.code IN ('notifications.read', 'notifications.manage')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.code IN ('ORDER_MANAGER', 'INVENTORY_MANAGER') 
  AND p.code = 'notifications.read'
ON CONFLICT DO NOTHING;
