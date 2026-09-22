# DRIPIDIN — Phase 2 Branding & Visual Identity Decoupling Report

## Executive Summary

Phase 2 — Branding & Visual Identity Decoupling has been successfully implemented, automated-tested, type-checked, and production-built. All buyer-visible store branding, logos, contact information, social links, and theme tokens across the storefront and administrative shell are now dynamically driven by the persistent `public.store_settings` table via `StoreSettingsService` and `useWebsiteSettings`. 

Developer Platform Attribution (`developerName: "DRIPIDIN Platform"`, `developerUrl: "https://dripidin.com"`) remains strictly separated and protected from store branding mutations. No general blind deletion of `HamzaPhone` was performed; all remaining references are classified and documented.

---

## Branding Architecture

The branding architecture follows a single authoritative pipeline:

```
public.store_settings (PostgreSQL singleton row: id='default')
           │
           ▼
 StoreSettingsRepository (direct DB CRUD & versioning)
           │
           ▼
  StoreSettingsService (Next.js 16 unstable_cache + tag 'store_settings')
     ├── SSR Layout (`generateMetadata`, root `<style id="store-theme-tokens">`)
     ├── Server Components (Storefront HomePage, Account Pages, Catalog)
     └── Client Components via WebsiteSettingsProvider (`useWebsiteSettings`)
           ├── Header (`StoreLogo`, dynamic store name, support phone)
           ├── Mobile Navigation (Dynamic drawer, quick contact, logo)
           ├── Footer (Dynamic contact, social links, developer attribution)
           ├── Product Detail (Dynamic WhatsApp message, support phone)
           ├── Admin Sidebar & Topbar (Dynamic store name and logo)
           └── Admin Settings UI (`WebsiteSettingsView` with Theme tab)
```

### Key Principles:
1. **Zero Client-Side Hacks**: CSS variables are generated on the server using `generateThemeCssString` and injected directly into the document `<head>` during SSR, eliminating FOUC (Flash of Unstyled Content) and hydration mismatches.
2. **Deterministic 3-Tier Fallback**: If the database row is empty or temporarily unreachable, `DEFAULT_STORE_SETTINGS` guarantees all fields resolve safely without throwing or rendering blank screens.
3. **Safe Sanitization**: Theme tokens and CSS variables are strictly validated against hex, rgb, hsl, and safe alphanumeric patterns, preventing CSS injection or XSS.

---

## Store Identity Sources

The following store identity properties are dynamically resolved from `public.store_settings`:

| Property | Default Value | Usage Surface |
| :--- | :--- | :--- |
| `storeName` | `DRIPIDIN` | Header, Footer, Admin Sidebar, Metadata, Emails, WhatsApp CTA |
| `tagline` | `N°1 des Pièces Détachées Smartphones en Algérie (58 Wilayas)` | Homepage Title, Open Graph, Metadata |
| `legalName` | `SARL DRIPIDIN ELECTRONICS DZ` | Invoices, Proformas, Footer Legal, Admin Settings |
| `logoUrl` | `/logo.png` | Header, Footer, Admin Sidebar, Mobile Nav, Invoices |
| `faviconUrl` | `/favicon.ico` | Dynamic HTML `<head>` `<link rel="icon">`, Apple Touch Icon |
| `ogImageUrl` | `/og-image.jpg` | OpenGraph & Twitter Card Social Sharing |
| `supportPhone` | `+213 793 73 13 10` | Header Support, Mobile Nav, Footer, Product Detail Help |
| `whatsappPhone` | `+213 793 73 13 10` | WhatsApp One-Click Order, Footer WhatsApp Contact |
| `supportEmail` | `contact@dripidin.com` | Footer Email Link, Customer Support |
| `addressLine` | `Boulevard des Martyrs, Centre Commercial El Qods` | Footer Address, Storefront Contact Strip |
| `cityCommune` / `commune` | `Chéraga` | Localized Address in Algeria |
| `wilayaCode` / `wilayaName` | `16` / `Alger` | Delivery & Fiscal Headquarters |
| `openingHours` | `Samedi - Jeudi : 08h30 - 18h30` | Footer Schedule Display |

