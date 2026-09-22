// DRIPIDIN Phase 4 — Logistics Abstraction, Delivery Rules & Provider Adapters Test Suite
// Exhaustive test coverage for Geography, Rules, Rates, Adapters, Registry, Webhooks & Checkout

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createMoney, MoneyMath } from '@/lib/money';
import {
  AddressService,
  ShippingRulesEngine,
  ShippingRateCalculator,
  LogisticsProviderRegistry,
  EcoTrackDeliveryProvider,
} from '@/lib/logistics';
import type {
  ShippingAddress,
  CreateShipmentRequest,
  NormalizedWebhookEvent,
} from '@/lib/logistics/types';
import { DeliveryService } from '@/lib/services/delivery.service';
import { ALGERIA_WILAYAS } from '@/lib/utils';

// In-memory Supabase Mock Store for Logistics & Webhook Testing
function createLogisticsSupabaseMock() {
  const orders: any[] = [
    {
      id: 'ord-ph4-001',
      order_number: 'DRP-2026-000401',
      recipient_name: 'Amine Belkacem',
      recipient_phone: '0555123456',
      recipient_phone_secondary: null,
      shipping_address_line: '15 Rue des Frères Bouadou, Bir Mourad Raïs',
      wilaya_code: 16,
      wilaya_name: 'Alger',
      commune_name: 'Bir Mourad Raïs',
      delivery_type: 'HOME',
      stopdesk_code: null,
      subtotal_dzd: 12000,
      shipping_cost_dzd: 400,
      total_dzd: 12400,
      status: 'CONFIRMED',
      tracking_number: null,
      courier_code: null,
      order_items: [
        { id: 'item-1', product_id: 'prod-scr-01', sku: 'DRP-SCR-OLED', product_name: 'Écran OLED', quantity: 1 },
      ],
    },
    {
      id: 'ord-ph4-002',
      order_number: 'DRP-2026-000402',
      recipient_name: 'Sofiane Mansouri',
      recipient_phone: '0770987654',
      shipping_address_line: 'Quartier Administratif',
      wilaya_code: 11, // Tamanrasset (Grand Sud)
      wilaya_name: 'Tamanrasset',
      commune_name: 'Tamanrasset',
      delivery_type: 'HOME',
      subtotal_dzd: 25000,
      shipping_cost_dzd: 600,
      total_dzd: 25600,
      status: 'PENDING',
      order_items: [
        { id: 'item-2', product_id: 'prod-bat-02', sku: 'DRP-BAT-5000', product_name: 'Batterie Haute Capacité', quantity: 2 },
      ],
    },
    {
      id: 'ord-ph4-003',
      order_number: 'DRP-2026-000403',
      recipient_name: 'Walid Haddad',
      recipient_phone: '0661112233',
      shipping_address_line: 'Boulevard Front de Mer',
      wilaya_code: 31, // Oran
      wilaya_name: 'Oran',
      commune_name: 'Oran',
      delivery_type: 'DESK',
      subtotal_dzd: 4500,
      shipping_cost_dzd: 450,
      total_dzd: 4950,
      status: 'CANCELLED',
      order_items: [
        { id: 'item-3', product_id: 'prod-chg-03', sku: 'DRP-CHG-65W', product_name: 'Chargeur Rapide 65W', quantity: 1 },
      ],
    },
  ];

  const deliveries: any[] = [];
  const orderStatusHistory: any[] = [];
  const inventoryTransactions: any[] = [];
  const auditLogs: any[] = [];
  const webhookEvents: any[] = [];

  const supabaseMock: any = {
    from: (table: string) => {
      const filters: Array<{ field: string; op: string; val: any }> = [];

      const queryBuilder: any = {
        select: () => queryBuilder,
        eq: (field: string, val: any) => {
          filters.push({ field, op: 'eq', val });
          return queryBuilder;
        },
        neq: (field: string, val: any) => {
          filters.push({ field, op: 'neq', val });
          return queryBuilder;
        },
        order: () => queryBuilder,
        limit: () => queryBuilder,
        range: () => queryBuilder,
        single: async () => {
          let dataset: any[] = [];
          if (table === 'orders') dataset = orders;
          else if (table === 'deliveries') dataset = deliveries;
          else if (table === 'webhook_events') dataset = webhookEvents;

          let filtered = dataset;
          for (const f of filters) {
            if (f.op === 'eq') filtered = filtered.filter(row => row[f.field] === f.val);
            if (f.op === 'neq') filtered = filtered.filter(row => row[f.field] !== f.val);
          }

          if (filtered.length === 0) return { data: null, error: { message: 'Row not found' } };
          const row = filtered[0];

          if (table === 'deliveries' && row.order_id) {
            const ord = orders.find(o => o.id === row.order_id);
            return { data: { ...row, orders: ord }, error: null };
          }

          return { data: row, error: null };
        },
        maybeSingle: async () => {
          const res = await queryBuilder.single();
          if (res.error) return { data: null, error: null };
          return res;
        },
        insert: async (dataToInsert: any) => {
          const rows = Array.isArray(dataToInsert) ? dataToInsert : [dataToInsert];
          for (const r of rows) {
            const rowWithId = {
              id: r.id || `gen_${Math.random().toString(36).substring(2, 9)}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...r,
            };
            if (table === 'orders') orders.push(rowWithId);
            else if (table === 'deliveries') deliveries.push(rowWithId);
            else if (table === 'order_status_history') orderStatusHistory.push(rowWithId);
            else if (table === 'inventory_transactions') inventoryTransactions.push(rowWithId);
            else if (table === 'audit_logs') auditLogs.push(rowWithId);
            else if (table === 'webhook_events') webhookEvents.push(rowWithId);
          }
          return { data: rows, error: null };
        },
        update: (updates: any) => {
          return {
            eq: async (field: string, val: any) => {
              let dataset: any[] = [];
              if (table === 'orders') dataset = orders;
              else if (table === 'deliveries') dataset = deliveries;
              else if (table === 'webhook_events') dataset = webhookEvents;

              for (const row of dataset) {
                if (row[field] === val) {
                  Object.assign(row, updates);
                }
              }
              return { data: null, error: null };
            },
          };
        },
      };

      return queryBuilder;
    },
  };

  return { supabaseMock, orders, deliveries, orderStatusHistory, inventoryTransactions, auditLogs, webhookEvents };
}

describe('Phase 4 — Logistics Abstraction, Delivery Rules & Provider Adapters', () => {

  describe('1. Geography & Address Contract', () => {
    it('normalizes Algerian Wilaya code 16 into Alger', () => {
      const normalized = AddressService.normalizeAddress({
        countryCode: 'DZ',
        administrativeAreaCode: 16,
        localityName: 'Alger Centre',
        addressLine1: '10 Rue Didouche Mourad',
        recipientName: 'Karim Bouzid',
        recipientPhone: '0550123456',
      });

      assert.strictEqual(normalized.countryCode, 'DZ');
      assert.strictEqual(normalized.administrativeAreaCode, 16);
      assert.strictEqual(normalized.administrativeAreaName, 'Alger');
      assert.strictEqual(normalized.localityName, 'Alger Centre');
      assert.strictEqual(normalized.recipientPhone, '0550123456');
    });

    it('cleans Algerian international telephone prefixes (+213) to national format', () => {
      const normalized = AddressService.normalizeAddress({
        countryCode: 'DZ',
        administrativeAreaCode: 31,
        addressLine1: 'Oran Es Senia',
        localityName: 'Es Senia',
        recipientName: 'Amel Larbi',
        recipientPhone: '+213 (0) 770 12-34-56',
        recipientPhoneSecondary: '00213550998877',
      });

      assert.strictEqual(normalized.recipientPhone, '0770123456');
      assert.strictEqual(normalized.recipientPhoneSecondary, '0550998877');
    });

    it('validates Algerian address correctly and rejects invalid phone or Wilaya', () => {
      const valid = AddressService.validateAddress({
        countryCode: 'DZ',
        administrativeAreaCode: 16,
        localityName: 'Kouba',
        addressLine1: 'Rue des Martyrs',
        recipientName: 'Omar Khaled',
        recipientPhone: '0550123456',
      });
      assert.strictEqual(valid.isValid, true);
      assert.strictEqual(valid.errors.length, 0);

      const invalid = AddressService.validateAddress({
        countryCode: 'DZ',
        administrativeAreaCode: 99, // Invalid Wilaya
        localityName: 'Kouba',
        addressLine1: 'Rue', // Too short
        recipientName: 'O', // Too short
        recipientPhone: '0123456789', // Invalid Algerian prefix
      });
      assert.strictEqual(invalid.isValid, false);
      assert.ok(invalid.errors.some(e => e.includes('Wilaya')));
      assert.ok(invalid.errors.some(e => e.includes('téléphone')));
    });

    it('validates French reference address requiring postal code', () => {
      const resWithoutPostal = AddressService.validateAddress({
        countryCode: 'FR',
        localityName: 'Paris',
        addressLine1: '15 Rue de Rivoli',
        recipientName: 'Jean Dupont',
        recipientPhone: '0612345678',
      });
      assert.strictEqual(resWithoutPostal.isValid, false);
      assert.ok(resWithoutPostal.errors.some(e => e.includes('code postal')));

      const resWithPostal = AddressService.validateAddress({
        countryCode: 'FR',
        postalCode: '75001',
        localityName: 'Paris',
        addressLine1: '15 Rue de Rivoli',
        recipientName: 'Jean Dupont',
        recipientPhone: '0612345678',
      });
      assert.strictEqual(resWithPostal.isValid, true);
    });

    it('guarantees complete 58 Wilaya database mapping without gaps', () => {
      assert.strictEqual(ALGERIA_WILAYAS.length, 58);
      for (let i = 1; i <= 58; i++) {
        const found = ALGERIA_WILAYAS.find(w => w.code === i);
        assert.ok(found, `Wilaya code ${i} must exist in registry`);
      }
    });
  });

  describe('2. Shipping Rules Engine', () => {
    it('verifies serviceable destinations for all 58 Algerian Wilayas', () => {
      for (let i = 1; i <= 58; i++) {
        const serviceable = ShippingRulesEngine.isServiceableDestination({
          countryCode: 'DZ',
          administrativeAreaCode: i,
        });
        assert.strictEqual(serviceable, true, `Wilaya ${i} must be serviceable`);
      }

      const invalidServiceable = ShippingRulesEngine.isServiceableDestination({
        countryCode: 'DZ',
        administrativeAreaCode: 59,
      });
      assert.strictEqual(invalidServiceable, false);
    });

    it('returns standard Home and Stopdesk shipping methods with extended Grand Sud delays', () => {
      const algerMethods = ShippingRulesEngine.getAvailableShippingMethods({
        countryCode: 'DZ',
        administrativeAreaCode: 16,
      });
      assert.strictEqual(algerMethods.length, 2);
      const algerHome = algerMethods.find(m => m.type === 'HOME')!;
      assert.strictEqual(algerHome.estimatedDaysMin, 1);
      assert.strictEqual(algerHome.estimatedDaysMax, 2);

      const tamanrassetMethods = ShippingRulesEngine.getAvailableShippingMethods({
        countryCode: 'DZ',
        administrativeAreaCode: 11, // Grand Sud
      });
      const southHome = tamanrassetMethods.find(m => m.type === 'HOME')!;
      assert.strictEqual(southHome.estimatedDaysMin, 3);
      assert.strictEqual(southHome.estimatedDaysMax, 5);
    });

    it('evaluates COD availability according to CountryProfile and store toggle', () => {
      // Algeria allows COD by default
      assert.strictEqual(ShippingRulesEngine.isCodAllowed({ countryCode: 'DZ' }, true), true);

      // Store toggle can disable COD even in Algeria
      assert.strictEqual(ShippingRulesEngine.isCodAllowed({ countryCode: 'DZ' }, false), false);

      // France disallows COD by default
      assert.strictEqual(ShippingRulesEngine.isCodAllowed({ countryCode: 'FR' }, true), false);
    });

    it('evaluates free shipping threshold using MoneyMath without float drift', () => {
      const subtotal = createMoney(19999.99, 'DZD');
      const threshold = createMoney(20000, 'DZD');

      assert.strictEqual(ShippingRulesEngine.isFreeShippingEligible(subtotal, threshold), false);

      const qualifyingSubtotal = createMoney(20000, 'DZD');
      assert.strictEqual(ShippingRulesEngine.isFreeShippingEligible(qualifyingSubtotal, threshold), true);

      const exceedingSubtotal = createMoney(25000, 'DZD');
      assert.strictEqual(ShippingRulesEngine.isFreeShippingEligible(exceedingSubtotal, threshold), true);
    });
  });

  describe('3. Shipping Rate Calculator & Money Integration', () => {
    it('calculates 400 DZD Home and 300 DZD Desk for Wilaya 16 (Alger)', () => {
      const homeRate = ShippingRateCalculator.calculateRate({
        wilayaCode: 16,
        deliveryType: 'HOME',
        currencyCode: 'DZD',
      });
      assert.strictEqual(homeRate.cost.amount, 400);
      assert.strictEqual(homeRate.cost.currency, 'DZD');
      assert.strictEqual(homeRate.isFreeShipping, false);

      const deskRate = ShippingRateCalculator.calculateRate({
        wilayaCode: 16,
        deliveryType: 'DESK',
        currencyCode: 'DZD',
      });
      assert.strictEqual(deskRate.cost.amount, 300);
      assert.strictEqual(deskRate.cost.currency, 'DZD');
    });

    it('calculates 600 DZD Home and 450 DZD Desk for Wilaya 31 (Oran)', () => {
      const homeRate = ShippingRateCalculator.calculateRate({
        wilayaCode: 31,
        deliveryType: 'HOME',
        currencyCode: 'DZD',
      });
      assert.strictEqual(homeRate.cost.amount, 600);

      const deskRate = ShippingRateCalculator.calculateRate({
        wilayaCode: 31,
        deliveryType: 'DESK',
        currencyCode: 'DZD',
      });
      assert.strictEqual(deskRate.cost.amount, 450);
    });

    it('applies free shipping when subtotal reaches threshold', () => {
      const rate = ShippingRateCalculator.calculateRate({
        wilayaCode: 16,
        deliveryType: 'HOME',
        subtotal: createMoney(25000, 'DZD'),
        freeShippingThreshold: createMoney(20000, 'DZD'),
      });
      assert.strictEqual(rate.isFreeShipping, true);
      assert.strictEqual(rate.cost.amount, 0);
      assert.strictEqual(rate.cost.currency, 'DZD');
    });

    it('supports alternate store currency (e.g. EUR) dynamically', () => {
      const rate = ShippingRateCalculator.calculateRate({
        wilayaCode: 16,
        deliveryType: 'HOME',
        currencyCode: 'EUR',
      });
      assert.strictEqual(rate.cost.currency, 'EUR');
      assert.strictEqual(rate.cost.amount, 400);
    });

    it('provides legacy delivery rate result shape for backward compatibility', () => {
      const legacy = ShippingRateCalculator.calculateLegacyRate({
        wilayaCode: 16,
        deliveryType: 'HOME',
      });
      assert.strictEqual(legacy.wilayaCode, 16);
      assert.strictEqual(legacy.wilayaName, 'Alger');
      assert.strictEqual(legacy.baseCostDzd, 400);
      assert.strictEqual(legacy.finalCostDzd, 400);
      assert.strictEqual(legacy.isFreeShipping, false);
      assert.strictEqual(legacy.providerCode, 'ECOTRACK');
    });
  });

  describe('4. EcoTrack Delivery Provider Adapter', () => {
    const provider = new EcoTrackDeliveryProvider();

    it('declares full logistics capabilities', () => {
      assert.strictEqual(provider.providerCode, 'ECOTRACK');
      assert.strictEqual(provider.capabilities.createShipment, true);
      assert.strictEqual(provider.capabilities.cancelShipment, true);
      assert.strictEqual(provider.capabilities.tracking, true);
      assert.strictEqual(provider.capabilities.webhook, true);
      assert.strictEqual(provider.capabilities.codSupport, true);
    });

    it('normalizes raw EcoTrack status codes accurately into ShipmentStatus', () => {
      assert.strictEqual(provider.normalizeStatus('pret_a_expedier'), 'PENDING');
      assert.strictEqual(provider.normalizeStatus('recu'), 'PICKED_UP');
      assert.strictEqual(provider.normalizeStatus('en_transit'), 'IN_TRANSIT');
      assert.strictEqual(provider.normalizeStatus('en_livraison'), 'OUT_FOR_DELIVERY');
      assert.strictEqual(provider.normalizeStatus('livre'), 'DELIVERED');
      assert.strictEqual(provider.normalizeStatus('echec'), 'FAILED');
      assert.strictEqual(provider.normalizeStatus('retour_recu'), 'RETURNED');
      assert.strictEqual(provider.normalizeStatus('annule'), 'CANCELLED');
    });

    it('generates simulated sandbox shipment in demo mode without calling live API', async () => {
      const req: CreateShipmentRequest = {
        orderId: 'ord-test-01',
        orderNumber: 'DRP-2026-999001',
        recipient: {
          name: 'Karim Bouzid',
          phone: '0550123456',
        },
        address: {
          countryCode: 'DZ',
          administrativeAreaCode: 16,
          administrativeAreaName: 'Alger',
          localityName: 'Alger Centre',
          addressLine1: 'Didouche Mourad',
          recipientName: 'Karim Bouzid',
          recipientPhone: '0550123456',
        },
        deliveryType: 'HOME',
        codAmount: createMoney(14500, 'DZD'),
      };

      const result = await provider.createShipment(req);
      assert.strictEqual(result.providerCode, 'ECOTRACK');
      assert.match(result.trackingNumber, /^ECO-/);
      assert.ok(result.labelUrl?.includes(result.trackingNumber));
      assert.ok(result.trackingUrl?.includes(result.trackingNumber));
    });

    it('returns successful sandbox health check on testConnection()', async () => {
      const testRes = await provider.testConnection();
      assert.strictEqual(testRes.success, true);
      assert.strictEqual(testRes.providerCode, 'ECOTRACK');
      assert.strictEqual(testRes.environment, 'sandbox');
    });

    it('parses raw EcoTrack webhook payload into NormalizedWebhookEvent', () => {
      const rawPayload = {
        event_id: 'evt-eco-99',
        tracking_code: 'ECO-999888',
        reference: 'DRP-2026-000401',
        status: 'en_transit',
        status_text: 'Colis en cours de transfert',
        wilaya_name: 'Blida',
        montant: 12400,
        timestamp: '2026-09-17T18:00:00.000Z',
      };

      const normalized = provider.parseWebhook(rawPayload);
      assert.strictEqual(normalized.providerCode, 'ECOTRACK');
      assert.strictEqual(normalized.trackingNumber, 'ECO-999888');
      assert.strictEqual(normalized.status, 'IN_TRANSIT');
      assert.strictEqual(normalized.providerStatus, 'en_transit');
      assert.strictEqual(normalized.referenceOrderNumber, 'DRP-2026-000401');
      assert.strictEqual(normalized.codCollectedAmount, 12400);
      assert.strictEqual(normalized.location, 'Blida');
    });
  });

  describe('5. Provider Registry', () => {
    it('resolves default ECOTRACK provider', () => {
      const provider = LogisticsProviderRegistry.getProvider();
      assert.strictEqual(provider.providerCode, 'ECOTRACK');
    });

    it('checks provider registration status', () => {
      assert.strictEqual(LogisticsProviderRegistry.hasProvider('ECOTRACK'), true);
      assert.strictEqual(LogisticsProviderRegistry.hasProvider('UNKNOWN_COURIER'), false);
    });

    it('falls back safely to default provider for unrecognized provider code', () => {
      const provider = LogisticsProviderRegistry.getProvider('UNKNOWN_COURIER');
      assert.strictEqual(provider.providerCode, 'ECOTRACK');
    });

    it('lists registered providers with their capabilities', () => {
      const list = LogisticsProviderRegistry.listProviders();
      assert.ok(list.length >= 1);
      const eco = list.find(p => p.code === 'ECOTRACK');
      assert.ok(eco);
      assert.strictEqual(eco.capabilities.createShipment, true);
    });
  });

  describe('6. DeliveryService & Normalized Webhook Lifecycle', () => {
    it('creates authoritative shipment and records delivery + order status history', async () => {
      const { supabaseMock, orders, deliveries, orderStatusHistory } = createLogisticsSupabaseMock();
      const service = new DeliveryService(supabaseMock);

      const result = await service.createShipment('ord-ph4-001', 'ECOTRACK');
      assert.strictEqual(result.success, true);
      assert.match(result.trackingNumber, /^ECO-/);

      const order = orders.find(o => o.id === 'ord-ph4-001');
      assert.strictEqual(order.status, 'READY_FOR_SHIPMENT');
      assert.strictEqual(order.tracking_number, result.trackingNumber);
      assert.strictEqual(order.courier_code, 'ECOTRACK');

      assert.strictEqual(deliveries.length, 1);
      assert.strictEqual(deliveries[0].tracking_number, result.trackingNumber);
      assert.strictEqual(deliveries[0].status, 'PENDING');

      const history = orderStatusHistory.find(h => h.order_id === 'ord-ph4-001');
      assert.strictEqual(history.new_status, 'READY_FOR_SHIPMENT');
    });

    it('rejects shipment creation for PENDING (unconfirmed) orders', async () => {
      const { supabaseMock } = createLogisticsSupabaseMock();
      const service = new DeliveryService(supabaseMock);

      await assert.rejects(
        async () => {
          await service.createShipment('ord-ph4-002');
        },
        /La commande doit d'abord être confirmée/
      );
    });

    it('processes normalized in-transit webhook event and records FULFILLMENT_OUT inventory transaction', async () => {
      const { supabaseMock, orders, inventoryTransactions } = createLogisticsSupabaseMock();
      const service = new DeliveryService(supabaseMock);

      const shipment = await service.createShipment('ord-ph4-001');

      const event: NormalizedWebhookEvent = {
        providerCode: 'ECOTRACK',
        externalEventId: 'evt-norm-01',
        trackingNumber: shipment.trackingNumber,
        status: 'IN_TRANSIT',
        providerStatus: 'en_transit',
        description: 'Colis en cours d\'acheminement',
        location: 'Hub Blida',
        timestamp: new Date().toISOString(),
        referenceOrderNumber: 'DRP-2026-000401',
        rawPayload: {},
      };

      const res = await service.processNormalizedWebhookEvent(event);
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.statusNormalized, 'IN_TRANSIT');

      const order = orders.find(o => o.id === 'ord-ph4-001');
      assert.strictEqual(order.status, 'SHIPPED');

      const fulfillmentTx = inventoryTransactions.find(t => t.transaction_type === 'FULFILLMENT_OUT');
      assert.ok(fulfillmentTx, 'Dispatched shipment must create FULFILLMENT_OUT stock transaction');
      assert.strictEqual(fulfillmentTx.product_id, 'prod-scr-01');
      assert.strictEqual(fulfillmentTx.quantity_change, 1);
    });

    it('processes delivered webhook event and transitions order to PAID and DELIVERED', async () => {
      const { supabaseMock, orders } = createLogisticsSupabaseMock();
      const service = new DeliveryService(supabaseMock);

      const shipment = await service.createShipment('ord-ph4-001');

      // Dispatch
      await service.processNormalizedWebhookEvent({
        providerCode: 'ECOTRACK',
        trackingNumber: shipment.trackingNumber,
        status: 'IN_TRANSIT',
        providerStatus: 'en_transit',
        timestamp: new Date().toISOString(),
        rawPayload: {},
      });

      // Delivery
      await service.processNormalizedWebhookEvent({
        providerCode: 'ECOTRACK',
        trackingNumber: shipment.trackingNumber,
        status: 'DELIVERED',
        providerStatus: 'livre',
        codCollectedAmount: 12400,
        timestamp: new Date().toISOString(),
        rawPayload: {},
      });

      const order = orders.find(o => o.id === 'ord-ph4-001');
      assert.strictEqual(order.status, 'DELIVERED');
      assert.strictEqual(order.payment_status, 'PAID');
    });

    it('protects monotonic state: terminal CANCELLED order is not overwritten by late delivery webhook', async () => {
      const { supabaseMock, orders, inventoryTransactions, deliveries } = createLogisticsSupabaseMock();
      const service = new DeliveryService(supabaseMock);

      const order = orders.find(o => o.id === 'ord-ph4-003'); // CANCELLED
      deliveries.push({
        id: 'del-cancelled-test',
        order_id: order.id,
        tracking_number: 'ECO-LATE-CANCELLED',
        status: 'PENDING',
        orders: order,
      });

      await service.processNormalizedWebhookEvent({
        providerCode: 'ECOTRACK',
        trackingNumber: 'ECO-LATE-CANCELLED',
        status: 'DELIVERED',
        providerStatus: 'livre',
        timestamp: new Date().toISOString(),
        rawPayload: {},
      });

      assert.strictEqual(order.status, 'CANCELLED', 'Terminal CANCELLED state must not be overwritten');
      const fulfillmentTxs = inventoryTransactions.filter(t => t.reference_id === order.order_number && t.transaction_type === 'FULFILLMENT_OUT');
      assert.strictEqual(fulfillmentTxs.length, 0, 'Cancelled order must never have stock deducted');
    });
  });

  describe('7. Order Snapshot Immutability & Checkout Integration', () => {
    it('snapshots address and delivery rate at order creation without relying on live settings', () => {
      const address: ShippingAddress = {
        countryCode: 'DZ',
        administrativeAreaCode: 16,
        administrativeAreaName: 'Alger',
        localityName: 'Alger Centre',
        addressLine1: '15 Rue Didouche Mourad',
        addressLine2: 'Apt 4B',
        recipientName: 'Hakim Ziani',
        recipientPhone: '0555998877',
      };

      const snapshot = AddressService.toOrderSnapshot(address);
      assert.strictEqual(snapshot.wilaya_code, 16);
      assert.strictEqual(snapshot.wilaya_name, 'Alger');
      assert.strictEqual(snapshot.commune_name, 'Alger Centre');
      assert.strictEqual(snapshot.shipping_address_line, '15 Rue Didouche Mourad, Apt 4B');
      assert.strictEqual(snapshot.recipient_phone, '0555998877');

      // Reconstruct address from historical snapshot
      const restored = AddressService.fromOrderRecord(snapshot);
      assert.strictEqual(restored.administrativeAreaCode, 16);
      assert.strictEqual(restored.administrativeAreaName, 'Alger');
      assert.strictEqual(restored.localityName, 'Alger Centre');
    });

    it('calculates order total using MoneyMath adding cart subtotal and delivery cost', () => {
      const subtotal = createMoney(14100, 'DZD');
      const deliveryRate = ShippingRateCalculator.calculateRate({
        wilayaCode: 16,
        deliveryType: 'HOME',
        subtotal,
      });

      const total = MoneyMath.add(subtotal, deliveryRate.cost);
      assert.strictEqual(total.amount, 14500);
      assert.strictEqual(total.currency, 'DZD');
    });
  });
});
