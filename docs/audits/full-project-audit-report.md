# Complete Repository & Architecture Audit Report: HamzaPhone

**Date of Audit**: September 2026  
**Repository Path**: `d:\Websites On Line\hamzaphone`  
**Purpose**: Full literal architectural, brand, database, routing, and integration audit report for technical planning, rebranding, and white-labeling.

---

# 1. Project Structure

### Top-Level Directory Purpose Map

| Directory | Purpose |
| :--- | :--- |
| `.agents/` | Agent configurations, workflow orchestrations, and IDE rules |
| `docs/` | Architecture plans, requirements, sprint roadmaps, and audit logs |
| `prototypes/` | Design prototypes, UI mockups, and layout explorations |
| `scripts/` | Catalog generation, batch migration, and utility scripts |
| `src/` | Application source code (Next.js 16 App Router, React 19, Tailwind CSS) |
| `supabase/` | Supabase PostgreSQL migrations (00001–00011), seeds, and RLS policies |

---

### Complete File Tree

```text
hamzaphone/
├── .agents/
│   └── (Agent definitions & configurations)
├── docs/
│   ├── audits/
│   │   └── full-project-audit-report.md
│   ├── admin-dashboard.md
│   ├── admin-data-integration.md
│   ├── admin-demo-fixes.md
│   ├── admin-final-audit.md
│   ├── admin-modules-diagnosis.md
│   ├── analytics.md
│   ├── architecture-audit.md
│   ├── architecture.md
│   ├── business-rules.md
│   ├── catalog-import-report.md
│   ├── catalog-import-result.md
│   ├── catalog-initial-migration.md
│   ├── catalog-source-of-truth.md
│   ├── client-demo-deployment.md
│   ├── client-demo-readiness.md
│   ├── cms-and-settings.md
│   ├── database-implementation.md
│   ├── delivery-integration.md
│   ├── demo-mode.md
│   ├── demo-required-credentials.md
│   ├── disaster-recovery.md
│   ├── domain-model.md
│   ├── e2e-bugs.md
│   ├── e2e-test-report.md
│   ├── environment.md
│   ├── fulfillment-inventory-audit.md
│   ├── import-export.md
│   ├── integration-credentials-inventory.md
│   ├── integrations.md
│   ├── launch-checklist.md
│   ├── notifications.md
│   ├── observability.md
│   ├── payment-reconciliation.md
│   ├── post-launch.md
│   ├── product-media-sync-report.md
│   ├── product-media-sync-result.md
│   ├── product-page-diagnosis.md
│   ├── production-blockers.md
│   ├── production-readiness.md
│   ├── production-runtime-diagnosis-v2.md
│   ├── production-runtime-diagnosis.md
│   ├── production-runtime-fix.md
│   ├── recommendations.md
│   ├── roles-and-permissions.md
│   ├── search-architecture.md
│   ├── security-hardening.md
│   ├── security.md
│   ├── staff-role-management.md
│   ├── storefront-phase-1.md
│   ├── storefront-phase-2.md
│   ├── storefront-phase-3.md
│   ├── supabase-production-initialization.md
│   ├── supabase-production-preflight.md
│   ├── supplier-import-export.md
│   └── workflows.md
├── prototypes/
│   └── mockups/
├── scripts/
│   ├── generate-catalog.ts
│   └── seed-data.ts
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (storefront)/
│   │   │   ├── account/
│   │   │   │   ├── addresses/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── business/
│   │   │   │   │   ├── pricing/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── orders/
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── profile/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── settings/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   ├── brands/
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   ├── cart/
│   │   │   └── page.tsx
│   │   ├── categories/
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   ├── checkout/
│   │   │   ├── confirmation/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── products/
│   │   │   ├── [slug]/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── search/
│   │   │   └── page.tsx
│   │   ├── track-order/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── admin/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/
│   │   └── webhooks/
│   │       └── ecotrack/
│   │           └── route.ts
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts
│   ├── catalog-images/
│   │   └── [...path]/
│   │       └── route.ts
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   ├── not-found.tsx
│   ├── robots.ts
│   └── sitemap.ts
├── components/
│   ├── admin/
│   │   ├── analytics/
│   │   ├── b2b/
│   │   ├── catalog/
│   │   ├── cms/
│   │   ├── customers/
│   │   ├── delivery/
│   │   ├── import-export/
│   │   ├── inventory/
│   │   ├── notifications/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── pricing/
│   │   ├── settings/
│   │   ├── staff/
│   │   ├── admin-header.tsx
│   │   ├── admin-shell.tsx
│   │   └── admin-sidebar.tsx
│   ├── storefront/
│   │   ├── account/
│   │   ├── catalog/
│   │   ├── checkout/
│   │   ├── home/
│   │   ├── layout/
│   │   ├── product-detail/
│   │   └── search/
│   └── ui/
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── table.tsx
│       └── tabs.tsx
├── lib/
│   ├── actions/
│   │   ├── activity-log.actions.ts
│   │   ├── analytics.actions.ts
│   │   ├── auth.actions.ts
│   │   ├── category-brand.actions.ts
│   │   ├── checkout.actions.ts
│   │   ├── customer-account.actions.ts
│   │   ├── customer-b2b.actions.ts
│   │   ├── import-export.actions.ts
│   │   ├── index.ts
│   │   ├── integration.actions.ts
│   │   ├── inventory.actions.ts
│   │   ├── notification.actions.ts
│   │   ├── order.actions.ts
│   │   ├── overview.actions.ts
│   │   ├── payment.actions.ts
│   │   ├── pricing.actions.ts
│   │   ├── product.actions.ts
│   │   ├── recommendations.actions.ts
│   │   ├── settings-cms.actions.ts
│   │   ├── staff-role.actions.ts
│   │   ├── storefront.actions.ts
│   │   └── supplier.actions.ts
│   ├── analytics/
│   │   ├── analytics-timezone.ts
│   │   ├── analytics.service.ts
│   │   └── analytics.test.ts
│   ├── audit/
│   │   └── audit-logger.ts
│   ├── auth/
│   │   ├── auth-service.ts
│   │   ├── client.ts
│   │   ├── production-runtime-remediation.test.ts
│   │   └── server.ts
│   ├── config/
│   │   ├── environment.test.ts
│   │   ├── environment.ts
│   │   ├── integration-config.service.ts
│   │   └── integration-config.test.ts
│   ├── data/
│   │   └── catalog-provider.ts
│   ├── delivery/
│   │   ├── delivery-pricing.service.ts
│   │   ├── delivery.test.ts
│   │   ├── ecotrack-provider.ts
│   │   ├── registry.ts
│   │   └── types.ts
│   ├── hooks/
│   │   ├── use-admin-queries.ts
│   │   ├── use-analytics.ts
│   │   ├── use-checkout.ts
│   │   ├── use-customer-account.ts
│   │   ├── use-recommendations.ts
│   │   └── use-storefront-queries.ts
│   ├── import-export/
│   │   ├── column-mapper.service.ts
│   │   ├── export.service.ts
│   │   ├── file-parser.service.ts
│   │   ├── import-export.test.ts
│   │   ├── import-job.service.ts
│   │   ├── types.ts
│   │   └── validation-engine.service.ts
│   ├── notifications/
│   │   ├── channels/
│   │   ├── notification.service.ts
│   │   └── notifications.test.ts
│   ├── payments/
│   │   ├── payment-reconciliation.test.ts
│   │   └── payment.service.ts
│   ├── permissions/
│   │   ├── guards.ts
│   │   ├── index.ts
│   │   ├── permission-registry.ts
│   │   ├── permissions-service.ts
│   │   ├── permissions.test.ts
│   │   ├── security-hardening.test.ts
│   │   └── staff-roles.test.ts
│   ├── recommendations/
│   │   ├── recommendation.service.ts
│   │   └── recommendations.test.ts
│   ├── repositories/
│   │   ├── index.ts
│   │   ├── order.repository.ts
│   │   └── product.repository.ts
│   ├── services/
│   │   ├── b2b.service.ts
│   │   ├── checkout.service.ts
│   │   ├── checkout.test.ts
│   │   ├── connection-test.service.ts
│   │   ├── connection-test.test.ts
│   │   ├── customer-account.service.ts
│   │   ├── customer-account.test.ts
│   │   ├── delivery.service.ts
│   │   ├── demo-inventory.service.ts
│   │   ├── demo-inventory.test.ts
│   │   ├── index.ts
│   │   ├── inventory.service.ts
│   │   ├── order.service.ts
│   │   ├── pdp-resilience.test.ts
│   │   ├── pricing.service.ts
│   │   ├── search.service.ts
│   │   ├── services.test.ts
│   │   ├── storefront.service.ts
│   │   └── storefront.test.ts
│   ├── settings/
│   │   ├── settings-cms.service.ts
│   │   └── settings-cms.test.ts
│   ├── validation/
│   │   ├── account.schema.ts
│   │   ├── auth.schema.ts
│   │   ├── b2b.schema.ts
│   │   ├── delivery.schema.ts
│   │   ├── import-export.schema.ts
│   │   ├── index.ts
│   │   ├── inventory.schema.ts
│   │   ├── order.schema.ts
│   │   ├── pricing.schema.ts
│   │   ├── product.schema.ts
│   │   └── validation.test.ts
│   ├── admin-store.ts
│   ├── mock-data.ts
│   └── utils.ts
├── types/
│   ├── analytics.types.ts
│   ├── database.types.ts
│   ├── domain.types.ts
│   ├── integrations.types.ts
│   ├── notifications.types.ts
│   ├── payment-reconciliation.types.ts
│   ├── rbac.types.ts
│   ├── recommendations.types.ts
│   ├── settings-cms.types.ts
│   └── staff-rbac.types.ts
├── proxy.ts
├── supabase/
│   ├── migrations/
│   │   ├── 00001_extensions_and_enums.sql
│   │   ├── 00002_auth_rbac_and_users.sql
│   │   ├── 00003_catalog_and_products.sql
│   │   ├── 00004_inventory_and_orders.sql
│   │   ├── 00005_functions_triggers_and_indexes.sql
│   │   ├── 00006_row_level_security.sql
│   │   ├── 00007_storage_and_seed.sql
│   │   ├── 00008_additional_entities_and_optimizations.sql
│   │   ├── 00009_algeria_58_wilayas_seed.sql
│   │   ├── 00010_webhook_events.sql
│   │   └── 00011_initial_catalog_seed.sql
│   └── config.toml
├── .env.production
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
├── HamzaPhone_to_DRIPIDIN_Project_Evolution.md
├── next-env.d.ts
├── package.json
├── postcss.config.mjs
├── README.md
├── tsconfig.json
└── walkthrough.md
```

