# DRIPIDIN — Phase 6 Implementation Report: Notification Template Engine & Durable Queue

**Status:** COMPLETE  
**Architecture Gate:** PASSED (`APPROVED FOR IMPLEMENTATION`)  
**Scope:** Phase 6 ONLY (Notification Template Engine, Durable Queue, Admin Editor, Channel Mapping, Variable Renderer)  
**Date:** September 2026  
**Target Platform:** Next.js 16 (App Router), Supabase (PostgreSQL 15+), TypeScript 5.8+  

---

## 1. Executive Summary

Phase 6 replaces legacy hardcoded notification string generation across DRIPIDIN with an enterprise-grade, persistent, buyer-configurable **Notification Template Engine** backed by a **Durable DB Queue**.

Crucially, this phase guarantees **Order Transaction Immunity**: notification provider timeouts, network failures, or template configuration mistakes can **NEVER** abort or roll back a committed checkout, payment reconciliation, or inventory transaction.

### Key Highlights
- **Persistent Template Store:** Stored in `public.notification_templates` with composite key `(event_type, channel, locale)`.
- **4-Tier Fallback Cascade:** Store Custom Template → Fallback Locale (`fr-DZ`) → In-Code Neutral System Default → Non-blocking Safe Skip.
- **Strict Event Partitioning:** Exactly 15 configurable business events exposed in Admin Editor vs 11 internal ledger events kept technical and system-controlled.
- **Canonical Channel Consistency:** `DASHBOARD ↔ IN_APP` bidirectional translation mapping; additive PostgreSQL enum for `TELEGRAM`.
- **Data-Only Variable Renderer:** Regex token interpolation with zero `eval`, zero prototype access, and proactive stripping of dangerous tags in email HTML.
- **Durable Async Queue:** DB-backed execution with Next.js `after()` fast-path + Vercel Cron sweep (`/api/cron/notifications`), exponential retry backoff (+2m, +10m, +30m), and composite idempotency deduplication.
- **Ecosystem Integrations:** Phase 5 `SecretResolver` for credential safety; Phase 3 `MoneyFormatter` for monetary token rendering; Phase 1/2 `StoreSettingsService` for white-label store variables.

---

## 2. Notification Architecture

```text
Business Domain Event (Order / B2B / Logistics / Inventory)
                        │
                        ▼
          NotificationService.dispatchDomainEvent()
                        │
       ┌────────────────┴────────────────┐
       ▼                                 ▼
Order Transaction (DB)          Idempotency Check
(COMMITTED INDEPENDENTLY)       (baseIdempotency = evt-eventType-entityId)
                                         │
                                         ▼
                            Event Registry Validation
                                         │
                                         ▼
                            TemplateResolver (4-tier)
                         [Custom DB -> fr-DZ -> Default -> Skip]
                                         │
                                         ▼
                            Variable Context Assembler
                         [StoreSettings + MoneyFormatter + Logistics]
                                         │
                                         ▼
                            VariableRenderer (Data-Only)
                         [+ HTML Sanitizer for Email]
                                         │
                                         ▼
                         Durable Queue Row (`public.notifications`)
                               [status = 'PENDING']
                                         │
                  ┌──────────────────────┴──────────────────────┐
                  ▼                                             ▼
       Fast-Path Dispatch                            Cron Sweep (/api/cron)
       (Next.js after())                             (Every 5 mins)
                  │                                             │
                  └──────────────────────┬──────────────────────┘
                                         ▼
                               Channel Router & Adapter
                                         │
                                         ▼
                             Phase 5 SecretResolver
                                         │
                                         ▼
                             External Provider / Sandbox
                                         │
                        ┌────────────────┴────────────────┐
                        ▼                                 ▼
                     SUCCESS                           FAILURE
                status = 'SENT'                  Exponential Backoff
                                              (+2m, +10m, +30m -> 'FAILED')
```

---

## 3. Event Registry

Events are strictly partitioned into two authoritative registries:

### A. 15 Admin-Configurable Business Events
| Category | Event Type | Default Channels | Description |
|---|---|---|---|
| **Orders** | `order.created` | DASHBOARD, SMS, EMAIL | Confirmation of order placement |
| | `order.confirmed` | SMS, EMAIL | Order verified and approved by merchant |
| | `order.processing` | DASHBOARD | Order sent to preparation/warehouse |
| | `order.cancelled` | SMS, EMAIL, DASHBOARD | Order cancelled with refund/reason notice |
| **Shipping** | `order.shipped` | SMS, WHATSAPP, EMAIL | Parcel dispatched with courier tracking |
| | `order.out_for_delivery` | SMS, WHATSAPP | Courier out for final delivery attempt |
| | `order.delivered` | SMS, EMAIL | Parcel successfully delivered to customer |
| | `order.failed_delivery` | SMS, DASHBOARD | Delivery failed/customer unreachable |
| **B2B Wholesale** | `b2b.application_received` | EMAIL, DASHBOARD | Acknowledgment of B2B wholesale registration |
| | `b2b.application_approved` | SMS, EMAIL | Wholesale account approved with tier discount |
| | `b2b.application_rejected` | EMAIL | Application rejected with explanation |
| **Inventory & Stock** | `inventory.low_stock` | DASHBOARD, TELEGRAM | Critical low stock alert for inventory managers |
| | `inventory.out_of_stock` | DASHBOARD, TELEGRAM | Product stock reached 0 |
| | `inventory.restocked` | DASHBOARD, EMAIL | Restock notification for back-in-stock |
| **Price** | `price.changed` | DASHBOARD | Significant catalog price change notification |

