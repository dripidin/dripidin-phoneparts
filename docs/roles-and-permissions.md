# HamzaPhone - Roles, Permissions & Authorization Model

## 1. Overview & Security Paradigm

HamzaPhone enforces a strict **Dual-Layer Authorization Architecture**:
1. **Application Layer (Next.js 16 Server Actions / API Routes)**: Fast-fail validation checking user JWT claims, active session status, and resource-specific capabilities before executing domain logic.
2. **Database Layer (PostgreSQL Row Level Security - RLS)**: Absolute data-level isolation guaranteeing that even direct database queries or compromised server endpoints cannot bypass tenant or permission boundaries.

No security checks are delegated solely to client-side UI visibility.

---

## 2. Standard System Roles

The system is pre-configured with 10 standard roles catering to administrative staff, warehouse personnel, customer support, and storefront consumers:

| Role Identifier | Display Name | Target Persona | Scope & Responsibility |
| :--- | :--- | :--- | :--- |
| `OWNER` | Platform Owner | Business Founder / CTO | Unrestricted superuser access to all data, billing, secrets, staff user creation, and destructive system actions. |
| `ADMINISTRATOR` | Administrator | General Operations Manager | Full management across catalog, inventory, pricing, logistics, orders, and customer accounts; restricted from deleting the system or modifying Owner credentials. |
| `SALES_MANAGER` | Sales & Commercial Manager | Head of B2B & Retail Sales | Manages customer pricing contracts, approves B2B accounts, adjusts discount tiers, reviews sales analytics, and handles wholesale quotes. |
| `ORDER_MANAGER` | Order Fulfillment Officer | Fulfillment & Logistics Lead | Processes orders from `PENDING` to `READY_FOR_SHIPMENT`, generates courier manifests (EcoTrack), updates order details, and handles returns. |
| `INVENTORY_MANAGER`| Warehouse / Inventory Lead | Stockkeeper & Inbound Handler | Manages stock receiving, performs physical cycle counts, executes warehouse bin transfers, logs damaged write-offs, and manages suppliers. |
| `CONTENT_MANAGER` | Content & Catalog Specialist | E-Commerce Merchandiser | Creates and edits product descriptions, uploads galleries, manages compatibility trees, categories, brands, banners, and blog/FAQ pages. |
| `SUPPORT` | Customer Care Agent | Support Representative | Read-only access to customer profiles and orders; capable of creating order notes, resending tracking links, and initiating RMA requests. |
| `VIEWER` | Read-Only Auditor | External Accountant / Auditor | Global read-only access across catalog, reports, and financial logs with zero mutation privileges. |
| `B2B_CUSTOMER` | Verified B2B Partner | Repair Shop / Wholesale Buyer | Storefront access with verified wholesale pricing, tiered volume breaks, proforma generation, and B2B checkout. |
| `B2C_CUSTOMER` | Consumer Customer | Retail End-User | Standard storefront retail pricing, self-service order tracking, saved addresses, and profile management. |

---

## 3. Granular Permission Catalog

Permissions are formatted using standard dot-notation: `<resource>.<action>`.

### Product & Catalog (`products.*`, `categories.*`, `brands.*`)
* `products.read`: View product details, public specifications, and stock status.
* `products.create`: Create new product listings and compatibility mappings.
* `products.update`: Edit descriptions, images, dimensions, and general attributes.
* `products.delete`: Archive or soft-delete products.
* `products.import`: Upload and execute batch product imports (CSV/Excel).
* `products.export`: Export catalog data and compatibility lists.
* `products.bulk_update`: Perform mass category/status/attribute batch updates.
* `categories.manage`: Create, edit, re-order, and delete category hierarchies.
* `brands.manage`: Create and modify supported phone manufacturers and device models.

### Pricing Engine (`pricing.*`)
* `pricing.read`: View cost prices, supplier margins, and wholesale tiers.
* `pricing.update`: Modify individual product retail, sale, or B2B prices.
* `pricing.bulk_percentage`: Execute bulk percentage price increase/decrease operations.
* `pricing.b2b_tiers`: Configure discount percentages and thresholds for B2B tiers.
* `pricing.customer_override`: Set bespoke contract pricing for specific B2B clients.