---

# 2. Hard-Coded "HamzaPhone" & Brand-Specific References

### Brand String Occurrences (`HamzaPhone`, `hamzaphone`, `hamza-phone`)

| File Path | Line | Actual Line / Snippet | Purpose / Usage Context |
| :--- | :--- | :--- | :--- |
| `package.json` | 2 | `"name": "hamzaphone"` | NPM package identifier |
| `src/app/layout.tsx` | 11, 15 | `title: "HamzaPhone - Pièces de Rechange Smartphones en Algérie"` | Root metadata & browser tab title |
| `src/app/robots.ts` | 7 | `sitemap: "https://hamzaphone.dz/sitemap.xml"` | Production sitemap URL |
| `src/app/sitemap.ts` | 6 | `const baseUrl = process.env.NEXT_PUBLIC_SITE_URL \|\| "https://hamzaphone.dz";` | Production canonical base URL fallback |
| `src/lib/settings/settings-cms.service.ts` | 18 | `store_name: "HamzaPhone"` | Dynamic CMS default store name fallback |
| `src/lib/settings/settings-cms.service.ts` | 22 | `support_email: "contact@hamzaphone.dz"` | Dynamic CMS default support email |
| `src/lib/settings/settings-cms.service.ts` | 23 | `legal_business_name: "SARL HamzaPhone Distribution"` | Legal business invoice/header default |
| `src/lib/settings/settings-cms.service.ts` | 26 | `logo_url: "/logo.png"` | Default logo path |
| `src/lib/config/environment.ts` | 8 | `isDemoMode: process.env.HAMZAPHONE_DEMO_MODE === "true"` | Demo sandbox toggle environment variable |
| `src/lib/config/integration-config.service.ts` | 19 | `senderId: "HamzaPhone"` | SMS Gateway sender ID default |
| `src/lib/notifications/notification.service.ts` | 185 | `body: \`HamzaPhone: Votre commande #${orderNumber} a été validée...\`` | SMS transactional customer template |
| `src/components/storefront/layout/storefront-header.tsx` | 45 | `<span className="...">HamzaPhone</span>` | Header text logo branding |
| `src/components/storefront/layout/storefront-footer.tsx` | 32 | `© 2026 HamzaPhone. Tous droits réservés.` | Footer copyright text |
| `src/components/admin/admin-header.tsx` | 28 | `<span>HamzaPhone Admin Console</span>` | Admin portal brand title |
| `supabase/migrations/00007_storage_and_seed.sql` | 42 | `'SARL HamzaPhone Import-Export'`, `'HamzaPhone'` | Database seed default business profile |
| `supabase/migrations/00011_initial_catalog_seed.sql` | 15+ | `HP-SAM-SCR-001`, `HP-IPH-BAT-002`, `HP-XIA-CHG-003` | Product SKU prefix schema (`HP-*` = HamzaPhone) |

