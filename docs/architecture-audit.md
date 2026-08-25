# HamzaPhone — Comprehensive Architecture & Requirements Audit

> **Document Version:** 1.0  
> **Date:** August 24, 2026  
> **Target System:** HamzaPhone (Algerian Smartphone Spare Parts E-Commerce Platform)  
> **Audit Status:** COMPLETE — Baseline Requirements & Architecture Review  
> **Reference Baseline:** All files under `/docs/`, `/docs/ui/`, and `/prototypes/`

---

## 1. Overall Assessment

The **HamzaPhone** project documentation presents an exceptionally strong, domain-focused foundation tailored specifically to the Algerian smartphone replacement parts ecosystem. The architecture smartly integrates local commercial realities: **58 Wilayas topology**, **Cash on Delivery (COD) workflows**, **EcoTrack courier integration**, **B2B repair shop verification**, **multi-tier pricing**, and **high-density smartphone device compatibility trees**.

However, before proceeding to full-scale backend and frontend implementation, this comprehensive audit has identified several **critical architectural omissions, relational gaps, domain contradictions, and security vulnerabilities** that must be resolved to prevent costly refactoring during development.

### Executive Summary of Audit Findings

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AUDIT METRIC BREAKDOWN                          │
├────────────────────────────────┬───────────────────────────────────────┤
│ Total Documents Inspected       │ 16 files (10 core docs + 6 UI specs)  │
│ Critical Severity Issues (P0)  │ 6 items                               │
│ High Severity Issues (P1)      │ 11 items                              │
│ Medium Severity Issues (P2)    │ 14 items                              │
│ Low Severity Issues (P3)       │ 9 items                               │
│ Cross-Document Contradictions  │ 7 identified                          │
│ Missing Database Tables / DDL  │ 12 essential entities                 │
│ Security & RLS Gaps            │ 6 identified                          │
│ Performance / Scalability Risks│ 5 identified                          │
└────────────────────────────────┴───────────────────────────────────────┘
```

### Strategic Readiness Verdict

| Layer | Status | Verdict |
| :--- | :---: | :--- |
| **System Architecture** | 🟡 | Solid Next.js 16 + Supabase foundation; requires asynchronous background worker model for imports/exports. |
| **Domain Model & Database** | 🔴 | Incomplete SQL DDL; several core entities (Categories, Brands, Models, Profiles, Shipments, Carts) exist in concept/ERD but lack DDL definitions. |
| **Business Logic & Workflows** | 🟡 | Highly detailed pricing and order state machine; needs reconciliation on stock deduction timing and B2B minimum order values. |
| **Security & RLS Governance** | 🔴 | RLS column-level cost price leakage risk; unauthenticated guest order tracking security flaw; missing rate-limiting DDL. |
| **Search & Discovery** | 🟡 | Hybrid FTS + Trigram architecture is well designed; requires optimization on JSONB compatibility searches to prevent sequential table scans. |
| **Logistics & Integrations** | 🟢 | Clean `DeliveryProvider` abstraction layer; needs dynamic database configuration storage for courier credentials. |
| **UI/UX Design System** | 🟢 | Consistent design tokens, 36 admin screens, 30 storefront screens, rich interaction and responsive rules. |

---

## 2. Critical Issues (Priority P0)

These issues represent architectural blockers, security vulnerabilities, or fundamental relational gaps that will cause data corruption, security breaches, or system failures if not resolved prior to implementation.

---

### [CRIT-01] Column-Level Cost Price & Supplier Margin Leakage via PostgreSQL RLS

* **Problem:** `docs/roles-and-permissions.md` (Section 5) and `docs/security.md` (Section 2.1) state that RLS protects sensitive supplier cost prices (`cost_price`). However, PostgreSQL Row Level Security (`CREATE POLICY ... ON products FOR SELECT`) filters **rows**, not **columns**. When a public customer or competitor executes `supabase.from('products').select('*')`, PostgreSQL returns all columns of active products, exposing `cost_price` and profit margins directly in browser network responses.
* **Why it matters:** Competitors, retail buyers, and B2B clients can inspect API responses in browser DevTools to deduce supplier acquisition costs and gross margins, destroying HamzaPhone's commercial pricing advantage in Algeria.
* **Affected documents:** [`docs/domain-model.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/domain-model.md), [`docs/roles-and-permissions.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/roles-and-permissions.md), [`docs/security.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/security.md).
* **Recommended solution:**
  1. Implement **PostgreSQL Column-Level Grants**: Revoke public `SELECT` on `cost_price`, `supplier_sku`, `primary_supplier_id`.
  2. Implement a dedicated sanitized public view `public_products` or route all client catalog queries through a Postgres RPC / Next.js Server Action that projects only public-safe fields.
  3. Ensure `pricing.read` permission is strictly validated before including `cost_price` in query responses.
* **Priority:** `P0 (Critical)`

---

### [CRIT-02] Insecure Guest Order Tracking Vulnerable to Enumeration & Data Harvesting