### Inventory & Warehouse (`inventory.*`)
* `inventory.read`: View stock levels across physical, reserved, and available counts.
* `inventory.adjust`: Execute manual stock counts, write-offs, and bin relocations.
* `inventory.receive`: Process inbound supplier shipments and purchase orders.
* `inventory.export`: Export real-time stock and valuation ledgers.

### Orders & Fulfillment (`orders.*`, `delivery.*`)
* `orders.read`: View all customer orders, itemized lines, and fulfillment statuses.
* `orders.create`: Create manual phone/in-store backoffice orders on behalf of clients.
* `orders.update`: Modify recipient address, phone, or quantities before shipment.
* `orders.cancel`: Cancel active orders and release stock reservations.
* `orders.refund`: Issue financial refunds or store credits for returned merchandise.
* `delivery.dispatch`: Create shipment labels with EcoTrack / third-party couriers.
* `delivery.manage_rates`: Modify Wilaya and Commune shipping fee matrix.

### B2B & Customers (`customers.*`, `b2b.*`)
* `customers.read`: View registered customer profiles, contact info, and order histories.
* `customers.update`: Edit customer contact details or block fraudulent accounts.
* `b2b.approve`: Review and approve/reject pending B2B wholesale business applications.
* `b2b.manage_terms`: Assign credit limits and payment terms (e.g. Net-30).

### Governance, Administration & Audit (`users.*`, `settings.*`, `audit.*`)
* `users.manage`: Invite staff members, assign roles, and revoke administrative access.
* `settings.manage`: Update store contact info, EcoTrack API keys, and notification templates.
* `audit.read`: Inspect immutable activity logs and historical data diffs.

---

## 4. Role-Permission Evaluation Matrix

| Permission Key | OWNER | ADMIN | SALES | ORDER | INVENTORY | CONTENT | SUPPORT | VIEWER | B2B | B2C |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `products.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `products.create` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `products.update` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `products.delete` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `products.import` | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `products.export` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `products.bulk_update`| ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `pricing.read` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `pricing.update` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `pricing.bulk_percentage`| ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `pricing.b2b_tiers` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `inventory.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `inventory.adjust` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `inventory.receive`| ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `orders.read` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | Own | Own |
| `orders.create` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `orders.update` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `orders.cancel` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | Own | Own |
| `orders.refund` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `delivery.dispatch`| ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `b2b.approve` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `users.manage` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `settings.manage` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `audit.read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

---

## 5. PostgreSQL Row Level Security (RLS) Implementation Architecture

### Helper Function for Authorization Check
```sql
-- Function to retrieve current authenticated user role
CREATE OR REPLACE FUNCTION auth.get_user_role() 
RETURNS VARCHAR AS $$
    SELECT role FROM public.user_roles 
    WHERE user_id = auth.uid() 
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to verify if user has a specific granular permission
CREATE OR REPLACE FUNCTION auth.has_permission(required_permission VARCHAR) 
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.role_permissions rp
        JOIN public.user_roles ur ON ur.role = rp.role
        WHERE ur.user_id = auth.uid() 
          AND (rp.permission = required_permission OR rp.permission = 'all')
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### RLS Policies on `orders` Table
```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 1. Customers can view ONLY their own orders
CREATE POLICY "Customers can view own orders" 
ON orders FOR SELECT 
USING (
    customer_id = auth.uid() 
    OR 
    auth.has_permission('orders.read')
);

-- 2. Only authorized staff or active customer can create an order
CREATE POLICY "Authorized users can create orders" 
ON orders FOR INSERT 
WITH CHECK (
    customer_id = auth.uid() 
    OR 
    auth.has_permission('orders.create')
);

-- 3. Only Order Managers / Admins can modify order state
CREATE POLICY "Staff with permission can update orders" 
ON orders FOR UPDATE 
USING (
    auth.has_permission('orders.update')
)
WITH CHECK (
    auth.has_permission('orders.update')
);
```

### RLS Policies on `products` Table (Cost Price Shielding)
```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public/Customer select policy: Only active/visible products, cost prices hidden via view
CREATE POLICY "Public and Customers can view active products" 
ON products FOR SELECT 
USING (
    (is_visible = true AND status = 'ACTIVE') 
    OR 
    auth.has_permission('products.read')
);
```
