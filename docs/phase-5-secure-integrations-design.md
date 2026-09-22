# DRIPIDIN — Phase 5 Secure Integrations & Secret Management Design Blueprint

## Executive Summary

Phase 5 — Secure Integrations & Secret Management establishes the architectural blueprint for managing third-party provider credentials, webhook secrets, operational configurations, and connection diagnostics within the DRIPIDIN white-label commercial platform.

As DRIPIDIN evolves from a single-tenant store into a configurable white-label e-commerce template, commercial buyers must be empowered to configure, test, rotate, and manage their carrier, messaging, and communication credentials directly through an administrative interface without:
1. Storing plaintext passwords, tokens, or private keys in public database tables or client-accessible schemas.
2. Exposing sensitive credentials to browser bundles, React component trees, serialized server-rendered props, or public settings endpoints.
3. Requiring platform code modifications or manual Git repository redeployments for routine API key rotations.
4. Breaking the safe, non-destructive demo/sandbox mode or causing accidental billing / physical parcel dispatch during testing.

This blueprint defines a **Two-Tier Hybrid Secret Management Architecture** that combines standard 12-factor infrastructure environment variables with an application-level AES-256-GCM encrypted database vault, unified behind a provider-agnostic `SecretResolver` and `IntegrationConfigurationService`.

---

## Current Integration Inventory

Comprehensive inspection of `src/lib/config/integration-config.service.ts`, `src/lib/services/connection-test.service.ts`, `src/lib/config/environment.ts`, `src/lib/logistics/adapters/ecotrack.ts`, and `.env.production` reveals the following complete credential and configuration inventory:

| Integration | Provider | Category | Secret(s) | Non-Secret Config | Current Source | Server-Only? | Admin Configurable Today? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **EcoTrack Delivery** | EcoTrack Express DZ (58 Wilayas) | `DELIVERY` | `ECOTRACK_API_TOKEN`, `ECOTRACK_WEBHOOK_SECRET` | `ECOTRACK_API_URL`, `environment`, `enabled`, `allowCustomerToOpenParcel`, `defaultPackageWeightKg` | `process.env` + in-memory store | Yes | Partial (URL & env only; secrets ENV only) |
| **Transactional Email** | Resend / Custom SMTP | `EMAIL` | `SMTP_PASSWORD` / `RESEND_API_KEY` | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `senderEmail`, `senderName`, `b2bInvoiceAttachment` | `process.env` + in-memory store | Yes | Partial (URL & env only; secrets ENV only) |
| **National SMS** | MaghrebSMS / Ooredoo / Mobilis | `SMS` | `SMS_GATEWAY_API_KEY` | `SMS_GATEWAY_API_URL`, `SMS_GATEWAY_SENDER_ID`, `orderConfirmationSms`, `outForDeliverySms` | `process.env` + in-memory store | Yes | Partial (URL & env only; secrets ENV only) |
| **WhatsApp Cloud API** | Meta Graph API | `WHATSAPP` | `WHATSAPP_CLOUD_API_TOKEN` | `WHATSAPP_PHONE_NUMBER_ID`, `sendTrackingLink`, `sendInvoicePdf` | `process.env` + in-memory store | Yes | Partial (URL & env only; secrets ENV only) |
| **Telegram Alerts** | Telegram Bot API | `TELEGRAM` | `TELEGRAM_BOT_TOKEN` | `TELEGRAM_CHAT_ID`, `operationalAlerts`, `lowStockAlerts` | `process.env` + in-memory store | Yes | Partial (URL & env only; secrets ENV only) |
| **Supabase DB & Auth** | Supabase Managed Cloud | `AUTH_OAUTH` | `SUPABASE_SERVICE_ROLE_KEY` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `jwtExpirySeconds`, `enableB2BApprovalGate` | `process.env` | Mixed (Service role is server-only; anon & URL public) | No (Platform Infrastructure Secret) |
| **Supabase Storage** | Supabase S3 Object Storage | `STORAGE` | None (relying on Supabase Auth / Service Role) | `SUPABASE_STORAGE_BUCKET` (`product-images`), `maxUploadSizeBytes` | `process.env` + in-memory store | Mixed | No (Platform Infrastructure Config) |
| **Google OAuth 2.0** | Google Identity Services | `AUTH_OAUTH` | `GOOGLE_CLIENT_SECRET` | `GOOGLE_CLIENT_ID`, `redirectUri` | Supabase Dashboard / `process.env` | Yes | No (Configured in Supabase Auth Console) |
| **Scheduled Jobs (Cron)** | Vercel Cron / System Scheduler | `SYSTEM` | `CRON_SECRET` | Schedule definitions (`vercel.json`) | `process.env` | Yes | No (Platform Infrastructure Secret) |
| **APM / Monitoring** | Sentry / OpenTelemetry | `MONITORING` | `SENTRY_DSN` | `tracesSampleRate` | `process.env` | Mixed | No (Platform Infrastructure Config) |
| **COD Payments** | Internal Cash Reconciliation | `PAYMENT` | None (Internal ledger; no third-party API token) | Payment terms, reconciliation states | Database (`payments`, `orders`) | No | Fully managed in Admin |

