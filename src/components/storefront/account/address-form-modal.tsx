'use client';

// HamzaPhone Address Add / Edit Modal with 58 Algerian Wilayas

import React, { useState, useEffect } from 'react';
import { X, MapPin, Loader2, Save, AlertCircle } from 'lucide-react';
import { ALGERIA_WILAYAS } from '@/lib/utils';
import type { CustomerAddressSummary } from '@/lib/services/customer-account.service';
import type { AddressInput } from '@/lib/validation/account.schema';
import { useCustomerMutations } from '@/lib/hooks/use-customer-account';

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  addressToEdit?: CustomerAddressSummary | null;
}

export function AddressFormModal({
  isOpen,
  onClose,
  addressToEdit,
}: AddressFormModalProps) {
  const { saveAddress } = useCustomerMutations();

  const [formData, setFormData] = useState<AddressInput>({
    title: 'Mon Domicile',
    recipientName: '',
    recipientPhone: '',
    recipientPhoneSecondary: '',
    addressLine: '',
    wilayaCode: 16,
    wilayaName: 'Alger',
    communeName: '',
    postalCode: '',
    addressType: 'HOME',
    isDefault: false,
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (addressToEdit) {
      setFormData({
        title: addressToEdit.title,
        recipientName: addressToEdit.recipientName,
        recipientPhone: addressToEdit.recipientPhone,
        recipientPhoneSecondary: addressToEdit.recipientPhoneSecondary || '',
        addressLine: addressToEdit.addressLine,
        wilayaCode: addressToEdit.wilayaCode,
        wilayaName: addressToEdit.wilayaName,
        communeName: addressToEdit.communeName,
        postalCode: addressToEdit.postalCode || '',
        addressType: addressToEdit.addressType,
        isDefault: addressToEdit.isDefault,
      });
    } else {
      setFormData({
        title: 'Mon Domicile',
        recipientName: '',
        recipientPhone: '',
        recipientPhoneSecondary: '',
        addressLine: '',
        wilayaCode: 16,
        wilayaName: 'Alger',
        communeName: '',
        postalCode: '',
        addressType: 'HOME',
        isDefault: false,
      });
    }
  }, [addressToEdit, isOpen]);

  if (!isOpen) return null;

  const handleWilayaChange = (code: number) => {
    const selected = ALGERIA_WILAYAS.find((w) => w.code === code);
    setFormData({
      ...formData,
      wilayaCode: code,
      wilayaName: selected ? selected.name : 'Alger',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMsg(null);

      await saveAddress.mutateAsync({
        input: formData,
        addressId: addressToEdit?.id,
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Échec de l\'enregistrement de l\'adresse');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                <MapPin className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                {addressToEdit ? 'Modifier l\'adresse' : 'Ajouter une adresse'}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Title & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 block">Libellé *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Domicile, Atelier Belfort"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 block">Type de lieu *</label>
                <select
                  value={formData.addressType}
                  onChange={(e) => setFormData({ ...formData, addressType: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-orange-500"
                >
                  <option value="HOME">Domicile</option>
                  <option value="WORK">Bureau / Travail</option>
                  <option value="WORKSHOP">Atelier de Réparation</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>
            </div>

            {/* Recipient info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 block">Nom du destinataire *</label>
                <input
                  type="text"
                  required
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                  placeholder="Nom & Prénom"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 block">Téléphone mobile *</label>
                <input
                  type="tel"
                  required
                  value={formData.recipientPhone}
                  onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                  placeholder="0550 12 34 56"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Wilaya & Commune */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 block">Wilaya (58 Wilayas) *</label>
                <select
                  value={formData.wilayaCode}
                  onChange={(e) => handleWilayaChange(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-orange-500"
                >
                  {ALGERIA_WILAYAS.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.code.toString().padStart(2, '0')} - {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 block">Commune *</label>
                <input
                  type="text"
                  required
                  value={formData.communeName}
                  onChange={(e) => setFormData({ ...formData, communeName: e.target.value })}
                  placeholder="Kouba, Belfort, Bab Ezzouar..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Detailed Address Line */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700 block">Adresse complète (Rue, Quartier, N° Bâtiment) *</label>
              <textarea
                required
                rows={2}
                value={formData.addressLine}
                onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                placeholder="Ex: Cité 500 Logements, Bâtiment B, Porte 12"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            {/* Default Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="default-address"
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 border-gray-300"
              />
              <label htmlFor="default-address" className="text-xs text-gray-700 font-semibold cursor-pointer">
                Définir comme adresse principale de livraison
              </label>
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={saveAddress.isPending}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {saveAddress.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Enregistrer l&apos;adresse</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}
