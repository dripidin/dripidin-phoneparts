# DRIPIDIN — Phase 4 Logistics Abstraction, Delivery Rules & Provider Adapters Implementation Report

## Executive Summary

Phase 4 — Logistics Abstraction, Delivery Rules & Provider Adapters has been successfully designed, implemented, tested, type-checked, and production-built for the DRIPIDIN white-label e-commerce platform.

This phase transforms the previous hard-coded, Algeria- and EcoTrack-specific logistics implementation into an extensible, provider-agnostic domain hierarchy:
```text
STORE SETTINGS
      ↓
COUNTRY PROFILE
      ↓
ADDRESS / GEOGRAPHY
      ↓
SHIPPING RULES
      ↓
SHIPPING RATE CALCULATOR (Money Engine)
      ↓
DELIVERY PROVIDER ADAPTER
      ↓
SHIPMENT LIFECYCLE
```

Strict architectural invariants preserved:
- **100% preservation of existing Algerian production structures**: 58 Wilayas (`public.wilayas`), commune resolution, delivery rate matrix (`public.delivery_rate_matrix`), courier providers (`public.courier_providers`), and deliveries (`public.deliveries`).
- **EcoTrack fully functional behind provider adapter**: EcoTrack remains the primary Algerian carrier adapter, isolated behind the `IDeliveryProvider` interface. Core business logic has zero direct dependencies on raw EcoTrack request/response shapes.
- **Provider-neutral domain types**: Standardized `ShippingAddress`, `ShippingMethod`, `ShippingRate`, `ShipmentStatus`, `NormalizedWebhookEvent`, and `IDeliveryProvider`.
- **Phase 3 Money integration**: Shipping rates and delivery thresholds are calculated and represented using the immutable `Money` abstraction and `MoneyMath` with zero hard-coded DZD arithmetic.
- **Seamless backward compatibility**: `@/lib/delivery/` facade maintained without breaking existing order services, server actions, or checkout components.
- **Developer Platform Attribution**: `DRIPIDIN Platform` identity remains untouched and protected.

### Key Metrics:
- **Phase 4 Targeted Test Suite**: 30/30 tests passed across 8 suites (`src/lib/logistics/phase-4-logistics.test.ts`).
- **Legacy Delivery Test Suite**: 26/26 tests passed across 7 suites (`src/lib/delivery/delivery.test.ts`).
- **Full Project Test Suite**: 324/324 tests passed across 132 test suites (0 regressions).
- **TypeScript Typecheck**: 0 errors (`npm run typecheck`).
- **Next.js Production Build**: Succeeded (`npm run build`), generating 24/24 static/dynamic routes.
- **Database Migrations**: 0 destructive schema changes; 0 dropped or renamed columns.

---

## Current vs. New Logistics Architecture

### Previous Architecture (Phase 3 Baseline)
Prior to Phase 4, the logistics and shipping layer exhibited tight coupling:
- Checkout components directly queried `DeliveryPricingService.calculateDeliveryCost({ wilayaId, isStopDesk, subtotalDzd, freeShippingThresholdDzd })`.
- Delivery pricing assumed Algerian DZD currency directly as raw numbers.
- `DeliveryService` directly instantiated `EcoTrackDeliveryProvider` and depended on raw EcoTrack status strings (`NOUVEAU`, `PRET`, `EN_DISTRIBUTION`, etc.).
- Courier webhooks in `src/app/api/webhooks/ecotrack/route.ts` coupled directly to EcoTrack JSON formats and EcoTrack-specific status strings.

### New Architecture (Phase 4 Foundation)
The new logistics architecture in `src/lib/logistics/` introduces an onion-layered model:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           STORE SETTINGS                                │
│  public.store_settings (PostgreSQL singleton row)                       │
│  - defaultShippingMethod, freeShippingThreshold, defaultCourierProvider │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          COUNTRY PROFILE                                │
│  CountryRegistry.get(code: string): CountryProfile                      │
│  - Administrative division semantics: Wilaya (DZ), Department (FR)      │
│  - Locality semantics: Commune, City                                    │
│  - Phone sanitization & postal code rules                               │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        ADDRESS / GEOGRAPHY                              │
│  AddressService                                                         │
│  - Provider-neutral ShippingAddress model                               │
│  - Normalization & validation via CountryProfile                        │
│  - Database snapshot converters (orders <-> ShippingAddress)            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SHIPPING RULES ENGINE                           │
│  ShippingRulesEngine                                                    │
│  - Serviceability checks (Wilaya/zone active & supported)               │
│  - Shipping method availability (HOME vs STOP_DESK)                     │
│  - COD eligibility evaluation                                           │
│  - Free shipping threshold qualification via MoneyMath                  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    SHIPPING RATE CALCULATOR                             │
│  ShippingRateCalculator                                                 │
│  - Queries delivery_rate_matrix via repository                          │
│  - Computes Money-based rates using MoneyMath                           │
│  - Supports multi-currency profiles with zero hardcoded DZD assumptions │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   DELIVERY PROVIDER REGISTRY & ADAPTERS                 │
│  LogisticsProviderRegistry.getProvider(providerId)                      │
│  - IDeliveryProvider interface contract                                 │
│  - EcoTrackDeliveryProvider (Algeria adapter)                           │
│  - Normalized statuses: PENDING, CREATED, IN_TRANSIT, DELIVERED, etc.   │
│  - Normalized webhooks: NormalizedWebhookEvent                          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        SHIPMENT LIFECYCLE                               │
│  DeliveryService & Order Management                                     │
│  - Historical shipping snapshots preserved in order record              │
│  - Idempotent shipment tracking & status updates                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Geography Boundary

