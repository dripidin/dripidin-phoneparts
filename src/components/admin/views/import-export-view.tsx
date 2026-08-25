'use client';

// HamzaPhone Production-Grade Import / Export & Bulk Catalog Management View
// Features: 5-step wizard, auto column mapping, dry-run diff preview, margin impact analysis,
// multi-criteria export (CSV/XLSX), job history, and downloadable CSV error reports.

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CANONICAL_FIELDS } from '@/lib/import-export/column-mapper.service';
import type {
  ImportMode,
  FileType,
  ColumnMappingConfig,
  ImportPreviewSummary,
  ImportExecutionResult,
  ValidatedImportRow,
  CanonicalFieldKey,
} from '@/lib/import-export/types';
import {
  useUploadAndParseImport,
  useUpdateJobMapping,
  useApplyImportJob,
  useCancelImportJob,
  useDownloadJobReport,
  useImportJobsHistory,
  useExportCatalog,
  useSupplierMappingTemplates,
  useSaveSupplierTemplate,
} from '@/lib/hooks/use-import-export';
import { useSuppliers } from '@/lib/hooks/use-admin-queries';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  Layers,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Search,
  Filter,
  Save,
  Check,
  X,
  TrendingUp,
  Package,
  Sliders,
  Calendar,
  User,
  Clock,
  Sparkles,
} from 'lucide-react';

type WizardStep = 'UPLOAD' | 'MAP' | 'PREVIEW' | 'CONFIRM' | 'RESULTS';
type TabType = 'WIZARD' | 'HISTORY' | 'EXPORT';

