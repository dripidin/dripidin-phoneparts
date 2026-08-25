-- HamzaPhone Migration 00001: Extensions and Domain Enums

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- 2. Domain Enums

-- User & Profile Types
DO $$ BEGIN
    CREATE TYPE user_type AS ENUM ('B2C', 'B2B', 'STAFF');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE b2b_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE address_type AS ENUM ('HOME', 'WORK', 'WORKSHOP', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Product & Catalog Types
DO $$ BEGIN
    CREATE TYPE product_type AS ENUM (
        'OEM_ORIGINAL',
        'SERVICE_PACK',
        'REFURBISHED',
        'HIGH_COPY',
        'AFTERMARKET',
        'ACCESSORY',
        'TOOL'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE product_status AS ENUM (
        'ACTIVE',
        'DRAFT',
        'ARCHIVED',
        'DISCONTINUED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Inventory Types
DO $$ BEGIN
    CREATE TYPE inventory_transaction_type AS ENUM (
        'RECEIVING',            -- Inbound purchase order from supplier
        'RESERVATION',          -- Customer placed order (current untouched, reserved +N, available -N)
        'RESERVATION_RELEASE',  -- Order cancelled/expired (reserved -N, available +N)
        'FULFILLMENT_OUT',      -- Order packed & shipped (current -N, reserved -N)
        'MANUAL_ADJUSTMENT',    -- Stock count correction / audit adjustment
        'DAMAGED_WRITEOFF',     -- Defective screen/part removed from stock
        'CUSTOMER_RETURN_RESTOCK', -- Returned working part added back
        'SUPPLIER_RETURN'       -- Defective part returned to supplier (RMA)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Orders & Logistics Types
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'PENDING',
        'CONFIRMED',
        'PROCESSING',
        'READY_FOR_SHIPMENT',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED',
        'FAILED',
        'RETURNED',
        'REFUNDED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM (
        'CASH_ON_DELIVERY',
        'CIB_EDAHABIA',
        'BANK_TRANSFER',
        'B2B_CREDIT_ACCOUNT'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM (
        'UNPAID',
        'AUTHORIZED',
        'PAID',
        'PARTIALLY_REFUNDED',
        'REFUNDED',
        'FAILED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delivery_type AS ENUM (
        'HOME',     -- À domicile
        'DESK'      -- Point relais / Stop Desk
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delivery_status AS ENUM (
        'PENDING',
        'PICKED_UP',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'FAILED',
        'RETURNED',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Notification Types
DO $$ BEGIN
    CREATE TYPE notification_channel AS ENUM ('SMS', 'WHATSAPP', 'EMAIL', 'IN_APP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_status AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
