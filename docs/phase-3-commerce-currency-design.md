# DRIPIDIN — Phase 3: Commerce Settings, Currency & Country Boundary Architecture Design

> **Document Type**: Architectural Specification & Implementation Blueprint  
> **Phase**: PHASE 3 — Commerce Settings, Currency & Country Boundary Decoupling  
> **Status**: APPROVED FOR REVIEW (Read-Only Design Blueprint — No Code Execution)  
> **Target Platform**: DRIPIDIN Commercial E-Commerce Engine (Reusable White-Label Template)  
> **Baseline Engine**: Next.js 16 (App Router), React 19, TypeScript Strict, Tailwind CSS v4, Supabase PostgreSQL 17 (RLS)  
> **Target Date**: September 2026  

---

## 1. Executive Summary

Phase 1 (Foundation & Persistent Store Settings) and Phase 2 (Branding & Visual Identity Decoupling) successfully transitioned DRIPIDIN from an ephemeral in-memory configuration to a persistent PostgreSQL-backed settings engine and severed all buyer-visible brand name, logo, favicon, contact, and theme-color dependencies from the codebase.

However, a deep architectural audit of the current codebase reveals that the application remains deeply bound to a single country, a single currency, and a single product domain:

1. **Monolithic Currency Assumptions**:
   - `DZD` / `DA` currency formatting is duplicated across **23 storefront and administrative components** via ad-hoc `.toLocaleString('fr-DZ') + ' DZD'` string concatenations.
   - **101 source files** embed the `*Dzd` identifier directly into variable, domain, and database column names (e.g., `b2cPriceDzd`, `subtotalDzd`, `shippingCostDzd`, `total_dzd`, `cost_price_dzd`).
   - Price formatting in admin views relies on a centralized `formatDZD(amount: number)` helper in `src/lib/utils.ts` that hardcodes `fr-DZ` and string-replaces `'DZD'` with `'DA'`.
   - Financial arithmetic relies on raw JavaScript floating-point multiplication (`price * quantity`, `Math.round(amount / 10) * 10`), introducing precision and rounding drift hazards.