---

### Hard-Coded Contact, Location, Social & Asset Details

| Attribute Type | Exact Hardcoded Value | File Path & Line | Purpose |
| :--- | :--- | :--- | :--- |
| **Phone Number** | `+213 550 12 34 56` | `src/lib/settings/settings-cms.service.ts:20` | Default support phone |
| **Phone Number** | `+213 550 98 76 54` | `src/lib/settings/settings-cms.service.ts:21` | Default WhatsApp support phone |
| **Email Address** | `contact@hamzaphone.dz` | `src/lib/settings/settings-cms.service.ts:22` | Primary support email |
| **Email Address** | `admin@hamzaphone.dz` | `supabase/migrations/00007_storage_and_seed.sql:12` | Initial superadmin user seed |
| **Physical Address**| `12 Rue Didouche Mourad, Alger Centre` | `src/lib/settings/settings-cms.service.ts:24` | Store default street address |
| **Wilaya / City** | `16 - Alger`, `Alger Centre` | `src/lib/settings/settings-cms.service.ts:25` | Default store location coordinates |
| **Social Handle** | `https://instagram.com/hamzaphone.dz` | `src/lib/settings/settings-cms.service.ts:28` | Instagram social link fallback |
| **Social Handle** | `https://facebook.com/hamzaphone` | `src/lib/settings/settings-cms.service.ts:29` | Facebook page link fallback |
| **Social Handle** | `https://tiktok.com/@hamzaphone` | `src/lib/settings/settings-cms.service.ts:30` | TikTok account link fallback |
| **Brand Color 1** | `#2563eb` (Royal Blue) | `src/lib/settings/settings-cms.service.ts:32` | CMS primary brand color |
| **Brand Color 2** | `#f59e0b` (Amber/Orange) | `src/lib/settings/settings-cms.service.ts:33` | CMS secondary accent color |
| **Brand Color 3** | `#0f172a` (Slate 900) | `src/app/globals.css:14` | Dark background / primary typography token |
| **Logo File Path**| `/logo.png` | `src/lib/settings/settings-cms.service.ts:26` | Default main logo asset path |
| **Favicon Path**  | `/favicon.ico` | `src/app/layout.tsx:28` | App icon asset |