export function ImportExportView() {
  const [activeTab, setActiveTab] = useState<TabType>('WIZARD');
  const [currentStep, setCurrentStep] = useState<WizardStep>('UPLOAD');

  // Wizard Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [importMode, setImportMode] = useState<ImportMode>('UPSERT');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard Staged Data & Preview State
  const [jobPreview, setJobPreview] = useState<ImportPreviewSummary | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMappingConfig>({});
  const [saveAsTemplate, setSaveAsTemplate] = useState<boolean>(false);
  const [templateName, setTemplateName] = useState<string>('');

  // Preview Filtering & Search
  const [previewFilter, setPreviewFilter] = useState<'ALL' | 'NEW' | 'UPDATED' | 'UNCHANGED' | 'WARNINGS' | 'ERRORS' | 'CONFLICTS'>('ALL');
  const [previewSearch, setPreviewSearch] = useState<string>('');

  // Execution Result State
  const [executionResult, setExecutionResult] = useState<ImportExecutionResult | null>(null);

  // Export State
  const [exportFormat, setExportFormat] = useState<'CSV' | 'XLSX'>('XLSX');
  const [exportStockStatus, setExportStockStatus] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [exportProductStatus, setExportProductStatus] = useState<'ALL' | 'ACTIVE' | 'DRAFT' | 'ARCHIVED'>('ALL');
  const [exportSearch, setExportSearch] = useState<string>('');
  const [exportPriceMin, setExportPriceMin] = useState<string>('');
  const [exportPriceMax, setExportPriceMax] = useState<string>('');

  // Queries & Mutations
  const { data: suppliers = [] } = useSuppliers();
  const { data: jobHistory = [], refetch: refetchHistory } = useImportJobsHistory();
  const { data: supplierTemplates = [] } = useSupplierMappingTemplates();

  const uploadMutation = useUploadAndParseImport();
  const updateMappingMutation = useUpdateJobMapping();
  const applyJobMutation = useApplyImportJob();
  const cancelJobMutation = useCancelImportJob();
  const downloadReportMutation = useDownloadJobReport();
  const exportMutation = useExportCatalog();
  const saveTemplateMutation = useSaveSupplierTemplate();

  // Handlers: Step 1 (Upload)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleStartImportAnalysis = async () => {
    if (!selectedFile) return;

    const fileType: FileType = selectedFile.name.toLowerCase().endsWith('.xlsx') ? 'XLSX' : 'CSV';
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const base64Content = (reader.result as string).split(',')[1];
        const supplierObj = suppliers.find((s: any) => s.id === selectedSupplierId);

        const result = await uploadMutation.mutateAsync({
          fileName: selectedFile.name,
          fileType,
          fileContentBase64: base64Content,
          supplierId: selectedSupplierId || null,
          supplierName: supplierObj?.name || null,
          importMode,
        });

        setJobPreview(result.preview);
        setColumnMapping(result.job.column_mapping || {});
        setCurrentStep('MAP');
      } catch (err: any) {
        alert(`Erreur d'analyse: ${err.message}`);
      }
    };

    reader.readAsDataURL(selectedFile);
  };

  // Handlers: Step 2 (Mapping Validation)
  const handleMappingChange = (header: string, canonicalKey: CanonicalFieldKey | 'IGNORE') => {
    setColumnMapping((prev) => ({
      ...prev,
      [header]: canonicalKey,
    }));
  };

  const handleApplyMappingAndPreview = async () => {
    if (!jobPreview) return;

    try {
      if (saveAsTemplate && selectedSupplierId) {
        const sup = suppliers.find((s: any) => s.id === selectedSupplierId);
        await saveTemplateMutation.mutateAsync({
          supplierId: selectedSupplierId,
          supplierName: sup?.name || 'Fournisseur',
          templateName: templateName || `Modèle ${sup?.name || 'Standard'}`,
          mapping: columnMapping,
          hasHeaderRow: true,
        });
      }

      const updatedPreview = await updateMappingMutation.mutateAsync({
        jobId: jobPreview.jobId,
        mapping: columnMapping,
        mode: importMode,
      });

      setJobPreview(updatedPreview);
      setCurrentStep('PREVIEW');
    } catch (err: any) {
      alert(`Erreur de validation: ${err.message}`);
    }
  };

  // Handlers: Step 4 (Apply Execution)
  const handleConfirmAndExecute = async () => {
    if (!jobPreview) return;

    try {
      const res = await applyJobMutation.mutateAsync(jobPreview.jobId);
      setExecutionResult(res);
      setCurrentStep('RESULTS');
      refetchHistory();
    } catch (err: any) {
      alert(`Erreur d'exécution: ${err.message}`);
    }
  };

  // Handlers: Reset / Cancel
  const handleCancelWizard = async () => {
    if (jobPreview?.jobId) {
      await cancelJobMutation.mutateAsync(jobPreview.jobId);
    }
    setJobPreview(null);
    setSelectedFile(null);
    setExecutionResult(null);
    setCurrentStep('UPLOAD');
  };

  // Filtered Preview Rows
  const getFilteredPreviewRows = () => {
    if (!jobPreview) return [];
    let rows = jobPreview.sampleRows || [];

    if (previewFilter === 'NEW') rows = rows.filter((r) => r.matchType === 'NEW' && r.status !== 'ERROR');
    else if (previewFilter === 'UPDATED') rows = rows.filter((r) => r.matchType === 'EXISTING' && r.diff && Object.keys(r.diff).length > 0);
    else if (previewFilter === 'UNCHANGED') rows = rows.filter((r) => r.matchType === 'EXISTING' && (!r.diff || Object.keys(r.diff).length === 0));
    else if (previewFilter === 'WARNINGS') rows = rows.filter((r) => r.status === 'WARNING');
    else if (previewFilter === 'ERRORS') rows = rows.filter((r) => r.status === 'ERROR');
    else if (previewFilter === 'CONFLICTS') rows = rows.filter((r) => r.matchType === 'CONFLICT');

    if (previewSearch.trim()) {
      const q = previewSearch.toLowerCase().trim();
      rows = rows.filter(
        (r) =>
          (r.resolvedSku && r.resolvedSku.toLowerCase().includes(q)) ||
          (r.canonicalData.name && r.canonicalData.name.toLowerCase().includes(q))
      );
    }

    return rows;
  };

  // Export Action
  const handleTriggerExport = async () => {
    try {
      await exportMutation.mutateAsync({
        format: exportFormat,
        stockStatus: exportStockStatus,
        productStatus: exportProductStatus,
        searchQuery: exportSearch || undefined,
        priceMinDzd: exportPriceMin ? Number(exportPriceMin) : undefined,
        priceMaxDzd: exportPriceMax ? Number(exportPriceMax) : undefined,
      });
    } catch (err: any) {
      alert(`Erreur lors de l'export: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-orange-600" />
            Gestion Catalogue en Masse & Synchronisation Fournisseurs
          </h2>
          <p className="text-xs text-gray-500">
            Importation sécurisée, analyse de marge avant/après, grand livre d'inventaire et export multi-critères
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('WIZARD')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'WIZARD' ? 'bg-white text-orange-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Assistant d'Importation
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'HISTORY' ? 'bg-white text-orange-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Historique ({jobHistory.length})
          </button>

          <button
            onClick={() => setActiveTab('EXPORT')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'EXPORT' ? 'bg-white text-orange-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Exportation Catalogue
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ASSISTANT D'IMPORTATION (WIZARD)                                   */}
      {/* ========================================================================= */}
      {activeTab === 'WIZARD' && (
        <div className="space-y-6">
          {/* Wizard Progress Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="grid grid-cols-5 gap-2 text-center text-xs font-semibold">
              <div className={`p-2 rounded-lg flex items-center justify-center gap-1.5 ${currentStep === 'UPLOAD' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'text-gray-400'}`}>
                <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                <span>1. Fichier & Mode</span>
              </div>

              <div className={`p-2 rounded-lg flex items-center justify-center gap-1.5 ${currentStep === 'MAP' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'text-gray-400'}`}>
                <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                <span>2. Mappage Colonnes</span>
              </div>

              <div className={`p-2 rounded-lg flex items-center justify-center gap-1.5 ${currentStep === 'PREVIEW' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'text-gray-400'}`}>
                <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                <span>3. Analyse & Diffs</span>
              </div>

              <div className={`p-2 rounded-lg flex items-center justify-center gap-1.5 ${currentStep === 'CONFIRM' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'text-gray-400'}`}>
                <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px] font-bold">4</span>
                <span>4. Sécurité & Confirm</span>
              </div>

              <div className={`p-2 rounded-lg flex items-center justify-center gap-1.5 ${currentStep === 'RESULTS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-gray-400'}`}>
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">5</span>
                <span>5. Bilan & Rapport</span>
              </div>
            </div>
          </div>

          {/* STEP 1: UPLOAD & MODE SELECTION */}
          {currentStep === 'UPLOAD' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Dropzone */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-orange-600" />
                  Sélectionnez le fichier fournisseur (.csv ou .xlsx)
                </h3>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                    selectedFile
                      ? 'border-orange-500 bg-orange-50/20'
                      : 'border-gray-300 hover:border-orange-500 bg-gray-50/50 hover:bg-orange-50/10'
                  }`}
                >
                  <FileSpreadsheet className={`w-10 h-10 mx-auto mb-3 ${selectedFile ? 'text-orange-600' : 'text-gray-400'}`} />
                  {selectedFile ? (
                    <div>
                      <p className="font-bold text-sm text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{(selectedFile.size / 1024).toFixed(1)} Ko • Prêt pour l'analyse</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-xs text-gray-800">Glissez-déposez votre classeur Excel (.xlsx) ou fichier CSV</p>
                      <p className="text-[11px] text-gray-400 mt-1">Jusqu'à 50 000 lignes supportées avec détection automatique des délimiteurs</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleStartImportAnalysis}
                    disabled={!selectedFile || uploadMutation.isPending}
                    className="bg-orange-600 hover:bg-orange-700 font-bold"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Analyse du fichier en cours...
                      </>
                    ) : (
                      <>
                        Continuer vers le Mappage des Colonnes
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Import Options Panel */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-gray-700" />
                  Paramètres de l'Importation
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Fournisseur Source (Optionnel)</label>
                    <Select
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                    >
                      <option value="">Sélectionner un fournisseur...</option>
                      {suppliers.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code} - {s.country})
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Mode d'Importation</label>
                    <Select
                      value={importMode}
                      onChange={(e) => setImportMode(e.target.value as ImportMode)}
                    >
                      <option value="UPSERT">UPSERT (Créer nouveaux & Mettre à jour existants)</option>
                      <option value="PRICE_ONLY">PRIX FOURNISSEUR SEULEMENT (Mettre à jour les coûts d'achat)</option>
                      <option value="STOCK_ONLY">STOCK SEULEMENT (Réception / Ajustement Inventaire)</option>
                      <option value="CREATE_ONLY">CRÉATION SEULE (Ignorer les références déjà présentes)</option>
                      <option value="UPDATE_ONLY">MODIFICATION SEULE (Ne pas créer de nouvelles pièces)</option>
                    </Select>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Protection des Données
                    </p>
                    <p>
                      Aucune modification de production ne sera effectuée sans prévisualisation préalable (Dry-Run).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {currentStep === 'MAP' && jobPreview && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-orange-600" />
                    Correspondance des Colonnes Fournisseur
                  </h3>
                  <p className="text-xs text-gray-500">
                    Fichier : <strong>{jobPreview.fileName}</strong> ({jobPreview.totalRows} lignes détectées)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentStep('UPLOAD')}>
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Retour
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApplyMappingAndPreview}
                    disabled={updateMappingMutation.isPending}
                    className="bg-orange-600 hover:bg-orange-700 font-bold"
                  >
                    {updateMappingMutation.isPending ? 'Recalcul des diffs...' : 'Valider & Voir l’Aperçu Détaillé'}
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>

              {/* Mapping Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                    <tr>
                      <th className="p-3">Colonne dans votre Fichier</th>
                      <th className="p-3">Champ HamzaPhone Correspondant</th>
                      <th className="p-3">Obligation / Règle Métier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Object.keys(columnMapping).map((header) => {
                      const currentVal = columnMapping[header];
                      const matchedField = CANONICAL_FIELDS.find((f) => f.key === currentVal);

                      return (
                        <tr key={header} className="hover:bg-gray-50/60 transition-colors">
                          <td className="p-3 font-mono font-bold text-gray-800">
                            {header}
                          </td>
                          <td className="p-3">
                            <Select
                              value={currentVal}
                              onChange={(e) => handleMappingChange(header, e.target.value as any)}
                              className="text-xs max-w-sm"
                            >
                              <option value="IGNORE">-- Ignorer cette colonne --</option>
                              {CANONICAL_FIELDS.map((f) => (
                                <option key={f.key} value={f.key}>
                                  {f.labelFr} ({f.label})
                                </option>
                              ))}
                            </Select>
                          </td>
                          <td className="p-3 text-[11px] text-gray-500">
                            {matchedField ? (
                              <span className="text-emerald-700 font-medium">{matchedField.description}</span>
                            ) : (
                              <span className="text-gray-400">Cette colonne ne modifiera aucune donnée</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Save template option */}
              {selectedSupplierId && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800">
                    <input
                      type="checkbox"
                      checked={saveAsTemplate}
                      onChange={(e) => setSaveAsTemplate(e.target.checked)}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span>Enregistrer cette configuration comme modèle par défaut pour ce fournisseur</span>
                  </label>

                  {saveAsTemplate && (
                    <Input
                      placeholder="Nom du modèle (ex: Shenzhen Standard 2026)"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="max-w-xs text-xs"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: DRY RUN DIFF PREVIEW & FINANCIAL IMPACT */}
          {currentStep === 'PREVIEW' && jobPreview && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 shadow-xs">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Rapport de Prévisualisation & Analyse des Écarts (Dry-Run)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Total : <strong>{jobPreview.totalRows}</strong> lignes analysées • Mode : <strong>{jobPreview.importMode}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentStep('MAP')}>
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Modifier Mappage
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setCurrentStep('CONFIRM')}
                    className="bg-orange-600 hover:bg-orange-700 font-bold"
                  >
                    Vérifier les Mesures de Sécurité
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>

              {/* Metric Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center text-xs">
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <span className="font-bold text-base text-gray-900 block">{jobPreview.totalRows}</span>
                  <span className="text-[11px] text-gray-500">Total Analysé</span>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="font-bold text-base text-emerald-800 block">+{jobPreview.newCount}</span>
                  <span className="text-[11px] text-emerald-700">Nouveaux</span>
                </div>

                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <span className="font-bold text-base text-blue-800 block">{jobPreview.updateCount}</span>
                  <span className="text-[11px] text-blue-700">Modifiés</span>
                </div>

                <div className="p-3 rounded-lg bg-gray-100 border border-gray-200">
                  <span className="font-bold text-base text-gray-700 block">{jobPreview.unchangedCount}</span>
                  <span className="text-[11px] text-gray-500">Inchangés</span>
                </div>

                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <span className="font-bold text-base text-amber-800 block">{jobPreview.warningCount}</span>
                  <span className="text-[11px] text-amber-700">Avertissements</span>
                </div>

                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <span className="font-bold text-base text-red-800 block">{jobPreview.errorCount}</span>
                  <span className="text-[11px] text-red-700">Erreurs Bloquées</span>
                </div>

                <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <span className="font-bold text-base text-purple-800 block">{jobPreview.conflictCount}</span>
                  <span className="text-[11px] text-purple-700">Conflits</span>
                </div>
              </div>

              {/* Financial Impact Bar */}
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-gray-500 block text-[11px]">Variation Moyenne des Prix d'Achat :</span>
                    <strong className="text-gray-900 font-mono">
                      {jobPreview.averageCostChangePercent > 0 ? `+${jobPreview.averageCostChangePercent}%` : `${jobPreview.averageCostChangePercent}%`}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-gray-500 block text-[11px]">Impact Stock Global :</span>
                    <strong className="text-emerald-800 font-mono">
                      {jobPreview.totalStockDelta > 0 ? `+${jobPreview.totalStockDelta}` : jobPreview.totalStockDelta} pièces
                    </strong>
                  </div>
                </div>
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                  {(['ALL', 'NEW', 'UPDATED', 'UNCHANGED', 'WARNINGS', 'ERRORS', 'CONFLICTS'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setPreviewFilter(filter)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        previewFilter === filter
                          ? 'bg-gray-900 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {filter === 'ALL' && 'Tous'}
                      {filter === 'NEW' && 'Nouveaux'}
                      {filter === 'UPDATED' && 'Modifiés'}
                      {filter === 'UNCHANGED' && 'Inchangés'}
                      {filter === 'WARNINGS' && 'Avertissements'}
                      {filter === 'ERRORS' && 'Erreurs'}
                      {filter === 'CONFLICTS' && 'Conflits'}
                    </button>
                  ))}
                </div>

                <div className="relative max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                  <Input
                    placeholder="Filtrer SKU ou désignation..."
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                    className="pl-8 text-xs h-8"
                  />
                </div>
              </div>

              {/* Sample Rows Diff Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200 sticky top-0 bg-gray-50 z-10">
                    <tr>
                      <th className="p-2.5">Ligne</th>
                      <th className="p-2.5">SKU & Article</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Coût d'Achat (DZD)</th>
                      <th className="p-2.5">Prix Public B2C (DZD)</th>
                      <th className="p-2.5">Stock</th>
                      <th className="p-2.5">Marge %</th>
                      <th className="p-2.5">Statut / Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono">
                    {getFilteredPreviewRows().map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={`hover:bg-gray-50/80 transition-colors ${
                          row.status === 'ERROR' ? 'bg-red-50/40' : row.status === 'WARNING' ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        <td className="p-2.5 text-gray-400 font-sans text-[11px]">{row.rowNumber}</td>
                        <td className="p-2.5 font-sans">
                          <span className="font-bold text-gray-900 font-mono block">{row.resolvedSku || row.rawSku}</span>
                          <span className="text-[11px] text-gray-500 line-clamp-1">{row.canonicalData.name || '-'}</span>
                        </td>
                        <td className="p-2.5 font-sans">
                          <Badge
                            variant={
                              row.matchType === 'NEW'
                                ? 'success'
                                : row.matchType === 'EXISTING'
                                ? 'default'
                                : 'destructive'
                            }
                            className="text-[10px]"
                          >
                            {row.matchType}
                          </Badge>
                        </td>
                        <td className="p-2.5">
                          {row.diff?.costPrice ? (
                            <div>
                              <span className="text-gray-400 line-through text-[11px] block">{row.diff.costPrice.old}</span>
                              <span className="font-bold text-orange-600">
                                {row.diff.costPrice.new}{' '}
                                <span className="text-[10px]">
                                  ({row.diff.costPrice.changePercent > 0 ? '+' : ''}{row.diff.costPrice.changePercent}%)
                                </span>
                              </span>
                            </div>
                          ) : (
                            <span>{row.canonicalData.cost_price_dzd ?? '-'}</span>
                          )}
                        </td>
                        <td className="p-2.5">
                          {row.diff?.b2cPrice ? (
                            <div>
                              <span className="text-gray-400 line-through text-[11px] block">{row.diff.b2cPrice.old}</span>
                              <span className="font-bold text-gray-900">{row.diff.b2cPrice.new}</span>
                            </div>
                          ) : (
                            <span>{row.canonicalData.b2c_price_dzd ?? '-'}</span>
                          )}
                        </td>
                        <td className="p-2.5">
                          {row.diff?.stockQuantity ? (
                            <div>
                              <span className="text-gray-400 text-[11px] block">{row.diff.stockQuantity.old}</span>
                              <span className="font-bold text-emerald-700">
                                {row.diff.stockQuantity.new} ({row.diff.stockQuantity.delta > 0 ? `+${row.diff.stockQuantity.delta}` : row.diff.stockQuantity.delta})
                              </span>
                            </div>
                          ) : (
                            <span>{row.canonicalData.stock_quantity ?? '-'}</span>
                          )}
                        </td>
                        <td className="p-2.5">
                          {row.diff?.grossMarginPercent ? (
                            <span className={`font-bold ${row.diff.grossMarginPercent.new < 10 ? 'text-red-600' : 'text-emerald-700'}`}>
                              {row.diff.grossMarginPercent.new}%
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-2.5 font-sans">
                          {row.messages.length > 0 ? (
                            <div className="space-y-1">
                              {row.messages.map((m, idx) => (
                                <span
                                  key={idx}
                                  className={`block text-[11px] font-medium ${
                                    m.severity === 'ERROR' ? 'text-red-700' : 'text-amber-800'
                                  }`}
                                >
                                  • {m.message}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-emerald-600 text-[11px] flex items-center gap-1 font-semibold">
                              <Check className="w-3.5 h-3.5" /> Prêt
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 4: CONFIRMATION & SAFETY GATES */}
          {currentStep === 'CONFIRM' && jobPreview && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 shadow-xs max-w-2xl mx-auto">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Confirmation d'Exécution sur le Catalogue</h3>
                <p className="text-xs text-gray-500">
                  Vérifiez attentivement les opérations qui vont être appliquées sur la base de données de production.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500">Fichier Source :</span>
                  <strong className="text-gray-900 font-mono">{jobPreview.fileName}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500">Mode Sélectionné :</span>
                  <Badge variant="outline">{jobPreview.importMode}</Badge>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500">Nouvelles Pièces à Créer :</span>
                  <strong className="text-emerald-700">+{jobPreview.newCount} références</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500">Pièces Existantes à Mettre à Jour :</span>
                  <strong className="text-blue-700">{jobPreview.updateCount} références</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-500">Lignes avec Erreurs (Ignorées) :</span>
                  <strong className="text-red-700">{jobPreview.invalidRows} lignes</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Transactions de Stock Enregistrées :</span>
                  <strong className="text-gray-900 font-mono">Double-Entrée Grand Livre (RECEIVING / AJUSTEMENT)</strong>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Button variant="outline" onClick={() => setCurrentStep('PREVIEW')}>
                  Retour à l'Aperçu
                </Button>
                <Button
                  onClick={handleConfirmAndExecute}
                  disabled={applyJobMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 font-bold"
                >
                  {applyJobMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                      Application des modifications...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Confirmer et Appliquer sur le Catalogue
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: RESULTS & DOWNLOADABLE REPORT */}
          {currentStep === 'RESULTS' && executionResult && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 shadow-xs max-w-2xl mx-auto text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900">Importation Exécutée avec Succès !</h3>
                <p className="text-xs text-gray-500">
                  Traitement complété en <strong>{executionResult.executionTimeMs} ms</strong> avec journalisation d'audit complète.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="font-bold text-base text-emerald-800 block">+{executionResult.createdCount}</span>
                  <span className="text-[11px] text-emerald-700">Pièces Créées</span>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="font-bold text-base text-blue-800 block">{executionResult.updatedCount}</span>
                  <span className="text-[11px] text-blue-700">Pièces Mises à Jour</span>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <span className="font-bold text-base text-purple-800 block">{executionResult.inventoryTransactionsRecorded}</span>
                  <span className="text-[11px] text-purple-700">Écritures Grand Livre Stock</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={() => downloadReportMutation.mutate(executionResult.jobId)}
                  disabled={downloadReportMutation.isPending}
                  className="font-bold text-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Télécharger le Rapport Détaillé (.csv)
                </Button>

                <Button
                  onClick={handleCancelWizard}
                  className="bg-orange-600 hover:bg-orange-700 font-bold text-xs"
                >
                  Nouvelle Importation
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HISTORIQUE DES IMPORTS                                             */}
      {/* ========================================================================= */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              Journal des Opérations d'Importation
            </h3>
            <span className="text-xs text-gray-400">Total : {jobHistory.length} sessions enregistrées</span>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="p-3">ID Session</th>
                  <th className="p-3">Fichier</th>
                  <th className="p-3">Fournisseur</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3">Lignes (Total / Nouveaux / Modifiés / Erreurs)</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Rapport</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-gray-400">
                      Aucune session d'importation dans l'historique récent.
                    </td>
                  </tr>
                ) : (
                  jobHistory.map((j) => (
                    <tr key={j.id} className="hover:bg-gray-50/60 transition-colors font-mono">
                      <td className="p-3 text-gray-400 text-[11px]">{j.id.slice(0, 12)}...</td>
                      <td className="p-3 font-sans font-bold text-gray-900">{j.file_name}</td>
                      <td className="p-3 font-sans text-gray-600">{j.supplier_name || 'Général'}</td>
                      <td className="p-3 font-sans">
                        <Badge variant="outline" className="text-[10px]">{j.import_mode}</Badge>
                      </td>
                      <td className="p-3 font-sans">
                        <Badge
                          variant={
                            j.status === 'COMPLETED'
                              ? 'success'
                              : j.status === 'PARTIAL'
                              ? 'secondary'
                              : j.status === 'CANCELLED'
                              ? 'destructive'
                              : 'default'
                          }
                          className="text-[10px]"
                        >
                          {j.status}
                        </Badge>
                      </td>
                      <td className="p-3 font-sans text-gray-700">
                        {j.total_rows} tot. / <span className="text-emerald-700 font-bold">+{j.new_products}</span> / <span className="text-blue-700 font-bold">{j.updated_products}</span> / <span className="text-red-700 font-bold">{j.invalid_rows} err</span>
                      </td>
                      <td className="p-3 text-gray-400 text-[11px]">
                        {new Date(j.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3 font-sans">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadReportMutation.mutate(j.id)}
                          className="h-7 text-[11px]"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          CSV
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EXPORTATION AVANCÉE                                                */}
      {/* ========================================================================= */}
      {activeTab === 'EXPORT' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filters Form */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              Filtres Multi-Critères d'Exportation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Recherche (SKU / Désignation / Marque)</label>
                <Input
                  placeholder="ex: Samsung S21, Écran iPhone..."
                  value={exportSearch}
                  onChange={(e) => setExportSearch(e.target.value)}
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">État de Disponibilité du Stock</label>
                <Select
                  value={exportStockStatus}
                  onChange={(e) => setExportStockStatus(e.target.value as any)}
                >
                  <option value="ALL">Toutes les pièces (En stock & Épuisées)</option>
                  <option value="IN_STOCK">En Stock Uniquement (Disponible {'>'} 0)</option>
                  <option value="LOW_STOCK">Stock Faible / Alerte Réapprovisionnement</option>
                  <option value="OUT_OF_STOCK">Rupture Totale de Stock</option>
                </Select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Prix Public B2C Min (DZD)</label>
                <Input
                  type="number"
                  placeholder="ex: 1000"
                  value={exportPriceMin}
                  onChange={(e) => setExportPriceMin(e.target.value)}
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Prix Public B2C Max (DZD)</label>
                <Input
                  type="number"
                  placeholder="ex: 50000"
                  value={exportPriceMax}
                  onChange={(e) => setExportPriceMax(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs">
                <span className="font-bold text-gray-700">Format de Téléchargement :</span>
                <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
                  <input
                    type="radio"
                    name="export_format"
                    value="XLSX"
                    checked={exportFormat === 'XLSX'}
                    onChange={() => setExportFormat('XLSX')}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <span>Excel (.xlsx)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
                  <input
                    type="radio"
                    name="export_format"
                    value="CSV"
                    checked={exportFormat === 'CSV'}
                    onChange={() => setExportFormat('CSV')}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <span>CSV UTF-8 (.csv)</span>
                </label>
              </div>

              <Button
                onClick={handleTriggerExport}
                disabled={exportMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 font-bold"
              >
                {exportMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                    Génération du fichier...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-1" />
                    Générer et Télécharger l'Export
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Security Rules Box */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-emerald-600" />
              Sécurité & Confidentialité des Données
            </h3>

            <div className="space-y-2 text-xs text-gray-600">
              <p>
                • <strong>Prix d'Achat Fournisseur (Coût DZD) :</strong> Inclus uniquement pour les administrateurs et comptables possédant la permission <code className="text-orange-600 font-mono">pricing.read</code>.
              </p>
              <p>
                • <strong>Nettoyage Anti-Injection Formules :</strong> Les caractères réservés (<code className="font-mono">=, +, -, @</code>) sont automatiquement neutralisés pour empêcher l'exécution de macros malveillantes dans Excel.
              </p>
              <p>
                • <strong>Données Protégées :</strong> Les mots de passe, clés API, et données personnelles clients ne sont jamais inclus dans les exports catalogue.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
