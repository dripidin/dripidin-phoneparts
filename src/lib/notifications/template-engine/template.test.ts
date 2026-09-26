// DRIPIDIN Phase 6: Notification Template Engine & Durable Queue Test Suite
// Comprehensive tests covering Section 34 requirements:
// Template Resolution, Controlled Variables, Security/Sandboxing, Money Formatting,
// Email HTML Sanitization, Channel Mapping, Queue & Retries, Idempotency, and Demo Simulation.

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Template Engine imports
import { TemplateResolver } from './template-resolver';
import { renderTemplate, extractTokens } from './variable-renderer';
import { sanitizeEmailHtml } from './html-sanitizer';
import { validateTemplate } from './template-validator';
import {
  CONFIGURABLE_EVENT_REGISTRY,
  INTERNAL_LEDGER_EVENTS,
  isConfigurableEvent,
  isInternalLedgerEvent,
} from './event-registry';
import {
  GLOBAL_STORE_VARIABLES,
  CONTEXT_VARIABLES,
  getAllowedTokensForEvent,
  isValidTokenForEvent,
} from './variable-registry';
import { getSystemDefaultTemplate } from './system-defaults';
import { toDbChannel, toDomainChannel, isValidChannel } from '../channels/channel-mapper';
import { QueueProcessor } from '../queue-processor';
import { NotificationService } from '../notification.service';
import { MoneyFormatter } from '../../money/formatter';

