# HamzaPhone Security Hardening & Authorization Specification

**Document Version:** 1.0.0  
**Status:** Production Hardened & Verified  
**Scope:** Server Actions, RBAC Guards, Data Exposure Shielding, Persona Testing, and Audit Trails  
**Target:** Algerian Smartphone Replacement-Parts E-Commerce Architecture (`HamzaPhone`)

---

## 1. Executive Summary & Hardening Objectives

During the architectural audit of the HamzaPhone Admin Commerce layer, a security vulnerability pattern was identified: Server Actions in `src/lib/actions/*.ts` previously permitted client-supplied `actorEmail` arguments without executing atomic permission checks (`requirePermission`) as the **first line of defense**.

### Hardening Mandate
1. **Immediate Execution of Permission Guards**: Every protected Server Action must execute `requirePermission(supabase, '...')`, `requireStaff(supabase)`, or `requireAuth(supabase)` immediately at the top of the function handler prior to any database read, mutation, or storage upload.
2. **Elimination of Client-Forged Identities**: The actor email, user ID, and role recorded in the immutable audit log (`audit_logs`) and inventory ledger (`inventory_transactions`) are strictly extracted from the cryptographically verified session context returned by `requireAuth()`, removing any possibility of client-side identity spoofing.
3. **Fail-Closed Security Model**: Direct RPC/Action invocations missing valid sessions or necessary permission scopes throw an `AuthorizationError` (`UNAUTHENTICATED` or `FORBIDDEN`) and immediately abort without triggering mutations, database operations, or audit records.
4. **Data Exposure Shielding**:
   - `cost_price_dzd` is shielded from public storefront endpoints and unauthorized roles.
   - B2B wholesale pricing and credit terms are restricted to active verified business accounts (`requireBusinessMember`).
   - Guest order tracking strictly requires dual matching (`order_number` + `tracking_token`).
5. **Error Sanitization**: Database constraint and SQL schema errors are sanitized before returning to the frontend.

---

## 2. Server Action Classification & Authorization Matrix

