// TanStack Query Hooks for Payments & COD Reconciliation Console

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPaymentsListAction,
  getPaymentDetailAction,
  recordCodCollectionAction,
  recordCourierRemittanceAction,
  reconcilePaymentAction,
  recordManualAdjustmentAction,
  getReconciliationBatchesAction,
  createReconciliationBatchAction,
  closeReconciliationBatchAction,
  getPaymentOverviewMetricsAction,
} from '@/lib/actions/payment.actions';
import type {
  PaymentFilterParams,
  RecordCodCollectionInput,
  RecordCourierRemittanceInput,
  ReconcilePaymentInput,
  ManualPaymentAdjustmentInput,
  CreateReconciliationBatchInput,
  CloseReconciliationBatchInput,
} from '@/types/payment-reconciliation.types';

export const PAYMENT_QUERY_KEYS = {
  list: (params?: PaymentFilterParams) => ['payments_list', params] as const,
  detail: (id: string) => ['payment_detail', id] as const,
  metrics: ['payment_overview_metrics'] as const,
  batches: ['reconciliation_batches'] as const,
};

/**
 * Query Payments List
 */
export function usePaymentsList(params?: PaymentFilterParams) {
  return useQuery({
    queryKey: PAYMENT_QUERY_KEYS.list(params),
    queryFn: () => getPaymentsListAction(params),
  });
}

/**
 * Query Detailed Payment Record
 */
export function usePaymentDetail(paymentId: string | null) {
  return useQuery({
    queryKey: PAYMENT_QUERY_KEYS.detail(paymentId || ''),
    queryFn: () => getPaymentDetailAction(paymentId!),
    enabled: Boolean(paymentId),
  });
}

/**
 * Query Payment Overview Financial Metrics
 */
export function usePaymentMetrics() {
  return useQuery({
    queryKey: PAYMENT_QUERY_KEYS.metrics,
    queryFn: () => getPaymentOverviewMetricsAction(),
  });
}

/**
 * Query Reconciliation Batches List
 */
export function useReconciliationBatches() {
  return useQuery({
    queryKey: PAYMENT_QUERY_KEYS.batches,
    queryFn: () => getReconciliationBatchesAction(),
  });
}

/**
 * Mutation: Record COD Doorstep Collection
 */
export function useRecordCodCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, input }: { paymentId: string; input: RecordCodCollectionInput }) =>
      recordCodCollectionAction(paymentId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments_list'] });
      queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.detail(variables.paymentId) });
      queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.metrics });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}

/**
 * Mutation: Record Courier Remittance
 */
export function useRecordCourierRemittance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, input }: { paymentId: string; input: RecordCourierRemittanceInput }) =>
      recordCourierRemittanceAction(paymentId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments_list'] });
      queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.detail(variables.paymentId) });
      queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.metrics });
      queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.batches });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}

/**
 * Mutation: Reconcile Payment
 */
export function useReconcilePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, input }: { paymentId: string; input: ReconcilePaymentInput }) =>
      reconcilePaymentAction(paymentId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments_list'] });
      queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.detail(variables.paymentId) });
      queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.metrics });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}

/**
 * Mutation: Record Manual Financial Adjustment
 */
export function useRecordManualAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, input }: { paymentId: string; input: ManualPaymentAdjustmentInput }) =>
      recordManualAdjustmentAction(paymentId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments_list'] });
      queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.detail(variables.paymentId) });
      queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.metrics });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}

/**
 * Mutation: Create Reconciliation Batch
 */
export function useCreateReconciliationBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReconciliationBatchInput) =>
      createReconciliationBatchAction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments_list'] });
      queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.batches });
      queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.metrics });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}

/**
 * Mutation: Close Reconciliation Batch
 */
export function useCloseReconciliationBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ batchId, input }: { batchId: string; input: CloseReconciliationBatchInput }) =>
      closeReconciliationBatchAction(batchId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments_list'] });
      queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.batches });
      queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.metrics });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}
