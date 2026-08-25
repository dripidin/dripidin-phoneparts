'use client';

// Suppliers Management View for HamzaPhone

import React, { useState } from 'react';
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
} from '@/lib/hooks/use-admin-queries';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/card';
import { Truck, Plus, Phone, Mail, Clock, CheckCircle2, Edit2 } from 'lucide-react';

export function SuppliersView() {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const createSupplierMutation = useCreateSupplier();
  const updateSupplierMutation = useUpdateSupplier();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Chine');
  const [currency, setCurrency] = useState('USD');
  const [leadTimeDays, setLeadTimeDays] = useState(14);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingId(null);
    setCode(`SUP-${Date.now().toString().slice(-4)}`);
    setName('');
    setContactName('');
    setEmail('');
    setPhone('');
    setCountry('Chine');
    setCurrency('USD');
    setLeadTimeDays(14);
    setIsModalOpen(true);
  };

  const openEditModal = (s: any) => {
    setEditingId(s.id);
    setCode(s.code);
    setName(s.name);
    setContactName(s.contact_name || '');
    setEmail(s.email || '');
    setPhone(s.phone || '');
    setCountry(s.country || 'Chine');
    setCurrency(s.currency || 'USD');
    setLeadTimeDays(s.lead_time_days || 14);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    try {
      if (editingId) {
        await updateSupplierMutation.mutateAsync({
          id: editingId,
          data: { name, contactName, email, phone, country, currency, leadTimeDays },
        });
        setActionSuccess('Fournisseur mis à jour avec succès.');
      } else {
        await createSupplierMutation.mutateAsync({
          code,
          name,
          contactName,
          email,
          phone,
          country,
          currency,
          leadTimeDays,
        });
        setActionSuccess('Fournisseur ajouté au répertoire.');
      }
      setIsModalOpen(false);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-orange-600" />
            Fournisseurs & Import Direct ({suppliers.length})
          </h2>
          <p className="text-xs text-gray-500">
            Usines Shenzhen, Guangzhou, importateurs locaux et conversion des devises USD/DZD
          </p>
        </div>

        <Button onClick={openCreateModal} size="sm" className="bg-orange-600 hover:bg-orange-700 font-bold">
          <Plus className="w-3.5 h-3.5" />
          Nouveau Fournisseur
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-8 text-center text-xs text-gray-400">
            Chargement des fournisseurs...
          </div>
        ) : suppliers.length === 0 ? (
          <div className="col-span-full py-8 text-center text-xs text-gray-400">
            Aucun fournisseur enregistré.
          </div>
        ) : (
          suppliers.map((s: any) => (
            <div key={s.id} className="p-5 bg-white rounded-xl border border-gray-200 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-gray-900">{s.name}</h3>
                  <span className="font-mono text-[11px] text-gray-400 block">{s.code}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant={s.country === 'Algérie' ? 'success' : 'secondary'} className="text-[10px]">
                    {s.country}
                  </Badge>
                  <button
                    onClick={() => openEditModal(s)}
                    className="p-1 text-gray-400 hover:text-orange-600"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-gray-600 border-t border-gray-100 pt-3">
                {s.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{s.phone} {s.contact_name ? `(${s.contact_name})` : ''}</span>
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span>{s.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>Délai moyen: <strong>{s.lead_time_days || 14} jours</strong></span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500">Devise de transaction:</span>
                <span className="font-bold text-gray-800 font-mono">{s.currency || 'USD'}</span>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Catalogue actif
                </span>
                <span className="text-gray-400 font-mono">Dernière synchro: Récente</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Modifier Fournisseur' : 'Nouveau Fournisseur'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Code Fournisseur *</label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="SUP-01" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Nom Entreprise *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Shenzhen Tech Co." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Personne Contact</label>
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Li Wei" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Pays</label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Chine / Algérie" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@supplier.com" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Téléphone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+86 755..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Devise Principale</label>
              <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="USD">USD ($)</option>
                <option value="DZD">DZD (Dinars)</option>
                <option value="EUR">EUR (€)</option>
                <option value="CNY">CNY (¥)</option>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Délai d'Acheminement (Jours)</label>
              <Input
                type="number"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700 font-bold">
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