### B. 11 Internal Ledger Events (Technical & Uneditable)
The following events are recorded strictly as internal audit or diagnostic logs and are hidden from the Admin Template Editor:
`checkout.initiated`, `checkout.step_completed`, `checkout.abandoned`, `payment.attempted`, `payment.reconciled`, `payment.disputed`, `payment.failed`, `shipment.created`, `shipment.manifest_printed`, `stock.reserved`, `stock.released`.

---

## 4. Template Model

The template entity model is defined in `src/types/notifications.types.ts`:

```typescript
export interface NotificationTemplate {
  id: string;
  eventType: DomainEventType;
  channel: NotificationChannelType;
  locale: string;
  subject?: string | null;
  bodyText: string;
  bodyHtml?: string | null;
  isActive: boolean;
  isSystemDefault: boolean;
  version: number;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string | null;
}
```

---

## 5. Database Migration

Migration script: `supabase/migrations/00016_notification_templates.sql`

Key components:
1. **Enum Extension:**
   ```sql
   ALTER TYPE notification_channel ADD VALUE IF NOT EXISTS 'TELEGRAM';
   ```
2. **Table Definition:**
   `public.notification_templates` with composite unique constraint `(event_type, channel, locale)`.
3. **Queue Columns on `public.notifications`:**
   Adds `retry_count`, `max_retries`, `next_retry_at`, and index `idx_notifications_queue_pending`.
4. **Row-Level Security (RLS):**
   - Enabled by default.
   - Public/anonymous access: DENIED.
   - Read access: Staff with `notifications.read` or `notifications.manage`.
   - Write/Update/Delete access: Staff with `notifications.manage`.

---

## 6. Channel Mapping

Authored in `src/lib/notifications/channels/channel-mapper.ts`:

| Application / Domain Channel | PostgreSQL Database Enum |
|---|---|
| `DASHBOARD` | `IN_APP` |
| `EMAIL` | `EMAIL` |
| `SMS` | `SMS` |
| `WHATSAPP` | `WHATSAPP` |
| `TELEGRAM` | `TELEGRAM` |

Translation functions:
- `toDbChannel(domainChannel)`: Maps `'DASHBOARD'` to `'IN_APP'`.
- `toDomainChannel(dbChannel)`: Maps `'IN_APP'` to `'DASHBOARD'`.

---

## 7. Template Resolver

Implemented in `src/lib/notifications/template-engine/template-resolver.ts`:

1. **Custom Store Template:** Queries `notification_templates` where `(event_type, channel, locale)` matches.
2. **Fallback Store Locale:** If requested locale is missing, queries `locale = 'fr-DZ'`.
3. **In-Code Immutable System Default:** Resolves from `src/lib/notifications/template-engine/system-defaults.ts`.
4. **Safe Skip:** If `isActive === false`, returns `null` to indicate intentional deactivation without throwing.

---

## 8. Variable Renderer & Token Registry

Implemented in:
- `src/lib/notifications/template-engine/variable-renderer.ts`
- `src/lib/notifications/template-engine/variable-registry.ts`

### Security Guardrails:
- Pure regex replacement: `/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g`.
- Zero `eval()`, zero `Function()`.
- Proactive rejection of forbidden prototype tokens: `__proto__`, `constructor`, `prototype`, `toString`, `valueOf`.
- Proactive rejection of expression operators (`.`, `()`, `+`, `-`, `*`, `/`, etc.).

---

## 9. HTML Sanitization

Implemented in `src/lib/notifications/template-engine/html-sanitizer.ts`:
- Strips dangerous tags: `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<input>`.
- Strips inline JS handlers: `onload`, `onclick`, `onerror`, `onmouseover`, etc.
- Strips dangerous protocols: `javascript:`, `vbscript:`, `data:` (except safe image data).
- Retains safe formatting tags: `<table>`, `<tr>`, `<td>`, `<div>`, `<span>`, `<p>`, `<a>`, `<img>`, `<b>`, `<strong>`.
- Executes both on template save and immediately before outbound email dispatch.

---

## 10. Money Integration

Integrated with Phase 3 `MoneyFormatter`:
- Currency and locale are resolved dynamically from `StoreSettingsService`.
- Variables `{{total}}`, `{{subtotal}}`, and `{{shippingCost}}` are pre-formatted (e.g., `18 500 DZD` or `18.500,00 DA`) before reaching template interpolation.
- Template authors never need to manually append `DZD` or `DA`.

