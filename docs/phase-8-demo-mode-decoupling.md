# DRIPIDIN Phase 8 — Demo Mode Decoupling & Production Safety Report

## Final Status: PHASE 8 — VERIFIED & HARDENED

---

### Executive Summary

Phase 8 establishes authoritative, verifiable decoupling of all sandbox/demo operations from the real production store. The fundamental invariant:
```text
DEMO ≠ REAL
```
has been enforced and proven across data models, public catalog views, inventory reservations, order lifecycles, courier shipments, notifications, webhook ingestion, payment reconciliations, dynamic SEO, caching, and administrative controls.

---

## 1. Authoritative Mode Resolver Architecture

### `DemoModeService.getEffectiveMode()`

The operational mode of the platform is resolved authoritatively on the server side:

```
┌────────────────────────────────────────┐
│        FORCE_DEMO_MODE (ENV)           │  Priority 1: Environment Override
└───────────────────┬────────────────────┘
                    │ (If undefined)
                    ▼
┌────────────────────────────────────────┐
│    store_settings.force_demo_mode      │  Priority 2: Persistent DB Singleton
└───────────────────┬────────────────────┘
                    │ (If unreachable/missing)
                    ▼
┌────────────────────────────────────────┐
│       FAIL-SAFE CLOSED: DEMO           │  Priority 3: Default Safe Failsafe
└────────────────────────────────────────┘
```

**Security Guarantees:**
* **Zero Client Authority**: Query parameters, cookies, `localStorage`, request headers, hidden form inputs, or UI state can never alter the operational mode.
* **Fail-Closed Default**: If database configuration is unreachable or during cold-start network partitions, the resolver defaults closed to `DEMO` (`isDemo: true`) to prevent accidental external side effects.
* **No `NODE_ENV` Coupling**: The operational demo switch is decoupled from `NODE_ENV` so that staging, preview, and production environments can run either mode safely.

---

## 2. Provider Side-Effect Matrix

A centralized server-side guard, `DemoModeService.requireRealProviderOrThrow()`, enforces the required side-effect matrix before any external provider dispatch:

| Mode | Provider Credentials Present | Planned Action | Outcome |
| :--- | :--- | :--- | :--- |
| **DEMO** | Yes | `SIMULATE` | Mock dispatch; zero network calls or billing |
| **DEMO** | No | `SIMULATE` | Mock dispatch; zero network calls or billing |
| **REAL** | Yes | `REAL_PROVIDER` | Live API call with decrypted credentials |
| **REAL** | No | `BLOCK` | Throws `ProviderConfigurationException` |
| **UNKNOWN** | Any | `BLOCK` | Throws `ProviderConfigurationException` |

> **Critical Rule**: Production operations with missing credentials **NEVER silently simulate**. If credentials cannot be resolved in Real mode, execution is immediately halted.

---

## 3. Database Schema & Migration `00019_demo_mode_isolation.sql`

Migration `00019_demo_mode_isolation.sql` was authored and applied to the database additively without dropping existing tables or mutating existing rows:

### 3.1 Entities Extended with `is_demo`
1. `products` (`is_demo BOOLEAN NOT NULL DEFAULT false`)
2. `inventory_transactions` (`is_demo BOOLEAN NOT NULL DEFAULT false`)
3. `orders` (`is_demo BOOLEAN NOT NULL DEFAULT false`)
4. `deliveries` (`is_demo BOOLEAN NOT NULL DEFAULT false`)
5. `payments` (`is_demo BOOLEAN NOT NULL DEFAULT false`)
6. `notifications` (`is_demo BOOLEAN NOT NULL DEFAULT false`)
7. `webhook_events` (`is_demo BOOLEAN NOT NULL DEFAULT false`)

### 3.2 Derived Scope Hierarchy
```
product (is_demo)
   │
   ▼
order (is_demo)
   │
   ├─────────────► order_items (scope validated by trigger)
   │
   ├─────────────► deliveries (is_demo)
   │
   ├─────────────► payments (is_demo)
   │
   ├─────────────► notifications (is_demo)
   │
   └─────────────► webhook_events (is_demo)
```

---

## 4. Public Catalog Views & RLS Hardening

Database views separate public catalog exposure and maintain `security_invoker = true`:

1. `public.public_products`:
   * Filter: `WHERE is_demo = false AND is_visible = true AND status = 'ACTIVE'`
   * `WITH (security_invoker = true)`
   * Strictly shields cost prices, supplier data, and demo inventory from public shoppers.
2. `public.public_demo_products`:
   * Filter: `WHERE is_demo = true AND is_visible = true AND status = 'ACTIVE'`
   * `WITH (security_invoker = true)`
   * Strictly exposes only deterministic demo hardware with `DEMO-*` SKUs.

