'use client';

// DRIPIDIN Admin Integration Center & Credential Inventory Workstation
// Displays real-time configuration status, safe connection test execution, sandbox/production toggles,
// encrypted secret configuration/revocation, and zero-leakage secret indicators.
// Condition 6 & Requirement 14 Compliance:
// - Status displays only 'Configured' or 'Missing'.
// - Secrets inputs are empty/masked; empty submission keeps existing, new input replaces.
// - Explicit revocation action supported.
// - Diagnostics display sanitized results without credentials or tokens.
// - Zero secrets in localStorage, sessionStorage, or URLs.

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import {
  getIntegrationsSummaryAction,
  updateIntegrationSettingsAction,
  testIntegrationConnectionAction,
  seedDemoInventoryAction,
  configureIntegrationSecretAction,
  revokeIntegrationSecretAction,
} from '@/lib/actions/integration.actions';
import type { IntegrationSummary, SafeConnectionTestResult } from '@/types/integrations.types';
import {
  ShieldCheck,
  Zap,
  Truck,
  Mail,
  MessageSquare,
  Send,
  Database,
  KeyRound,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Settings,
  Lock,
  Layers,
  Sparkles,
  ExternalLink,
  Cpu,
  Server,
  Sliders,
  Trash2,
  Key,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, any> = {
  DELIVERY: Truck,
  EMAIL: Mail,
  SMS: MessageSquare,
  WHATSAPP: Send,
  TELEGRAM: Send,
  AUTH_OAUTH: KeyRound,
  STORAGE: Database,
  MONITORING: Activity,
};

export function IntegrationsView() {
  const [integrations, setIntegrations] = useState<IntegrationSummary[]>([]);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, SafeConnectionTestResult>>({});

  // Configuration Modal State
  const [editingIntegration, setEditingIntegration] = useState<IntegrationSummary | null>(null);
  const [apiUrl, setApiUrl] = useState<string>('');
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [secretInputs, setSecretInputs] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [modalFeedback, setModalFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Demo Inventory Seed State
  const [isSeedingStock, setIsSeedingStock] = useState<boolean>(false);
  const [seedSuccessMsg, setSeedSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const res = await getIntegrationsSummaryAction();
    if (res.success) {
      setIntegrations(res.integrations);
      setIsDemoMode(res.isDemoMode);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTestConnection = async (integrationId: string) => {
    setTestingId(integrationId);
    try {
      const res = await testIntegrationConnectionAction(integrationId);
      if (res.success && res.result) {
        setTestResults((prev) => ({ ...prev, [integrationId]: res.result }));
      }
    } finally {
      setTestingId(null);
      loadData();
    }
  };

  const openConfigModal = (item: IntegrationSummary) => {
    setEditingIntegration(item);
    setApiUrl(item.apiUrl || '');
    setEnvironment(item.environment);
    setIsEnabled(item.enabled);
    setSecretInputs({});
    setModalFeedback(null);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIntegration) return;

    setIsSaving(true);
    setModalFeedback(null);

    try {
      // 1. Update non-secret integration settings
      await updateIntegrationSettingsAction({
        integrationId: editingIntegration.id,
        apiUrl,
        environment,
        enabled: isEnabled,
      });

      // 2. Configure any newly provided secret values
      for (const [keyName, secretValue] of Object.entries(secretInputs)) {
        if (secretValue && secretValue.trim().length > 0) {
          const secRes = await configureIntegrationSecretAction({
            integrationId: editingIntegration.id,
            keyName,
            secretValue: secretValue.trim(),
          });
          if (!secRes.success) {
            throw new Error(secRes.error || `Erreur lors de l'enregistrement de ${keyName}`);
          }
        }
      }

      setModalFeedback({ type: 'success', message: 'Paramètres et secrets enregistrés avec succès dans le coffre-fort.' });
      setTimeout(() => {
        setEditingIntegration(null);
        setSecretInputs({});
      }, 1000);
      await loadData();
    } catch (err: any) {
      setModalFeedback({ type: 'error', message: err.message || 'Erreur lors de la mise à jour.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevokeSecret = async (keyName: string) => {
    if (!editingIntegration) return;
    if (!confirm(`Confirmer la révocation du secret ${keyName} ? Cette action supprimera la clé du coffre-fort.`)) {
      return;
    }

    setIsSaving(true);
    setModalFeedback(null);

    try {
      const res = await revokeIntegrationSecretAction({
        integrationId: editingIntegration.id,
        keyName,
      });

      if (res.success) {
        setSecretInputs((prev) => ({ ...prev, [keyName]: '' }));
        setModalFeedback({ type: 'success', message: `Secret ${keyName} révoqué du coffre-fort.` });
        await loadData();
        // Update local modal state
        setEditingIntegration((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            credentials: prev.credentials.map((c) =>
              c.name === keyName ? { ...c, status: 'Missing' } : c
            ),
          };
        });
      } else {
        setModalFeedback({ type: 'error', message: res.error || 'Erreur lors de la révocation.' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeedStock = async () => {
    setIsSeedingStock(true);
    setSeedSuccessMsg(null);
    try {
      const res = await seedDemoInventoryAction({
        target: 'ALL_ACTIVE',
        seedQuantity: 25,
        reason: 'Initialisation des stocks pour démonstration commerciale client',
      });
      if (res.success && res.result) {
        setSeedSuccessMsg(
          `Succès : ${res.result.updatedProductsCount} pièces réapprovisionnées avec +${res.result.appliedStockPerProduct} unités chacune (Total: ${res.result.totalUnitsAdded} unités).`
        );
      }
    } finally {
      setIsSeedingStock(false);
    }
  };

  const configuredCount = integrations.filter((i) => i.isConfigured).length;

  return (
    <div className="space-y-6">
      {/* Header & Global Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Centre des Intégrations & Connecteurs</h1>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs font-bold">
              White-Label DRIPIDIN
            </Badge>
          </div>
          <p className="text-xs text-gray-500 max-w-2xl">
            Gestion sécurisée des passerelles logistiques (EcoTrack 58 Wilayas), notifications clients (SMS/WhatsApp/Email),
            authentification et base de données. Tous les secrets sont chiffrés à l'aide d'AES-256-GCM.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="text-xs font-bold text-gray-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleSeedStock}
            disabled={isSeedingStock}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
          >
            <Sparkles className={`w-3.5 h-3.5 mr-1.5 ${isSeedingStock ? 'animate-spin' : ''}`} />
            {isSeedingStock ? 'Génération...' : 'Injecter Stock Démo (+25)'}
          </Button>
        </div>
      </div>

      {/* Stock Seed Banner Notification */}
      {seedSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{seedSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSeedSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Mode Indicator & Security Shield */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className={`p-3 rounded-lg ${isDemoMode ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Environnement d'Exécution</div>
            <div className="text-sm font-black text-gray-900 flex items-center gap-1.5 mt-0.5">
              <span>{isDemoMode ? 'Mode Bac à Sable / Démo Active' : 'Production Commerciale Réelle'}</span>
              <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {isDemoMode
                ? 'Simulation sécurisée : 0 frais de livraison, 0 SMS réels consommés'
                : 'Passerelles réelles connectées et actives'}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-lg bg-orange-100 text-orange-700">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">État des Connecteurs</div>
            <div className="text-sm font-black text-gray-900 mt-0.5">
              {configuredCount} / {integrations.length} Services Configurés
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Tous les connecteurs essentiels sont opérationnels pour la vitrine
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-100 text-blue-700">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Logistique Algérie</div>
            <div className="text-sm font-black text-gray-900 mt-0.5">
              EcoTrack Express (58 Wilayas)
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Bordereaux de livraison et synchronisation Webhook idempotente
            </div>
          </div>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {integrations.map((item) => {
          const Icon = CATEGORY_ICONS[item.category] || Server;
          const isTesting = testingId === item.id;
          const testResult = testResults[item.id];

          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-gray-700">
                      <Icon className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-gray-900 leading-tight">{item.name}</h2>
                      <span className="text-[11px] text-gray-400 font-medium">{item.provider}</span>
                    </div>
                  </div>

                  <Badge
                    variant={item.environment === 'production' ? 'success' : 'warning'}
                    className="text-[10px] font-bold uppercase"
                  >
                    {item.environment}
                  </Badge>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      item.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${item.enabled ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    {item.enabled ? 'Activé' : 'Désactivé'}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      item.isReadyForDemo ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {item.isReadyForDemo ? 'Prêt pour Démo' : 'Non configuré'}
                  </span>
                </div>
              </div>

              {/* Credentials & Secrets Masked Status */}
              <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  État des Clés & Variables d'Environnement
                </div>

                <div className="space-y-1">
                  {item.credentials.map((cred) => (
                    <div
                      key={cred.name}
                      className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-gray-50/70 border border-gray-100"
                    >
                      <span className="font-mono text-gray-700 truncate max-w-[170px]" title={cred.name}>
                        {cred.name}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                          cred.status === 'Configured'
                            ? 'bg-emerald-100 text-emerald-800'
                            : cred.requiredForProduction
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {cred.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Last Test Outcome */}
              {(testResult || item.lastTestedAt) && (
                <div
                  className={`p-2.5 rounded-lg border text-[11px] space-y-1 ${
                    (testResult ? testResult.success : item.lastTestSuccess)
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50/70 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1">
                      {(testResult ? testResult.success : item.lastTestSuccess) ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      )}
                      Test de Connexion
                    </span>
                    <span className="font-mono text-[10px]">
                      {testResult ? `${testResult.latencyMs} ms` : item.lastTestLatencyMs ? `${item.lastTestLatencyMs} ms` : ''}
                    </span>
                  </div>
                  <p className="text-[10px] leading-tight line-clamp-2">
                    {testResult?.message || item.lastTestMessage}
                  </p>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTestConnection(item.id)}
                  disabled={isTesting}
                  className="flex-1 text-xs font-bold"
                >
                  <Zap className={`w-3.5 h-3.5 mr-1 ${isTesting ? 'animate-pulse text-amber-500' : 'text-orange-600'}`} />
                  {isTesting ? 'Test en cours...' : 'Tester Connexion'}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openConfigModal(item)}
                  className="text-xs font-bold text-gray-600 hover:text-gray-900"
                >
                  <Sliders className="w-3.5 h-3.5 mr-1" />
                  Options
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Integration Settings & Secure Vault Modal */}
      <Modal
        isOpen={Boolean(editingIntegration)}
        onClose={() => {
          setEditingIntegration(null);
          setSecretInputs({});
          setModalFeedback(null);
        }}
        title={`Configuration & Coffre-Fort : ${editingIntegration?.name || ''}`}
        size="lg"
      >
        <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
          {modalFeedback && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                modalFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {modalFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span>{modalFeedback.message}</span>
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg space-y-1 text-[11px]">
            <strong>Coffre-Fort Cryptographique AES-256-GCM :</strong>
            <p>
              Les jetons d'accès et clés secrètes sont chiffrés avec authentification de contexte (AAD) et stockés de façon
              isolée. Les valeurs ne sont jamais exposées aux bundles JavaScript des clients. Pour conserver un secret existant, laissez le champ vide.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Environnement Opérationnel</label>
              <Select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as 'sandbox' | 'production')}
              >
                <option value="sandbox">Bac à Sable / Démo (Sandbox)</option>
                <option value="production">Production Réelle</option>
              </Select>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">État du Service</label>
              <Select
                value={isEnabled ? 'true' : 'false'}
                onChange={(e) => setIsEnabled(e.target.value === 'true')}
              >
                <option value="true">Actif (Connecté)</option>
                <option value="false">Désactivé</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Point de Terminaison API (URL)</label>
            <Input
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="ex: https://api.ecotrack.dz/api/v1"
            />
          </div>

          {/* Secure Secrets Management Section */}
          {editingIntegration?.credentials && editingIntegration.credentials.some((c) => c.isSecret) && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
              <span className="font-bold text-gray-800 text-[11px] block flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-orange-600" />
                Identifiants & Clés Secrètes du Service
              </span>

              <div className="space-y-3">
                {editingIntegration.credentials
                  .filter((c) => c.isSecret)
                  .map((cred) => {
                    const isConfigured = cred.status === 'Configured';
                    return (
                      <div key={cred.name} className="space-y-1 bg-white p-2.5 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <label className="font-mono text-xs font-bold text-gray-800 flex items-center gap-1.5">
                            <Lock className="w-3 h-3 text-gray-500" />
                            {cred.name}
                          </label>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isConfigured
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {cred.status}
                            </span>
                            {isConfigured && (
                              <button
                                type="button"
                                onClick={() => handleRevokeSecret(cred.name)}
                                disabled={isSaving}
                                title="Révoquer ce secret"
                                className="text-rose-600 hover:text-rose-800 p-0.5 rounded hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-[10px] text-gray-500">{cred.description}</p>

                        <div className="pt-1">
                          <Input
                            type="password"
                            value={secretInputs[cred.name] || ''}
                            onChange={(e) =>
                              setSecretInputs((prev) => ({ ...prev, [cred.name]: e.target.value }))
                            }
                            placeholder={
                              isConfigured
                                ? '•••••••• (Laisser vide pour conserver l\'actuel)'
                                : 'Entrez la nouvelle clé secrète...'
                            }
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {editingIntegration?.nonSecretConfig && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
              <span className="font-bold text-gray-800 text-[11px] block">Options Spécifiques du Fournisseur</span>
              <div className="space-y-1 text-[11px] font-mono text-gray-600">
                {Object.entries(editingIntegration.nonSecretConfig).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-gray-500">{k}:</span>
                    <strong className="text-gray-800">{String(v)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setEditingIntegration(null);
                setSecretInputs({});
                setModalFeedback(null);
              }}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-orange-600 hover:bg-orange-700 font-bold text-white"
            >
              {isSaving ? 'Enregistrement sécurisé...' : 'Enregistrer la Configuration'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
