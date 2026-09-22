# DRIPIDIN — Phase 3 Commerce Settings, Currency & Country Boundary Implementation Report

## Executive Summary

Phase 3 — Commerce Settings, Currency & Country Boundary has been successfully implemented, tested, type-checked, and production-built for the DRIPIDIN white-label e-commerce platform.

This phase transforms the previous hard-coded, Algeria- and DZD-centric commerce logic into a modular, strongly typed, and configurable foundation while strictly preserving 100% of existing Algerian production functionality:
- 58 Wilayas and communes data structures remain intact.
- Delivery rate matrix and EcoTrack courier integration remain operational.
- Existing COD (Cash On Delivery) workflows remain fully active by default.
- Live database columns with physical naming (`b2c_price_dzd`, `total_dzd`, etc.) remain intact with a zero-breaking-change domain mapping layer.
- Developer Platform Attribution (`DRIPIDIN Platform`) remains untouched and protected.

### Key Metrics:
- **Phase 3 Test Suite**: 29/29 tests passed across 7 suites (`src/lib/money/phase-3-commerce.test.ts`).
- **Full Project Test Suite**: 294/294 tests passed across 124 test suites (0 regressions).
- **TypeScript Typecheck**: 0 errors (`npm run typecheck`).
- **Next.js Production Build**: Succeeded (`npm run build`), generating 24/24 static/dynamic routes.
- **Supabase Migration**: Applied `00014_commerce_settings.sql` to live production Supabase (`ljvyjueqkgttbzmfvhou`) and verified live schema.

---

## Architecture Implemented

The Phase 3 architecture introduces clear separation of concerns across five primary tiers:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           STORE SETTINGS                                │
│  public.store_settings (PostgreSQL singleton row: id = 'default')        │
│  - currencyCode ('DZD', 'EUR', 'USD', etc.)                             │
│  - currencySymbol, currencyDecimals, currencyPosition                   │
│  - commercialRoundingEnabled, commercialRoundingUnit (10, 50, 100)      │
│  - orderPrefix, invoicePrefix, taxDisplayMode                           │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          COUNTRY PROFILE                                │
│  CountryRegistry.get(code: string): CountryProfile                      │
│  - Regional metadata: isoCode, defaultLocale, defaultCurrency, timezone  │
│  - Geographic boundary: subdivisionType ('wilaya' | 'department')        │
│  - Address rules & required fields (Wilaya, Commune)                   │
│  - Phone sanitization & validation (Algerian mobile +213, French +33)   │
│  - Fiscal identification specifications (NIF, NIS, RC, SIRET, TVA)     │
│  - Regional payment & checkout constraints (COD permitted)              │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 COMMERCE CAPABILITIES / BUSINESS MODEL                  │
│  CommerceCapabilitiesResolver.resolve(settings, profile)                │
│  - b2b, wholesalePricing, productVariants, compatibility                │
│  - deviceSpecs, inventoryTracking, reviews, wishlist, compare           │
│  - Feature flags decoupled from hard-coded store branch logic           │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         MONEY / CURRENCY ENGINE                         │
│  - Money representation: value in base units, internal scale factor     │
│  - MoneyMath: safe arithmetic (add, sub, mul, div, cmp, allocate)       │
│  - CommercialRoundingPolicy: Standard half-up vs Algerian 10 DA cash    │
│  - MoneyFormatter: locale-aware formatting, symbol placement & spacing │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION CONSUMERS                           │
│  - Storefront Catalog, Cart, Checkout, Order Summary, Account Views     │
│  - useFormatPrice() React hook & formatPriceWithSettings() server helper│
│  - Admin OMS Order Details, Invoices, Settings UI                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Money Representation

Financial calculations are safeguarded against JavaScript IEEE 754 floating-point rounding errors and accumulation drift.

### 1. Representation Model
Financial values are represented using the immutable `Money` interface:
```typescript
export interface Money {
  readonly amount: number;      // Exact base units (e.g. 1500.50 DA or €15.50)
  readonly currency: string;    // ISO 4217 code ('DZD', 'EUR', 'USD', etc.)
  readonly scale: number;       // Fixed scale factor (default: 10,000)
}
```

