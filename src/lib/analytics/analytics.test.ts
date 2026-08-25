// HamzaPhone Analytics & Reporting Automated Test Suite

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AnalyticsService } from './analytics.service';
import { resolveAlgiersDateRange, ALGIERS_TIMEZONE } from './analytics-timezone';
import {
  getAnalyticsOverviewAction,
  exportAnalyticsReportAction,
  trackAnalyticsEventAction,
} from '@/lib/actions/analytics.actions';

// Mock persona builder for server action RBAC testing
function createMockPersonaClient(options: {
  userId?: string;
  email?: string;
  userType?: string;
  role?: string;
  permissions?: string[];
}) {
  const user = options.userId ? { id: options.userId, email: options.email || 'staff@hamzaphone.dz' } : null;
  const profile = options.userId
    ? {
        id: options.userId,
        email: options.email || 'staff@hamzaphone.dz',
        user_type: options.userType || 'STAFF',
        is_active: true,
      }
    : null;

  const mockUserRoles = [
    {
      roles: {
        code: options.role || 'ADMINISTRATOR',
        role_permissions: (options.permissions || ['all']).map((p) => ({
          permissions: { code: p },
        })),
      },
    },
  ];

  const auditLogs: any[] = [];

  return {
    _auditLogs: auditLogs,
    auth: {
      getUser: async () => ({
        data: { user },
        error: user ? null : new Error('Auth session missing'),
      }),
    },
    from: (table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: profile, error: profile ? null : new Error('Not found') }),
            }),
          }),
        };
      }
      if (table === 'user_roles') {
        return {
          select: () => ({
            eq: async () => ({ data: mockUserRoles, error: null }),
          }),
        };
      }
      if (table === 'audit_logs') {
        return {
          insert: async (entry: any) => {
            auditLogs.push(entry);
            return { data: entry, error: null };
          },
        };
      }
      return {
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
      };
    },
  };
}