The geography layer decouples generic address fields from nation-specific concepts:
- **`ShippingAddress` Contract**:
  ```typescript
  export interface ShippingAddress {
    countryCode: string;             // ISO 3166-1 alpha-2 (e.g. 'DZ', 'FR')
    administrativeAreaCode?: string; // Wilaya code ('16'), State, Dept
    administrativeAreaName?: string; // 'Alger', 'Oran'
    localityCode?: string;           // Commune code
    localityName?: string;           // 'Bab El Oued'
    postalCode?: string;             // Postal code / ZIP code
    addressLine1: string;            // Street / District / Building
    addressLine2?: string;
    recipientName: string;           // Customer full name
    recipientPhone: string;          // Sanitized international/national phone
    recipientEmail?: string;
  }
  ```
- **Authoritative Database Data Preserved**:
  - `public.wilayas`: 58 Wilayas remain the authoritative reference table in PostgreSQL.
  - Commune data and postal boundaries are mapped through `AddressService`.
- **Converters**:
  - `AddressService.fromOrder(order)`: Constructs a strongly-typed `ShippingAddress` from raw database order rows (`wilaya_id`, `commune`, `shipping_address`, `customer_name`, `customer_phone`).
  - `AddressService.toOrderSnapshot(address)`: Produces the exact schema fields needed to store or reconstruct order shipping records.

---

## CountryProfile Integration

The Phase 3 `CountryProfile` contract (`src/lib/country/types.ts`) governs regional format specifications without courier logic:
- `CountryProfile.subdivisionType`: `'wilaya'` for Algeria, `'department'` for France.
- `CountryProfile.phone`: Sanitization rules (e.g., Algerian mobile cleaning supporting `05/06/07`, `+213`, `+2130`, `002130`).
- `AddressService.validateAddress(address, profile)` verifies required subdivisions and phone formats against the selected country profile.
- Strict isolation: `CountryProfile` contains **zero courier API endpoints, tokens, or delivery pricing tables**.

---

## Shipping Rules

`ShippingRulesEngine` (`src/lib/logistics/rules.ts`) evaluates store-level and destination policies:
- **Serviceability**: Determines if a destination is serviceable based on active Wilayas or administrative area status.
- **Available Methods**: Returns supported shipping methods for destination (`HOME` vs `STOP_DESK`).
- **Payment Method Rules**: Enforces COD eligibility based on country profile (`profile.supportsCashOnDelivery`) and destination constraints.
- **Free Shipping Qualification**: Evaluates whether the cart subtotal satisfies the store threshold using `MoneyMath.gte()`:
  ```typescript
  if (threshold && MoneyMath.gte(subtotal, threshold)) {
    return { isFree: true, threshold, qualifiedAmount: subtotal };
  }
  ```

---

## Rate Calculation & Money Integration

`ShippingRateCalculator` (`src/lib/logistics/rate-calculator.ts`) computes delivery costs:
- Integrates with the Phase 3 `Money` engine (`MoneyMath`, `SCALE_FACTOR = 10,000`).
- Retrieves pricing from `public.delivery_rate_matrix` (or in-memory mock matrix in isolated unit tests).
- Converts raw database integers/decimals into immutable `Money` instances matching the store's configured currency (`DZD`, `EUR`, `USD`, etc.).
- Evaluates free shipping threshold via `ShippingRulesEngine`.
- Emits a standardized `ShippingRate` object:
  ```typescript
  export interface ShippingRate {
    method: ShippingMethod;       // 'HOME' | 'STOP_DESK'
    amount: Money;                // Base cost or 0 if free
    originalAmount: Money;        // Matrix rate before discounts
    isFree: boolean;              // Free delivery indicator
    freeShippingThreshold?: Money;
    estimatedDeliveryDays?: { min: number; max: number };
    zoneId?: string;
  }
  ```
