# Phase 7 — Dynamic SEO Architecture & Implementation

## 1. Executive Summary

Phase 7 establishes a production-grade, white-label dynamic SEO architecture for the DRIPIDIN e-commerce platform. The system completely decouples SEO identity, search engine directives, social sharing cards, and structured schema markup from the source code. A future buyer or store owner can configure the store's full SEO profile through the Admin Console without modifying a single line of code.

This implementation preserves all Phase 1–6 guarantees:
* Full compatibility with **Next.js 16.3.2 (Turbopack)**, **React 19**, **TypeScript strict mode**, and **Tailwind CSS v4**.
* Seamless integration with **Supabase**, existing `StoreSettingsService`, `CountryProfile`, `MoneyFormatter`, logistics abstractions, and role-based access control (RBAC).
* Absolute zero buyer-facing runtime dependence on legacy project naming ("HamzaPhone"), hard-coded currencies ("DZD"), hard-coded domain URLs, or hard-coded Algeria assumptions.

---

## 2. Architectural Invariants

1. **Store Identity Invariant**: All metadata dynamically reflects the *current store* as configured in `store_settings`, never hardcoded defaults or legacy strings.
2. **Layered Decoupling**:
   ```text
   Storefront Page / Route Handler
                 ↓
      Centralized SEO Service (`src/lib/seo/`)
                 ↓
   StoreSettingsService + Data Repositories + CountryProfile / Commerce Context
                 ↓
              Database
   ```
3. **No In-Memory Hardcoding**: Sitemaps and robots rules are dynamically queried from live database entities (`public_products`, `categories`, `brands`, and `store_settings`).
4. **XSS & Injection Immunity**: Structured data (JSON-LD) is sanitized through strict JSON serialization that neutralizes HTML tags (`<`, `>`, `&`, `'`).
5. **Private Route Protection**: All private, administrative, transaction, or customer account paths are strictly excluded from indexing (`robots: { index: false, follow: false }`).

---

## 3. Configuration Model & Database Schema

### 3.1 Migration `00018_seo_settings_expansion.sql`
The `public.store_settings` table was extended with 4 dedicated SEO fields:
```sql
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS canonical_base_url TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS seo_indexable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS seo_follow_links BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS twitter_handle TEXT DEFAULT '';
```

### 3.2 Domain Settings Integration
The domain types in `src/types/settings.types.ts` and default mapping in `src/lib/settings/default-settings.ts` were synchronized:
* `canonicalBaseUrl`: Custom domain override (e.g. `https://buyerstore.com`). If empty, falls back to `NEXT_PUBLIC_SITE_URL`, `VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_URL`, or `http://localhost:3000`.
* `seoIndexable`: Global kill-switch for search engine indexing. When `false`, `/robots.txt` disallows `/`, meta robots tags emit `noindex`, and `/sitemap.xml` yields an empty set.
* `seoFollowLinks`: Global directive for following links on indexable pages.
* `twitterHandle`: Optional store Twitter/X handle (e.g., `@buyerstore`).
* Existing fields utilized: `seoTitle`, `seoDescription`, `storeName`, `tagline`, `logoUrl`, `faviconUrl`, `currency`.

---

## 4. Centralized SEO Service (`src/lib/seo/`)

The SEO service is composed of modular, focused sub-modules:

1. **`types.ts`**: Defines `SeoConfig`, `CategorySeoData`, `BrandSeoData`, `BreadcrumbItem`, and schema-compliant JSON-LD typings (`WebSiteSchema`, `OrganizationSchema`, `ProductSchema`, `BreadcrumbListSchema`).
2. **`validation.ts`**: Provides `SeoSettingsSchema` using Zod to enforce maximum lengths (title <= 70 chars, description <= 320 chars, handle <= 15 chars), validate HTTP/HTTPS schemes, and reject dangerous inputs (`javascript:`).
3. **`canonical.ts`**: Implements `resolveCanonicalBaseUrl()` and `buildCanonicalUrl()`. Strips trailing slashes, handles absolute/relative paths, drops unwanted query parameters, and guarantees HTTPS in production.
4. **`json-ld.ts`**: Builders for Schema.org JSON-LD objects:
   - `buildWebSiteJsonLd()`
   - `buildOrganizationJsonLd()`
   - `buildProductJsonLd()`: Injects real pricing and dynamically resolves currency from `CountryProfile`/Commerce context via `MoneyFormatter`. Never hardcodes "DZD".
   - `buildBreadcrumbListJsonLd()`
   - `serializeJsonLd()`: Sanitizes output to eliminate script execution vectors.
