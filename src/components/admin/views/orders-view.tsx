'use client';

// Orders Management System (OMS) View for HamzaPhone

import React, { useState } from 'react';
import {
  useOrders,
  useOrderDetails,
  useUpdateOrderStatus,
  useUpdateOrderNotes,
} from '@/lib/hooks/use-admin-queries';
import { useCreateShipment } from '@/lib/hooks/use-delivery';
import { ALLOWED_ORDER_TRANSITIONS } from '@/lib/services/order.service';
import { formatDZD, formatDate, ALGERIA_WILAYAS } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/card';
import type { OrderStatus } from '@/types/database.types';
import {
  ShoppingCart,
  Search,
  Eye,
  Truck,
  CheckCircle2,
  FileText,
  XCircle,
  Clock,
  MapPin,
  Phone,
  User,
  ExternalLink,
} from 'lucide-react';

export function OrdersView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [wilayaFilter, setWilayaFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Selected Order for Detail View / Workflow Transition
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<OrderStatus>('CONFIRMED');
  const [transitionReason, setTransitionReason] = useState('Validation téléphonique effectuée avec le client');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [internalNotesText, setInternalNotesText] = useState('');

  // React Query Hooks
  const { data: ordersData, isLoading } = useOrders({
    search: searchTerm || undefined,
    status: (statusFilter as OrderStatus) || undefined,
    wilayaCode: wilayaFilter ? Number(wilayaFilter) : undefined,
    page,
    pageSize,
  });

  const { data: orderDetails, isLoading: isDetailsLoading } = useOrderDetails(selectedOrderId);

  const updateStatusMutation = useUpdateOrderStatus();
  const updateNotesMutation = useUpdateOrderNotes();
  const createShipmentMutation = useCreateShipment();

  const orders = ordersData?.orders || [];
  const totalCount = ordersData?.totalCount || 0;
  const totalPages = ordersData?.totalPages || 1;

  const handleCreateShipment = async (orderId: string) => {
    try {
      const res = await createShipmentMutation.mutateAsync({ orderId, providerCode: 'ECOTRACK' });
      setActionSuccess(`Bordereau EcoTrack généré avec succès (${res.trackingNumber}). Commande passée en READY_FOR_SHIPMENT.`);
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      alert(`Erreur création expédition: ${err.message}`);
    }
  };

  const handleOpenTransition = (ord: any) => {
    setSelectedOrderId(ord.id);
    const nextAllowed = ALLOWED_ORDER_TRANSITIONS[ord.status as OrderStatus] || [];
    setTargetStatus(nextAllowed[0] || 'CONFIRMED');
    setTransitionReason('Validation téléphonique effectuée avec le client');
    setIsTransitionModalOpen(true);
  };

  const handleOpenDetails = (ord: any) => {
    setSelectedOrderId(ord.id);
    setInternalNotesText(ord.internal_notes || '');
  };

  const handleExecuteTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;

    try {
      await updateStatusMutation.mutateAsync({
        orderId: selectedOrderId,
        newStatus: targetStatus,
        reason: transitionReason,
      });

      setIsTransitionModalOpen(false);
      setActionSuccess(`Statut de la commande mis à jour vers "${targetStatus}".`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedOrderId) return;
    try {
      await updateNotesMutation.mutateAsync({
        orderId: selectedOrderId,
        internalNotes: internalNotesText,
      });
      setActionSuccess('Notes internes enregistrées.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-600" />
            Gestion des Commandes ({totalCount})
          </h2>
          <p className="text-xs text-gray-500">
            Cycle de vie des commandes, validations téléphoniques, bordereaux EcoTrack et encaissements COD (58 Wilayas)
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="N° commande, client, téléphone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-200"
            />
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-44 text-xs"
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING">PENDING (En attente)</option>
            <option value="CONFIRMED">CONFIRMED (Validée)</option>
            <option value="PROCESSING">PROCESSING (Préparation)</option>
            <option value="READY_FOR_SHIPMENT">READY_FOR_SHIPMENT (Prête)</option>
            <option value="SHIPPED">SHIPPED (En livraison)</option>
            <option value="DELIVERED">DELIVERED (Livrée)</option>
            <option value="CANCELLED">CANCELLED (Annulée)</option>
            <option value="RETURNED">RETURNED (Retournée)</option>
          </Select>

          <Select
            value={wilayaFilter}
            onChange={(e) => {
              setWilayaFilter(e.target.value);
              setPage(1);
            }}
            className="w-44 text-xs"
          >
            <option value="">Toutes les wilayas</option>
            {ALGERIA_WILAYAS.map((w) => (
              <option key={w.code} value={w.code.toString()}>
                {w.code} - {w.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-4 py-3">Commande & Date</th>
                <th className="px-3 py-3">Destinataire</th>
                <th className="px-3 py-3">Wilaya / Commune</th>
                <th className="px-3 py-3">Articles</th>
                <th className="px-3 py-3">Montant Total (DZD)</th>
                <th className="px-3 py-3">Statut</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    Chargement des commandes Supabase...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    Aucune commande trouvée.
                  </td>
                </tr>
              ) : (
                orders.map((ord: any) => {
                  const itemsCount = ord.order_items?.length || 1;
                  return (
                    <tr key={ord.id} className="hover:bg-gray-50/70">
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-900 block">{ord.order_number}</span>
                        <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatDate(ord.created_at)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-semibold text-gray-800 block">{ord.recipient_name}</span>
                        <span className="text-[11px] text-gray-500 font-mono">{ord.recipient_phone}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-medium text-gray-800 block">
                          {ord.wilaya_name} ({ord.wilaya_code})
                        </span>
                        <span className="text-[11px] text-gray-400">{ord.commune_name}</span>
                      </td>
                      <td className="px-3 py-3 font-semibold text-gray-700">
                        {itemsCount} article{itemsCount > 1 ? 's' : ''}
                      </td>
                      <td className="px-3 py-3 font-bold text-gray-900">
                        {formatDZD(Number(ord.total_dzd) || 0)}
                      </td>
                      <td className="px-3 py-3">
                        <Badge
                          variant={
                            ord.status === 'DELIVERED'
                              ? 'success'
                              : ord.status === 'READY_FOR_SHIPMENT' || ord.status === 'SHIPPED'
                              ? 'secondary'
                              : ord.status === 'CONFIRMED'
                              ? 'orange'
                              : ord.status === 'CANCELLED'
                              ? 'error'
                              : 'default'
                          }
                        >
                          {ord.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDetails(ord)}
                            className="text-xs px-2"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Détails
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenTransition(ord)}
                            className="text-xs px-2 font-bold"
                          >
                            Transition
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>{totalCount} commandes enregistrées</span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Précédent
            </Button>
            <span className="px-2 font-bold">
              Page {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrderId && !isTransitionModalOpen && (
        <Modal
          isOpen={!!selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          title={`Détail Commande ${orderDetails?.order_number || ''}`}
          size="lg"
        >
          {isDetailsLoading || !orderDetails ? (
            <div className="py-8 text-center text-xs text-gray-400">Chargement des détails...</div>
          ) : (
            <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 text-xs">
              {/* Top Banner Status */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <span className="text-[11px] text-gray-500 block">Statut Actuel</span>
                  <Badge variant="orange" className="mt-0.5">{orderDetails.status}</Badge>
                </div>
                <div>
                  <span className="text-[11px] text-gray-500 block">Paiement</span>
                  <Badge variant="outline" className="mt-0.5">{orderDetails.payment_method}</Badge>
                </div>
                <div>
                  <span className="text-[11px] text-gray-500 block">Mode Livraison</span>
                  <span className="font-bold text-gray-900 block mt-0.5">
                    {orderDetails.delivery_type === 'DESK' ? '🏢 Point Stopdesk' : '🏠 Domicile'}
                  </span>
                </div>
              </div>

              {/* Client & Address Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-1.5">
                  <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-orange-600" />
                    Destinataire
                  </h4>
                  <p className="font-semibold">{orderDetails.recipient_name}</p>
                  <p className="text-gray-600 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-gray-400" />
                    {orderDetails.recipient_phone}
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-1.5">
                  <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-600" />
                    Adresse de Livraison (Algérie)
                  </h4>
                  <p className="font-semibold">
                    {orderDetails.wilaya_name} ({orderDetails.wilaya_code}) - {orderDetails.commune_name}
                  </p>
                  <p className="text-gray-600">{orderDetails.shipping_address_line}</p>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Pièces Commandées</h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2">Article</th>
                        <th className="px-3 py-2 text-right">Prix Unitaire</th>
                        <th className="px-3 py-2 text-center">Qté</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(orderDetails.order_items || []).map((it: any) => (
                        <tr key={it.id}>
                          <td className="px-3 py-2 font-semibold text-gray-900">{it.product_name || it.sku}</td>
                          <td className="px-3 py-2 text-right font-mono">{formatDZD(it.unit_price_dzd)}</td>
                          <td className="px-3 py-2 text-center font-bold">{it.quantity}</td>
                          <td className="px-3 py-2 text-right font-bold font-mono">{formatDZD(it.total_price_dzd)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1 text-right">
                <div className="flex justify-between text-gray-500">
                  <span>Sous-total:</span>
                  <span className="font-mono">{formatDZD(orderDetails.subtotal_dzd)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Frais de livraison:</span>
                  <span className="font-mono">{formatDZD(orderDetails.shipping_cost_dzd)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-sm pt-1 border-t border-gray-200">
                  <span>Total à Encaisser (COD):</span>
                  <span className="font-mono text-orange-700">{formatDZD(orderDetails.total_dzd)}</span>
                </div>
              </div>

              {/* EcoTrack Logistics Dispatch Card */}
              <div className="p-3.5 bg-orange-50/50 rounded-2xl border border-orange-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                    <Truck className="w-4 h-4 text-orange-600" />
                    Expédition Transporteur (EcoTrack)
                  </span>
                  {orderDetails.tracking_number ? (
                    <Badge variant="success">BORDEREAU GÉNÉRÉ</Badge>
                  ) : (
                    <Badge variant="secondary">NON EXPÉDIÉE</Badge>
                  )}
                </div>

                {orderDetails.tracking_number ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                    <div>
                      <span className="text-[10px] text-gray-500 block">Code de suivi :</span>
                      <span className="font-mono font-bold text-gray-900 text-xs bg-white px-2 py-1 rounded-lg border border-gray-200 inline-block">
                        {orderDetails.tracking_number}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-2">({orderDetails.courier_code || 'ECOTRACK'})</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={`https://ecotrack.dz/track/${orderDetails.tracking_number}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-xs font-bold transition-colors"
                      >
                        <ExternalLink className="w-3 h-3 text-gray-500" />
                        Suivre sur EcoTrack
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <p className="text-xs text-gray-500">
                      {['CONFIRMED', 'PROCESSING', 'READY_FOR_SHIPMENT'].includes(orderDetails.status)
                        ? 'La commande est validée et prête à être envoyée vers le centre de tri EcoTrack.'
                        : 'Validez la commande (CONFIRMED) pour pouvoir générer le bordereau d\'expédition.'}
                    </p>

                    {['CONFIRMED', 'PROCESSING', 'READY_FOR_SHIPMENT'].includes(orderDetails.status) && (
                      <Button
                        size="sm"
                        onClick={() => handleCreateShipment(orderDetails.id)}
                        isLoading={createShipmentMutation.isPending}
                        className="bg-orange-600 hover:bg-orange-700 font-bold shrink-0 text-xs"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Générer Bordereau EcoTrack
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Internal Notes */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Notes Internes de Commande</label>
                <div className="flex gap-2">
                  <Input
                    value={internalNotesText}
                    onChange={(e) => setInternalNotesText(e.target.value)}
                    placeholder="Ex: Client joignable seulement l'après-midi"
                  />
                  <Button size="sm" onClick={handleSaveNotes} className="shrink-0">
                    Enregistrer Note
                  </Button>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-gray-100">
                <Button variant="ghost" onClick={() => setSelectedOrderId(null)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* State Transition Modal */}
      <Modal
        isOpen={isTransitionModalOpen}
        onClose={() => setIsTransitionModalOpen(false)}
        title="Changer le Statut de Commande (Machine à États)"
        size="md"
      >
        <form onSubmit={handleExecuteTransition} className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Nouveau Statut Cible *</label>
            <Select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as OrderStatus)}
            >
              <option value="CONFIRMED">CONFIRMED (Validée par téléphone)</option>
              <option value="PROCESSING">PROCESSING (En préparation au magasin)</option>
              <option value="READY_FOR_SHIPMENT">READY_FOR_SHIPMENT (Prête pour EcoTrack)</option>
              <option value="SHIPPED">SHIPPED (Expédiée / Pris en charge transporteur)</option>
              <option value="DELIVERED">DELIVERED (Livrée & Encaissée)</option>
              <option value="CANCELLED">CANCELLED (Annulée - Libérer le stock réservé)</option>
              <option value="RETURNED">RETURNED (Retournée - Réintégrer le stock)</option>
            </Select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Motif du Changement *</label>
            <Input
              value={transitionReason}
              onChange={(e) => setTransitionReason(e.target.value)}
              placeholder="Ex: Client a confirmé par appel téléphonique"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button variant="ghost" type="button" onClick={() => setIsTransitionModalOpen(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 font-bold"
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Transition...' : 'Confirmer Statut'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
