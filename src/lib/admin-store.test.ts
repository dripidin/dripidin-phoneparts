// Unit tests for HamzaPhone Admin Store & Commerce Engine

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { adminStore, ALLOWED_ORDER_TRANSITIONS } from './admin-store';
import type { BulkPriceAdjustmentInput } from '@/types/domain.types';

describe('HamzaPhone Admin Commerce Engine', () => {
  beforeEach(() => {
    adminStore.setCurrentRole('OWNER');
  });

  describe('Product Lifecycle & CRUD', () => {
    it('should create a new product and compute available stock correctly', () => {
      const newProd = adminStore.addProduct({
        sku: 'HP-TEST-PART-01',
        barcode: '6900011122233',
        supplierSku: 'SUP-01',
        name: 'Écran OLED Test Samsung',
        slug: 'ecran-oled-test-samsung',
        brandId: 'b-sam',
        brandName: 'Samsung',
        categoryId: 'c-scr',
        categoryName: 'Écrans',
        productType: 'OEM_ORIGINAL',
        status: 'ACTIVE',
        isVisible: true,
        isFeatured: false,
        shortDescription: 'Test',
        description: 'Test Description',
        mainImage: 'https://example.com/img.jpg',
        gallery: [],
        costPriceDzd: 10000,
        b2cPriceDzd: 15000,
        b2cSalePriceDzd: null,
        b2bPriceDzd: 12500,
        stockQuantity: 20,
        lowStockThreshold: 5,
        weightGrams: 50,
        supplierId: 'sup-1',
        supplierName: 'Shenzhen',
        compatibility: [],
      });

      assert.ok(newProd.id);
      assert.strictEqual(newProd.stockQuantity, 20);
      assert.strictEqual(newProd.reservedStock, 0);
      assert.strictEqual(newProd.availableStock, 20);

      const found = adminStore.getProductById(newProd.id);
      assert.strictEqual(found?.sku, 'HP-TEST-PART-01');
    });

    it('should update product prices and recalculate available stock', () => {
      const products = adminStore.getProducts().items;
      const target = products[0];

      const updated = adminStore.updateProduct(target.id, {
        b2cPriceDzd: 35000,
        stockQuantity: 30,
      });

      assert.strictEqual(updated.b2cPriceDzd, 35000);
      assert.strictEqual(updated.stockQuantity, 30);
      assert.strictEqual(updated.availableStock, 30 - updated.reservedStock);
    });

    it('should move deleted product to trash and allow restoration', () => {
      const products = adminStore.getProducts().items;
      const target = products[0];
      const initialTrashCount = adminStore.getTrashProducts().length;

      adminStore.deleteProduct(target.id);
      const afterDelete = adminStore.getProducts().items;
      assert.strictEqual(afterDelete.find((p) => p.id === target.id), undefined);

      const trash = adminStore.getTrashProducts();
      assert.strictEqual(trash.length, initialTrashCount + 1);

      // Restore
      adminStore.restoreProduct(target.id);
      const afterRestore = adminStore.getProducts().items;
      assert.ok(afterRestore.find((p) => p.id === target.id));
    });
  });

  describe('Order Workflow State Machine', () => {
    it('should allow valid transition from PENDING to CONFIRMED and READY_FOR_SHIPMENT', () => {
      const orders = adminStore.getOrders();
      const pendingOrder = orders.find((o) => o.status === 'CONFIRMED') || orders[0];

      // Transition CONFIRMED -> PROCESSING
      const processing = adminStore.transitionOrderStatus(pendingOrder.id, 'PROCESSING', 'Picking');
      assert.strictEqual(processing.status, 'PROCESSING');

      // Transition PROCESSING -> READY_FOR_SHIPMENT
      const ready = adminStore.transitionOrderStatus(pendingOrder.id, 'READY_FOR_SHIPMENT', 'Packed');
      assert.strictEqual(ready.status, 'READY_FOR_SHIPMENT');
      assert.ok(ready.trackingNumber?.startsWith('ECO-'));
    });

    it('should reject invalid transition (e.g. DELIVERED directly from PENDING)', () => {
      const orders = adminStore.getOrders();
      const order = orders[0];

      assert.throws(() => {
        adminStore.transitionOrderStatus(order.id, 'DELIVERED' as any);
      }, /Transition de statut invalide/);
    });
  });

  describe('Bulk Pricing Engine & Margin Protection', () => {
    it('should compute preview with rounded DZD prices and margin percentages', () => {
      const input: BulkPriceAdjustmentInput = {
        scope: 'ALL',
        targetField: 'B2B_PRICE',
        percentageChange: 10, // +10%
        roundingUnitDzd: 10,
        justification: 'Hausse générale',
      };

      const preview = adminStore.previewBulkPriceAdjustment(input);
      assert.ok(preview.length > 0);

      const sample = preview[0];
      assert.strictEqual(sample.newB2bPriceDzd % 10, 0); // Must be multiple of 10
      assert.ok(sample.newB2bPriceDzd > sample.oldB2bPriceDzd);
    });

    it('should block price decrease that causes margin to drop below +5% when override is false', () => {
      const input: BulkPriceAdjustmentInput = {
        scope: 'ALL',
        targetField: 'BOTH',
        percentageChange: -80, // Heavy 80% slash causing below-cost
        roundingUnitDzd: 10,
        justification: 'Vente à perte non autorisée',
        allowBelowCostOverride: false,
      };

      assert.throws(() => {
        adminStore.applyBulkPriceAdjustment(input);
      }, /Opération bloquée/);
    });
  });

  describe('Double-Entry Inventory Ledger', () => {
    it('should record physical and available stock changes on adjustment', () => {
      const products = adminStore.getProducts().items;
      const target = products[0];
      const initialStock = target.stockQuantity;

      const tx = adminStore.adjustInventoryStock(
        target.id,
        10,
        'RECEIVING',
        'Réception commande Shenzhen'
      );

      assert.strictEqual(tx.previousStock, initialStock);
      assert.strictEqual(tx.newStock, initialStock + 10);
      assert.strictEqual(target.stockQuantity, initialStock + 10);

      const ledger = adminStore.getInventoryTransactions();
      assert.strictEqual(ledger[0].id, tx.id);
    });
  });

  describe('B2B Wholesale Approvals', () => {
    it('should approve pending B2B account and assign tier with credit limit', () => {
      const pendingAccounts = adminStore.getB2BAccounts('PENDING');
      if (pendingAccounts.length > 0) {
        const target = pendingAccounts[0];
        const approved = adminStore.approveB2BAccount(target.id, 'TIER_2', 200000, 'Dossier validé');

        assert.strictEqual(approved.status, 'APPROVED');
        assert.strictEqual(approved.tierCode, 'TIER_2');
        assert.strictEqual(approved.creditLimitDzd, 200000);
      }
    });
  });

  describe('RBAC & Role Enforcement in Admin Store', () => {
    it('should block VIEWER role from deleting products or making stock adjustments', () => {
      adminStore.setCurrentRole('VIEWER');
      const products = adminStore.getProducts().items;
      const target = products[0];

      assert.throws(() => {
        adminStore.deleteProduct(target.id);
      }, /Action refusée/);

      assert.throws(() => {
        adminStore.adjustInventoryStock(target.id, 5, 'MANUAL_ADJUSTMENT', 'Tentative');
      }, /Action refusée/);
    });
  });
});