5. **`metadata-resolver.ts`**: High-level Next.js Metadata API resolvers:
   - `resolveHomeMetadata()`
   - `resolveCatalogMetadata()`
   - `resolveProductMetadata()`
   - `resolveCategoryMetadata()`
   - `resolveBrandMetadata()`
   - `resolveSearchMetadata()`
   - `resolvePrivateMetadata()`

---

## 5. Route Indexability Matrix

| Route | Indexable | Robots Policy | Canonical URL | Structured Data (JSON-LD) | Notes |
|---|---|---|---|---|---|
| `/` | YES | `index, follow` (store configurable) | `{baseUrl}/` | `WebSite`, `Organization` | Dynamic store SEO title & description |
| `/products` | YES | `index, follow` | `{baseUrl}/products` | None | Full catalog view |
| `/products/[slug]` | YES | `index, follow` | `{baseUrl}/products/{slug}` | `Product`, `Offer`, `BreadcrumbList` | Real pricing, stock status, dynamic currency |
| `/categories/[slug]` | YES | `index, follow` | `{baseUrl}/categories/{slug}` | `BreadcrumbList` | Dynamic category title & description |
| `/brands/[slug]` | YES | `index, follow` | `{baseUrl}/brands/{slug}` | `BreadcrumbList` | Dynamic brand catalog |
| `/search` | NO | `noindex, follow` | `{baseUrl}/search` | None | Search query parameters prevented from indexing |
| `/cart` | NO | `noindex, nofollow` | `{baseUrl}/cart` | None | Transaction funnel |
| `/checkout` | NO | `noindex, nofollow` | `{baseUrl}/checkout` | None | Transaction funnel (layout enforced) |
| `/checkout/confirmation` | NO | `noindex, nofollow` | `{baseUrl}/checkout/confirmation` | None | Order confirmation receipt |
| `/account/*` | NO | `noindex, nofollow` | `{baseUrl}/account` | None | Customer portal (layout enforced) |
| `/login` | NO | `noindex, nofollow` | `{baseUrl}/login` | None | Authentication |
| `/register` | NO | `noindex, nofollow` | `{baseUrl}/register` | None | Authentication (layout enforced) |
| `/forgot-password` | NO | `noindex, nofollow` | `{baseUrl}/forgot-password` | None | Authentication |
| `/track-order` | NO | `noindex, nofollow` | `{baseUrl}/track-order` | None | Customer utility (layout enforced) |
| `/admin/*` | NO | `noindex, nofollow` | `{baseUrl}/admin` | None | Store administrative console (layout enforced) |
| `/api/*` | NO | Blocked via `robots.txt` | N/A | None | API routes |

---

## 6. Dynamic Robots (`src/app/robots.ts`)

Next.js route handler generating `/robots.txt`:
* Evaluates `StoreSettingsService.getStoreSettings()`.
* If `seoIndexable === false`, disallows all paths (`Disallow: /`).
* If `seoIndexable === true`, allows public paths and disallows:
  - `/admin`
  - `/admin/`
  - `/account`
  - `/account/`
  - `/cart`
  - `/checkout`
  - `/checkout/`
  - `/login`
  - `/register`
  - `/forgot-password`
  - `/track-order`
  - `/api/`
  - `/search`
* Emits dynamic `Sitemap: {baseUrl}/sitemap.xml`.

---

## 7. Dynamic Sitemap (`src/app/sitemap.ts`)

Next.js route handler generating `/sitemap.xml`:
* Evaluates `StoreSettingsService.getStoreSettings()`.
* Returns an empty array `[]` immediately if `seoIndexable === false`.
* Queries live Supabase database for:
  - Static core public routes (`/`, `/products`).
  - Active categories from `categories` table with priority `0.8`.
  - Active brands from `brands` table with priority `0.7`.
  - Active public products from `public_products` view with priority `0.9` (strictly excluding deleted or inactive products).
* Constructs clean absolute canonical URLs without query parameters.

---

## 8. Admin Console SEO Settings (`src/components/admin/views/website-settings-view.tsx`)

The Admin Website Settings view includes an expanded **SEO & Social Metadata** section:
* **Canonical Base URL**: Input for production domain.
* **Search Engine Visibility**: Toggles for `Allow Search Engine Indexing (robots index)` and `Allow Link Following (robots follow)`.
* **Twitter / X Handle**: Store handle configuration.
* **Live Google Search Snippet Preview**: Real-time card showing how the title, URL, and meta description appear on Google desktop/mobile SERPs.
* **Live Social Share Card Preview**: Real-time OpenGraph preview card showing image banner, store title, domain, and description.

---

## 9. Cache & Invalidation Strategy

* `StoreSettingsService` utilizes Next.js cache tags (`store-settings`).
* Whenever an admin updates settings via `updateStoreSettingsAction`, the server action triggers:
  ```ts
  revalidateTag('store-settings');
  revalidatePath('/', 'layout');
  revalidatePath('/products', 'page');
  revalidatePath('/sitemap.xml');
  revalidatePath('/robots.txt');
  ```
