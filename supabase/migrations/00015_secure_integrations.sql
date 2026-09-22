-- DRIPIDIN Migration 00015: Secure Integrations & Secret Management Vault
-- Phase 5: AES-256-GCM Encrypted Secret Vault, Non-Secret Integration Configs, RLS, and Immutability Triggers

-- 1. Integration Non-Secret Operational Configurations
CREATE TABLE IF NOT EXISTS public.integration_configs (
    id VARCHAR(64) PRIMARY KEY,                         -- 'ecotrack', 'email', 'sms', 'whatsapp', 'telegram', 'supabase_auth', 'supabase_storage', 'oauth_google', 'monitoring'
    enabled BOOLEAN NOT NULL DEFAULT true,
    environment VARCHAR(16) NOT NULL DEFAULT 'sandbox', -- 'sandbox' | 'production'
    api_url TEXT,
    non_secret_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_tested_at TIMESTAMPTZ,
    last_test_success BOOLEAN,
    last_test_message TEXT,
    last_test_latency_ms INTEGER,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_integration_configs_enabled ON public.integration_configs(enabled);
CREATE INDEX IF NOT EXISTS idx_integration_configs_environment ON public.integration_configs(environment);

-- 2. Encrypted Integration Secrets Vault
CREATE TABLE IF NOT EXISTS public.integration_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id VARCHAR(64) NOT NULL REFERENCES public.integration_configs(id) ON DELETE CASCADE,
    key_name VARCHAR(64) NOT NULL,                      -- 'ECOTRACK_API_TOKEN', 'ECOTRACK_WEBHOOK_SECRET', etc.
    encrypted_value TEXT NOT NULL,                      -- Ciphertext (base64)
    nonce TEXT NOT NULL,                                -- 12-byte IV (base64)
    auth_tag TEXT NOT NULL,                             -- 16-byte GCM authentication tag (base64)
    key_version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    UNIQUE(integration_id, key_name)
);

CREATE INDEX IF NOT EXISTS idx_integration_secrets_lookup ON public.integration_secrets(integration_id, key_name);
CREATE INDEX IF NOT EXISTS idx_integration_secrets_version ON public.integration_secrets(key_version);

-- 3. Row Level Security: Zero Direct Client Access to Secrets
ALTER TABLE public.integration_secrets ENABLE ROW LEVEL SECURITY;

-- Deny all direct client access (anon, authenticated, staff)
-- Secrets are accessible EXCLUSIVELY via service_role in trusted server-only functions
DROP POLICY IF EXISTS "Deny all client access to secrets" ON public.integration_secrets;
CREATE POLICY "Deny all client access to secrets"
    ON public.integration_secrets FOR ALL
    USING (false);

-- 4. Row Level Security: Integration Configs (Non-Secret Parameters)
ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;

-- Staff view operational configs
DROP POLICY IF EXISTS "Staff view integration configs" ON public.integration_configs;
CREATE POLICY "Staff view integration configs"
    ON public.integration_configs FOR SELECT
    USING (public.has_permission('settings.manage') OR public.is_staff());

-- Authorized managers insert operational configs
DROP POLICY IF EXISTS "Authorized managers insert integration configs" ON public.integration_configs;
CREATE POLICY "Authorized managers insert integration configs"
    ON public.integration_configs FOR INSERT
    WITH CHECK (public.has_permission('settings.manage'));

-- Authorized managers update operational configs
DROP POLICY IF EXISTS "Authorized managers update integration configs" ON public.integration_configs;
CREATE POLICY "Authorized managers update integration configs"
    ON public.integration_configs FOR UPDATE
    USING (public.has_permission('settings.manage'))
    WITH CHECK (public.has_permission('settings.manage'));

-- Owner only delete operational configs
DROP POLICY IF EXISTS "Owner only delete integration configs" ON public.integration_configs;
CREATE POLICY "Owner only delete integration configs"
    ON public.integration_configs FOR DELETE
    USING (public.has_permission('all'));

-- 5. Audit Log Immutability Trigger (Condition 5 Satisfaction)
CREATE OR REPLACE FUNCTION public.prevent_audit_log_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are strictly immutable. UPDATE and DELETE operations are prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_log_tampering ON public.audit_logs;
CREATE TRIGGER trg_prevent_audit_log_tampering
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_tampering();

-- 6. Granular Permission Seed: integrations.manage_secrets
INSERT INTO public.permissions (code, resource, action, description)
VALUES ('integrations.manage_secrets', 'integrations', 'manage_secrets', 'Configure, rotate, and delete encrypted integration credentials')
ON CONFLICT (code) DO NOTHING;

-- Grant exclusively to OWNER role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.code = 'OWNER' AND p.code = 'integrations.manage_secrets'
ON CONFLICT DO NOTHING;

-- 7. Initial Seed for Non-Secret Integration Operational Configs
INSERT INTO public.integration_configs (id, enabled, environment, api_url, non_secret_config)
VALUES
    ('ecotrack', true, 'sandbox', 'https://api.ecotrack.dz/api/v1', '{"providerCode": "ECOTRACK", "providerDisplayName": "EcoTrack Express Algérie (58 Wilayas)", "allowCustomerToOpenParcel": true, "defaultPackageWeightKg": 0.5}'::jsonb),
    ('email', true, 'sandbox', 'smtp://smtp.resend.com:587', '{"provider": "Resend / SMTP", "senderEmail": "contact@dripidin.dz", "senderName": "DRIPIDIN", "b2bInvoiceAttachment": true}'::jsonb),
    ('sms', true, 'sandbox', 'https://api.maghrebsms.dz/v1', '{"provider": "MaghrebSMS / Ooredoo Algérie", "senderId": "DRIPIDIN", "orderConfirmationSms": true, "outForDeliverySms": true}'::jsonb),
    ('whatsapp', true, 'sandbox', 'https://graph.facebook.com/v19.0', '{"provider": "Meta WhatsApp Cloud API", "phoneNumberId": "109876543210987", "sendTrackingLink": true, "sendInvoicePdf": true}'::jsonb),
    ('telegram', true, 'sandbox', 'https://api.telegram.org', '{"provider": "Telegram Bot API", "channelOrChatId": "@dripidin_alerts", "operationalAlerts": true, "lowStockAlerts": true}'::jsonb),
    ('supabase_auth', true, 'production', NULL, '{"provider": "Supabase GoTrue Auth", "jwtExpirySeconds": 3600, "enableB2BApprovalGate": true}'::jsonb),
    ('supabase_storage', true, 'production', NULL, '{"provider": "Supabase S3 Storage", "publicBucket": "product-images", "maxUploadSizeBytes": 5242880}'::jsonb),
    ('oauth_google', false, 'sandbox', NULL, '{"provider": "Google Identity Services (OAuth 2.0)", "redirectUri": "/auth/callback"}'::jsonb),
    ('monitoring', false, 'sandbox', NULL, '{"provider": "Sentry / Vercel OpenTelemetry", "tracesSampleRate": 0.1}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW();
