// HamzaPhone Payment & COD Reconciliation Engine
// Enforces strict decoupling of Order, Delivery, Payment, Collection, and Courier Remittance lifecycles.

import type {
  PaymentRecord,
  PaymentAdjustment,
  ReconciliationBatch,
  PaymentFilterParams,
  PaymentOverviewMetrics,
  RecordCodCollectionInput,
  RecordCourierRemittanceInput,
  ReconcilePaymentInput,
  ManualPaymentAdjustmentInput,
  CreateReconciliationBatchInput,
  CloseReconciliationBatchInput,
  CodPaymentStatus,
  DiscrepancyType,
} from '@/types/payment-reconciliation.types';
import type { UserAuthContext } from '@/types/rbac.types';

// In-memory persistent storage for local execution & tests
let mockPaymentsDatabase: PaymentRecord[] = [
  {
    id: 'pay-001',
    orderId: 'ord-001',
    orderNumber: 'HP-2026-004921',
    customerName: 'Karim Bouzid',
    customerPhone: '+213 550 12 34 56',
    customerEmail: 'karim.bouzid@gmail.com',
    customerType: 'B2C',
    wilayaCode: 16,
    wilayaName: 'Alger',
    deliveryProvider: 'ECOTRACK',
    trackingNumber: 'ECO-ALG-992144',
    deliveryStatus: 'DELIVERED',
    paymentMethod: 'CASH_ON_DELIVERY',
    paymentStatus: 'RECONCILED',
    reconciliationState: 'RECONCILED',
    expectedAmountDzd: 18500,
    collectedAmountDzd: 18500,
    remittedAmountDzd: 18500,
    currency: 'DZD',
    discrepancyType: 'EXACT',
    discrepancyAmountDzd: 0,
    courierReference: 'ECO-REM-20260820-01',
    collectionDate: '2026-08-20T14:30:00Z',
    remittanceDate: '2026-08-22T10:00:00Z',
    reconciliationDate: '2026-08-23T09:15:00Z',
    reconciledBy: 'admin@hamzaphone.dz',
    reconciliationBatchId: 'batch-eco-001',
    notes: 'Rapprochement validé avec relevé CCP N°882194',
    adjustments: [],
    createdAt: '2026-08-19T11:00:00Z',
    updatedAt: '2026-08-23T09:15:00Z',
  },
  {
    id: 'pay-002',
    orderId: 'ord-002',
    orderNumber: 'HP-2026-004922',
    customerName: 'Atelier Phone Express (Oran)',
    customerPhone: '+213 770 98 76 54',
    customerEmail: 'contact@expressphone-oran.dz',
    customerType: 'B2B',
    wilayaCode: 31,
    wilayaName: 'Oran',
    deliveryProvider: 'ECOTRACK',
    trackingNumber: 'ECO-ORN-552188',
    deliveryStatus: 'DELIVERED',
    paymentMethod: 'CASH_ON_DELIVERY',
    paymentStatus: 'COD_REMITTED',
    reconciliationState: 'UNRECONCILED',
    expectedAmountDzd: 42000,
    collectedAmountDzd: 42000,
    remittedAmountDzd: 42000,
    currency: 'DZD',
    discrepancyType: 'EXACT',
    discrepancyAmountDzd: 0,
    courierReference: 'ECO-REM-20260824-02',
    collectionDate: '2026-08-23T16:00:00Z',
    remittanceDate: '2026-08-24T08:00:00Z',
    reconciliationBatchId: 'batch-eco-002',
    notes: 'Bordereau en attente de vérification bancaire',
    adjustments: [],
    createdAt: '2026-08-21T09:30:00Z',
    updatedAt: '2026-08-24T08:00:00Z',
  },
  {
    id: 'pay-003',
    orderId: 'ord-003',
    orderNumber: 'HP-2026-004923',
    customerName: 'Sofiane Medjahed',
    customerPhone: '+213 661 44 33 22',
    customerEmail: 'sofiane.m@yahoo.fr',
    customerType: 'B2C',
    wilayaCode: 25,
    wilayaName: 'Constantine',
    deliveryProvider: 'ECOTRACK',
    trackingNumber: 'ECO-CST-114477',
    deliveryStatus: 'DELIVERED',
    paymentMethod: 'CASH_ON_DELIVERY',
    paymentStatus: 'COD_COLLECTED',
    reconciliationState: 'UNRECONCILED',
    expectedAmountDzd: 9600,
    collectedAmountDzd: 9600,
    remittedAmountDzd: 0,
    currency: 'DZD',
    discrepancyType: 'EXACT',
    discrepancyAmountDzd: 9600,
    collectionDate: '2026-08-24T07:30:00Z',
    notes: 'Espèces perçues par le livreur EcoTrack, en attente de versement hebdomadaire',
    adjustments: [],
    createdAt: '2026-08-22T14:15:00Z',
    updatedAt: '2026-08-24T07:30:00Z',
  },
  {
    id: 'pay-004',
    orderId: 'ord-004',
    orderNumber: 'HP-2026-004924',
    customerName: 'Youcef Belhadj',
    customerPhone: '+213 555 88 77 66',
    customerEmail: 'youcef.b@outlook.com',
    customerType: 'B2C',
    wilayaCode: 19,
    wilayaName: 'Sétif',
    deliveryProvider: 'ECOTRACK',
    trackingNumber: 'ECO-STF-883311',
    deliveryStatus: 'DELIVERED',
    paymentMethod: 'CASH_ON_DELIVERY',
    paymentStatus: 'COD_COLLECTED',
    reconciliationState: 'DISCREPANCY',
    expectedAmountDzd: 15200,
    collectedAmountDzd: 14700, // Partial collection (-500 DZD)
    remittedAmountDzd: 0,
    currency: 'DZD',
    discrepancyType: 'PARTIAL_COLLECTION',
    discrepancyAmountDzd: 500,
    collectionDate: '2026-08-24T08:20:00Z',
    notes: 'Écart de 500 DZD constaté sur encaissement livreur (Client n’avait pas l’appoint)',
    adjustments: [],
    createdAt: '2026-08-22T16:00:00Z',
    updatedAt: '2026-08-24T08:20:00Z',
  },
  {
    id: 'pay-005',
    orderId: 'ord-005',
    orderNumber: 'HP-2026-004925',
    customerName: 'Samir Brahim',
    customerPhone: '+213 770 11 22 33',
    customerType: 'B2C',
    wilayaCode: 9,
    wilayaName: 'Blida',
    deliveryProvider: 'ECOTRACK',
    trackingNumber: 'ECO-BLD-774411',
    deliveryStatus: 'IN_TRANSIT',
    paymentMethod: 'CASH_ON_DELIVERY',
    paymentStatus: 'COD_PENDING',
    reconciliationState: 'UNRECONCILED',
    expectedAmountDzd: 6400,
    collectedAmountDzd: 0,
    remittedAmountDzd: 0,
    currency: 'DZD',
    discrepancyType: 'EXACT',
    discrepancyAmountDzd: 6400,
    adjustments: [],
    createdAt: '2026-08-23T10:00:00Z',
    updatedAt: '2026-08-23T10:00:00Z',
  },
  {
    id: 'pay-006',
    orderId: 'ord-006',
    orderNumber: 'HP-2026-004926',
    customerName: 'Nassim Zidani',
    customerPhone: '+213 662 55 44 33',
    customerType: 'B2C',
    wilayaCode: 35,
    wilayaName: 'Boumerdès',
    deliveryProvider: 'ECOTRACK',
    trackingNumber: 'ECO-BMD-119933',
    deliveryStatus: 'DELIVERED',
    paymentMethod: 'CASH_ON_DELIVERY',
    paymentStatus: 'COD_PENDING', // Delivered but unpaid / not yet marked as collected
    reconciliationState: 'UNRECONCILED',
    expectedAmountDzd: 8900,
    collectedAmountDzd: 0,
    remittedAmountDzd: 0,
    currency: 'DZD',
    discrepancyType: 'EXACT',
    discrepancyAmountDzd: 8900,
    notes: 'Colis livré d’après le scan EcoTrack, attente confirmation du retour de tournée',
    adjustments: [],
    createdAt: '2026-08-23T11:30:00Z',
    updatedAt: '2026-08-24T06:00:00Z',
  },
];