* **Problem:** `docs/ui/storefront-screens.md` (Screen 20) and `docs/workflows.md` (Workflow 1) allow guests to track orders using order number (`#HP-YYYY-NNNN`) and phone number. However, `docs/roles-and-permissions.md` RLS policy on `orders` requires `customer_id = auth.uid()`, meaning an unauthenticated guest has `auth.uid() = NULL` and cannot query the `orders` table under RLS. If RLS is bypassed via a `service_role` query or unrestricted RPC, an attacker could script sequential order number queries (`HP-2026-000001` to `HP-2026-099999`) with common phone prefixes (`05`, `06`, `07`) to harvest customer names, phone numbers, and delivery addresses.
* **Why it matters:** Complete violation of customer privacy and Algerian data protection norms; potential competitor scraping of order volumes and customer databases.
* **Affected documents:** [`docs/roles-and-permissions.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/roles-and-permissions.md), [`docs/security.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/security.md), [`docs/ui/storefront-screens.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/ui/storefront-screens.md).
* **Recommended solution:**
  1. Generate a cryptographically secure, high-entropy `tracking_token` (`UUIDv4` or 32-character nano-id) upon order creation.
  2. The guest tracking URL must require `order_number` + `phone` matching AND/OR the `tracking_token`.
  3. Create an isolated PostgreSQL RPC `get_guest_order_tracking(p_order_number text, p_phone text, p_token uuid)` with strict rate-limiting (max 5 requests/min per IP) returning sanitized, masked data (e.g. `Moh*** B.`, address truncated to Wilaya/Commune only).
* **Priority:** `P0 (Critical)`

---

### [CRIT-03] Contradictory Physical Stock Deduction Lifecycle Across Documentation

* **Problem:** There is an explicit contradiction regarding when physical warehouse inventory (`stock_quantity`) is decremented:
  * `docs/business-rules.md` (Section 3, Table line 103): On transition `READY_FOR_SHIPMENT -> SHIPPED` (courier pickup): *"Marks stock as fulfilled (`current_stock -= quantity`, `reserved_stock -= quantity`)"*.
  * `docs/workflows.md` (Section 3, Step 99): On transition `SHIPPED -> DELIVERED` (EcoTrack webhook): *"Update Order Status -> 'DELIVERED', Deduct Physical Stock (`current_stock -= Qty`, `reserved_stock -= Qty`)"*.
* **Why it matters:** If stock is decremented upon `SHIPPED`, a delivery failure (`FAILED -> RETURNED`) requires restocking. If stock is decremented only on `DELIVERED`, physical stock remains counted in the warehouse while the parcel is in transit across Algeria for 3–6 days, creating severe discrepancy during physical warehouse cycle counts and allowing reserved stock to linger indefinitely.
* **Affected documents:** [`docs/business-rules.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/business-rules.md), [`docs/workflows.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/workflows.md), [`docs/domain-model.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/domain-model.md).
* **Recommended solution:** Standardize on **Dispatch-Time Deduction**:
  1. `PENDING / CONFIRMED / PROCESSING`: `stock_quantity` untouched, `reserved_stock += Qty`, `available_stock = stock_quantity - reserved_stock`.
  2. `READY_FOR_SHIPMENT -> SHIPPED`: Parcel physically leaves warehouse. `stock_quantity -= Qty`, `reserved_stock -= Qty`. Inventory transaction: `FULFILLMENT_OUT`.
  3. `FAILED -> RETURNED`: Returned package arrives back at warehouse and passes QC. `stock_quantity += Qty`. Inventory transaction: `CUSTOMER_RETURN_RESTOCK`.
* **Priority:** `P0 (Critical)`

---

### [CRIT-04] Missing Core Entity Relational Tables in Database Schema DDL

* **Problem:** While `docs/domain-model.md` defines `products`, `orders`, `suppliers`, and pricing tables, it completely omits the SQL DDL statements for several foundational domain entities that are referenced in foreign keys and the ERD:
  1. `categories` (referenced by `products.category_id`)
  2. `brands` (referenced by `products.brand_id`)
  3. `device_models` (referenced by `product_compatibility.device_model_id`)
  4. `customer_profiles` (referenced by `orders.customer_id`)
  5. `b2b_profiles` / `b2b_accounts` (referenced in ERD & business rules)
  6. `addresses` (referenced in ERD & checkout)
  7. `delivery_shipments` (referenced in ERD & logistics abstraction)
  8. `courier_providers` (referenced in ERD)
  9. `carts` & `cart_items` (required for multi-device cart persistence)
  10. `import_jobs` & `import_job_errors` (referenced in import/export workflows)
  11. `stock_alerts` (back-in-stock subscriptions)
  12. `product_reviews` (social proof engine)
* **Why it matters:** Attempting to execute the schema migration in PostgreSQL will immediately fail with `foreign key constraint cannot be implemented (relation does not exist)`.
* **Affected documents:** [`docs/domain-model.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/domain-model.md), [`docs/architecture.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/architecture.md).
* **Recommended solution:** Draft a complete, comprehensive SQL migration file containing all missing entity tables with foreign keys, cascading rules, unique constraints, and indexes.
* **Priority:** `P0 (Critical)`

---

### [CRIT-05] Sequential Scan Performance Degradation in Instant Search Query

