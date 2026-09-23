-- DRIPIDIN Migration 00018: SEO Settings Expansion
-- Authoritative persistent storage for white-label canonical URL, search engine indexability, link following, and social identity.

ALTER TABLE public.store_settings
    ADD COLUMN IF NOT EXISTS canonical_base_url TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS seo_indexable BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS seo_follow_links BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS twitter_handle VARCHAR(64) DEFAULT '';

COMMENT ON COLUMN public.store_settings.canonical_base_url IS 'Production canonical root URL (e.g., https://mystore.com). Used for rel=canonical, sitemaps, and OpenGraph.';
COMMENT ON COLUMN public.store_settings.seo_indexable IS 'Global search engine indexability toggle (index vs noindex in robots and metadata).';
COMMENT ON COLUMN public.store_settings.seo_follow_links IS 'Global search engine link follow toggle (follow vs nofollow in robots and metadata).';
COMMENT ON COLUMN public.store_settings.twitter_handle IS 'Optional Twitter/X handle for twitter:site and twitter:creator metadata (e.g., @storehandle).';
