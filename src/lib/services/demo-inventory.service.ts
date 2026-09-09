// HamzaPhone Controlled Demo Inventory Seeding Utility
// Seeds stock for ACTIVE catalog products to enable seamless checkout and purchasing demos
// Preserves cost price, selling prices, SKUs, and DRAFT/ARCHIVED status intact with distinct DEMO_SEED audit trail

import { adminStore } from '@/lib/admin-store';
import type { DemoInventorySeedInput, DemoInventorySeedResult } from '@/types/integrations.types';

export class DemoInventoryService {
  /**
   * Seed inventory for demo purposes with strict safety guards
   */
  static seedDemoInventory(input: DemoInventorySeedInput): DemoInventorySeedResult {
    const seedQty = Math.max(1, Math.min(input.seedQuantity || 5, 500));
    const allProducts = adminStore.getProducts({ pageSize: 1000 }).items;

    // Filter strictly to ACTIVE products only
    let targetProducts = allProducts.filter((p) => p.status === 'ACTIVE');

    if (input.target === 'CATEGORY' && input.categoryId) {
      targetProducts = targetProducts.filter((p) => p.categoryId === input.categoryId);
    } else if (input.target === 'SELECTED_PRODUCTS' && input.productIds && input.productIds.length > 0) {
      const idSet = new Set(input.productIds);
      targetProducts = targetProducts.filter((p) => idSet.has(p.id));
    }

    if (targetProducts.length === 0) {
      return {
        success: false,
        target: input.target,
        updatedProductsCount: 0,
        totalUnitsAdded: 0,
        appliedStockPerProduct: seedQty,
        auditLogId: `demo-seed-empty-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
    }

    let totalUnitsAdded = 0;

    for (const product of targetProducts) {
      const diff = seedQty - product.availableStock;
      if (diff > 0) {
        totalUnitsAdded += diff;
        // Use DEMO_SEED inventory operation type
        adminStore.adjustInventoryStock(
          product.id,
          diff,
          'DEMO_SEED' as any,
          input.reason || `Alimentation de stock pour Démo Client (${seedQty} unités dispo)`
        );
      }
    }

    const auditId = `audit-demo-seed-${Date.now()}`;

    return {
      success: true,
      target: input.target,
      updatedProductsCount: targetProducts.length,
      totalUnitsAdded,
      appliedStockPerProduct: seedQty,
      auditLogId: auditId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset / Clear demo stock additions for active products
   */
  static resetDemoInventory(targetQuantity: number = 0): DemoInventorySeedResult {
    const allProducts = adminStore.getProducts({ pageSize: 1000 }).items;
    const targetProducts = allProducts.filter((p) => p.status === 'ACTIVE');

    let totalUnitsRemoved = 0;

    for (const product of targetProducts) {
      if (product.availableStock > targetQuantity) {
        const diff = targetQuantity - product.availableStock;
        totalUnitsRemoved += Math.abs(diff);

        adminStore.adjustInventoryStock(
          product.id,
          diff,
          'DEMO_SEED' as any,
          `Réinitialisation du stock de démonstration à ${targetQuantity} unité(s)`
        );
      }
    }

    return {
      success: true,
      target: 'ALL_ACTIVE',
      updatedProductsCount: targetProducts.length,
      totalUnitsAdded: -totalUnitsRemoved,
      appliedStockPerProduct: targetQuantity,
      auditLogId: `audit-demo-reset-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
  }
}
