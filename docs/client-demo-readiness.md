# HamzaPhone Client Demo & Acceptance Readiness Guide

**Target Environment:** Private Client Demo / Acceptance Environment  
**Storefront URL:** [https://hamzaphone.vercel.app](https://hamzaphone.vercel.app)  
**Admin Portal URL:** [https://hamzaphone.vercel.app/admin](https://hamzaphone.vercel.app/admin)  
**Database & Auth Instance:** Supabase Production `gcqseaefboaijktusjmg` (`https://gcqseaefboaijktusjmg.supabase.co`)  
**Deployment Infrastructure:** Vercel (Next.js 16.3.2 Turbopack)  

---

## 1. Demo Capabilities & Verified User Journeys

The application is 100% operational for client evaluation across the following end-to-end workflows:

### A. Storefront & Catalog Browsing
- **Search & Filter:** Instant search across 3,946 products by SKU, name, technical code, and brand.
- **Product Details:** High-resolution product images, technical specs, and device compatibility breakdown.
- **Dynamic Pricing:** Real-time B2C retail vs wholesale B2B pricing displays.

### B. Customer Authentication & Account Management
- **B2C Registration:** Instant signup via email/password; automatic profile creation and default `B2C_CUSTOMER` role assignment.
- **Customer Sign-In:** Secure password login with Next.js 16 asynchronous cookie session persistence.
- **Customer Dashboard:** Manage profile details, saved Algerian delivery addresses (58 Wilayas), and order history.

### C. Commercial Purchasing & Checkout
- **Guest Checkout:** Place Cash-on-Delivery (COD) orders without an account. Dual-token verification for tracking.
- **Authenticated Checkout:** Pre-filled address and auto-linking to customer account.
- **Algerian Logistics Engine:** 58-Wilaya home and stopdesk delivery rate calculation.
- **Double-Entry Stock Ledger:** Atomic reservations protect against overselling during checkout.

### D. Owner & Admin Management
- **Owner Authentication:** Staff sign-in with full `OWNER` administrative superuser permissions (`perm_code: all`).
- **Product Management:** Create new replacement parts, edit existing listings, update categories, and assign device compatibility.
- **Inventory & Pricing:** Stock adjustments, receiving ledger entries, and bulk margin percentage tools.
- **Orders & Delivery:** Order state machine transitions (`PENDING` → `CONFIRMED` → `PREPARING` → `SHIPPED` → `DELIVERED`).
- **Import / Export Engine:** Upload supplier Excel/CSV files, auto-detect column mappings, run dry-run validation previews, and export filtered catalogs to XLSX/CSV.

---

## 2. Demo Test Credentials Strategy

| Account Type | Email | Password | Role & Permissions |
| :--- | :--- | :--- | :--- |
| **Platform Owner / Admin** | `admin@hamzaphone.dz` | `AdminHamza2026!Secure` | Full administrative superuser (`OWNER`) |
| **Test B2C Customer** | Self-register via `/register` | Any valid password | Standard consumer retail buyer |
| **Guest Purchasing** | N/A | N/A | Self-service COD guest checkout |

---

## 3. Features Intentionally Disabled for Demo Phase

As agreed for this client evaluation milestone, the following production-only features are intentionally deferred:

1. **Social OAuth Login (Google, Apple, Facebook):**
   - Kept disabled in Supabase. Email and password authentication is standard for demo acceptance.
2. **Custom Domain (`hamzaphone.dz`) & Hostinger Infrastructure:**
   - Currently hosted on `https://hamzaphone.vercel.app`. Hostinger migration and DNS configuration will occur upon client acceptance.
3. **Third-Party Carrier Live Webhooks (EcoTrack):**
   - Carrier integration uses local simulated delivery transitions for the demo.
4. **Point-in-Time Recovery (PITR) & Paid SMTP:**
   - Standard Supabase transactional logs are active.

---

## 4. Post-Purchase / Production Launch Checklist

Once the client approves and purchases the project, the following remaining items will be activated:
- [ ] Bind custom domain `hamzaphone.dz` and SSL certificates.
- [ ] Configure custom transactional SMTP server.
- [ ] Enable Google & Apple OAuth credentials in Supabase Dashboard.
- [ ] Provision live EcoTrack carrier API keys and webhook signing secret.
- [ ] Final migration to target Hostinger production server if requested.

---

## 5. Verification & Test Summary

- **Automated Test Suite:** `220/220 passed` (`npm run test:ts` with 0 failures)
- **TypeScript Static Analysis:** `0 errors` (`tsc --noEmit` passed)
- **Production Build:** Successfully compiled with Next.js 16 Turbopack
- **Live Vercel Deployment:** `dpl_D6wbDeGzG198dJSZ5fdtqutfFiJh` (`Ready & Aliased`)