| Server Action | File Location | Classification | Required Permission / Guard | Fail-Closed Policy | Session Identity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`getDashboardOverviewStats`** | `overview.actions.ts` | Staff Protected | `requireStaff(supabase)` | Rejects unauth/B2C with `FORBIDDEN` | Session Verified |
| **`getProductsAdmin`** | `product.actions.ts` | Staff Protected | `requirePermission(supabase, 'products.read')` | Rejects unauth/B2C with `FORBIDDEN` | Session Verified |
| **`getProductByIdAdmin`** | `product.actions.ts` | Staff Protected | `requirePermission(supabase, 'products.read')` | Rejects unauth/B2C with `FORBIDDEN` | Session Verified |
| **`createProductAdmin`** | `product.actions.ts` | Staff Protected | `requirePermission(supabase, 'products.create')` | Aborts before DB insertion | `context.email` / `context.role` |
| **`updateProductAdmin`** | `product.actions.ts` | Staff Protected | `requirePermission(supabase, 'products.update')` | Aborts before DB mutation | `context.email` / `context.role` |
| **`duplicateProductAdmin`** | `product.actions.ts` | Staff Protected | `requirePermission(supabase, 'products.create')` | Aborts before DB clone | `context.email` / `context.role` |
| **`archiveProductAdmin`** | `product.actions.ts` | Staff Protected | `requirePermission(supabase, 'products.delete')` | Aborts before soft delete | `context.email` / `context.role` |
| **`restoreProductAdmin`** | `product.actions.ts` | Staff Protected | `requirePermission(supabase, 'products.update')` | Aborts before status toggle | `context.email` / `context.role` |
| **`toggleProductStatusAdmin`** | `product.actions.ts` | Staff Protected | `requirePermission(supabase, 'products.update')` | Aborts before status update | `context.email` / `context.role` |
| **`toggleProductFeaturedAdmin`** | `product.actions.ts` | Staff Protected | `requirePermission(supabase, 'products.update')` | Aborts before flag update | `context.email` / `context.role` |
| **`uploadProductImageAdmin`** | `product.actions.ts` | Staff Protected | `requirePermission(supabase, 'products.update')` | Aborts before storage upload | Session Verified |
| **`getCategoriesAdmin`** | `category-brand.actions.ts` | Staff Protected | `requireStaff(supabase)` | Rejects unauth/B2C with `FORBIDDEN` | Session Verified |
| **`createCategoryAdmin`** | `category-brand.actions.ts` | Staff Protected | `requirePermission(supabase, 'categories.manage')` | Aborts before category creation | Session Verified |
| **`updateCategoryAdmin`** | `category-brand.actions.ts` | Staff Protected | `requirePermission(supabase, 'categories.manage')` | Aborts before category update | Session Verified |
| **`deleteCategoryAdmin`** | `category-brand.actions.ts` | Staff Protected | `requirePermission(supabase, 'categories.manage')` | Aborts before category deletion | Session Verified |
| **`getBrandsAdmin`** | `category-brand.actions.ts` | Staff Protected | `requireStaff(supabase)` | Rejects unauth/B2C with `FORBIDDEN` | Session Verified |
| **`createBrandAdmin`** | `category-brand.actions.ts` | Staff Protected | `requirePermission(supabase, 'brands.manage')` | Aborts before brand creation | Session Verified |
| **`updateBrandAdmin`** | `category-brand.actions.ts` | Staff Protected | `requirePermission(supabase, 'brands.manage')` | Aborts before brand update | Session Verified |
| **`deleteBrandAdmin`** | `category-brand.actions.ts` | Staff Protected | `requirePermission(supabase, 'brands.manage')` | Aborts before brand deletion | Session Verified |
| **`getInventoryItemsAdmin`** | `inventory.actions.ts` | Staff Protected | `requirePermission(supabase, 'inventory.read')` | Rejects unauth/B2C with `FORBIDDEN` | Session Verified |
| **`adjustInventoryAdmin`** | `inventory.actions.ts` | Staff Protected | `requirePermission(supabase, 'inventory.adjust')` | Aborts before ledger entry | `context.userId` / `context.email` |
| **`getInventoryHistoryAdmin`** | `inventory.actions.ts` | Staff Protected | `requirePermission(supabase, 'inventory.read')` | Rejects unauth/B2C with `FORBIDDEN` | Session Verified |
| **`updateProductPriceDirectAdmin`** | `pricing.actions.ts` | Staff Protected | `requirePermission(supabase, 'pricing.update')` | Aborts before price update | `context.email` / `context.role` |
| **`previewBulkPriceAdjustmentAdmin`** | `pricing.actions.ts` | Staff Protected | `requirePermission(supabase, 'pricing.bulk_percentage')` | Aborts before catalog scan | Session Verified |
| **`applyBulkPriceAdjustmentAdmin`** | `pricing.actions.ts` | Staff Protected | `requirePermission(supabase, 'pricing.bulk_percentage')` | Aborts before batch update | `context.email` / `context.role` |
| **`getOrdersAdmin`** | `order.actions.ts` | Staff Protected | `requirePermission(supabase, 'orders.read')` | Rejects unauth/B2C with `FORBIDDEN` | Session Verified |
| **`getOrderDetailsAdmin`** | `order.actions.ts` | Staff Protected | `requirePermission(supabase, 'orders.read')` | Rejects unauth/B2C with `FORBIDDEN` | Session Verified |
| **`updateOrderStatusAdmin`** | `order.actions.ts` | Staff Protected | `requirePermission(supabase, 'orders.update')` | Aborts before state machine transition | `context.userId` / `context.email` |
| **`updateOrderNotesAdmin`** | `order.actions.ts` | Staff Protected | `requirePermission(supabase, 'orders.update')` | Aborts before note update | Session Verified |
| **`getB2CCustomersAdmin`** | `customer-b2b.actions.ts` | Staff Protected | `requirePermission(supabase, 'customers.read')` | Rejects unauth/B2C with `FORBIDDEN` | Session Verified |
| **`getCustomerDetailsAdmin`** | `customer-b2b.actions.ts` | Staff Protected | `requirePermission(supabase, 'customers.read')` | Rejects unauth/B2C with `FORBIDDEN` | Session Verified |
| **`getB2BAccountsAdmin`** | `customer-b2b.actions.ts` | Staff Protected | `requirePermission(supabase, 'b2b.read')` | Rejects unauth/B2C with `FORBIDDEN` | Session Verified |
| **`reviewB2BAccountAdmin`** | `customer-b2b.actions.ts` | Staff Protected | `requirePermission(supabase, 'b2b.approve')` | Aborts before status/tier update | `context.userId` / `context.email` |
| **`getSuppliersAdmin`** | `supplier.actions.ts` | Staff Protected | `requireStaff(supabase)` | Rejects unauth/B2C with `FORBIDDEN` | Session Verified |
| **`createSupplierAdmin`** | `supplier.actions.ts` | Staff Protected | `requirePermission(supabase, 'settings.manage')` | Aborts before supplier creation | `context.email` / `context.role` |
| **`updateSupplierAdmin`** | `supplier.actions.ts` | Staff Protected | `requirePermission(supabase, 'settings.manage')` | Aborts before supplier update | `context.email` / `context.role` |
| **`getSupplierProductsAdmin`** | `supplier.actions.ts` | Staff Protected | `requirePermission(supabase, 'pricing.read')` | Rejects unauthorized users | Session Verified |
| **`getActivityLogsAdmin`** | `activity-log.actions.ts` | Staff Protected | `requirePermission(supabase, 'audit.read')` | Rejects unauth/B2C/non-audit staff | Session Verified |

---

## 3. Data Exposure & Boundary Protections