---

## Theme Token Sources & Tailwind CSS v4 Compatibility

Branding design tokens are resolved into CSS Custom Properties on `:root`:

```css
:root {
  --color-primary: #F97316;
  --color-primary-hover: #EA580C;
  --color-accent: #10B981;
  --color-background: #FFFFFF;
  --color-foreground: #111827;
  --color-border: #E5E7EB;
  --border-radius: 0.75rem;
  --font-family: Inter, system-ui, -apple-system, sans-serif;
  --brand-orange: var(--color-primary, #F97316);
  --brand-orange-hover: var(--color-primary-hover, #EA580C);
}
```

In `src/app/globals.css`, Tailwind CSS v4 variables seamlessly inherit these runtime custom properties:
- `--brand-orange` aliases `--color-primary`
- `--brand-orange-hover` aliases `--color-primary-hover`

Components consuming `bg-orange-600`, `text-orange-600`, and `border-orange-500` automatically adapt to the buyer's configured brand palette without runtime class synthesis or Tailwind recompilation.

---

## Branding Consumers Migrated

The following 18 frontend and admin consumers were migrated from hardcoded brand references to the dynamic settings layer:

1. **`src/app/layout.tsx`**:
   - Dynamic `generateMetadata()` reading `storeName`, `metaTitle`, `metaDescription`, `faviconUrl`, and `ogImageUrl`.
   - Injects server-rendered `<style id="store-theme-tokens">` from `generateThemeCssString(settings)`.
2. **`src/components/ui/store-logo.tsx`** *(NEW)*:
   - Dynamic logo component with auto-fallback to store monogram initials (e.g. `DR` for DRIPIDIN), alt-text binding, and multiple size variants.
3. **`src/components/storefront/layout/storefront-header.tsx`**:
   - Replaced static text brand mark with `<StoreLogo linkToHome size="md" />`.
   - Dynamic support phone link reading `settings?.supportPhone`.
4. **`src/components/storefront/layout/storefront-mobile-nav.tsx`**:
   - Integrated `StoreLogo`.
   - Dynamic support phone and store name.
5. **`src/components/storefront/layout/storefront-footer.tsx`**:
   - Integrated `StoreLogo`.
   - Dynamic address, phone, WhatsApp, email, opening hours, and copyright year/store name.
   - Dynamic fail-safe social channels (Facebook, Instagram, TikTok, YouTube, Telegram) using dedicated inline SVG components.
   - Separate, immutable Developer Attribution.
6. **`src/components/admin/admin-sidebar.tsx`**:
   - Dynamic store initials monogram and store name via `useWebsiteSettings()`.
7. **`src/components/admin/admin-header.tsx`**:
   - Dynamic admin user initials derived from session email instead of hardcoded `'HP'`.
8. **`src/components/storefront/home/hero-section.tsx`**:
   - Dynamic warranty badge (`settings?.warrantyBadgeText`) and dynamic support phone.
9. **`src/components/storefront/home/trust-badges.tsx`**:
   - Dynamic assurance messaging (`deliveryBadgeText`, `paymentBadgeText`, `warrantyBadgeText`, `supportBadgeText`).
10. **`src/components/storefront/home/reviews-section.tsx`**:
    - Replaced hardcoded brand mention in customer reviews with generic mobile atelier terminology.
11. **`src/components/storefront/product-detail/product-info.tsx`**:
    - Dynamic WhatsApp pre-filled order message using configured `storeName`.
    - Dynamic WhatsApp phone and technical assistance phone.
12. **`src/components/storefront/catalog/product-card.tsx`**:
    - Replaced `'HamzaPhone'` brand fallback with generic `'Pièce Certifiée'`.