describe('HamzaPhone Analytics & Business Intelligence Engine', () => {
  const adminWithPricing = createMockPersonaClient({
    userId: 'user-admin',
    email: 'admin@hamzaphone.dz',
    role: 'ADMINISTRATOR',
    permissions: ['analytics.read', 'reports.read', 'reports.export', 'pricing.read'],
  });

  const orderManagerNoPricing = createMockPersonaClient({
    userId: 'user-order-mgr',
    email: 'orders@hamzaphone.dz',
    role: 'ORDER_MANAGER',
    permissions: ['analytics.read', 'reports.read', 'orders.read'], // No pricing.read or reports.export
  });

  const b2cCustomer = createMockPersonaClient({
    userId: 'user-cust',
    email: 'client@gmail.com',
    userType: 'B2C',
    role: 'B2C_CUSTOMER',
    permissions: ['products.read'],
  });

  describe('1. Timezone & Period Date Boundaries', () => {
    it('should resolve Algiers timezone (UTC+1) date ranges correctly', () => {
      const todayRange = resolveAlgiersDateRange('today');
      assert.ok(todayRange.startDate <= todayRange.endDate);

      const thirtyDaysRange = resolveAlgiersDateRange('30d');
      assert.ok(thirtyDaysRange.startDate < thirtyDaysRange.endDate);

      const customRange = resolveAlgiersDateRange('custom', '2026-01-01', '2026-01-31');
      assert.strictEqual(customRange.startDate.getFullYear(), 2026);
      assert.strictEqual(customRange.endDate.getDate(), 31);
    });
  });

  describe('2. Sales & Revenue Metrics Aggregation', () => {
    it('should aggregate gross sales, COD collected and net sales from orders and payments', () => {
      const report = AnalyticsService.getOverviewReport({ period: '90d' }, {
        userId: 'admin',
        email: 'admin@hamzaphone.dz',
        role: 'ADMINISTRATOR',
        permissions: new Set(['all']),
        userType: 'STAFF',
        isActive: true,
      });

      assert.ok(report.sales.grossSalesDzd > 0);
      assert.ok(report.sales.codCollectedDzd >= 0);
      assert.ok(report.orders.totalOrders > 0);
      assert.strictEqual(report.timezone, ALGIERS_TIMEZONE);
    });

    it('should include COGS and margin for users with pricing.read permission', () => {
      const report = AnalyticsService.getOverviewReport({ period: '90d' }, {
        userId: 'admin',
        email: 'admin@hamzaphone.dz',
        role: 'ADMINISTRATOR',
        permissions: new Set(['analytics.read', 'pricing.read']),
        userType: 'STAFF',
        isActive: true,
      });

      assert.notStrictEqual(report.sales.costOfGoodsSoldDzd, null);
      assert.notStrictEqual(report.sales.grossMarginDzd, null);
      assert.ok(typeof report.sales.grossMarginPercentage === 'number');
    });

    it('should SHIELD COGS and gross margin (set to null) for users without pricing.read', () => {
      const report = AnalyticsService.getOverviewReport({ period: '90d' }, {
        userId: 'staff-no-pricing',
        email: 'staff@hamzaphone.dz',
        role: 'ORDER_MANAGER',
        permissions: new Set(['analytics.read', 'orders.read']), // No pricing.read
        userType: 'STAFF',
        isActive: true,
      });

      assert.strictEqual(report.sales.costOfGoodsSoldDzd, null);
      assert.strictEqual(report.sales.grossMarginDzd, null);
      assert.strictEqual(report.sales.grossMarginPercentage, null);
    });
  });

  describe('3. Order Lifecycle & Status Distribution', () => {
    it('should calculate order rates (cancellation, return, fulfillment, AOV)', () => {
      const report = AnalyticsService.getOverviewReport({ period: '90d' });

      assert.ok(typeof report.orders.cancellationRate === 'number');
      assert.ok(typeof report.orders.returnRate === 'number');
      assert.ok(typeof report.orders.fulfillmentRate === 'number');
      assert.ok(report.orders.averageOrderValueDzd >= 0);
      assert.ok(report.orders.averageItemsPerOrder >= 0);
    });
  });

  describe('4. B2C vs B2B Segmentation Comparison', () => {
    it('should segment cohorts and compute B2B revenue share percentage', () => {
      const report = AnalyticsService.getOverviewReport({ period: '90d' });

      assert.ok(typeof report.comparison.b2bRevenueSharePercentage === 'number');
      assert.ok(report.comparison.b2c.orderCount >= 0);
      assert.ok(report.comparison.b2b.orderCount >= 0);
    });
  });

  describe('5. Inventory & Stock Valuation Aggregation', () => {
    it('should compute total stock units, low stock alerts, and retail stock value', () => {
      const report = AnalyticsService.getOverviewReport({ period: '90d' }, {
        userId: 'admin',
        email: 'admin@hamzaphone.dz',
        role: 'ADMINISTRATOR',
        permissions: new Set(['all']),
        userType: 'STAFF',
        isActive: true,
      });

      assert.ok(report.inventory.totalStockUnits > 0);
      assert.ok(report.inventory.totalStockValueRetailDzd > 0);
      assert.notStrictEqual(report.inventory.totalStockValueCostDzd, null);
    });
  });

  describe('6. Search & Conversion Funnel Analytics', () => {
    it('should track analytics events and calculate conversion funnel steps', () => {
      AnalyticsService.trackEvent({
        eventType: 'product_viewed',
        productId: 'prod-sam-s22-screen',
        userType: 'B2C',
      });

      const report = AnalyticsService.getOverviewReport({ period: '30d' });

      assert.ok(report.funnel.steps.length === 5);
      assert.strictEqual(report.funnel.steps[0].name, 'Vues de Fiches Pièces');
      assert.strictEqual(report.funnel.steps[4].name, 'Colis Livrés & Encaissés');
      assert.ok(report.funnel.overallConversionRate >= 0);
    });
  });

  describe('7. Server Actions RBAC Guards & Audit Logged CSV Export', () => {
    it('should allow authorized admin to query overview report', async () => {
      const res = await getAnalyticsOverviewAction({ period: '30d' }, adminWithPricing);
      assert.ok(res.sales.grossSalesDzd >= 0);
    });

    it('should reject unauthorized customer from querying overview report', async () => {
      await assert.rejects(
        async () => {
          await getAnalyticsOverviewAction({ period: '30d' }, b2cCustomer);
        },
        /Missing required permission \[analytics.read\]/i
      );
    });

    it('should export sanitized CSV report for authorized staff and record audit log', async () => {
      const exportRes = await exportAnalyticsReportAction('SALES', { period: '30d' }, adminWithPricing);

      assert.ok(exportRes.filename.includes('hamzaphone-rapport-sales'));
      assert.ok(exportRes.csvContent.includes('Chiffre d\'Affaires'));

      // Check audit log was written
      assert.strictEqual(adminWithPricing._auditLogs.length, 1);
      assert.strictEqual(adminWithPricing._auditLogs[0].action, 'EXPORT_ANALYTICS_REPORT');
    });

    it('should reject export for staff lacking reports.export permission', async () => {
      await assert.rejects(
        async () => {
          await exportAnalyticsReportAction('SALES', { period: '30d' }, orderManagerNoPricing);
        },
        /Missing required permission \[reports.export\]/i
      );
    });
  });
});