---

# 3. Environment Variables

| Variable Name | Referenced In | Classification | Fallback / Default in Code |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `src/lib/auth/client.ts:5`, `src/lib/auth/server.ts:10`, `.env.production:1` | Public Infrastructure URL | Throws if missing in production; fallback in test runner |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `src/lib/auth/client.ts:6`, `src/lib/auth/server.ts:11`, `.env.production:2` | Public JWT Anon Key | Throws if missing in production; fallback in test runner |
| `SUPABASE_SERVICE_ROLE_KEY` | `src/lib/auth/server.ts:32`, `src/lib/permissions/guards.ts:14` | **Secret (Admin Key)** | `undefined` (triggers restricted client fallback if not set) |
| `NEXT_PUBLIC_SITE_URL` | `src/app/sitemap.ts:6`, `src/app/robots.ts:6` | Business Configuration | `"https://hamzaphone.dz"` |
| `ECOTRACK_API_URL` | `src/lib/delivery/ecotrack-provider.ts:14` | Integration Endpoint | `"https://api.ecotrack.dz/v1"` |
| `ECOTRACK_API_TOKEN` | `src/lib/delivery/ecotrack-provider.ts:15` | **Secret (API Token)** | `""` (defaults to Demo Sandbox mode if empty) |
| `ECOTRACK_WEBHOOK_SECRET` | `src/app/api/webhooks/ecotrack/route.ts:12` | **Secret (HMAC Key)** | `""` |
| `HAMZAPHONE_DEMO_MODE` | `src/lib/config/environment.ts:8` | Feature Flag | `"false"` |
| `NODE_ENV` | Next.js runtime, build scripts, tests | Runtime Environment | `"development"` |

---

# 4. Database Schema (Supabase PostgreSQL)

### Active Supabase Project
- **Project Reference**: `gcqseaefboaijktusjmg`
- **Configured Endpoint**: `https://gcqseaefboaijktusjmg.supabase.co`

---

### Database Tables (37 Total)

