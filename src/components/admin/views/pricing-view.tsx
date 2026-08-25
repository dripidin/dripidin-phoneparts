'use client';

// Dedicated Pricing and Bulk Percentage Price Adjustment Center for HamzaPhone

import React, { useState } from 'react';
import {
  useBrands,
  useCategories,
  useSuppliers,
  useApplyBulkPriceAdjustment,
} from '@/lib/hooks/use-admin-queries';
import { previewBulkPriceAdjustmentAdmin } from '@/lib/actions/pricing.actions';
import { formatDZD } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/card';
import type { BulkPricePreviewItem } from '@/types/domain.types';
import {
  Percent,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export function PricingView() {
  const [scope, setScope] = useState<'ALL' | 'BRAND' | 'CATEGORY'>('ALL');
  const [scopeTargetId, setScopeTargetId] = useState('');
  const [targetField, setTargetField] = useState<'B2C_PRICE' | 'B2B_PRICE' | 'BOTH'>('B2B_PRICE');
  const [percentageChange, setPercentageChange] = useState<number>(5);
  const [roundingUnitDzd, setRoundingUnitDzd] = useState<10 | 50 | 100>(10);
  const [justification, setJustification] = useState('Ajustement trimestriel suite aux variations de change');
  const [allowBelowCostOverride, setAllowBelowCostOverride] = useState(false);

  // Preview and Apply State
  const [previewItems, setPreviewItems] = useState<BulkPricePreviewItem[] | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: brands = [] } = useBrands();
  const { data: categories = [] } = useCategories();
  const applyBulkMutation = useApplyBulkPriceAdjustment();

  const handleComputePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsCalculating(true);

    try {
      const payload: any = {
        scope,
        targetField,
        percentageChange: Number(percentageChange),
        roundingUnitDzd,
        justification,
        allowBelowCostOverride,
      };

      if (scope === 'CATEGORY') payload.targetCategoryId = scopeTargetId;
      if (scope === 'BRAND') payload.targetBrandId = scopeTargetId;

      const result = await previewBulkPriceAdjustmentAdmin(payload);
      if (result.preview.length === 0) {
        setErrorMessage('Aucun produit trouvé dans le périmètre sélectionné.');
      } else {
        setPreviewItems(result.preview);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors du calcul de prévisualisation');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleApplyAdjustment = async () => {
    try {
      const payload: any = {
        scope,
        targetField,
        percentageChange: Number(percentageChange),
        roundingUnitDzd,
        justification,
        allowBelowCostOverride,
      };

      if (scope === 'CATEGORY') payload.targetCategoryId = scopeTargetId;
      if (scope === 'BRAND') payload.targetBrandId = scopeTargetId;

      const result = await applyBulkMutation.mutateAsync(payload);
      setIsConfirmOpen(false);
      setPreviewItems(null);
      setSuccessMessage(`Succès: ${result.appliedCount} références mises à jour avec succès et consignées dans le journal d'audit.`);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const hasWarnings = previewItems?.some((it) => it.isBelowCostWarning) ?? false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Percent className="w-5 h-5 text-orange-600" />
          Centre de Tarification & Ajustements en Masse
        </h2>
        <p className="text-xs text-gray-500">
          Ajustement des tarifs B2C et B2B par pourcentage avec arrondi en Dinar Algérien (DZD) et protection des marges
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Bulk Pricing Configuration Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-orange-600" />
          Étape 1: Configurer l'Ajustement Tarifaire
        </h3>

        <form onSubmit={handleComputePreview} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Scope Selection */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Périmètre d'Application *</label>
              <Select value={scope} onChange={(e) => setScope(e.target.value as any)}>
                <option value="ALL">Tout le Catalogue Actif</option>
                <option value="CATEGORY">Par Catégorie de Pièce</option>
                <option value="BRAND">Par Marque Téléphone</option>
              </Select>
            </div>

            {/* Scope Target Filter */}
            {scope !== 'ALL' && (
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  {scope === 'CATEGORY' ? 'Choisir la Catégorie *' : 'Choisir la Marque *'}
                </label>
                <Select value={scopeTargetId} onChange={(e) => setScopeTargetId(e.target.value)}>
                  <option value="">Sélectionner...</option>
                  {scope === 'CATEGORY'
                    ? categories.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))
                    : brands.map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                </Select>
              </div>
            )}

            {/* Target Field */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Tarif Cible *</label>
              <Select value={targetField} onChange={(e) => setTargetField(e.target.value as any)}>
                <option value="B2B_PRICE">Prix Grossiste B2B Seul</option>
                <option value="B2C_PRICE">Prix Public B2C Seul</option>
                <option value="BOTH">B2C + B2B Simultanément</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Percentage Change */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                Pourcentage de Variation (%) *
              </label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.5"
                  value={percentageChange}
                  onChange={(e) => setPercentageChange(Number(e.target.value))}
                  placeholder="Ex: +5 ou -10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">%</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 block">
                Entrez une valeur positive pour augmenter, négative pour baisser.
              </span>
            </div>

            {/* DZD Rounding */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Arrondi Commercial (DZD) *</label>
              <Select
                value={roundingUnitDzd.toString()}
                onChange={(e) => setRoundingUnitDzd(Number(e.target.value) as any)}
              >
                <option value="10">Arrondi aux 10 DZD les plus proches (Ex: 14 520 DZD)</option>
                <option value="50">Arrondi aux 50 DZD les plus proches (Ex: 14 550 DZD)</option>
                <option value="100">Arrondi aux 100 DZD les plus proches (Ex: 14 600 DZD)</option>
              </Select>
            </div>

            {/* Justification */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Motif pour le Journal d'Audit *</label>
              <Input
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Ex: Variation devise, promotion spéciale"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <label className="flex items-center gap-2 text-xs text-gray-700 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={allowBelowCostOverride}
                onChange={(e) => setAllowBelowCostOverride(e.target.checked)}
                className="rounded text-orange-600"
              />
              <span>Autoriser la vente en dessous du prix de revient (Dérogation spéciale)</span>
            </label>

            <Button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 font-bold"
              disabled={isCalculating}
            >
              {isCalculating ? 'Calcul en cours...' : 'Calculer la Prévisualisation'}
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </form>
      </div>

      {/* Preview Table */}
      {previewItems && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                Étape 2: Prévisualisation des Nouveaux Tarifs ({previewItems.length} Références Impactées)
              </h3>
              <p className="text-xs text-gray-500">
                Vérifiez les variations de marges et les alertes avant d'appliquer définitivement.
              </p>
            </div>

            <Button
              onClick={() => setIsConfirmOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Confirmer et Appliquer aux {previewItems.length} Produits
            </Button>
          </div>

          {hasWarnings && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Attention:</strong> Certains articles passeront en dessous du seuil de rentabilité minimum (marge &lt; 5%).
              </span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2.5">Produit & SKU</th>
                  <th className="px-3 py-2.5">Prix de Revient</th>
                  <th className="px-3 py-2.5">Prix Actuel</th>
                  <th className="px-3 py-2.5">Nouveau Tarif (Arrondi DZD)</th>
                  <th className="px-3 py-2.5">Marge Estimée</th>
                  <th className="px-3 py-2.5">Contrôle Marge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {previewItems.map((item) => (
                  <tr key={item.productId} className="hover:bg-gray-50/70">
                    <td className="px-3 py-2.5 font-sans">
                      <span className="font-bold text-gray-900 block">{item.name}</span>
                      <span className="text-[11px] text-gray-400 font-mono">SKU: {item.sku}</span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{formatDZD(item.costPriceDzd)}</td>
                    <td className="px-3 py-2.5 text-gray-500">
                      {targetField === 'B2B_PRICE' ? formatDZD(item.oldB2bPriceDzd) : formatDZD(item.oldB2cPriceDzd)}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-gray-900">
                      {targetField === 'B2B_PRICE' ? formatDZD(item.newB2bPriceDzd) : formatDZD(item.newB2cPriceDzd)}
                    </td>
                    <td className="px-3 py-2.5 font-sans">
                      <span
                        className={`font-bold ${
                          item.marginPercentage < 5 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {item.marginPercentage}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-sans">
                      {item.isBelowCostWarning ? (
                        <Badge variant="warning" className="text-[10px]">
                          MARGE CRITIQUE
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-[10px]">
                          CONFORME
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Confirmation de l'Ajustement en Masse"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-600">
            Vous êtes sur le point d'appliquer une variation de <strong>{percentageChange}%</strong> sur{' '}
            <strong>{previewItems?.length}</strong> références produit.
          </p>

          <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1 border border-gray-200">
            <p>
              <strong>Périmètre:</strong> {scope}
            </p>
            <p>
              <strong>Champs cibles:</strong> {targetField}
            </p>
            <p>
              <strong>Arrondi:</strong> {roundingUnitDzd} DZD
            </p>
            <p>
              <strong>Motif:</strong> {justification}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setIsConfirmOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleApplyAdjustment}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              disabled={applyBulkMutation.isPending}
            >
              {applyBulkMutation.isPending ? 'Application...' : 'Confirmer et Mettre à Jour'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