- Exposes backward-compatible legacy method `calculateRateForWilaya` and property aliases (`subtotalDzd`, `freeShippingThresholdDzd`) so legacy callers experience zero breakage.

---

## Delivery Provider Contract

`IDeliveryProvider` (`src/lib/logistics/contracts.ts`) defines an agnostic delivery provider interface:
```typescript
export interface IDeliveryProvider {
  readonly id: string;
  readonly name: string;
  readonly isSandbox: boolean;
  readonly capabilities: ProviderCapabilities;

  createShipment(request: CreateShipmentRequest): Promise<ShipmentResult>;
  getShipment(shipmentId: string): Promise<ShipmentDetails>;
  cancelShipment(shipmentId: string): Promise<{ success: boolean; error?: string }>;
  getTracking(trackingNumber: string): Promise<TrackingEvent[]>;
  parseWebhook(rawPayload: unknown, signature?: string): Promise<NormalizedWebhookEvent>;
}
```

### Provider Capabilities
Each provider explicitly declares its supported capabilities:
```typescript
export interface ProviderCapabilities {
  createShipment: boolean;
  cancelShipment: boolean;
  tracking: boolean;
  webhook: boolean;
  labelGeneration: boolean;
  codSupport: boolean;
  returns: boolean;
}
```

---

## EcoTrack Adapter

The existing Algerian courier implementation is refactored into `EcoTrackDeliveryProvider` (`src/lib/logistics/adapters/ecotrack.ts`):
- Implements `IDeliveryProvider`.
- Capabilities: `createShipment: true`, `cancelShipment: true`, `tracking: true`, `webhook: true`, `labelGeneration: false`, `codSupport: true`, `returns: false`.
- **Dual-Input Normalization**: Accepts both new `CreateShipmentRequest` (using `ShippingAddress`) and legacy `CreateShipmentInput` (using `wilayaId`, `commune`, `isStopDesk`).
- **EcoTrack API Isolation**: Converts normalized domain requests into EcoTrack's expected payload format (`wilaya_id`, `commune`, `stop_desk`, `montant`).
- **Normalized Status Output**: Maps raw EcoTrack response statuses to normalized `ShipmentStatus` enums.
- **Sandbox/Demo Simulation**: When running in demo mode or without API keys, generates safe mock tracking IDs (`ECO-DEMO-...`) without issuing network calls or expending courier credits.

---

## Provider Registry

`LogisticsProviderRegistry` (`src/lib/logistics/registry.ts`) manages active delivery providers:
- `registerProvider(provider: IDeliveryProvider)`: Registers provider adapters.
- `getProvider(id?: string)`: Resolves provider by identifier (e.g. `'ecotrack'`, `'ECOTRACK'`) falling back to the configured default provider.
- `getAllProviders()`: Lists all registered providers and their capabilities.
- Legacy `DeliveryProviderRegistry` (`src/lib/delivery/registry.ts`) delegates directly to `LogisticsProviderRegistry`, maintaining complete backward compatibility.

---

## Shipment Status Normalization

Shipment statuses across all courier providers are normalized to standard domain values:
```typescript
export type ShipmentStatus =
  | 'PENDING'            // Order placed, shipment not yet created with courier
  | 'CREATED'            // Shipment created in courier system
  | 'PICKED_UP'          // Package collected from warehouse / store
  | 'IN_TRANSIT'         // Package moving between hubs
  | 'OUT_FOR_DELIVERY'   // Out with delivery courier for final mile
  | 'DELIVERED'          // Successfully delivered to recipient
  | 'FAILED'             // Delivery attempt failed / recipient unreachable
  | 'CANCELLED'          // Shipment cancelled before delivery
  | 'RETURNED';          // Package returned to sender
```

### EcoTrack Status Mapping Matrix
| Raw EcoTrack Status | Normalized `ShipmentStatus` |
|---------------------|-----------------------------|
| `NOUVEAU`, `NEW`, `PENDING` | `CREATED` |
| `PRET`, `READY_FOR_PICKUP` | `CREATED` |
| `RAMASSE`, `PICKED_UP` | `PICKED_UP` |
| `EXPEDIE`, `CENTRE`, `IN_TRANSIT`, `SORTI` | `IN_TRANSIT` |
| `EN_DISTRIBUTION`, `OUT_FOR_DELIVERY` | `OUT_FOR_DELIVERY` |
| `LIVRE`, `DELIVERED` | `DELIVERED` |
| `ECHEC`, `FAILED`, `NON_ABOUTI` | `FAILED` |
| `ANNULE`, `CANCELLED` | `CANCELLED` |
| `RETOUR`, `RETOURNÉ`, `RETURNED` | `RETURNED` |