| Table Name | Migration Source | Primary Key | Key Columns & Types |
| :--- | :--- | :--- | :--- |
| `profiles` | `00002` | `id (UUID)` | `email (VARCHAR)`, `full_name (VARCHAR)`, `phone (VARCHAR)`, `role (VARCHAR)`, `is_active (BOOLEAN)`, `created_at (TIMESTAMPTZ)` |
| `roles` | `00002` | `id (UUID)` | `name (VARCHAR)`, `code (VARCHAR)`, `description (TEXT)`, `is_system (BOOLEAN)` |
| `permissions` | `00002` | `id (UUID)` | `name (VARCHAR)`, `code (VARCHAR)`, `module (VARCHAR)`, `description (TEXT)` |
| `role_permissions` | `00002` | `(role_id, permission_id)` | `role_id (UUID)`, `permission_id (UUID)` |
| `user_roles` | `00002` | `(user_id, role_id)` | `user_id (UUID)`, `role_id (UUID)` |
| `businesses` | `00002` | `id (UUID)` | `name (VARCHAR)`, `trade_register_number (VARCHAR)`, `nif (VARCHAR)`, `nis (VARCHAR)`, `pricing_tier_id (UUID)`, `approval_status (b2b_status)`, `credit_limit_dzd (NUMERIC)` |
| `business_members` | `00002` | `id (UUID)` | `business_id (UUID)`, `user_id (UUID)`, `role (VARCHAR)` |
| `addresses` | `00002` | `id (UUID)` | `user_id (UUID)`, `business_id (UUID)`, `recipient_name (VARCHAR)`, `phone (VARCHAR)`, `wilaya_id (INT)`, `wilaya_name (VARCHAR)`, `commune_name (VARCHAR)`, `street_address (TEXT)` |
| `brands` | `00003` | `id (UUID)` | `name (VARCHAR)`, `slug (VARCHAR)`, `logo_url (TEXT)`, `is_active (BOOLEAN)`, `sort_order (INT)` |
| `categories` | `00003` | `id (UUID)` | `name (VARCHAR)`, `slug (VARCHAR)`, `parent_id (UUID)`, `icon (VARCHAR)`, `is_active (BOOLEAN)` |
| `device_models` | `00003` | `id (UUID)` | `brand_id (UUID)`, `name (VARCHAR)`, `model_code (VARCHAR)`, `release_year (INT)` |
| `suppliers` | `00003` | `id (UUID)` | `name (VARCHAR)`, `code (VARCHAR)`, `contact_phone (VARCHAR)`, `contact_email (VARCHAR)` |
| `products` | `00003` | `id (UUID)` | `sku (VARCHAR)`, `barcode (VARCHAR)`, `name (VARCHAR)`, `slug (VARCHAR)`, `brand_id (UUID)`, `category_id (UUID)`, `b2c_price_dzd (NUMERIC)`, `b2c_sale_price_dzd (NUMERIC)`, `cost_price_dzd (NUMERIC)`, `available_stock (INT)`, `reserved_stock (INT)`, `product_type (product_type)`, `screen_technology (VARCHAR)`, `battery_capacity_mah (INT)`, `status (product_status)`, `search_vector (tsvector)` |
| `product_images` | `00003` | `id (UUID)` | `product_id (UUID)`, `image_url (TEXT)`, `sort_order (INT)`, `is_primary (BOOLEAN)` |
| `product_compatibility` | `00003` | `id (UUID)` | `product_id (UUID)`, `device_model_id (UUID)`, `notes (TEXT)` |
| `supplier_products` | `00003` | `id (UUID)` | `supplier_id (UUID)`, `product_id (UUID)`, `supplier_sku (VARCHAR)`, `purchase_price_dzd (NUMERIC)` |
| `b2b_pricing_tiers` | `00003` | `id (UUID)` | `name (VARCHAR)`, `code (VARCHAR)`, `discount_percentage (NUMERIC)` |
| `b2b_tier_prices` | `00003` | `id (UUID)` | `tier_id (UUID)`, `product_id (UUID)`, `price_dzd (NUMERIC)` |
| `customer_specific_prices` | `00003` | `id (UUID)` | `business_id (UUID)`, `product_id (UUID)`, `custom_price_dzd (NUMERIC)` |
| `price_history` | `00003` | `id (UUID)` | `product_id (UUID)`, `old_b2c_price (NUMERIC)`, `new_b2c_price (NUMERIC)`, `changed_by (UUID)` |
| `inventory_transactions` | `00004` | `id (UUID)` | `product_id (UUID)`, `transaction_type (inventory_trx_type)`, `quantity_change (INT)`, `reference_id (VARCHAR)`, `created_by (UUID)` |
| `carts` | `00004` | `id (UUID)` | `user_id (UUID)`, `session_id (VARCHAR)`, `updated_at (TIMESTAMPTZ)` |
| `cart_items` | `00004` | `id (UUID)` | `cart_id (UUID)`, `product_id (UUID)`, `quantity (INT)` |
| `orders` | `00004` | `id (UUID)` | `order_number (VARCHAR)`, `user_id (UUID)`, `business_id (UUID)`, `status (order_status)`, `payment_status (payment_status)`, `delivery_status (delivery_status)`, `total_dzd (NUMERIC)`, `tracking_token (UUID)`, `recipient_phone (VARCHAR)` |
| `order_items` | `00004` | `id (UUID)` | `order_id (UUID)`, `product_id (UUID)`, `quantity (INT)`, `unit_price_dzd (NUMERIC)`, `cost_price_dzd (NUMERIC)` |
| `order_status_history` | `00004` | `id (UUID)` | `order_id (UUID)`, `previous_status (VARCHAR)`, `new_status (VARCHAR)`, `changed_by (UUID)` |
| `courier_providers` | `00004` | `id (UUID)` | `name (VARCHAR)`, `code (VARCHAR)`, `is_active (BOOLEAN)`, `tracking_url_template (TEXT)` |
| `deliveries` | `00004` | `id (UUID)` | `order_id (UUID)`, `courier_id (UUID)`, `tracking_number (VARCHAR)`, `shipping_cost_dzd (NUMERIC)`, `status (delivery_status)` |
| `payments` | `00004` | `id (UUID)` | `order_id (UUID)`, `payment_method (payment_method)`, `amount_dzd (NUMERIC)`, `status (payment_status)`, `transaction_ref (VARCHAR)` |
| `notifications` | `00004` | `id (UUID)` | `user_id (UUID)`, `type (VARCHAR)`, `title (VARCHAR)`, `message (TEXT)`, `is_read (BOOLEAN)` |
| `audit_logs` | `00004` | `id (UUID)` | `user_id (UUID)`, `action (VARCHAR)`, `entity_type (VARCHAR)`, `entity_id (VARCHAR)`, `payload (JSONB)` |
| `import_jobs` | `00008` | `id (UUID)` | `supplier_id (UUID)`, `status (import_status)`, `total_rows (INT)`, `processed_rows (INT)`, `error_summary (JSONB)` |
| `stock_alerts` | `00008` | `id (UUID)` | `product_id (UUID)`, `threshold (INT)`, `is_resolved (BOOLEAN)` |
| `product_reviews` | `00008` | `id (UUID)` | `product_id (UUID)`, `user_id (UUID)`, `rating (INT)`, `comment (TEXT)`, `is_approved (BOOLEAN)` |
| `wilayas` | `00008` | `id (INT 1..58)` | `code (VARCHAR)`, `name_fr (VARCHAR)`, `name_ar (VARCHAR)`, `is_deliverable (BOOLEAN)` |
| `delivery_rate_matrix` | `00008` | `id (UUID)` | `courier_code (VARCHAR)`, `wilaya_id (INT)`, `home_delivery_dzd (NUMERIC)`, `stopdesk_dzd (NUMERIC)` |
| `webhook_events` | `00010` | `id (UUID)` | `provider (VARCHAR)`, `event_type (VARCHAR)`, `payload (JSONB)`, `status (VARCHAR)`, `retry_count (INT)` |

