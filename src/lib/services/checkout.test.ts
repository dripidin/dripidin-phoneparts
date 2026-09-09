// HamzaPhone Commercial Purchasing Flow & Checkout Service Automated Tests
// Tests Cart Validation, Price Authority, Concurrency, Stock Reservation, and Dual-Token Tracking

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { CheckoutService } from './checkout.service';
import { PricingService } from './pricing.service';
import { CheckoutOrderSchema } from '@/lib/validation/order.schema';

// Mock in-memory database engine for realistic checkout tests
function createMockSupabase() {
  const products = [
    {
      id: 'prod-screen-1',
      sku: 'HP-SCR-001',
      name: 'Écran OLED Samsung Galaxy S23 Ultra',
      slug: 'ecran-oled-samsung-galaxy-s23-ultra',
      main_image: '/images/s23-screen.jpg',
      product_type: 'OEM_ORIGINAL',
      status: 'ACTIVE',
      is_visible: true,
      cost_price_dzd: 22000,
      b2c_price_dzd: 32000,
      b2c_sale_price_dzd: 29500,
      b2b_price_dzd: 26000,
      stock_quantity: 1, // Exactly 1 unit for concurrency test
      reserved_stock: 0,
      available_stock: 1,
    },
    {
      id: 'prod-bat-2',
      sku: 'HP-BAT-002',
      name: 'Batterie iPhone 14 Pro Max Originale',
      slug: 'batterie-iphone-14-pro-max',
      main_image: '/images/ip14-bat.jpg',
      product_type: 'SERVICE_PACK',
      status: 'ACTIVE',
      is_visible: true,
      cost_price_dzd: 4000,
      b2c_price_dzd: 7500,
      b2c_sale_price_dzd: null,
      b2b_price_dzd: 5500,
      stock_quantity: 10,
      reserved_stock: 0,
      available_stock: 10,
    },
    {
      id: 'prod-archived-3',
      sku: 'HP-OLD-003',
      name: 'Connecteur de Charge Ancien Modèle',
      slug: 'connecteur-ancien',
      main_image: '/images/old.jpg',
      product_type: 'AFTERMARKET',
      status: 'ARCHIVED',
      is_visible: false,
      cost_price_dzd: 500,
      b2c_price_dzd: 1500,
      b2c_sale_price_dzd: null,
      b2b_price_dzd: 1000,
      stock_quantity: 5,
      reserved_stock: 0,
      available_stock: 5,
    },
  ];

  const b2bTierPrices = [
    {
      product_id: 'prod-bat-2',
      tier_id: 'tier-gold',
      price_dzd: 5000,
      min_quantity: 1,
    },
  ];

  const profiles = [
    {
      id: 'user-b2c-1',
      email: 'b2c@customer.dz',
      user_type: 'B2C',
      is_active: true,
    },
    {
      id: 'user-b2b-approved',
      email: 'b2b@atelier.dz',
      user_type: 'B2B',
      is_active: true,
    },
  ];

  const businessMembers = [
    {
      user_id: 'user-b2b-approved',
      role_in_business: 'OWNER',
      businesses: {
        id: 'biz-1',
        name: 'Atelier Alger Phone',
        trade_name: 'Alger Phone',
        rc_number: '16/00-1234567B22',
        nif: '002216012345678',
        nis: '123456789012345',
        article_imposition: '16012345678',
        status: 'APPROVED',
        tier_code: 'TIER_GOLD',
        credit_limit_dzd: 500000,
        current_balance_dzd: 0,
        wilaya_code: 16,
        wilaya_name: 'Alger',
        commune_name: 'Belfort',
        address_line: 'Rue des Frères Belfort',
      },
    },
  ];

  const orders: any[] = [];
  const orderItems: any[] = [];
  const inventoryTransactions: any[] = [];
  const orderStatusHistory: any[] = [];

  const client: any = {
    from: (table: string) => {
      let selectedFields = '*';
      let filters: any[] = [];
      let lastInserted: any[] = [];

      const queryBuilder: any = {
        select: (fields: string = '*') => {
          selectedFields = fields;
          return queryBuilder;
        },
        in: (field: string, values: any[]) => {
          filters.push((row: any) => values.includes(row[field]));
          return queryBuilder;
        },
        eq: (field: string, value: any) => {
          filters.push((row: any) => row[field] === value);
          return queryBuilder;
        },
        maybeSingle: async () => {
          let dataset: any[] = [];
          if (table === 'profiles') dataset = profiles;
          else if (table === 'business_members') dataset = businessMembers;
          else if (table === 'orders') dataset = orders;

          let filtered = dataset;
          for (const f of filters) {
            filtered = filtered.filter(f);
          }
          if (filtered.length === 0) return { data: null, error: null };
          return { data: { ...filtered[0] }, error: null };
        },
        single: async () => {
          let dataset: any[] = [];
          if (table === 'products') dataset = products;
          else if (table === 'profiles') dataset = profiles;
          else if (table === 'business_members') dataset = businessMembers;
          else if (table === 'orders') dataset = orders;
          else if (lastInserted.length > 0) dataset = lastInserted;

          let filtered = dataset;
          for (const f of filters) {
            filtered = filtered.filter(f);
          }

          if (filtered.length === 0) {
            return { data: null, error: { message: 'Row not found' } };
          }
          return { data: { ...filtered[0] }, error: null };
        },
        insert: (records: any | any[]) => {
          const recArray = Array.isArray(records) ? records : [records];
          lastInserted = [];
          for (const r of recArray) {
            const newRecord = {
              id: r.id || `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              created_at: new Date().toISOString(),
              ...r,
            };
            lastInserted.push(newRecord);
            if (table === 'orders') orders.push(newRecord);
            else if (table === 'order_items') orderItems.push(newRecord);
            else if (table === 'inventory_transactions') inventoryTransactions.push(newRecord);
            else if (table === 'order_status_history') orderStatusHistory.push(newRecord);
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
            eq: async (field: string, val: any) => {
              if (table === 'products') {
                const target = (products as any[]).find((p: any) => p[field] === val);
                if (target) {
                  Object.assign(target, updates);
                }
              }
              return { data: updates, error: null };
            },
          };
        },
        then: (resolve: any) => {
          let dataset: any[] = [];
          if (table === 'products') dataset = products;
          else if (table === 'b2b_tier_prices') dataset = b2bTierPrices;
          else if (table === 'profiles') dataset = profiles;
          else if (table === 'business_members') dataset = businessMembers;
          else if (table === 'orders') dataset = orders;
          else if (table === 'order_items') dataset = orderItems;

          let filtered = dataset;
          for (const f of filters) {
            filtered = filtered.filter(f);
          }
          resolve({ data: filtered, error: null });
        },
      };

      return queryBuilder;
    },
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    // Expose internal state for assertions
    _products: products,
    _orders: orders,
    _orderItems: orderItems,
    _inventoryTransactions: inventoryTransactions,
    _orderStatusHistory: orderStatusHistory,
  };

  return client;
}

describe('HamzaPhone Commercial Purchasing Flow & Checkout Engine', () => {

  it('Cart Validation: recalculates server-authoritative B2C sale and standard prices', async () => {
    const mockDb = createMockSupabase();
    const checkoutService = new CheckoutService(mockDb);

    const summary = await checkoutService.validateCart(
      [
        { productId: 'prod-screen-1', quantity: 1 },
        { productId: 'prod-bat-2', quantity: 2 },
      ],
      null,
      16 // Alger Wilaya
    );

    assert.strictEqual(summary.itemCount, 3);
    // Screen is on sale at 29,500 DZD, Bat is 7,500 DZD x 2 = 15,000 DZD -> Subtotal = 44,500 DZD
    assert.strictEqual(summary.subtotalDzd, 44500);
    assert.strictEqual(summary.shippingCostEstimateDzd, 400);
    assert.strictEqual(summary.totalEstimatedDzd, 44900);
    assert.strictEqual(summary.canProceedToCheckout, true);
  });

  it('Cart Validation: detects archived/unavailable product and flags warnings', async () => {
    const mockDb = createMockSupabase();
    const checkoutService = new CheckoutService(mockDb);

    const summary = await checkoutService.validateCart(
      [
        { productId: 'prod-bat-2', quantity: 1 },
        { productId: 'prod-archived-3', quantity: 1 },
      ],
      null
    );

    assert.strictEqual(summary.hasWarnings, true);
    const unavailableItem = summary.items.find(i => i.productId === 'prod-archived-3');
    assert.strictEqual(unavailableItem?.status, 'UNAVAILABLE');
    assert.strictEqual(unavailableItem?.validQuantity, 0);
  });

  it('Pricing Authority: approved B2B receives wholesale tier price', async () => {
    const mockDb = createMockSupabase();
    const checkoutService = new CheckoutService(mockDb);

    const summary = await checkoutService.validateCart(
      [{ productId: 'prod-bat-2', quantity: 2 }],
      'user-b2b-approved'
    );

    assert.strictEqual(summary.isApprovedB2B, true);
    const batItem = summary.items.find(i => i.productId === 'prod-bat-2');
    // Tier price for prod-bat-2 is 5,000 DZD (instead of 7,500 DZD retail)
    assert.strictEqual(batItem?.unitPriceDzd, 5000);
    assert.strictEqual(summary.subtotalDzd, 10000);
  });

  it('Order Creation: creates order with snapshots, unique DRP-2026 number, and double-entry stock reservation', async () => {
    const mockDb = createMockSupabase();
    const checkoutService = new CheckoutService(mockDb);

    const result = await checkoutService.processOrderCheckout(
      {
        recipientName: 'Karim Hadj',
        recipientPhone: '0550123456',
        shippingAddressLine: '12 Rue Didouche Mourad',
        wilayaCode: 16,
        wilayaName: 'Alger',
        communeName: 'Alger Centre',
        deliveryType: 'HOME',
        paymentMethod: 'CASH_ON_DELIVERY',
        items: [{ productId: 'prod-bat-2', quantity: 2 }],
      },
      null
    );

    assert.strictEqual(result.success, true);
    assert.match(result.order.orderNumber, /^(DRP|HP)-2026-\d{6}$/);
    assert.strictEqual(typeof result.order.trackingToken, 'string');
    assert.strictEqual(result.order.trackingToken.length, 32);
    assert.strictEqual(result.order.status, 'PENDING');
    assert.strictEqual(result.order.paymentMethod, 'CASH_ON_DELIVERY');

    // Verify reservation recorded in inventory_transactions
    const tx = mockDb._inventoryTransactions.find((t: any) => t.product_id === 'prod-bat-2');
    assert.ok(tx, 'Inventory transaction must be created');
    assert.strictEqual(tx.transaction_type, 'RESERVATION');
    assert.strictEqual(tx.quantity_change, 2);

    // Verify product reserved_stock updated
    const product = mockDb._products.find((p: any) => p.id === 'prod-bat-2');
    assert.strictEqual(product.reserved_stock, 2);
    assert.strictEqual(product.available_stock, 8);
  });

  it('Concurrency Protection: blocks second checkout when stock is exhausted', async () => {
    const mockDb = createMockSupabase();
    const checkoutService = new CheckoutService(mockDb);

    // Screen prod-screen-1 has available_stock = 1
    // User A checks out the 1 unit
    const orderA = await checkoutService.processOrderCheckout(
      {
        recipientName: 'Client A',
        recipientPhone: '0550111111',
        shippingAddressLine: 'Adresse A',
        wilayaCode: 16,
        wilayaName: 'Alger',
        communeName: 'Kouba',
        deliveryType: 'HOME',
        paymentMethod: 'CASH_ON_DELIVERY',
        items: [{ productId: 'prod-screen-1', quantity: 1 }],
      },
      null
    );
    assert.strictEqual(orderA.success, true);

    // User B attempts to checkout the same unit concurrently
    await assert.rejects(
      async () => {
        await checkoutService.processOrderCheckout(
          {
            recipientName: 'Client B',
            recipientPhone: '0550222222',
            shippingAddressLine: 'Adresse B',
            wilayaCode: 31,
            wilayaName: 'Oran',
            communeName: 'Oran',
            deliveryType: 'HOME',
            paymentMethod: 'CASH_ON_DELIVERY',
            items: [{ productId: 'prod-screen-1', quantity: 1 }],
          },
          null
        );
      },
      /n'est plus disponible dans la quantité demandée/
    );
  });

  it('Idempotency Protection: repeated checkout with same key returns identical cached order', async () => {
    const mockDb = createMockSupabase();
    const checkoutService = new CheckoutService(mockDb);
    const idempotencyKey = 'idem-unique-key-123';

    const order1 = await checkoutService.processOrderCheckout(
      {
        recipientName: 'Same User',
        recipientPhone: '0660333333',
        shippingAddressLine: 'Rue 1',
        wilayaCode: 16,
        wilayaName: 'Alger',
        communeName: 'Hydra',
        deliveryType: 'HOME',
        paymentMethod: 'CASH_ON_DELIVERY',
        items: [{ productId: 'prod-bat-2', quantity: 1 }],
      },
      null,
      idempotencyKey
    );

    const order2 = await checkoutService.processOrderCheckout(
      {
        recipientName: 'Same User',
        recipientPhone: '0660333333',
        shippingAddressLine: 'Rue 1',
        wilayaCode: 16,
        wilayaName: 'Alger',
        communeName: 'Hydra',
        deliveryType: 'HOME',
        paymentMethod: 'CASH_ON_DELIVERY',
        items: [{ productId: 'prod-bat-2', quantity: 1 }],
      },
      null,
      idempotencyKey
    );

    assert.strictEqual(order1.order.orderNumber, order2.order.orderNumber);
  });

  it('Dual-Verification Guest Lookup: rejects lookups with invalid tracking token', async () => {
    const mockDb = createMockSupabase();
    const checkoutService = new CheckoutService(mockDb);

    const created = await checkoutService.processOrderCheckout(
      {
        recipientName: 'Guest Tester',
        recipientPhone: '0770444444',
        shippingAddressLine: 'Boulevard Central',
        wilayaCode: 25,
        wilayaName: 'Constantine',
        communeName: 'Constantine',
        deliveryType: 'HOME',
        paymentMethod: 'CASH_ON_DELIVERY',
        items: [{ productId: 'prod-bat-2', quantity: 1 }],
      },
      null
    );

    // Valid lookup succeeds
    const validLookup = await checkoutService.lookupGuestOrder(
      created.order.orderNumber,
      created.order.trackingToken
    );
    assert.strictEqual(validLookup.order_number, created.order.orderNumber);

    // Invalid token fails
    await assert.rejects(
      async () => {
        await checkoutService.lookupGuestOrder(
          created.order.orderNumber,
          'wrong-token-1234567890abcdef'
        );
      },
      /Clé de suivi invalide/
    );
  });

});
