'use client';

// Logistics, EcoTrack Shipments & 58-Wilaya Rate Management Console for HamzaPhone

import React, { useState } from 'react';
import {
  useShipmentsList,
  useSyncShipmentStatus,
  useCancelShipment,
  useTestProviderConnection,
  useDeliveryRates,
} from '@/lib/hooks/use-delivery';
import { formatDZD, formatDate, ALGERIA_WILAYAS } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/card';
import type { DeliveryStatus, DeliveryType } from '@/types/database.types';
import {
  PackageCheck,
  Truck,
  CheckCircle2,
  RefreshCw,
  Search,
  ExternalLink,
  Printer,
  XCircle,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  Building2,
  Home,
  Activity,
  AlertCircle,
} from 'lucide-react';

export function DeliveryView() {
  const [activeTab, setActiveTab] = useState<'shipments' | 'providers' | 'rates'>('shipments');

  // Shipment List Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [wilayaFilter, setWilayaFilter] = useState<string>('');
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Selected Shipment for Timeline Modal
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // React Query Hooks
  const { data: shipmentsData, isLoading: isShipmentsLoading, refetch: refetchShipments } = useShipmentsList({
    search: search || undefined,
    status: (statusFilter as DeliveryStatus) || undefined,
    wilayaCode: wilayaFilter ? Number(wilayaFilter) : undefined,
    deliveryType: (deliveryTypeFilter as DeliveryType) || undefined,
    page,
    pageSize,
  });

  const { data: ratesData, isLoading: isRatesLoading } = useDeliveryRates();
  const syncStatusMutation = useSyncShipmentStatus();
  const cancelShipmentMutation = useCancelShipment();
  const testConnectionMutation = useTestProviderConnection();

  const shipments = shipmentsData?.shipments || [];
  const totalCount = shipmentsData?.totalCount || 0;
  const totalPages = shipmentsData?.totalPages || 1;

  const handleSyncStatus = async (trackingNumber: string) => {
    try {
      const res = await syncStatusMutation.mutateAsync(trackingNumber);
      setActionMessage(`Statut du colis ${trackingNumber} synchronisé : "${res.status}".`);
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const handleCancelShipment = async (orderId: string, trackingNumber: string) => {
    if (!confirm(`Confirmer l'annulation de l'expédition ${trackingNumber} auprès d'EcoTrack ?`)) return;
    try {
      await cancelShipmentMutation.mutateAsync({ orderId, reason: 'Annulation depuis console logistique' });
      setActionMessage(`Expédition ${trackingNumber} annulée avec succès.`);
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const handleTestEcoTrack = async () => {
    try {
      const res = await testConnectionMutation.mutateAsync('ECOTRACK');
      if (res.success) {
        setActionMessage(`Succès test API : ${res.message} (Latence: ${res.latencyMs || 0}ms)`);
      } else {
        alert(`Échec test API : ${res.message}`);
      }
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const getStatusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">CRÉÉ / EN ATTENTE</Badge>;
      case 'PICKED_UP':
        return <Badge variant="outline">RAMASSÉ</Badge>;
      case 'IN_TRANSIT':
        return <Badge variant="orange">EN TRANSIT</Badge>;
      case 'OUT_FOR_DELIVERY':
        return <Badge variant="orange">EN COURS DE LIVRAISON</Badge>;
      case 'DELIVERED':
        return <Badge variant="success">LIVRÉ & ENCAISSÉ</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">TENTATIVE ÉCHOUÉE</Badge>;
      case 'RETURNED':
        return <Badge variant="destructive">RETOURNÉ</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary">ANNULÉ</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-orange-600" />
            Console Logistique & Expéditions EcoTrack
          </h2>
          <p className="text-xs text-gray-500">
            Gestion du flux d'expédition, synchronisation des bordereaux, et suivi des 58 Wilayas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchShipments()}
            isLoading={isShipmentsLoading}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualiser
          </Button>

          <Button
            size="sm"
            onClick={handleTestEcoTrack}
            isLoading={testConnectionMutation.isPending}
            className="bg-orange-600 hover:bg-orange-700 font-bold"
          >
            <Activity className="w-3.5 h-3.5" />
            Tester API EcoTrack
          </Button>
        </div>
      </div>

      {/* Global Notification Banner */}
      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('shipments')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'shipments'
              ? 'bg-orange-50 text-orange-700 border border-orange-200 shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          📦 Expéditions & Colis ({totalCount})
        </button>

        <button
          onClick={() => setActiveTab('providers')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'providers'
              ? 'bg-orange-50 text-orange-700 border border-orange-200 shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          🚚 Transporteurs & API
        </button>

        <button
          onClick={() => setActiveTab('rates')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'rates'
              ? 'bg-orange-50 text-orange-700 border border-orange-200 shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          📍 Grille 58 Wilayas
        </button>
      </div>

      {/* TAB 1: Shipments Management */}
      {activeTab === 'shipments' && (
        <div className="space-y-4">
          
          {/* Filters Row */}
          <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <Input
                placeholder="Rechercher code suivi, commande, client..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8 text-xs h-9"
              />
            </div>

            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs h-9"
            >
              <option value="">Tous les statuts de livraison</option>
              <option value="PENDING">PENDING (Bordereau créé)</option>
              <option value="PICKED_UP">PICKED_UP (Ramassé)</option>
              <option value="IN_TRANSIT">IN_TRANSIT (En transit)</option>
              <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY (En livraison)</option>
              <option value="DELIVERED">DELIVERED (Livré & Encaissé)</option>
              <option value="FAILED">FAILED (Échec tentative)</option>
              <option value="RETURNED">RETURNED (Retourné)</option>
              <option value="CANCELLED">CANCELLED (Annulé)</option>
            </Select>

            <Select
              value={wilayaFilter}
              onChange={(e) => {
                setWilayaFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs h-9"
            >
              <option value="">Toutes les 58 Wilayas</option>
              {ALGERIA_WILAYAS.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.code.toString().padStart(2, '0')} - {w.name}
                </option>
              ))}
            </Select>

            <Select
              value={deliveryTypeFilter}
              onChange={(e) => {
                setDeliveryTypeFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs h-9"
            >
              <option value="">Tous les modes</option>
              <option value="HOME">🏠 Domicile</option>
              <option value="DESK">🏢 Stopdesk (Point Relais)</option>
            </Select>
          </div>

          {/* Shipments Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200 uppercase text-[10px]">
                  <tr>
                    <th className="px-3.5 py-3">Code Suivi / Colis</th>
                    <th className="px-3.5 py-3">N° Commande</th>
                    <th className="px-3.5 py-3">Destinataire & Wilaya</th>
                    <th className="px-3.5 py-3">Mode</th>
                    <th className="px-3.5 py-3 text-right">Montant COD</th>
                    <th className="px-3.5 py-3 text-center">Statut Colis</th>
                    <th className="px-3.5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isShipmentsLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400">
                        Chargement des expéditions...
                      </td>
                    </tr>
                  ) : shipments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400">
                        Aucune expédition trouvée pour ces filtres.
                      </td>
                    </tr>
                  ) : (
                    shipments.map((s: any) => (
                      <tr key={s.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-3.5 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-lg border border-gray-200">
                              {s.tracking_number}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                            {s.courier_code || 'ECOTRACK'} • {formatDate(s.created_at)}
                          </span>
                        </td>

                        <td className="px-3.5 py-3">
                          <span className="font-mono font-bold text-orange-700">
                            {s.orders?.order_number || 'N/A'}
                          </span>
                        </td>

                        <td className="px-3.5 py-3">
                          <p className="font-bold text-gray-900">{s.orders?.recipient_name || 'Client'}</p>
                          <p className="text-[11px] text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {s.orders?.wilaya_name} ({s.orders?.wilaya_code})
                          </p>
                        </td>

                        <td className="px-3.5 py-3">
                          <span className="font-semibold text-gray-700">
                            {s.orders?.delivery_type === 'DESK' ? '🏢 Stopdesk' : '🏠 Domicile'}
                          </span>
                        </td>

                        <td className="px-3.5 py-3 text-right font-mono font-bold text-gray-900">
                          {formatDZD(s.cod_amount_dzd || s.orders?.total_dzd || 0)}
                        </td>

                        <td className="px-3.5 py-3 text-center">
                          {getStatusBadge(s.status)}
                        </td>

                        <td className="px-3.5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Voir Timeline Suivi"
                              onClick={() => setSelectedShipment(s)}
                              className="h-7 px-2 text-xs"
                            >
                              <Clock className="w-3.5 h-3.5 text-gray-600" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              title="Synchroniser avec EcoTrack"
                              onClick={() => handleSyncStatus(s.tracking_number)}
                              isLoading={syncStatusMutation.isPending}
                              className="h-7 px-2 text-xs"
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-orange-600" />
                            </Button>

                            {s.label_url && (
                              <a
                                href={s.label_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center h-7 px-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                                title="Imprimer Bordereau PDF"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {s.status === 'PENDING' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Annuler Expédition"
                                onClick={() => handleCancelShipment(s.order_id, s.tracking_number)}
                                className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700"
                              >
                                <XCircle className="w-3.5 h-3.5" />
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

            {/* Pagination Controls */}
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
              <span>{totalCount} expéditions au total</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-7 text-xs"
                >
                  Précédent
                </Button>
                <span className="px-2 font-bold text-gray-700">
                  Page {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-7 text-xs"
                >
                  Suivant
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Providers & API Configurations */}
      {activeTab === 'providers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* EcoTrack Active Card */}
          <div className="p-5 bg-white rounded-3xl border border-orange-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold">
                  E
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900">EcoTrack Express</h4>
                  <span className="text-[11px] text-gray-500">Intégration Principale</span>
                </div>
              </div>
              <Badge variant="success">ACTIF & CONNECTÉ</Badge>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Transporteur officiel couvrant les 58 Wilayas algériennes en livraison Domicile et Stopdesk avec collecte COD.
            </p>

            <div className="space-y-2 text-xs bg-gray-50 p-3.5 rounded-2xl border border-gray-100 font-mono">
              <div className="flex justify-between">
                <span className="text-gray-500">Environnement:</span>
                <span className="font-bold text-emerald-700">SANDBOX / PROD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ouverture Colis:</span>
                <span className="font-bold text-gray-800">Autorisée (Client)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Webhook Status:</span>
                <span className="font-bold text-emerald-700">/api/webhooks/ecotrack</span>
              </div>
            </div>

            <Button
              onClick={handleTestEcoTrack}
              isLoading={testConnectionMutation.isPending}
              className="w-full text-xs font-bold bg-orange-600 hover:bg-orange-700"
            >
              Tester la Connexion API
            </Button>
          </div>

          {/* Yalidine Standby Card */}
          <div className="p-5 bg-white rounded-3xl border border-gray-200 shadow-xs space-y-4 opacity-75">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  Y
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900">Yalidine Fast Logistics</h4>
                  <span className="text-[11px] text-gray-500">Secours / Back-up</span>
                </div>
              </div>
              <Badge variant="outline">EN RÉSERVE</Badge>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Prise en charge automatique pour les zones non desservies en cas de rupture EcoTrack.
            </p>

            <div className="space-y-2 text-xs bg-gray-50 p-3.5 rounded-2xl border border-gray-100 font-mono">
              <div className="flex justify-between">
                <span className="text-gray-500">Statut:</span>
                <span className="font-bold text-gray-600">Standby</span>
              </div>
            </div>
          </div>

          {/* Local Fleet Card */}
          <div className="p-5 bg-white rounded-3xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                  H
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900">Flotte Interne HamzaPhone</h4>
                  <span className="text-[11px] text-gray-500">Alger & Belfort Express</span>
                </div>
              </div>
              <Badge variant="secondary">LOCAL</Badge>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Livreurs magasin pour les réparateurs B2B et livraisons express dans la journée à Alger.
            </p>

            <div className="space-y-2 text-xs bg-gray-50 p-3.5 rounded-2xl border border-gray-100 font-mono">
              <div className="flex justify-between">
                <span className="text-gray-500">Zone:</span>
                <span className="font-bold text-gray-800">Wilaya 16 (Alger)</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: 58-Wilayas Rate Matrix */}
      {activeTab === 'rates' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">
                Grille Tarifaire Officielle des 58 Wilayas
              </h3>
              <p className="text-xs text-gray-500">
                Frais de livraison autoritaires appliqués lors de la commande client et du calcul du montant COD.
              </p>
            </div>

            <div className="w-64">
              <Input
                placeholder="Filtrer une Wilaya..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-xs h-8"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px]">
                <tr>
                  <th className="px-3.5 py-2.5">Code</th>
                  <th className="px-3.5 py-2.5">Nom Wilaya</th>
                  <th className="px-3.5 py-2.5">Tarif Domicile</th>
                  <th className="px-3.5 py-2.5">Tarif Stopdesk</th>
                  <th className="px-3.5 py-2.5">Délai Estimé</th>
                  <th className="px-3.5 py-2.5">Transporteur</th>
                  <th className="px-3.5 py-2.5 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(ratesData || [])
                  .filter((r) =>
                    r.wilayaName.toLowerCase().includes(search.toLowerCase()) ||
                    r.wilayaCode.toString().includes(search)
                  )
                  .map((r) => (
                    <tr key={r.wilayaCode} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-3.5 py-2 font-mono font-bold text-gray-900">
                        {r.wilayaCode.toString().padStart(2, '0')}
                      </td>
                      <td className="px-3.5 py-2 font-semibold text-gray-800">
                        {r.wilayaName}
                      </td>
                      <td className="px-3.5 py-2 font-bold text-gray-900">
                        {formatDZD(r.baseCostDzd)}
                      </td>
                      <td className="px-3.5 py-2 font-bold text-blue-700">
                        {formatDZD(r.wilayaCode === 16 ? 300 : 450)}
                      </td>
                      <td className="px-3.5 py-2 text-gray-500">
                        {r.estimatedDaysMin} à {r.estimatedDaysMax} jours ouvrables
                      </td>
                      <td className="px-3.5 py-2 font-medium text-gray-600">
                        {r.providerCode}
                      </td>
                      <td className="px-3.5 py-2 text-center">
                        <Badge variant="success" className="text-[10px]">ACTIF</Badge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shipment Details & Timeline Modal */}
      {selectedShipment && (
        <Modal
          isOpen={!!selectedShipment}
          onClose={() => setSelectedShipment(null)}
          title={`Suivi Colis : ${selectedShipment.tracking_number}`}
          size="lg"
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 text-xs">
            {/* Header info */}
            <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Statut Actuel</span>
                <div className="mt-1">{getStatusBadge(selectedShipment.status)}</div>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Montant à Encaisser (COD)</span>
                <span className="font-mono font-bold text-orange-700 text-sm block mt-0.5">
                  {formatDZD(selectedShipment.cod_amount_dzd || selectedShipment.orders?.total_dzd || 0)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">N° Commande</span>
                <span className="font-mono font-bold text-gray-900 block mt-0.5">
                  {selectedShipment.orders?.order_number}
                </span>
              </div>
            </div>

            {/* Recipient & Address Snapshot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-1">
                <span className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-orange-600" />
                  Destinataire
                </span>
                <p className="font-semibold text-gray-800">{selectedShipment.orders?.recipient_name}</p>
                <p className="text-gray-500 font-mono">{selectedShipment.orders?.recipient_phone}</p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-1">
                <span className="font-bold text-gray-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-600" />
                  Destination
                </span>
                <p className="font-semibold text-gray-800">
                  {selectedShipment.orders?.wilaya_name} ({selectedShipment.orders?.wilaya_code}) - {selectedShipment.orders?.commune_name}
                </p>
                <p className="text-gray-500">Mode : {selectedShipment.orders?.delivery_type === 'DESK' ? 'Stopdesk' : 'Domicile'}</p>
              </div>
            </div>

            {/* Timeline Steps */}
            <div>
              <h4 className="font-bold text-gray-900 mb-2">Historique des Événements & Localisation</h4>
              <div className="border border-gray-200 rounded-2xl p-4 bg-white space-y-3">
                {(selectedShipment.tracking_history || []).length === 0 ? (
                  <p className="text-gray-400 italic">Aucun événement enregistré pour le moment.</p>
                ) : (
                  (selectedShipment.tracking_history as any[]).map((ev, idx) => (
                    <div key={idx} className="flex items-start gap-3 relative pb-2 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">{ev.description || ev.providerStatus}</span>
                          <span className="text-[10px] text-gray-400">{formatDate(ev.timestamp)}</span>
                        </div>
                        {ev.location && (
                          <p className="text-[11px] text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {ev.location}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              {selectedShipment.label_url && (
                <a
                  href={selectedShipment.label_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimer Bordereau
                </a>
              )}
              <Button variant="ghost" onClick={() => setSelectedShipment(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