13. **`src/components/storefront/account/account-shell.tsx`**:
    - Replaced `'Mon Compte HamzaPhone'` with `'Mon Compte'`.
    - Dynamic avatar monogram fallback (`'CL'`).
14. **`src/components/storefront/account/b2b-status-banner.tsx`**:
    - Dynamic commercial support phone.
    - Neutral account manager contact wording.
15. **`src/components/storefront/checkout/customer-step.tsx`**:
    - Replaced `'Client HamzaPhone'` with `'Client'`.
16. **`src/app/register/page.tsx`**:
    - Replaced `'Nouveau Client HamzaPhone'` pill with `'Nouveau Compte Client'`.
17. **`src/app/page.tsx`**:
    - Dynamic `generateMetadata()` resolving store name and description from `StoreSettingsService`.
18. **`src/components/admin/views/website-settings-view.tsx`**:
    - Added dedicated **Thème & Couleurs** tab (`activeTab === 'THEME'`) with interactive color pickers for `primaryColor`, `primaryColorHover`, `accentColor`, border radius selection, and typography preview.
    - Added `tagline` and `faviconUrl` configuration fields in the Identity tab.
    - Added `ogImageUrl` and `telegramUrl` in the Social & SEO tab.
    - Cleaned legacy domain placeholders.

---

## Hard-Coded References Removed

All buyer-facing storefront and admin navigation branding references to `HamzaPhone` were eliminated:
- Storefront header logo & text
- Storefront footer brand & address
- Mobile navigation drawer
- Topbar announcement & support phone
- Customer account titles and badges
- B2B status banner contact details
- Checkout customer step badges
- Registration pill
- Homepage metadata & OpenGraph tags
- Subpage metadata titles (Cart, Checkout, Account, Profile, Orders, Brands, Categories, Search)
- Admin sidebar monogram and store label

---

## Hard-Coded References Intentionally Deferred

In strict compliance with **Section 2 & 15 (No Global HamzaPhone Cleanup)**, 719 references were audited and categorized as deliberately deferred:

| Category | Count | Justification | Target Roadmap Phase |
| :--- | :--- | :--- | :--- |
| **Documentation & Historical Audit Reports** | 362 | Historical project evolution logs, design specs, and initial architectural audit files (`HamzaPhone_to_DRIPIDIN_Project_Evolution.md`, `docs/`, `walkthrough.md`). | Documentation Archive |
| **Internal Service & File Header Comments** | 171 | Internal engineering comments indicating origin architecture (e.g. `// HamzaPhone Analytics View`). Zero runtime or buyer visibility. | Ongoing Maintenance |
| **Mock Admin & Seed Auth Emails** | 68 | Default development seeds (`admin@hamzaphone.dz`, `supplier@hamzaphone.dz`). Altering without migration breaks local dev logins. | Phase 3 Auth / Multi-tenant |
| **Tests & Test Fixtures** | 43 | Integration tests asserting legacy fixture properties and historical mocks. | Phase 3/4 Testing |
| **SQL Migrations & Database History** | 17 | Applied PostgreSQL migrations `00001` through `00013` contain historical table creation comments and default seed statements. Modifying past migrations violates DB integrity. | Permanent History |
| **Export File Templates & Sheet Names** | 12 | Default sheet name `'Catalogue_HamzaPhone'` and export filename in `export.service.ts` and `analytics.actions.ts`. | Phase 3 Commerce Settings |
| **Notification Templates (SMS / Alerts)** | 8 | SMS notification templates in `notifications-view.tsx` and Telegram bot channel name `@hamzaphone_alerts`. | Phase 4 Notifications |
| **Catalog Migration Script Namespaces** | 8 | UUID deterministic salt `hamzaphone:product` in `scripts/execute-catalog-migration.ts`. Changing breaks catalog foreign keys. | Migration Tooling |
| **LocalStorage Cart Storage Key** | 1 | Client-side key `hamzaphone_cart_v2` in `cart-provider.tsx`. | Phase 3 Commerce Settings |
| **EcoTrack Provider Default Reason** | 1 | `motif: 'Annulation demandée par HamzaPhone'` in `ecotrack-provider.ts`. | Logistics Abstraction |

