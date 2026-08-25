-- HamzaPhone Migration 00010: Durable Webhook Event Ingestion & Deduplication
-- Persistent table for webhook event log, replay protection, and idempotency guarantees

CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL, -- e.g. 'ECOTRACK'
    external_event_id TEXT, -- Unique ID provided by carrier if present
    event_type TEXT NOT NULL, -- e.g. 'DELIVERY_STATUS_UPDATE'
    shipment_id TEXT, -- Tracking number or order reference
    payload_hash TEXT NOT NULL, -- Deterministic SHA-256 fingerprint of validated payload
    payload JSONB NOT NULL, -- Raw sanitized incoming payload
    received_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    processed_at TIMESTAMPTZ,
    processing_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (processing_status IN ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'IGNORED')),
    attempt_count INTEGER NOT NULL DEFAULT 1 CHECK (attempt_count >= 1),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Unique constraints for strict deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_provider_hash 
    ON public.webhook_events (provider, payload_hash);

CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_provider_external_id 
    ON public.webhook_events (provider, external_event_id) 
    WHERE external_event_id IS NOT NULL;

-- Query performance indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_shipment_id ON public.webhook_events (shipment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON public.webhook_events (processing_status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at ON public.webhook_events (received_at DESC);

-- Enable RLS
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Service Role only (Webhooks are machine-to-machine, not directly queryable by public users)
CREATE POLICY "Service role can manage webhook events"
    ON public.webhook_events
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Staff with delivery permission can view webhook history for observability
CREATE POLICY "Staff with delivery permission can view webhook events"
    ON public.webhook_events
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.role_permissions rp ON ur.role_id = rp.role_id
            JOIN public.permissions p ON rp.permission_id = p.id
            WHERE ur.user_id = auth.uid()
            AND p.code IN ('all', 'delivery.read', 'delivery.manage')
        )
    );
