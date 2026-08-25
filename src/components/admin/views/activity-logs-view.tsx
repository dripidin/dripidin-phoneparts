'use client';

// Activity & Audit Logs View for HamzaPhone with JSON Diff Inspector

import React, { useState } from 'react';
import { useActivityLogs } from '@/lib/hooks/use-admin-queries';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/card';
import { History, Search, Eye, ShieldAlert, Code } from 'lucide-react';

export function ActivityLogsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const { data: logsData, isLoading } = useActivityLogs({
    entityType: entityFilter || undefined,
    actorEmail: searchTerm || undefined,
    page,
    pageSize,
  });

  const logs = logsData?.logs || [];
  const totalCount = logsData?.totalCount || 0;
  const totalPages = logsData?.totalPages || 1;

  // Reset page if it exceeds totalPages
  React.useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(1);
    }
  }, [totalPages, page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <History className="w-5 h-5 text-orange-600" />
          Journal d'Audit & Historique des Opérations Sensibles ({totalCount})
        </h2>
        <p className="text-xs text-gray-500">
          Traçabilité immuable: chaque modification de prix, stock, commande ou validation B2B est horodatée avec l'auteur
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-white rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par email de l'opérateur..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200"
            />
          </div>

          <Select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            className="w-48 text-xs"
          >
            <option value="">Tous types d'entités</option>
            <option value="PRODUCT">PRODUCT (Catalogue Pièces)</option>
            <option value="ORDER">ORDER (Commandes)</option>
            <option value="BUSINESS">BUSINESS (Comptes Pro B2B)</option>
            <option value="PRICE_HISTORY">PRICE_HISTORY (Tarifs)</option>
          </Select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 text-[11px] uppercase">
            <tr>
              <th className="px-3 py-3">Date & Heure</th>
              <th className="px-3 py-3">Opérateur (Acteur)</th>
              <th className="px-3 py-3">Rôle</th>
              <th className="px-3 py-3">Action Réalisée</th>
              <th className="px-3 py-3">Entité Cible</th>
              <th className="px-3 py-3 text-right">Détails Diff</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-mono">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-400 font-sans">
                  Chargement des logs d'audit...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-400 font-sans">
                  Aucun log d'audit trouvé.
                </td>
              </tr>
            ) : (
              logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50/70">
                  <td className="px-3 py-3 font-sans text-gray-600">{formatDate(log.created_at)}</td>
                  <td className="px-3 py-3 font-bold text-gray-900 font-sans">{log.actor_email}</td>
                  <td className="px-3 py-3 font-sans">
                    <Badge variant="outline" className="text-[10px]">
                      {log.actor_role || 'ADMIN'}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Badge
                      variant={
                        log.action.includes('DELETE') || log.action.includes('ARCHIVE')
                          ? 'error'
                          : log.action.includes('CREATE') || log.action.includes('APPROVE')
                          ? 'success'
                          : 'orange'
                      }
                      className="text-[10px]"
                    >
                      {log.action}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 font-sans text-gray-700">
                    <span className="font-semibold">{log.entity_type}</span>{' '}
                    <span className="text-gray-400 font-mono text-[11px]">({log.entity_id || 'N/A'})</span>
                  </td>
                  <td className="px-3 py-3 text-right font-sans">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                      className="text-xs h-7"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Diff JSON
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-sans">
          <span>{totalCount} entrées d'audit enregistrées</span>
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

      {/* JSON Diff Inspector Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`Inspection d'Audit: ${selectedLog?.action || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="font-bold text-gray-700 block mb-1">Détails Opérateur:</span>
              <p>
                <strong>Email:</strong> {selectedLog?.actor_email}
              </p>
              <p>
                <strong>Rôle:</strong> {selectedLog?.actor_role}
              </p>
              <p>
                <strong>Date:</strong> {selectedLog ? formatDate(selectedLog.created_at) : ''}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="font-bold text-gray-700 block mb-1">Cible:</span>
              <p>
                <strong>Entité:</strong> {selectedLog?.entity_type}
              </p>
              <p>
                <strong>ID Cible:</strong> {selectedLog?.entity_id || 'N/A'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-xs text-gray-800">
              <Code className="w-4 h-4 text-orange-600" />
              Différences Valeurs (Old vs New State)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono">
              <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-lg overflow-x-auto">
                <span className="font-bold text-rose-800 block mb-1">Valeurs Précédentes (Old)</span>
                <pre>{JSON.stringify(selectedLog?.old_values || {}, null, 2)}</pre>
              </div>

              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg overflow-x-auto">
                <span className="font-bold text-emerald-800 block mb-1">Nouvelles Valeurs (New)</span>
                <pre>{JSON.stringify(selectedLog?.new_values || {}, null, 2)}</pre>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setSelectedLog(null)}>
              Fermer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