let mockBatchesDatabase: ReconciliationBatch[] = [
  {
    id: 'batch-eco-001',
    batchNumber: 'RECON-20260822-ECO-01',
    courierCode: 'ECOTRACK',
    periodStart: '2026-08-15T00:00:00Z',
    periodEnd: '2026-08-21T23:59:59Z',
    orderCount: 1,
    paymentIds: ['pay-001'],
    expectedTotalDzd: 18500,
    remittedTotalDzd: 18500,
    discrepancyDzd: 0,
    status: 'RECONCILED',
    bankReference: 'CCP-VRMT-882194',
    reconciledBy: 'admin@hamzaphone.dz',
    reconciledAt: '2026-08-23T09:15:00Z',
    notes: 'Bordereau hebdomadaire EcoTrack Alger clôturé sans écart.',
    createdAt: '2026-08-22T10:00:00Z',
  },
  {
    id: 'batch-eco-002',
    batchNumber: 'RECON-20260824-ECO-02',
    courierCode: 'ECOTRACK',
    periodStart: '2026-08-21T00:00:00Z',
    periodEnd: '2026-08-24T00:00:00Z',
    orderCount: 1,
    paymentIds: ['pay-002'],
    expectedTotalDzd: 42000,
    remittedTotalDzd: 42000,
    discrepancyDzd: 0,
    status: 'BALANCED',
    bankReference: 'BORD-ECO-ORN-991',
    notes: 'Bordereau Oran reçu, en attente de pointage sur relevé bancaire.',
    createdAt: '2026-08-24T08:00:00Z',
  },
];