### 2. Arithmetic Safety Guarantees
- **Internal Integer Scaling**: All arithmetic operations in `MoneyMath` scale decimal numbers by `SCALE_FACTOR = 10,000` (`SCALE_DECIMALS = 4`), convert them to integers with `Math.round()`, perform the operation, and convert back.
- **Floating-Point Accumulation Drift**: Completely eliminated in multi-item sums (e.g., cart lines, taxes, discounts).
- **Pro-Rata Allocation**: `MoneyMath.allocate()` implements the Largest Remainder Method (Hamilton-Hare method) to distribute discounts or taxes across line items down to minor units (centimes/cents) without losing a single unit of currency.
- **Explicit Invariant**: Authoritative financial calculation does NOT rely on `floating point accumulation + toFixed() + string manipulation`.

### 3. Core Engine Methods (`MoneyMath`)
- `create(amount, currency?)`: Validates and instantiates immutable `Money`.
- `add(a, b)` / `subtract(a, b)`: Currency-matching strict addition and subtraction.
- `multiply(money, factor)` / `divide(money, divisor)`: Scaled multiplication and division with half-up rounding.
- `allocate(money, ratios)`: Penny-perfect integer allocation.
- `toMinorUnits(money)` / `fromMinorUnits(units, currency)`: Conversion to/from integer minor units (e.g. 1500 DZD = 150000 centimes, 15.50 EUR = 1550 cents).
- `compare(a, b)` / `greaterThan(a, b)` / `lessThan(a, b)`: Exact value comparison.

---

## Currency Configuration

The currency system separates **Country**, **Currency**, and **Locale**:
- `Country != Currency`: A store in Algeria can operate with EUR or USD without assuming automatic foreign exchange.
- `Locale != Currency`: `fr-DZ`, `ar-DZ`, `en-US`, and `fr-FR` can format any currency code according to the store's configured formatting options.

### Currency Registry (`CURRENCY_REGISTRY`)
Supported out of the box with complete metadata:
- **DZD (Algerian Dinar)**: Symbol `DA`, 0 standard decimals, symbol after with space (`1 500 DA`).
- **EUR (Euro)**: Symbol `€`, 2 standard decimals, symbol after with space in FR locale (`15,50 €`).
- **USD (US Dollar)**: Symbol `$`, 2 standard decimals, symbol before without space (`$15.50`).
- **GBP (British Pound)**: Symbol `£`, 2 standard decimals, symbol before without space (`£15.50`).
- **JPY (Japanese Yen)**: Symbol `¥`, 0 standard decimals, symbol before without space (`¥1,500`).

### Central Formatting Engine (`MoneyFormatter`)
Centralized in `src/lib/money/formatter.ts`:
- Replaces scattered `.toLocaleString('fr-DZ')` and ad-hoc concatenation (`" DA"`).
- Respects store settings: `currencyCode`, `currencySymbol`, `currencyDecimals`, `currencyPosition` (`before` | `after`), `currencySpaceSeparated`.
- Accessible via client hook `useFormatPrice()` and server helper `formatPriceWithSettings()`.

---

## CountryProfile

Regional business rules are isolated into typed `CountryProfile` contracts (`src/lib/country/types.ts`).

