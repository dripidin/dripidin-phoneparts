'use client';

// Customers & B2B Wholesale Management View for HamzaPhone

import React, { useState } from 'react';
import {
  useB2CCustomers,
  useB2BAccounts,
  useReviewB2BAccount,
} from '@/lib/hooks/use-admin-queries';
import { formatDZD, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/card';
import type { B2BStatus } from '@/types/database.types';
import {
  Users,
  Briefcase,
  Search,
  CheckCircle,
  XCircle,
  FileText,
  Building,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

export function CustomersView({ initialTab = 'b2c' }: { initialTab?: 'b2c' | 'b2b' }) {
  const [activeTab, setActiveTab] = useState<'b2c' | 'b2b'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [b2bStatusFilter, setB2bStatusFilter] = useState<string>('');
  const [selectedB2B, setSelectedB2B] = useState<any | null>(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Approval Form
  const [tierCode, setTierCode] = useState('TIER_SILVER');
  const [creditLimit, setCreditLimit] = useState<number>(150000);
  const [approvalNotes, setApprovalNotes] = useState('Registre de Commerce et NIF vérifiés conformes');
  const [rejectionReason, setRejectionReason] = useState('Registre de Commerce illisible ou non valide');

  // React Query Hooks
  const { data: b2cData, isLoading: isB2cLoading } = useB2CCustomers({
    search: activeTab === 'b2c' && searchTerm ? searchTerm : undefined,
  });

  const { data: b2bAccounts = [], isLoading: isB2bLoading } = useB2BAccounts(
    (b2bStatusFilter as B2BStatus) || undefined
  );

  const reviewB2BMutation = useReviewB2BAccount();

  const b2cCustomers = b2cData?.customers || [];

  const handleOpenApprove = (biz: any) => {
    setSelectedB2B(biz);
    setTierCode('TIER_SILVER');
    setCreditLimit(150000);
    setApprovalModalOpen(true);
  };

  const handleOpenReject = (biz: any) => {
    setSelectedB2B(biz);
    setRejectionModalOpen(true);
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedB2B) return;

    try {
      await reviewB2BMutation.mutateAsync({
        businessId: selectedB2B.id,
        status: 'APPROVED',
        tierCode,
        creditLimitDzd: Number(creditLimit),
        paymentTerms: 'CASH_ON_DELIVERY',
        rejectionReason: approvalNotes,
        reviewerId: 'admin',
      });

      setApprovalModalOpen(false);
      setSelectedB2B(null);
      setActionSuccess(`Compte B2B "${selectedB2B.name}" validé avec succès.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedB2B) return;

    try {
      await reviewB2BMutation.mutateAsync({
        businessId: selectedB2B.id,
        status: 'REJECTED',
        tierCode: 'STANDARD',
        creditLimitDzd: 0,
        paymentTerms: 'PREPAID',
        rejectionReason,
        reviewerId: 'admin',
      });

      setRejectionModalOpen(false);
      setSelectedB2B(null);
      setActionSuccess(`Demande B2B "${selectedB2B.name}" rejetée.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Users className="w-5 h-5 text-orange-600" />
          Répertoire Clients & Réparateurs Professionnels (B2B)
        </h2>
        <p className="text-xs text-gray-500">
          Gestion des particuliers B2C et validation des ateliers de réparation / grossistes avec Registre de Commerce
        </p>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex border-b border-gray-200 gap-4">
        <button
          onClick={() => setActiveTab('b2c')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'b2c'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Particuliers B2C ({b2cCustomers.length})
        </button>

        <button
          onClick={() => setActiveTab('b2b')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'b2b'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Professionnels & Ateliers B2B ({b2bAccounts.length})
        </button>
      </div>

      {/* B2C Table */}
      {activeTab === 'b2c' ? (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-xs flex items-center max-w-sm">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Recherche client par nom, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs border-none focus:outline-hidden"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-3 py-3">Contact</th>
                  <th className="px-3 py-3">Wilaya</th>
                  <th className="px-3 py-3">Date d'Inscription</th>
                  <th className="px-3 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isB2cLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      Chargement des clients...
                    </td>
                  </tr>
                ) : b2cCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      Aucun client particulier enregistré.
                    </td>
                  </tr>
                ) : (
                  b2cCustomers.map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50/70">
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-900 block">{c.full_name || 'Sans nom'}</span>
                        <span className="text-[11px] text-gray-400 font-mono">{c.id}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-gray-800 block flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {c.email}
                        </span>
                        {c.phone && (
                          <span className="text-gray-500 font-mono text-[11px] flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {c.phone}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 font-medium text-gray-700">
                        {c.addresses?.[0]?.wilaya_name || 'Algérie'}
                      </td>
                      <td className="px-3 py-3 text-gray-500 font-mono">{formatDate(c.created_at)}</td>
                      <td className="px-3 py-3">
                        <Badge variant={c.is_active ? 'success' : 'default'} className="text-[10px]">
                          {c.is_active ? 'ACTIF' : 'INACTIF'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* B2B Table */
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-xs">
            <Select
              value={b2bStatusFilter}
              onChange={(e) => setB2bStatusFilter(e.target.value)}
              className="w-48 text-xs"
            >
              <option value="">Tous les états B2B</option>
              <option value="PENDING">En attente de validation</option>
              <option value="APPROVED">Validés & Actifs</option>
              <option value="REJECTED">Rejetés</option>
              <option value="SUSPENDED">Suspendus</option>
            </Select>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3">Entreprise & RC / NIF</th>
                  <th className="px-3 py-3">Wilaya</th>
                  <th className="px-3 py-3">Palier Tarifaire</th>
                  <th className="px-3 py-3">Plafond Crédit</th>
                  <th className="px-3 py-3">Statut Dossier</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isB2bLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      Chargement des comptes B2B...
                    </td>
                  </tr>
                ) : b2bAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      Aucun compte professionnel B2B trouvé.
                    </td>
                  </tr>
                ) : (
                  b2bAccounts.map((biz: any) => (
                    <tr key={biz.id} className="hover:bg-gray-50/70">
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-900 block flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-orange-600" />
                          {biz.name}
                        </span>
                        <span className="text-[11px] text-gray-500 font-mono mt-0.5 block">
                          RC: {biz.rc_number || 'N/A'} • NIF: {biz.nif || 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium text-gray-700">
                        {biz.wilaya_name} ({biz.commune_name})
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant="purple" className="text-[10px]">
                          {biz.tier_code || 'STANDARD'}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 font-bold font-mono text-gray-900">
                        {formatDZD(Number(biz.credit_limit_dzd) || 0)}
                      </td>
                      <td className="px-3 py-3">
                        <Badge
                          variant={
                            biz.status === 'APPROVED'
                              ? 'success'
                              : biz.status === 'PENDING'
                              ? 'warning'
                              : biz.status === 'SUSPENDED'
                              ? 'secondary'
                              : 'error'
                          }
                        >
                          {biz.status === 'PENDING' ? 'EN ATTENTE' : biz.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {biz.status === 'PENDING' ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleOpenApprove(biz)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-xs h-7 px-2 font-bold"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Valider
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenReject(biz)}
                                className="text-rose-600 hover:bg-rose-50 text-xs h-7 px-2"
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Rejeter
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenApprove(biz)}
                              className="text-xs h-7"
                            >
                              Gérer Palier
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

      {/* Approval Modal */}
      <Modal
        isOpen={approvalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        title={`Valider le Compte Pro B2B: ${selectedB2B?.name || ''}`}
        size="md"
      >
        <form onSubmit={handleApprove} className="space-y-3">
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs space-y-1">
            <p>
              <strong>Entreprise:</strong> {selectedB2B?.name}
            </p>
            <p>
              <strong>Registre de Commerce (RC):</strong> {selectedB2B?.rc_number || 'Non renseigné'}
            </p>
            <p>
              <strong>NIF:</strong> {selectedB2B?.nif || 'Non renseigné'}
            </p>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Palier Tarifaire Grossiste *</label>
            <Select value={tierCode} onChange={(e) => setTierCode(e.target.value)}>
              <option value="TIER_SILVER">Palier Argent (Atelier Standard - Remise ~15%)</option>
              <option value="TIER_GOLD">Palier Or (Grand Réparateur - Remise ~20%)</option>
              <option value="TIER_PLATINUM">Palier Platine (Grossiste Régional - Remise ~25%)</option>
            </Select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Plafond de Crédit Autorisé (DZD) *</label>
            <Input
              type="number"
              value={creditLimit}
              onChange={(e) => setCreditLimit(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Notes de Validation</label>
            <Input
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="ghost" type="button" onClick={() => setApprovalModalOpen(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              disabled={reviewB2BMutation.isPending}
            >
              {reviewB2BMutation.isPending ? 'Validation...' : 'Approuver le Compte'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        isOpen={rejectionModalOpen}
        onClose={() => setRejectionModalOpen(false)}
        title={`Rejeter la Demande B2B: ${selectedB2B?.name || ''}`}
        size="md"
      >
        <form onSubmit={handleReject} className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Motif de Rejet *</label>
            <Input
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ex: Registre de commerce invalide ou activité non conforme"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="ghost" type="button" onClick={() => setRejectionModalOpen(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              disabled={reviewB2BMutation.isPending}
            >
              {reviewB2BMutation.isPending ? 'Rejet...' : 'Confirmer le Rejet'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