export class PaymentService {
  /**
   * 1. Create a Payment Record for a new Order (Authoritative Expected Amount)
   */
  static createPaymentRecord(order: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customerType?: 'B2C' | 'B2B';
    wilayaCode: number;
    wilayaName: string;
    deliveryProvider?: string;
    trackingNumber?: string | null;
    totalDzd: number;
    paymentMethod?: string;
  }): PaymentRecord {
    const existing = mockPaymentsDatabase.find((p) => p.orderId === order.id);
    if (existing) return existing;

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      customerType: order.customerType || 'B2C',
      wilayaCode: order.wilayaCode,
      wilayaName: order.wilayaName,
      deliveryProvider: order.deliveryProvider || 'ECOTRACK',
      trackingNumber: order.trackingNumber || null,
      deliveryStatus: 'PENDING',
      paymentMethod: (order.paymentMethod as any) || 'CASH_ON_DELIVERY',
      paymentStatus: 'COD_PENDING',
      reconciliationState: 'UNRECONCILED',
      expectedAmountDzd: order.totalDzd,
      collectedAmountDzd: 0,
      remittedAmountDzd: 0,
      currency: 'DZD',
      discrepancyType: 'EXACT',
      discrepancyAmountDzd: order.totalDzd,
      adjustments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockPaymentsDatabase.unshift(newPayment);
    return newPayment;
  }

  /**
   * 2. Record Cash Collection at Doorstep by Courier
   */
  static recordCodCollection(
    paymentId: string,
    input: RecordCodCollectionInput,
    context?: UserAuthContext
  ): PaymentRecord {
    const payment = mockPaymentsDatabase.find((p) => p.id === paymentId || p.orderId === paymentId || p.orderNumber === paymentId);
    if (!payment) {
      throw new Error(`Enregistrement de paiement introuvable: ${paymentId}`);
    }

    if (payment.paymentStatus === 'RECONCILED') {
      throw new Error('Action impossible : Ce paiement a déjà été définitivement rapproché en banque.');
    }

    if (input.collectedAmountDzd < 0) {
      throw new Error('Le montant encaissé ne peut pas être négatif.');
    }

    // Determine Discrepancy Type
    const diff = payment.expectedAmountDzd - input.collectedAmountDzd;
    let discrepancyType: DiscrepancyType = 'EXACT';
    let reconciliationState = payment.reconciliationState;

    if (diff > 0) {
      discrepancyType = 'PARTIAL_COLLECTION';
      reconciliationState = 'DISCREPANCY';
    } else if (diff < 0) {
      discrepancyType = 'OVER_COLLECTION';
      reconciliationState = 'DISCREPANCY';
    } else {
      discrepancyType = 'EXACT';
      if (reconciliationState === 'DISCREPANCY') reconciliationState = 'UNRECONCILED';
    }

    payment.collectedAmountDzd = input.collectedAmountDzd;
    payment.paymentStatus = 'COD_COLLECTED';
    payment.discrepancyType = discrepancyType;
    payment.discrepancyAmountDzd = diff;
    payment.collectionDate = input.collectionDate || new Date().toISOString();
    if (input.collectionReference) payment.courierReference = input.collectionReference;
    if (input.notes) payment.notes = payment.notes ? `${payment.notes} | ${input.notes}` : input.notes;
    payment.reconciliationState = reconciliationState;
    payment.updatedAt = new Date().toISOString();

    return payment;
  }

  /**
   * 3. Record Courier Remittance (Funds transferred by EcoTrack)
   */
  static recordCourierRemittance(
    paymentId: string,
    input: RecordCourierRemittanceInput,
    context?: UserAuthContext
  ): PaymentRecord {
    const payment = mockPaymentsDatabase.find((p) => p.id === paymentId || p.orderId === paymentId);
    if (!payment) {
      throw new Error(`Enregistrement de paiement introuvable: ${paymentId}`);
    }

    if (payment.paymentStatus === 'COD_PENDING') {
      throw new Error('Action invalide : Impossible d’enregistrer un versement avant la collecte des fonds (Statut actuel: COD_PENDING).');
    }

    if (payment.paymentStatus === 'RECONCILED') {
      throw new Error('Action impossible : Ce paiement a déjà été définitivement rapproché en banque.');
    }

    if (input.remittedAmountDzd < 0) {
      throw new Error('Le montant versé ne peut pas être négatif.');
    }

    const diff = payment.expectedAmountDzd - input.remittedAmountDzd;
    let discrepancyType: DiscrepancyType = payment.discrepancyType;
    let reconciliationState = payment.reconciliationState;

    if (diff !== 0) {
      discrepancyType = diff > 0 ? 'REMITTANCE_SHORTAGE' : 'REMITTANCE_SURPLUS';
      reconciliationState = 'DISCREPANCY';
    } else {
      discrepancyType = 'EXACT';
      if (reconciliationState === 'DISCREPANCY') reconciliationState = 'UNRECONCILED';
    }

    payment.remittedAmountDzd = input.remittedAmountDzd;
    payment.paymentStatus = 'COD_REMITTED';
    payment.discrepancyType = discrepancyType;
    payment.discrepancyAmountDzd = diff;
    payment.remittanceDate = input.remittanceDate || new Date().toISOString();
    payment.courierReference = input.remittanceReference;
    if (input.batchId) payment.reconciliationBatchId = input.batchId;
    if (input.notes) payment.notes = payment.notes ? `${payment.notes} | ${input.notes}` : input.notes;
    payment.reconciliationState = reconciliationState;
    payment.updatedAt = new Date().toISOString();

    return payment;
  }

  /**
   * 4. Reconcile Payment against Bank Statement / CCP Slip
   */
  static reconcilePayment(
    paymentId: string,
    input: ReconcilePaymentInput,
    context?: UserAuthContext
  ): PaymentRecord {
    const payment = mockPaymentsDatabase.find((p) => p.id === paymentId || p.orderId === paymentId);
    if (!payment) {
      throw new Error(`Enregistrement de paiement introuvable: ${paymentId}`);
    }

    if (payment.paymentStatus === 'COD_PENDING') {
      throw new Error('Rapprochement impossible : Les fonds n’ont pas encore été collectés auprès du client.');
    }

    // Discrepancy Check
    if (payment.discrepancyAmountDzd !== 0 && payment.reconciliationState !== 'MANUALLY_ADJUSTED') {
      throw new Error(
        `Rapprochement bloqué : Un écart de ${payment.discrepancyAmountDzd} DZD subsiste. Veuillez effectuer une régularisation financière préalable.`
      );
    }

    payment.paymentStatus = 'RECONCILED';
    payment.reconciliationState = 'RECONCILED';
    payment.reconciliationDate = new Date().toISOString();
    payment.reconciledBy = context?.email || 'admin@hamzaphone.dz';
    if (input.bankReference) {
      payment.notes = payment.notes
        ? `${payment.notes} | Rapproché Réf: ${input.bankReference}`
        : `Rapproché Réf: ${input.bankReference}`;
    }
    if (input.notes) {
      payment.notes = `${payment.notes} | ${input.notes}`;
    }
    payment.updatedAt = new Date().toISOString();

    return payment;
  }

  /**
   * 5. Record Manual Financial Adjustment / Discrepancy Resolution
   */
  static recordManualAdjustment(
    paymentId: string,
    input: ManualPaymentAdjustmentInput,
    context?: UserAuthContext
  ): PaymentRecord {
    const payment = mockPaymentsDatabase.find((p) => p.id === paymentId || p.orderId === paymentId);
    if (!payment) {
      throw new Error(`Enregistrement de paiement introuvable: ${paymentId}`);
    }

    if (!input.reason || input.reason.trim().length < 5) {
      throw new Error('Un motif détaillé (au moins 5 caractères) est obligatoire pour tout ajustement comptable.');
    }

    const adjustment: PaymentAdjustment = {
      id: `adj-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      paymentId: payment.id,
      adjustmentType: input.adjustmentType,
      amountDzd: input.amountDzd,
      reason: input.reason.trim(),
      actorEmail: context?.email || 'admin@hamzaphone.dz',
      actorRole: context?.role || 'OWNER',
      createdAt: new Date().toISOString(),
    };

    payment.adjustments.push(adjustment);

    // Recompute discrepancy
    if (input.adjustmentType === 'DISCREPANCY_WRITE_OFF') {
      payment.discrepancyAmountDzd = 0;
      payment.discrepancyType = 'RESOLVED';
      payment.reconciliationState = 'MANUALLY_ADJUSTED';
    } else if (input.adjustmentType === 'COLLECTION_CORRECTION') {
      payment.collectedAmountDzd += input.amountDzd;
      payment.discrepancyAmountDzd = payment.expectedAmountDzd - payment.collectedAmountDzd;
      payment.discrepancyType = payment.discrepancyAmountDzd === 0 ? 'RESOLVED' : 'PARTIAL_COLLECTION';
      payment.reconciliationState = 'MANUALLY_ADJUSTED';
    } else if (input.adjustmentType === 'REMITTANCE_CORRECTION') {
      payment.remittedAmountDzd += input.amountDzd;
      payment.discrepancyAmountDzd = payment.expectedAmountDzd - payment.remittedAmountDzd;
      payment.discrepancyType = payment.discrepancyAmountDzd === 0 ? 'RESOLVED' : 'REMITTANCE_SHORTAGE';
      payment.reconciliationState = 'MANUALLY_ADJUSTED';
    }

    payment.updatedAt = new Date().toISOString();
    return payment;
  }

  /**
   * 6. Create a Reconciliation Batch for Courier Remittances
   */
  static createReconciliationBatch(
    input: CreateReconciliationBatchInput,
    context?: UserAuthContext
  ): ReconciliationBatch {
    if (!input.paymentIds || input.paymentIds.length === 0) {
      throw new Error('Veuillez sélectionner au moins une commande pour constituer un bordereau.');
    }

    const selectedPayments = mockPaymentsDatabase.filter((p) => input.paymentIds.includes(p.id));
    if (selectedPayments.length === 0) {
      throw new Error('Aucun paiement valide sélectionné.');
    }

    const expectedTotal = selectedPayments.reduce((sum, p) => sum + p.expectedAmountDzd, 0);
    const remittedTotal = selectedPayments.reduce(
      (sum, p) => sum + (p.remittedAmountDzd > 0 ? p.remittedAmountDzd : p.collectedAmountDzd > 0 ? p.collectedAmountDzd : p.expectedAmountDzd),
      0
    );
    const discrepancy = expectedTotal - remittedTotal;

    const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const batchNumber =
      input.batchNumber || `RECON-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${input.courierCode.slice(0, 3)}-${Math.floor(Math.random() * 90 + 10)}`;

    const newBatch: ReconciliationBatch = {
      id: batchId,
      batchNumber,
      courierCode: input.courierCode.toUpperCase(),
      periodStart: input.periodStart || new Date().toISOString(),
      periodEnd: input.periodEnd || new Date().toISOString(),
      orderCount: selectedPayments.length,
      paymentIds: input.paymentIds,
      expectedTotalDzd: expectedTotal,
      remittedTotalDzd: remittedTotal,
      discrepancyDzd: discrepancy,
      status: discrepancy === 0 ? 'BALANCED' : 'DISCREPANCY',
      bankReference: input.bankReference || null,
      notes: input.notes || null,
      createdAt: new Date().toISOString(),
    };

    mockBatchesDatabase.unshift(newBatch);

    // Link payments to batch and advance status to COD_REMITTED if not already
    for (const p of selectedPayments) {
      p.reconciliationBatchId = batchId;
      if (p.paymentStatus === 'COD_PENDING' || p.paymentStatus === 'COD_COLLECTED') {
        p.paymentStatus = 'COD_REMITTED';
        p.remittedAmountDzd = p.remittedAmountDzd || p.collectedAmountDzd || p.expectedAmountDzd;
        p.remittanceDate = new Date().toISOString();
        p.courierReference = batchNumber;
      }
    }

    return newBatch;
  }

  /**
   * 7. Close and Reconcile a Batch
   */
  static closeReconciliationBatch(
    batchId: string,
    input: CloseReconciliationBatchInput,
    context?: UserAuthContext
  ): ReconciliationBatch {
    const batch = mockBatchesDatabase.find((b) => b.id === batchId || b.batchNumber === batchId);
    if (!batch) {
      throw new Error(`Bordereau introuvable: ${batchId}`);
    }

    if (!input.bankReference || input.bankReference.trim().length === 0) {
      throw new Error('La référence bancaire / reçu de virement est obligatoire pour clôturer le bordereau.');
    }

    batch.status = 'RECONCILED';
    batch.bankReference = input.bankReference.trim();
    batch.reconciledBy = context?.email || 'admin@hamzaphone.dz';
    batch.reconciledAt = new Date().toISOString();
    if (input.notes) batch.notes = batch.notes ? `${batch.notes} | ${input.notes}` : input.notes;

    // Reconcile constituent payments
    for (const paymentId of batch.paymentIds) {
      const p = mockPaymentsDatabase.find((item) => item.id === paymentId);
      if (p && p.paymentStatus !== 'RECONCILED') {
        p.paymentStatus = 'RECONCILED';
        p.reconciliationState = 'RECONCILED';
        p.reconciliationDate = new Date().toISOString();
        p.reconciledBy = batch.reconciledBy;
      }
    }

    return batch;
  }

  /**
   * 8. Query Filtered Payments List
   */
  static getPaymentsList(params?: PaymentFilterParams): PaymentRecord[] {
    let list = [...mockPaymentsDatabase];

    if (params?.paymentStatus && params.paymentStatus !== 'ALL') {
      list = list.filter((p) => p.paymentStatus === params.paymentStatus);
    }

    if (params?.deliveryStatus && params.deliveryStatus !== 'ALL') {
      list = list.filter((p) => p.deliveryStatus === params.deliveryStatus);
    }

    if (params?.reconciliationState && params.reconciliationState !== 'ALL') {
      list = list.filter((p) => p.reconciliationState === params.reconciliationState);
    }

    if (params?.discrepancyOnly) {
      list = list.filter((p) => p.discrepancyAmountDzd !== 0 || p.discrepancyType !== 'EXACT');
    }

    if (params?.deliveredButUnpaid) {
      list = list.filter((p) => p.deliveryStatus === 'DELIVERED' && p.paymentStatus === 'COD_PENDING');
    }

    if (params?.collectedButUnremitted) {
      list = list.filter((p) => p.paymentStatus === 'COD_COLLECTED');
    }

    if (params?.wilayaCode && params.wilayaCode !== ('ALL' as any)) {
      list = list.filter((p) => p.wilayaCode === Number(params.wilayaCode));
    }

    if (params?.customerType && params.customerType !== 'ALL') {
      list = list.filter((p) => p.customerType === params.customerType);
    }

    if (params?.batchId) {
      list = list.filter((p) => p.reconciliationBatchId === params.batchId);
    }

    if (params?.searchQuery) {
      const q = params.searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.orderNumber.toLowerCase().includes(q) ||
          p.customerName.toLowerCase().includes(q) ||
          p.customerPhone.toLowerCase().includes(q) ||
          (p.trackingNumber && p.trackingNumber.toLowerCase().includes(q)) ||
          (p.courierReference && p.courierReference.toLowerCase().includes(q))
      );
    }

    return list;
  }

  /**
   * 9. Query Single Payment Record Detail
   */
  static getPaymentDetail(paymentId: string): PaymentRecord {
    const payment = mockPaymentsDatabase.find(
      (p) => p.id === paymentId || p.orderId === paymentId || p.orderNumber === paymentId
    );
    if (!payment) {
      throw new Error(`Paiement introuvable: ${paymentId}`);
    }
    return payment;
  }

  /**
   * 10. Query Overview Metrics
   */
  static getPaymentMetrics(): PaymentOverviewMetrics {
    const all = mockPaymentsDatabase;

    const totalExpectedCodDzd = all.reduce((sum, p) => sum + p.expectedAmountDzd, 0);
    const totalCollectedDzd = all.reduce((sum, p) => sum + p.collectedAmountDzd, 0);
    const totalRemittedDzd = all.reduce((sum, p) => sum + p.remittedAmountDzd, 0);
    const totalReconciledDzd = all
      .filter((p) => p.paymentStatus === 'RECONCILED')
      .reduce((sum, p) => sum + p.remittedAmountDzd, 0);
    const totalDiscrepancyDzd = all.reduce((sum, p) => sum + Math.abs(p.discrepancyAmountDzd), 0);

    const pendingCollectionCount = all.filter((p) => p.paymentStatus === 'COD_PENDING').length;
    const deliveredUnpaidCount = all.filter(
      (p) => p.deliveryStatus === 'DELIVERED' && p.paymentStatus === 'COD_PENDING'
    ).length;
    const collectedUnremittedCount = all.filter((p) => p.paymentStatus === 'COD_COLLECTED').length;
    const discrepancyCount = all.filter((p) => p.discrepancyAmountDzd !== 0 || p.discrepancyType !== 'EXACT').length;
    const reconciledCount = all.filter((p) => p.paymentStatus === 'RECONCILED').length;

    return {
      totalExpectedCodDzd,
      totalCollectedDzd,
      totalRemittedDzd,
      totalReconciledDzd,
      totalDiscrepancyDzd,
      pendingCollectionCount,
      deliveredUnpaidCount,
      collectedUnremittedCount,
      discrepancyCount,
      reconciledCount,
      totalPaymentsCount: all.length,
    };
  }

  /**
   * 11. Query Reconciliation Batches
   */
  static getReconciliationBatches(): ReconciliationBatch[] {
    return mockBatchesDatabase;
  }
}