### Algeria Profile (`DZ`) — `src/lib/country/profiles/algeria.ts`
Preserves all existing Algerian requirements:
- **Identity**: `DZ`, Algeria / Algérie, timezone `Africa/Algiers`.
- **Default Locale & Currency**: `fr-DZ`, `DZD`.
- **Subdivision Contract**: References existing `public.wilayas` table (58 Wilayas) and `communes`. Does **not** duplicate or replace database records.
- **Phone Validation**: Validates Algerian 10-digit mobile numbers starting with `05`, `06`, or `07` (or international `+2135/6/7`). Cleans and normalizes strings.
- **Fiscal Identifiers**: Specification for `NIF` (15 digits), `NIS` (15 digits), `RC` (Commercial Register), and `AI` (Article d'Imposition).
- **Payment & Checkout**: COD is permitted; phone number is mandatory for checkout verification; commune is required.

### France Reference Profile (`FR`) — `src/lib/country/profiles/france.ts`
Validates that the contract can represent European/foreign jurisdictions:
- **Identity**: `FR`, France, timezone `Europe/Paris`.
- **Default Locale & Currency**: `fr-FR`, `EUR`.
- **Subdivision Contract**: Administrative departments and postal codes.
- **Phone Validation**: French phone format (`01-09` or `+33`).
- **Fiscal Identifiers**: SIRET (14 digits), SIREN (9 digits), TVA Intracommunautaire (`FR` + 11 chars).
- **Payment & Checkout**: COD is not permitted by default; strict postal code validation required.

### Country Registry (`CountryRegistry`)
- Resolves profiles deterministically: `CountryRegistry.get('DZ')`.
- Safe fallback: Unrecognized or missing country codes safely resolve to `algeriaProfile`.

---

## Commerce Capabilities

Replaced prospective hard-coded `if (storeType === 'phone')` condition trees with a capability-oriented model (`src/lib/capabilities/`).

### Defined Capabilities:
- `b2b`: Wholesale customer registration, tier-based pricing, tax exemption, proforma invoices.
- `wholesalePricing`: Tiered volume pricing matrix.
- `productVariants`: Multi-attribute SKU options (colors, storage capacity, grades).
- `compatibility`: Device/model compatibility checking (e.g. spare parts fitting specific phones).
- `deviceSpecs`: Technical hardware specifications table.
- `inventoryTracking`: Real-time stock reservation and backorder handling.
- `reviews`: Customer ratings and verified purchase reviews.
- `wishlist`: Customer saved items list.
- `compare`: Side-by-side product attribute comparison.
- `codPayment`: Cash on delivery support.
- `commercialRounding`: Commercial cash rounding policy.

### Capability Resolver (`CommerceCapabilitiesResolver`)
- Resolves active capability set dynamically based on store settings, active country profile, and business mode.
- Strongly typed boolean record `Record<CommerceCapability, boolean>`.
- Components query `capabilities.b2b` or `capabilities.compatibility` rather than hardcoding industry verticals.

---

## Domain Mapping

Physical database column names with historical suffixes are isolated via a domain mapping layer:

### Mapping Table:
| Live PostgreSQL Column | Domain Model Field | Money Object | Formatted Display |
| :--- | :--- | :--- | :--- |
| `b2c_price_dzd` | `price` | `MoneyMath.create(product.b2c_price_dzd, currency)` | `formatPrice(product.b2c_price_dzd)` |
| `b2b_price_dzd` | `wholesalePrice` | `MoneyMath.create(product.b2b_price_dzd, currency)` | `formatPrice(product.b2b_price_dzd)` |
| `cost_price_dzd` | `costPrice` | `MoneyMath.create(product.cost_price_dzd, currency)` | `formatPrice(product.cost_price_dzd)` |
| `subtotal_dzd` | `subtotal` | `MoneyMath.create(order.subtotal_dzd, currency)` | `formatPrice(order.subtotal_dzd)` |
| `shipping_cost_dzd` | `shippingCost` | `MoneyMath.create(order.shipping_cost_dzd, currency)` | `formatPrice(order.shipping_cost_dzd)` |
| `discount_dzd` | `discount` | `MoneyMath.create(order.discount_dzd, currency)` | `formatPrice(order.discount_dzd)` |
| `tax_dzd` | `tax` | `MoneyMath.create(order.tax_dzd, currency)` | `formatPrice(order.tax_dzd)` |
| `total_dzd` | `total` | `MoneyMath.create(order.total_dzd, currency)` | `formatPrice(order.total_dzd)` |
| `free_shipping_threshold_dzd` | `freeShippingThreshold` | `MoneyMath.create(settings.freeShippingThresholdDzd, currency)` | `formatPrice(settings.freeShippingThresholdDzd)` |

Physical database columns were **NOT** renamed, ensuring zero downtime, no breaking database views, and 100% backward compatibility with all historical orders and invoices.

---

## Store Settings Changes

The `public.store_settings` table was extended with 10 additive columns via migration `00014_commerce_settings.sql`:

```sql
ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS currency_code text NOT NULL DEFAULT 'DZD',
  ADD COLUMN IF NOT EXISTS currency_symbol text NOT NULL DEFAULT 'DA',
  ADD COLUMN IF NOT EXISTS currency_decimals integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency_position text NOT NULL DEFAULT 'after'
    CHECK (currency_position IN ('before', 'after')),
  ADD COLUMN IF NOT EXISTS currency_space_separated boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS tax_display_mode text NOT NULL DEFAULT 'inclusive'
    CHECK (tax_display_mode IN ('inclusive', 'exclusive')),
  ADD COLUMN IF NOT EXISTS commercial_rounding_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS commercial_rounding_unit integer NOT NULL DEFAULT 10
    CHECK (commercial_rounding_unit IN (10, 50, 100)),
  ADD COLUMN IF NOT EXISTS order_prefix text NOT NULL DEFAULT 'CMD-',
  ADD COLUMN IF NOT EXISTS invoice_prefix text NOT NULL DEFAULT 'FAC-';
```

### Settings Integration:
- `StoreSettingsService` and `StoreSettingsRepository` map database snake_case columns to TypeScript camelCase properties (`currencyCode`, `currencySymbol`, `commercialRoundingEnabled`, etc.).
- Default values strictly preserve existing Algerian production store values.
- Admin UI (`WebsiteSettingsView`) includes a dedicated "Devise & Commerce" management tab.

---

## Tax Boundary

Tax handling is decoupled across three distinct responsibilities:
1. **Store Configuration**: `taxDisplayMode` (`inclusive` | `exclusive`) and store-level tax rate in `public.store_settings`.
2. **Country Profile**: National fiscal rules and identification requirements (`NIF`, `NIS`, `TVA`, `SIRET`).
3. **Transaction Calculation**: Order-level tax calculation via `MoneyMath.multiply(taxableSubtotal, taxRate)` with penny-perfect rounding.

Current Algerian retail commerce operates with prices including tax (TTC), which remains the default setting.

---

## COD Boundary

Cash on Delivery is structured across three decoupled layers:
1. **Store Settings**: Store-level toggle `codPaymentEnabled: boolean` in `public.store_settings`.
2. **Country Profile**: Regional support policy `isCodPermitted: boolean` on `CountryProfile`.
3. **Payment Layer**: Checkout payment selector renders COD option only if `settings.codPaymentEnabled && countryProfile.isCodPermitted`.

Algeria profile explicitly permits COD, and store settings retain COD enabled by default.

---

## Delivery Boundary

Phase 3 introduces no tight coupling to delivery implementations:
- `wilayas` and `delivery_rate_matrix` tables remain the authoritative source of delivery pricing in Algeria.
- EcoTrack integration records remain untouched.
- The `CountryProfile` defines only the geographic contract (`subdivisionType: 'wilaya' | 'department'`), not delivery fees or courier operational code.

---

## Locale Boundary

- Formatting utilities no longer hardcode `fr-DZ` across the entire codebase.
- `MoneyFormatter.format(money, { locale, ... })` accepts the active locale, with fallback to the store setting's country default locale.
- Decimal and thousand separators adapt dynamically:
  - `fr-DZ`: non-breaking space thousand separator, comma decimal separator (`1 500 DA`).
  - `en-US`: comma thousand separator, period decimal separator (`$1,500.00`).
  - `fr-FR`: non-breaking space thousand separator, comma decimal separator (`15,50 €`).

---

## Legacy Code Migrated

The following 17 storefront components were migrated from raw `.toLocaleString('fr-DZ')` or hardcoded `" DA"` concatenation to `useFormatPrice()`:

1. `src/components/storefront/catalog/product-card.tsx`
2. `src/components/storefront/catalog/active-filters.tsx`
3. `src/components/storefront/product-detail/product-info.tsx`
4. `src/components/storefront/cart/cart-item-card.tsx`
5. `src/components/storefront/cart/cart-page-view.tsx`
6. `src/components/storefront/layout/cart-drawer.tsx`
7. `src/components/storefront/layout/storefront-header.tsx`
8. `src/components/storefront/checkout/order-summary-card.tsx`
9. `src/components/storefront/checkout/delivery-step.tsx`
10. `src/components/storefront/checkout/order-confirmation-view.tsx`
11. `src/components/storefront/checkout/guest-tracking-view.tsx`
12. `src/components/storefront/account/order-history-list.tsx`
13. `src/components/storefront/account/order-detail-view.tsx`
14. `src/components/storefront/account/b2b-pricing-table.tsx`
15. `src/components/storefront/account/b2b-status-banner.tsx`
16. `src/components/storefront/account/b2b-business-view.tsx`
17. `src/components/storefront/search/instant-search-overlay.tsx`

### Core Services Migrated:
- `src/lib/services/checkout.service.ts`: Uses `StoreSettingsService` for `orderPrefix` and `freeShippingThresholdDzd`; calculates totals using `MoneyMath.add()`.
- `src/lib/services/pricing.service.ts`: `roundDzd` delegates to `AlgerianCommercialCashRoundingPolicy.round()`.
- `src/lib/validation/auth.schema.ts`, `order.schema.ts`, `account.schema.ts`: Phone validation delegates to `algeriaProfile.phone.validate()`.
- `src/lib/utils.ts`: `formatDZD()` delegates to `MoneyFormatter.format()`.

---

## Legacy Code Deferred

The following items are intentionally retained and deferred to later phases:
1. **Physical database column names** (`b2c_price_dzd`, `total_dzd`, etc.): Retained for zero-downtime database compatibility.
2. **Couriers & Delivery Matrices** (`wilayas`, EcoTrack): Deferred to **Phase 4 — Logistics Abstraction**.
3. **Historical test fixtures**: Retained in tests that explicitly verify backward compatibility with raw DZD values.
4. **Historical migrations**: Left immutable to preserve database migration continuity.

---

## Database Migration

Migration `supabase/migrations/00014_commerce_settings.sql` was executed on the live Supabase instance:
- Added 10 columns to `public.store_settings`.
- Safe defaults applied (`currency_code = 'DZD'`, `currency_symbol = 'DA'`, `currency_decimals = 0`, `currency_position = 'after'`, `commercial_rounding_enabled = true`, `order_prefix = 'CMD-'`).
- Live singleton record (`id = 'default'`) updated and verified via SQL query.

---

## Tests

A dedicated test suite was created: `src/lib/money/phase-3-commerce.test.ts`.

### Test Suites (29/29 Passed):
1. **MoneyMath Core Operations**:
   - Exact addition without floating point drift (`10.10 + 20.20 = 30.30`).
   - Currency mismatch protection (throws error if adding DZD to EUR).
   - Multiplication with half-up rounding.
   - Exact penny allocation via Largest Remainder Method (`allocate(100, [1, 1, 1]) = [33.34, 33.33, 33.33]`).
   - Minor units conversion (DZD centimes and EUR cents).
2. **Commercial Rounding Policies**:
   - `StandardRoundingPolicy`: Respects currency decimal places.
   - `AlgerianCommercialCashRoundingPolicy`: Commercial rounding to nearest 10 DA (`1234 -> 1230`, `1235 -> 1240`).
   - `RoundingPolicyResolver`: Resolves policy based on store settings.
3. **MoneyFormatter**:
   - DZD zero decimals formatting (`1 500 DA`).
   - EUR two decimals formatting (`15,50 €`).
   - USD symbol before formatting (`$15.50`).
   - Custom position and spacing configuration.
4. **CountryProfile & CountryRegistry**:
   - Algeria profile resolution (`DZ`, 58 Wilayas, COD permitted).
   - France profile resolution (`FR`, SIRET, COD disabled).
   - Unknown country code fallback to Algeria.
   - Algerian phone validation (`0550123456`, `+213793731310` valid; invalid lengths rejected).
5. **CommerceCapabilities**:
   - Deterministic capability resolution for phone store vs fashion store.
6. **StoreSettings Mapping**:
   - `mapRowToStoreSettings` maps snake_case DB row to camelCase types.
   - `mapInputToRow` handles partial updates and preserves defaults.
7. **Order & Invoice Prefix Generation**:
   - Generates deterministic prefixed order numbers (`CMD-20260909-XXXX`).

### Full Project Regression Run:
- **Total Test Suites**: 124 passed, 124 total.
- **Total Tests**: 294 passed, 294 total (0 failed, 0 skipped).
- **Execution Time**: 11.2 seconds.

---

## Typecheck

Executed `npm run typecheck`:
- **Result**: Exited with code 0.
- **Errors**: 0 TypeScript errors.

---

## Build

Executed `npm run build`:
- **Result**: Exited with code 0.
- **Routes Generated**: 24/24 static and dynamic routes compiled cleanly.
- **Turbopack Optimization**: Verified that `order.service.ts` directly consumes `StoreSettingsRepository`, avoiding client-component server module leakage.

---

## Production Verification

Live production smoke verification was performed:
1. **Live Database Inspection**: Query on `store_settings` confirms all 10 new columns exist with correct default values.
2. **Branding & Attribution**: Developer Platform Attribution (`DRIPIDIN Platform`) remains untouched.
3. **Storefront Price Display**: Visual format remains identical for the live Algerian store (`1 500 DA`).
4. **Order Prefixing**: Production checkout uses configured `orderPrefix` (`CMD-`).
5. **Algerian Regional Infrastructure**: 58 Wilayas and communes remain authoritative in database.

---

## White-Label Scenario Assessment

### Scenario A (Current Production Store)
- **Country**: Algeria (`DZ`)
- **Locale**: `fr-DZ`
- **Currency**: `DZD` (Symbol: `DA`, Decimals: 0)
- **Business Mode**: Phone & Spare Parts Store
- **B2B Capabilities**: ON
- **COD**: ON
- **Regions**: 58 Wilayas
- **Status**: **Fully Operational and Production-Verified**.

### Scenario B (White-Label Target Store)
- **Country**: France (`FR`)
- **Locale**: `fr-FR`
- **Currency**: `EUR` (Symbol: `€`, Decimals: 2)
- **Business Mode**: Fashion Boutique
- **B2B Capabilities**: OFF
- **COD**: OFF
- **Regions**: French Departments
- **Status**: **Architecturally Validated**. No source-level assumption blocks this scenario. Full operationalization of Scenario B will occur with logistics abstraction in Phase 4.

---

## Known Limitations

1. **Exchange Rates (FX)**: Phase 3 is a single-currency store architecture. Multi-currency real-time conversion is out of scope.
2. **Physical Column Suffixes**: Physical PostgreSQL columns retain `_dzd` suffixes for backward compatibility.
3. **Logistics Coupling**: Shipping calculation still relies on the existing `wilayas` and `delivery_rate_matrix` database tables; this will be addressed in Phase 4.

---

## Rollback Strategy

If rollback of Phase 3 is required:
1. **Code Rollback**: Revert application commits to Phase 2 tag/commit.
2. **Database Backward-Compatibility**: Migration `00014_commerce_settings.sql` is strictly additive (`ADD COLUMN IF NOT EXISTS`). Old application code ignores the newly added columns without error. No destructive down-migration is required.

---

## Files Changed

### New Files:
- `src/lib/money/types.ts`: Core Money, CurrencyMetadata, and CurrencyFormatOptions types.
- `src/lib/money/money.ts`: MoneyMath safe arithmetic engine.
- `src/lib/money/rounding-policy.ts`: Standard and Algerian commercial rounding policies.
- `src/lib/money/formatter.ts`: Centralized MoneyFormatter.
- `src/lib/money/index.ts`: Barrel export for money module.
- `src/lib/country/types.ts`: CountryProfile and fiscal specification contracts.
- `src/lib/country/profiles/algeria.ts`: Algeria profile with phone validation and Wilaya integration.
- `src/lib/country/profiles/france.ts`: France architectural reference profile.
- `src/lib/country/registry.ts`: CountryRegistry with deterministic fallback.
- `src/lib/country/index.ts`: Barrel export for country module.
- `src/lib/capabilities/types.ts`: CommerceCapability definitions.
- `src/lib/capabilities/resolver.ts`: Capability resolver logic.
- `src/lib/capabilities/index.ts`: Barrel export for capabilities module.
- `src/lib/hooks/use-format-price.ts`: Client hook and server helper for price formatting.
- `supabase/migrations/00014_commerce_settings.sql`: Database schema extension.
- `src/lib/money/phase-3-commerce.test.ts`: Automated test suite (29 tests).
- `docs/phase-3-commerce-currency-implementation.md`: This document.

### Modified Files:
- `src/types/settings.types.ts`: Added currency, rounding, and prefix fields.
- `src/lib/settings/default-settings.ts`: Default values and row/input mappers.
- `src/lib/utils.ts`: Delegated `formatDZD` to `MoneyFormatter`.
- `src/lib/services/checkout.service.ts`: Integrated dynamic settings and MoneyMath.
- `src/lib/services/pricing.service.ts`: Delegated cash rounding to policy engine.
- `src/lib/services/order.service.ts`: Client-safe repository decoupling.
- `src/lib/validation/auth.schema.ts`: Country-profile phone validation.
- `src/lib/validation/order.schema.ts`: Country-profile phone validation.
- `src/lib/validation/account.schema.ts`: Country-profile phone validation.
- `src/components/admin/views/website-settings-view.tsx`: Added "Devise & Commerce" settings tab.
- 17 Storefront presentation components in `src/components/storefront/`.
