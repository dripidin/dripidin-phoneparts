'use server';

// HamzaPhone Payment & COD Reconciliation Server Actions
// Enforces Server-Side RBAC Guards and Immutable Audit Logging

import { createServerClient } from '@/lib/auth/server';
import { requirePermission } from '@/lib/permissions/guards';
import { PaymentService } from '@/lib/payments/payment.service';
import type {
  PaymentRecord,
  ReconciliationBatch,
  PaymentFilterParams,
  PaymentOverviewMetrics,
  RecordCodCollectionInput,
  RecordCourierRemittanceInput,
  ReconcilePaymentInput,
  ManualPaymentAdjustmentInput,
  CreateReconciliationBatchInput,
  CloseReconciliationBatchInput,
} from '@/types/payment-reconciliation.types';

/**
 * 1. Get Payments List with Filtering
 */
export async function getPaymentsListAction(
  params?: PaymentFilterParams,
  customClient?: any
): Promise<PaymentRecord[]> {
  const supabase = customClient || createServerClient();
  await requirePermission(supabase, 'payments.read');

  return PaymentService.getPaymentsList(params);
}

/**
 * 2. Get Detailed Payment Record
 */
export async function getPaymentDetailAction(
  paymentId: string,
  customClient?: any
): Promise<PaymentRecord> {
  const supabase = customClient || createServerClient();
  await requirePermission(supabase, 'payments.read');

  return PaymentService.getPaymentDetail(paymentId);
}

/**
 * 3. Record COD Collection at Doorstep
 */
export async function recordCodCollectionAction(
  paymentId: string,
  input: RecordCodCollectionInput,
  customClient?: any
): Promise<PaymentRecord> {
  const supabase = customClient || createServerClient();
  const authContext = await requirePermission(supabase, 'payments.manage');

  const updated = PaymentService.recordCodCollection(paymentId, input, authContext);

  // Log in audit trail
  const fromTable = supabase.from ? supabase.from('audit_logs') : null;
  if (fromTable && typeof fromTable.insert === 'function') {
    await fromTable.insert({
      actor_email: authContext.email,
      actor_role: authContext.role,
      action: 'COD_COLLECTION_RECORDED',
      entity_type: 'PAYMENT',
      entity_id: updated.id,
      new_values: {
        collectedAmountDzd: updated.collectedAmountDzd,
        discrepancyType: updated.discrepancyType,
        discrepancyAmountDzd: updated.discrepancyAmountDzd,
      },
    });
  }

  return updated;
}

/**
 * 4. Record Courier Remittance
 */
export async function recordCourierRemittanceAction(
  paymentId: string,
  input: RecordCourierRemittanceInput,
  customClient?: any
): Promise<PaymentRecord> {
  const supabase = customClient || createServerClient();
  const authContext = await requirePermission(supabase, 'payments.manage');

  const updated = PaymentService.recordCourierRemittance(paymentId, input, authContext);

  const fromTable = supabase.from ? supabase.from('audit_logs') : null;
  if (fromTable && typeof fromTable.insert === 'function') {
    await fromTable.insert({
      actor_email: authContext.email,
      actor_role: authContext.role,
      action: 'COURIER_REMITTANCE_RECORDED',
      entity_type: 'PAYMENT',
      entity_id: updated.id,
      new_values: {
        remittedAmountDzd: updated.remittedAmountDzd,
        remittanceReference: input.remittanceReference,
        discrepancyType: updated.discrepancyType,
      },
    });
  }

  return updated;
}

/**
 * 5. Reconcile Payment against Bank Statement
 */
export async function reconcilePaymentAction(
  paymentId: string,
  input: ReconcilePaymentInput,
  customClient?: any
): Promise<PaymentRecord> {
  const supabase = customClient || createServerClient();
  const authContext = await requirePermission(supabase, 'payments.reconcile');

  const updated = PaymentService.reconcilePayment(paymentId, input, authContext);

  const fromTable = supabase.from ? supabase.from('audit_logs') : null;
  if (fromTable && typeof fromTable.insert === 'function') {
    await fromTable.insert({
      actor_email: authContext.email,
      actor_role: authContext.role,
      action: 'PAYMENT_RECONCILED',
      entity_type: 'PAYMENT',
      entity_id: updated.id,
      new_values: {
        reconciliationDate: updated.reconciliationDate,
        reconciledBy: updated.reconciledBy,
        bankReference: input.bankReference,
      },
    });
  }

  return updated;
}