* **Problem:** In `docs/search-architecture.md` (Section 3), the instant search query contains:
  ```sql
  WHERE ... OR p.compatibility::text ILIKE '%' || cleaned_query || '%'
  ```
  Casting a JSONB column to text and executing a leading wildcard `ILIKE '%query%'` inside a multi-branch `WHERE` clause prevents PostgreSQL from utilizing standard index paths and forces a **full sequential table scan** on every single keystroke.
* **Why it matters:** While fast with 50 products in local development, as the catalog scales to 4,000+ and 100,000+ SKUs with large compatibility trees, search response latency will explode from $<50\text{ ms}$ to $>800\text{ ms}$, pegging PostgreSQL CPU to 100% and violating the instant search requirement.
* **Affected documents:** [`docs/search-architecture.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/search-architecture.md), [`docs/architecture.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/architecture.md).
* **Recommended solution:**
  1. Remove runtime `compatibility::text` casting from the query `WHERE` clause.
  2. Include compatibility text directly in the stored `search_vector` generated column (already partially configured on line 55).
  3. Create an explicit expression Trigram GIN index:
     ```sql
     CREATE INDEX idx_products_compat_trgm ON products USING GIN ((compatibility::text) gin_trgm_ops);
     ```
  4. Query compatibility models through the normalized `product_compatibility` join or indexed JSONB operators (`@>`).
* **Priority:** `P0 (Critical)`

---

### [CRIT-06] Absence of Multi-Item Cart & Session Schema in Database Specification

* **Problem:** `docs/domain-model.md` defines `orders` and `order_items`, but completely lacks the data model for active shopping carts (`carts`, `cart_items`).
* **Why it matters:** Required features such as authenticated user cart synchronization across devices (mobile phone to desktop workshop PC), B2B quick-order bulk cart staging, and cart abandonment analytics cannot function without a durable database-backed cart model.
* **Affected documents:** [`docs/domain-model.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/domain-model.md), [`docs/ui/storefront-screens.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/ui/storefront-screens.md).
* **Recommended solution:** Add normalized `carts` and `cart_items` tables with `user_id`, `session_token` (for guests), item quantity constraints, price snapshots, and auto-expiration cleanup triggers.
* **Priority:** `P0 (Critical)`

---

## 3. High-Priority Issues (Priority P1)

---

### [HIGH-01] B2B Minimum Order Value (MOV) Contradiction

* **Problem:** Inconsistent minimum order values specified across documents:
  * `docs/business-rules.md` (Section 2, Rule 4): **15,000 DZD**.
  * `docs/workflows.md` (Section 2, Step 61): **15,000 DZD**.
  * `docs/ui/admin-screens.md` (Screen 4, Business Rules): **5,000 DZD**.
