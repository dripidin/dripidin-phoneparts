'use client';

// Inventory & Warehouse Management View for HamzaPhone

import React, { useState } from 'react';
import {
  useInventory,
  useInventoryHistory,
  useAdjustInventory,
} from '@/lib/hooks/use-admin-queries';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import type { InventoryTransactionType } from '@/types/database.types';
import {
  Boxes,
  ArrowDownUp,
  AlertTriangle,
  Plus,
  History,
  CheckCircle2,
  Search,
} from 'lucide-react';

export function InventoryView() {
  const [activeTab, setActiveTab] = useState<'stock' | 'transactions'>('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustType, setAdjustType] = useState<InventoryTransactionType>('MANUAL_ADJUSTMENT');
  const [quantityDelta, setQuantityDelta] = useState<number>(5);
  const [warehouseBin, setWarehouseBin] = useState('Casier A-04');
  const [notes, setNotes] = useState('Comptage physique trimestriel');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // React Query Hooks
  const { data: inventoryData, isLoading } = useInventory({
    search: searchTerm || undefined,
    lowStockOnly,
    page,
    pageSize,
  });

  const { data: historyData, isLoading: isHistoryLoading } = useInventoryHistory(
    selectedProductId || undefined
  );

  const adjustMutation = useAdjustInventory();

  const items = inventoryData?.items || [];
  const totalCount = inventoryData?.totalCount || 0;
  const totalPages = inventoryData?.totalPages || 1;
  const transactions = historyData?.data || [];

  const handleOpenAdjust = (prodId?: string) => {
    setSelectedProductId(prodId || items[0]?.id || '');
    setErrorMsg(null);
    setIsAdjustModalOpen(true);
  };

  const handleApplyAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await adjustMutation.mutateAsync({
        productId: selectedProductId,
        transactionType: adjustType,
        quantityChange: Number(quantityDelta),
        notes,
        warehouseBin,
      });

      setIsAdjustModalOpen(false);
      setSuccessMsg('Mouvement de stock enregistré avec succès dans le grand livre.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de l’ajustement de stock.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-5 h-5 text-orange-600" />
            Gestion des Stocks & Entrepôt
          </h2>
          <p className="text-xs text-gray-500">
            Suivi temps réel du stock physique, stock réservé aux commandes en cours et grand livre des transactions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => handleOpenAdjust()} size="sm" className="bg-orange-600 hover:bg-orange-700 font-bold">
            <Plus className="w-4 h-4" />
            Ajustement de Stock
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-4">
        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'stock'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Niveaux de Stocks Disponibles
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'transactions'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Grand Livre des Mouvements (Double-Entrée)
        </button>
      </div>

      {activeTab === 'stock' ? (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Recherche par SKU ou nom..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-200"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => {
                  setLowStockOnly(e.target.checked);
                  setPage(1);
                }}
                className="rounded text-orange-600"
              />
              <span>Stock critique seulement</span>
            </label>
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3">Produit</th>
                  <th className="px-3 py-3">Stock Physique</th>
                  <th className="px-3 py-3">Réservé</th>
                  <th className="px-3 py-3">Disponible</th>
                  <th className="px-3 py-3">Seuil Alerte</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      Chargement des niveaux de stocks...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      Aucun article trouvé.
                    </td>
                  </tr>
                ) : (
                  items.map((p: any) => {
                    const available = (p.stock_quantity || 0) - (p.reserved_stock || 0);
                    const isLow = available <= (p.low_stock_threshold || 5);
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/70">
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-900 line-clamp-1">{p.name}</p>
                          <span className="font-mono text-[11px] text-gray-400">SKU: {p.sku}</span>
                        </td>
                        <td className="px-3 py-3 font-semibold text-gray-900">{p.stock_quantity || 0}</td>
                        <td className="px-3 py-3 font-semibold text-blue-600">{p.reserved_stock || 0}</td>
                        <td className="px-3 py-3">
                          <Badge
                            variant={available <= 0 ? 'error' : isLow ? 'warning' : 'success'}
                          >
                            {available} unités
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-gray-500">{p.low_stock_threshold || 5}</td>
                        <td className="px-3 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenAdjust(p.id)}
                            className="text-xs"
                          >
                            Ajuster
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>{totalCount} articles au total</span>
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
                  {page} / {totalPages}
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
        </div>
      ) : (
        /* Transactions Ledger Table */
        <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-4 py-3">Date & Heure</th>
                <th className="px-3 py-3">Type Transaction</th>
                <th className="px-3 py-3">Quantité Δ</th>
                <th className="px-3 py-3">Stock Avant → Après</th>
                <th className="px-3 py-3">Casier / Motif</th>
                <th className="px-3 py-3">Réf / Auteur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isHistoryLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Chargement du journal de transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Aucun mouvement de stock enregistré.
                  </td>
                </tr>
              ) : (
                transactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-gray-50/70 font-mono">
                    <td className="px-4 py-3 font-sans text-gray-700">{formatDate(tx.created_at)}</td>
                    <td className="px-3 py-3">
                      <Badge variant="outline" className="text-[10px]">
                        {tx.transaction_type}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 font-bold text-gray-900">
                      {tx.quantity_change > 0 ? `+${tx.quantity_change}` : tx.quantity_change}
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      {tx.previous_stock} → {tx.new_stock}
                    </td>
                    <td className="px-3 py-3 font-sans text-gray-700">
                      <span className="font-semibold block">{tx.warehouse_bin || 'Entrepôt Central'}</span>
                      <span className="text-[11px] text-gray-400">{tx.notes || '-'}</span>
                    </td>
                    <td className="px-3 py-3 font-sans text-gray-500">
                      {tx.reference_id ? `Réf: ${tx.reference_id}` : tx.profiles?.email || 'Système'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Stock Adjustment Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Ajustement Manuel de Stock (Grand Livre)"
        size="md"
      >
        <form onSubmit={handleApplyAdjustment} className="space-y-3">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Pièce Détachée *</label>
            <Select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              {items.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) - {p.stock_quantity || 0} en stock
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Type de Mouvement *</label>
            <Select
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value as InventoryTransactionType)}
            >
              <option value="MANUAL_ADJUSTMENT">Ajustement Manuel (Inventaire Physique)</option>
              <option value="RECEIVING">Réception Fournisseur (Arrivage)</option>
              <option value="DAMAGED_WRITEOFF">Perte / Pièce Défectueuse (Sortie)</option>
              <option value="SUPPLIER_RETURN">Retour Fournisseur (Sortie)</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Quantité (+ / -) *</label>
              <Input
                type="number"
                value={quantityDelta}
                onChange={(e) => setQuantityDelta(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Emplacement / Casier</label>
              <Input
                value={warehouseBin}
                onChange={(e) => setWarehouseBin(e.target.value)}
                placeholder="Casier A-01"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Motif / Justification *</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Comptage physique, pièce cassée lors du test"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button variant="ghost" type="button" onClick={() => setIsAdjustModalOpen(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 font-bold"
              disabled={adjustMutation.isPending}
            >
              {adjustMutation.isPending ? 'Enregistrement...' : 'Enregistrer Mouvement'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