2. **Hard-Coded Country Assumptions**:
   - The checkout pipeline, order models, customer address books, delivery rate matrix, and logistics adapters are strictly coupled to Algeria's **58 Wilayas** and communes.
   - Telephone validation in **4 Zod validation schemas** unconditionally enforces the Algerian cellular pattern `/^(0|\+213)(5|6|7)[0-9]{8}$/`.
   - Customer B2B onboarding strictly demands Algerian legal/fiscal identifiers: `NIF` (Numéro d'Identification Fiscale), `RC` (Registre de Commerce), `NIS`, and `Article d'Imposition`.

3. **Domain-Specific Commerce Constraints**:
   - The catalog, checkout, and inventory workflows contain hard-coded assumptions tailored exclusively to smartphone repair shops (e.g., device compatibility models, screen quality grades like `OEM_ORIGINAL` and `SERVICE_PACK`, B2B technician discount tiers, and Cash on Delivery courier reconciliation).

### Phase 3 Primary Objective

Decouple commerce configuration, monetary calculation, and country-specific rules into **three strictly isolated architectural boundaries**:
1. **Store Settings (`public.store_settings`)**: Buyer-configurable runtime preferences (currency code, symbol, decimals, formatting position, order prefix, invoice prefix, commercial toggles).
2. **Country Profile (`CountryProfile`)**: Semi-static regional, address, phone, and fiscal rules encapsulated in a pluggable registry (starting with a 100% backward-compatible Algeria profile, with a reference France profile).
3. **Money Engine (`Money` / `MoneyFormatter`)**: A pure monetary abstraction handling exact arithmetic, safe rounding, and locale-aware display formatting.

> [!IMPORTANT]
> **Preservation Guarantee**: All existing Algerian commerce functionality (58 Wilayas, EcoTrack delivery matrix, DZD pricing, COD payment workflows, B2B wholesale pricing) **must remain 100% operational and regression-free**.

---

## 2. Current-State Audit

A full repository scan was conducted across all TypeScript, TSX, JSON, and SQL migration files. The audit identified the following baseline metrics:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CURRENT-STATE AUDIT METRICS                           │
├──────────────────────────────────────────────────┬──────────────────────────┤
│ Source files with *Dzd property/column names     │ 101 files                │
│ Occurrences of "DZD" literal                     │ 174 matches (56 files)   │
│ Occurrences of "DA" symbol literal               │ 10 matches (5 files)     │
│ Occurrences of "fr-DZ" locale literal            │ 58 matches (23 files)    │
│ Occurrences of "wilaya" references               │ 722 matches (93 files)   │
│ Occurrences of Algerian phone regexes            │ 28 matches (14 files)    │
│ Centralized formatPrice / formatCurrency helpers │ 0 matches (Non-existent) │
│ Dedicated formatDZD helper                       │ 1 helper (10 admin files)│
└──────────────────────────────────────────────────┴──────────────────────────┘
```

### 2.1 Price Formatting Dispersal

Price display logic is completely fragmented across the storefront and admin panels:

1. **Storefront Components**:
   - Instead of consuming a centralized formatting service, components perform raw string concatenation:
     ```tsx
     // Found in src/components/storefront/catalog/product-card.tsx
     {product.effectivePriceDzd.toLocaleString('fr-DZ')} DZD

     // Found in src/components/storefront/cart/cart-item-card.tsx
     {lineTotal.toLocaleString('fr-DZ')} <span className="text-[10px] text-gray-500">DZD</span>

     // Found in src/components/storefront/checkout/order-summary-card.tsx
     {totalDzd.toLocaleString('fr-DZ')} <span className="text-xs font-bold text-gray-500 ml-1">DZD</span>

     // Found in src/components/storefront/account/order-detail-view.tsx
     {order.totalAmountDzd.toLocaleString('fr-DZ')} DZD
     ```
2. **Administrative Components**:
   - 10 administrative views consume `formatDZD(amount: number)` from `src/lib/utils.ts`:
     ```ts
     export function formatDZD(amount: number): string {
       return new Intl.NumberFormat('fr-DZ', {
         style: 'currency',
         currency: 'DZD',
         maximumFractionDigits: 0,
       }).format(amount).replace('DZD', 'DA');
     }
     ```
   - This function hardcodes the locale (`fr-DZ`), the currency code (`DZD`), the maximum fraction digits (`0`), and performs an ad-hoc regex/string replacement (`replace('DZD', 'DA')`). It cannot format foreign currencies (EUR, USD) or adapt to decimal-precision configurations.

### 2.2 Financial Calculation & Rounding Practices

1. **Floating Point Binary Arithmetic**:
   - `CheckoutService` and `OrderService` perform calculations directly with JavaScript numbers:
     ```ts
     // src/lib/services/checkout.service.ts
     const lineTotal = resolved.unitPriceDzd * validQuantity;
     subtotalDzd += lineTotal;
     const calculatedTotalDzd = calculatedSubtotalDzd + shippingCostDzd;
     ```
   - In financial applications, raw floating-point operations risk rounding anomalies (e.g. `0.1 + 0.2 = 0.30000000000000004`).
2. **Market-Specific Cash Rounding**:
   - `PricingService` in `src/lib/services/pricing.service.ts` contains an explicit Algerian commercial rounding function:
     ```ts
     static roundDzd(amount: number, roundingUnit: 10 | 50 | 100 = 10): number {
       return Math.round(amount / roundingUnit) * roundingUnit;
     }
     ```
   - While appropriate for cash transactions in Algeria where 1, 2, and 5 Dinar coins are virtually nonexistent in retail commerce, this assumption must not be hardcoded into the global pricing pipeline.
3. **Margin & Percentage Calculations**:
   - Discounts and gross margins use `Number((((price - cost) / price) * 100).toFixed(2))`. The use of `.toFixed()` followed by `Number()` creates string conversions in the middle of mathematical evaluations.

### 2.3 Order & Invoice Numbering Disconnect

- `checkout.service.ts` (line 417) and `order.service.ts` (line 158) generate human-readable order numbers as:
  ```ts
  const orderPrefix = process.env.NEXT_PUBLIC_ORDER_PREFIX || 'DRP';
  const currentYear = new Date().getFullYear();
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const orderNumber = `${orderPrefix}-${currentYear}-${randomSuffix}`;
  ```
- **Architectural Flaw**: Although `store_settings` already stores persistent fields `order_prefix`, `invoice_prefix`, and `proforma_prefix` (seeded with `'DRP'`, `'FAC'`, and `'PRO'`), the checkout services bypass `store_settings` completely and read from static environment variables.

---

## 3. Hard-Coded Commerce Inventory

The table below catalogs every major area in the DRIPIDIN codebase where commerce, currency, or regional assumptions are currently embedded:

| Subsystem | File Path | Hard-Coded Literal / Assumption | Impact |
| :--- | :--- | :--- | :--- |
| **Utilities** | `src/lib/utils.ts` | `formatDZD()` with `fr-DZ`, `DZD`, `.replace('DZD', 'DA')` | Blocks multi-currency display |
| **Utilities** | `src/lib/utils.ts` | `ALGERIA_WILAYAS` static array (58 wilayas) | Tightly binds address forms to Algeria |
| **Validation** | `src/lib/validation/auth.schema.ts` | `AlgerianPhoneSchema` (`/^(0)(5|6|7)[0-9]{8}$/`) | Rejects non-Algerian phone numbers |
| **Validation** | `src/lib/validation/account.schema.ts` | `AlgerianPhoneRegex`, `wilayaCode.min(1).max(58)` | Restricts account addresses to 58 wilayas |
| **Validation** | `src/lib/validation/order.schema.ts` | `recipientPhone`, `wilayaCode.min(1).max(58)`, `paymentMethod` | Restricts checkout to Algerian parameters |
| **Validation** | `src/lib/validation/product.schema.ts` | `costPriceDzd`, `b2cPriceDzd`, `b2cSalePriceDzd`, `b2bPriceDzd` | Embeds currency identity in catalog schema |
| **Checkout Service** | `src/lib/services/checkout.service.ts` | `orderPrefix` from `process.env`, `wilayaCode === 16 ? 400 : 600` | Bypasses settings, hardcodes delivery rates |
| **Order Service** | `src/lib/services/order.service.ts` | `orderPrefix` from `process.env`, `subtotal_dzd`, `total_dzd` | Ignores database settings configuration |
| **Pricing Service** | `src/lib/services/pricing.service.ts` | `roundDzd` (nearest 10/50/100), `b2c_price_dzd` | Algerian commercial rounding policy |
| **Delivery Pricing** | `src/lib/delivery/delivery-pricing.service.ts` | `GRAND_SUD_WILAYAS`, Wilaya 16 special base cost | Hardcoded Algerian shipping table |
| **Delivery Service** | `src/lib/services/delivery.service.ts` | `codAmountDzd = order.total_dzd`, Wilaya/Commune payloads | Hardcoded Algerian COD courier flows |
| **Payments Service** | `src/lib/payments/payment.service.ts` | `currency: 'DZD'`, `codAmountDzd`, `expectedTotalDzd` | Hardcoded DZD COD reconciliation |
| **Storefront Cart** | `src/components/providers/cart-provider.tsx` | `priceDzd`, `subtotalDzd`, `CART_STORAGE_KEY` | Component types coupled to DZD |
| **Storefront Checkout**| `src/components/storefront/checkout/checkout-shell.tsx` | `wilayaCode = 16`, `ALGERIA_WILAYAS`, `subtotalDzd` | Default state hardcoded to Alger |
| **Storefront Catalog** | `src/components/storefront/catalog/product-card.tsx` | `.toLocaleString('fr-DZ')} DZD` | Ad-hoc price string formatting |
| **Storefront Account** | `src/components/storefront/account/order-detail-view.tsx` | `.toLocaleString('fr-DZ')} DZD`, `"Total TTC (DZD)"` | Ad-hoc formatting, hardcoded tax text |
| **Database Schema** | `supabase/migrations/00003_catalog_and_products.sql` | `cost_price_dzd`, `b2c_price_dzd`, `b2b_price_dzd` | Physical columns carry currency suffix |
| **Database Schema** | `supabase/migrations/00004_inventory_and_orders.sql` | `subtotal_dzd`, `shipping_cost_dzd`, `total_dzd` | Order totals store `_dzd` suffix |
| **Database Schema** | `supabase/migrations/00008_additional_entities_and_optimizations.sql` | `wilayas` table (`code BETWEEN 1 AND 58`) | Database constraint enforces 58 wilayas |

---

## 4. Classification Matrix

Each audit finding is classified into its authoritative architectural tier:

| Item / Finding | Current Expression | Target Classification | Target Architectural Owner |
| :--- | :--- | :--- | :--- |
| **Currency Code** | Hard-coded `'DZD'` | **CATEGORY A** (Store Configuration) | `public.store_settings.currency_code` |
| **Currency Symbol** | Hard-coded `'DA'` or `'DZD'` | **CATEGORY A** (Store Configuration) | `public.store_settings.currency_symbol` |
| **Decimal Precision** | Implicit 0 decimals | **CATEGORY A** (Store Configuration) | `public.store_settings.currency_decimals` |
| **Symbol Placement** | Suffix (`1 500 DA`) | **CATEGORY A** (Store Configuration) | `public.store_settings.currency_position` |
| **Order Number Prefix** | `process.env.NEXT_PUBLIC_ORDER_PREFIX` | **CATEGORY A** (Store Configuration) | `public.store_settings.order_prefix` |
| **Invoice Prefix** | Hard-coded `'FAC'` | **CATEGORY A** (Store Configuration) | `public.store_settings.invoice_prefix` |
| **Free Shipping Threshold**| `free_shipping_threshold_dzd` | **CATEGORY A** (Store Configuration) | `public.store_settings.free_shipping_threshold` |
| **Tax Rate Percent** | `tax_rate_percent` (0% or 19%) | **CATEGORY A** (Store Configuration) | `public.store_settings.tax_rate_percent` |
| **B2B Wholesale Toggle** | `enable_b2b_wholesale` | **CATEGORY A** (Store Configuration) | `public.store_settings.enable_b2b_wholesale` |
| **58 Wilayas Structure** | `ALGERIA_WILAYAS` & `wilayas` table | **CATEGORY B** (Country Profile) | `CountryProfile.address.subdivisions` |
| **Phone Regex & Normalization**| `/^(0)(5|6|7)[0-9]{8}$/` | **CATEGORY B** (Country Profile) | `CountryProfile.phone.regex` & `.clean()` |
| **Address Field Hierarchy** | Wilaya + Commune + Address | **CATEGORY B** (Country Profile) | `CountryProfile.address.fields` |
| **Fiscal Fields (NIF/RC/NIS)**| B2B Registration form fields | **CATEGORY B** (Country Profile) | `CountryProfile.fiscal.identifiers` |
| **COD Availability** | Checkout Step 3 payment option | **CATEGORY B** (Country Profile) | `CountryProfile.commerceRules.codAvailable` |
| **Delivery Regions / Zones** | `GRAND_SUD_WILAYAS`, `NORD` | **CATEGORY B** (Country Profile) | `CountryProfile.delivery.regions` |
| **Device Compatibility Matrix**| `brand_models`, screen grades | **CATEGORY C** (Commerce Model) | Business Model: `PHONE_PARTS` feature pack |
| **Repair Shop B2B Tiers** | `b2b_tier_prices`, technician discounts | **CATEGORY C** (Commerce Model) | Business Model: B2B Wholesale feature pack |
| **Quality Grade Taxonomy** | `OEM_ORIGINAL`, `SERVICE_PACK` | **CATEGORY C** (Commerce Model) | Business Model: Catalog attribute engine |
| **Monetary Formatting** | `formatDZD()`, `.toLocaleString()` | **CATEGORY D** (Money Engine) | `MoneyFormatter.format()` & `useFormatPrice()` |
| **Monetary Value Arithmetic**| `a * b`, `subtotal + shipping` | **CATEGORY D** (Money Engine) | `Money` Value Object / integer math |
| **Commercial Cash Rounding** | `PricingService.roundDzd()` | **CATEGORY D** (Money Engine) | `CommercialRoundingPolicy` (Pluggable) |
| **EcoTrack Delivery API** | `adapters/ecotrack.ts` | **CATEGORY E** (Infrastructure) | `DeliveryProviderRegistry` (Fulfillment adapter) |
| **Satim / CIB Integration** | Webhook handlers, API keys | **CATEGORY E** (Infrastructure) | Payment Gateway adapter (Phase 4) |
| **Demo Customer Emails** | `@hamzaphone.dz` fixtures | **CATEGORY F** (Historical / Demo) | Seed scripts (Safe to defer) |
| **Historical Migrations** | `00001_*.sql` - `00012_*.sql` | **CATEGORY F** (Historical / Demo) | Immutable migration history (Never edit) |
| **Database Columns `*_dzd`** | `b2c_price_dzd`, `total_dzd` | **CATEGORY G** (Ambiguous Decision) | **Domain Mapping Layer** (Keep DB column, alias in app) |

---

## 5. Store Settings Boundary

The Store Settings layer (`public.store_settings`) represents **buyer-editable configuration**. It governs how the specific tenant wants their store to operate, within the legal framework of their selected Country Profile.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STORE SETTINGS (Buyer-Configurable)                      │
├───────────────────────────────────┬─────────────────────────────────────────┤
│ Field                             │ Purpose / Scope                         │
├───────────────────────────────────┼─────────────────────────────────────────┤
│ defaultCountryCode                │ Active Country Profile ('DZ', 'FR', etc)│
│ defaultLocale                     │ Active language/locale ('fr-DZ', 'en-US')│
│ timezone                          │ Store timezone ('Africa/Algiers')       │
│ currencyCode                      │ ISO 4217 Currency Code ('DZD', 'EUR')   │
│ currencySymbol                    │ Display symbol ('DA', '€', '$')         │
│ currencyDecimals                  │ Decimal places (0 for DZD/JPY, 2 for EUR)│
│ currencyPosition                  │ 'BEFORE' or 'AFTER'                     │
│ currencySpaceSeparated            │ true: "1 250 DA", false: "$1,250"       │
│ orderPrefix                       │ Sequence prefix for orders (e.g. 'DRP') │
│ invoicePrefix                     │ Sequence prefix for invoices ('FAC')    │
│ proformaPrefix                    │ Sequence prefix for B2B quotes ('PRO')  │
│ freeShippingThreshold             │ Minimum order total for free delivery   │
│ taxRatePercent                    │ Default VAT percentage (e.g. 0.00, 19.00)│
│ pricesIncludeTax                  │ true: Retail TTC, false: Wholesale HT   │
│ enableCashOnDelivery              │ Store-level toggle to offer COD         │
│ enableB2bWholesale                │ Store-level toggle for B2B pricing      │
│ enableCommercialRounding          │ Toggle market cash rounding (nearest 10)│
└───────────────────────────────────┴─────────────────────────────────────────┘
```

### What Belongs in Store Settings vs. What Does NOT
- **Belongs in Store Settings**: The choice of currency (`EUR` vs `DZD`), display format, whether COD is enabled, the order prefix, and the tax percentage.
- **Does NOT Belong in Store Settings**: The complete list of 58 Wilayas, phone validation regexes, and country-specific postal rules. These belong to the **Country Profile**. Duplicating geographic structures into store settings creates maintenance overhead and data corruption risks.

---

## 6. CountryProfile Boundary

A `CountryProfile` is a **semi-static, deterministic contract** encapsulating the geographical, address, fiscal, and validation rules of a specific country.

### 6.1 CountryProfile Interface Definition

```ts
// src/lib/country/types.ts

export type AddressSubdivisionType = 'WILAYA' | 'DEPARTMENT' | 'PROVINCE' | 'STATE';

export interface AddressSubdivision {
  code: number | string;
  nameFr: string;
  nameAr?: string;
  nameEn?: string;
  zone: string; // e.g. 'NORD', 'SUD', 'GRAND_SUD'
  isActive: boolean;
}

export interface CountryProfile {
  code: string; // ISO 3166-1 alpha-2 (e.g. 'DZ', 'FR')
  name: string; // e.g. 'Algérie', 'France'
  defaultLocale: string; // e.g. 'fr-DZ', 'fr-FR'
  defaultCurrencyCode: string; // e.g. 'DZD', 'EUR'
  defaultTimezone: string; // e.g. 'Africa/Algiers'

  phone: {
    dialCode: string; // e.g. '+213', '+33'
    regex: RegExp;
    formatPlaceholder: string; // e.g. '0550 12 34 56'
    clean: (input: string) => string;
    validate: (input: string) => boolean;
  };

  address: {
    subdivisionType: AddressSubdivisionType;
    subdivisionLabel: string; // e.g. 'Wilaya', 'Département'
    subdivisionUnitLabel: string; // e.g. 'Commune', 'Ville'
    requiresPostalCode: boolean;
    postalCodeRegex?: RegExp;
    subdivisions: AddressSubdivision[];
  };

  fiscal: {
    identifiers: Array<{
      key: string;
      label: string; // e.g. 'NIF', 'RC', 'NIS', 'Article d'Imposition'
      requiredForB2b: boolean;
      regex?: RegExp;
    }>;
    defaultTaxRatePercent: number;
  };

  commerceRules: {
    codAvailable: boolean; // Cash on delivery supported in this country
    requiresNationalIdentity: boolean;
    defaultDeliveryType: 'HOME' | 'DESK';
  };
}
```

### 6.2 Country Registry Architecture

```
src/lib/country/
├── types.ts              # CountryProfile domain interfaces
├── registry.ts           # CountryRegistry singleton
└── profiles/
    ├── algeria.ts        # Full Algeria implementation (58 Wilayas, +213 phone, NIF/RC)
    └── france.ts         # Reference international implementation (Departments, +33, SIRET)
```

```ts
// src/lib/country/registry.ts

import { algeriaProfile } from './profiles/algeria';
import { franceProfile } from './profiles/france';
import type { CountryProfile } from './types';

export class CountryRegistry {
  private static profiles: Map<string, CountryProfile> = new Map([
    ['DZ', algeriaProfile],
    ['FR', franceProfile],
  ]);

  static get(countryCode: string): CountryProfile {
    const profile = this.profiles.get(countryCode.toUpperCase());
    if (!profile) {
      // Safe fallback to Algeria (the foundation profile)
      return algeriaProfile;
    }
    return profile;
  }

  static getSupportedCountries(): Array<{ code: string; name: string }> {
    return Array.from(this.profiles.values()).map(p => ({ code: p.code, name: p.name }));
  }
}
```

### 6.3 Dynamic Validation Schema Integration

Instead of hard-coding `/^(0)(5|6|7)[0-9]{8}$/` in Zod schemas, validation schemas resolve rules from the active `CountryProfile`:

```ts
// Conceptual implementation for dynamic phone validation
export function createPhoneSchema(countryCode: string = 'DZ') {
  const profile = CountryRegistry.get(countryCode);
  return z.string()
    .transform(profile.phone.clean)
    .refine(profile.phone.validate, {
      message: `Numéro de téléphone invalide (${profile.phone.formatPlaceholder})`,
    });
}
```

---

## 7. Commerce Model Boundary

The Commerce Model governs **how products are structured and sold**, independent of the country or currency.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COMMERCE MODEL TIERS                              │
├───────────────────────┬─────────────────────────┬───────────────────────────┤
│ Tier                  │ Responsibility          │ Examples in DRIPIDIN      │
├───────────────────────┼─────────────────────────┼───────────────────────────┤
│ Store Settings        │ Feature Toggles         │ enableB2bWholesale: true  │
│                       │                         │ enableReviews: true       │
├───────────────────────┼─────────────────────────┼───────────────────────────┤
│ Commerce Model Pack   │ Business Rules,         │ PHONE_PARTS:              │
│                       │ Terminology, Attributes │ - Device compatibility    │
│                       │                         │ - Screen quality grades   │
│                       │                         │ - Technician B2B tiers    │
├───────────────────────┼─────────────────────────┼───────────────────────────┤
│ Product Data          │ Entity Instances        │ SKU: "LCD-IP13-SP"        │
│                       │                         │ Price: 18,500             │
│                       │                         │ Compatible: iPhone 13     │
└───────────────────────┴─────────────────────────┴───────────────────────────┘
```

### Decoupling Rules:
1. **Device Compatibility**: If `enableDeviceCompatibility` is disabled in Store Settings, the storefront suppresses device search bars, model filter facets, and compatibility badges, behaving as a standard general catalog.
2. **Wholesale Pricing Tiers**: If `enableB2bWholesale` is disabled, B2B registration buttons, wholesale pricing tables, and minimum volume rules are completely hidden, with zero runtime overhead.

---

## 8. Money / Currency Architecture

Financial calculation and display must be treated as first-class domain primitives to eliminate rounding bugs, binary floating-point drift, and inconsistent currency strings.

### 8.1 Money Value Object

```ts
// src/lib/money/types.ts

export interface Money {
  amount: number;       // Value in standard currency units (e.g. 1500 or 1500.50)
  currency: string;     // ISO 4217 code (e.g. 'DZD', 'EUR', 'USD')
}

export interface CurrencyFormatOptions {
  currencyCode?: string;
  currencySymbol?: string;
  decimals?: number;
  position?: 'BEFORE' | 'AFTER';
  spaceSeparated?: boolean;
  locale?: string;
}
```

### 8.2 Safe Arithmetic Primitives

```ts
// src/lib/money/money.ts

export class MoneyMath {
  /**
   * Add two money amounts with strict currency matching
   */
  static add(a: Money, b: Money): Money {
    if (a.currency !== b.currency) {
      throw new Error(`Cannot add different currencies: ${a.currency} and ${b.currency}`);
    }
    const factor = Math.pow(10, 4); // Calculate with 4 decimal places internally
    const sum = Math.round((a.amount + b.amount) * factor) / factor;
    return { amount: sum, currency: a.currency };
  }

  /**
   * Subtract two money amounts
   */
  static subtract(a: Money, b: Money): Money {
    if (a.currency !== b.currency) {
      throw new Error(`Cannot subtract different currencies: ${a.currency} and ${b.currency}`);
    }
    const factor = Math.pow(10, 4);
    const diff = Math.round((a.amount - b.amount) * factor) / factor;
    return { amount: Math.max(0, diff), currency: a.currency };
  }

  /**
   * Multiply money by a scalar (quantity, tax factor)
   */
  static multiply(m: Money, scalar: number): Money {
    const factor = Math.pow(10, 4);
    const result = Math.round((m.amount * scalar) * factor) / factor;
    return { amount: result, currency: m.currency };
  }

  /**
   * Standard financial half-up rounding to specified decimal places
   */
  static round(m: Money, decimals: number = 2): Money {
    const p = Math.pow(10, decimals);
    return {
      amount: Math.round((m.amount + Number.EPSILON) * p) / p,
      currency: m.currency,
    };
  }
}
```

### 8.3 Unified MoneyFormatter

```ts
// src/lib/money/formatter.ts

import type { Money, CurrencyFormatOptions } from './types';

export class MoneyFormatter {
  static format(
    amountOrMoney: number | Money,
    options: CurrencyFormatOptions = {}
  ): string {
    const amount = typeof amountOrMoney === 'number' ? amountOrMoney : amountOrMoney.amount;
    const currencyCode = options.currencyCode || 'DZD';
    const currencySymbol = options.currencySymbol || (currencyCode === 'DZD' ? 'DA' : currencyCode);
    const decimals = options.decimals ?? (currencyCode === 'DZD' ? 0 : 2);
    const position = options.position ?? (currencyCode === 'USD' ? 'BEFORE' : 'AFTER');
    const spaceSeparated = options.spaceSeparated ?? true;
    const locale = options.locale || (currencyCode === 'DZD' ? 'fr-DZ' : 'fr-FR');

    // 1. Format numeric portion with locale-appropriate thousand separators
    const formattedNumber = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);

    // 2. Assemble formatted string with configured symbol and position
    const space = spaceSeparated ? ' ' : '';
    if (position === 'BEFORE') {
      return `${currencySymbol}${space}${formattedNumber}`;
    }
    return `${formattedNumber}${space}${currencySymbol}`;
  }
}
```

### 8.4 Pluggable Commercial Rounding Policy

```ts
// src/lib/money/rounding-policy.ts

export interface RoundingPolicy {
  apply(amount: number): number;
}

export class AlgerianCashRoundingPolicy implements RoundingPolicy {
  constructor(private unit: 10 | 50 | 100 = 10) {}

  apply(amount: number): number {
    return Math.round(amount / this.unit) * this.unit;
  }
}

export class StandardExactRoundingPolicy implements RoundingPolicy {
  constructor(private decimals: number = 2) {}

  apply(amount: number): number {
    const p = Math.pow(10, this.decimals);
    return Math.round(amount * p) / p;
  }
}
```

---

## 9. Locale Architecture

To prevent architectural conflation, **Country**, **Locale**, and **Currency** must be completely separated:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ COUNTRY PROFILE │       │  STORE LOCALE   │       │ STORE CURRENCY  │
│      "DZ"       │       │    "fr-DZ"      │       │     "DZD"       │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ Legal / Address │       │ Language / Text │       │ Price Display & │
│ 58 Wilayas      │       │ Date Formatting │       │ Numeric Formats │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

### Resolution Rules:
1. **Country != Locale**: A store in Algeria (`CountryProfile = 'DZ'`) can operate in French (`fr-DZ`), Arabic (`ar-DZ`), or English (`en`).
2. **Country != Currency**: A store in Algeria (`CountryProfile = 'DZ'`) can sell in Algerian Dinars (`DZD`), or optionally quote in Euros (`EUR`).
3. **No Automatic FX Conversion**: Configuring `EUR` as store currency means all prices, subtotals, and delivery fees are natively denominated in Euros. It does **not** perform real-time FX conversion unless an external multi-currency exchange rate engine is explicitly configured in a future roadmap phase.

---

## 10. Tax & Fiscal Boundary

1. **Store Settings**:
   - `taxRatePercent`: Configurable VAT rate (default: `0.00%` for retail phone parts in Algeria; customizable to `19.00%` or foreign VAT rates).
   - `pricesIncludeTax`: Boolean flag (`true` indicates prices displayed on the storefront are TTC / all-inclusive; `false` indicates prices are HT / tax-exclusive).
2. **Country Profile**:
   - Owns the labels and validation rules for tax IDs (e.g. `NIF`, `RC`, `NIS`, `Article d'Imposition` for Algeria; `SIRET`, `TVA Intracommunautaire` for France).
3. **Invoicing & Checkout**:
   - Invoices and order summaries calculate tax dynamically:
     $$\text{Tax Amount} = \text{Subtotal} \times \left(\frac{\text{taxRatePercent}}{100}\right)$$
   - If `taxRatePercent === 0`, tax rows are omitted from customer receipts.

---

## 11. COD / Payment Boundary

1. **Store Settings**:
   - Exposes `enableCashOnDelivery: boolean`. If disabled, COD is suppressed at checkout regardless of country support.
2. **Country Profile**:
   - Exposes `commerceRules.codAvailable: boolean`. If `false` (e.g. France), COD is unavailable even if enabled in store settings.
3. **Payment Reconciliation Layer**:
   - In `src/lib/payments/payment.service.ts`, courier COD collections and remittances are tracked using the active store currency code (`settings.currencyCode`), removing the hard-coded `'DZD'` string literal.

---

## 12. Delivery Boundary

The delivery system interacts through a 4-tier pipeline:

```
┌──────────────────┐
│  CountryProfile  │  ──► Validates geographical hierarchy (Wilayas vs Postal Codes)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│DeliveryRateMatrix│  ──► Resolves base shipping rates (Home vs Desk, Regional Zones)
└────────┬─────────┘
         │
         ▼
┌───────────────────────┐
│DeliveryPricingService │  ──► Evaluates free shipping thresholds & calculates final cost
└────────┬──────────────┘
         │
         ▼
┌──────────────────┐
│ DeliveryProvider │  ──► Executes shipment creation & webhook tracking (EcoTrack, etc)
└──────────────────┘
```

- **Preservation Strategy**: The existing `public.delivery_rate_matrix` table and `DeliveryPricingService` are preserved. The service is refactored to read `freeShippingThreshold` from `StoreSettings` rather than hardcoding constants.

---

## 13. Order / Invoice Prefix Boundary

Currently, `checkout.service.ts` and `order.service.ts` read `process.env.NEXT_PUBLIC_ORDER_PREFIX || 'DRP'`.

### Refactoring Blueprint:
1. `CheckoutService` and `OrderService` will read `settings.orderPrefix` directly from `StoreSettingsService.getSettings()`.
2. Order numbers follow the format: `${settings.orderPrefix}-${year}-${randomSuffix}` (e.g. `DRP-2026-849201`).
3. Invoice generation will read `settings.invoicePrefix` (default: `'FAC'`) and `settings.proformaPrefix` (default: `'PRO'`).
4. If an admin updates `order_prefix` in the admin settings UI, new orders immediately adopt the new prefix without application restarts or deployments.

---

## 14. Database Proposal & The `*_dzd` Column Strategy

### 14.1 The `*_dzd` Database Column Conundrum

The audit identified **101 source files** and **15 database tables** containing `*_dzd` suffixes (`b2c_price_dzd`, `subtotal_dzd`, `total_dzd`, `cost_price_dzd`, `shipping_cost_dzd`).

Executing a database-wide `ALTER TABLE RENAME COLUMN` across production PostgreSQL tables presents severe risks:
- Invalidation of live SQL views (`public_products`, `orders_summary_view`).
- Breaking triggers, stored procedures (`reserve_order_stock_atomic`), and historical migrations (`00001` - `00013`).
- Service downtime and regression risks for existing Algerian customers.

### 14.2 The Solution: The Domain Mapping Layer Pattern

We adopt the **Domain Mapping Layer Pattern**:
1. **Physical Database Columns**: The physical column names (`b2c_price_dzd`, `total_dzd`) remain **unchanged** in PostgreSQL.
2. **Repository / Translation Layer**: In `ProductRepository`, `OrderRepository`, and `CheckoutService`, data is mapped between database snake_case columns and clean, currency-agnostic domain models:
   ```ts
   // Internal Repository Mapping
   function mapOrderRowToDomain(row: OrderDbRow): Order {
     return {
       id: row.id,
       orderNumber: row.order_number,
       subtotal: row.subtotal_dzd,       // Mapped to currency-agnostic 'subtotal'
       shippingCost: row.shipping_cost_dzd,
       discount: row.discount_dzd,
       totalAmount: row.total_dzd,
       currency: row.currency || 'DZD',
       // Legacy compatibility aliases retained during Phase 3
       subtotalDzd: row.subtotal_dzd,
       totalDzd: row.total_dzd,
     };
   }
   ```
3. **Zero Risk, 100% Extensibility**: This guarantees zero production disruption while allowing all new and refactored components to consume clean `.subtotal` and `.totalAmount` fields.

### 14.3 Proposed Database Migration (`00014_commerce_settings.sql`)

Only minimal, non-breaking column additions to `public.store_settings` are required:

```sql
-- Migration 00014: Commerce Settings & Currency Formatting Extensions

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS currency_position VARCHAR(8) NOT NULL DEFAULT 'AFTER'
    CHECK (currency_position IN ('BEFORE', 'AFTER')),
  ADD COLUMN IF NOT EXISTS currency_space_separated BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS prices_include_tax BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_commercial_rounding BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS commercial_rounding_unit INTEGER NOT NULL DEFAULT 10
    CHECK (commercial_rounding_unit IN (10, 50, 100));

COMMENT ON COLUMN public.store_settings.currency_position IS 'Placement of currency symbol: BEFORE ($100) or AFTER (100 DA)';
COMMENT ON COLUMN public.store_settings.prices_include_tax IS 'Whether catalog prices are tax-inclusive (TTC) or tax-exclusive (HT)';
```

---

## 15. Runtime Data Flows

### 15.1 Price Rendering in Storefront Catalog

```
[Product Entity in DB]
        │ (b2c_price_dzd: 18500)
        ▼
[ProductRepository / StorefrontService]
        │ Maps to: { price: 18500, currency: settings.currencyCode }
        ▼
[Storefront Component (ProductCard)]
        │ Consumes: useFormatPrice() hook
        ▼
[MoneyFormatter.format(18500, settings)]
        │ Formats: "18 500 DA" (or "€185.00" if EUR)
        ▼
[Rendered HTML DOM]
```

### 15.2 Multi-Step Checkout & Order Submission

```
1. [User Selects Country] ──► Reads CountryProfile from CountryRegistry
2. [Address Step]          ──► Dynamically renders Wilayas/Subdivisions from CountryProfile
3. [Phone Input]           ──► Validates against CountryProfile.phone.regex
4. [Shipping Calculation]  ──► DeliveryPricingService resolves rate + checks Free Shipping
5. [Order Review]          ──► MoneyFormatter formats Subtotal, Shipping, and Total
6. [Checkout Submission]   ──► CheckoutService reads orderPrefix from StoreSettings
7. [Database Snapshot]     ──► Writes order row with authoritative totals
```

---

## 16. Migration Strategy

To guarantee zero downtime and prevent regression in the live production store, Phase 3 execution follows a **staged 5-step sequence**:

```
Step 1: Money Primitives & CountryRegistry (Additive — No Changes to Existing Code)
        │
        ▼
Step 2: Database Settings Extension (Apply Migration 00014 to store_settings)
        │
        ▼
Step 3: Service Layer Decoupling (Wire StoreSettings into Checkout & Order Services)
        │
        ▼
Step 4: Storefront Price Formatting Migration (Replace inline toLocaleString with useFormatPrice)
        │
        ▼
Step 5: Admin OMS & Formatting Migration (Replace formatDZD with unified MoneyFormatter)
```

1. **Step 1 — Foundation**: Introduce `src/lib/money/` and `src/lib/country/` as purely additive modules. Existing components continue to function untouched.
2. **Step 2 — Schema**: Apply `00014_commerce_settings.sql` to add currency formatting and tax toggle fields to `public.store_settings`.
3. **Step 3 — Domain Wiring**: Refactor `checkout.service.ts` and `order.service.ts` to read `orderPrefix` and `freeShippingThreshold` from `StoreSettingsService`.
4. **Step 4 — Storefront Transition**: Systematically replace `.toLocaleString('fr-DZ') + ' DZD'` in storefront components with the dynamic `useFormatPrice()` hook.
5. **Step 5 — Admin Transition**: Refactor admin views to consume `MoneyFormatter.format()` instead of `formatDZD()`.

---

## 17. Testing Strategy

Prior to any code modifications in Phase 3 implementation, automated test suites will be constructed covering:

### 17.1 Currency & Formatting Test Suite
- Formatting `DZD` (e.g. `1250` $\rightarrow$ `"1 250 DA"`).
- Formatting `EUR` (e.g. `1250.5` $\rightarrow$ `"1 250,50 €"` or `"1,250.50 €"` based on locale).
- Formatting `USD` (e.g. `1250.5` $\rightarrow$ `"$1,250.50"` with prefix position and no space).
- Zero decimal currencies (e.g. `JPY`, `DZD`).

### 17.2 Money Arithmetic Test Suite
- Safe addition and subtraction without floating-point precision loss.
- Half-up rounding versus Algerian commercial cash rounding (nearest 10 DA).
- Discount calculation and subtotal allocation.

### 17.3 Country Profile Test Suite
- **Algeria Profile**: Verify all 58 Wilayas are loaded with correct names and codes; verify phone cleaner converts `+213550123456` to `0550123456`; verify valid and invalid Algerian mobile prefixes (`05`, `06`, `07`).
- **France Profile**: Verify 96 metropolitan departments; verify French phone regex and SIRET identifier validation.

### 17.4 Checkout & Order Submission Regression
- Ensure that checkout with default settings generates identical order totals, delivery rates, and order numbers as the existing production code.

---

## 18. White-Label Scenario Analysis

To validate the extensibility of the design, we analyze two distinct business models:

### Scenario A — Algerian High-Tech Smartphone Store (Current Production)
- **Settings**:
  - Country: `DZ`
  - Currency: `DZD` / Symbol: `DA` / Decimals: `0` / Position: `AFTER`
  - Locale: `fr-DZ`
  - Commercial Rounding: `ON` (Unit: 10)
  - B2B Wholesale: `ON`
  - COD: `ON`
- **Behavior**:
  - Address forms display the 58 Algerian Wilayas.
  - Phones require Algerian mobile numbers.
  - Orders are numbered `DRP-2026-XXXXXX`.
  - Delivery is calculated via the 58-Wilaya delivery matrix.
  - Prices display as `18 500 DA`.

### Scenario B — International Fashion Boutique (Future White-Label Buyer)
- **Settings**:
  - Country: `FR`
  - Currency: `EUR` / Symbol: `€` / Decimals: `2` / Position: `AFTER`
  - Locale: `fr-FR`
  - Commercial Rounding: `OFF`
  - B2B Wholesale: `OFF`
  - COD: `OFF` (Stripe credit card payments only)
- **Behavior**:
  - Address forms display French departments and postal codes.
  - Phones require French mobile numbers (`06` / `07`).
  - Orders are numbered `MODE-2026-XXXXXX`.
  - Prices display as `49,99 €`.
  - Device compatibility search and spare parts quality badges are completely suppressed.
  - **Zero application code changes required.**

---

## 19. Risks & Mitigation

| Risk Description | Severity | Mitigation Strategy |
| :--- | :--- | :--- |
| **Hydration Flicker on Prices** | Medium | The `StoreSettings` currency tokens are injected via SSR in `layout.tsx` and available synchronously in the client provider. |
| **Floating Point Precision Bugs** | High | Centralize all monetary arithmetic in `MoneyMath` with 4-decimal internal precision and half-up rounding. |
| **Breaking Live Orders Database** | Critical | Use the **Domain Mapping Layer Pattern**: keep physical `*_dzd` database column names intact, mapping to clean domain properties. |
| **Cache Invalidation for Currency** | Medium | Reuse Next.js 16 `unstable_cache` with tag `'store_settings'`. Admin currency updates purge the cache instantly. |
| **Regression in 58 Wilaya Delivery**| Critical | Keep `public.wilayas` and `delivery_rate_matrix` active. The `CountryRegistry` loads Algeria profile by default. |

---

## 20. Deferred Work

The following features belong to later roadmap phases and are **explicitly excluded** from Phase 3:
1. **Multi-Currency Live FX Engine**: Phase 3 provides single-store currency configurability. Real-time multi-currency shopping with live exchange rate APIs belongs to Phase 5.
2. **Physical Column Renaming in PostgreSQL**: Renaming `b2c_price_dzd` to `b2c_price` across live database tables is deferred to prevent migration downtime.
3. **Pluggable Payment Gateway Adapters**: Stripe, PayPal, and Satim gateway decoupling will be implemented in Phase 4.
4. **Pluggable International Logistics Drivers**: DHL, FedEx, and Colissimo provider abstractions belong to Phase 4 Logistics Abstraction.
5. **Multi-Tenant Database Architecture**: The platform operates as a single-tenant white-label deployment per merchant.

---

## 21. Files Expected To Change in Phase 3 Implementation

### New Modules to Create:
- `src/lib/money/types.ts`
- `src/lib/money/money.ts`
- `src/lib/money/formatter.ts`
- `src/lib/money/rounding-policy.ts`
- `src/lib/money/money.test.ts`
- `src/lib/country/types.ts`
- `src/lib/country/registry.ts`
- `src/lib/country/profiles/algeria.ts`
- `src/lib/country/profiles/france.ts`
- `src/lib/country/country.test.ts`
- `src/lib/hooks/use-format-price.ts`
- `supabase/migrations/00014_commerce_settings.sql`

### Existing Modules to Refactor:
- `src/lib/utils.ts` (Deprecate `formatDZD` in favor of `MoneyFormatter`)
- `src/types/settings.types.ts` (Add currency formatting and tax toggle fields)
- `src/lib/settings/default-settings.ts` (Add default values and mapping for new settings)
- `src/lib/services/checkout.service.ts` (Read `orderPrefix` from settings, use `MoneyMath`)
- `src/lib/services/order.service.ts` (Read `orderPrefix` from settings)
- `src/lib/services/pricing.service.ts` (Decouple `roundDzd` into pluggable policy)
- `src/lib/delivery/delivery-pricing.service.ts` (Read `freeShippingThreshold` from settings)
- `src/lib/validation/order.schema.ts` (Dynamic phone and wilaya validation via `CountryProfile`)
- `src/lib/validation/account.schema.ts` (Dynamic address and phone validation via `CountryProfile`)
- `src/lib/validation/auth.schema.ts` (Dynamic phone validation via `CountryProfile`)
- `src/components/admin/views/website-settings-view.tsx` (Add Commerce & Currency configuration tab)
- `src/components/storefront/catalog/product-card.tsx` (Use `useFormatPrice()`)
- `src/components/storefront/cart/cart-item-card.tsx` (Use `useFormatPrice()`)
- `src/components/storefront/checkout/order-summary-card.tsx` (Use `useFormatPrice()`)
- `src/components/storefront/account/order-detail-view.tsx` (Use `useFormatPrice()`)

---

## 22. IMPLEMENTATION READINESS

### **READY — NO BLOCKERS**

The architecture for **Phase 3 — Commerce Settings, Currency & Country Boundary** is fully specified, sound, and ready for implementation.
- All boundaries (Store Settings vs Country Profile vs Commerce Model vs Money Engine) are cleanly defined.
- Zero destructive database migrations are proposed.
- 100% of existing Algerian e-commerce functionality, 58 Wilaya shipping rules, and DZD formatting are preserved through the foundational Algeria Country Profile.
- The Domain Mapping Layer protects existing production data from hazardous column renaming.
- Implementation may proceed immediately upon user review and approval.
