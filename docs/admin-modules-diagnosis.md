# HamzaPhone Owner & Admin Modules Deep Diagnosis Report
**Environment:** Private Client Demo / Acceptance Environment  
**Storefront & Admin URL:** [https://hamzaphone.vercel.app](https://hamzaphone.vercel.app)  
**Database:** Supabase Production `gcqseaefboaijktusjmg`  
**Diagnosis Type:** STRICTLY READ-ONLY (No mutations performed)  

---

## Executive Summary

The HamzaPhone Owner & Admin portal was diagnosed across 6 failing operations. Each issue was traced through the UI components, Server Actions, Zod validation schemas, PostgreSQL database tables, RLS policies, and Supabase Storage configurations.

### Root Cause Synopsis:
1. **Add Supplier:** PostgreSQL schema mismatch (`contact_name` vs `contact_person`, and non-existent `notes` column in `public.suppliers`).
2. **Add Product:** Zod validation failure on `slug` (mandatory in schema but omitted from UI form submission) and `mainImage` (strictly requiring `http/https` URL instead of relative `/catalog-images/...` paths).
3. **EcoTrack API / Webhook Test:** Environment variables `ECOTRACK_API_TOKEN` and `ECOTRACK_WEBHOOK_SECRET` are not populated in production (the system correctly operates in Sandbox/Mock Mode), and there is no persistent dynamic settings table for courier API keys.
4. **Store/Warehouse Wilaya & Commune:** The UI form renders a read-only disabled `<Input disabled />` element without a Wilaya dropdown or Commune input.
5. **Store Logo Upload:** Missing file input and upload Server Action (only a raw text URL input exists in the UI).
6. **Minified React Error #441:** Uncaught exceptions (`ZodError` and PostgREST schema errors) thrown across Server Action RPC boundaries masked by Next.js 16 production error obfuscation.

---

## Detailed Module Diagnoses

---

### 1. Add Supplier

- **Status:** FAILING
- **Priority:** `P1` (Demo-Critical)
- **Root Cause:**
  PostgREST schema mismatch. `src/lib/actions/supplier.actions.ts` attempts to `insert` and `select` the columns `contact_name` and `notes`. However, in the `public.suppliers` database table:
  - The actual column name is `contact_person`.
  - The column `notes` does NOT exist in `public.suppliers`.
  When PostgREST receives the insert query, it rejects it with error code `PGRST204` (`Could not find the 'contact_name' column of 'suppliers' in the schema cache`), which causes `createSupplierAdmin` to throw an unhandled exception.
- **Evidence:**
  - `public.suppliers` table columns: `id`, `name`, `code`, `contact_person`, `phone`, `email`, `country`, `lead_time_days`, `currency`, `exchange_rate_to_dzd`, `is_active`, `created_at`, `updated_at`.
  - `src/lib/actions/supplier.actions.ts:53`: `contact_name: input.contactName || null`
  - `src/lib/actions/supplier.actions.ts:59`: `notes: input.notes || null`
  - `src/lib/actions/supplier.actions.ts:19`: `select('... contact_name ...')`
- **Affected Files:**
  - [supplier.actions.ts](file:///d:/Websites%20On%20Line/hamzaphone/src/lib/actions/supplier.actions.ts)
  - [suppliers-view.tsx](file:///d:/Websites%20On%20Line/hamzaphone/src/components/admin/views/suppliers-view.tsx)
- **Affected DB Object:** `public.suppliers`
- **Required Permission:** `settings.manage` (or `pricing.update`). Current Owner has superuser permission (`perm_code: all`).
- **RLS Status:** RLS is enabled. Policies `Staff manage suppliers` and `Staff read suppliers` require `settings.manage` or `pricing.update`/`pricing.read`.
- **Recommended Fix:**
  - Map `contact_person` to `contactPerson` in `supplier.actions.ts`.
  - Remove `notes` from the `insert` and `update` queries.
  - Wrap Server Action in `try/catch` to return structured `{ success: false, error: message }` instead of throwing raw errors.

---

### 2. Add Product

- **Status:** FAILING
- **Priority:** `P1` (Demo-Critical)
- **Root Cause:**
  Zod schema validation failure in `CreateProductSchema.parse(rawInput)`:
  1. `CreateProductSchema` requires `slug: z.string().min(3).max(255)`. However, the Admin UI form in `products-view.tsx` does not submit `slug` because the Server Action attempts to generate `slug` on line 51 *after* calling `CreateProductSchema.parse(rawInput)` on line 48.
  2. `CreateProductSchema` specifies `mainImage: z.string().url()`, which rejects relative catalog image paths (e.g. `/catalog-images/products/22180/main.jpg` used by all 3,946 products) or empty strings during draft creation.
  3. `CreateProductSchema.parse()` throws an uncaught `ZodError`, triggering Minified React error #441 in production.
- **Evidence:**
  - [product.schema.ts](file:///d:/Websites%20On%20Line/hamzaphone/src/lib/validation/product.schema.ts#L21): `slug: z.string().min(3).max(255)`
  - [product.schema.ts](file:///d:/Websites%20On%20Line/hamzaphone/src/lib/validation/product.schema.ts#L38): `mainImage: z.string().url(...)`
  - [product.actions.ts](file:///d:/Websites%20On%20Line/hamzaphone/src/lib/actions/product.actions.ts#L48-L51): `CreateProductSchema.parse(rawInput)` runs before slug creation.
  - [products-view.tsx](file:///d:/Websites%20On%20Line/hamzaphone/src/components/admin/views/products-view.tsx#L227-L247): Mutation payload omits `slug`.
- **Affected Files:**
  - [product.schema.ts](file:///d:/Websites%20On%20Line/hamzaphone/src/lib/validation/product.schema.ts)
  - [product.actions.ts](file:///d:/Websites%20On%20Line/hamzaphone/src/lib/actions/product.actions.ts)
  - [products-view.tsx](file:///d:/Websites%20On%20Line/hamzaphone/src/components/admin/views/products-view.tsx)
- **Affected DB Object:** `public.products`
- **Required Permission:** `products.create`
- **RLS Status:** RLS is enabled with `Staff manage products` policy allowing users with `products.create` / `products.update`.
- **Recommended Fix:**
  - Make `slug` optional in `CreateProductSchema` (`slug: z.string().optional()`) and generate slug if omitted.
  - Allow relative string paths for `mainImage` (`mainImage: z.string().min(1)` or default placeholder `/images/placeholder-product.webp`).
  - Wrap `createProductAdmin` in safe error handling `{ success: boolean, data?: ..., error?: string }`.

---

### 3. EcoTrack API & Webhook Configuration

- **Status:** OPERATIONAL IN SANDBOX / MOCK MODE (No UI key editor)
- **Priority:** `P2` (Non-Critical for Demo)
- **Root Cause:**
  1. EcoTrack credentials in Vercel environment:
     - `ECOTRACK_API_URL`: DEFAULT (`https://api.ecotrack.dz/api/v1`)
     - `ECOTRACK_API_TOKEN`: MISSING (Empty string)
     - `ECOTRACK_WEBHOOK_SECRET`: MISSING (Empty string)
  2. The delivery provider adapter (`ecotrack-provider.ts`) handles missing tokens gracefully by entering **Sandbox / Mock Mode**, returning:
     `{ success: true, message: "Mode Sandbox/Mock actif (Aucun jeton API configuré, émulation locale active)", latencyMs: 15, environment: "sandbox" }`.
  3. There is no database-backed settings table or Admin UI form to dynamically enter/update EcoTrack API credentials at runtime.
- **Evidence:**
  - [ecotrack-provider.ts](file:///d:/Websites%20On%20Line/hamzaphone/src/lib/delivery/ecotrack-provider.ts#L24-L30)
  - [delivery.actions.ts](file:///d:/Websites%20On%20Line/hamzaphone/src/lib/actions/delivery.actions.ts#L85-L91)
  - [delivery-view.tsx](file:///d:/Websites%20On%20Line/hamzaphone/src/components/admin/views/delivery-view.tsx#L93-L105)
- **Affected Files:**
  - [ecotrack-provider.ts](file:///d:/Websites%20On%20Line/hamzaphone/src/lib/delivery/ecotrack-provider.ts)
  - [delivery-view.tsx](file:///d:/Websites%20On%20Line/hamzaphone/src/components/admin/views/delivery-view.tsx)
- **Affected DB Object:** None (Configuration is environment-driven).
- **Required Permission:** `delivery.manage_rates` / `settings.manage`
- **Recommended Fix:**
  - Keep Sandbox/Mock Mode active for demo acceptance.
  - In `delivery-view.tsx`, display clear visual indicators that EcoTrack is running in local Sandbox/Emulation mode.

---

### 4. Store / Warehouse Location (Wilaya & Commune)

- **Status:** FAILING (UI Input Disabled)
- **Priority:** `P1` (Demo-Critical)
- **Root Cause:**
  In `website-settings-view.tsx`, the store/warehouse location fields for Wilaya and Commune are rendered as a single static, disabled `<Input disabled />` element:
  ```tsx
  <Input
    value={`${formData.commune || 'El Harrach'}, ${formData.wilayaName || 'Alger'} (${formData.wilayaCode || 16})`}
    disabled
  />
  ```
  There is NO Wilaya `<Select>` dropdown (backed by `ALGERIA_WILAYAS`) and NO Commune `<Input>` or select. The user has no UI controls to modify these values.
- **Evidence:**
  - [website-settings-view.tsx](file:///d:/Websites%20On%20Line/hamzaphone/src/components/admin/views/website-settings-view.tsx#L300-L306)
  - [settings-cms.types.ts](file:///d:/Websites%20On%20Line/hamzaphone/src/types/settings-cms.types.ts#L10-L13): `commune`, `wilayaCode`, `wilayaName` are fully supported in the service layer.
- **Affected Files:**
  - [website-settings-view.tsx](file:///d:/Websites%20On%20Line/hamzaphone/src/components/admin/views/website-settings-view.tsx)
- **Affected DB Object:** `SettingsCmsService` / `audit_logs`
- **Required Permission:** `settings.manage`
- **Recommended Fix:**
  - Replace the disabled text input with:
    1. A `<Select>` dropdown populated with `ALGERIA_WILAYAS` updating `wilayaCode` and `wilayaName`.
    2. An `<Input>` field updating `commune`.

---

### 5. Upload Store Logo

- **Status:** FAILING (Missing File Upload Control & Action)
- **Priority:** `P1` (Demo-Critical)
- **Root Cause:**
  1. In `website-settings-view.tsx`, the Store Logo setting is rendered strictly as a text input for `logoUrl` (`<Input value={formData.logoUrl} ... />`). There is no `<input type="file" />` element or upload button.
  2. There is no `uploadStoreLogoAdmin` Server Action in `settings-cms.actions.ts`.
  3. In Supabase Storage, the only public bucket is `product-images` (there is no separate `branding` bucket).
- **Evidence:**
  - [website-settings-view.tsx](file:///d:/Websites%20On%20Line/hamzaphone/src/components/admin/views/website-settings-view.tsx#L239-L244)
  - `storage.buckets`: `product-images` (public: true), `b2b-documents` (public: false), `invoices` (public: false).
- **Affected Files:**
  - [website-settings-view.tsx](file:///d:/Websites%20On%20Line/hamzaphone/src/components/admin/views/website-settings-view.tsx)
  - [settings-cms.actions.ts](file:///d:/Websites%20On%20Line/hamzaphone/src/lib/actions/settings-cms.actions.ts)
- **Affected DB Object:** `storage.buckets` / `storage.objects` (`product-images`)
- **Required Permission:** `settings.manage`
- **Recommended Fix:**
  - Implement `uploadStoreLogoAdmin` Server Action uploading to `product-images/branding/store-logo.*`.
  - Add file upload button with image preview in `website-settings-view.tsx`.

---

### 6. Minified React Error #441

- **Status:** DIAGNOSED
- **Underlying Exceptions Identified:**
  | Action | Underlying Exception | Cause |
  | :--- | :--- | :--- |
  | `createSupplierAdmin` | `PostgresError: column "contact_name" does not exist in relation "suppliers"` | Column mismatch in SQL insert. |
  | `createProductAdmin` | `ZodError: [ { "path": ["slug"], "message": "Required" } ]` | `slug` missing in UI payload. |
  | `updateSupplierAdmin` | `PostgresError: column "contact_name" does not exist in relation "suppliers"` | Column mismatch in SQL update. |
  | `getSettingsHistoryAction` | `AuthorizationError: Missing permission settings.read` | `settings.read` not in permissions table for non-owner staff. |

---

## Shared Causes & Architectural Pattern Fix

### Shared Root Cause:
All Server Actions that trigger Minified React Error #441 share the same architecture pattern: they use `throw new Error(...)` without catching and returning structured response envelopes. In Next.js 16 production builds, any uncaught error thrown in a Server Action is stripped of its error message and converted to Minified React Error #441 with a hash digest.

### Architectural Solution:
Standardize all Admin Server Actions to use the safe envelope pattern:
```typescript
export type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
```

---

## Safe Fix Implementation Order

1. **Step 1: Fix `supplier.actions.ts`** (Map `contact_person` column, remove `notes`, return safe error envelopes).
2. **Step 2: Fix `product.schema.ts` & `product.actions.ts`** (Make `slug` optional, relax `mainImage` URL validation for relative paths, return safe error envelopes).
3. **Step 3: Fix `website-settings-view.tsx` Location Controls** (Add `ALGERIA_WILAYAS` dropdown and Commune text input).
4. **Step 4: Implement Logo Upload** (Add `uploadStoreLogoAdmin` Server Action to `product-images/branding/` and wire file upload input in UI).
5. **Step 5: Typecheck, Test Suite (`npm run test:ts`), Build & Deploy to Vercel**.