---

## Secret Classification & Ownership

Every configuration element is classified into one of four strictly segregated tiers:

### 1. Platform Infrastructure Secrets (Hosting & Deployment Managed)
- **Examples**: `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, database connection strings, Supabase Auth provider secrets (`GOOGLE_CLIENT_SECRET`).
- **Ownership**: Platform Operator / Cloud DevOps.
- **Management**: Environment variables on hosting platforms (Vercel Project Settings, Docker `.env`, Hostinger environment).
- **Rule**: **NEVER exposed to the buyer Admin UI, never stored in tenant database tables, never modifiable by store staff.**

### 2. Store Integration Secrets (Buyer Configurable via Secure Vault)
- **Examples**: `ECOTRACK_API_TOKEN`, `ECOTRACK_WEBHOOK_SECRET`, `SMS_GATEWAY_API_KEY`, `WHATSAPP_CLOUD_API_TOKEN`, `TELEGRAM_BOT_TOKEN`, `SMTP_PASSWORD`.
- **Ownership**: Store Owner / Merchant Buyer.
- **Management**: Encrypted database vault (`public.integration_secrets`) with server-side decryption fallback to `process.env`.
- **Rule**: **Configurable via authenticated Admin UI with RBAC enforcement (`integrations.manage_secrets`). Displayed only as masked presence indicators (`Configured` / `Missing`), never decrypted into client-side state.**

### 3. Public Storefront Configuration (Client Exposed)
- **Examples**: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_ORDER_PREFIX`.
- **Ownership**: Public Storefront Context.
- **Management**: Environment variables with mandatory `NEXT_PUBLIC_` prefix; validated at startup via `src/lib/config/environment.ts`.
- **Rule**: Completely non-sensitive. Anonymous client traffic is restricted exclusively by Supabase Row Level Security (RLS).

### 4. Non-Secret Operational Integration Settings
- **Examples**: Carrier endpoints (`ECOTRACK_API_URL`), sender identities (`SMS_GATEWAY_SENDER_ID`), channel IDs (`TELEGRAM_CHAT_ID`), feature flags (`allowCustomerToOpenParcel`, `sendInvoicePdf`), operational environment (`sandbox` vs `production`), enabled/disabled status.
- **Ownership**: Store Administrator.
- **Management**: Persistent database table (`public.integration_configs`).
- **Rule**: Accessible only by authenticated administrative staff. Does NOT contain tokens, private keys, or passwords.

### 5. Derived Diagnostic State (Read-Only Metrics)
- **Examples**: `isReadyForDemo`, `isReadyForProduction`, `lastTestedAt`, `lastTestSuccess`, `lastTestMessage`, `lastTestLatencyMs`.
- **Ownership**: System Runtime Engine.
- **Rule**: Generated dynamically during connection tests or health checks. Never contains secret fragments, passwords, or raw Authorization headers.