/**
 * 6. Record Manual Financial Adjustment
 */
export async function recordManualAdjustmentAction(
  paymentId: string,
  input: ManualPaymentAdjustmentInput,
  customClient?: any
): Promise<PaymentRecord> {
  const supabase = customClient || createServerClient();
  const authContext = await requirePermission(supabase, 'payments.adjust');

  const updated = PaymentService.recordManualAdjustment(paymentId, input, authContext);

  const fromTable = supabase.from ? supabase.from('audit_logs') : null;
  if (fromTable && typeof fromTable.insert === 'function') {
    await fromTable.insert({
      actor_email: authContext.email,
      actor_role: authContext.role,
      action: 'PAYMENT_MANUAL_ADJUSTMENT',
      entity_type: 'PAYMENT',
      entity_id: updated.id,
      new_values: {
        adjustmentType: input.adjustmentType,
        amountDzd: input.amountDzd,
        reason: input.reason,
      },
    });
  }

  return updated;
}

/**
 * 7. Get Reconciliation Batches
 */
export async function getReconciliationBatchesAction(
  customClient?: any
): Promise<ReconciliationBatch[]> {
  const supabase = customClient || createServerClient();
  await requirePermission(supabase, 'payments.read');

  return PaymentService.getReconciliationBatches();
}

/**
 * 8. Create Reconciliation Batch
 */
export async function createReconciliationBatchAction(
  input: CreateReconciliationBatchInput,
  customClient?: any
): Promise<ReconciliationBatch> {
  const supabase = customClient || createServerClient();
  const authContext = await requirePermission(supabase, 'payments.reconcile');

  const batch = PaymentService.createReconciliationBatch(input, authContext);

  const fromTable = supabase.from ? supabase.from('audit_logs') : null;
  if (fromTable && typeof fromTable.insert === 'function') {
    await fromTable.insert({
      actor_email: authContext.email,
      actor_role: authContext.role,
      action: 'RECONCILIATION_BATCH_CREATED',
      entity_type: 'RECONCILIATION_BATCH',
      entity_id: batch.id,
      new_values: {
        batchNumber: batch.batchNumber,
        courierCode: batch.courierCode,
        orderCount: batch.orderCount,
        expectedTotalDzd: batch.expectedTotalDzd,
        remittedTotalDzd: batch.remittedTotalDzd,
      },
    });
  }

  return batch;
}

/**
 * 9. Close Reconciliation Batch
 */
export async function closeReconciliationBatchAction(
  batchId: string,
  input: CloseReconciliationBatchInput,
  customClient?: any
): Promise<ReconciliationBatch> {
  const supabase = customClient || createServerClient();
  const authContext = await requirePermission(supabase, 'payments.reconcile');

  const batch = PaymentService.closeReconciliationBatch(batchId, input, authContext);

  const fromTable = supabase.from ? supabase.from('audit_logs') : null;
  if (fromTable && typeof fromTable.insert === 'function') {
    await fromTable.insert({
      actor_email: authContext.email,
      actor_role: authContext.role,
      action: 'RECONCILIATION_BATCH_CLOSED',
      entity_type: 'RECONCILIATION_BATCH',
      entity_id: batch.id,
      new_values: {
        batchNumber: batch.batchNumber,
        bankReference: batch.bankReference,
        reconciledBy: batch.reconciledBy,
      },
    });
  }

  return batch;
}

/**
 * 10. Get Payment Overview Metrics
 */
export async function getPaymentOverviewMetricsAction(
  customClient?: any
): Promise<PaymentOverviewMetrics> {
  const supabase = customClient || createServerClient();
  await requirePermission(supabase, 'payments.read');

  return PaymentService.getPaymentMetrics();
}