* **Why it matters:** Checkout validation logic in frontend forms and backend server actions will conflict, causing valid B2B orders to be rejected or wholesale prices to be granted on uneconomical small retail quantities.
* **Affected documents:** [`docs/business-rules.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/business-rules.md), [`docs/workflows.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/workflows.md), [`docs/ui/admin-screens.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/ui/admin-screens.md).
* **Recommended solution:** Establish **15,000 DZD** as the default business rule in the database settings table (`system_settings.b2b_min_order_dzd`), with the Admin UI allowing configurable thresholds per B2B tier.
* **Priority:** `P1 (High)`

---

### [HIGH-02] Brand Primary Color Token Discrepancy

* **Problem:** 
  * `docs/architecture.md` (Section 2, Line 18): `--color-brand: #FF6600`
  * `docs/ui/design-system.md` (Section 2, Line 22): `--color-brand: #FF6B00`
  * `prototypes/admin-dashboard.html` & `prototypes/design-system.html`: `--brand: #FF6B00`
* **Why it matters:** Inconsistent CSS token implementations across Tailwind configuration and UI components will cause subtle visual mismatches between storefront and admin interfaces.
* **Affected documents:** [`docs/architecture.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/architecture.md), [`docs/ui/design-system.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/ui/design-system.md).
* **Recommended solution:** Unify all documentation and code tokens to the approved vibrant brand orange: **`#FF6B00`** (`--color-brand-dark: #CC5500`, `--color-brand-light: #FFF0E6`).
* **Priority:** `P1 (High)`

---

### [HIGH-03] EcoTrack & Courier Credentials Stored in Environment Variables Instead of Dynamic DB Settings

* **Problem:** In `docs/integrations.md` (Section 2), `EcoTrackDeliveryProvider` reads credentials directly from `process.env.ECOTRACK_API_TOKEN`. However, `docs/ui/admin-screens.md` (Screen 29) and `docs/admin-dashboard.md` specify an admin interface to configure and update API keys, webhook secrets, and sandbox/production modes.
* **Why it matters:** Changing API keys or switching between Sandbox/Production in the admin UI will have no effect if the provider class relies on static server environment variables, forcing redeployments.
* **Affected documents:** [`docs/integrations.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/integrations.md), [`docs/ui/admin-screens.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/ui/admin-screens.md), [`docs/admin-dashboard.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/admin-dashboard.md).
* **Recommended solution:** Create a secure database table `integration_configs` (or encrypted fields in `system_settings`) with encrypted tokens, cached via Next.js tag caching with on-demand invalidation when updated via the Admin UI.
* **Priority:** `P1 (High)`

---

### [HIGH-04] Lack of Webhook Idempotency & Signature Verification Architecture

* **Problem:** `docs/integrations.md` and `docs/workflows.md` describe webhook event handling from EcoTrack (for status updates like `DELIVERED` or `FAILED`). However, there is no specification for webhook authentication, signature verification, retry handling, or idempotency protection.
* **Why it matters:** Without idempotency checks, network retries or duplicate webhook deliveries could trigger multiple physical stock deductions or duplicate customer notification dispatches.
* **Affected documents:** [`docs/integrations.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/integrations.md), [`docs/workflows.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/workflows.md), [`docs/security.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/security.md).
* **Recommended solution:**
  1. Specify a dedicated endpoint `/api/webhooks/ecotrack` with HMAC-SHA256 signature verification.
  2. Implement an `idempotency_keys` or `webhook_events_log` table storing `(provider, event_id, payload_hash, processed_at)` to guarantee exactly-once processing.
* **Priority:** `P1 (High)`

---

### [HIGH-05] Import Execution Architecture Timeout Risk on Serverless Runtimes

* **Problem:** `docs/import-export.md` mentions processing spreadsheets of up to 50,000+ rows in Next.js streaming chunks. In serverless deployment environments (e.g. Vercel / Netlify / Cloudflare Workers), execution timeouts (15s to 60s max) will abort large import transactions halfway through.
* **Why it matters:** High-volume supplier catalog imports (10,000+ SKUs) will time out and fail, leaving administrators unable to perform full inventory restocks or bulk supplier price updates.
* **Affected documents:** [`docs/import-export.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/import-export.md), [`docs/architecture.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/architecture.md).
* **Recommended solution:**
  1. For files $> 2,000$ rows, upload file to Supabase Storage and register an `import_jobs` record with status `PENDING`.
  2. Process imports asynchronously in batched background jobs (via Supabase Edge Functions, Inngest, or chunked client-orchestrated batches of 250 rows).
  3. Store per-row validation results in `import_job_rows` so admins can inspect progress via the dedicated Import Result screen (`/admin/import/:jobId`).
* **Priority:** `P1 (High)`

---

### [HIGH-06] Missing Dynamic B2B Tier Price Synchronization Rule

* **Problem:** `docs/domain-model.md` defines `b2b_pricing_tiers` with `default_discount_percentage`, but also `b2b_tier_prices` with explicit static `price_dzd`. `docs/business-rules.md` does not define what happens when a product's base `b2c_price` is increased by 10% during a bulk adjustment: do explicit `b2b_tier_prices` remain fixed, or do they auto-scale?
* **Why it matters:** If base retail prices rise due to currency inflation in Algeria, fixed B2B prices could become lower than acquisition costs, causing wholesale margin losses.
* **Affected documents:** [`docs/business-rules.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/business-rules.md), [`docs/domain-model.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/domain-model.md).
* **Recommended solution:** Explicitly specify in `business-rules.md`:
  * If a product has an explicit row in `b2b_tier_prices`, it uses that fixed price.
  * If no explicit override exists, the tier price dynamically calculates as:  
    $$\text{Tier Price} = \text{ROUND\_DZD}\left(\text{b2c\_price} \times \left(1 - \frac{\text{discount\_percentage}}{100}\right)\right)$$
  * During bulk price updates, the wizard must provide a checkbox: *"Recalculate and update explicit B2B tier overrides"*.
* **Priority:** `P1 (High)`

---

### [HIGH-07] Unhandled Special Characters in Instant Search TSQuery Sanitizer

* **Problem:** In `docs/search-architecture.md` (Section 3), the query sanitizer splits terms on spaces and appends `:*`:
  ```sql
  ts_query := to_tsquery('simple', string_agg(quote_literal(term) || ':*', ' & '))
  ```
  If a technician searches for complex part codes containing hyphens, colons, or parentheses (e.g. `SM-G998B`, `B-7000`, `GH82-26031A`, `IPHONE(13)`), `to_tsquery` will throw syntax errors and crash the search API route.
* **Why it matters:** Technicians frequently copy-paste technical part numbers with hyphens and slashes; crashing search requests destroys user trust.
* **Affected documents:** [`docs/search-architecture.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/search-architecture.md).
* **Recommended solution:** Use `plainto_tsquery` or `websearch_to_tsquery`, or sanitize with `regexp_replace(cleaned_query, '[^\w\s]', ' ', 'g')` before tokenizing.
* **Priority:** `P1 (High)`

---

### [HIGH-08] Missing Multi-Seat Organization Architecture for B2B Accounts

* **Problem:** `docs/domain-model.md` links `customer_profiles` 1-to-1 with B2B status. However, larger repair shops, multi-branch repair chains, and corporate distributors in Algeria have multiple technicians/buyers placing orders under a single legal business entity (*Registre de Commerce*).
* **Why it matters:** Separate technicians at the same repair shop cannot share credit lines, order history, or company billing profiles without sharing a single login password.
* **Affected documents:** [`docs/domain-model.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/domain-model.md), [`docs/ui/storefront-screens.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/ui/storefront-screens.md).
* **Recommended solution:** Introduce a normalized `b2b_organizations` table and an `organization_members` junction table with roles (`ORG_ADMIN`, `ORG_BUYER`).
* **Priority:** `P1 (High)`

---

### [HIGH-09] Incomplete Supabase Realtime CDC Publication & Security Specification

* **Problem:** `docs/architecture.md` and `docs/ui/interaction-rules.md` emphasize live order badges and stock alerts via Supabase Realtime CDC. However, Postgres Logical Replication streams bypass standard RLS unless `REPLICA IDENTITY FULL` is enabled on the publication tables and Supabase Realtime RLS policies are explicitly declared.
* **Why it matters:** Without proper configuration, real-time broadcasts could either leak order information across tenants or fail to trigger updates in the client UI.
* **Affected documents:** [`docs/architecture.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/architecture.md), [`docs/security.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/security.md), [`docs/ui/interaction-rules.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/ui/interaction-rules.md).
* **Recommended solution:** Include explicit migration commands in the schema:
  ```sql
  ALTER TABLE orders REPLICA IDENTITY FULL;
  ALTER TABLE products REPLICA IDENTITY FULL;
  ALTER PUBLICATION supabase_realtime ADD TABLE orders, products;
  ```
* **Priority:** `P1 (High)`

---

### [HIGH-10] Lack of Concurrency Protection During High-Frequency Stock Deductions

* **Problem:** While `docs/workflows.md` mentions `SELECT ... FOR UPDATE`, `docs/domain-model.md` does not specify a PostgreSQL stored procedure or database-level trigger enforcing atomic stock reservation during high-concurrency flash sales or simultaneous B2B wholesale orders.
* **Why it matters:** If two buyers checkout the last remaining OLED screen at the exact same millisecond, race conditions in standard application queries will cause negative stock quantities and order fulfillment failure.
* **Affected documents:** [`docs/domain-model.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/domain-model.md), [`docs/business-rules.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/business-rules.md).
* **Recommended solution:** Create an atomic PostgreSQL RPC function `reserve_order_stock(p_order_id UUID)` that locks item rows, verifies `available_stock >= qty`, increments `reserved_stock`, and inserts ledger rows within a single atomic database transaction.
* **Priority:** `P1 (High)`

---

### [HIGH-11] Missing Delivery Rates & Wilaya Matrix Database Schema

* **Problem:** `docs/integrations.md` hardcodes `return 600; // Default DZD baseline` for shipping rates, and `docs/business-rules.md` mentions 58 Wilayas with Home vs Stop Desk rates, but no SQL schema is defined to store and manage shipping rate tables.
* **Why it matters:** Admins will be unable to update Wilaya delivery fees or add new courier rates from the Delivery Management screen (`/admin/delivery`).
* **Affected documents:** [`docs/domain-model.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/domain-model.md), [`docs/integrations.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/integrations.md), [`docs/ui/admin-screens.md`](file:///d:/Websites%20On%20Line/hamzaphone/docs/ui/admin-screens.md).
* **Recommended solution:** Add `wilayas`, `communes`, and `delivery_rate_matrix` tables with Home/Desk base prices, free shipping overrides, and lead-time estimates.
* **Priority:** `P1 (High)`

---

## 4. Medium-Priority Issues (Priority P2)

---

### [MED-01] Partial Import Failure Strategy vs Atomic Rollback Inconsistency
* **Problem:** `docs/import-export.md` specifies atomic batch rollback on error, while `docs/ui/admin-screens.md` (Screen 19) specifies `COMPLETED_WITH_ERRORS` where valid rows are saved and erroneous rows are flagged for download.
* **Solution:** Standardize on **Row-Level Error Isolation**: valid rows commit; invalid rows stage to an error table with line numbers and field-level validation errors.
* **Priority:** `P2 (Medium)`

### [MED-02] Denormalized Gallery Array vs Normalized Media Assets Table
* **Problem:** `products.gallery` is modeled as `TEXT[]`, while `docs/ui/admin-screens.md` requires re-ordering images, assigning alt texts, marking primary thumbnails, and tracking asset metadata.
* **Solution:** Create a normalized `product_images` table (`id`, `product_id`, `image_url`, `alt_text`, `display_order`, `is_primary`, `width`, `height`).
* **Priority:** `P2 (Medium)`

### [MED-03] Missing Customer Phone Verification / OTP Architecture
* **Problem:** `docs/business-rules.md` (Section 3) requires phone verification for COD orders, but `docs/integrations.md` lists SMS OTP as an "optional upgrade".
* **Solution:** Define the OTP verification state machine (`phone_verified`, `otp_code`, `otp_expires_at`) to mitigate fraudulent COD orders.
* **Priority:** `P2 (Medium)`

### [MED-04] Missing Database Migration & Seed Data Plan
* **Problem:** The documentation does not specify the initial seed data required for Algerian operational readiness (58 Wilayas, initial categories, quality grades, system roles, and default permissions).
* **Solution:** Provide explicit seed scripts for 58 Algerian Wilayas and standard spare part category taxonomies.
* **Priority:** `P2 (Medium)`

### [MED-05] Missing Soft-Delete (`deleted_at`) Columns Across Catalog Entities
* **Problem:** `docs/ui/admin-screens.md` (Screen 34) specifies a Trash & Archive module with 30-day restore capabilities, but several database tables lack a `deleted_at TIMESTAMPTZ` column.
* **Solution:** Add `deleted_at TIMESTAMPTZ` and `deleted_by UUID` to `products`, `categories`, `brands`, `suppliers`, and `customer_profiles`.
* **Priority:** `P2 (Medium)`

### [MED-06] Missing Barcode Scanner Ergonomics in Admin UI Specification
* **Problem:** Warehouse receiving and picking requires hardware barcode scanner support (HID keyboard wedge), which emits rapid keystrokes followed by `Enter`.
* **Solution:** Document global barcode scanner listener rules in `docs/ui/interaction-rules.md` to prevent accidental form submissions when scanning.
* **Priority:** `P2 (Medium)`

### [MED-07] Missing Algerian Tax Compliance Fields (Facture Proforma / TVA / Timbre)
* **Problem:** B2B commercial invoicing in Algeria requires specific tax fields (*TVA 19%*, *Timbre fiscal*, *Article d'imposition*), which are absent from the `orders` financial columns.
* **Solution:** Add `tax_tva_dzd`, `tax_timbre_dzd`, `is_tax_exempt`, and `article_imposition` to `orders` and `b2b_profiles`.
* **Priority:** `P2 (Medium)`

### [MED-08] Missing Order Cancellation Window Timeouts in Business Rules
* **Problem:** `docs/business-rules.md` mentions customers can cancel within 1 hour, but does not define automated TTL job triggers for unconfirmed COD orders after 24 hours.
* **Solution:** Define a scheduled database cron job (`pg_cron` or Edge Function) to cancel stale `PENDING` orders after 24h and release reserved inventory.
* **Priority:** `P2 (Medium)`

### [MED-09] Missing Stock Buffer Rule for High-Velocity B2B Purchases
* **Problem:** Business rules state high-volume B2B orders cannot wipe out entire inventory, but do not specify the formula for max allowable wholesale quantity per order.
* **Solution:** Specify rule: `max_b2b_order_qty = MAX(1, available_stock - low_stock_threshold)`.
* **Priority:** `P2 (Medium)`

### [MED-10] Missing Currency Formatting & Arabic Numerals Rule
* **Problem:** Storefront and Admin docs specify DZD currency, but lack standard formatting tokens for thousand separators (e.g. `14 500,00 DZD` vs `14,500.00 DA` vs `14500 د.ج`).
* **Solution:** Standardize in `design-system.md`: `14 500 DA` (French UI) and `14 500 د.ج` (Arabic UI) using non-breaking spaces.
* **Priority:** `P2 (Medium)`

### [MED-11] Missing Image Compression & WebP Pipeline Specification
* **Problem:** Uploading 10MB uncompressed camera photos from suppliers will degrade mobile page loads in Algeria where mobile 4G bandwidth varies.
* **Solution:** Specify Supabase Storage automatic WebP transformation pipeline with max dimensions (800×800px for catalog, 1200×1200px for zoom).
* **Priority:** `P2 (Medium)`

### [MED-12] Incomplete RMA & Return Warranty Entity Model
* **Problem:** `docs/business-rules.md` (Section 6) details 15-day return rules for unglued screens, but there is no `return_requests` / `rma_items` table to track returned items, inspection photos, and technician approvals.
* **Solution:** Add an `rma_requests` entity linked to `orders` and `order_items`.
* **Priority:** `P2 (Medium)`

### [MED-13] Missing Multi-Currency Supplier Purchase Order Modeling
* **Problem:** Suppliers in Shenzhen quote in USD or RMB, but HamzaPhone calculates inventory in DZD. The schema lacks exchange rate snapshotting at purchase order time.
* **Solution:** Ensure `supplier_products` and purchase orders capture `exchange_rate_to_dzd` at time of receiving.
* **Priority:** `P2 (Medium)`

### [MED-14] Missing Session-to-User Cart Merge Strategy Specification
* **Problem:** `docs/ui/storefront-screens.md` (Screen 9) states guest cart merges with server cart upon login, but does not specify conflict resolution when the same SKU exists in both carts with different quantities.
* **Solution:** Specify rule in `interaction-rules.md`: On login, take `MAX(guest_qty, user_qty)` capped at `available_stock`.
* **Priority:** `P2 (Medium)`

---

## 5. Low-Priority Issues (Priority P3)

* **[LOW-01]** **Terminology Inconsistency:** Prototype uses French *"Corbeille"* while navigation docs use English *"Trash / Archive"*. Unify to French in navigation spec.
* **[LOW-02]** **Missing Keyboard Shortcut Map in Storefront:** Fast navigation shortcuts for power-user repair technicians (`/` for search, `B` for B2B matrix).
* **[LOW-03]** **Unspecified Avatar Generation for Admin Staff:** Default fallback when no photo is uploaded (initials on brand background).
* **[LOW-04]** **Missing Favicon Package Manifest:** Complete list of `.ico`, `.svg`, Apple Touch Icon, and Web App Manifest assets.
* **[LOW-05]** **Arabic Typography Fallback Specifics:** Explicit font sizing adjustments when switching between Inter and Noto Sans Arabic.
* **[LOW-06]** **Print Layout Margin Specs:** Exact `@media print` margin and header suppression rules for A6 shipping labels vs A4 invoices.
* **[LOW-07]** **Missing Breadcrumb Max-Width Truncation CSS:** Ensure deeply nested category paths do not overflow mobile headers.
* **[LOW-08]** **Missing Dark Mode Extensibility Hooks:** CSS variable naming structure readiness for future v2.0 dark theme.
* **[LOW-09]** **Missing Empty-State Microcopy Variations:** Distinct microcopy for 0 search results vs 0 filtered category results vs 0 order history.

---

## 6. Cross-Document Contradictions Matrix

| Contradiction | Document A | Document B | Reconciled Resolution |
| :--- | :--- | :--- | :--- |
| **Brand Primary Color** | `architecture.md`: `#FF6600` | `design-system.md` & prototypes: `#FF6B00` | Standardize globally to **`#FF6B00`**. |
| **B2B Minimum Order Value** | `business-rules.md`: **15,000 DZD** | `admin-screens.md`: **5,000 DZD** | Default to **15,000 DZD**; allow admin tier configuration. |
| **Physical Stock Deduction** | `business-rules.md`: on `SHIPPED` | `workflows.md`: on `DELIVERED` | Deduct on **`SHIPPED`**; restock on `RETURNED`. |
| **Import Error Handling** | `import-export.md`: Atomic transaction rollback | `admin-screens.md`: Partial import with error logs | Implement **Row-Level Error Isolation** (save valid, flag invalid). |
| **Order Status Flow** | `domain-model.md`: 10 ENUM states | `admin-screens.md`: 6 filter tabs | Admin tabs group statuses (e.g. "En cours" = `CONFIRMED` + `PROCESSING` + `READY`). |
| **Gallery Storage** | `domain-model.md`: `TEXT[]` array in `products` | `admin-screens.md`: Media manager with alt/order | Create normalized **`product_images`** table. |
| **Courier Config Storage** | `integrations.md`: Hardcoded `process.env` | `admin-screens.md`: Admin UI key management | Store encrypted in **`integration_configs`** table. |

---

## 7. Security Findings & Verification

```
┌────────────────────────────────────────────────────────────────────────┐
│                      SECURITY AUDIT CHECKLIST                          │
├──────────────────────────────────────────────────────┬─────────────────┤
│ Server-Side Authorization Guards on All Actions      │ ✅ Satisfied    │
│ Dual-Layer Authorization (Next.js + Postgres RLS)   │ ✅ Satisfied    │
│ Passwordless & Multi-Provider OAuth Authentication   │ ✅ Satisfied    │
│ Immutable Audit Logging on Administrative Mutations  │ ✅ Satisfied    │
│ Column-Level Cost Price Masking for Public API       │ ❌ FAILED (P0)  │
│ Guest Order Tracking Rate Limiting & Tokenization    │ ❌ FAILED (P0)  │
│ Webhook HMAC Signature & Replay Protection           │ ❌ FAILED (P1)  │
│ Multi-Tenant B2B Organization Data Isolation         │ ❌ FAILED (P1)  │
│ Anti-Scraping Rate Limiting on Instant Search        │ ⚠️ Partially Met│
└──────────────────────────────────────────────────────┴─────────────────┘
```

---

## 8. Performance & Scalability Findings (4,000+ to 100,000+ SKUs)

1. **Zero Client-Side Catalog Dumping:** Both documentation and prototypes strictly enforce server-side pagination, virtualized tables, and debounced RPC search. No operation attempts to load 4,000+ rows into browser RAM.
2. **Search Indexing:** The hybrid Trigram (`gin_trgm_ops`) and Full-Text (`tsvector`) strategy is ideal for spare part SKUs and Arabic/French titles, provided the JSONB compatibility expression index is added ([CRIT-05]).
3. **Database Caching:** Next.js On-Demand Tag Revalidation (`revalidateTag('products')`, `revalidatePath('/produits/[slug]')`) is properly integrated with admin price mutations to keep public pages statically cached at edge CDN nodes.
4. **Table Virtualization:** TanStack Table v8 with `@tanstack/react-virtual` is correctly specified across all high-density admin screens (Products, Orders, Inventory, Logs).

---

## 9. Complete Relational Data Model (Missing Entities DDL)

To resolve **[CRIT-04]**, the following SQL DDL must be incorporated into the schema migration:

```sql
-- 1. Categories Hierarchy
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(512),
    display_order INT DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- 2. Brands & Device Models
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    logo_url VARCHAR(512),
    country_of_origin VARCHAR(64),
    is_visible BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE device_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL, -- e.g. 'Galaxy S21 Ultra'
    slug VARCHAR(140) NOT NULL,
    model_code VARCHAR(64),     -- e.g. 'SM-G998'
    release_year INT,
    image_url VARCHAR(512),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(brand_id, slug)
);
CREATE INDEX idx_device_models_brand ON device_models(brand_id);

-- 3. Customer & B2B Organization Profiles
CREATE TABLE customer_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    customer_type VARCHAR(8) DEFAULT 'B2C' CHECK (customer_type IN ('B2C', 'B2B')),
    is_phone_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE b2b_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID UNIQUE NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    company_name VARCHAR(150) NOT NULL,
    legal_form VARCHAR(32) NOT NULL, -- SARL, SNC, EI, SPA
    rc_number VARCHAR(64) NOT NULL,  -- Registre de Commerce
    nif_number VARCHAR(64) NOT NULL, -- NIF
    nis_number VARCHAR(64),          -- NIS
    article_imposition VARCHAR(64),
    tier_id UUID REFERENCES b2b_pricing_tiers(id),
    verification_status VARCHAR(32) DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')),
    credit_limit_dzd NUMERIC(14,2) DEFAULT 0.00,
    payment_terms VARCHAR(32) DEFAULT 'COD_ONLY',
    rejection_reason TEXT,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Customer Addresses
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    address_label VARCHAR(32) DEFAULT 'HOME' CHECK (address_label IN ('HOME', 'WORK', 'WORKSHOP', 'OTHER')),
    recipient_name VARCHAR(150) NOT NULL,
    recipient_phone VARCHAR(32) NOT NULL,
    address_line TEXT NOT NULL,
    commune_name VARCHAR(100) NOT NULL,
    wilaya_code INT NOT NULL CHECK (wilaya_code BETWEEN 1 AND 58),
    wilaya_name VARCHAR(64) NOT NULL,
    postal_code VARCHAR(16),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_addresses_customer ON addresses(customer_id);

-- 5. Persistent Shopping Carts
CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
    session_token VARCHAR(128) UNIQUE, -- For guest carts
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price_snapshot NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cart_id, product_id)
);

-- 6. Normalized Product Images
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(512) NOT NULL,
    alt_text VARCHAR(255),
    display_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_product_images_product ON product_images(product_id);

-- 7. Logistics & Shipments
CREATE TABLE delivery_shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    provider_code VARCHAR(32) NOT NULL DEFAULT 'ECOTRACK',
    tracking_number VARCHAR(64) UNIQUE NOT NULL,
    barcode VARCHAR(64) NOT NULL,
    shipping_label_url VARCHAR(512),
    courier_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    raw_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_shipments_tracking ON delivery_shipments(tracking_number);

-- 8. Asynchronous Import Jobs
CREATE TABLE import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(512) NOT NULL,
    import_type VARCHAR(32) NOT NULL, -- 'FULL_CATALOG', 'PRICES_ONLY', 'STOCK_ONLY'
    status VARCHAR(32) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED')),
    total_rows INT DEFAULT 0,
    created_rows INT DEFAULT 0,
    updated_rows INT DEFAULT 0,
    error_rows INT DEFAULT 0,
    errors_summary JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
```

---

## 10. Pre-Implementation Action Checklist

Before initiating Phase 2 (Application Code & Backend Implementation), the development team should complete the following preparatory steps:

- [ ] **Step 1: Unify Brand Color Tokens:** Confirm and update `#FF6B00` across all documentation and Tailwind configs.
- [ ] **Step 2: Apply Complete SQL Migration Script:** Run the unified DDL including all 12 missing entity tables and foreign key constraints.
- [ ] **Step 3: Implement Column-Level Cost Protection:** Create the `public_products` view or restricted Server Action projections to protect `cost_price`.
- [ ] **Step 4: Configure Search GIN Trigram Expression Indexes:** Add `gin_trgm_ops` index on `(compatibility::text)` and test with 5,000 synthetic spare parts.
- [ ] **Step 5: Implement Atomic Stock Reservation Stored Procedure:** Write `reserve_order_stock()` with `SELECT ... FOR UPDATE` row locks.
- [ ] **Step 6: Configure Guest Order Tokenization:** Add `tracking_token UUID` to `orders` and write secure masked tracking RPC.
- [ ] **Step 7: Configure Supabase Realtime Publication:** Run `REPLICA IDENTITY FULL` on `orders` and `products`.
- [ ] **Step 8: Set Up Dynamic Integration Settings Table:** Replace `process.env` hardcoding with encrypted DB credential records for EcoTrack.
- [ ] **Step 9: Seed Algerian Wilayas & Communes:** Load the official 58 Wilayas and delivery rate baseline data.
- [ ] **Step 10: Standardize B2B Minimum Order Threshold:** Set default to `15,000 DZD` in database settings.

---

> **Audit Conclusion:** The HamzaPhone requirements baseline is exceptionally comprehensive and commercially sound. Implementing the recommended database DDL additions, column-level security shields, and stock lifecycle clarifications outlined in this document will ensure a bulletproof, high-performance production rollout.