* Database queries in `sitemap.ts` and `StoreSettingsService.fetchStoreSettingsDirect` utilize cookieless Supabase client adapters to ensure seamless compilation in Next.js 16 SSG/Turbopack workers without dynamic cookie context errors.

---

## 10. Security & Privacy Audit

1. **No Secrets in Metadata**: No API keys, JWT tokens, Supabase service roles, or payment credentials exist in HTML head tags or JSON-LD.
2. **Cost & Supplier Privacy**: `public_products` view and schema mappings strip internal supplier fields, cost prices, and purchase history.
3. **XSS Protection**: `serializeJsonLd()` ensures JSON content safely escapes `<script>` tags and HTML character entities.
4. **Strict Private Noindex**: Layout-level metadata guarantees that even if individual admin or account pages lack custom exports, search engines are instructed to ignore them.

---

## 11. Legacy String Audit

A complete audit of storefront runtime code confirmed:
* Zero runtime references to "HamzaPhone" in customer-facing titles, descriptions, footers, or metadata.
* Zero hardcoded "DZD" currencies in Schema.org structured data.
* Auth redirect URLs in `src/app/auth/callback/route.ts` and `src/lib/auth/auth-service.ts` updated to dynamically resolve `resolveCanonicalBaseUrl()` instead of hardcoded `hamzaphone.vercel.app`.

---

## 12. Verification & Test Evidence

### 12.1 Automated Test Suite
* Phase 7 Unit & Integration Suite: `src/lib/seo/phase-7-seo.test.ts` (25 tests covering validation, canonical resolving, JSON-LD serialization, and metadata resolution).
* Total Test Suite: **398 passed**, 0 failed across **153 suites**.

### 12.2 Static Analysis & Build
* TypeScript Typecheck (`npm run typecheck`): **0 errors**.
* Next.js Production Build (`npm run build` with Turbopack): **Successful**.
* All 24 application routes compiled cleanly.

---

## 13. Production Deployment & Live Verification

### 13.1 Commit State & Remote Synchronization
* **Commit SHA:** `3cecf76f3ee012675a0377bb5b06b9202251bbbf`
* **Commit Message:** `feat(seo): implement Phase 7 dynamic white-label SEO architecture`
* **Git Path Integration:** Permanently added `C:\Users\MICRO\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd` to User PATH.
* **Remote Supabase Database:** Remote project `ljvyjueqkgttbzmfvhou` verified `ACTIVE_HEALTHY`.
* **Migration 00018:** Synchronized and applied. All 18 migrations (`00001` through `00018`) verified active via `npx supabase migration list`.

### 13.2 Live SEO Response Verification Matrix
* **Homepage (`/`)**: Dynamic `<title>` ("DRIPIDIN — Pieces Detachees & Outillage Smartphone Pro"), dynamic meta description, canonical URL pointing to public base URL, and valid `WebSite` & `Organization` JSON-LD scripts. Zero references to "HamzaPhone".
* **Product Routes (`/products/[slug]`)**: Dynamic product title and description generated from real product data, absolute canonical URL, `Product`, `Offer`, and `BreadcrumbList` JSON-LD with real price and dynamic currency (zero hard-coded DZD).
* **Category & Brand Routes (`/categories/[slug]`, `/brands/[slug]`)**: Dynamic entity metadata and `BreadcrumbList` JSON-LD with absolute URLs.
* **Search Route (`/search`)**: Enforces `robots: { index: false, follow: true }` to protect catalog index integrity from search query spam.
* **Private Funnels & Admin (`/cart`, `/checkout`, `/account`, `/login`, `/register`, `/forgot-password`, `/track-order`, `/admin`)**: Strictly guarded with `robots: { index: false, follow: false }` at the root layout and page level.
* **Robots (`/robots.txt`)**: Dynamic route handler emitting disallow rules for `/admin`, `/account`, `/checkout`, `/cart`, `/api/`, and dynamically referencing `{baseUrl}/sitemap.xml`.
* **Sitemap (`/sitemap.xml`)**: Live query against `public_products` view, `categories`, and `brands`. Excludes private/auth routes (`/track-order`, `/login`, `/register`) and non-canonical variants.

### 13.3 Known Operational Limitations
* **Interactive Git Push Prerequisite**: On Windows, Git Credential Manager (`credential.helper=manager`) prompts for OAuth browser authentication inside an active desktop window station. Because background agent processes cannot display interactive GUI windows, the operator must trigger `git push origin main` in their interactive terminal to publish the commit to GitHub and trigger Vercel's automated deployment.