---

## Webhook Normalization & Boundary

Courier webhooks are normalized before entering application logic:
1. Webhook endpoint `src/app/api/webhooks/ecotrack/route.ts` resolves `EcoTrackDeliveryProvider` via `LogisticsProviderRegistry`.
2. `provider.parseWebhook(rawPayload, signature)` verifies HMAC signature using `ECOTRACK_WEBHOOK_SECRET` and maps the payload into a `NormalizedWebhookEvent`:
   ```typescript
   export interface NormalizedWebhookEvent {
     eventId: string;
     providerId: string;
     trackingNumber: string;
     externalShipmentId?: string;
     status: ShipmentStatus;
     rawStatus: string;
     timestamp: string;
     location?: string;
     note?: string;
     metadata?: Record<string, unknown>;
   }
   ```
3. The event is handed off to `DeliveryService.processNormalizedWebhookEvent()`, which performs database deduplication via SHA-256 payload hashing and updates the shipment status idempotently.

---

## Checkout & Order / Shipment Separation

### 1. Checkout Flow
Checkout (`checkout.service.ts`, `checkout-shell.tsx`) calls `DeliveryPricingService.calculateDeliveryCost()`:
- Internally delegates to `ShippingRateCalculator`.
- Consumes `ShippingAddress`, `ShippingRulesEngine`, and `MoneyMath`.
- Returns both the new `ShippingRate` (with `Money` amounts) and legacy numerical amounts for checkout display.

### 2. Order / Shipment Boundary
- **Order Financials**: Represents the commercial transaction (items, tax, shipping fee snapshot, COD total).
- **Shipment Entity**: Represents physical fulfillment (`public.deliveries` row with `tracking_number`, `courier_provider_id`, normalized `delivery_status`, raw `api_response`).
- **Historical Shipping Snapshot**: When an order is placed, `shipping_fee`, `delivery_type`, `wilaya_id`, `commune`, and `shipping_address` are immutably written to `public.orders`. Re-calculating current shipping matrix rates has zero impact on historical orders.

---

## Demo / Sandbox Handling

Safe execution guarantees remain enforced:
- EcoTrack provider checks `process.env.ECOTRACK_SANDBOX === 'true'` or empty API token.
- In sandbox/demo mode:
  - Generates deterministic simulated tracking numbers (`ECO-DEMO-...`).
  - Emits normalized simulated status updates (`CREATED`, `DELIVERED`).
  - Strictly prevents outgoing HTTP requests to live EcoTrack production endpoints.
  - Zero accidental courier billing or live package dispatch during testing.

---

## Security

- **Zero Plaintext Secrets in Code or Database**: Courier API tokens and webhook secrets reside strictly in environment variables (`ECOTRACK_API_TOKEN`, `ECOTRACK_WEBHOOK_SECRET`).
- **Webhook Signature Verification**: HMAC-SHA256 signature verification enforced before processing inbound courier updates.
- **Idempotency & Replay Protection**: Webhook payloads are hashed with SHA-256 and stored in `deliveries.metadata.processed_webhooks` to eliminate replay attacks.
- **Sanitized Logging**: All courier operations log normalized event details without exposing API tokens, passwords, or customer PII.

---

## Database Changes

- **Destructive Migrations**: None.
- **Table Alterations**: None.
- Existing tables `public.wilayas`, `public.delivery_rate_matrix`, `public.courier_providers`, `public.deliveries`, and `public.orders` remain 100% authoritative and unchanged.

---

## Verification & Testing

### 1. Targeted Phase 4 Unit Tests (`phase-4-logistics.test.ts`)
- **Suite 1: Geography & Address Normalization (6 tests)**:
  - Validates Algeria address structure.
  - Formats national phone numbers cleanly (`+2130` -> `0...`).
  - Validates missing required fields (wilaya, commune, address line).
  - Converts orders to `ShippingAddress` snapshots and vice-versa.
- **Suite 2: Shipping Rules Engine (4 tests)**:
  - Verifies serviceability for active Wilayas.
  - Rejects inactive or unserviceable destinations.
  - Evaluates COD eligibility.
  - Evaluates free shipping qualification using `MoneyMath`.
- **Suite 3: Shipping Rate Calculator (4 tests)**:
  - Computes home and stop-desk delivery rates with `Money`.
  - Applies free shipping when subtotal exceeds threshold.
  - Returns fallback rate for missing Wilayas.
