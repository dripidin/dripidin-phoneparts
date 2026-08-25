'use client';

// HamzaPhone Saved Address Card Component

import React from 'react';
import { 
  Home, 
  Briefcase, 
  Wrench, 
  MapPin, 
  CheckCircle2, 
  Phone, 
  User, 
  Edit3, 
  Trash2, 
  Star 
} from 'lucide-react';
import type { CustomerAddressSummary } from '@/lib/services/customer-account.service';
import { useCustomerMutations } from '@/lib/hooks/use-customer-account';

interface AddressCardProps {
  address: CustomerAddressSummary;
  onEdit: (address: CustomerAddressSummary) => void;
}

const TYPE_ICONS: Record<string, any> = {
  HOME: Home,
  WORK: Briefcase,
  WORKSHOP: Wrench,
  OTHER: MapPin,
};

const TYPE_LABELS: Record<string, string> = {
  HOME: 'Domicile',
  WORK: 'Bureau / Travail',
  WORKSHOP: 'Atelier de Réparation',
  OTHER: 'Autre Adresse',
};

export function AddressCard({ address, onEdit }: AddressCardProps) {
  const { deleteAddress, setDefaultAddress } = useCustomerMutations();
  const Icon = TYPE_ICONS[address.addressType] || MapPin;

  return (
    <div className={`relative bg-white rounded-3xl border p-5 sm:p-6 transition-all space-y-4 flex flex-col justify-between ${
      address.isDefault
        ? 'border-orange-500/50 shadow-md ring-2 ring-orange-500/10'
        : 'border-gray-200/80 hover:border-gray-300 shadow-2xs'
    }`}>
      
      {/* Top Header & Badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
            address.isDefault ? 'bg-orange-50 text-orange-600' : 'bg-gray-100 text-gray-600'
          }`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 leading-snug">
              {address.title}
            </h3>
            <span className="text-[11px] text-gray-400 font-medium">
              {TYPE_LABELS[address.addressType] || address.addressType}
            </span>
          </div>
        </div>

        {address.isDefault && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 text-[11px] font-bold shrink-0">
            <Star className="w-3 h-3 fill-orange-500" />
            <span>Par défaut</span>
          </span>
        )}
      </div>

      {/* Recipient & Address Details */}
      <div className="space-y-2 text-xs text-gray-600">
        <div className="flex items-center gap-2 text-gray-800 font-semibold">
          <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span>{address.recipientName}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span>{address.recipientPhone} {address.recipientPhoneSecondary ? `• ${address.recipientPhoneSecondary}` : ''}</span>
        </div>

        <div className="flex items-start gap-2 text-gray-600 pt-1">
          <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="leading-relaxed font-medium">{address.addressLine}</p>
            <p className="text-gray-900 font-bold">
              {address.communeName}, {address.wilayaCode.toString().padStart(2, '0')} - {address.wilayaName}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
        {!address.isDefault ? (
          <button
            onClick={() => setDefaultAddress.mutate(address.id)}
            disabled={setDefaultAddress.isPending}
            className="text-xs font-bold text-gray-500 hover:text-orange-600 transition-colors"
          >
            Définir par défaut
          </button>
        ) : (
          <span className="text-[11px] text-gray-400 font-medium">Adresse principale de livraison</span>
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(address)}
            className="p-2 rounded-xl text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"
            title="Modifier l'adresse"
            aria-label="Modifier l'adresse"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (window.confirm('Voulez-vous vraiment supprimer cette adresse ?')) {
                deleteAddress.mutate(address.id);
              }
            }}
            disabled={deleteAddress.isPending}
            className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Supprimer l'adresse"
            aria-label="Supprimer l'adresse"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
