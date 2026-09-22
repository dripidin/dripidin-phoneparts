-- DRIPIDIN Migration 00014: Commerce Settings & Currency Formatting
-- Extends public.store_settings to support white-label currency positioning,
-- tax display policies, and pluggable commercial rounding.

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS currency_position VARCHAR(8) NOT NULL DEFAULT 'AFTER'
    CHECK (currency_position IN ('BEFORE', 'AFTER')),
  ADD COLUMN IF NOT EXISTS currency_space_separated BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS prices_include_tax BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_cash_on_delivery BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_commercial_rounding BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS commercial_rounding_unit INTEGER NOT NULL DEFAULT 10
    CHECK (commercial_rounding_unit IN (10, 50, 100));

COMMENT ON COLUMN public.store_settings.currency_position IS 'Placement of currency symbol: BEFORE ($100) or AFTER (100 DA)';
COMMENT ON COLUMN public.store_settings.currency_space_separated IS 'Whether space separates currency symbol and amount (e.g. 1 500 DA vs $1500)';
COMMENT ON COLUMN public.store_settings.prices_include_tax IS 'Whether storefront prices are displayed tax-inclusive (TTC) or tax-exclusive (HT)';
COMMENT ON COLUMN public.store_settings.enable_cash_on_delivery IS 'Store-level toggle to offer Cash On Delivery at checkout';
COMMENT ON COLUMN public.store_settings.enable_commercial_rounding IS 'Whether commercial cash rounding is applied to totals';
COMMENT ON COLUMN public.store_settings.commercial_rounding_unit IS 'Commercial cash rounding step (10, 50, or 100 DA)';