---

### Row Level Security (RLS) Policies Table-by-Table

| Table | Policy Name | Command | Access Rule / Security Constraint |
| :--- | :--- | :--- | :--- |
| `products` | `Public can read active products` | `SELECT` | `status = 'ACTIVE' AND is_visible = true` (cost price shielded) |
| `products` | `Staff can manage catalog` | `ALL` | `public.has_permission('catalog.manage')` |
| `orders` | `Customers read own orders` | `SELECT` | `auth.uid() = user_id` |
| `orders` | `Guests query tracked order` | `SELECT` | Via `public.get_guest_order_tracking()` RPC security-definer |
| `orders` | `Staff manage all orders` | `ALL` | `public.has_permission('orders.manage')` |
| `order_items` | `Customers read own order items`| `SELECT` | `EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())` |
| `businesses` | `B2B members read business` | `SELECT` | `EXISTS (SELECT 1 FROM business_members bm WHERE bm.business_id = businesses.id AND bm.user_id = auth.uid())` |
| `businesses` | `Staff manage B2B accounts` | `ALL` | `public.has_permission('b2b.manage')` |
| `inventory_transactions` | `Staff only inventory access` | `ALL` | `public.has_permission('inventory.manage')` |
| `notifications` | `Users read own notifications`| `SELECT` | `auth.uid() = user_id` |
| `audit_logs` | `Admins only audit log access` | `SELECT` | `public.has_permission('audit.read')` |

---

### Database Functions & Triggers

1. **`public.handle_new_user()`** (`00002_auth_rbac_and_users.sql`)
   - **Trigger**: `AFTER INSERT ON auth.users`
   - **Action**: Automatically creates a record in `public.profiles` with `role = 'CUSTOMER'` and synchronizes metadata.
2. **`public.handle_updated_at()`** (`00005_functions_triggers_and_indexes.sql`)
   - **Trigger**: `BEFORE UPDATE ON public.*`
   - **Action**: Automatically updates the `updated_at = NOW()` timestamp.
3. **`public.process_inventory_transaction()`** (`00005_functions_triggers_and_indexes.sql`)
   - **Trigger**: `AFTER INSERT ON public.inventory_transactions`
   - **Action**: Atomically updates `available_stock` and `reserved_stock` in `public.products` following double-entry inventory ledger accounting.
4. **`public.search_products_instant(...)`** (`00005_functions_triggers_and_indexes.sql`)
   - **Type**: Fast full-text trigram & tsvector search function with Arabic & French unaccenting and SKU boosting.
5. **`public.get_guest_order_tracking(...)`** (`00008_additional_entities_and_optimizations.sql`)
   - **Type**: `SECURITY DEFINER` function for dual-verification guest order lookups without exposing sensitive customer PII.
