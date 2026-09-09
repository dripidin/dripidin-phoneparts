// Reactive State Store and Commerce Engine for HamzaPhone Admin Dashboard

import {
  MOCK_PRODUCTS,
  MOCK_ORDERS,
  MOCK_B2B_ACCOUNTS,
  MOCK_INVENTORY_TXS,
  MOCK_AUDIT_LOGS,
  MOCK_BRANDS,
  MOCK_CATEGORIES,
  MOCK_SUPPLIERS,
  type AdminProduct,
  type AdminOrder,
  type AdminB2BAccount,
  type AdminInventoryTx,
  type AdminAuditLog,
} from './mock-data';
import type { AppRoleCode } from '@/types/rbac.types';
import type { OrderStatus, InventoryTransactionType, ProductStatus, B2BStatus } from '@/types/database.types';
import type { BulkPriceAdjustmentInput, BulkPricePreviewItem } from '@/types/domain.types';

// Order Workflow Allowed Transitions
export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['READY_FOR_SHIPMENT', 'CANCELLED'],
  READY_FOR_SHIPMENT: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'FAILED', 'RETURNED'],
  FAILED: ['SHIPPED', 'RETURNED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  RETURNED: [],
  REFUNDED: [],
};

class AdminDataStore {
  private products: AdminProduct[] = [...MOCK_PRODUCTS];
  private orders: AdminOrder[] = [...MOCK_ORDERS];
  private b2bAccounts: AdminB2BAccount[] = [...MOCK_B2B_ACCOUNTS];
  private inventoryTxs: AdminInventoryTx[] = [...MOCK_INVENTORY_TXS];
  private auditLogs: AdminAuditLog[] = [...MOCK_AUDIT_LOGS];
  private brands = [...MOCK_BRANDS];
  private categories = [...MOCK_CATEGORIES];
  private suppliers = [...MOCK_SUPPLIERS];
  private trashProducts: AdminProduct[] = [];

  // Active Session & Role Simulation
  private currentRole: AppRoleCode = 'OWNER';
  private currentEmail: string = 'admin@hamzaphone.dz';
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // --- Auth & Role Simulation ---
  getCurrentRole(): AppRoleCode {
    return this.currentRole;
  }

  setCurrentRole(role: AppRoleCode) {
    this.currentRole = role;
    this.notify();
  }

  getCurrentEmail(): string {
    return this.currentEmail;
  }

  // --- Permission Evaluation ---
  hasPermission(permission: string): boolean {
    if (this.currentRole === 'OWNER') return true;

    const rolePerms: Record<AppRoleCode, string[]> = {
      OWNER: ['all'],
      ADMINISTRATOR: [
        'products.read', 'products.create', 'products.update', 'products.delete', 'products.import', 'products.export', 'products.bulk_update',
        'pricing.read', 'pricing.update', 'pricing.bulk_percentage', 'pricing.b2b_tiers',
        'inventory.read', 'inventory.adjust', 'inventory.receive',
        'orders.read', 'orders.create', 'orders.update', 'orders.cancel', 'orders.refund',
        'delivery.dispatch', 'delivery.manage_rates',
        'customers.read', 'customers.update', 'b2b.read', 'b2b.approve', 'b2b.manage_pricing',
        'payments.read', 'payments.manage', 'payments.reconcile', 'payments.adjust',
        'analytics.read', 'reports.read', 'reports.export',
        'cms.read', 'cms.manage',
        'notifications.read', 'notifications.manage',
        'users.manage', 'settings.read', 'settings.manage', 'audit.read'
      ],
      SALES_MANAGER: [
        'products.read', 'products.export', 'pricing.read', 'pricing.update', 'pricing.bulk_percentage', 'pricing.b2b_tiers',
        'orders.read', 'orders.create', 'customers.read', 'customers.update', 'b2b.read', 'b2b.approve', 'b2b.manage_pricing', 'inventory.read',
        'payments.read', 'analytics.read', 'reports.read', 'reports.export', 'notifications.read', 'settings.read'
      ],
      ORDER_MANAGER: [
        'products.read', 'inventory.read', 'orders.read', 'orders.create', 'orders.update', 'orders.cancel', 'delivery.dispatch', 'customers.read',
        'payments.read', 'payments.manage', 'analytics.read', 'reports.read', 'notifications.read', 'settings.read'
      ],
      INVENTORY_MANAGER: [
        'products.read', 'products.export', 'products.import', 'inventory.read', 'inventory.adjust', 'inventory.receive', 'analytics.read', 'reports.read', 'notifications.read', 'settings.read'
      ],
      CONTENT_MANAGER: [
        'products.read', 'products.create', 'products.update', 'products.import', 'products.export', 'products.bulk_update', 'categories.manage', 'brands.manage',
        'cms.read', 'cms.manage', 'analytics.read', 'settings.read'
      ],
      SUPPORT: ['products.read', 'orders.read', 'customers.read', 'notifications.read', 'settings.read'],
      VIEWER: ['products.read', 'products.export', 'pricing.read', 'inventory.read', 'orders.read', 'customers.read', 'payments.read', 'analytics.read', 'reports.read', 'cms.read', 'notifications.read', 'settings.read', 'audit.read'],
      B2B_CUSTOMER: ['products.read', 'orders.create'],
      B2C_CUSTOMER: ['products.read', 'orders.create'],
    };

    const perms = rolePerms[this.currentRole] || [];
    return perms.includes(permission) || perms.includes('all');
  }