### Server-Side Catalog Routing
In `StorefrontService.getProducts()`:
* **REAL mode** queries `public_products` (excluding all demo records).
* **DEMO mode** queries `public_demo_products` (excluding all real production inventory).

---

## 5. Order & Inventory Invariance

### 5.1 Database-Level Scope Enforcement Triggers
Two PostgreSQL triggers ensure cross-scope data contamination is impossible at the engine level:
* `trg_order_items_demo_check`: Before insert/update on `order_items`, asserts `order.is_demo == product.is_demo`. Throws `ERR_DEMO_SCOPE_MISMATCH` upon any violation.
* `trg_inv_tx_demo_check`: Before insert on `inventory_transactions`, asserts `inventory_transaction.is_demo == product.is_demo`.

### 5.2 Atomic Checkout Transaction (`create_order_atomic`)
The PostgreSQL stored procedure `create_order_atomic` bundles:
1. Double-entry stock reservation (`reserved_stock` increment)
2. Order header creation
3. Order items snapshotting
4. Order lifecycle history entry
5. Database-level idempotency record persistence

All actions execute within a single ACID transaction. If any step fails or inventory is insufficient, the entire operation rolls back cleanly.

### 5.3 Proven Inventory Invariance
Unit tests and database constraints verify:
* **Real Stock**: 10 units
* **Demo Reservation**: 1 unit
* **Resulting Real Available Stock**: 10 units (unaltered)
* **Resulting Demo Available Stock**: 49 units

---

## 6. Durable Notification Queue & Cron Protection

### 6.1 Mode-Aware Queue Processing
`QueueProcessor` inspects `job.is_demo` and `notification.metadata.isDemo`:
* `is_demo = true` → routes to simulation adapters across SMS, Email, WhatsApp, and Telegram.
* `is_demo = false` → routes to live provider adapters (Resend, MaghrebSMS, WhatsApp Cloud API, Telegram Bot) only if credentials exist in Phase 5 Vault.
* Concurrency protection: `SELECT ... FOR UPDATE SKIP LOCKED` prevents race conditions between multiple background runners.

### 6.2 Cron Endpoint Hardening (`/api/cron/notifications`)
* Protected with bearer token authentication (`CRON_SECRET`).
* Returns `401 Unauthorized` if secret is omitted or mismatched.

---

## 7. Logistics & Webhook Security (`/api/webhooks/ecotrack`)

### 7.1 Courier Shipment Decoupling
* `EcoTrackAdapter` uses `DemoModeService` to resolve mode for every shipment request.
* In `DEMO` mode, returns simulated tracking codes (`ECO-SIM-*`) and mock PDF label URLs without invoking courier HTTP APIs.
* In `REAL` mode, queries the encrypted vault for `ECOTRACK_TOKEN`. Missing tokens trigger an immediate block.

### 7.2 Webhook Hardening
* Mandatory secret verification: Requests without valid tokens (`x-ecotrack-secret`, `x-webhook-token`, or `Bearer`) are rejected with `401`.
* Persistent event log: Every payload hash is persisted to `webhook_events`.
* Scope verification: Webhook `is_demo` must match delivery and order `is_demo`. Mismatches are rejected with `403 Scope Mismatch`.

---

## 8. Payments & COD Reconciliation

* **COD Whitelist**: The platform strictly whitelists `CASH_ON_DELIVERY`. Unsupported online gateways are rejected upfront.
* **Metric Shielding**: `PaymentService.getPaymentMetrics()` filters out `is_demo = true` payments by default, preventing simulated orders from inflating financial reports.
* **Batch Isolation**: Reconciling payments strictly rejects mixed batches containing both real and demo records.

---

## 9. Dynamic SEO & Discovery Decoupling

In `DEMO` mode:
* `robots.txt`: Serves `Disallow: /` for all user agents.
* `sitemap.xml`: Returns empty array `[]`.
* Metadata: Emits `robots: { index: false, follow: false }`.

In `REAL` mode:
* Preserves dynamic Phase 7 SEO policies.
* Sitemap queries strictly filter `is_demo = false` to guarantee demo products never appear in search index feeds.

---

## 10. Admin Mode Switch Action & Governance

`setDemoModeAction` in `src/lib/actions/settings-cms.actions.ts`:
1. **Authentication & RBAC**: Verifies staff session with `settings.manage` permission or `OWNER` role.
2. **Explicit Confirmation**: Requires `{ confirmation: true }`.
3. **Operational Reason**: Enforces a non-empty audit rationale.
4. **Readiness Verification (DEMO → REAL)**:
   * Database connectivity health check
   * Vault Master Key verification via `VaultService.getActiveKey()`
   * SecretResolver credential checks