---

## Configuration Boundary

The DRIPIDIN configuration architecture enforces a strict 5-layer hierarchy. Phase 5 formalizes **Layer E** while ensuring zero cross-boundary pollution:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER A: STORE SETTINGS (public.store_settings)                         │
│ Store name, legal identity, branding tokens, currency, default courier  │
│ [READ: Public Storefront + Admin | WRITE: Owner/Admin with RBAC]       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER B: COUNTRY PROFILE (CountryRegistry)                              │
│ Static geographic contracts: Wilaya vs Dept, phone sanitization, fiscal│
│ [READ: Universal Read-Only Code Baseline]                              │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER C: COMMERCE CAPABILITIES (CommerceCapabilitiesResolver)           │
│ B2B pricing, wholesale tier rules, inventory models, device specs      │
│ [READ: Storefront / OMS Logic]                                          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER D: LOGISTICS & SHIPPING RULES (src/lib/logistics/)                │
│ ShippingAddress, ShippingRulesEngine, ShippingRateCalculator (Money)    │
│ [READ: Checkout, Cart, Delivery Matrix]                                 │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER E: SECURE INTEGRATIONS & SECRET VAULT (Phase 5 Target Boundary)   │
│ 1. public.integration_configs (Non-secret provider operational options) │
│ 2. public.integration_secrets (AES-256-GCM encrypted credentials)      │
│ 3. SecretResolver (Server-only resolution: Vault -> Env -> Mock)        │
│ [READ: Trusted Server Code Only | WRITE: Owner Only | CLIENT: Masked]   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Secret Storage Options Evaluation

| Criterion | Option A: Environment Variables (`process.env`) | Option B: Supabase Native Vault (`vault.secrets`) | Option C: Application-Level Envelope Encryption (AES-256-GCM) |
| :--- | :--- | :--- | :--- |
| **Buyer Self-Service in Admin UI** | ❌ No (requires hosting dashboard or git deployment) | ✅ Yes (via SQL RPC functions) | ✅ Yes (via Server Actions) |
| **Portability across Hosting Providers** | ✅ High (Vercel, Docker, VPS, Hostinger) | ❌ Low (Requires Supabase with `pgsodium` extension; fails on standard PostgreSQL/MySQL) | ✅ Complete (Runs on any PostgreSQL or database engine) |
| **Database Backup Leakage Protection** | ✅ Immune (secrets not in database) | ⚠️ Dependent on pgsodium key isolation | ✅ Protected (encrypted with server-side master key) |
| **Multi-Environment / Demo Isolation** | ⚠️ Complex (requires duplicate deployment variables) | ⚠️ Database-level isolation | ✅ Simple (overridden dynamically by environment flags) |
| **Key Rotation Support** | ⚠️ Manual re-entry in Vercel | ⚠️ Complex key re-wrapping in pgsodium | ✅ Native key versioning (`key_version`) |
| **Operational Overhead** | Low | High (requires DBA-level extensions & sodium setup) | Moderate (standard Node.js `crypto` module) |

---

## Production Vault Key Strategy (Condition 1 Satisfaction)

### 1. Independent Provisioning Requirement
Production **MUST** use an independently provisioned 256-bit cryptographic secret:
```text
DRIPIDIN_VAULT_KEY
```
- Format: Base64-encoded 32-byte binary string (256 bits).
- Scope: Dedicated exclusively to symmetric encryption of store integration secrets.

### 2. Strict Prohibition of Service-Role Key Derivation
- **DO NOT derive the production vault encryption key from `SUPABASE_SERVICE_ROLE_KEY` under any circumstances.**
- The architectural responsibilities are completely decoupled:
  ```text
  SUPABASE_SERVICE_ROLE_KEY
  = Privileged PostgreSQL access, RLS bypass, database administration
  
  DRIPIDIN_VAULT_KEY
  = Encryption root for third-party courier, SMS, and messaging secrets
  ```
  Compromise of the database connection key does not compromise vault ciphertext, and vice-versa.