6. **`public.reserve_order_stock(p_order_id UUID)`** (`00008_additional_entities_and_optimizations.sql`)
   - **Type**: Atomic row-level lock (`SELECT ... FOR UPDATE`) checkout stock reservation preventing overselling under high concurrency.

---

# 5. Routes & Pages (Next.js App Router)

| Route Path | File Path | Route Type | Access Control |
| :--- | :--- | :--- | :--- |
| `/` | `src/app/(storefront)/page.tsx` | Public Storefront | Public |
| `/products` | `src/app/(storefront)/products/page.tsx` | Public Storefront | Public |
| `/products/[slug]` | `src/app/(storefront)/products/[slug]/page.tsx` | Public Storefront | Public |
| `/categories/[slug]` | `src/app/(storefront)/categories/[slug]/page.tsx` | Public Storefront | Public |
| `/brands/[slug]` | `src/app/(storefront)/brands/[slug]/page.tsx` | Public Storefront | Public |
| `/search` | `src/app/(storefront)/search/page.tsx` | Public Storefront | Public |
| `/cart` | `src/app/(storefront)/cart/page.tsx` | Public Storefront | Public |
| `/checkout` | `src/app/(storefront)/checkout/page.tsx` | Public Storefront | Public / Guest / B2B |
| `/checkout/confirmation` | `src/app/(storefront)/checkout/confirmation/page.tsx` | Public Storefront | Public |
| `/track-order` | `src/app/(storefront)/track-order/page.tsx` | Public Storefront | Public |
| `/login` | `src/app/(auth)/login/page.tsx` | Authentication | Public (Redirects if auth) |
| `/register` | `src/app/(auth)/register/page.tsx` | Authentication | Public (B2C & B2B application) |
| `/forgot-password` | `src/app/(auth)/forgot-password/page.tsx` | Authentication | Public |
| `/account` | `src/app/(storefront)/account/page.tsx` | Customer Account | Authenticated User |
| `/account/profile` | `src/app/(storefront)/account/profile/page.tsx` | Customer Account | Authenticated User |
| `/account/addresses` | `src/app/(storefront)/account/addresses/page.tsx` | Customer Account | Authenticated User |
| `/account/orders` | `src/app/(storefront)/account/orders/page.tsx` | Customer Account | Authenticated User |
| `/account/orders/[id]` | `src/app/(storefront)/account/orders/[id]/page.tsx` | Customer Account | Authenticated Order Owner |
| `/account/business` | `src/app/(storefront)/account/business/page.tsx` | B2B Portal | Approved Business Member |
| `/account/business/pricing` | `src/app/(storefront)/account/business/pricing/page.tsx` | B2B Portal | Approved Business Member |
| `/account/settings` | `src/app/(storefront)/account/settings/page.tsx` | Customer Account | Authenticated User |
| `/admin` | `src/app/admin/page.tsx` | Admin / Dashboard | Staff RBAC Protected |
| `/api/webhooks/ecotrack` | `src/app/api/webhooks/ecotrack/route.ts` | API Endpoint | HMAC Webhook Signature |
| `/auth/callback` | `src/app/auth/callback/route.ts` | API Endpoint | OAuth / Supabase Auth Exchange |
| `/catalog-images/[...path]`| `src/app/catalog-images/[...path]/route.ts` | API Endpoint | Public Asset Proxy |

---

# 6. Package & Dependencies

### Package Manifest (`package.json`)

```json
{
  "name": "hamzaphone",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "test": "node --test dist-test/**/*.test.js",
    "test:ts": "node --import tsx --test src/**/*.test.ts"
  },
  "dependencies": {
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.49.1",
    "@tanstack/react-query": "^5.102.2",
    "@tanstack/react-table": "^9.1.2",
    "clsx": "^2.1.1",
    "lucide-react": "^1.33.0",
    "next": "^16.3.2",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "tailwind-merge": "^3.6.0",
    "xlsx": "^0.18.5",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.3.3",
    "@types/node": "^22.13.10",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.5",
    "postcss": "^8.5.26",
    "tailwindcss": "^4.3.3",
    "tsx": "^4.19.3",
    "typescript": "^5.8.2"
  }
}
```

- **Framework**: Next.js `16.3.2` (Turbopack bundler)
- **UI Engine**: React `19.2.8` & React-DOM `19.2.8`
- **Language**: TypeScript `5.8.2`
- **Styling**: Tailwind CSS `4.3.3` with PostCSS `8.5.26`

---

# 7. Current Test & Build Status

### 1. Test Suite (`npm run test:ts`)
- **Total Tests**: `235`
- **Suites**: `99`
- **Passed**: `235`
- **Failed**: `0`
- **Execution Time**: `34.5s`
- **Status**: **100% PASSING**

### 2. TypeScript Typecheck (`npm run typecheck` / `tsc --noEmit`)
- **Errors**: `0`
- **Status**: **CLEAN (0 Type Errors)**

