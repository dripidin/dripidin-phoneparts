-- HamzaPhone Migration 00002: Auth, RBAC, Users, Businesses & Addresses

-- 1. Profiles Table (Linked 1-to-1 with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150),
    phone VARCHAR(32),
    phone_secondary VARCHAR(32),
    avatar_url TEXT,
    user_type user_type NOT NULL DEFAULT 'B2C',
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_phone ON public.profiles(phone);
CREATE INDEX idx_profiles_user_type ON public.profiles(user_type);

-- 2. Roles Definition Table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) UNIQUE NOT NULL, -- e.g. 'OWNER', 'ADMINISTRATOR', 'SALES_MANAGER', 'B2C_CUSTOMER', 'B2B_CUSTOMER'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Granular Permissions Table
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) UNIQUE NOT NULL, -- e.g. 'products.read', 'pricing.bulk_percentage', 'b2b.approve'
    resource VARCHAR(64) NOT NULL,     -- e.g. 'products', 'orders', 'pricing', 'b2b', 'inventory'
    action VARCHAR(64) NOT NULL,       -- e.g. 'read', 'create', 'update', 'delete', 'approve'
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_permissions_resource ON public.permissions(resource);

-- 4. Role-Permission Cross-Reference
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);
CREATE INDEX idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON public.role_permissions(permission_id);

-- 5. User-Role Assignment
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role_id);

-- 6. Businesses & B2B Profiles
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    trade_name VARCHAR(200),
    rc_number VARCHAR(64),           -- Registre de Commerce
    nif VARCHAR(64),                 -- Numéro d'Identification Fiscale
    nis VARCHAR(64),                 -- Numéro d'Identification Statistique
    article_imposition VARCHAR(64),  -- AI
    address_line TEXT,
    wilaya_code INTEGER NOT NULL,    -- 1 to 58
    wilaya_name VARCHAR(64) NOT NULL,
    commune_name VARCHAR(100) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(255),
    status b2b_status NOT NULL DEFAULT 'PENDING',
    tier_code VARCHAR(32) NOT NULL DEFAULT 'TIER_1',
    credit_limit_dzd NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    current_balance_dzd NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    payment_terms VARCHAR(32) NOT NULL DEFAULT 'CASH_ON_DELIVERY', -- 'CASH_ON_DELIVERY', 'NET_30', 'PREPAID'
    document_urls TEXT[] DEFAULT '{}',
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_businesses_status ON public.businesses(status);
CREATE INDEX idx_businesses_wilaya ON public.businesses(wilaya_code);
CREATE INDEX idx_businesses_rc ON public.businesses(rc_number);

-- 7. B2B Business Membership (Users belonging to a business entity)
CREATE TABLE IF NOT EXISTS public.business_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_in_business VARCHAR(64) NOT NULL DEFAULT 'OWNER', -- 'OWNER', 'TECHNICIAN', 'PURCHASER'
    is_primary_contact BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, user_id)
);
CREATE INDEX idx_business_members_business ON public.business_members(business_id);
CREATE INDEX idx_business_members_user ON public.business_members(user_id);

-- 8. Customer Saved Addresses
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    address_type address_type NOT NULL DEFAULT 'HOME',
    title VARCHAR(100) NOT NULL DEFAULT 'Mon adresse', -- e.g. 'Atelier Centre-ville', 'Maison'
    recipient_name VARCHAR(150) NOT NULL,
    recipient_phone VARCHAR(32) NOT NULL,
    recipient_phone_secondary VARCHAR(32),
    address_line TEXT NOT NULL,
    wilaya_code INTEGER NOT NULL,          -- 1 to 58
    wilaya_name VARCHAR(64) NOT NULL,
    commune_name VARCHAR(100) NOT NULL,
    postal_code VARCHAR(16),
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT address_owner_check CHECK (user_id IS NOT NULL OR business_id IS NOT NULL)
);
CREATE INDEX idx_addresses_user ON public.addresses(user_id);
CREATE INDEX idx_addresses_business ON public.addresses(business_id);
CREATE INDEX idx_addresses_wilaya ON public.addresses(wilaya_code);

-- 9. Automatic Profile & B2C Role Creation Trigger on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, user_type)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'B2C'::user_type)
    );

    -- Assign default role based on user_type
    SELECT id INTO default_role_id 
    FROM public.roles 
    WHERE code = CASE 
        WHEN (NEW.raw_user_meta_data->>'user_type') = 'B2B' THEN 'B2B_CUSTOMER'
        ELSE 'B2C_CUSTOMER'
    END
    LIMIT 1;

    IF default_role_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES (NEW.id, default_role_id)
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger hook on auth.users (Executed only when auth schema exists)
DO $$ BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION
    WHEN undefined_table THEN null;
END $$;
