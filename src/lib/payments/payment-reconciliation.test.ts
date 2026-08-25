// HamzaPhone Payment & COD Reconciliation Automated Test Suite
// Verifies Decoupled Lifecycle, Doorstep Collection, Courier Remittance, Bank Reconciliation,
// Discrepancy Resolution, Reconciliation Batches, and Security Safeguards.

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { PaymentService } from './payment.service';
import {
  getPaymentsListAction,
  getPaymentDetailAction,
  recordCodCollectionAction,
  recordCourierRemittanceAction,
  reconcilePaymentAction,
  recordManualAdjustmentAction,
  createReconciliationBatchAction,
  closeReconciliationBatchAction,
  getPaymentOverviewMetricsAction,
} from '@/lib/actions/payment.actions';

// Mock persona builder for server action RBAC testing
function createMockPersonaClient(options: {
  userId?: string;
  email?: string;
  userType?: string;
  role?: string;
  permissions?: string[];
}) {
  const user = options.userId ? { id: options.userId, email: options.email || 'finance@hamzaphone.dz' } : null;
  const profile = options.userId
    ? {
        id: options.userId,
        email: options.email || 'finance@hamzaphone.dz',
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

describe('HamzaPhone Payment & COD Reconciliation Engine', () => {
  const ownerClient = createMockPersonaClient({
    userId: 'user-owner',
    email: 'admin@hamzaphone.dz',
    role: 'OWNER',
    permissions: ['all'],
  });

  const financeAdminClient = createMockPersonaClient({
    userId: 'user-finance',
    email: 'finance@hamzaphone.dz',
    role: 'ADMINISTRATOR',
    permissions: ['payments.read', 'payments.manage', 'payments.reconcile', 'payments.adjust'],
  });

  const orderManagerClient = createMockPersonaClient({
    userId: 'user-orders',
    email: 'orders@hamzaphone.dz',
    role: 'ORDER_MANAGER',
    permissions: ['payments.read', 'payments.manage'], // No payments.reconcile or payments.adjust
  });

  const b2cClient = createMockPersonaClient({
    userId: 'user-b2c',
    email: 'client@gmail.com',
    userType: 'B2C',
    role: 'B2C_CUSTOMER',
    permissions: ['products.read'],
  });

  const anonymousClient = createMockPersonaClient({});

  describe('1. Decoupled Order / Delivery / Payment Lifecycles', () => {
    it('should create payment with COD_PENDING and authoritative expected amount', () => {
      const payment = PaymentService.createPaymentRecord({
        id: `ord-test-${Date.now()}`,
        orderNumber: 'HP-2026-TEST01',
        customerName: 'Farid Belkacem',
        customerPhone: '+213 550 00 11 22',
        customerType: 'B2C',
        wilayaCode: 16,
        wilayaName: 'Alger',
        totalDzd: 12500,
        deliveryProvider: 'ECOTRACK',
      });

      assert.strictEqual(payment.paymentStatus, 'COD_PENDING');
      assert.strictEqual(payment.reconciliationState, 'UNRECONCILED');
      assert.strictEqual(payment.expectedAmountDzd, 12500);
      assert.strictEqual(payment.collectedAmountDzd, 0);
      assert.strictEqual(payment.remittedAmountDzd, 0);
      assert.strictEqual(payment.discrepancyAmountDzd, 12500);
    });

    it('should NOT automatically mark payment as RECONCILED when order is delivered', () => {
      const payment = PaymentService.getPaymentsList({ deliveredButUnpaid: true })[0];
      assert.ok(payment);
      assert.strictEqual(payment.deliveryStatus, 'DELIVERED');
      assert.strictEqual(payment.paymentStatus, 'COD_PENDING');
      assert.strictEqual(payment.reconciliationState, 'UNRECONCILED');
    });
  });

  describe('2. Cash on Delivery (COD) Doorstep Collection', () => {
    it('should record exact collection and advance to COD_COLLECTED', async () => {
      const newPayment = PaymentService.createPaymentRecord({
        id: `ord-col-1-${Date.now()}`,
        orderNumber: `HP-2026-COL1-${Date.now().toString().slice(-4)}`,
        customerName: 'Yacine Amrani',
        customerPhone: '+213 661 11 22 33',
        customerType: 'B2C',
        wilayaCode: 31,
        wilayaName: 'Oran',
        totalDzd: 7400,
      });

      const updated = await recordCodCollectionAction(
        newPayment.id,
        {
          collectedAmountDzd: 7400,
          collectionReference: 'ECO-SCAN-7711',
          notes: 'Espèces complètes perçues par le livreur',
        },
        financeAdminClient
      );

      assert.strictEqual(updated.paymentStatus, 'COD_COLLECTED');
      assert.strictEqual(updated.collectedAmountDzd, 7400);
      assert.strictEqual(updated.discrepancyType, 'EXACT');
      assert.strictEqual(updated.discrepancyAmountDzd, 0);
      assert.ok(updated.collectionDate);
    });

    it('should detect and flag partial collection (Under-collection at door)', async () => {
      const newPayment = PaymentService.createPaymentRecord({
        id: `ord-col-2-${Date.now()}`,
        orderNumber: `HP-2026-COL2-${Date.now().toString().slice(-4)}`,
        customerName: 'Nadir Smahi',
        customerPhone: '+213 770 44 55 66',
        customerType: 'B2C',
        wilayaCode: 25,
        wilayaName: 'Constantine',
        totalDzd: 5000,
      });

      const updated = await recordCodCollectionAction(
        newPayment.id,
        {
          collectedAmountDzd: 4500, // Shortage of 500 DZD
          notes: 'Client n’avait que 4500 DZD en espèces',
        },
        financeAdminClient
      );

      assert.strictEqual(updated.paymentStatus, 'COD_COLLECTED');
      assert.strictEqual(updated.collectedAmountDzd, 4500);
      assert.strictEqual(updated.discrepancyType, 'PARTIAL_COLLECTION');
      assert.strictEqual(updated.discrepancyAmountDzd, 500);
      assert.strictEqual(updated.reconciliationState, 'DISCREPANCY');
    });

    it('should reject negative collected amounts', async () => {
      const newPayment = PaymentService.createPaymentRecord({
        id: `ord-col-3-${Date.now()}`,
        orderNumber: `HP-2026-COL3-${Date.now().toString().slice(-4)}`,
        customerName: 'Test Bad Amount',
        customerPhone: '+213 550 00 00 00',
        wilayaCode: 16,
        wilayaName: 'Alger',
        totalDzd: 3000,
      });

      await assert.rejects(
        async () => {
          await recordCodCollectionAction(
            newPayment.id,
            { collectedAmountDzd: -500 },
            financeAdminClient
          );
        },
        /ne peut pas être négatif/i
      );
    });
  });

  describe('3. Courier Remittance & Transit State', () => {
    it('should record courier remittance and advance status to COD_REMITTED', async () => {
      const payment = PaymentService.createPaymentRecord({
        id: `ord-rem-1-${Date.now()}`,
        orderNumber: `HP-2026-REM1-${Date.now().toString().slice(-4)}`,
        customerName: 'Djamel Kaci',
        customerPhone: '+213 555 22 33 44',
        wilayaCode: 9,
        wilayaName: 'Blida',
        totalDzd: 6200,
      });

      // 1. Collect
      PaymentService.recordCodCollection(payment.id, { collectedAmountDzd: 6200 });

      // 2. Remit
      const remitted = await recordCourierRemittanceAction(
        payment.id,
        {
          remittedAmountDzd: 6200,
          remittanceReference: 'VRMT-ECO-20260824-001',
          notes: 'Virement hebdomadaire EcoTrack',
        },
        financeAdminClient
      );

      assert.strictEqual(remitted.paymentStatus, 'COD_REMITTED');
      assert.strictEqual(remitted.remittedAmountDzd, 6200);
      assert.strictEqual(remitted.courierReference, 'VRMT-ECO-20260824-001');
      assert.strictEqual(remitted.discrepancyAmountDzd, 0);
    });

    it('should detect remittance shortage from courier', async () => {
      const payment = PaymentService.createPaymentRecord({
        id: `ord-rem-2-${Date.now()}`,
        orderNumber: `HP-2026-REM2-${Date.now().toString().slice(-4)}`,
        customerName: 'Tarek Cherif',
        customerPhone: '+213 555 99 88 77',
        wilayaCode: 15,
        wilayaName: 'Tizi Ouzou',
        totalDzd: 10000,
      });

      PaymentService.recordCodCollection(payment.id, { collectedAmountDzd: 10000 });

      const remitted = await recordCourierRemittanceAction(
        payment.id,
        {
          remittedAmountDzd: 9800, // Shortage of 200 DZD
          remittanceReference: 'VRMT-ECO-DIFF',
        },
        financeAdminClient
      );

      assert.strictEqual(remitted.paymentStatus, 'COD_REMITTED');
      assert.strictEqual(remitted.discrepancyType, 'REMITTANCE_SHORTAGE');
      assert.strictEqual(remitted.discrepancyAmountDzd, 200);
      assert.strictEqual(remitted.reconciliationState, 'DISCREPANCY');
    });

    it('should reject remittance if funds were never collected (COD_PENDING)', async () => {
      const pendingPayment = PaymentService.createPaymentRecord({
        id: `ord-rem-bad-${Date.now()}`,
        orderNumber: `HP-2026-BAD-${Date.now().toString().slice(-4)}`,
        customerName: 'Test Uncollected',
        customerPhone: '+213 550 11 11 11',
        wilayaCode: 16,
        wilayaName: 'Alger',
        totalDzd: 4000,
      });

      await assert.rejects(
        async () => {
          await recordCourierRemittanceAction(
            pendingPayment.id,
            {
              remittedAmountDzd: 4000,
              remittanceReference: 'VRMT-ILLEGAL',
            },
            financeAdminClient
          );
        },
        /Impossible d’enregistrer un versement avant la collecte des fonds/i
      );
    });
  });

  describe('4. Bank Reconciliation & Discrepancy Gatekeeper', () => {
    it('should reconcile balanced payment against bank statement', async () => {
      const payment = PaymentService.createPaymentRecord({
        id: `ord-rec-1-${Date.now()}`,
        orderNumber: `HP-2026-REC1-${Date.now().toString().slice(-4)}`,
        customerName: 'Ali Meziane',
        customerPhone: '+213 661 88 99 00',
        wilayaCode: 16,
        wilayaName: 'Alger',
        totalDzd: 15000,
      });

      PaymentService.recordCodCollection(payment.id, { collectedAmountDzd: 15000 });
      PaymentService.recordCourierRemittance(payment.id, {
        remittedAmountDzd: 15000,
        remittanceReference: 'VRMT-15K',
      });

      const reconciled = await reconcilePaymentAction(
        payment.id,
        { bankReference: 'CCP-RELEVE-884102' },
        financeAdminClient
      );

      assert.strictEqual(reconciled.paymentStatus, 'RECONCILED');
      assert.strictEqual(reconciled.reconciliationState, 'RECONCILED');
      assert.ok(reconciled.reconciliationDate);
      assert.strictEqual(reconciled.reconciledBy, 'finance@hamzaphone.dz');
    });

    it('should block reconciliation when unresolved discrepancy exists', async () => {
      const payment = PaymentService.createPaymentRecord({
        id: `ord-rec-blocked-${Date.now()}`,
        orderNumber: `HP-2026-RECBL-${Date.now().toString().slice(-4)}`,
        customerName: 'Unbalanced Client',
        customerPhone: '+213 550 22 22 22',
        wilayaCode: 16,
        wilayaName: 'Alger',
        totalDzd: 8000,
      });

      PaymentService.recordCodCollection(payment.id, { collectedAmountDzd: 7500 }); // -500 DZD
      PaymentService.recordCourierRemittance(payment.id, {
        remittedAmountDzd: 7500,
        remittanceReference: 'VRMT-DISC',
      });

      await assert.rejects(
        async () => {
          await reconcilePaymentAction(payment.id, {}, financeAdminClient);
        },
        /Rapprochement bloqué : Un écart de 500 DZD subsiste/i
      );
    });

    it('should allow reconciliation after authorized financial write-off adjustment', async () => {
      const payment = PaymentService.createPaymentRecord({
        id: `ord-rec-adj-${Date.now()}`,
        orderNumber: `HP-2026-RECADJ-${Date.now().toString().slice(-4)}`,
        customerName: 'Settled Discrepancy Client',
        customerPhone: '+213 550 33 33 33',
        wilayaCode: 16,
        wilayaName: 'Alger',
        totalDzd: 8000,
      });

      PaymentService.recordCodCollection(payment.id, { collectedAmountDzd: 7500 });
      PaymentService.recordCourierRemittance(payment.id, {
        remittedAmountDzd: 7500,
        remittanceReference: 'VRMT-ADJ',
      });

      // Manual Write-Off
      const adjusted = await recordManualAdjustmentAction(
        payment.id,
        {
          adjustmentType: 'DISCREPANCY_WRITE_OFF',
          amountDzd: 500,
          reason: 'Écart de 500 DZD validé en perte commerciale par la direction financière.',
        },
        financeAdminClient
      );

      assert.strictEqual(adjusted.discrepancyAmountDzd, 0);
      assert.strictEqual(adjusted.discrepancyType, 'RESOLVED');
      assert.strictEqual(adjusted.reconciliationState, 'MANUALLY_ADJUSTED');
      assert.strictEqual(adjusted.adjustments.length, 1);

      // Now reconcile
      const reconciled = await reconcilePaymentAction(payment.id, { bankReference: 'CCP-OK' }, financeAdminClient);
      assert.strictEqual(reconciled.paymentStatus, 'RECONCILED');
    });
  });

  describe('5. Reconciliation Batches (Couriers)', () => {
    it('should create and close reconciliation batch with constituent payments', async () => {
      const p1 = PaymentService.createPaymentRecord({
        id: `batch-p1-${Date.now()}`,
        orderNumber: `HP-BATCH-1-${Date.now().toString().slice(-4)}`,
        customerName: 'Client 1',
        customerPhone: '+213 550 11 11 11',
        wilayaCode: 16,
        wilayaName: 'Alger',
        totalDzd: 5000,
      });

      const p2 = PaymentService.createPaymentRecord({
        id: `batch-p2-${Date.now()}`,
        orderNumber: `HP-BATCH-2-${Date.now().toString().slice(-4)}`,
        customerName: 'Client 2',
        customerPhone: '+213 550 22 22 22',
        wilayaCode: 16,
        wilayaName: 'Alger',
        totalDzd: 10000,
      });

      const batch = await createReconciliationBatchAction(
        {
          courierCode: 'ECOTRACK',
          paymentIds: [p1.id, p2.id],
        },
        financeAdminClient
      );

      assert.ok(batch.id);
      assert.strictEqual(batch.orderCount, 2);
      assert.strictEqual(batch.expectedTotalDzd, 15000);
      assert.strictEqual(batch.status, 'BALANCED');

      // Close batch
      const closed = await closeReconciliationBatchAction(
        batch.id,
        { bankReference: 'CCP-VRMT-GLOBAL-15K' },
        financeAdminClient
      );

      assert.strictEqual(closed.status, 'RECONCILED');
      assert.strictEqual(closed.bankReference, 'CCP-VRMT-GLOBAL-15K');

      // Verify constituent payments are now RECONCILED
      const p1Updated = PaymentService.getPaymentDetail(p1.id);
      const p2Updated = PaymentService.getPaymentDetail(p2.id);
      assert.strictEqual(p1Updated.paymentStatus, 'RECONCILED');
      assert.strictEqual(p2Updated.paymentStatus, 'RECONCILED');
    });
  });

  describe('6. Security & RBAC Guard Enforcement', () => {
    it('should reject unauthenticated request with UNAUTHENTICATED', async () => {
      await assert.rejects(
        async () => {
          await getPaymentsListAction({}, anonymousClient);
        },
        /Authentication required/i
      );
    });

    it('should reject B2C customer from accessing payment console', async () => {
      await assert.rejects(
        async () => {
          await getPaymentsListAction({}, b2cClient);
        },
        /Missing required permission \[payments.read\]/i
      );
    });

    it('should reject Order Manager without payments.reconcile from reconciling', async () => {
      await assert.rejects(
        async () => {
          await reconcilePaymentAction('pay-001', {}, orderManagerClient);
        },
        /Missing required permission \[payments.reconcile\]/i
      );
    });

    it('should reject Order Manager without payments.adjust from recording adjustments', async () => {
      await assert.rejects(
        async () => {
          await recordManualAdjustmentAction(
            'pay-001',
            { adjustmentType: 'DISCREPANCY_WRITE_OFF', amountDzd: 100, reason: 'Test' },
            orderManagerClient
          );
        },
        /Missing required permission \[payments.adjust\]/i
      );
    });
  });
});
