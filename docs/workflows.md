# HamzaPhone - Operational & Technical Workflows

## 1. B2C Storefront Discovery & Checkout Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Customer as B2C Customer
    participant UI as Storefront (Next.js 16)
    participant Search as Instant Search API
    participant Cart as Session Cart (Cookie/DB)
    participant Server as Order Server Action
    participant DB as PostgreSQL Database
    participant SMS as SMS/WhatsApp Hub

    Customer->>UI: Types "Samsung S21 screen" in search bar
    UI->>Search: Debounced query (150ms)
    Search-->>UI: Returns instant matches (OLED, Service Pack, In-Stock)
    Customer->>UI: Selects item -> Chooses Wilaya & Commune
    Customer->>Cart: Add to Cart (Calculates shipping for Wilaya)
    Customer->>UI: Proceeds to Checkout (Guest or Logged In)
    Customer->>UI: Fills Phone, Name & Delivery Address
    Customer->>Server: Submit Order (Paiement à la livraison - COD)
    
    rect rgb(240, 248, 255)
        Note over Server, DB: Atomic Stock Reservation
        Server->>DB: Check Available Stock >= Qty
        Server->>DB: Lock Product Row (SELECT ... FOR UPDATE)
        Server->>DB: Insert Order (Status: PENDING)
        Server->>DB: Insert Order Items
        Server->>DB: Insert InventoryTransaction (Type: RESERVATION)
        Server->>DB: Update Products (reserved_stock += Qty)
    end
    
    Server->>SMS: Dispatch confirmation SMS with Guest Tracking URL
    SMS-->>Customer: SMS received with tracking link (e.g. /track?order=HP-2026-0041)
    Server-->>UI: Redirect to Order Success Page with live status tracker
```

---

## 2. B2B Wholesale Portal & Quick Bulk Order Workflow

Repair shops and corporate wholesale clients require a fast ordering interface where they do not have to browse consumer product pages one-by-one.

```mermaid
sequenceDiagram
    autonumber
    actor Tech as Repair Shop Technician
    participant B2B as B2B Portal (Matrix View)
    participant Server as B2B Order Action
    participant DB as PostgreSQL Database

    Tech->>B2B: Logs into verified B2B Account
    B2B->>Server: Fetch Catalog with User's Assigned Tier Prices
    Server->>DB: Query Products + b2b_tier_prices + customer_specific_prices
    DB-->>B2B: Render Quick-Order Data Grid (SKU, Name, Model, Tier Price, Available Stock, Qty Input)
    
    Tech->>B2B: Rapidly enters quantities using Tab + Number keys
    Tech->>B2B: OR Pastes CSV list: "HP-SCR-SAM-S21, 5 \n HP-BAT-IPH-13, 10"
    B2B->>B2B: Validates minimum order value (15,000 DZD)
    Tech->>Server: Place Wholesale Order (Payment: Net-30 Account Credit or COD)
    Server->>DB: Atomic Order Insertion + Reserved Stock Increment
    Server-->>Tech: Generates downloadable PDF Proforma / Bon de Commande
```

---

## 3. Order Fulfillment & EcoTrack Courier Dispatch Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Warehouse as Warehouse Staff
    participant Admin as Admin Dashboard
    participant DB as PostgreSQL Database
    participant EcoTrack as EcoTrack API
    actor Courier as EcoTrack Courier Driver

    Warehouse->>Admin: Opens Orders Module -> Filters "CONFIRMED"
    Warehouse->>Admin: Selects 15 Orders -> Clicks "Batch Pick & Pack"
    Admin->>DB: Update Status to "PROCESSING"
    Admin-->>Warehouse: Prints combined Warehouse Pick List sorted by Bin
    
    Warehouse->>Admin: Scans packed parcels -> Clicks "Generate Courier Manifest"
    Admin->>EcoTrack: POST /api/v1/create_shipment (Array of orders + COD Amounts)
    EcoTrack-->>Admin: Returns Tracking Numbers + PDF Shipping Labels (A6 format)
    
    Admin->>DB: Update Orders (Status: READY_FOR_SHIPMENT, tracking_number = eco_track_code)
    Warehouse->>Warehouse: Sticks A6 barcode labels on parcel boxes
    
    Courier->>Warehouse: Arrives for daily pickup
    Warehouse->>Courier: Hands over parcels + Signs EcoTrack Manifest
    Admin->>DB: Status transitions to "SHIPPED"
    
    Note over EcoTrack, DB: Real-Time Webhook Lifecycle
    EcoTrack->>Admin: Webhook: Status -> "DELIVERED" (COD collected)
    Admin->>DB: Update Order Status -> "DELIVERED", Payment -> "PAID"
    Admin->>DB: Deduct Physical Stock (`current_stock -= Qty`, `reserved_stock -= Qty`)
```

---

## 4. Bulk Percentage Price Adjustment Pipeline

To handle supplier cost fluctuations or currency shifts in Algeria, administrators can adjust prices across thousands of items in seconds with zero downtime and complete auditability:

```mermaid
graph TD
    Step1[1. Configure Scope] -->|Select: All / Supplier / Brand / Category| Step2[2. Set Parameters]
    Step2 -->|Input: Target Field e.g. B2B Price, Delta: +8%, Rounding: Nearest 10 DZD| Step3[3. Compute Preview Snapshot]
    Step3 -->|Generate preview table of before vs after| Step4{4. Validate Integrity}
    Step4 -->|Error: Selling price below cost margin| Step5[Flag Warning & Block / Request Override]
    Step4 -->|Pass: All constraints met| Step6[5. Confirmation Modal with 2FA/Password]
    Step6 -->|Admin confirms| Step7[6. Atomic PostgreSQL Transaction]
    Step7 -->|Apply updates to products table| Step8[7. Insert Price History & Audit Log Records]
    Step8 -->|Invalidate cache tags| Step9[8. Realtime Storefront Sync Complete]
```

---

## 5. Supplier Catalog Import & Automated Price Sync Pipeline

When receiving updated price catalogs from Shenzhen or local distributors (often 10,000+ rows in `.xlsx` format):

1. **Upload & Parse**: Admin drags spreadsheet to the Import Module. File is parsed in a Web Worker / streaming Node chunk.
2. **Schema & SKU Matching**: System matches incoming rows by `supplier_sku`, `barcode`, or internal `sku`.
3. **Diff Calculation**:
   * **New SKUs**: Staged for review with default category assignments.
   * **Price Changes**: Highlights old cost vs new cost, computes expected margin impacts on B2C and B2B selling prices.
   * **Stock Quantity Adjustments**: Differentiates between price-only updates and inventory restocks.
4. **Validation Report**: Rejects malformed rows (missing prices, negative quantities, invalid characters) with line-by-line downloadable error logs.
5. **Execution**: On approval, runs batch `UPSERT` queries within an isolated transaction.