---

## 11. Queue Architecture & Retries

Implemented in `src/lib/notifications/queue-processor.ts`:
- Notifications enter the queue with `status = 'PENDING'`.
- Fast-path execution runs immediately via Next.js `after()`.
- Background sweep runs every 5 minutes via `/api/cron/notifications`.
- Exponential backoff schedule:
  - Attempt 1: +2 minutes
  - Attempt 2: +10 minutes
  - Attempt 3: +30 minutes
  - Attempt 4+: Status marked as `FAILED` with sanitized error message.

---

## 12. Idempotency & Delivery Semantics

- **Idempotency Key:** `evt-${eventType}-${entityId}-${channel}-${recipientType}`.
- Database uniqueness prevents duplicate queue rows on retries or webhook replay.
- **Delivery Guarantee:** Documented as **DURABLE AT-LEAST-ONCE PROCESSING**. External provider deduplication is supported via provider message IDs.

---

## 13. Admin Notification Workstation

Located at `src/components/admin/views/notifications-view.tsx`:
- **Event Explorer:** Categorized search across all 15 business events.
- **Channel Tabs:** SMS, WhatsApp, Email, Telegram, Dashboard.
- **Body & Subject Editor:** Live editing with SMS character/segment counter.
- **Variable Selector:** Chips displaying available variables with click-to-insert.
- **Deterministic Live Preview:** Renders sample buyer/order data without exposing real customer PII.
- **Reset-to-Default Modal:** Confirms before removing custom DB row and reverting to system default.
- **Queue Processor Trigger:** Allows manual queue sweep from the UI.

---

## 14. RBAC & Audit Logging

- **Permissions:**
  - `notifications.read`: View templates and notification history.
  - `notifications.manage`: Update templates, toggle channels, reset to defaults.
- **Audit Logs:**
  - Every update or reset writes an entry to `public.audit_logs`.
  - Credentials, vault keys, and raw tokens are excluded from audit records.

---

## 15. Phase 4 & Phase 5 Integration

- **Phase 4 Logistics:** Consumes normalized shipment events from `LogisticsProviderRegistry` (`trackingNumber`, `trackingUrl`, `courierName`).
- **Phase 5 SecretResolver:** Outbound channel providers (Resend, Twilio, WhatsApp, Telegram) resolve credentials strictly via `SecretResolver.getSecret()`. Direct access to `process.env` or `integration_secrets` is prohibited.
- **Sandbox Safety:** In demo mode or when API keys are absent, providers log simulation receipts without making real external API calls.

---

## 16. Verification & Test Results

### Targeted Test Suite (`template.test.ts`)
- **Total Tests:** 28
- **Passed:** 28
- **Failed:** 0

### Full Regression Suite (`npm run test:ts`)
- **Total Tests:** 373
- **Passed:** 373
- **Failed:** 0
- **Regression:** Zero regressions across Phase 1, 2, 3, 4, and 5 suites.

### TypeScript Typecheck (`npm run typecheck`)
- **Status:** PASSED (0 errors)

### Production Build (`npm run build`)
- **Status:** PASSED (Turbopack production build succeeded, 24 static and dynamic routes compiled).

---

## 17. Files Changed / Created

### New Files:
1. `supabase/migrations/00016_notification_templates.sql`
2. `src/lib/notifications/channels/channel-mapper.ts`
3. `src/lib/notifications/template-engine/event-registry.ts`
4. `src/lib/notifications/template-engine/variable-registry.ts`
5. `src/lib/notifications/template-engine/system-defaults.ts`
6. `src/lib/notifications/template-engine/variable-renderer.ts`
7. `src/lib/notifications/template-engine/html-sanitizer.ts`
8. `src/lib/notifications/template-engine/template-validator.ts`
9. `src/lib/notifications/template-engine/template-resolver.ts`
10. `src/lib/notifications/template-engine/template.test.ts`
11. `src/lib/notifications/queue-processor.ts`
12. `src/app/api/cron/notifications/route.ts`
13. `docs/phase-6-notification-template-implementation.md`

### Modified Files:
1. `src/types/notifications.types.ts`
2. `src/types/database.types.ts`
3. `src/lib/notifications/channels/index.ts`
4. `src/lib/notifications/notification.service.ts`
5. `src/lib/actions/notification.actions.ts`
6. `src/lib/hooks/use-notifications.ts`
7. `src/components/admin/views/notifications-view.tsx`

---

## 18. Rollback Strategy

1. **Application Rollback:** Revert git commit. The codebase will safely fall back to pre-existing notification dispatch paths.
2. **Database Schema:** The migration is purely additive (`00016_notification_templates.sql`). Dropping the new table or columns is **NOT** required during an application rollback, ensuring existing notification history remains intact.

---

## 19. Next Safe Step

Phase 6 is complete and all gates have passed. The repository is ready for:

**`PHASE 7 — DYNAMIC SEO`**
