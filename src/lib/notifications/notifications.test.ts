// HamzaPhone Notification Domain & Multi-Channel Dispatcher Automated Test Suite

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NotificationService } from './notification.service';
import {
  getNotificationsListAction,
  getNotificationDetailAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  deleteNotificationAction,
  retryNotificationAction,
  getNotificationMetricsAction,
  getCustomerNotificationPreferencesAction,
  updateCustomerNotificationPreferencesAction,
  getStaffNotificationPreferencesAction,
  updateStaffNotificationPreferencesAction,
  dispatchDomainEventAction,
} from '@/lib/actions/notification.actions';

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

describe('HamzaPhone Notification & Operational Event Dispatcher', () => {
  const adminClient = createMockPersonaClient({
    userId: 'user-admin',
    email: 'admin@hamzaphone.dz',
    role: 'ADMINISTRATOR',
    permissions: ['notifications.read', 'notifications.manage'],
  });

  const contentManagerClient = createMockPersonaClient({
    userId: 'user-content',
    email: 'content@hamzaphone.dz',
    role: 'CONTENT_MANAGER',
    permissions: ['cms.read', 'cms.manage'], // No notifications.read or notifications.manage
  });

  const b2cCustomerClient = createMockPersonaClient({
    userId: 'user-customer-99',
    email: 'yacine@gmail.com',
    userType: 'B2C',
    role: 'B2C_CUSTOMER',
    permissions: ['products.read'],
  });

  const anonymousClient = createMockPersonaClient({});

  describe('1. Domain Event Dispatching & Fan-Out', () => {
    it('should dispatch order.created event to Staff Dashboard and Customer SMS/Dashboard', async () => {
      const uniqueOrderNo = `HP-2026-TEST-${Date.now().toString().slice(-4)}`;
      const notifs = await NotificationService.dispatchDomainEvent({
        eventType: 'order.created',
        entityType: 'ORDER',
        entityId: 'ord-test-01',
        customerId: 'user-customer-99',
        customerPhone: '0550112233',
        data: { orderNumber: uniqueOrderNo, customerName: 'Yacine Amrani', totalDzd: 14500 },
      });

      assert.ok(notifs.length >= 2);
      const staffNotif = notifs.find((n) => n.recipientType === 'STAFF');
      const custDashNotif = notifs.find((n) => n.recipientType === 'CUSTOMER' && n.channel === 'DASHBOARD');
      const custSmsNotif = notifs.find((n) => n.recipientType === 'CUSTOMER' && n.channel === 'SMS');

      assert.ok(staffNotif);
      assert.strictEqual(staffNotif.channel, 'DASHBOARD');
      assert.strictEqual(staffNotif.recipientRole, 'ORDER_MANAGER');

      assert.ok(custDashNotif);
      assert.strictEqual(custDashNotif.recipientId, 'user-customer-99');

      assert.ok(custSmsNotif);
      assert.strictEqual(custSmsNotif.status, 'DELIVERED');
    });

    it('should dispatch inventory.low_stock event strictly to Inventory Staff with CRITICAL severity', async () => {
      const notifs = await NotificationService.dispatchDomainEvent({
        eventType: 'inventory.low_stock',
        entityType: 'INVENTORY',
        entityId: 'prod-s22-oled',
        severity: 'CRITICAL',
        data: { sku: 'SKU-SAM-S22-OLED', availableStock: 1 },
      });

      assert.strictEqual(notifs.length, 1);
      assert.strictEqual(notifs[0].recipientType, 'STAFF');
      assert.strictEqual(notifs[0].recipientRole, 'INVENTORY_MANAGER');
      assert.strictEqual(notifs[0].severity, 'CRITICAL');
    });

    it('should dispatch b2b.approved event to Customer with SUCCESS severity', async () => {
      const notifs = await NotificationService.dispatchDomainEvent({
        eventType: 'b2b.approved',
        entityType: 'B2B_APPLICATION',
        entityId: 'b2b-app-77',
        customerId: 'user-b2b-pro',
      });

      const custNotif = notifs.find((n) => n.recipientId === 'user-b2b-pro');
      assert.ok(custNotif);
      assert.strictEqual(custNotif.severity, 'SUCCESS');
    });
  });

  describe('2. Idempotency & Duplicate Event Protection', () => {
    it('should NOT generate duplicate notifications when identical domain event is re-emitted', async () => {
      const idempotencyKey = `evt-unique-payment-disc-${Date.now()}`;

      const firstEmission = await NotificationService.dispatchDomainEvent({
        eventType: 'payment.discrepancy',
        entityType: 'PAYMENT',
        entityId: 'pay-dup-01',
        idempotencyKey,
        data: { orderNumber: 'HP-2026-DUP', discrepancyAmountDzd: 1000 },
      });

      const secondEmission = await NotificationService.dispatchDomainEvent({
        eventType: 'payment.discrepancy',
        entityType: 'PAYMENT',
        entityId: 'pay-dup-01',
        idempotencyKey,
        data: { orderNumber: 'HP-2026-DUP', discrepancyAmountDzd: 1000 },
      });

      assert.strictEqual(firstEmission.length, secondEmission.length);
      assert.strictEqual(firstEmission[0].id, secondEmission[0].id);
    });
  });

  describe('3. Customer Data Shielding & Isolation', () => {
    it('should prevent B2C customers from seeing staff operational or financial alerts', async () => {
      const customerNotifs = await getNotificationsListAction({}, b2cCustomerClient);

      // Customer must only see their own customer-addressed notifications
      for (const notif of customerNotifs) {
        assert.strictEqual(notif.recipientType, 'CUSTOMER');
        assert.strictEqual(notif.recipientId, 'user-customer-99');
      }
    });

    it('should reject non-staff users without notifications.read from reading all notifications', async () => {
      await assert.rejects(
        async () => {
          await getNotificationsListAction({}, contentManagerClient);
        },
        /Missing required permission \[notifications.read\]/i
      );
    });
  });

  describe('4. Notification Status, Read Marking & Retry Mechanism', () => {
    it('should mark a notification as read', async () => {
      const notifs = await getNotificationsListAction({}, adminClient);
      assert.ok(notifs.length > 0);
      const target = notifs[0];

      const marked = await markNotificationAsReadAction(target.id, adminClient);
      assert.strictEqual(marked.read, true);
    });

    it('should mark all notifications as read for current user', async () => {
      const count = await markAllNotificationsAsReadAction(adminClient);
      assert.ok(typeof count === 'number');
    });

    it('should enforce retry limit and reject retrying beyond maxRetries (3)', async () => {
      // Simulate failed notification
      const testFailedNotif = await NotificationService.dispatchDomainEvent({
        eventType: 'system.alert',
        entityType: 'SYSTEM',
        entityId: `sys-${Date.now()}`,
        data: { phone: '0000' }, // invalid phone
      });

      const notif = testFailedNotif[0];
      notif.retryCount = 3;
      notif.status = 'FAILED';

      await assert.rejects(
        async () => {
          await retryNotificationAction(notif.id, adminClient);
        },
        /Nombre maximal de tentatives de réexpédition atteint/i
      );
    });
  });

  describe('5. Notification Preferences', () => {
    it('should update and retrieve staff notification preferences', async () => {
      const updated = await updateStaffNotificationPreferencesAction(
        { lowStockAlerts: false, systemAlerts: true },
        adminClient
      );

      assert.strictEqual(updated.lowStockAlerts, false);
      assert.strictEqual(updated.systemAlerts, true);

      const prefs = await getStaffNotificationPreferencesAction(adminClient);
      assert.strictEqual(prefs.lowStockAlerts, false);
    });

    it('should update and retrieve customer notification preferences', async () => {
      const updated = await updateCustomerNotificationPreferencesAction(
        { promotionalNotifications: true },
        b2cCustomerClient
      );

      assert.strictEqual(updated.promotionalNotifications, true);
    });
  });
});