  // --- Products Queries & Mutations ---
  getProducts(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    brandId?: string;
    categoryId?: string;
    status?: ProductStatus;
    lowStockOnly?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    let list = [...this.products];

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q)) ||
          (p.supplierSku && p.supplierSku.toLowerCase().includes(q))
      );
    }

    if (params?.brandId) list = list.filter((p) => p.brandId === params.brandId);
    if (params?.categoryId) list = list.filter((p) => p.categoryId === params.categoryId);
    if (params?.status) list = list.filter((p) => p.status === params.status);
    if (params?.lowStockOnly) list = list.filter((p) => p.availableStock <= p.lowStockThreshold);

    if (params?.sortBy) {
      list.sort((a: any, b: any) => {
        const valA = a[params.sortBy!];
        const valB = b[params.sortBy!];
        if (valA < valB) return params.sortOrder === 'desc' ? 1 : -1;
        if (valA > valB) return params.sortOrder === 'desc' ? -1 : 1;
        return 0;
      });
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const totalCount = list.length;
    const paginated = list.slice((page - 1) * pageSize, page * pageSize);

    return {
      items: paginated,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
    };
  }

  getProductById(id: string) {
    return this.products.find((p) => p.id === id);
  }

  addProduct(data: Omit<AdminProduct, 'id' | 'createdAt' | 'updatedAt' | 'availableStock' | 'reservedStock'>) {
    if (!this.hasPermission('products.create')) {
      throw new Error('Action refusée: Permission "products.create" manquante');
    }

    const newProd: AdminProduct = {
      ...data,
      id: `prod-${Date.now()}`,
      reservedStock: 0,
      availableStock: data.stockQuantity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.products.unshift(newProd);

    this.logAudit({
      action: 'PRODUCT.CREATE',
      entityType: 'PRODUCT',
      entityId: newProd.id,
      oldValues: null,
      newValues: { sku: newProd.sku, name: newProd.name, b2cPrice: newProd.b2cPriceDzd },
    });

    this.notify();
    return newProd;
  }

  updateProduct(id: string, updates: Partial<AdminProduct>) {
    if (!this.hasPermission('products.update')) {
      throw new Error('Action refusée: Permission "products.update" manquante');
    }

    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Produit introuvable');

    const old = this.products[index];
    const updated = {
      ...old,
      ...updates,
      availableStock: (updates.stockQuantity !== undefined ? updates.stockQuantity : old.stockQuantity) - old.reservedStock,
      updatedAt: new Date().toISOString(),
    };

    this.products[index] = updated;

    this.logAudit({
      action: 'PRODUCT.UPDATE',
      entityType: 'PRODUCT',
      entityId: id,
      oldValues: { name: old.name, b2cPrice: old.b2cPriceDzd, stock: old.stockQuantity },
      newValues: { name: updated.name, b2cPrice: updated.b2cPriceDzd, stock: updated.stockQuantity },
    });

    this.notify();
    return updated;
  }

  deleteProduct(id: string) {
    if (!this.hasPermission('products.delete')) {
      throw new Error('Action refusée: Permission "products.delete" requise');
    }

    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) return;

    const [deleted] = this.products.splice(index, 1);
    this.trashProducts.push(deleted);

    this.logAudit({
      action: 'PRODUCT.ARCHIVE',
      entityType: 'PRODUCT',
      entityId: id,
      oldValues: { sku: deleted.sku, name: deleted.name },
      newValues: { inTrash: true },
    });

    this.notify();
  }

  batchDeleteProducts(ids: string[]) {
    for (const id of ids) {
      this.deleteProduct(id);
    }
  }

  duplicateProduct(id: string) {
    const orig = this.getProductById(id);
    if (!orig) throw new Error('Produit introuvable');

    return this.addProduct({
      ...orig,
      sku: `${orig.sku}-COPY-${Math.floor(100 + Math.random() * 900)}`,
      name: `${orig.name} (Copie)`,
      slug: `${orig.slug}-copy-${Date.now()}`,
      barcode: null,
      supplierSku: null,
    });
  }

  restoreProduct(id: string) {
    if (!this.hasPermission('products.delete')) {
      throw new Error('Action refusée: Permission requise');
    }

    const index = this.trashProducts.findIndex((p) => p.id === id);
    if (index === -1) return;

    const [restored] = this.trashProducts.splice(index, 1);
    this.products.unshift(restored);

    this.logAudit({
      action: 'PRODUCT.RESTORE',
      entityType: 'PRODUCT',
      entityId: id,
      oldValues: { inTrash: true },
      newValues: { sku: restored.sku, name: restored.name },
    });

    this.notify();
  }

  getTrashProducts() {
    return this.trashProducts;
  }

  // --- Bulk Pricing Preview & Application ---
  previewBulkPriceAdjustment(input: BulkPriceAdjustmentInput): BulkPricePreviewItem[] {
    if (!this.hasPermission('pricing.bulk_percentage') && !this.hasPermission('pricing.update')) {
      throw new Error('Action refusée: Permission "pricing.bulk_percentage" requise');
    }

    let targetProducts = [...this.products];

    if (input.scope === 'BRAND' && input.scopeTargetId) {
      targetProducts = targetProducts.filter((p) => p.brandId === input.scopeTargetId);
    } else if (input.scope === 'CATEGORY' && input.scopeTargetId) {
      targetProducts = targetProducts.filter((p) => p.categoryId === input.scopeTargetId);
    } else if (input.scope === 'SUPPLIER' && input.scopeTargetId) {
      targetProducts = targetProducts.filter((p) => p.supplierId === input.scopeTargetId);
    } else if (input.scope === 'SELECTED_SKUS' && input.selectedSkus?.length) {
      const skuSet = new Set(input.selectedSkus);
      targetProducts = targetProducts.filter((p) => skuSet.has(p.sku));
    }

    const roundUnit = input.roundingUnitDzd || 10;

    return targetProducts.map((p) => {
      const multiplier = 1 + input.percentageChange / 100;

      const calcB2C = Math.round((p.b2cPriceDzd * multiplier) / roundUnit) * roundUnit;
      const calcB2B = Math.round((p.b2bPriceDzd * multiplier) / roundUnit) * roundUnit;

      const newB2C = input.targetField === 'B2B_PRICE' ? p.b2cPriceDzd : calcB2C;
      const newB2B = input.targetField === 'B2C_PRICE' ? p.b2bPriceDzd : calcB2B;

      const minSellingPrice = Math.min(newB2C, newB2B);
      const marginPct = p.costPriceDzd > 0 ? ((minSellingPrice - p.costPriceDzd) / p.costPriceDzd) * 100 : 0;
      const isBelowCost = minSellingPrice < p.costPriceDzd * 1.05; // 5% minimum safety margin

      return {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        costPriceDzd: p.costPriceDzd,
        oldB2cPriceDzd: p.b2cPriceDzd,
        newB2cPriceDzd: newB2C,
        oldB2bPriceDzd: p.b2bPriceDzd,
        newB2bPriceDzd: newB2B,
        marginPercentage: Math.round(marginPct * 10) / 10,
        isBelowCostWarning: isBelowCost,
      };
    });
  }

  applyBulkPriceAdjustment(input: BulkPriceAdjustmentInput) {
    const preview = this.previewBulkPriceAdjustment(input);

    const hasWarnings = preview.some((item) => item.isBelowCostWarning);
    if (hasWarnings && !input.allowBelowCostOverride) {
      throw new Error(
        'Opération bloquée: Des prix calculés sont inférieurs à la marge minimale de sécurité (+5% au-dessus du coût). Activez le déblocage exceptionnel pour continuer.'
      );
    }

    preview.forEach((item) => {
      const prod = this.products.find((p) => p.id === item.productId);
      if (prod) {
        prod.b2cPriceDzd = item.newB2cPriceDzd;
        prod.b2bPriceDzd = item.newB2bPriceDzd;
        prod.updatedAt = new Date().toISOString();
      }
    });

    this.logAudit({
      action: 'PRICING.BULK_ADJUST',
      entityType: 'PRICING',
      entityId: input.scope,
      oldValues: { scope: input.scope, delta: `${input.percentageChange}%` },
      newValues: { affectedItemsCount: preview.length, target: input.targetField, justification: input.justification },
    });

    this.notify();
    return { affectedCount: preview.length };
  }

  // --- Inventory Ledger & Adjustments ---
  adjustInventoryStock(
    productId: string,
    quantityChange: number,
    type: InventoryTransactionType,
    notes: string,
    warehouseBin?: string
  ) {
    if (!this.hasPermission('inventory.adjust')) {
      throw new Error('Action refusée: Permission "inventory.adjust" requise');
    }

    const prod = this.products.find((p) => p.id === productId);
    if (!prod) throw new Error('Produit introuvable');

    const previousStock = prod.stockQuantity;
    let newStock = previousStock;
    let previousReserved = prod.reservedStock;
    let newReserved = previousReserved;

    if (type === 'RECEIVING' || type === 'CUSTOMER_RETURN_RESTOCK' || (type as string) === 'DEMO_SEED') {
      newStock = Math.max(0, previousStock + quantityChange);
    } else if (type === 'DAMAGED_WRITEOFF' || type === 'SUPPLIER_RETURN') {
      newStock = Math.max(0, previousStock - Math.abs(quantityChange));
    } else if (type === 'MANUAL_ADJUSTMENT') {
      newStock = Math.max(0, previousStock + quantityChange);
    }

    prod.stockQuantity = newStock;
    prod.availableStock = newStock - newReserved;
    prod.updatedAt = new Date().toISOString();

    const isDemoSeed = (type as string) === 'DEMO_SEED';

    const tx: AdminInventoryTx = {
      id: `tx-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      productId: prod.id,
      productSku: prod.sku,
      productName: prod.name,
      transactionType: type,
      quantityChange,
      previousStock,
      newStock,
      previousReserved,
      newReserved,
      referenceType: isDemoSeed ? ('DEMO_SEED' as any) : 'MANUAL_ADJUSTMENT',
      referenceId: isDemoSeed ? `DEMO-SEED-${Date.now()}` : `ADJ-${Date.now()}`,
      warehouseBin: warehouseBin || 'Bin A-01',
      notes,
      createdAt: new Date().toISOString(),
    };

    this.inventoryTxs.unshift(tx);

    this.logAudit({
      action: isDemoSeed ? 'INVENTORY.DEMO_SEED' : 'INVENTORY.ADJUST',
      entityType: 'INVENTORY',
      entityId: prod.id,
      oldValues: { stock: previousStock },
      newValues: { stock: newStock, delta: quantityChange, type, notes },
    });

    this.notify();
    return tx;
  }

  seedDemoInventory(target: 'ALL_ACTIVE' | 'CATEGORY' | 'SELECTED_PRODUCTS', targetId?: string, seedQty: number = 5) {
    const qty = Math.max(1, Math.min(seedQty, 500));
    let targetProds = this.products.filter((p) => p.status === 'ACTIVE');

    if (target === 'CATEGORY' && targetId) {
      targetProds = targetProds.filter((p) => p.categoryId === targetId);
    } else if (target === 'SELECTED_PRODUCTS' && targetId) {
      targetProds = targetProds.filter((p) => p.id === targetId);
    }

    let unitsAdded = 0;
    for (const p of targetProds) {
      const diff = qty - p.availableStock;
      if (diff > 0) {
        unitsAdded += diff;
        this.adjustInventoryStock(
          p.id,
          diff,
          'DEMO_SEED' as any,
          `Alimentation stock mode démo (${qty} unités disponibles)`
        );
      }
    }

    return { updatedCount: targetProds.length, unitsAdded };
  }

  resetDemoInventory(targetStock: number = 0) {
    const activeProds = this.products.filter((p) => p.status === 'ACTIVE');
    let unitsRemoved = 0;

    for (const p of activeProds) {
      if (p.availableStock > targetStock) {
        const diff = targetStock - p.availableStock;
        unitsRemoved += Math.abs(diff);
        this.adjustInventoryStock(
          p.id,
          diff,
          'DEMO_SEED' as any,
          `Réinitialisation stock démo à ${targetStock} unité(s)`
        );
      }
    }

    return { updatedCount: activeProds.length, unitsRemoved };
  }

  getInventoryTransactions() {
    return this.inventoryTxs;
  }

  // --- Orders Management ---
  getOrders(params?: {
    status?: OrderStatus;
    wilayaCode?: number;
    search?: string;
    customerType?: 'B2C' | 'B2B';
  }) {
    let list = [...this.orders];

    if (params?.status) list = list.filter((o) => o.status === params.status);
    if (params?.wilayaCode) list = list.filter((o) => o.wilayaCode === params.wilayaCode);
    if (params?.customerType) list = list.filter((o) => o.customerType === params.customerType);

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q) ||
          (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q))
      );
    }

    return list;
  }

  getOrderById(id: string) {
    return this.orders.find((o) => o.id === id);
  }

  transitionOrderStatus(orderId: string, newStatus: OrderStatus, reason?: string) {
    if (!this.hasPermission('orders.update')) {
      throw new Error('Action refusée: Permission "orders.update" requise');
    }

    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Commande introuvable');

    const allowed = ALLOWED_ORDER_TRANSITIONS[order.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Transition de statut invalide: Impossible de passer de "${order.status}" à "${newStatus}".`
      );
    }

    const previousStatus = order.status;
    order.status = newStatus;

    if (newStatus === 'READY_FOR_SHIPMENT' && !order.trackingNumber) {
      order.trackingNumber = `ECO-${order.wilayaName.toUpperCase().slice(0, 4)}-${Math.floor(10000 + Math.random() * 90000)}`;
    }

    if (newStatus === 'DELIVERED') {
      order.paymentStatus = 'PAID';
    }

    this.logAudit({
      action: 'ORDER.STATUS_CHANGE',
      entityType: 'ORDER',
      entityId: order.orderNumber,
      oldValues: { status: previousStatus },
      newValues: { status: newStatus, reason: reason || 'Action administrative', tracking: order.trackingNumber },
    });

    this.notify();
    return order;
  }

  // --- B2B Business Approvals ---
  getB2BAccounts(statusFilter?: B2BStatus) {
    if (statusFilter) {
      return this.b2bAccounts.filter((b) => b.status === statusFilter);
    }
    return this.b2bAccounts;
  }

  approveB2BAccount(id: string, tierCode: string, creditLimitDzd: number, notes?: string) {
    if (!this.hasPermission('b2b.approve')) {
      throw new Error('Action refusée: Permission "b2b.approve" requise');
    }

    const account = this.b2bAccounts.find((b) => b.id === id);
    if (!account) throw new Error('Compte B2B introuvable');

    const oldStatus = account.status;
    account.status = 'APPROVED';
    account.tierCode = tierCode;
    account.creditLimitDzd = creditLimitDzd;
    account.verifiedAt = new Date().toISOString();
    account.verifiedBy = this.currentEmail;
    if (notes) account.notes = notes;

    this.logAudit({
      action: 'B2B.APPROVE',
      entityType: 'BUSINESS',
      entityId: account.businessName,
      oldValues: { status: oldStatus },
      newValues: { status: 'APPROVED', tier: tierCode, creditLimit: `${creditLimitDzd} DZD` },
    });

    this.notify();
    return account;
  }

  rejectB2BAccount(id: string, reason: string) {
    if (!this.hasPermission('b2b.approve')) {
      throw new Error('Action refusée: Permission "b2b.approve" requise');
    }

    const account = this.b2bAccounts.find((b) => b.id === id);
    if (!account) throw new Error('Compte B2B introuvable');

    account.status = 'REJECTED';
    account.notes = reason;

    this.logAudit({
      action: 'B2B.REJECT',
      entityType: 'BUSINESS',
      entityId: account.businessName,
      oldValues: { status: 'PENDING' },
      newValues: { status: 'REJECTED', reason },
    });

    this.notify();
    return account;
  }

  // --- Brands, Categories & Suppliers ---
  getBrands() {
    return this.brands;
  }

  getCategories() {
    return this.categories;
  }

  getSuppliers() {
    return this.suppliers;
  }

  // --- Audit Logs ---
  getAuditLogs() {
    return this.auditLogs;
  }

  private logAudit(entry: {
    action: string;
    entityType: string;
    entityId: string;
    oldValues: Record<string, any> | null;
    newValues: Record<string, any> | null;
  }) {
    const record: AdminAuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actorEmail: this.currentEmail,
      actorRole: this.currentRole,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      oldValues: entry.oldValues,
      newValues: entry.newValues,
      timestamp: new Date().toISOString(),
    };

    this.auditLogs.unshift(record);
  }
}

export const adminStore = new AdminDataStore();
