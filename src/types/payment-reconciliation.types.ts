// HamzaPhone Payment & COD Reconciliation Domain Types
// Strictly decouples order state, delivery state, payment state, and courier remittance/reconciliation state.

export type PaymentMethod =
  | 'CASH_ON_DELIVERY'
  | 'BANK_TRANSFER'
  | 'B2B_CREDIT_ACCOUNT'
  | 'STORE_CREDIT';

export type CodPaymentStatus =
  | 'COD_PENDING'      // Order placed with COD; awaiting physical delivery and cash collection
  | 'COD_COLLECTED'    // Courier physically collected cash from recipient at doorstep
  | 'COD_REMITTED'     // Courier transferred/remitted collected cash to HamzaPhone
  | 'RECONCILED'       // Finance team matched remittance with bank/CCP slip and order total
  | 'FAILED'           // Delivery refused or recipient did not pay
  | 'REFUNDED';        // Funds refunded to client (SAV / return)

export type DiscrepancyType =
  | 'EXACT'                // Exact collection & remittance matched expected amount
  | 'PARTIAL_COLLECTION'   // Courier collected less than expected order total
  | 'OVER_COLLECTION'      // Courier collected more than expected order total
  | 'REMITTANCE_SHORTAGE'  // Courier remitted less than what was recorded as collected
  | 'REMITTANCE_SURPLUS'   // Courier remitted more than what was recorded as collected
  | 'RESOLVED';            // Discrepancy formally adjusted, settled, or written off

export type ReconciliationState =
  | 'UNRECONCILED'
  | 'RECONCILED'
  | 'DISCREPANCY'
  | 'MANUALLY_ADJUSTED';

export type PaymentAdjustmentType =
  | 'COLLECTION_CORRECTION'  // Correction of doorstep collection amount (courier typo/slip fix)
  | 'REMITTANCE_CORRECTION'   // Correction of courier bank transfer/remittance amount
  | 'DISCREPANCY_WRITE_OFF'   // Write-off authorized by finance/admin
  | 'MANUAL_SURCHARGE'       // Additional courier fee or return delivery charge
  | 'CUSTOMER_CREDIT';       // Credit applied to customer ledger

export interface PaymentAdjustment {
  id: string;
  paymentId: string;
  adjustmentType: PaymentAdjustmentType;
  amountDzd: number; // Positive = credit/addition, negative = deduction/charge
  reason: string;
  actorEmail: string;
  actorRole: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerType: 'B2C' | 'B2B';
  wilayaCode: number;
  wilayaName: string;
  deliveryProvider: string; // e.g. 'ECOTRACK'
  trackingNumber?: string | null;
  deliveryStatus: 'PENDING' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED' | 'RETURNED' | 'CANCELLED';
  
  paymentMethod: PaymentMethod;
  paymentStatus: CodPaymentStatus;
  reconciliationState: ReconciliationState;
  
  expectedAmountDzd: number;   // Authoritative snapshot from final order total
  collectedAmountDzd: number;  // Amount physically collected by courier
  remittedAmountDzd: number;   // Amount transferred by courier in remittance batch
  currency: 'DZD';
  
  discrepancyType: DiscrepancyType;
  discrepancyAmountDzd: number; // Expected - Remitted (or Expected - Collected)
  
  courierReference?: string | null; // Shipment ID or courier remittance slip
  collectionDate?: string | null;
  remittanceDate?: string | null;
  reconciliationDate?: string | null;
  reconciledBy?: string | null;
  reconciliationBatchId?: string | null;
  
  failureReason?: string | null;
  notes?: string | null;
  
  adjustments: PaymentAdjustment[];
  createdAt: string;
  updatedAt: string;
}

export type ReconciliationBatchStatus =
  | 'OPEN'          // Batch in progress, receiving orders
  | 'BALANCED'      // All expected amounts match remitted amounts (Zero discrepancy)
  | 'DISCREPANCY'   // Total remitted does not match total expected
  | 'RECONCILED';   // Verified, matched with bank transfer, and closed

export interface ReconciliationBatch {
  id: string;
  batchNumber: string; // e.g. 'RECON-20260824-ECO-01'
  courierCode: string; // e.g. 'ECOTRACK'
  periodStart: string;
  periodEnd: string;
  orderCount: number;
  paymentIds: string[];
  expectedTotalDzd: number;
  remittedTotalDzd: number;
  discrepancyDzd: number;
  status: ReconciliationBatchStatus;
  bankReference?: string | null; // CCP transfer ref, bank wire number, or cash receipt
  reconciledBy?: string | null;
  reconciledAt?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface PaymentFilterParams {
  searchQuery?: string;
  paymentStatus?: CodPaymentStatus | 'ALL';
  deliveryStatus?: string | 'ALL';
  reconciliationState?: ReconciliationState | 'ALL';
  discrepancyOnly?: boolean;
  deliveredButUnpaid?: boolean;
  collectedButUnremitted?: boolean;
  wilayaCode?: number | 'ALL';
  customerType?: 'B2C' | 'B2B' | 'ALL';
  dateFrom?: string;
  dateTo?: string;
  batchId?: string;
}

export interface PaymentOverviewMetrics {
  totalExpectedCodDzd: number;
  totalCollectedDzd: number;
  totalRemittedDzd: number;
  totalReconciledDzd: number;
  totalDiscrepancyDzd: number;
  
  pendingCollectionCount: number;
  deliveredUnpaidCount: number;
  collectedUnremittedCount: number;
  discrepancyCount: number;
  reconciledCount: number;
  totalPaymentsCount: number;
}

export interface RecordCodCollectionInput {
  collectedAmountDzd: number;
  collectionDate?: string;
  collectionReference?: string;
  notes?: string;
}

export interface RecordCourierRemittanceInput {
  remittedAmountDzd: number;
  remittanceDate?: string;
  remittanceReference: string;
  batchId?: string;
  notes?: string;
}

export interface ReconcilePaymentInput {
  bankReference?: string;
  notes?: string;
}

export interface ManualPaymentAdjustmentInput {
  adjustmentType: PaymentAdjustmentType;
  amountDzd: number;
  reason: string;
}

export interface CreateReconciliationBatchInput {
  batchNumber?: string;
  courierCode: string;
  paymentIds: string[];
  periodStart?: string;
  periodEnd?: string;
  bankReference?: string;
  notes?: string;
}

export interface CloseReconciliationBatchInput {
  bankReference: string;
  notes?: string;
}
