# HamzaPhone Storefront Phase 3: Commercial Purchasing Flow Architecture

## 1. Executive Summary

Storefront Phase 3 delivers the production-ready commercial purchasing flow for **HamzaPhone**, Algeria's specialized smartphone repair parts and accessories platform.

This phase transforms storefront visits into immutable, server-authoritative orders across all 58 Algerian Wilayas. It introduces transactional stock reservation, zero-trust price recalculation, double-entry inventory ledger integration, idempotent checkout submission, and dual-verification guest tracking.

---

## 2. Cart Architecture & Price Authority

### 2.1 Hybrid Cart Architecture
- **Client Cart Context** (`CartProvider`): Persists items in local storage for guest convenience, providing immediate responsiveness for additions, removals, and stepper adjustments.
- **Server Authority Guarantee**: The client cart is treated strictly as an untrusted wishlist. At cart drawer opening, cart page load, and order submission, the server re-queries active products, checks visibility, validates inventory, and determines authoritative unit prices via `CheckoutService.validateCart()`.

### 2.2 Dual B2C / B2B Price Evaluation
1. **B2C Consumers & Unauthenticated Guests**: Receive retail pricing (`b2c_price_dzd`) or active promotional sale pricing (`b2c_sale_price_dzd`).
2. **Approved B2B Accounts (`APPROVED`)**: Evaluated against `b2b_tier_prices` based on the workshop's assigned tier code (`TIER_1`, `TIER_GOLD`, etc.) and volume discount breaks.
3. **Pending / Rejected / Suspended B2B Accounts**: Strictly guarded from wholesale prices. The server automatically falls back to consumer retail prices and flags any discrepancies.

### 2.3 Live Discrepancy & Warning Detection
When server validation executes, the system detects:
- **Price Changes**: Notifies the user if a unit price changed since addition.
- **Stock Depletion**: Clamps requested quantity to `available_stock` or flags items as `OUT_OF_STOCK`.
- **Archived / Discontinued Products**: Flags products as `UNAVAILABLE` and prevents proceeding to checkout.

---

## 3. Checkout Workflow & Architecture

```
Product Page / Catalog
       ↓ (Add to Cart)
   Cart Drawer / Page (/cart)
       ↓ (validateCartAction)
  Checkout Multi-Step (/checkout)
   ├── Step 1: Customer Contact (Guest form OR Authenticated Profile)
   ├── Step 2: Shipping Address (58 Wilayas Selector OR Saved Address)
   ├── Step 3: Mode de Livraison (Domicile 24h-48h OR Point Relais Stopdesk)
   └── Step 4: Mode de Paiement (Cash on Delivery / Compte Crédit B2B)
       ↓ (submitCheckoutOrderAction with Idempotency Key)
  Transactional Order Creation & Double-Entry Stock Reservation
       ↓
  Order Confirmation (/checkout/confirmation) & Public Tracking (/track-order)
```

### 3.1 Step 1: Customer Information
- **Authenticated Customers**: Automatically loads user profile details, email, and phone.
- **Guest Customers**: Collects recipient name, primary Algerian phone (`05/06/07...`), optional secondary phone, and optional email for tracking receipts.

### 3.2 Step 2: Shipping Address (58 Algerian Wilayas)
- Natively supports all 58 Algerian Wilayas (`01 - Adrar` to `58 - El Meniaa`).
- Authenticated customers can pick from their saved address book or enter an alternative address.
- Exact shipping details are snapshotted into the order record upon creation (`shipping_address_line`, `wilaya_code`, `wilaya_name`, `commune_name`).

### 3.3 Step 3: Delivery Method & Algerian Wilaya Pricing
- **Domicile / Workshop Delivery (`HOME`)**:
  - Wilaya 16 (Alger): **400 DZD**
  - Other 57 Wilayas (01-15, 17-58): **600 DZD**
- **Stopdesk Desk Delivery (`DESK`)**:
  - Wilaya 16 (Alger): **300 DZD**
  - Other 57 Wilayas: **450 DZD**

### 3.4 Step 4: Cash on Delivery (COD) Payment Domain
- Default primary payment method: **Cash on Delivery (COD)** (`CASH_ON_DELIVERY`).
- Displays clear instructions in French: *"Paiement en espèces à la réception de votre colis."*
- Extensible payment model allows future activation of CIB/EDAHABIA online gateways and B2B credit accounts without altering the order schema.