### 3. Production Build (`npm run build`)
- **Engine**: Next.js 16.3.2 with Turbopack
- **Generated Routes**: 24 static and dynamic routes compiled
- **Status**: **SUCCESSFUL BUILD (0 Fatal Errors)**

---

# 8. Business Logic / Business-Type Coupling

### 1. Smartphone Spare Parts Vertical Assumptions
The current database schemas and UI components have vertical-specific fields hardcoded:
- **Product Technical Attributes**: `screen_technology` (e.g. OLED, Incell, Original Service Pack), `battery_capacity_mah`, `cable_length_cm`, `is_original` are modeled as first-class columns on `products` (`supabase/migrations/00003_catalog_and_products.sql:70-85`).
- **Compatibility Matrix**: Device model relationships (`brands` -> `device_models` -> `product_compatibility`) assume smartphone/tablet hardware models (Samsung Galaxy, iPhone, Xiaomi Redmi).
- **Part Types**: `product_type` enum is defined as `('SCREEN', 'BATTERY', 'CHARGING_PORT', 'BACK_COVER', 'CAMERA_GLASS', 'SIM_TRAY', 'FLEX_CABLE', 'SPEAKER', 'TOOL', 'ACCESSORY', 'OTHER')`.

### 2. Store Identity & Single-Tenant Default Assumptions
- **CMS Defaults**: `src/lib/settings/settings-cms.service.ts:17-35` provides fallback values for `"HamzaPhone"` if the database `settings` row is empty.
- **58 Algerian Wilayas Assumption**: Delivery logic, address validation schemas (`src/lib/validation/delivery.schema.ts`), and rate matrices assume Algerian geographic structure (Wilayas 1 through 58).
- **Currency**: All pricing models, order ledgers, and payment schemas hardcode currency denomination as `DZD` (`b2c_price_dzd`, `total_dzd`, `cost_price_dzd`).

---

# 9. Integration Points

| Integration Domain | Provider / Service | Implementation File | Status | Runtime Mode |
| :--- | :--- | :--- | :--- | :--- |
| **Delivery & Tracking** | **EcoTrack Algeria** | `src/lib/delivery/ecotrack-provider.ts` | **Fully Implemented** | Live when `ECOTRACK_API_TOKEN` is set; falls back to sandbox simulation |
| **Delivery Webhooks** | **EcoTrack Inbound Hook** | `src/app/api/webhooks/ecotrack/route.ts` | **Fully Implemented** | Handles automated status transitions (`LIVRE`, `RETOUR`, `EN_COURS`) with HMAC validation |
| **SMS Notifications** | **Algeria SMS Gateway** | `src/lib/notifications/channels/sms.channel.ts` | **Implemented (Demo/Live Driver)** | Simulates dispatch in demo mode; ready for API endpoint insertion |
| **WhatsApp Business** | **WhatsApp Cloud API** | `src/lib/notifications/channels/whatsapp.channel.ts` | **Implemented (Demo/Live Driver)** | Automated order confirmation & tracking dispatch |
| **Authentication & RBAC**| **Supabase Auth & SSR** | `src/lib/auth/server.ts`, `src/lib/auth/client.ts` | **Fully Active (Production)** | Cookie-based session validation, PKCE flow, and custom RBAC permission checks |
| **Payments** | **Cash on Delivery (COD) & Bank Transfer Reconciliation** | `src/lib/payments/payment.service.ts` | **Fully Implemented** | Algérie Poste / BaridiMob manual slip upload & reconciliation ledger |
| **Bulk Import / Export**| **XLSX & CSV Engine** | `src/lib/import-export/import-job.service.ts` | **Fully Implemented** | Parses 4,000+ line supplier catalogs with role-based cost protection |

---

# 10. Known Issues & Code Tasks

### Explicit Code Annotations (`TODO`, `FIXME`, `HACK`)
- **Total `TODO` comments in source code**: **`0`**
- **Total `FIXME` comments in source code**: **`0`**
- **Total `HACK` comments in source code**: **`0`**

### Architectural Notes & White-Labeling Recommendations
1. **Dynamic Store Configuration**: All store identity defaults are encapsulated in `src/lib/settings/settings-cms.service.ts`. When rebranding or migrating to multi-tenant, provide a seed entry in `supabase/migrations/00007_storage_and_seed.sql` to overwrite CMS defaults from the database.
2. **Dynamic Product Attributes**: To generalize beyond smartphone spare parts (e.g. for general electronics or apparel), the `products` table's specific columns (`screen_technology`, `battery_capacity_mah`) can be moved into a JSONB `attributes` column.
3. **SKU Generator Prefix**: The product SKU sequence generator in `scripts/generate-catalog.ts` and `src/lib/import-export/` currently uses `HP-*` as the default prefix. Replace this with a configurable store code.
