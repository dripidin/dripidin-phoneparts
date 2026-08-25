'use client';

// HamzaPhone Checkout - Shipping Address Step
// Supports Saved Address Selection for Authenticated Users & 58 Algerian Wilayas

import React, { useState } from 'react';
import { MapPin, Plus, CheckCircle2, Home, Building2, Wrench } from 'lucide-react';
import { ALGERIA_WILAYAS } from '@/lib/utils';
import type { CustomerAddressSummary } from '@/lib/services/customer-account.service';

interface ShippingStepProps {
  savedAddresses?: CustomerAddressSummary[];
  selectedAddressId: string | null;
  setSelectedAddressId: (id: string | null) => void;
  
  // Custom/Manual Address fields
  shippingAddressLine: string;
  setShippingAddressLine: (line: string) => void;
  wilayaCode: number;
  setWilayaCode: (code: number) => void;
  wilayaName: string;
  setWilayaName: (name: string) => void;
  communeName: string;
  setCommuneName: (commune: string) => void;
  customerNotes: string;
  setCustomerNotes: (notes: string) => void;
}

export function ShippingStep({
  savedAddresses = [],
  selectedAddressId,
  setSelectedAddressId,
  shippingAddressLine,
  setShippingAddressLine,
  wilayaCode,
  setWilayaCode,
  wilayaName,
  setWilayaName,
  communeName,
  setCommuneName,
  customerNotes,
  setCustomerNotes,
}: ShippingStepProps) {
  const [useNewAddress, setUseNewAddress] = useState(savedAddresses.length === 0);

  const handleWilayaChange = (code: number) => {
    setWilayaCode(code);
    const found = ALGERIA_WILAYAS.find((w: { code: number; name: string }) => w.code === code);
    if (found) {
      setWilayaName(found.name);
    }
  };

  const handleSelectSavedAddress = (addr: CustomerAddressSummary) => {
    setSelectedAddressId(addr.id);
    setUseNewAddress(false);
    setShippingAddressLine(addr.addressLine);
    setWilayaCode(addr.wilayaCode);
    setWilayaName(addr.wilayaName);
    setCommuneName(addr.communeName);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-7 shadow-xs space-y-5">
      
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
            2
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900 text-sm sm:text-base">
              Adresse de Livraison (Algérie)
            </h3>
            <p className="text-xs text-gray-500">
              Couverture nationale dans les 58 Wilayas.
            </p>
          </div>
        </div>
      </div>

      {/* Saved Addresses Picker (if user is authenticated and has addresses) */}
      {savedAddresses.length > 0 && (
        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-700">
            Choisir une adresse enregistrée :
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {savedAddresses.map((addr) => {
              const isSelected = !useNewAddress && selectedAddressId === addr.id;

              return (
                <div
                  key={addr.id}
                  onClick={() => handleSelectSavedAddress(addr)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/40 shadow-xs ring-2 ring-orange-500/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900">
                      {addr.addressType === 'HOME' && <Home className="w-3.5 h-3.5 text-orange-500" />}
                      {addr.addressType === 'WORK' && <Building2 className="w-3.5 h-3.5 text-blue-500" />}
                      {addr.addressType === 'WORKSHOP' && <Wrench className="w-3.5 h-3.5 text-purple-500" />}
                      <span>{addr.recipientName}</span>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
                    )}
                  </div>

                  <p className="text-xs text-gray-600 mt-1 line-clamp-1">{addr.addressLine}</p>
                  <p className="text-[11px] text-gray-400 font-medium">
                    {addr.communeName}, {addr.wilayaCode.toString().padStart(2, '0')} - {addr.wilayaName}
                  </p>
                  <p className="text-[11px] text-gray-500 font-mono mt-1">{addr.recipientPhone}</p>
                </div>
              );
            })}

            {/* Option to use a new address */}
            <div
              onClick={() => {
                setUseNewAddress(true);
                setSelectedAddressId(null);
              }}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-bold ${
                useNewAddress
                  ? 'border-orange-500 bg-orange-50/40 text-orange-600 ring-2 ring-orange-500/20'
                  : 'border-dashed border-gray-300 hover:border-orange-400 text-gray-500 hover:text-orange-600 bg-gray-50/50'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Utiliser une autre adresse</span>
            </div>
          </div>
        </div>
      )}

      {/* Manual / New Address Form */}
      {(useNewAddress || savedAddresses.length === 0) && (
        <div className="space-y-4 pt-2">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Wilaya Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                <span>Wilaya de destination *</span>
              </label>
              <select
                required
                value={wilayaCode}
                onChange={(e) => handleWilayaChange(Number(e.target.value))}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                {ALGERIA_WILAYAS.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.code.toString().padStart(2, '0')} - {w.name} ({w.code === 16 ? '400 DZD' : '600 DZD'})
                  </option>
                ))}
              </select>
            </div>

            {/* Commune */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                Commune / Ville *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Bab Ezzouar, Kouba, Es Senia..."
                value={communeName}
                onChange={(e) => setCommuneName(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            {/* Detailed Address */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-gray-700">
                Adresse exacte / Rue / Quartier / Repère *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Cité 500 Logements, Bâtiment B3, en face de la mosquée"
                value={shippingAddressLine}
                onChange={(e) => setShippingAddressLine(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

          </div>

        </div>
      )}

      {/* Customer Notes / Delivery Instructions */}
      <div className="space-y-1.5 pt-2 border-t border-gray-100">
        <label className="text-xs font-bold text-gray-700">
          Instructions pour le livreur (Optionnel)
        </label>
        <textarea
          rows={2}
          placeholder="Ex: Appeler 30 minutes avant l'arrivée, livrer l'après-midi..."
          value={customerNotes}
          onChange={(e) => setCustomerNotes(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        />
      </div>

    </div>
  );
}