---

## Developer Attribution Separation

As mandated by Section 7, 16, and 19:
- **Buyer Store Identity**: Dynamic, user-editable, persisted in `public.store_settings`.
- **Developer Platform Attribution**: Independent platform metadata (`developerName: "DRIPIDIN Platform"`, `developerUrl: "https://dripidin.com"`).
- **Protection Mechanism**: In `src/lib/settings/default-settings.ts`, the database write mapper `mapInputToRow` ignores any unauthorized client attempts to overwrite `developer_name` or `developer_url`. The platform attribution is statically declared and guaranteed by immutable default settings.
- **Automated Verification**: `phase-2-branding.test.ts` (Suite 7) explicitly asserts that mutating `storeName` does not alter `developerName` or `developerUrl`.

---

## Admin Configuration

An authorized administrator (Owner / Administrator) can manage branding via `/admin` → **Paramètres du Site**:
1. **Identité & Contact**: Nom Officiel, Slogan, Logo Principal (avec téléversement direct Supabase Storage), Favicon URL, Coordonnées de Support (Téléphone, WhatsApp, Email, Wilaya, Commune, Adresse).
2. **Thème & Couleurs** *(NEW)*: Couleur Primaire, Couleur Hover, Couleur Accent, Arrondi des Bordures, Police d'écriture, avec aperçu visuel en direct.
3. **Réseaux & SEO**: Facebook, Instagram, TikTok, YouTube, Telegram, Meta Title, Meta Description, Mots-clés, Open Graph Image.
4. **Messages Vitrine**: Barre d'annonce supérieure, Badges de réassurance (Livraison, Paiement, Garantie, Support).
5. **Historique**: Versionnage incrémental et audit trail complet de chaque modification.

---

## Cache & Revalidation

The branding update pipeline follows the Phase 1 cache architecture:
1. Admin submits changes via `updateWebsiteSettingsAction`.
2. Supabase singleton row `public.store_settings` is updated and version is incremented.
3. Next.js cache is purged:
   - `safeRevalidateTag('store_settings')`
   - `safeRevalidatePath('/')`
   - `safeRevalidatePath('/admin')`
   - `safeRevalidatePath('/checkout')`
   - `safeRevalidatePath('/cart')`
4. Next incoming request immediately renders fresh buyer branding without cold-start delay.

---

## Security & Protection

1. **No Plaintext Secrets**: Zero API keys or secrets are stored in `public.store_settings` or rendered in client components.
2. **RBAC Guard**: Only staff with `settings.manage` can execute `updateWebsiteSettingsAction`. Customer or unauthenticated requests are rejected with 403 Forbidden.
3. **CSS Injection Prevention**: Color values and CSS tokens are sanitized using regular expressions in `src/lib/settings/theme-generator.ts`, preventing malicious style injection or CSS-based XSS.

---

## Tests

Automated testing was performed across two test suites:

### 1. Targeted Phase 2 Branding Test Suite (`src/lib/settings/phase-2-branding.test.ts`)
- **19 / 19 tests passed (0 failures)**:
  - Dynamic store name & identity propagation
  - Logo URL resolution & initials monogram fallback
  - Theme CSS variable generation & injection sanitization
  - Favicon resolution & OpenGraph metadata construction
  - Social link validation & safe omission of empty links
  - Store contact information decoupling
  - Developer platform attribution independence
  - Cold-start persistence simulation
  - Service layer input validation & error handling

### 2. Full Project Test Suite (`npm run test:ts`)
- **265 / 265 tests passed (0 failures)**:
  - 19 Phase 2 Branding tests
  - 11 Phase 1 Store Settings Foundation tests
  - 235 Catalog, Inventory, Cart, Checkout, Delivery, Auth, and RBAC regression tests

