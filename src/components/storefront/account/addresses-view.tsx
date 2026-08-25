'use client';

// HamzaPhone Client Addresses Manager

import React, { useState } from 'react';
import { Plus, MapPin } from 'lucide-react';
import type { CustomerAddressSummary } from '@/lib/services/customer-account.service';
import { AddressCard } from './address-card';
import { AddressFormModal } from './address-form-modal';
import { useCustomerAddresses } from '@/lib/hooks/use-customer-account';

interface AddressesViewProps {
  initialAddresses: CustomerAddressSummary[];
}

export function AddressesView({ initialAddresses }: AddressesViewProps) {
  const { data: addresses = initialAddresses } = useCustomerAddresses();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<CustomerAddressSummary | null>(null);

  const handleOpenAdd = () => {
    setAddressToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addr: CustomerAddressSummary) => {
    setAddressToEdit(addr);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900">
            Carnet d&apos;Adresses de Livraison
          </h2>
          <p className="text-xs text-gray-500">
            Enregistrez vos adresses personnelles et professionnelles dans les 58 Wilayas.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-md active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une adresse</span>
        </button>
      </div>

      {/* Address Cards Grid */}
      {addresses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-8 sm:p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
            <MapPin className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-900">Aucune adresse enregistrée</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Ajoutez votre adresse principale pour accélérer vos prochaines commandes.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter ma première adresse</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              onEdit={handleOpenEdit}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AddressFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        addressToEdit={addressToEdit}
      />

    </div>
  );
}