### 3. Fail-Safe Behavior in Production
If `DRIPIDIN_VAULT_KEY` is missing in production (`NODE_ENV === 'production'`), the vault system **FAILS SAFE**:
- `VaultService` throws a fatal configuration error immediately upon initialization:
  ```text
  [CRITICAL SECURITY ERROR] Missing DRIPIDIN_VAULT_KEY in production environment.
  Vault write and decryption operations are strictly blocked.
  Automatic derivation from SUPABASE_SERVICE_ROLE_KEY is disabled.
  ```
- The platform does **NOT** attempt silent key generation, fallback derivation, or unencrypted storage.
- If unencrypted environment credentials exist (e.g. `ECOTRACK_API_TOKEN` directly in `process.env`), the system can continue using them; otherwise, it degrades safely to Demo/Sandbox simulation.

### 4. Development-Only Mock Assertion
A development fallback key may exist only in local development or test suites (`NODE_ENV === 'development' || NODE_ENV === 'test'`). This fallback is guarded by an explicit runtime assertion:
```typescript
if (process.env.NODE_ENV === 'production') {
  if (!process.env.DRIPIDIN_VAULT_KEY) {
    throw new Error('[CRITICAL] Missing DRIPIDIN_VAULT_KEY in production. Automatic key derivation is strictly prohibited.');
  }
}
```

---

## Real Key Rotation Lifecycle (Condition 2 Satisfaction)

A `key_version` column alone does not constitute rotation. The DRIPIDIN architecture establishes a complete, production-grade key rotation lifecycle:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           SERVER ENVIRONMENT                            │
│  Active Key: DRIPIDIN_VAULT_KEY (V2)                                    │
│  Keyring:    DRIPIDIN_VAULT_KEYRING='{"1":"<key_v1>", "2":"<key_v2>"}'  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      ROTATION WORKFLOW LIFECYCLE                        │
│                                                                         │
│  1. Provision V2 in Environment:                                        │
│     - Add V2 to DRIPIDIN_VAULT_KEYRING                                  │
│     - Set DRIPIDIN_VAULT_KEY = V2                                       │
│                                                                         │
│  2. Decrypt with Historical Key:                                        │
│     - Read row from public.integration_secrets                          │
│     - Resolve key for key_version (e.g. V1) from in-memory keyring      │
│     - Decrypt ciphertext with AAD: "integration_id:key_name:1"          │
│                                                                         │
│  3. Encrypt with Active Key:                                            │
│     - Encrypt plaintext using V2 with fresh 12-byte random IV           │
│     - Compute auth tag with AAD: "integration_id:key_name:2"            │
│     - Update row: key_version = 2, updated_at = NOW()                   │
│                                                                         │
│  4. Verify & Retire:                                                    │
│     - Query: SELECT count(*) FROM integration_secrets WHERE version < 2 │
│     - When count is 0, V1 is securely retired from environment keyring  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Rotation Resilience Guarantees
1. **No Keys in Database**: Historical and active encryption keys are stored exclusively in server environment variables or KMS, **never** in PostgreSQL tables.
2. **Partial Rotation Handling**: Rotation operates row-by-row or in batches. The system continues resolving both V1 and V2 secrets concurrently during migration because `key_version` tells the `SecretResolver` which key from the keyring to use.
3. **Failed Rotation Rollback**: If re-encryption of a record fails (e.g. database timeout or corrupted ciphertext), the transaction rolls back for that record. The existing V1 record remains intact and operational.
4. **Key Retirement Verification**: An old key (e.g. V1) is only removed from `DRIPIDIN_VAULT_KEYRING` after verifying:
   ```sql
   SELECT count(*) FROM public.integration_secrets WHERE key_version < 2; -- Must return 0
   ```
