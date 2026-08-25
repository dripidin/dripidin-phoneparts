'use client';

// HamzaPhone Payment & Cash-on-Delivery (COD) Reconciliation Console
// Decoupled financial state tracking, courier remittance reconciliation,
// discrepancy resolution, and bank statement verification.

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/card';
import { formatDZD, formatDate } from '@/lib/utils';
import {
  usePaymentsList,
  usePaymentDetail,
  usePaymentMetrics,
  useReconciliationBatches,
  useRecordCodCollection,
  useRecordCourierRemittance,
  useReconcilePayment,
  useRecordManualAdjustment,
  useCreateReconciliationBatch,
  useCloseReconciliationBatch,
} from '@/lib/hooks/use-payments';
import type {
  PaymentRecord,
  PaymentFilterParams,
  CodPaymentStatus,
  PaymentAdjustmentType,
  ReconciliationBatch,
} from '@/types/payment-reconciliation.types';
import {
  CreditCard,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  Truck,
  Building2,
  Layers,
  FileCheck,
  ShieldAlert,
  ArrowRight,
  Eye,
  Plus,
  Receipt,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export function PaymentsView() {
  // Filters State
  const [filters, setFilters] = useState<PaymentFilterParams>({
    paymentStatus: 'ALL',
    deliveryStatus: 'ALL',
    reconciliationState: 'ALL',
    customerType: 'ALL',
  });
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'DELIVERED_UNPAID' | 'COLLECTED_UNREMITTED' | 'DISCREPANCY' | 'RECONCILED'>('ALL');

  // Queries
  const { data: payments = [], isLoading: isListLoading } = usePaymentsList({
    ...filters,
    deliveredButUnpaid: quickFilter === 'DELIVERED_UNPAID',
    collectedButUnremitted: quickFilter === 'COLLECTED_UNREMITTED',
    discrepancyOnly: quickFilter === 'DISCREPANCY',
    paymentStatus: quickFilter === 'RECONCILED' ? 'RECONCILED' : filters.paymentStatus,
  });

  const { data: metrics } = usePaymentMetrics();
  const { data: batches = [] } = useReconciliationBatches();

  // Mutations
  const recordCollectionMutation = useRecordCodCollection();
  const recordRemittanceMutation = useRecordCourierRemittance();
  const reconcileMutation = useReconcilePayment();
  const manualAdjustmentMutation = useRecordManualAdjustment();
  const createBatchMutation = useCreateReconciliationBatch();
  const closeBatchMutation = useCloseReconciliationBatch();

  // UI Tabs
  const [activeTab, setActiveTab] = useState<'JOURNAL' | 'BATCHES' | 'DISCREPANCIES'>('JOURNAL');

  // Modal States
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const { data: selectedPayment } = usePaymentDetail(selectedPaymentId);

  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isRemittanceModalOpen, setIsRemittanceModalOpen] = useState(false);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isCreateBatchModalOpen, setIsCreateBatchModalOpen] = useState(false);
  const [isCloseBatchModalOpen, setIsCloseBatchModalOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // Form States
  const [targetPayment, setTargetPayment] = useState<PaymentRecord | null>(null);
  const [collectedAmount, setCollectedAmount] = useState<number>(0);
  const [collectionRef, setCollectionRef] = useState('');
  const [collectionNotes, setCollectionNotes] = useState('');

  const [remittedAmount, setRemittedAmount] = useState<number>(0);
  const [remittanceRef, setRemittanceRef] = useState('');
  const [remittanceNotes, setRemittanceNotes] = useState('');

  const [bankRef, setBankRef] = useState('');
  const [reconcileNotes, setReconcileNotes] = useState('');

  const [adjType, setAdjType] = useState<PaymentAdjustmentType>('DISCREPANCY_WRITE_OFF');
  const [adjAmount, setAdjAmount] = useState<number>(0);
  const [adjReason, setAdjReason] = useState('');

  const [batchCourier, setBatchCourier] = useState('ECOTRACK');
  const [batchBankRef, setBatchBankRef] = useState('');
  const [batchSelectedPayments, setBatchSelectedPayments] = useState<string[]>([]);

  // Helpers
  const openCollectionModal = (payment: PaymentRecord) => {
    setTargetPayment(payment);
    setCollectedAmount(payment.expectedAmountDzd);
    setCollectionRef(payment.trackingNumber || '');
    setCollectionNotes('');
    setIsCollectionModalOpen(true);
  };

  const handleCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPayment) return;

    try {
      await recordCollectionMutation.mutateAsync({
        paymentId: targetPayment.id,
        input: {
          collectedAmountDzd: Number(collectedAmount),
          collectionReference: collectionRef,
          notes: collectionNotes,
        },
      });
      setIsCollectionModalOpen(false);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const openRemittanceModal = (payment: PaymentRecord) => {
    setTargetPayment(payment);
    setRemittedAmount(payment.collectedAmountDzd > 0 ? payment.collectedAmountDzd : payment.expectedAmountDzd);
    setRemittanceRef(`VRMT-ECO-${payment.orderNumber}`);
    setRemittanceNotes('');
    setIsRemittanceModalOpen(true);
  };

  const handleRemittanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPayment || !remittanceRef) return;

    try {
      await recordRemittanceMutation.mutateAsync({
        paymentId: targetPayment.id,
        input: {
          remittedAmountDzd: Number(remittedAmount),
          remittanceReference: remittanceRef,
          notes: remittanceNotes,
        },
      });
      setIsRemittanceModalOpen(false);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const openReconcileModal = (payment: PaymentRecord) => {
    setTargetPayment(payment);
    setBankRef(`CCP-POINTAGE-${Date.now().toString().slice(-6)}`);
    setReconcileNotes('');
    setIsReconcileModalOpen(true);
  };

  const handleReconcileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPayment) return;

    try {
      await reconcileMutation.mutateAsync({
        paymentId: targetPayment.id,
        input: { bankReference: bankRef, notes: reconcileNotes },
      });
      setIsReconcileModalOpen(false);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const openAdjustmentModal = (payment: PaymentRecord) => {
    setTargetPayment(payment);
    setAdjType('DISCREPANCY_WRITE_OFF');
    setAdjAmount(payment.discrepancyAmountDzd);
    setAdjReason('');
    setIsAdjustmentModalOpen(true);
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPayment || !adjReason) return;

    try {
      await manualAdjustmentMutation.mutateAsync({
        paymentId: targetPayment.id,
        input: {
          adjustmentType: adjType,
          amountDzd: Number(adjAmount),
          reason: adjReason,
        },
      });
      setIsAdjustmentModalOpen(false);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const openCloseBatchModal = (batch: ReconciliationBatch) => {
    setSelectedBatchId(batch.id);
    setBatchBankRef(batch.bankReference || `CCP-CLOTURE-${Date.now().toString().slice(-6)}`);
    setIsCloseBatchModalOpen(true);
  };

  const handleCloseBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId || !batchBankRef) return;

    try {
      await closeBatchMutation.mutateAsync({
        batchId: selectedBatchId,
        input: { bankReference: batchBankRef },
      });
      setIsCloseBatchModalOpen(false);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const openCreateBatchModal = () => {
    // Select all unremitted or unreconciled payments
    const availablePaymentIds = payments
      .filter((p) => p.paymentStatus === 'COD_COLLECTED' || p.paymentStatus === 'COD_PENDING')
      .map((p) => p.id);

    setBatchSelectedPayments(availablePaymentIds);
    setBatchCourier('ECOTRACK');
    setBatchBankRef('');
    setIsCreateBatchModalOpen(true);
  };

  const handleCreateBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (batchSelectedPayments.length === 0) {
      alert('Veuillez sélectionner au moins une commande pour le bordereau.');
      return;
    }

    try {
      await createBatchMutation.mutateAsync({
        courierCode: batchCourier,
        paymentIds: batchSelectedPayments,
        bankReference: batchBankRef || undefined,
      });
      setIsCreateBatchModalOpen(false);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const openDetailModal = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setIsDetailModalOpen(true);
  };

  const getStatusBadge = (status: CodPaymentStatus) => {
    switch (status) {
      case 'COD_PENDING':
        return (
          <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 text-[10px] flex items-center gap-1 font-bold">
            <Clock className="w-3 h-3" /> En attente encaissement
          </Badge>
        );
      case 'COD_COLLECTED':
        return (
          <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 text-[10px] flex items-center gap-1 font-bold">
            <DollarSign className="w-3 h-3" /> Encaissé par livreur
          </Badge>
        );
      case 'COD_REMITTED':
        return (
          <Badge variant="outline" className="text-purple-700 bg-purple-50 border-purple-200 text-[10px] flex items-center gap-1 font-bold">
            <Truck className="w-3 h-3" /> Versé par EcoTrack
          </Badge>
        );
      case 'RECONCILED':
        return (
          <Badge variant="success" className="text-[10px] flex items-center gap-1 font-bold">
            <CheckCircle2 className="w-3 h-3" /> Rapproché en Banque
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="destructive" className="text-[10px] flex items-center gap-1 font-bold">
            <AlertTriangle className="w-3 h-3" /> Échec Paiement
          </Badge>
        );
      case 'REFUNDED':
        return (
          <Badge variant="secondary" className="text-[10px] flex items-center gap-1 font-bold">
            Remboursé
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-orange-600" />
            Console de Rapprochement Financier & Paiements COD
          </h2>
          <p className="text-xs text-gray-500">
            Suivi indépendant des encaissements espèces à la livraison, versements transporteur et pointage bancaire CCP
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('JOURNAL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'JOURNAL' ? 'bg-white text-orange-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Journal des Règlements
            </button>
            <button
              onClick={() => setActiveTab('BATCHES')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'BATCHES' ? 'bg-white text-orange-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bordereaux EcoTrack ({batches.length})
            </button>
          </div>

          <Button onClick={openCreateBatchModal} size="sm" className="bg-orange-600 hover:bg-orange-700 font-bold">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Nouveau Bordereau
          </Button>
        </div>
      </div>

      {/* Metric Counters Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <span className="text-gray-500 block text-[11px]">Total COD Attendu</span>
          <strong className="text-lg font-bold text-gray-900 block mt-0.5">
            {formatDZD(metrics?.totalExpectedCodDzd ?? 0)}
          </strong>
          <span className="text-[10px] text-gray-400">Total commandes actives</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <span className="text-gray-500 block text-[11px]">Encaissé par Livreur</span>
          <strong className="text-lg font-bold text-blue-600 block mt-0.5">
            {formatDZD(metrics?.totalCollectedDzd ?? 0)}
          </strong>
          <span className="text-[10px] text-gray-400">{metrics?.collectedUnremittedCount ?? 0} en attente versement</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <span className="text-gray-500 block text-[11px]">Versé par EcoTrack</span>
          <strong className="text-lg font-bold text-purple-600 block mt-0.5">
            {formatDZD(metrics?.totalRemittedDzd ?? 0)}
          </strong>
          <span className="text-[10px] text-gray-400">En cours de rapprochement</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <span className="text-gray-500 block text-[11px]">Rapproché en Banque</span>
          <strong className="text-lg font-bold text-emerald-700 block mt-0.5">
            {formatDZD(metrics?.totalReconciledDzd ?? 0)}
          </strong>
          <span className="text-[10px] text-gray-400">{metrics?.reconciledCount ?? 0} commandes validées</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <span className="text-gray-500 block text-[11px]">Écarts & Litiges</span>
          <strong className="text-lg font-bold text-red-600 block mt-0.5">
            {formatDZD(metrics?.totalDiscrepancyDzd ?? 0)}
          </strong>
          <span className="text-[10px] text-red-500 font-bold">{metrics?.discrepancyCount ?? 0} écarts à régulariser</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: JOURNAL DES PAIEMENTS                                              */}
      {/* ========================================================================= */}
      {activeTab === 'JOURNAL' && (
        <div className="space-y-4">
          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setQuickFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                quickFilter === 'ALL' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous ({metrics?.totalPaymentsCount ?? payments.length})
            </button>
            <button
              onClick={() => setQuickFilter('DELIVERED_UNPAID')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                quickFilter === 'DELIVERED_UNPAID'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Livrés non encaissés ({metrics?.deliveredUnpaidCount ?? 0})
            </button>
            <button
              onClick={() => setQuickFilter('COLLECTED_UNREMITTED')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                quickFilter === 'COLLECTED_UNREMITTED'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Encaissés non versés ({metrics?.collectedUnremittedCount ?? 0})
            </button>
            <button
              onClick={() => setQuickFilter('DISCREPANCY')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                quickFilter === 'DISCREPANCY'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Écarts & Litiges ({metrics?.discrepancyCount ?? 0})
            </button>
            <button
              onClick={() => setQuickFilter('RECONCILED')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                quickFilter === 'RECONCILED'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Rapprochés ({metrics?.reconciledCount ?? 0})
            </button>
          </div>

          {/* Search & Secondary Filter Toolbar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <Input
                placeholder="Rechercher N° commande, client, suivi EcoTrack..."
                value={filters.searchQuery || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
                className="pl-8 text-xs h-8"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 font-bold">Client :</span>
                <Select
                  value={filters.customerType || 'ALL'}
                  onChange={(e) => setFilters((prev) => ({ ...prev, customerType: e.target.value as any }))}
                  className="text-xs h-8"
                >
                  <option value="ALL">Tous (B2C & B2B)</option>
                  <option value="B2C">Clients B2C</option>
                  <option value="B2B">Grossistes B2B</option>
                </Select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 font-bold">État Livraison :</span>
                <Select
                  value={filters.deliveryStatus || 'ALL'}
                  onChange={(e) => setFilters((prev) => ({ ...prev, deliveryStatus: e.target.value }))}
                  className="text-xs h-8"
                >
                  <option value="ALL">Toutes les livraisons</option>
                  <option value="DELIVERED">Livrées uniquement</option>
                  <option value="IN_TRANSIT">En transit</option>
                  <option value="FAILED">Échecs / Retours</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200 text-[11px] uppercase">
                <tr>
                  <th className="px-4 py-3">N° Commande & Date</th>
                  <th className="px-4 py-3">Client & Wilaya</th>
                  <th className="px-4 py-3">Livraison (EcoTrack)</th>
                  <th className="px-4 py-3">Statut Financier</th>
                  <th className="px-4 py-3 text-right">Attendu</th>
                  <th className="px-4 py-3 text-right">Encaissé</th>
                  <th className="px-4 py-3 text-right">Versé</th>
                  <th className="px-4 py-3 text-center">Écart</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isListLoading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-400">
                      Chargement des données financières...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-400">
                      Aucune transaction financière ne correspond aux filtres.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-900 block font-mono">{p.orderNumber}</span>
                        <span className="text-gray-400 text-[10px]">{formatDate(p.createdAt)}</span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-900 block">{p.customerName}</span>
                          <Badge variant={p.customerType === 'B2B' ? 'default' : 'secondary'} className="text-[9px] px-1 py-0">
                            {p.customerType}
                          </Badge>
                        </div>
                        <span className="text-gray-500 text-[11px]">
                          {p.wilayaCode} - {p.wilayaName}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-mono text-gray-600 block text-[11px]">
                          {p.trackingNumber || 'En préparation'}
                        </span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 text-gray-600">
                          {p.deliveryStatus}
                        </Badge>
                      </td>

                      <td className="px-4 py-3">{getStatusBadge(p.paymentStatus)}</td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">
                        {formatDZD(p.expectedAmountDzd)}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-semibold text-blue-700">
                        {p.collectedAmountDzd > 0 ? formatDZD(p.collectedAmountDzd) : '-'}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-semibold text-purple-700">
                        {p.remittedAmountDzd > 0 ? formatDZD(p.remittedAmountDzd) : '-'}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {p.discrepancyAmountDzd !== 0 ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 font-mono">
                            {p.discrepancyAmountDzd > 0 ? `-${formatDZD(p.discrepancyAmountDzd)}` : `+${formatDZD(Math.abs(p.discrepancyAmountDzd))}`}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-bold text-[11px] font-mono">0 DZD</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDetailModal(p.id)}
                            className="h-7 px-2 text-[11px] text-gray-600 hover:text-gray-900"
                            title="Voir timeline financière et historique"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Détail
                          </Button>

                          {p.paymentStatus === 'COD_PENDING' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openCollectionModal(p)}
                              className="h-7 px-2 text-[11px] text-blue-700 border-blue-200 hover:bg-blue-50 font-bold"
                              title="Enregistrer l'encaissement livreur"
                            >
                              <DollarSign className="w-3 h-3 mr-1" />
                              Encaisser
                            </Button>
                          )}

                          {p.paymentStatus === 'COD_COLLECTED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openRemittanceModal(p)}
                              className="h-7 px-2 text-[11px] text-purple-700 border-purple-200 hover:bg-purple-50 font-bold"
                              title="Enregistrer le versement EcoTrack"
                            >
                              <Truck className="w-3 h-3 mr-1" />
                              Verser
                            </Button>
                          )}

                          {p.paymentStatus === 'COD_REMITTED' && p.discrepancyAmountDzd === 0 && (
                            <Button
                              size="sm"
                              onClick={() => openReconcileModal(p)}
                              className="h-7 px-2 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                              title="Valider le rapprochement bancaire CCP"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Rapprocher
                            </Button>
                          )}

                          {p.discrepancyAmountDzd !== 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openAdjustmentModal(p)}
                              className="h-7 px-2 text-[11px] text-red-700 border-red-200 hover:bg-red-50 font-bold"
                              title="Régulariser l'écart financier"
                            >
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Régulariser
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BORDEREAUX ECOTRACK (RECONCILIATION BATCHES)                        */}
      {/* ========================================================================= */}
      {activeTab === 'BATCHES' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((batch) => (
              <div
                key={batch.id}
                className="p-5 bg-white rounded-xl border border-gray-200 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-gray-900 font-mono">{batch.batchNumber}</h3>
                      <span className="text-[11px] text-gray-500 block">
                        Transporteur : <strong className="text-gray-900">{batch.courierCode}</strong>
                      </span>
                    </div>

                    <Badge
                      variant={
                        batch.status === 'RECONCILED'
                          ? 'success'
                          : batch.status === 'BALANCED'
                          ? 'default'
                          : 'destructive'
                      }
                      className="text-[10px]"
                    >
                      {batch.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-gray-500">{batch.notes || 'Bordereau de versement périodique'}</p>

                  <div className="pt-2 border-t border-gray-100 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Commandes incluses :</span>
                      <strong className="text-gray-900 font-mono">{batch.orderCount} colis</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total COD Attendu :</span>
                      <strong className="text-gray-900 font-mono">{formatDZD(batch.expectedTotalDzd)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Montant Versé :</span>
                      <strong className="text-purple-700 font-mono">{formatDZD(batch.remittedTotalDzd)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Écart :</span>
                      <strong className={batch.discrepancyDzd === 0 ? 'text-emerald-700 font-mono' : 'text-red-600 font-mono'}>
                        {formatDZD(batch.discrepancyDzd)}
                      </strong>
                    </div>
                    {batch.bankReference && (
                      <div className="flex justify-between pt-1 border-t border-gray-100 text-[11px]">
                        <span className="text-gray-400">Réf. Banque / CCP :</span>
                        <span className="font-mono text-gray-700 font-bold">{batch.bankReference}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                  {batch.status !== 'RECONCILED' && (
                    <Button
                      size="sm"
                      onClick={() => openCloseBatchModal(batch)}
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Clôturer & Rapprocher
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PAYMENT TIMELINE & AUDIT DETAIL                                   */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Dossier Financier : ${selectedPayment?.orderNumber || ''}`}
        size="lg"
      >
        {selectedPayment && (
          <div className="space-y-6 text-xs">
            {/* 6-Step Visual Lifecycle Stepper */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <span className="font-bold text-gray-900 block mb-3">Cycle de Vie de la Commande & du Paiement</span>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-[10px]">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg font-bold border border-emerald-200">
                  1. Commande
                  <span className="block font-normal text-[9px]">Créée</span>
                </div>
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg font-bold border border-emerald-200">
                  2. Expédition
                  <span className="block font-normal text-[9px]">EcoTrack</span>
                </div>
                <div
                  className={`p-2 rounded-lg font-bold border ${
                    selectedPayment.deliveryStatus === 'DELIVERED'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-gray-100 text-gray-400 border-gray-200'
                  }`}
                >
                  3. Livraison
                  <span className="block font-normal text-[9px]">{selectedPayment.deliveryStatus}</span>
                </div>
                <div
                  className={`p-2 rounded-lg font-bold border ${
                    selectedPayment.collectedAmountDzd > 0 || selectedPayment.paymentStatus === 'RECONCILED'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-gray-100 text-gray-400 border-gray-200'
                  }`}
                >
                  4. Encaissé
                  <span className="block font-normal text-[9px]">Livreur</span>
                </div>
                <div
                  className={`p-2 rounded-lg font-bold border ${
                    selectedPayment.remittedAmountDzd > 0 || selectedPayment.paymentStatus === 'RECONCILED'
                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                      : 'bg-gray-100 text-gray-400 border-gray-200'
                  }`}
                >
                  5. Versé
                  <span className="block font-normal text-[9px]">Virement</span>
                </div>
                <div
                  className={`p-2 rounded-lg font-bold border ${
                    selectedPayment.paymentStatus === 'RECONCILED'
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-gray-100 text-gray-400 border-gray-200'
                  }`}
                >
                  6. Rapproché
                  <span className="block font-normal text-[9px]">Banque CCP</span>
                </div>
              </div>
            </div>

            {/* Financial Totals Breakdown */}
            <div className="grid grid-cols-4 gap-3 p-4 bg-white rounded-xl border border-gray-200 text-center">
              <div>
                <span className="text-gray-400 block text-[10px]">Montant Attendu</span>
                <strong className="text-sm font-bold text-gray-900 font-mono">
                  {formatDZD(selectedPayment.expectedAmountDzd)}
                </strong>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Montant Encaissé</span>
                <strong className="text-sm font-bold text-blue-700 font-mono">
                  {formatDZD(selectedPayment.collectedAmountDzd)}
                </strong>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Montant Versé</span>
                <strong className="text-sm font-bold text-purple-700 font-mono">
                  {formatDZD(selectedPayment.remittedAmountDzd)}
                </strong>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Écart Constaté</span>
                <strong
                  className={`text-sm font-bold font-mono ${
                    selectedPayment.discrepancyAmountDzd === 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {formatDZD(selectedPayment.discrepancyAmountDzd)}
                </strong>
              </div>
            </div>

            {/* Historical Adjustments Ledger */}
            {selectedPayment.adjustments.length > 0 && (
              <div className="space-y-2">
                <span className="font-bold text-gray-900 block">Historique des Régularisations & Ajustements</span>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {selectedPayment.adjustments.map((adj) => (
                    <div key={adj.id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-gray-900 font-mono block">{adj.adjustmentType}</span>
                        <p className="text-gray-500 text-[11px]">{adj.reason}</p>
                      </div>
                      <div className="text-right">
                        <strong className="text-gray-900 font-mono block">{formatDZD(adj.amountDzd)}</strong>
                        <span className="text-gray-400 text-[10px]">
                          {adj.actorEmail} • {new Date(adj.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: RECORD DOORSTEP COLLECTION                                       */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
        title={`Encaisser COD : ${targetPayment?.orderNumber || ''}`}
        size="md"
      >
        <form onSubmit={handleCollectionSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-gray-700 block mb-1">Montant Espèces Collecté (DZD) *</label>
            <Input
              type="number"
              value={collectedAmount}
              onChange={(e) => setCollectedAmount(Number(e.target.value))}
              required
            />
            <span className="text-[11px] text-gray-400 mt-1 block">
              Montant attendu d'après la commande : <strong>{formatDZD(targetPayment?.expectedAmountDzd ?? 0)}</strong>
            </span>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Référence Bordereau Livreur / Scan</label>
            <Input
              value={collectionRef}
              onChange={(e) => setCollectionRef(e.target.value)}
              placeholder="ex: ECO-ALG-992144"
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Notes / Observations</label>
            <Input
              value={collectionNotes}
              onChange={(e) => setCollectionNotes(e.target.value)}
              placeholder="Observations éventuelles sur le paiement..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="ghost" type="button" onClick={() => setIsCollectionModalOpen(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={recordCollectionMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 font-bold text-white"
            >
              {recordCollectionMutation.isPending ? 'Enregistrement...' : 'Confirmer l’Encaissement'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: RECORD COURIER REMITTANCE                                        */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isRemittanceModalOpen}
        onClose={() => setIsRemittanceModalOpen(false)}
        title={`Enregistrer Versement : ${targetPayment?.orderNumber || ''}`}
        size="md"
      >
        <form onSubmit={handleRemittanceSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-gray-700 block mb-1">Montant Versé par EcoTrack (DZD) *</label>
            <Input
              type="number"
              value={remittedAmount}
              onChange={(e) => setRemittedAmount(Number(e.target.value))}
              required
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Référence du Virement / Bordereau *</label>
            <Input
              value={remittanceRef}
              onChange={(e) => setRemittanceRef(e.target.value)}
              placeholder="ex: VRMT-ECO-20260824"
              required
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Notes</label>
            <Input
              value={remittanceNotes}
              onChange={(e) => setRemittanceNotes(e.target.value)}
              placeholder="Notes sur le versement..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="ghost" type="button" onClick={() => setIsRemittanceModalOpen(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={recordRemittanceMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 font-bold text-white"
            >
              {recordRemittanceMutation.isPending ? 'Enregistrement...' : 'Valider le Versement'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: RECONCILE PAYMENT (BANK CONFIRMATION)                             */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isReconcileModalOpen}
        onClose={() => setIsReconcileModalOpen(false)}
        title={`Rapprochement Bancaire : ${targetPayment?.orderNumber || ''}`}
        size="md"
      >
        <form onSubmit={handleReconcileSubmit} className="space-y-4 text-xs">
          <p className="text-gray-500">
            Confirmez que les fonds d'un montant de <strong>{formatDZD(targetPayment?.remittedAmountDzd ?? 0)}</strong>{' '}
            ont bien été crédités sur le compte bancaire ou CCP de HamzaPhone.
          </p>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Référence du Relevé / Pointage CCP *</label>
            <Input
              value={bankRef}
              onChange={(e) => setBankRef(e.target.value)}
              placeholder="ex: CCP-VRMT-882194"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="ghost" type="button" onClick={() => setIsReconcileModalOpen(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={reconcileMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white"
            >
              {reconcileMutation.isPending ? 'Validation...' : 'Valider le Rapprochement'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: MANUAL FINANCIAL ADJUSTMENT                                       */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        title={`Régularisation Financière : ${targetPayment?.orderNumber || ''}`}
        size="md"
      >
        <form onSubmit={handleAdjustmentSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-gray-700 block mb-1">Type de Régularisation *</label>
            <Select
              value={adjType}
              onChange={(e) => setAdjType(e.target.value as any)}
            >
              <option value="DISCREPANCY_WRITE_OFF">Passage en perte / Abandon d’écart (Write-Off)</option>
              <option value="COLLECTION_CORRECTION">Correction d’encaissement livreur</option>
              <option value="REMITTANCE_CORRECTION">Correction de versement transporteur</option>
              <option value="MANUAL_SURCHARGE">Frais supplémentaires ou retenue</option>
            </Select>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Montant d'Ajustement (DZD) *</label>
            <Input
              type="number"
              value={adjAmount}
              onChange={(e) => setAdjAmount(Number(e.target.value))}
              required
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Justification Obligatoire *</label>
            <textarea
              rows={3}
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
              placeholder="Expliquez en détail l'origine de l'écart et la décision comptable..."
              required
              className="w-full p-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="ghost" type="button" onClick={() => setIsAdjustmentModalOpen(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={manualAdjustmentMutation.isPending}
              className="bg-red-600 hover:bg-red-700 font-bold text-white"
            >
              {manualAdjustmentMutation.isPending ? 'Régularisation...' : 'Enregistrer l’Ajustement'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 6: CREATE RECONCILIATION BATCH                                      */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCreateBatchModalOpen}
        onClose={() => setIsCreateBatchModalOpen(false)}
        title="Créer un Bordereau de Rapprochement Transporteur"
        size="lg"
      >
        <form onSubmit={handleCreateBatchSubmit} className="space-y-4 text-xs">
          <p className="text-gray-500">
            Regroupez les règlements collectés par EcoTrack pour effectuer un pointage global avec le virement reçu.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Transporteur *</label>
              <Select value={batchCourier} onChange={(e) => setBatchCourier(e.target.value)}>
                <option value="ECOTRACK">EcoTrack Algérie</option>
                <option value="YALIDINE">Yalidine Express</option>
              </Select>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Réf. Virement Bancaire (Optionnel)</label>
              <Input
                value={batchBankRef}
                onChange={(e) => setBatchBankRef(e.target.value)}
                placeholder="ex: CCP-VRMT-99218"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <label className="font-bold text-gray-900 block">
              Commandes Disponibles à Rapprocher ({batchSelectedPayments.length} sélectionnées)
            </label>

            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50/50">
              {payments
                .filter((p) => p.paymentStatus !== 'RECONCILED')
                .map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={batchSelectedPayments.includes(p.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setBatchSelectedPayments((prev) =>
                            checked ? [...prev, p.id] : prev.filter((id) => id !== p.id)
                          );
                        }}
                        className="rounded text-orange-600 focus:ring-orange-500"
                      />
                      <div>
                        <span className="font-bold text-gray-900 font-mono">{p.orderNumber}</span>
                        <span className="text-gray-500 text-[11px] block">{p.customerName} ({p.wilayaName})</span>
                      </div>
                    </div>
                    <strong className="font-mono text-gray-900">{formatDZD(p.expectedAmountDzd)}</strong>
                  </label>
                ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="ghost" type="button" onClick={() => setIsCreateBatchModalOpen(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createBatchMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 font-bold text-white"
            >
              {createBatchMutation.isPending ? 'Création...' : 'Créer le Bordereau'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 7: CLOSE RECONCILIATION BATCH                                       */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCloseBatchModalOpen}
        onClose={() => setIsCloseBatchModalOpen(false)}
        title="Clôturer & Rapprocher le Bordereau en Banque"
        size="md"
      >
        <form onSubmit={handleCloseBatchSubmit} className="space-y-4 text-xs">
          <p className="text-gray-500">
            Saisissez la référence du versement CCP ou virement bancaire pour clôturer ce bordereau et marquer l'ensemble des commandes associées comme rapprochées.
          </p>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Référence Virement CCP / Banque *</label>
            <Input
              value={batchBankRef}
              onChange={(e) => setBatchBankRef(e.target.value)}
              placeholder="ex: CCP-VRMT-884912"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="ghost" type="button" onClick={() => setIsCloseBatchModalOpen(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={closeBatchMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white"
            >
              {closeBatchMutation.isPending ? 'Clôture...' : 'Clôturer le Bordereau'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
