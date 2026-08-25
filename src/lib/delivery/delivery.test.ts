// Automated Test Suite for Delivery Provider Abstraction, EcoTrack Integration, Pricing & Webhooks

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EcoTrackDeliveryProvider } from './ecotrack-provider';
import { DeliveryPricingService } from './delivery-pricing.service';
import { DeliveryProviderRegistry } from './registry';
import { DeliveryService } from '@/lib/services/delivery.service';
import { OrderService } from '@/lib/services/order.service';
import type { DeliveryStatus, OrderStatus } from '@/types/database.types';

// Mock Supabase Database In-Memory Store
function createMockDeliverySupabase() {
  const orders: any[] = [
    {
      id: 'order-101-confirmed',
      order_number: 'HP-2026-000101',
      recipient_name: 'Karim Bouzid',
      recipient_phone: '0550123456',
      recipient_phone_secondary: null,
      shipping_address_line: '12 Rue Didouche Mourad',
      wilaya_code: 16,
      wilaya_name: 'Alger',
      commune_name: 'Alger Centre',
      delivery_type: 'HOME',
      stopdesk_code: null,
      total_dzd: 14500,
      subtotal_dzd: 14100,
      status: 'CONFIRMED',
      tracking_number: null,
      courier_code: null,
      customer_notes: 'Appeler avant livraison',
      order_items: [
        { id: 'item-1', sku: 'HP-SCR-SAM-S21', product_name: 'Écran Samsung S21 OLED', quantity: 1, product_id: 'prod-s21' },
      ],
    },
    {
      id: 'order-102-pending',
      order_number: 'HP-2026-000102',
      recipient_name: 'Yacine Amari',
      recipient_phone: '0660987654',
      shipping_address_line: 'Cité 500 Logements',
      wilaya_code: 31,
      wilaya_name: 'Oran',
      commune_name: 'Es Senia',
      delivery_type: 'DESK',
      stopdesk_code: 'STOP-ORAN-01',
      total_dzd: 8450,
      status: 'PENDING',
      order_items: [
        { id: 'item-2', sku: 'HP-BAT-IPH-13', product_name: 'Batterie iPhone 13 Originale', quantity: 2, product_id: 'prod-iph13' },
      ],
    },
    {
      id: 'order-103-cancelled',
      order_number: 'HP-2026-000103',
      recipient_name: 'Samir Brahimi',
      recipient_phone: '0770112233',
      shipping_address_line: 'Boulevard de la Soummam',
      wilaya_code: 25,
      wilaya_name: 'Constantine',
      commune_name: 'Constantine',
      delivery_type: 'HOME',
      total_dzd: 5600,
      status: 'CANCELLED',
      order_items: [
        { id: 'item-3', sku: 'HP-CON-USB-C', product_name: 'Connecteur de charge USB-C', quantity: 1, product_id: 'prod-usbc' },
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
      let lastInserted: any[] = [];

      const queryBuilder: any = {
        select: (cols: string = '*', options?: any) => {
          return queryBuilder;
        },
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

          // Embed relations if requested
          if (table === 'deliveries' && row.order_id) {
            const ord = orders.find(o => o.id === row.order_id);
            return { data: { ...row, orders: ord }, error: null };
          }

          return { data: row, error: null };
        },
        maybeSingle: async () => {
          let dataset: any[] = [];
          if (table === 'orders') dataset = orders;
          else if (table === 'deliveries') dataset = deliveries;
          else if (table === 'webhook_events') dataset = webhookEvents;

          let filtered = dataset;
          for (const f of filters) {
            if (f.op === 'eq') filtered = filtered.filter(row => row[f.field] === f.val);
            if (f.op === 'neq') filtered = filtered.filter(row => row[f.field] !== f.val);
          }

          if (filtered.length === 0) return { data: null, error: null };
          const row = filtered[0];
          if (table === 'deliveries' && row.order_id) {
            const ord = orders.find(o => o.id === row.order_id);
            return { data: { ...row, orders: ord }, error: null };
          }
          return { data: row, error: null };
        },
        insert: async (data: any) => {
          const arr = Array.isArray(data) ? data : [data];
          for (const item of arr) {
            const row = { id: `id-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, ...item };
            if (table === 'orders') orders.push(row);
            else if (table === 'deliveries') deliveries.push(row);
            else if (table === 'order_status_history') orderStatusHistory.push(row);
            else if (table === 'inventory_transactions') inventoryTransactions.push(row);
            else if (table === 'audit_logs') auditLogs.push(row);
            else if (table === 'webhook_events') webhookEvents.push(row);
            lastInserted.push(row);
          }
          const insertChain: any = {
            select: () => insertChain,
            single: async () => ({ data: lastInserted[0], error: null }),
            then: (resolve: any) => resolve({ data: lastInserted, error: null }),
          };
          return insertChain;
        },
        update: (updates: any) => {
          return {
            eq: (field: string, val: any) => {
              let dataset: any[] = [];
              if (table === 'orders') dataset = orders;
              else if (table === 'deliveries') dataset = deliveries;
              else if (table === 'webhook_events') dataset = webhookEvents;

              const target = dataset.find((r: any) => r[field] === val);
              if (target) {
                Object.assign(target, updates);
              }
              const updateChain: any = {
                select: () => updateChain,
                single: async () => ({ data: target || updates, error: null }),
                then: (resolve: any) => resolve({ data: target || updates, error: null }),
              };
              return updateChain;
            },
          };
        },
        then: (resolve: any) => {
          let dataset: any[] = [];
          if (table === 'orders') dataset = orders;
          else if (table === 'deliveries') dataset = deliveries;
          else if (table === 'webhook_events') dataset = webhookEvents;

          let filtered = dataset;
          for (const f of filters) {
            if (f.op === 'eq') filtered = filtered.filter(row => row[f.field] === f.val);
            if (f.op === 'neq') filtered = filtered.filter(row => row[f.field] !== f.val);
          }
          return resolve({ data: filtered, error: null, count: filtered.length });
        },
      };

      return queryBuilder;
    },
  };

  return { supabaseMock, orders, deliveries, orderStatusHistory, inventoryTransactions, auditLogs, webhookEvents };
}

describe('HamzaPhone Delivery & Logistics Engine', () => {

  describe('1. Authoritative Delivery Pricing Service (58 Algerian Wilayas)', () => {
    it('calculates 400 DZD for Wilaya 16 (Alger) Home Delivery', () => {
      const rate = DeliveryPricingService.calculateDeliveryCost({
        wilayaCode: 16,
        deliveryType: 'HOME',
      });
      assert.strictEqual(rate.baseCostDzd, 400);
      assert.strictEqual(rate.finalCostDzd, 400);
      assert.strictEqual(rate.estimatedDaysMin, 1);
      assert.strictEqual(rate.estimatedDaysMax, 2);
    });

    it('calculates 300 DZD for Wilaya 16 (Alger) Stopdesk Delivery', () => {
      const rate = DeliveryPricingService.calculateDeliveryCost({
        wilayaCode: 16,
        deliveryType: 'DESK',
      });
      assert.strictEqual(rate.baseCostDzd, 300);
      assert.strictEqual(rate.finalCostDzd, 300);
    });

    it('calculates 600 DZD for Wilaya 31 (Oran) Home Delivery and 450 DZD Stopdesk', () => {
      const homeRate = DeliveryPricingService.calculateDeliveryCost({
        wilayaCode: 31,
        deliveryType: 'HOME',
      });
      const deskRate = DeliveryPricingService.calculateDeliveryCost({
        wilayaCode: 31,
        deliveryType: 'DESK',
      });
      assert.strictEqual(homeRate.finalCostDzd, 600);
      assert.strictEqual(deskRate.finalCostDzd, 450);
    });

    it('sets 3-5 business days transit time for Grand Sud Wilayas (e.g. 11 - Tamanrasset)', () => {
      const rate = DeliveryPricingService.calculateDeliveryCost({
        wilayaCode: 11,
        deliveryType: 'HOME',
      });
      assert.strictEqual(rate.estimatedDaysMin, 3);
      assert.strictEqual(rate.estimatedDaysMax, 5);
      assert.strictEqual(rate.finalCostDzd, 600);
    });

    it('applies free shipping when subtotal breaches threshold', () => {
      const rate = DeliveryPricingService.calculateDeliveryCost({
        wilayaCode: 16,
        subtotalDzd: 25000,
        freeShippingThresholdDzd: 20000,
      });
      assert.strictEqual(rate.isFreeShipping, true);
      assert.strictEqual(rate.finalCostDzd, 0);
    });

    it('generates rate calculations for all 58 Wilayas without gaps', () => {
      const allRates = DeliveryPricingService.getAllWilayaRates('HOME');
      assert.strictEqual(allRates.length, 58);
      assert.strictEqual(allRates[0].wilayaCode, 1);
      assert.strictEqual(allRates[57].wilayaCode, 58);
    });
  });

  describe('2. EcoTrack Delivery Provider & Status Normalization', () => {
    const provider = new EcoTrackDeliveryProvider();

    it('normalizes EcoTrack status codes accurately', () => {
      assert.strictEqual(provider.normalizeStatus('pret_a_expedier'), 'PENDING');
      assert.strictEqual(provider.normalizeStatus('recu'), 'PICKED_UP');
      assert.strictEqual(provider.normalizeStatus('en_transit'), 'IN_TRANSIT');
      assert.strictEqual(provider.normalizeStatus('en_livraison'), 'OUT_FOR_DELIVERY');
      assert.strictEqual(provider.normalizeStatus('livre'), 'DELIVERED');
      assert.strictEqual(provider.normalizeStatus('echec'), 'FAILED');
      assert.strictEqual(provider.normalizeStatus('retour_recu'), 'RETURNED');
      assert.strictEqual(provider.normalizeStatus('annule'), 'CANCELLED');
    });

    it('generates deterministic test shipment in sandbox mode', async () => {
      const result = await provider.createShipment({
        orderId: 'order-101',
        orderNumber: 'HP-2026-000101',
        recipientName: 'Karim Bouzid',
        recipientPhone: '0550123456',
        wilayaCode: 16,
        wilayaName: 'Alger',
        communeName: 'Alger Centre',
        addressLine: 'Didouche Mourad',
        deliveryType: 'HOME',
        codAmountDzd: 14500,
      });

      assert.strictEqual(result.providerCode, 'ECOTRACK');
      assert.match(result.trackingNumber, /^ECO-/);
      assert.ok(result.labelUrl);
    });

    it('returns successful sandbox health check on testConnection()', async () => {
      const testRes = await provider.testConnection();
      assert.strictEqual(testRes.success, true);
      assert.strictEqual(testRes.providerCode, 'ECOTRACK');
    });
  });

  describe('3. DeliveryService: Authoritative Shipment Creation & Idempotency', () => {
    it('rejects shipment creation for PENDING unconfirmed orders', async () => {
      const { supabaseMock } = createMockDeliverySupabase();
      const service = new DeliveryService(supabaseMock);

      await assert.rejects(
        async () => {
          await service.createShipment('order-102-pending');
        },
        /La commande doit d'abord être confirmée/
      );
    });

    it('rejects shipment creation for CANCELLED orders', async () => {
      const { supabaseMock } = createMockDeliverySupabase();
      const service = new DeliveryService(supabaseMock);

      await assert.rejects(
        async () => {
          await service.createShipment('order-103-cancelled');
        },
        /Impossible de créer une expédition pour une commande en statut "CANCELLED"/
      );
    });

    it('creates tracked EcoTrack shipment and advances CONFIRMED order to READY_FOR_SHIPMENT', async () => {
      const { supabaseMock, orders, deliveries, orderStatusHistory, auditLogs } = createMockDeliverySupabase();
      const service = new DeliveryService(supabaseMock);

      const result = await service.createShipment('order-101-confirmed', 'ECOTRACK', {
        userId: 'staff-1',
        email: 'logisticien@hamzaphone.dz',
        role: 'ORDER_MANAGER',
        userType: 'STAFF',
        isActive: true,
        permissions: new Set(['orders.update']),
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.alreadyExisted, false);
      assert.match(result.trackingNumber, /^ECO-/);

      // Verify order updated
      const updatedOrder = orders.find(o => o.id === 'order-101-confirmed');
      assert.strictEqual(updatedOrder.status, 'READY_FOR_SHIPMENT');
      assert.strictEqual(updatedOrder.tracking_number, result.trackingNumber);
      assert.strictEqual(updatedOrder.courier_code, 'ECOTRACK');

      // Verify delivery record
      assert.strictEqual(deliveries.length, 1);
      assert.strictEqual(deliveries[0].tracking_number, result.trackingNumber);
      assert.strictEqual(deliveries[0].cod_amount_dzd, 14500);

      // Verify status history
      assert.strictEqual(orderStatusHistory.length, 1);
      assert.strictEqual(orderStatusHistory[0].new_status, 'READY_FOR_SHIPMENT');

      // Verify audit log
      assert.strictEqual(auditLogs.length, 1);
      assert.strictEqual(auditLogs[0].action, 'shipment.created');
    });

    it('Idempotency Guard: repeated submission returns existing shipment without duplicates', async () => {
      const { supabaseMock, deliveries } = createMockDeliverySupabase();
      const service = new DeliveryService(supabaseMock);

      // First creation
      const res1 = await service.createShipment('order-101-confirmed');
      assert.strictEqual(res1.alreadyExisted, false);
      assert.strictEqual(deliveries.length, 1);

      // Second identical call (simulating Admin double-click)
      const res2 = await service.createShipment('order-101-confirmed');
      assert.strictEqual(res2.alreadyExisted, true);
      assert.strictEqual(res2.trackingNumber, res1.trackingNumber);
      assert.strictEqual(deliveries.length, 1); // No duplicate delivery row inserted
    });
  });

  describe('4. EcoTrack Webhook Processing & Downstream State Transitions', () => {
    it('processes IN_TRANSIT webhook and transitions order to SHIPPED with FULFILLMENT_OUT', async () => {
      const { supabaseMock, orders, inventoryTransactions } = createMockDeliverySupabase();
      const service = new DeliveryService(supabaseMock);

      // First create shipment
      const shipment = await service.createShipment('order-101-confirmed');

      // Ingest EcoTrack webhook
      const webhookRes = await service.processWebhookEvent({
        event_id: 'evt-991',
        tracking_code: shipment.trackingNumber,
        status: 'en_transit',
        status_text: 'Colis parti vers centre de distribution Alger',
        wilaya_name: 'Alger',
      });

      assert.strictEqual(webhookRes.success, true);
      assert.strictEqual(webhookRes.statusNormalized, 'IN_TRANSIT');

      const updatedOrder = orders.find(o => o.id === 'order-101-confirmed');
      assert.strictEqual(updatedOrder.status, 'SHIPPED');

      const fulfillmentTx = inventoryTransactions.find(t => t.transaction_type === 'FULFILLMENT_OUT');
      assert.ok(fulfillmentTx, 'Expected FULFILLMENT_OUT transaction upon dispatch');
      assert.strictEqual(fulfillmentTx.quantity_change, 1);
    });

    it('processes DELIVERED webhook, marks order DELIVERED, and does not duplicate FULFILLMENT_OUT if already SHIPPED', async () => {
      const { supabaseMock, orders, inventoryTransactions } = createMockDeliverySupabase();
      const service = new DeliveryService(supabaseMock);

      const shipment = await service.createShipment('order-101-confirmed');

      // Step 1: In transit
      await service.processWebhookEvent({
        event_id: 'evt-step1',
        tracking_code: shipment.trackingNumber,
        status: 'en_transit',
      });
      assert.strictEqual(inventoryTransactions.filter(t => t.transaction_type === 'FULFILLMENT_OUT').length, 1);

      // Step 2: Delivered
      const webhookRes = await service.processWebhookEvent({
        event_id: 'evt-step2',
        tracking_code: shipment.trackingNumber,
        status: 'livre',
        status_text: 'Colis livré et fonds COD collectés',
        montant: 14500,
      });

      assert.strictEqual(webhookRes.success, true);
      assert.strictEqual(webhookRes.statusNormalized, 'DELIVERED');

      const updatedOrder = orders.find(o => o.id === 'order-101-confirmed');
      assert.strictEqual(updatedOrder.status, 'DELIVERED');
      assert.strictEqual(updatedOrder.payment_status, 'PAID');

      // FULFILLMENT_OUT is NOT duplicated!
      const fulfillmentTxs = inventoryTransactions.filter(t => t.transaction_type === 'FULFILLMENT_OUT');
      assert.strictEqual(fulfillmentTxs.length, 1, 'FULFILLMENT_OUT must not be recorded twice for same order');
    });

    it('processes RETURNED webhook and records CUSTOMER_RETURN_RESTOCK when order was in transit', async () => {
      const { supabaseMock, orders, inventoryTransactions } = createMockDeliverySupabase();
      const service = new DeliveryService(supabaseMock);

      const shipment = await service.createShipment('order-101-confirmed');

      // Transit first (triggers FULFILLMENT_OUT)
      await service.processWebhookEvent({
        event_id: 'evt-tr-1',
        tracking_code: shipment.trackingNumber,
        status: 'en_transit',
      });

      const webhookRes = await service.processWebhookEvent({
        event_id: 'evt-993',
        tracking_code: shipment.trackingNumber,
        status: 'retour_recu',
        status_text: 'Colis retourné au magasin - Client absent',
      });

      assert.strictEqual(webhookRes.statusNormalized, 'RETURNED');
      const updatedOrder = orders.find(o => o.id === 'order-101-confirmed');
      assert.strictEqual(updatedOrder.status, 'RETURNED');

      const restockTx = inventoryTransactions.find(t => t.transaction_type === 'CUSTOMER_RETURN_RESTOCK');
      assert.ok(restockTx, 'Expected CUSTOMER_RETURN_RESTOCK inventory transaction');
    });

    it('Webhook Deduplication: repeated event returns idempotent success without duplicate actions', async () => {
      const { supabaseMock } = createMockDeliverySupabase();
      const service = new DeliveryService(supabaseMock);

      const shipment = await service.createShipment('order-101-confirmed');

      const res1 = await service.processWebhookEvent({
        event_id: 'evt-duplicate-test',
        tracking_code: shipment.trackingNumber,
        status: 'en_cours',
      });
      assert.strictEqual(res1.statusNormalized, 'OUT_FOR_DELIVERY');

      // Second duplicate call
      const res2 = await service.processWebhookEvent({
        event_id: 'evt-duplicate-test',
        tracking_code: shipment.trackingNumber,
        status: 'en_cours',
      });
      assert.strictEqual(res2.success, true);
      assert.match(res2.message, /Idempotence/);
    });
  });

  describe('5. Double Processing & State Machine Edge Case Audit', () => {

    it('Edge Case 1: Same delivery status received repeatedly (e.g. repeated en_transit)', async () => {
      const { supabaseMock, inventoryTransactions } = createMockDeliverySupabase();
      const service = new DeliveryService(supabaseMock);

      const shipment = await service.createShipment('order-101-confirmed');

      // Received 3 times with different event IDs (simulating courier network sync retries)
      await service.processWebhookEvent({ event_id: 'evt-r1', tracking_code: shipment.trackingNumber, status: 'en_transit' });
      await service.processWebhookEvent({ event_id: 'evt-r2', tracking_code: shipment.trackingNumber, status: 'en_transit' });
      await service.processWebhookEvent({ event_id: 'evt-r3', tracking_code: shipment.trackingNumber, status: 'en_transit' });

      const fulfillmentTxs = inventoryTransactions.filter(t => t.transaction_type === 'FULFILLMENT_OUT');
      assert.strictEqual(fulfillmentTxs.length, 1, 'Repeated in-transit webhooks must only trigger 1 FULFILLMENT_OUT');
    });

    it('Edge Case 2: Delivery status arrives after an order was already RETURNED (out-of-order)', async () => {
      const { supabaseMock, orders, inventoryTransactions } = createMockDeliverySupabase();
      const service = new DeliveryService(supabaseMock);

      const shipment = await service.createShipment('order-101-confirmed');

      // 1. Shipped
      await service.processWebhookEvent({ event_id: 'evt-shipped', tracking_code: shipment.trackingNumber, status: 'en_transit' });
      // 2. Returned
      await service.processWebhookEvent({ event_id: 'evt-ret', tracking_code: shipment.trackingNumber, status: 'retour_recu' });
      
      const orderAfterReturn = orders.find(o => o.id === 'order-101-confirmed');
      assert.strictEqual(orderAfterReturn.status, 'RETURNED');

      // 3. Late/Out-of-order webhook arrives claiming "livre" (DELIVERED)
      await service.processWebhookEvent({ event_id: 'evt-late-delivery', tracking_code: shipment.trackingNumber, status: 'livre' });

      // Order must remain RETURNED (terminal guard)
      assert.strictEqual(orderAfterReturn.status, 'RETURNED', 'Late delivery webhook must not overwrite terminal RETURNED state');
      
      // Stock transactions must not create phantom deductions
      const restockTxs = inventoryTransactions.filter(t => t.transaction_type === 'CUSTOMER_RETURN_RESTOCK');
      assert.strictEqual(restockTxs.length, 1);
    });

    it('Edge Case 3: Return webhook arrives twice', async () => {
      const { supabaseMock, inventoryTransactions } = createMockDeliverySupabase();
      const service = new DeliveryService(supabaseMock);

      const shipment = await service.createShipment('order-101-confirmed');

      await service.processWebhookEvent({ event_id: 'evt-dispatch', tracking_code: shipment.trackingNumber, status: 'en_transit' });

      // First return webhook
      await service.processWebhookEvent({ event_id: 'evt-ret-1', tracking_code: shipment.trackingNumber, status: 'retour_recu' });
      // Second return webhook
      await service.processWebhookEvent({ event_id: 'evt-ret-2', tracking_code: shipment.trackingNumber, status: 'retour_recu' });

      const restockTxs = inventoryTransactions.filter(t => t.transaction_type === 'CUSTOMER_RETURN_RESTOCK');
      assert.strictEqual(restockTxs.length, 1, 'Duplicate return webhooks must not create duplicate restock transactions');
    });

    it('Edge Case 4: Delivery webhook arrives after an order was CANCELLED', async () => {
      const { supabaseMock, orders, inventoryTransactions } = createMockDeliverySupabase();
      const service = new DeliveryService(supabaseMock);

      // Order 103 is CANCELLED
      const order = orders.find(o => o.id === 'order-103-cancelled');
      assert.strictEqual(order.status, 'CANCELLED');

      // Setup fake delivery record for cancelled order
      const { deliveries } = createMockDeliverySupabase();
      deliveries.push({
        id: 'del-cancelled-1',
        order_id: 'order-103-cancelled',
        tracking_number: 'ECO-CANCELLED-99',
        status: 'PENDING',
        orders: order,
      });

      // Late webhook arrives claiming delivered
      await service.processWebhookEvent({
        event_id: 'evt-late-cancelled',
        tracking_code: 'ECO-CANCELLED-99',
        status: 'livre',
      });

      // Terminal state guard must preserve CANCELLED
      assert.strictEqual(order.status, 'CANCELLED', 'Cancelled order must remain CANCELLED');
      const fulfillmentTxs = inventoryTransactions.filter(t => t.reference_id === order.order_number && t.transaction_type === 'FULFILLMENT_OUT');
      assert.strictEqual(fulfillmentTxs.length, 0, 'Cancelled order must never have FULFILLMENT_OUT');
    });

    it('Edge Case 5: Admin manually transitions order to SHIPPED while webhook arrives', async () => {
      const { supabaseMock, orders, inventoryTransactions } = createMockDeliverySupabase();
      const orderService = new OrderService(supabaseMock);
      const deliveryService = new DeliveryService(supabaseMock);

      const shipment = await deliveryService.createShipment('order-101-confirmed');

      // Admin manually marks SHIPPED in warehouse console
      await orderService.transitionStatus('order-101-confirmed', 'SHIPPED', 'admin-1', 'Manual dispatch');
      const order = orders.find(o => o.id === 'order-101-confirmed');
      assert.strictEqual(order.status, 'SHIPPED');

      // Webhook subsequently arrives with en_transit
      await deliveryService.processWebhookEvent({
        event_id: 'evt-admin-race',
        tracking_code: shipment.trackingNumber,
        status: 'en_transit',
      });

      // Inventory fulfillment must occur exactly once
      const fulfillmentTxs = inventoryTransactions.filter(t => t.transaction_type === 'FULFILLMENT_OUT');
      assert.strictEqual(fulfillmentTxs.length, 1, 'Manual dispatch + webhook must execute FULFILLMENT_OUT exactly once');
    });

    it('Edge Case 6: Concurrent webhooks arriving simultaneously', async () => {
      const { supabaseMock, inventoryTransactions } = createMockDeliverySupabase();
      const service = new DeliveryService(supabaseMock);

      const shipment = await service.createShipment('order-101-confirmed');

      // Fire 3 simultaneous webhook calls for same tracking code
      await Promise.all([
        service.processWebhookEvent({ event_id: 'evt-conc-1', tracking_code: shipment.trackingNumber, status: 'en_transit' }),
        service.processWebhookEvent({ event_id: 'evt-conc-2', tracking_code: shipment.trackingNumber, status: 'en_transit' }),
        service.processWebhookEvent({ event_id: 'evt-conc-3', tracking_code: shipment.trackingNumber, status: 'en_transit' }),
      ]);

      const fulfillmentTxs = inventoryTransactions.filter(t => t.transaction_type === 'FULFILLMENT_OUT');
      assert.strictEqual(fulfillmentTxs.length, 1, 'Concurrent webhook requests must be idempotent');
    });
  });

  describe('9. Persistent Webhook Event Store & Signature Security', () => {
    it('should persist incoming webhook events in the database with PROCESSED status', async () => {
      const { supabaseMock, webhookEvents } = createMockDeliverySupabase();
      const service = new DeliveryService(supabaseMock);

      const shipment = await service.createShipment('order-101-confirmed');

      const result = await service.processWebhookEvent({
        event_id: 'evt-db-persist-01',
        tracking_code: shipment.trackingNumber,
        status: 'en_transit',
        reference: 'HP-2026-000101',
      });

      assert.strictEqual(result.success, true);
      assert.ok(result.eventId);

      // Verify record exists in webhookEvents mock DB table
      const storedEvent = webhookEvents.find(e => e.id === result.eventId);
      assert.ok(storedEvent, 'Webhook event must be persisted to database');
      assert.strictEqual(storedEvent.provider, 'ECOTRACK');
      assert.strictEqual(storedEvent.processing_status, 'PROCESSED');
      assert.strictEqual(storedEvent.attempt_count, 1);
    });

    it('should reject webhook with invalid signature token when secret is configured', async () => {
      const { supabaseMock } = createMockDeliverySupabase();
      const service = new DeliveryService(supabaseMock);

      // Temporarily set expected secret in env
      const originalSecret = process.env.ECOTRACK_WEBHOOK_SECRET;
      process.env.ECOTRACK_WEBHOOK_SECRET = 'secret_token_12345';

      try {
        await assert.rejects(
          async () => {
            await service.processWebhookEvent(
              { tracking_code: 'ECO-TEST-1', status: 'en_transit' },
              'wrong_secret_token'
            );
          },
          /Jeton de signature webhook EcoTrack invalide/
        );

        // Valid secret should pass
        const validResult = await service.processWebhookEvent(
          { tracking_code: 'ECO-TEST-1', status: 'en_transit' },
          'secret_token_12345'
        );
        assert.strictEqual(validResult.success, true);
      } finally {
        process.env.ECOTRACK_WEBHOOK_SECRET = originalSecret;
      }
    });

    it('should detect duplicate event from persistent DB table and return idempotency response', async () => {
      const { supabaseMock, webhookEvents, inventoryTransactions } = createMockDeliverySupabase();
      const service = new DeliveryService(supabaseMock);

      const shipment = await service.createShipment('order-101-confirmed');

      // 1. First event
      const res1 = await service.processWebhookEvent({
        event_id: 'evt-dup-test',
        tracking_code: shipment.trackingNumber,
        status: 'en_transit',
      });
      assert.strictEqual(res1.success, true);

      // 2. Second event with identical fingerprint
      const res2 = await service.processWebhookEvent({
        event_id: 'evt-dup-test',
        tracking_code: shipment.trackingNumber,
        status: 'en_transit',
      });
      assert.strictEqual(res2.success, true);
      assert.ok(res2.message.includes('Idempotence'));

      // Ensure no duplicate inventory mutations
      const fulfillmentTxs = inventoryTransactions.filter(t => t.transaction_type === 'FULFILLMENT_OUT');
      assert.strictEqual(fulfillmentTxs.length, 1);
    });
  });

});