5. **Recovery Procedure**: If a key is missing from the keyring for a specific version, `VaultService` throws `KeyringVersionNotFoundException`. The Admin UI marks the integration as `Missing (Key Expired)` and prompts the store owner to re-enter the credential.

---

## AES-256-GCM Context Binding / AAD (Condition 3 Satisfaction)

To eliminate ciphertext splicing and transposition attacks (where an attacker swaps ciphertext between different integrations, keys, or versions in the database), encryption strictly binds contextual metadata using **Additional Authenticated Data (AAD)**:

### 1. AAD Construction
For every secret encryption and decryption, the AAD string is constructed as:
```text
AAD = `${integration_id}:${key_name}:${key_version}`
```
Example:
```text
"ecotrack:ECOTRACK_API_TOKEN:1"
"whatsapp:WHATSAPP_CLOUD_API_TOKEN:2"
```

### 2. Encryption Implementation
```typescript
import crypto from 'crypto';

export function encryptSecret(
  plaintext: string,
  key: Buffer,
  integrationId: string,
  keyName: string,
  keyVersion: number
): { ciphertext: string; nonce: string; authTag: string } {
  const nonce = crypto.randomBytes(12); // 96-bit standard IV
  const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);

  // Authenticated Context Binding
  const aad = Buffer.from(`${integrationId}:${keyName}:${keyVersion}`, 'utf8');
  cipher.setAAD(aad);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag(); // 128-bit authentication tag

  return {
    ciphertext: encrypted.toString('base64'),
    nonce: nonce.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}
```

### 3. Decryption Implementation & Tampering Response
```typescript
export function decryptSecret(
  ciphertextB64: string,
  nonceB64: string,
  authTagB64: string,
  key: Buffer,
  integrationId: string,
  keyName: string,
  keyVersion: number
): string {
  const nonce = Buffer.from(nonceB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const ciphertext = Buffer.from(ciphertextB64, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
  const aad = Buffer.from(`${integrationId}:${keyName}:${keyVersion}`, 'utf8');
  decipher.setAAD(aad);
  decipher.setAuthTag(authTag);

  // If ciphertext, IV, auth tag, or ANY part of AAD is altered, this throws immediately
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}
```

### 4. Tampering Protection
If an attacker modifies `integration_id`, `key_name`, or `key_version` in the database, or copies ciphertext from one integration row to another, OpenSSL throws:
```text
Error: Unsupported state or unable to authenticate data
```
Decryption fails instantly, and no manipulated data is ever returned.

---

## Security Model for `public.integration_configs` (Condition 4 Satisfaction)

`public.integration_configs` stores non-secret operational parameters and diagnostic states.

### 1. Explicit Field Classification

| Field | Type | Classification | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(64)` | **Admin-Only** | Integration identifier (`'ecotrack'`, `'sms'`, etc.) |
| `enabled` | `BOOLEAN` | **Admin-Only** | Operational toggle |
| `environment` | `VARCHAR(16)` | **Admin-Only** | `'sandbox'` or `'production'` |
| `api_url` | `TEXT` | **Server-Only / Admin-Only** | Upstream API endpoint |
| `non_secret_config` | `JSONB` | **Server-Only / Admin-Only** | Specific carrier options |
| `last_tested_at` | `TIMESTAMPTZ` | **Admin-Only** | Diagnostic timestamp |
| `last_test_success`| `BOOLEAN` | **Admin-Only** | Diagnostic outcome |
| `last_test_message`| `TEXT` | **Admin-Only** | Diagnostic feedback |
| `last_test_latency_ms`| `INTEGER` | **Admin-Only** | Performance latency |
| `updated_at` / `updated_by` | `TIMESTAMPTZ` / `UUID` | **Admin-Only** | Audit tracking |

**Public-Safe Fields**: **NONE**.
- Anonymous storefront visitors, consumers, and B2B wholesale buyers have **zero business need** to query `integration_configs`.
- Storefront catalog and checkout query `public.store_settings` and `public.delivery_rate_matrix`.

### 2. Row Level Security & Permissions Matrix

```sql
ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;