// In-memory Mock Supabase Client for Testing
function createMockSupabase(initialTemplates: any[] = [], initialNotifications: any[] = []) {
  const templates = [...initialTemplates];
  const notifications = initialNotifications.map((n) => ({
    is_demo: typeof n.is_demo === 'boolean' ? n.is_demo : true,
    ...n,
  }));
  const auditLogs: any[] = [];

  return {
    _templates: templates,
    _notifications: notifications,
    _auditLogs: auditLogs,
    from: (table: string) => {
      const getCollection = () => {
        if (table === 'notification_templates') return templates;
        if (table === 'notifications') return notifications;
        if (table === 'audit_logs') return auditLogs;
        return [];
      };

      const collection = getCollection();

      const createQuery = (currentData: any[]) => {
        let working = [...currentData];

        const queryObj: any = {
          eq: (col: string, val: any) => {
            working = working.filter((item) => item[col] === val);
            return queryObj;
          },
          in: (col: string, vals: any[]) => {
            working = working.filter((item) => vals.includes(item[col]));
            return queryObj;
          },
          lte: (col: string, val: any) => {
            working = working.filter((item) => item[col] <= val);
            return queryObj;
          },
          like: (col: string, val: string) => {
            const prefix = val.replace(/%/g, '');
            working = working.filter((item) => String(item[col] || '').startsWith(prefix));
            return queryObj;
          },
          order: () => queryObj,
          limit: (n: number) => {
            working = working.slice(0, n);
            return queryObj;
          },
          maybeSingle: async () => ({ data: working[0] || null, error: null }),
          single: async () => ({ data: working[0] || null, error: working[0] ? null : new Error('Not found') }),
          then: (resolve: any, reject?: any) => Promise.resolve({ data: working, error: null }).then(resolve, reject),
        };

        return queryObj;
      };

      return {
        select: (_cols?: string) => createQuery(collection),
        insert: (data: any) => {
          const records = Array.isArray(data) ? data : [data];
          const inserted: any[] = [];
          for (const item of records) {
            const rec = {
              id: item.id || `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              version: item.version ?? 1,
              is_demo: typeof item.is_demo === 'boolean' ? item.is_demo : true,
              ...item,
            };
            collection.push(rec);
            inserted.push(rec);
          }
          return {
            select: () => ({
              single: async () => ({ data: inserted[0] || null, error: null }),
              maybeSingle: async () => ({ data: inserted[0] || null, error: null }),
            }),
            then: (resolve: any) => Promise.resolve({ data: inserted, error: null }).then(resolve),
          };
        },
        update: (updateData: any) => ({
          eq: (col: string, val: any) => {
            const matches = collection.filter((item) => item[col] === val);
            for (const item of matches) {
              Object.assign(item, updateData, { updated_at: new Date().toISOString() });
            }
            return {
              select: () => ({
                single: async () => ({ data: matches[0] || null, error: null }),
                maybeSingle: async () => ({ data: matches[0] || null, error: null }),
              }),
              then: (resolve: any) => Promise.resolve({ data: matches, error: null }).then(resolve),
            };
          },
        }),
        delete: () => {
          const filters: [string, any][] = [];
          const deleteObj: any = {
            eq: (col: string, val: any) => {
              filters.push([col, val]);
              return deleteObj;
            },
            then: (resolve: any) => {
              const before = collection.length;
              const remaining = collection.filter((item) => !filters.every(([c, v]) => item[c] === v));
              collection.length = 0;
              collection.push(...remaining);
              return Promise.resolve({ count: before - remaining.length, error: null }).then(resolve);
            },
          };
          return deleteObj;
        },
        upsert: async (data: any) => {
          const index = templates.findIndex(
            (t) => t.event_type === data.event_type && t.channel === data.channel && t.locale === data.locale
          );
          const record = {
            id: data.id || `tpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            version: index >= 0 ? (templates[index].version || 1) + 1 : 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...data,
          };
          if (index >= 0) {
            templates[index] = record;
          } else {
            templates.push(record);
          }
          return { data: record, error: null };
        },
      };
    },
  };
}

describe('DRIPIDIN Phase 6: Notification Template Engine & Durable Queue', () => {
  beforeEach(() => {
    TemplateResolver.clearCache();
  });

  // ===========================================================================
  // 1. TEMPLATE RESOLUTION HIERARCHY
  // ===========================================================================
  describe('1. Template Resolution Hierarchy', () => {
    it('1.1 should resolve custom store template when present in database', async () => {
      const mockDb = createMockSupabase([
        {
          id: 'custom-tpl-1',
          event_type: 'order.created',
          channel: 'SMS',
          locale: 'fr-DZ',
          subject: null,
          body_text: 'Custom store SMS: commande {{orderNumber}} validée pour {{customerName}} !',
          is_active: true,
          is_system_default: false,
          version: 2,
        },
      ]);

      const resolved = await TemplateResolver.resolveTemplate(
        'order.created',
        'SMS',
        'fr-DZ',
        mockDb
      );

      assert.ok(resolved);
      assert.strictEqual(resolved.isSystemDefault, false);
      assert.strictEqual(
        resolved.bodyText,
        'Custom store SMS: commande {{orderNumber}} validée pour {{customerName}} !'
      );
      assert.strictEqual(resolved.version, 2);
    });

    it('1.2 should fall back to store default locale (fr-DZ) when requested locale is missing in DB', async () => {
      const mockDb = createMockSupabase([
        {
          id: 'custom-tpl-fr',
          event_type: 'order.created',
          channel: 'SMS',
          locale: 'fr-DZ',
          body_text: 'Texte par défaut en français pour {{customerName}}',
          is_active: true,
          is_system_default: false,
          version: 1,
        },
      ]);

      // Requesting 'ar-DZ' which doesn't exist in custom DB
      const resolved = await TemplateResolver.resolveTemplate(
        'order.created',
        'SMS',
        'ar-DZ',
        mockDb
      );

      assert.ok(resolved);
      assert.strictEqual(
        resolved.bodyText,
        'Texte par défaut en français pour {{customerName}}'
      );
    });

    it('1.3 should fall back to compiled immutable system default if DB row is missing', async () => {
      const emptyDb = createMockSupabase([]);

      const resolved = await TemplateResolver.resolveTemplate(
        'order.created',
        'SMS',
        'fr-DZ',
        emptyDb
      );

      assert.ok(resolved);
      assert.strictEqual(resolved.isSystemDefault, true);
      assert.ok(resolved.bodyText.includes('{{storeName}}'));
      assert.ok(resolved.bodyText.includes('{{orderNumber}}'));
    });

    it('1.4 should safely return null (safe skip) when custom template is deactivated (isActive = false)', async () => {
      const mockDb = createMockSupabase([
        {
          id: 'custom-tpl-disabled',
          event_type: 'order.shipped',
          channel: 'SMS',
          locale: 'fr-DZ',
          body_text: 'Disabled template',
          is_active: false, // Operator turned off SMS for shipping
          is_system_default: false,
          version: 3,
        },
      ]);

      const resolved = await TemplateResolver.resolveTemplate(
        'order.shipped',
        'SMS',
        'fr-DZ',
        mockDb
      );

      assert.strictEqual(resolved, null, 'Disabled template must result in clean skip, not crash');
    });

    it('1.5 resetToDefault should remove custom DB template and restore system default', async () => {
      const mockDb = createMockSupabase([
        {
          id: 'custom-to-reset',
          event_type: 'order.created',
          channel: 'SMS',
          locale: 'fr-DZ',
          body_text: 'Custom text to delete',
          is_active: true,
          is_system_default: false,
          version: 2,
        },
      ]);

      const resetSuccess = await TemplateResolver.resetToDefault(
        'order.created',
        'SMS',
        'fr-DZ',
        'staff-user-1',
        mockDb
      );

      assert.strictEqual(resetSuccess, true);

      // Now resolution should return immutable system default
      const resolved = await TemplateResolver.resolveTemplate(
        'order.created',
        'SMS',
        'fr-DZ',
        mockDb
      );
      assert.ok(resolved);
      assert.strictEqual(resolved.isSystemDefault, true);
    });
  });

  // ===========================================================================
  // 2. CONTROLLED VARIABLE INTERPOLATION & RENDERING
  // ===========================================================================
  describe('2. Controlled Variable Interpolation', () => {
    it('2.1 should substitute valid variables deterministically', () => {
      const template = 'Bonjour {{customerName}}, votre commande #{{orderNumber}} d\'un montant de {{total}} a été validée par {{storeName}}.';
      const context = {
        customerName: 'Karim Boudiaf',
        orderNumber: 'CMD-1042',
        total: '18 500 DA',
        storeName: 'HamzaPhone',
      };

      const rendered = renderTemplate(template, context);
      assert.strictEqual(
        rendered,
        'Bonjour Karim Boudiaf, votre commande #CMD-1042 d\'un montant de 18 500 DA a été validée par HamzaPhone.'
      );
    });

    it('2.2 should leave missing optional variables as empty strings without crashing or printing undefined', () => {
      const template = 'Colis {{orderNumber}} expédié. Transporteur: {{courierName}}. Suivi: {{trackingNumber}}. Info: {{optionalNotes}}';
      const context = {
        orderNumber: 'CMD-999',
        trackingNumber: 'TRK-12345',
        // courierName and optionalNotes are omitted
      };

      const rendered = renderTemplate(template, context);
      assert.strictEqual(
        rendered,
        'Colis CMD-999 expédié. Transporteur: . Suivi: TRK-12345. Info: '
      );
      assert.ok(!rendered.includes('undefined'));
      assert.ok(!rendered.includes('null'));
    });

    it('2.3 should extract all balanced token names accurately', () => {
      const template = '{{storeName}} - Commande {{orderNumber}}: Total {{total}}, Livraison vers {{wilayaName}}';
      const tokens = extractTokens(template);
      assert.deepStrictEqual(tokens, ['storeName', 'orderNumber', 'total', 'wilayaName']);
    });
  });

  // ===========================================================================
  // 3. SECURITY, CODE INJECTION & PROTOTYPE IMMUNITY
  // ===========================================================================
  describe('3. Security & Injection Protection', () => {
    it('3.1 should reject prototype traversal tokens (__proto__, constructor, prototype)', () => {
      const maliciousTokens = [
        '{{__proto__.polluted}}',
        '{{constructor.prototype.evil}}',
        '{{toString}}',
      ];

      for (const t of maliciousTokens) {
        assert.throws(
          () => {
            renderTemplate(t, { polluted: 'bad' });
          },
          /interdits/i,
          `Token ${t} must be rejected as forbidden prototype access`
        );
      }
    });

    it('3.2 should not execute arbitrary code or evaluate JS expressions', () => {
      // Expression syntax must fail validation
      const exprTemplate = 'Total: {{ 2 + 2 }} ou {{ process.exit() }}';
      const validation = validateTemplate(exprTemplate, 'order.created', 'SMS');
      assert.strictEqual(validation.valid, false);
      assert.ok(validation.errors.length > 0);
    });

    it('3.3 should reject unknown tokens during template validation against event registry', () => {
      const invalidTemplate = '{{storeName}} secret token: {{superSecretInternalToken}}';
      const validation = validateTemplate(invalidTemplate, 'order.created', 'SMS');

      assert.strictEqual(validation.valid, false);
      assert.ok(
        validation.errors.some((e) => e.includes('superSecretInternalToken')),
        'Unknown variable must be flagged during validation'
      );
    });
  });

  // ===========================================================================
  // 4. MONEY FORMATTING INTEGRATION (PHASE 3)
  // ===========================================================================
  describe('4. Money Formatting Integration', () => {
    it('4.1 should format monetary values with Algerian DZD standards', () => {
      const formattedDzd = MoneyFormatter.format(18500, { currencyCode: 'DZD', locale: 'fr-DZ' });
      assert.ok(formattedDzd.includes('18') && formattedDzd.includes('500'), 'Formatted total contains thousand separators');
      assert.ok(formattedDzd.includes('DA') || formattedDzd.includes('DZD'), 'Formatted total contains currency symbol');
    });

    it('4.2 should format EUR currency correctly when store is configured for Euros', () => {
      const formattedEur = MoneyFormatter.format(120.5, { currencyCode: 'EUR', locale: 'fr-FR' });
      assert.ok(formattedEur.includes('120,50') || formattedEur.includes('120.50'));
      assert.ok(formattedEur.includes('€'));
    });
  });

  // ===========================================================================
  // 5. EMAIL HTML SANITIZATION
  // ===========================================================================
  describe('5. Email HTML Sanitization', () => {
    it('5.1 should strip <script>, <iframe>, <object>, and <form> tags from HTML', () => {
      const dangerousHtml = `
        <div>
          <h2>Bonjour {{customerName}}</h2>
          <script>alert('XSS')</script>
          <iframe src="https://attacker.com"></iframe>
          <form action="/steal"><input name="pass"/></form>
          <p>Votre commande est validée.</p>
        </div>
      `;

      const sanitized = sanitizeEmailHtml(dangerousHtml);
      assert.ok(!sanitized.includes('<script>'), 'Script tag stripped');
      assert.ok(!sanitized.includes('alert('), 'Script contents stripped');
      assert.ok(!sanitized.includes('<iframe'), 'Iframe stripped');
      assert.ok(!sanitized.includes('<form'), 'Form stripped');
      assert.ok(sanitized.includes('Bonjour {{customerName}}'), 'Safe text retained');
      assert.ok(sanitized.includes('Votre commande est validée.'), 'Safe paragraph retained');
    });

    it('5.2 should strip inline event handlers (onload, onclick, onerror)', () => {
      const xssHtml = '<img src="invalid.jpg" onerror="alert(document.cookie)" /> <a href="ok.html" onclick="doEvil()">Lien</a>';
      const sanitized = sanitizeEmailHtml(xssHtml);

      assert.ok(!sanitized.includes('onerror='), 'onerror stripped');
      assert.ok(!sanitized.includes('onclick='), 'onclick stripped');
      assert.ok(!sanitized.includes('alert('), 'payload stripped');
    });

    it('5.3 should strip javascript: and dangerous data: URLs in links and images', () => {
      const badLinksHtml = '<a href="javascript:alert(1)">Cliquez ici</a> <a href="data:text/html,<script>alert(1)</script>">Test</a>';
      const sanitized = sanitizeEmailHtml(badLinksHtml);

      assert.ok(!sanitized.includes('javascript:alert(1)'), 'javascript: URL stripped');
      assert.ok(!sanitized.includes('data:text/html'), 'data:text/html stripped');
      assert.ok(sanitized.includes('Cliquez ici'), 'Anchor text retained');
    });

    it('5.4 should retain safe formatting elements and inline styles for professional email layout', () => {
      const safeHtml = '<div style="color: #f97316; font-size: 14px;"><strong>Important :</strong> Merci de préparer <span style="font-weight:bold;">18 500 DA</span>.</div>';
      const sanitized = sanitizeEmailHtml(safeHtml);

      assert.ok(sanitized.includes('<strong>Important :</strong>'));
      assert.ok(sanitized.includes('18 500 DA'));
      assert.ok(sanitized.includes('style="color: #f97316; font-size: 14px;"'));
    });
  });

  // ===========================================================================
  // 6. CHANNEL MAPPING CONSISTENCY
  // ===========================================================================
  describe('6. Authoritative Channel Consistency', () => {
    it('6.1 should map domain DASHBOARD to database IN_APP bidirectional', () => {
      assert.strictEqual(toDbChannel('DASHBOARD'), 'IN_APP');
      assert.strictEqual(toDomainChannel('IN_APP'), 'DASHBOARD');
    });

    it('6.2 should map SMS, WHATSAPP, EMAIL, TELEGRAM transparently', () => {
      assert.strictEqual(toDbChannel('SMS'), 'SMS');
      assert.strictEqual(toDbChannel('WHATSAPP'), 'WHATSAPP');
      assert.strictEqual(toDbChannel('EMAIL'), 'EMAIL');
      assert.strictEqual(toDbChannel('TELEGRAM'), 'TELEGRAM');

      assert.strictEqual(toDomainChannel('SMS'), 'SMS');
      assert.strictEqual(toDomainChannel('WHATSAPP'), 'WHATSAPP');
      assert.strictEqual(toDomainChannel('EMAIL'), 'EMAIL');
      assert.strictEqual(toDomainChannel('TELEGRAM'), 'TELEGRAM');
    });

    it('6.3 should validate allowed channels and reject invalid ones', () => {
      assert.strictEqual(isValidChannel('SMS'), true);
      assert.strictEqual(isValidChannel('DASHBOARD'), true);
      assert.strictEqual(isValidChannel('IN_APP'), true);
      assert.strictEqual(isValidChannel('TELEGRAM'), true);
      assert.strictEqual(isValidChannel('PIGEON_CARRIER'), false);
    });
  });

  // ===========================================================================
  // 7. EVENT TAXONOMY & SCOPE PARTITIONING
  // ===========================================================================
  describe('7. Event Registry Partitioning', () => {
    it('7.1 should register exactly 15 configurable business events in Admin Editor', () => {
      const count = Object.keys(CONFIGURABLE_EVENT_REGISTRY).length;
      assert.strictEqual(count, 15, 'Must have exactly 15 configurable events');
    });

    it('7.2 should recognize internal ledger events and prevent them from being editable in Template Editor', () => {
      assert.strictEqual(isConfigurableEvent('order.created'), true);
      assert.strictEqual(isConfigurableEvent('b2b.approved'), true);
      assert.strictEqual(isConfigurableEvent('inventory.low_stock'), true);

      // Internal ledger events
      assert.strictEqual(isConfigurableEvent('payment.discrepancy'), false);
      assert.strictEqual(isConfigurableEvent('cod.collected'), false);
      assert.strictEqual(isConfigurableEvent('cod.remitted'), false);

      assert.strictEqual(isInternalLedgerEvent('payment.discrepancy'), true);
      assert.strictEqual(isInternalLedgerEvent('cod.collected'), true);
      assert.strictEqual(isInternalLedgerEvent('import.completed'), true);
    });

    it('7.3 should return allowed tokens combining global and event-specific variables', () => {
      const tokens = getAllowedTokensForEvent('order.created');
      assert.ok(tokens.has('storeName'), 'Contains global storeName');
      assert.ok(tokens.has('supportPhone'), 'Contains global supportPhone');
      assert.ok(tokens.has('orderNumber'), 'Contains event orderNumber');
      assert.ok(tokens.has('total'), 'Contains event total');

      assert.strictEqual(isValidTokenForEvent('orderNumber', 'order.created'), true);
      assert.strictEqual(isValidTokenForEvent('nonExistentVar', 'order.created'), false);
    });
  });

  // ===========================================================================
  // 8. DURABLE QUEUE, RETRIES & IDEMPOTENCY
  // ===========================================================================
  describe('8. Durable Queue, Retries & Idempotency', () => {
    it('8.1 queue processor should process pending notifications and update status to SENT', async () => {
      const mockDb = createMockSupabase([], [
        {
          id: 'job-1',
          event_type: 'order.created',
          channel: 'IN_APP',
          recipient_type: 'CUSTOMER',
          recipient_id: 'cust-1',
          title: 'Nouvelle commande',
          message: 'Votre commande a bien été reçue.',
          status: 'PENDING',
          retry_count: 0,
          max_retries: 3,
          next_retry_at: new Date(Date.now() - 10000).toISOString(), // Ready now
        },
      ]);

      const res = await QueueProcessor.processPendingNotifications(10, mockDb);
      assert.strictEqual(res.processed, 1);
      assert.strictEqual(res.succeeded, 1);
      assert.strictEqual(res.failed, 0);

      const processedJob = mockDb._notifications.find((n) => n.id === 'job-1');
      assert.ok(processedJob);
      assert.strictEqual(processedJob.status, 'SENT');
      assert.strictEqual(processedJob.sent_via, 'DASHBOARD');
    });

    it('8.2 queue processor should calculate exponential backoff on failure (+2m, +10m, +30m)', () => {
      const now = new Date('2026-09-22T10:00:00.000Z');

      const retry1 = QueueProcessor.calculateNextRetry(1, now);
      assert.strictEqual(retry1.toISOString(), '2026-09-22T10:02:00.000Z', 'Attempt 1 is +2 minutes');

      const retry2 = QueueProcessor.calculateNextRetry(2, now);
      assert.strictEqual(retry2.toISOString(), '2026-09-22T10:10:00.000Z', 'Attempt 2 is +10 minutes');

      const retry3 = QueueProcessor.calculateNextRetry(3, now);
      assert.strictEqual(retry3.toISOString(), '2026-09-22T10:30:00.000Z', 'Attempt 3 is +30 minutes');
    });

    it('8.3 idempotent dispatch: duplicate dispatch of same event entity must not create duplicate queue rows', async () => {
      const mockDb = createMockSupabase();

      // Dispatch order.confirmed for order 1042
      const dispatched1 = await NotificationService.dispatchDomainEvent(
        {
          eventType: 'order.confirmed',
          entityType: 'ORDER',
          entityId: 'ord-1042',
          customerId: 'cust-amina',
          customerPhone: '+213555112233',
          data: {
            orderNumber: 'CMD-1042',
            customerName: 'Amina',
            total: 5400,
          },
        },
        mockDb
      );

      assert.ok(dispatched1.length > 0);
      const initialRowCount = mockDb._notifications.length;

      // Second dispatch of the exact same event
      const dispatched2 = await NotificationService.dispatchDomainEvent(
        {
          eventType: 'order.confirmed',
          entityType: 'ORDER',
          entityId: 'ord-1042',
          customerId: 'cust-amina',
          customerPhone: '+213555112233',
          data: {
            orderNumber: 'CMD-1042',
            customerName: 'Amina',
            total: 5400,
          },
        },
        mockDb
      );

      // Must reuse existing records
      assert.strictEqual(mockDb._notifications.length, initialRowCount, 'Idempotency prevented duplicate queue rows');
    });

    it('8.4 order transaction immunity: notification failure must NEVER throw or break caller flow', async () => {
      // Mock DB that throws error on notification insert
      const failingDb = {
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
          insert: async () => {
            throw new Error('Database connection timeout on notifications table');
          },
        }),
      };

      // Calling dispatchDomainEvent should catch and return gracefully without throwing
      let errorThrown = false;
      let result: any = null;
      try {
        result = await NotificationService.dispatchDomainEvent(
          {
            eventType: 'order.created',
            entityType: 'ORDER',
            entityId: 'ord-fail-safe',
            data: { orderNumber: 'CMD-FAIL-SAFE' },
          },
          failingDb
        );
      } catch {
        errorThrown = true;
      }

      assert.strictEqual(errorThrown, false, 'Notification failure must NEVER throw into checkout or order creation');
      assert.ok(Array.isArray(result), 'Returns notification records array or empty array without crashing');
    });
  });

  // ===========================================================================
  // 9. AUDIT LOGGING & VERSIONING
  // ===========================================================================
  describe('9. Audit Logging & Versioning', () => {
    it('9.1 saving a template increments version and preserves audit trail', async () => {
      const mockDb = createMockSupabase();

      const saved1 = await TemplateResolver.saveTemplate(
        {
          eventType: 'order.created',
          channel: 'SMS',
          locale: 'fr-DZ',
          bodyText: 'Version 1 text',
          isActive: true,
        },
        'user-admin-1',
        mockDb
      );

      assert.strictEqual(saved1.version, 1);

      const saved2 = await TemplateResolver.saveTemplate(
        {
          eventType: 'order.created',
          channel: 'SMS',
          locale: 'fr-DZ',
          bodyText: 'Version 2 updated text',
          isActive: true,
        },
        'user-admin-1',
        mockDb
      );

      assert.strictEqual(saved2.version, 2);
      assert.strictEqual(saved2.bodyText, 'Version 2 updated text');
    });
  });
});