---

## 4. Transactional Integrity & Double-Entry Stock Reservation

### 4.1 Atomic Stock Reservation
Order creation executes the following atomic sequence:
1. **Concurrency Check**: Re-queries `available_stock = stock_quantity - reserved_stock` for all items. If any item has insufficient stock, the transaction aborts with a descriptive out-of-stock message.
2. **Order Header Insertion**: Inserts order record into `orders` with initial status `PENDING` and payment status `UNPAID`.
3. **Historical Line Items Snapshot**: Inserts each item into `order_items` with SKU, product name, unit price, total price, and product type snapshot.
4. **Order Status History**: Records initial transition in `order_status_history` (`previous_status: null`, `new_status: 'PENDING'`).
5. **Double-Entry Stock Ledger**: Inserts a transaction into `inventory_transactions` (`transaction_type: 'RESERVATION'`, `reference_type: 'ORDER'`, `reference_id: order_number`) and increments `reserved_stock` in `products`.

### 4.2 Concurrency & Race Condition Protection
If two users attempt to purchase the last available unit of a product simultaneously:
- **User A**: Reserved stock updates from 0 to 1, order succeeds.
- **User B**: Server detects `available_stock = 0`, rejects checkout immediately with `"Le produit n'est plus disponible dans la quantité demandée"`.

### 4.3 Idempotency Strategy
- Client generates an idempotency key (`idem_<timestamp>_<random>`) on checkout mount.
- If a user double-clicks the confirmation button or a network retry occurs, the server retrieves the cached result within the 60-second window, preventing duplicate order generation.

---

## 5. Order Identifiers & Dual-Verification Tracking

### 5.1 Order Numbering
- Generates human-friendly, unique order numbers: `HP-YYYY-XXXXXX` (e.g., `HP-2026-839201`).
- Completely decoupled from internal database UUIDs.

### 5.2 Dual-Verification Guest Tracking
- Guest orders cannot be queried by order number alone (preventing order scanning).
- Each order generates a cryptographically secure 32-character hexadecimal `tracking_token`.
- Guest tracking (`/track-order`) and order lookup (`lookupGuestOrderAction`) require **both** `order_number` and `tracking_token`.

---

## 6. Implemented Routes & Components

| Route / Component | Purpose & Description |
| :--- | :--- |
| `/cart` (`cart-page-view.tsx`) | Mobile-first full cart page with quantity steppers, live server sync, 58-Wilaya delivery calculator, and checkout CTA. |
| `cart-drawer.tsx` | Slide-over drawer with real-time price/stock warnings and direct checkout link. |
| `/checkout` (`checkout-shell.tsx`) | Multi-step purchasing wizard integrating contact, address, delivery, payment, and sticky order summary. |
| `/checkout/confirmation` (`order-confirmation-view.tsx`) | Post-purchase celebration page with order number copy tool, COD payment instructions, and direct tracking links. |
| `/track-order` (`guest-tracking-view.tsx`) | Dual-verification order status tracking portal with 4-step delivery timeline. |
| `checkout.service.ts` | Backend service for authoritative cart validation, order creation, and stock reservation. |
| `checkout.actions.ts` | Server Actions for validating cart, submitting orders, and guest order lookup. |

---

## 7. Automated Test Coverage & Verification

| Test Area | Suite / Tests | Result |
| :--- | :--- | :--- |
| **Purchasing Flow & Checkout Engine** | `checkout.test.ts` (7 tests) | **Passed** (Cart validation, B2B wholesale pricing, atomic reservation, concurrency protection, idempotency, dual-token tracking) |
| **All Test Suites** | 31 test suites (80 total tests) | **80/80 passed (100%)** |
| **TypeScript Compilation** | `tsc --noEmit` | **0 errors, clean build** |
| **Next.js Production Build** | `next build` | **21 routes compiled successfully in 14.3s** |

---

## 8. Out-of-Scope Deferred Integrations

As specified in project guidelines, the following integrations are intentionally deferred to future delivery phases:
1. Direct EcoTrack API webhook endpoints and live courier label printing.
2. CIB / EDAHABIA payment gateway certification with SATIM.
3. SMS / WhatsApp transactional messaging dispatch.