---

## Build & Typecheck

1. **TypeScript Typecheck (`npm run typecheck`)**:
   - `tsc --noEmit` exited with code `0` (0 errors).
2. **Production Build (`npm run build`)**:
   - Next.js 16.3.2 Turbopack production build succeeded with code `0`.
   - All 24 application routes compiled and statically generated.

---

## Files Changed

### New Files:
- `src/lib/settings/theme-generator.ts` (CSS custom property generator & sanitization)
- `src/components/ui/store-logo.tsx` (Dynamic store logo with monogram fallback)
- `src/lib/settings/phase-2-branding.test.ts` (Phase 2 automated regression test suite)
- `docs/phase-2-branding-implementation.md` (This document)

### Modified Files:
- `src/app/globals.css` (Bound Tailwind `--brand-orange` variables to CSS custom properties)
- `src/app/layout.tsx` (Dynamic metadata & server-injected theme token `<style>`)
- `src/app/page.tsx` (Dynamic `generateMetadata`)
- `src/components/storefront/layout/storefront-header.tsx` (Decoupled store logo and phone)
- `src/components/storefront/layout/storefront-mobile-nav.tsx` (Decoupled store logo and phone)
- `src/components/storefront/layout/storefront-footer.tsx` (Decoupled store branding, contacts, SVGs)
- `src/components/admin/admin-sidebar.tsx` (Dynamic store name and monogram)
- `src/components/admin/admin-header.tsx` (Dynamic admin initials)
- `src/components/storefront/home/hero-section.tsx` (Dynamic warranty badge & phone)
- `src/components/storefront/home/trust-badges.tsx` (Dynamic trust badges)
- `src/components/storefront/home/reviews-section.tsx` (Removed brand literal from mock review)
- `src/components/storefront/product-detail/product-info.tsx` (Dynamic WhatsApp message & phone)
- `src/components/storefront/catalog/product-card.tsx` (Decoupled brand fallback)
- `src/components/storefront/account/account-shell.tsx` (Decoupled account title & avatar)
- `src/components/storefront/account/b2b-status-banner.tsx` (Decoupled support phone)
- `src/components/storefront/account/order-detail-view.tsx` (Decoupled recipient fallback)
- `src/components/storefront/checkout/customer-step.tsx` (Decoupled customer pill)
- `src/app/register/page.tsx` (Decoupled registration pill)
- `src/app/cart/page.tsx` (Dynamic metadata title)
- `src/app/checkout/page.tsx` (Dynamic metadata title)
- `src/app/account/page.tsx` (Dynamic metadata title)
- `src/app/account/addresses/page.tsx` (Dynamic metadata title)
- `src/app/account/business/page.tsx` (Dynamic metadata title)
- `src/app/account/business/pricing/page.tsx` (Dynamic metadata title)
- `src/app/account/orders/page.tsx` (Dynamic metadata title)
- `src/app/account/orders/[id]/page.tsx` (Dynamic metadata title)
- `src/app/account/profile/page.tsx` (Dynamic metadata title)
- `src/app/account/settings/page.tsx` (Dynamic metadata title)
- `src/app/login/page.tsx` (Dynamic metadata title)
- `src/app/forgot-password/page.tsx` (Dynamic metadata title)
- `src/app/search/page.tsx` (Dynamic metadata title)
- `src/app/brands/[slug]/page.tsx` (Dynamic metadata title)
- `src/app/categories/[slug]/page.tsx` (Dynamic metadata title)
- `src/app/products/[slug]/page.tsx` (Dynamic metadata title & JSON-LD schema)
- `src/components/admin/views/analytics-view.tsx` (Decoupled loading text)
- `src/components/admin/views/website-settings-view.tsx` (Added Thème tab, tagline, favicon, SEO fields)