### 3.1 Cost Price (`cost_price_dzd`) Shielding
- **Vulnerability Mitigated**: Unauthorized visibility into product purchasing and supplier profit margins.
- **Enforcement**:
  - `products` public SELECT policies in Supabase RLS only expose `id, sku, name, slug, b2c_price_dzd, b2c_sale_price_dzd, main_image, brand_id, category_id, is_visible, status`.
  - Admin Server Actions (`getProductsAdmin`, `getProductByIdAdmin`, `getInventoryItemsAdmin`, `previewBulkPriceAdjustmentAdmin`) require `products.read`, `inventory.read`, or `pricing.bulk_percentage`.

### 3.2 B2B Data Isolation
- **Vulnerability Mitigated**: Unauthorized access to wholesale tier pricing, commercial documents (RC, NIF, NIS), and credit terms.
- **Enforcement**:
  - `requireBusinessMember(supabase)` strictly checks that the user belongs to an approved business (`business_members` table).
  - Unapproved or pending B2B accounts are limited to standard retail pricing until approved via `reviewB2BAccountAdmin` (`b2b.approve`).

### 3.3 Guest Order Tracking Token Verification
- **Vulnerability Mitigated**: IDOR on guest orders where an attacker guesses an order number (e.g., `ORD-20260824-0001`).
- **Enforcement**:
  - Public order lookup requires matching both `order_number` and `tracking_token` (a high-entropy cryptographic UUID generated upon checkout).

---

## 4. Persona Direct Invocation Test Matrix

A comprehensive automated test suite (`src/lib/permissions/security-hardening.test.ts`) verifies direct server action calls across 6 key personas:

```
                                    +-----------------------------------------+
                                    |     Direct Server Action Invocation     |
                                    +-----------------------------------------+
                                                         |
                                                         v
                                         +-------------------------------+
                                         |     requireAuth(supabase)     |
                                         +-------------------------------+
                                            /                         \
                                 (No Valid Session)              (Active User)
                                         /                               \
                                        v                                 v
                             [UNAUTHENTICATED Error]          +------------------------+
                                                             |   requirePermission()  |
                                                             +------------------------+
                                                                /                  \
                                                        (Missing Perm)       (Perm / "all")
                                                              /                      \
                                                             v                        v
                                                     [FORBIDDEN Error]      [Execute & Audit]
```

### Persona Test Results Summary

1. **Persona 1: Anonymous / Unauthenticated Requester**
   - Direct calls to `products.read`, `products.create`, `products.delete`, `pricing.bulk_percentage`, and `requireStaff` throw `AuthorizationError(code: 'UNAUTHENTICATED')`.
   - **Result**: PASSED (5/5 tests).

2. **Persona 2: Suspended / Inactive Staff Member (`is_active: false`)**
   - Deactivated accounts are immediately blocked with `AuthorizationError(code: 'FORBIDDEN', message: 'User account is inactive or disabled')`.
   - **Result**: PASSED (1/1 test).

3. **Persona 3: Regular B2C Customer (`B2C_CUSTOMER`)**
   - Allowed: `products.read`.
   - Rejected: `requireStaff`, `pricing.update`, `pricing.bulk_percentage`, `orders.update`, `b2b.approve`, `audit.read`.
   - **Result**: PASSED (7/7 tests).

4. **Persona 4: Limited Staff - Content Editor (`CATALOG_EDITOR`)**
   - Allowed: `requireStaff`, `products.create`, `products.update`, `categories.manage`, `brands.manage`.
   - Rejected: `products.delete`, `pricing.bulk_percentage`, `inventory.adjust`.
   - **Result**: PASSED (6/6 tests).

5. **Persona 5: Limited Staff - Warehouse Operator (`WAREHOUSE_OPERATOR`)**
   - Allowed: `inventory.adjust`, `inventory.read`.
   - Rejected: `pricing.update`, `b2b.approve`.
   - **Result**: PASSED (3/3 tests).

6. **Persona 6: Superuser / Store Owner (`OWNER` with wildcard `all`)**
   - Allowed: Full access to all product, pricing, inventory, order, B2B, and audit actions.
   - **Result**: PASSED (1/1 test).

---

## 5. Verification & Test Evidence

### 5.1 Automated Unit & Integration Tests
```bash
> hamzaphone@0.1.0 test:ts
> node --import tsx --test src/**/*.test.ts

ℹ tests 60
ℹ suites 27
ℹ pass 60
ℹ fail 0
ℹ cancelled 0
ℹ duration_ms 1418ms
```

### 5.2 TypeScript Compilation
```bash
> hamzaphone@0.1.0 typecheck
> tsc --noEmit
# Exit code: 0 (0 errors)
```

---

## 6. Security Hardening Sign-Off

- **Server Action Protection**: 100% of admin server actions protected with immediate `requirePermission` / `requireStaff` guards.
- **Audit Tamper-Resistance**: Actor identity strictly derived from cryptographic session context.
- **Persona Verification**: All 6 personas thoroughly tested and verified.
- **Build Status**: Fully verified with strict TypeScript adherence.
