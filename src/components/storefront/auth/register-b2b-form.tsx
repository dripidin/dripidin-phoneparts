'use client';

// HamzaPhone B2B Wholesale / Repair Workshop Registration Form

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  MapPin, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { registerB2BAction } from '@/lib/actions/auth.actions';
import { ALGERIA_WILAYAS } from '@/lib/utils';

export function RegisterB2BForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('next') || '/account/business';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    tradeName: '',
    rcNumber: '',
    nif: '',
    nis: '',
    articleImposition: '',
    wilayaCode: 16,
    wilayaName: 'Alger',
    communeName: '',
    addressLine: '',
    estimatedMonthlyVolumeDzd: '50k-200k',
    password: '',
    passwordConfirmation: '',
    acceptTerms: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.companyName || !formData.rcNumber || !formData.communeName || !formData.addressLine || !formData.password) {
      setErrorMsg('Veuillez renseigner tous les champs obligatoires');
      return;
    }

    if (formData.password !== formData.passwordConfirmation) {
      setErrorMsg('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);

      const res = await registerB2BAction(formData);
      if (!res.success) {
        setErrorMsg(res.error || 'Erreur lors de l\'inscription B2B');
        setIsLoading(false);
        return;
      }

      // Successful B2B registration redirect
      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur inattendue');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* B2B Notice Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-200 text-xs text-orange-950 space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-orange-800">
          <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
          <span>Programme Grossiste & Ateliers de Réparation</span>
        </div>
        <p className="text-orange-900 leading-relaxed text-[11px]">
          Après soumission, votre dossier sera vérifié par notre équipe sous 24h à 48h pour activer vos tarifs grossiste dégressifs et conditions prioritaires.
        </p>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200 flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* 1. Informations du représentant */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-orange-500" />
            <span>Représentant / Gérant de l&apos;atelier</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700 block">Prénom du gérant *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Mourad"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700 block">Nom du gérant *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Touati"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700 block">Email professionnel *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@techmobile-oran.dz"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700 block">Téléphone mobile (Algérie) *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0550 12 34 56"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* 2. Informations de l'Entreprise / Atelier */}
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-orange-500" />
            <span>Entreprise & Registre Commercial</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700 block">Raison Sociale / Nom Atelier *</label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="SARL Tech Mobile Oran"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700 block">Nom Commercial / Enseigne</label>
              <input
                type="text"
                value={formData.tradeName}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                placeholder="Phone Fix 31"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700 block">N° RC (Registre de Commerce) *</label>
              <input
                type="text"
                required
                value={formData.rcNumber}
                onChange={(e) => setFormData({ ...formData, rcNumber: e.target.value })}
                placeholder="31/00-1234567B22"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 font-mono focus:bg-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700 block">NIF (Identifiant Fiscal)</label>
              <input
                type="text"
                value={formData.nif}
                onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                placeholder="002231012345678"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 font-mono focus:bg-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700 block">Article d&apos;imposition</label>
              <input
                type="text"
                value={formData.articleImposition}
                onChange={(e) => setFormData({ ...formData, articleImposition: e.target.value })}
                placeholder="31011234567"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 font-mono focus:bg-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* 3. Adresse de l'Atelier */}
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-orange-500" />
            <span>Localisation de l&apos;Atelier / Magasin</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700 block">Wilaya *</label>
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
                placeholder="Oran Centre / Belfort"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-700 block">Adresse exacte *</label>
            <input
              type="text"
              required
              value={formData.addressLine}
              onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
              placeholder="12 Boulevard de la République, Atelier N°4"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* 4. Volume & Mot de passe */}
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700 block">Volume d&apos;achat mensuel estimé</label>
              <select
                value={formData.estimatedMonthlyVolumeDzd}
                onChange={(e) => setFormData({ ...formData, estimatedMonthlyVolumeDzd: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-orange-500"
              >
                <option value="<50k">&lt; 50 000 DZD / mois</option>
                <option value="50k-200k">50 000 – 200 000 DZD / mois</option>
                <option value=">200k">&gt; 200 000 DZD / mois (Grand Compte)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700 block">Mot de passe *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min 8 caractères"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-700 block">Confirmer mot de passe *</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.passwordConfirmation}
              onChange={(e) => setFormData({ ...formData, passwordConfirmation: e.target.value })}
              placeholder="Confirmez votre mot de passe"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Accept terms */}
        <div className="flex items-center gap-2 pt-1">
          <input
            id="accept-b2b-terms"
            type="checkbox"
            checked={formData.acceptTerms}
            onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
            className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 border-gray-300"
          />
          <label htmlFor="accept-b2b-terms" className="text-xs text-gray-600 cursor-pointer">
            J&apos;accepte les <span className="text-orange-600 font-bold">Conditions Générales B2B Grossiste</span>
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || !formData.acceptTerms}
          className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/25 active:scale-95 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Soumission du dossier B2B...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Créer mon Compte Grossiste B2B</span>
            </>
          )}
        </button>

      </form>

    </div>
  );
}