5. **Audit Logging**: Writes `DEMO_MODE_SWITCH` record to `settings_audit_logs` tracking old mode, new mode, actor email, timestamp, and justification.
6. **Cache Invalidation**: Triggers `safeRevalidateTag('store_settings')`, `safeRevalidatePath('/')`, and purges `CatalogProvider` partition cache.

---

## 11. Test Matrix & Regression Verification

### 11.1 Dedicated Phase 8 Test Suite (`src/lib/demo/phase-8-demo.test.ts`)
* **31 / 31 PASS** (100% success rate across all 10 boundary suites)

### 11.2 Comprehensive Test Suite
```bash
npm run test:ts
```
* **429 / 429 PASS** across Phases 1 through 8 (0 failures, 0 skipped)

### 11.3 Static Type Checking
```bash
npm run typecheck
```
* **0 errors** (`tsc --noEmit` exited with code 0)

### 11.4 Next.js Production Build
```bash
npm run build
```
* **SUCCESS**: All 27 static and dynamic App Router routes compiled and rendered with Turbopack.

---

## 12. Verification Evidence Status

| Verification Area | Requirement | Evidence Status | Proof Details |
| :--- | :--- | :--- | :--- |
| **Authoritative Mode Resolver** | Server-authoritative fallback | **PASS** | `DemoModeService.getEffectiveMode()` tested with ENV, DB, and fail-safe closed default. |
| **Provider Matrix** | Block unconfigured real | **PASS** | `requireRealProviderOrThrow` blocks with `ProviderConfigurationException`. |
| **Database Migration** | Non-destructive `00019` | **PASS** | Columns, views, triggers, and RPC added without mutating real data. |
| **Catalog Views** | Read-only separation | **PASS** | `public_products` (real) vs `public_demo_products` (demo), `security_invoker=true`. |
| **Order Scope Integrity** | `order.is_demo == product.is_demo` | **PASS** | Database trigger `trg_order_items_demo_check` and `CheckoutService` validation. |
| **Atomic Checkout** | Single ACID transaction | **PASS** | `create_order_atomic` RPC with database-level idempotency and stock reservations. |
| **Inventory Invariance** | Real stock untouched | **PASS** | Verified Real 10 stock remains 10 when Demo reserves 1. |
| **Notification Queue** | Simulation in Demo, locking | **PASS** | Row locking with `FOR UPDATE SKIP LOCKED` and simulation adapters. |
| **Cron Security** | `CRON_SECRET` protection | **PASS** | `/api/cron/notifications` rejects unauthenticated callers with 401. |
| **Logistics Adapter** | Simulated shipment & SecretResolver | **PASS** | `EcoTrackAdapter` resolves tokens via Vault; simulates `ECO-SIM-*` in Demo. |
| **Webhook Security** | Mandatory secret & scope check | **PASS** | `/api/webhooks/ecotrack` rejects missing secrets and cross-scope updates. |
| **COD Payments** | Whitelist & metrics isolation | **PASS** | Demo payments excluded from revenue overview; invalid methods blocked. |
| **Guest Checkout** | Demo checkout guest-only | **PASS** | Authenticated user profiles rejected during demo checkout. |
| **Cache Separation** | Mode-partitioned caches | **PASS** | `CatalogProvider` partitions datasets by mode; tags revalidated on mode switch. |
| **Dynamic SEO** | `noindex` and empty sitemap | **PASS** | Verified `robots.ts` Disallow: / and `sitemap.ts` [] in Demo mode. |
| **Admin Mode Switch** | RBAC, Audit, Readiness | **PASS** | `setDemoModeAction` enforced with `settings.manage`, audit logging, and readiness checks. |
| **Regression Testing** | 429 tests green | **PASS** | Phases 1–8 test suite passed 100%. |
| **Typecheck** | 0 TypeScript errors | **PASS** | `tsc --noEmit` clean. |
| **Production Build** | Clean Turbopack compilation | **PASS** | `next build` compiled all routes without error. |

---

## 13. System Boundaries & Known Limitations

1. **Payment Methods**: Platform currently accepts Cash on Delivery (COD). Online gateways (e.g. CIB/EDAHABIA) will require Phase 9 implementation.
2. **Demo Checkout**: Demo checkout is guest-only by design to prevent polluting production customer profiles and address books.
3. **External Real Dispatches**: In Real mode, courier shipments and SMS notifications require respective credentials to be provisioned in the Phase 5 Vault (`DRIPIDIN_VAULT_KEY`).