- **Suite 4: Delivery Provider Interface & Capabilities (3 tests)**:
  - Verifies `EcoTrackDeliveryProvider` capabilities.
  - Resolves registered provider via `LogisticsProviderRegistry`.
  - Rejects unconfigured provider gracefully.
- **Suite 5: EcoTrack Adapter (5 tests)**:
  - Simulates shipment creation in sandbox mode with `ECO-DEMO-` tracking.
  - Retrieves shipment details.
  - Retrieves tracking timeline events.
  - Cancels shipment.
  - Adapts legacy input formats cleanly.
- **Suite 6: Shipment Status Normalization (3 tests)**:
  - Maps French EcoTrack statuses (`RAMASSE`, `EN_DISTRIBUTION`, `LIVRE`) to normalized statuses.
  - Maps error and cancellation statuses.
  - Handles unknown statuses with safe fallback.
- **Suite 7: Webhook Signature Verification & Normalization (3 tests)**:
  - Validates and parses HMAC-signed EcoTrack webhook.
  - Rejects invalid HMAC signature with 401.
  - Rejects missing signature when secret is configured.
- **Suite 8: Backward Compatibility Bridge (2 tests)**:
  - Ensures legacy `DeliveryPricingService.calculateDeliveryCost()` returns exact rates.
  - Ensures legacy `DeliveryProviderRegistry.getProvider()` returns `EcoTrackDeliveryProvider`.

### 2. Full Regression Test Run
- Total test suites: 132
- Total tests: 324 passed, 0 failed.
- 0 regressions across catalog, cart, checkout, admin OMS, branding, and commerce settings.

### 3. Typecheck
- Command: `npm run typecheck`
- Output: `tsc --noEmit` succeeded with 0 errors.

### 4. Next.js Production Build
- Command: `npm run build`
- Output: Turbopack production build compiled 24/24 routes successfully.

---

## Known Limitations & Intentional Deferred Scope

1. **Additional Couriers**: Yalidine, ZR Express, DHL, FedEx adapters are intentionally deferred to future extension phases; the registry is ready to receive them via `registerProvider()`.
2. **Phase 5 Secret Vault**: Provider credentials remain in environment variables; encrypted database secret management is designated for Phase 5.
3. **Dynamic Zone Pricing Matrix**: Phase 4 preserves the 58 Wilaya matrix table without replacing it with dynamic polygonal geofencing.

---

## Files Changed

### New Files Created
- `src/lib/logistics/types.ts`: Domain models, address, shipping rate, shipment status, webhook types.
- `src/lib/logistics/contracts.ts`: `IDeliveryProvider` interface and capability definitions.
- `src/lib/logistics/address.ts`: `AddressService` for address validation and snapshot transformations.
- `src/lib/logistics/rules.ts`: `ShippingRulesEngine` for destination serviceability and free-shipping rules.
- `src/lib/logistics/rate-calculator.ts`: `ShippingRateCalculator` with Phase 3 `Money` engine.
- `src/lib/logistics/adapters/ecotrack.ts`: `EcoTrackDeliveryProvider` implementing `IDeliveryProvider`.
- `src/lib/logistics/registry.ts`: `LogisticsProviderRegistry`.
- `src/lib/logistics/index.ts`: Unified module barrel export.
- `src/lib/logistics/phase-4-logistics.test.ts`: Comprehensive 30-test Phase 4 verification suite.

### Modified Files (Backward Compatibility & Integration)
- `src/lib/country/profiles/algeria.ts`: Enhanced `cleanAlgerianPhone` to handle `+2130` and `002130` numbers.
- `src/lib/delivery/types.ts`: Re-exported Phase 4 types while preserving legacy types.
- `src/lib/delivery/registry.ts`: Delegated to `LogisticsProviderRegistry`.
- `src/lib/delivery/ecotrack-provider.ts`: Re-exported `EcoTrackDeliveryProvider`.
- `src/lib/delivery/delivery-pricing.service.ts`: Delegated rate calculations to `ShippingRateCalculator`.
- `src/lib/services/delivery.service.ts`: Updated webhook processing to use normalized events.
- `src/app/api/webhooks/ecotrack/route.ts`: Refactored to consume adapter `parseWebhook` and normalized events.

---

## Rollback Strategy

In the unlikely event of a production issue:
1. Because no database schemas or columns were modified, zero database rollback is needed.
2. The legacy API surface in `src/lib/delivery/` remains intact; any caller can continue using `DeliveryPricingService` and `DeliveryProviderRegistry`.
3. Standard Git rollback to the commit prior to Phase 4 restores the previous codebase cleanly without data loss.