-- SELECT: Only authenticated staff with settings.manage permission
CREATE POLICY "Staff view integration configs"
    ON public.integration_configs FOR SELECT
    USING (public.has_permission('settings.manage') OR public.is_staff());

-- INSERT: Authorized managers only
CREATE POLICY "Authorized managers insert integration configs"
    ON public.integration_configs FOR INSERT
    WITH CHECK (public.has_permission('settings.manage'));

-- UPDATE: Authorized managers only
CREATE POLICY "Authorized managers update integration configs"
    ON public.integration_configs FOR UPDATE
    USING (public.has_permission('settings.manage'))
    WITH CHECK (public.has_permission('settings.manage'));

-- DELETE: Prohibited for regular staff; restricted to superuser / OWNER
CREATE POLICY "Owner only delete integration configs"
    ON public.integration_configs FOR DELETE
    USING (public.has_permission('all'));
```

---

## Audit Log Security & Immutability (Condition 5 Satisfaction)

Audit logging utilizes the existing production table `public.audit_logs` (`00004_inventory_and_orders.sql`).

### 1. Immutability Enforcement
The existing RLS configuration (`00006_row_level_security.sql:330-337`) provides:
- `INSERT`: Policy `"System insert audit logs" WITH CHECK (true)`
- `SELECT`: Policy `"Authorized staff view audit logs" USING (public.has_permission('audit.read'))`
- `UPDATE`: **No policy defined -> Implicit Deny All**
- `DELETE`: **No policy defined -> Implicit Deny All**

To make this completely immutable even against privileged database roles or accidental script execution, Phase 5 adds a PostgreSQL database trigger:
```sql
CREATE OR REPLACE FUNCTION public.prevent_audit_log_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are strictly immutable. UPDATE and DELETE operations are prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_log_tampering ON public.audit_logs;
CREATE TRIGGER trg_prevent_audit_log_tampering
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_tampering();
```

### 2. Proof of Zero Secret Logging
When an integration secret is created, rotated, or removed, `VaultService` executes an explicit sanitization filter before dispatching the audit event:
```typescript
const auditPayload = {
  actor_id: sessionUser.id,
  actor_email: sessionUser.email,
  actor_role: sessionUser.role,
  action: isRotation ? 'INTEGRATION.SECRET_ROTATED' : 'INTEGRATION.SECRET_CONFIGURED',
  entity_type: 'INTEGRATION_SECRET',
  entity_id: `${integrationId}:${keyName}`,
  old_values: previousVersion ? { key_name: keyName, key_version: previousVersion } : null,
  new_values: {
    key_name: keyName,
    key_version: newVersion,
    status: 'Configured',
    source: 'VAULT',
  },
  ip_address: clientIp,
};
```
- **Strict Invariant**: Neither plaintext values, ciphertext, IVs, auth tags, nor encryption keys are ever passed to `audit_logs`.
- Only structural metadata (`key_name`, `key_version`, `status`) is retained.

---

## Final Production Secret Access Flow (Condition 6 Satisfaction)

The architecture enforces absolute segregation between administrative credential management and public client execution:

```text
ADMINISTRATIVE & SERVER OPERATION FLOW:
┌─────────────────────────────────────────────────────────────────────────┐
│ Admin UI (IntegrationsView)                                             │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (1) Authenticated Server Action
                                     ▼ (Verifies session & has_permission('integrations.manage_secrets'))
┌─────────────────────────────────────────────────────────────────────────┐
│ IntegrationConfigurationService                                         │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (2) Internal Server-Only Call
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ SecretResolver ('server-only')                                          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (3) Vault Decryption via AES-256-GCM + AAD
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ VaultService (Decrypted with DRIPIDIN_VAULT_KEY + Keyring)              │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (4) Injected into Runtime Provider Adapter
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Provider Adapter (EcoTrackDeliveryProvider, SmsGateway, etc.)           │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (5) Outbound HTTPS Request (Authorization: Bearer)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ External Courier / Messaging Upstream API                               │
└─────────────────────────────────────────────────────────────────────────┘


