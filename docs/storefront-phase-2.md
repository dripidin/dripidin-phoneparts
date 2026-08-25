# HamzaPhone Storefront Phase 2: Customer Identity, Authentication & Account Architecture

## 1. Executive Summary

Storefront Phase 2 establishes the complete authenticated customer experience and account management layer for **HamzaPhone**, Algeria's premier smartphone replacement-parts e-commerce platform.

This architecture introduces seamless identity resolution, distinguishing consumer accounts (B2C) from repair workshops and wholesalers (B2B). All protected operations enforce session-derived authentication, Wilaya-specific delivery constraints across all 58 Algerian Wilayas, and strict wholesale price isolation.

---

## 2. Core Identity & Architecture Principles

### 2.1 Server-Derived Identity & Zero-Trust
In accordance with HamzaPhone security rules:
- No client-supplied `user_id`, `business_id`, or `user_type` is trusted in mutations or financial queries.
- Protected Server Actions (`customer-account.actions.ts`, `auth.actions.ts`) invoke `requireAuth(supabase)` to extract identity directly from verified Supabase session tokens.
- All customer queries (`getAddresses`, `getOrders`, `getOrderById`, `getB2BPricingList`) are strictly scoped to the authenticated `user.userId`.

### 2.2 Strict B2B Wholesale Pricing Guard
- B2B accounts submit commercial verification details (Raison Sociale, Registre de Commerce RC, NIF, NIS, Article d'imposition).
- While under `PENDING`, `REJECTED`, or `SUSPENDED` status, the user is strictly treated as standard retail by all server pricing algorithms.
- Tiered wholesale pricing (`b2b_tier_prices`) is accessible **only** when `b2bStatus === 'APPROVED'`. Any unauthorized query attempt throws an immediate authorization error.

---

## 3. Implemented Components & Routes

### 3.1 Authentication & Registration
| Route / Component | Purpose & Features |
| :--- | :--- |
| `/login` (`login-form.tsx`) | Email/password sign-in with password toggle, redirect recovery (`?next=`), and OAuth integration (Google, Facebook, Apple). |
| `/register` (`register-b2c-form.tsx`, `register-b2b-form.tsx`) | Segmented registration hub switching between Consumer (B2C) and Repair Workshop / Reseller (B2B). Validates Algerian mobile format (`05/06/07...`) and RC numbers. |
| `/forgot-password` (`forgot-password-form.tsx`) | Password reset request form delivering automated reset instructions. |
| `/auth/callback` | OAuth authorization code exchange route handler. |

### 3.2 Account Dashboard & Profile
| Route / Component | Purpose & Features |
| :--- | :--- |
| `/account` (`account-shell.tsx`, `account-sidebar.tsx`) | Overview hub with live summary statistics (total orders, saved addresses count, B2B status banner, recent orders timeline). |
| `/account/profile` (`profile-form.tsx`) | Customer profile editor (Full name, primary phone, secondary phone). |
| `/account/addresses` (`addresses-view.tsx`, `address-card.tsx`, `address-form-modal.tsx`) | Address book supporting up to 5 saved addresses across 58 Algerian Wilayas with automatic default address switching. |
| `/account/orders` (`order-history-list.tsx`) | Paginated order history with filter tabs (Toutes, En cours, Livrées, Annulées) and EcoTrack tracking badges. |
| `/account/orders/[id]` (`order-detail-view.tsx`) | Detailed order breakdown with visual 4-step delivery timeline, item thumbnails, SKU details, and direct EcoTrack tracking link. |
| `/account/settings` (`security-form.tsx`) | Password change interface with uppercase & digit complexity validation. |
| `/account/business` (`b2b-business-view.tsx`, `b2b-status-banner.tsx`) | B2B workshop hub displaying RC/NIF/NIS data, credit limit, and current balance. |
| `/account/business/pricing` (`b2b-pricing-table.tsx`) | Exclusive B2B wholesale pricing table with live savings calculations, search filtering, and one-click quick add to cart. |

---

## 4. Address Book & Wilaya Validation

HamzaPhone natively enforces delivery across all 58 Algerian Wilayas:
- Supported Wilayas: `01 - Adrar` through `58 - El Meniaa` (`ALGERIA_WILAYAS`).
- Address types: `HOME` (Domicile), `WORK` (Bureau), `WORKSHOP` (Atelier de Réparation), `OTHER` (Autre).
- Setting an address as default automatically unsets previous defaults within a single atomic operation.
- If a default address is deleted, the service automatically designates the next available address as the primary default.

---

## 5. Automated Verification & Test Results

The implementation was validated using automated tests and type checking:

1. **Unit & Integration Test Suite** (`src/lib/services/customer-account.test.ts`):
   - B2C identity resolution & wholesale denial.
   - B2B `PENDING` vs `APPROVED` state validation.
   - Unauthorized access rejection on B2B pricing queries.
   - AddressSchema validation across 58 Wilayas and Algerian phone numbers.
   - **Result**: `73/73 tests passing across 30 test suites`.

2. **TypeScript Compilation** (`tsc --noEmit`):
   - **Result**: `0 errors, exit code 0`.

3. **Next.js Production Build** (`next build`):
   - **Result**: `17 static & dynamic routes compiled successfully in 10.7s`.
