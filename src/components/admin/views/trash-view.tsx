'use client';

// Trash and Archival Retention View for HamzaPhone

import React, { useState } from 'react';
import { useProducts, useRestoreProduct } from '@/lib/hooks/use-admin-queries';
import { Button } from '@/components/ui/button';
import { Trash2, RotateCcw, CheckCircle2 } from 'lucide-react';
import { formatDZD } from '@/lib/utils';

export function TrashView() {
  const { data: productsData, isLoading } = useProducts({
    status: 'ARCHIVED',
    pageSize: 50,
  });

  const restoreMutation = useRestoreProduct();
  const [msg, setMsg] = useState<string | null>(null);

  const trashItems = productsData?.products || [];

  const handleRestore = async (id: string, name: string) => {
    try {
      await restoreMutation.mutateAsync(id);
      setMsg(`Pièce "${name}" restaurée avec succès vers le catalogue actif.`);
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-red-600" />
          Corbeille & Rétention des Archives ({trashItems.length})
        </h2>
        <p className="text-xs text-gray-500">
          Les articles supprimés restent archivés et peuvent être restaurés en 1 clic vers le catalogue actif
        </p>
      </div>

      {msg && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 text-[11px] uppercase">
              <tr>
                <th className="px-3 py-3">Produit Archivé</th>
                <th className="px-3 py-3">SKU</th>
                <th className="px-3 py-3">Marque / Catégorie</th>
                <th className="px-3 py-3">Dernier Prix B2C</th>
                <th className="px-3 py-3">Stock Physique</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Chargement des archives...
                  </td>
                </tr>
              ) : trashItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    La corbeille est vide. Aucun article supprimé récemment.
                  </td>
                </tr>
              ) : (
                trashItems.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50/70">
                    <td className="px-3 py-3 font-bold text-gray-900">{p.name}</td>
                    <td className="px-3 py-3 font-mono text-gray-500">{p.sku}</td>
                    <td className="px-3 py-3 text-gray-600">
                      {p.brands?.name || 'Marque'} / {p.categories?.name || 'Catégorie'}
                    </td>
                    <td className="px-3 py-3 font-mono font-semibold text-gray-900">
                      {formatDZD(p.product_prices?.[0]?.b2c_price_dzd || 0)}
                    </td>
                    <td className="px-3 py-3 font-semibold text-gray-700">
                      {p.stock_quantity || 0} unités
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestore(p.id, p.name)}
                        className="text-xs h-7 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                        disabled={restoreMutation.isPending}
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        Restaurer
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
