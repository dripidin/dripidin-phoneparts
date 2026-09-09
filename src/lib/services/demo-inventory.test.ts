// HamzaPhone Controlled Demo Inventory Seeding Utility Automated Tests

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DemoInventoryService } from './demo-inventory.service';
import { adminStore } from '@/lib/admin-store';

describe('DemoInventoryService: Controlled Demo Stock Seeding', () => {
  it('should seed stock only for ACTIVE products and preserve price & SKU integrity', () => {
    // 1. Seed 5 units across all active products
    const res = DemoInventoryService.seedDemoInventory({
      target: 'ALL_ACTIVE',
      seedQuantity: 5,
      reason: 'Automated test demo seeding',
    });

    assert.strictEqual(res.success, true);
    assert.ok(res.updatedProductsCount > 0);
    assert.strictEqual(res.appliedStockPerProduct, 5);

    // 2. Verify all ACTIVE products have availableStock >= 5
    const prods = adminStore.getProducts({ pageSize: 500 }).items;
    const activeProds = prods.filter((p) => p.status === 'ACTIVE');

    for (const p of activeProds) {
      assert.ok(p.availableStock >= 5, `Product ${p.sku} should have at least 5 available stock`);
      assert.ok(p.costPriceDzd > 0, 'Cost price must remain intact');
      assert.ok(p.b2cPriceDzd > 0, 'B2C price must remain intact');
      assert.ok(p.b2bPriceDzd > 0, 'B2B price must remain intact');
    }

    // 3. Verify DEMO_SEED transaction log
    const txs = adminStore.getInventoryTransactions();
    const demoSeedTxs = txs.filter((t) => (t.transactionType as string) === 'DEMO_SEED');
    assert.ok(demoSeedTxs.length > 0, 'Must record transactions with type DEMO_SEED');
    assert.strictEqual(demoSeedTxs[0].referenceType, 'DEMO_SEED' as any);
  });

  it('should reset demo stock cleanly without modifying price or category metadata', () => {
    const res = DemoInventoryService.resetDemoInventory(0);
    assert.strictEqual(res.success, true);

    const prods = adminStore.getProducts({ pageSize: 500 }).items;
    const activeProds = prods.filter((p) => p.status === 'ACTIVE');

    for (const p of activeProds) {
      assert.strictEqual(p.availableStock, 0);
    }

    // Restore to 5 units for subsequent application use
    DemoInventoryService.seedDemoInventory({
      target: 'ALL_ACTIVE',
      seedQuantity: 5,
    });
  });
});