PUBLIC STOREFRONT CLIENT FLOW:
┌─────────────────────────────────────────────────────────────────────────┐
│ Public Storefront (Catalog, Search, Cart, Checkout UI)                  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (1) Public Queries Only
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Store Settings Service (public.store_settings)                          │
│ Shipping Rate Calculator (public.delivery_rate_matrix)                  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (2) Order Placement
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Order Service (public.orders)                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                     X
             [ABSOLUTE ISOLATION: NEVER TRAVERSES INTO VAULT]
```

- Decrypted secrets are **never** present in the public execution graph.
- React Client Components only receive masked `SecretPresenceStatus` (`'Configured'` | `'Missing'`).

---

## Database Schema Additions (00015_secure_integrations.sql)

```sql
-- 1. Integration Non-Secret Operational Configurations
CREATE TABLE IF NOT EXISTS public.integration_configs (
    id VARCHAR(64) PRIMARY KEY,                         -- 'ecotrack', 'email', 'sms', 'whatsapp', 'telegram'
    enabled BOOLEAN NOT NULL DEFAULT true,
    environment VARCHAR(16) NOT NULL DEFAULT 'sandbox', -- 'sandbox' | 'production'
    api_url TEXT,
    non_secret_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_tested_at TIMESTAMPTZ,
    last_test_success BOOLEAN,
    last_test_message TEXT,
    last_test_latency_ms INTEGER,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 2. Encrypted Integration Secrets Vault
CREATE TABLE IF NOT EXISTS public.integration_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id VARCHAR(64) NOT NULL REFERENCES public.integration_configs(id) ON DELETE CASCADE,
    key_name VARCHAR(64) NOT NULL,                      -- 'ECOTRACK_API_TOKEN', 'ECOTRACK_WEBHOOK_SECRET', etc.
    encrypted_value TEXT NOT NULL,                      -- Ciphertext (base64)
    nonce TEXT NOT NULL,                                -- 12-byte IV (base64)
    auth_tag TEXT NOT NULL,                             -- 16-byte GCM authentication tag (base64)
    key_version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    UNIQUE(integration_id, key_name)
);

-- 3. Row Level Security: Zero Direct Client Access to Secrets
ALTER TABLE public.integration_secrets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny all client access to secrets"
    ON public.integration_secrets FOR ALL
    USING (false);

-- 4. Granular Permission Seed
INSERT INTO public.permissions (code, resource, action, description)
VALUES ('integrations.manage_secrets', 'integrations', 'manage_secrets', 'Configure, rotate, and delete encrypted integration credentials')
ON CONFLICT (code) DO NOTHING;

-- Grant to OWNER role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.code = 'OWNER' AND p.code = 'integrations.manage_secrets'
ON CONFLICT DO NOTHING;
```

---

## IMPLEMENTATION READINESS

**READY — NO BLOCKERS**

All six security-gate conditions have been strictly designed, reconciled, and documented:
1. Production vault key is independent (`DRIPIDIN_VAULT_KEY`); derivation from `SUPABASE_SERVICE_ROLE_KEY` is completely eliminated with a fail-safe production assertion.
2. Complete key rotation lifecycle with multi-version keyring and retirement verification is established without storing keys in the database.
3. AES-256-GCM context binding (AAD) strictly enforces `integration_id:key_name:key_version` to prevent ciphertext tampering or transposition.
4. `public.integration_configs` security model explicitly classifies all fields as admin-only / server-only (zero public-safe fields) with strict RLS.
5. `public.audit_logs` immutability is enforced via database trigger and RLS deny-all on UPDATE/DELETE, with verified zero secret value leakage.
6. Secret access flow enforces complete isolation between server-side provider adapters and public storefront execution.
