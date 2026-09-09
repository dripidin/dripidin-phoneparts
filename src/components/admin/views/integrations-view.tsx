'use client';

// HamzaPhone Admin Integration Center & Credential Inventory Workstation
// Displays real-time configuration status, safe connection test execution, sandbox/production toggles,
// and zero-leakage secret indicators.

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
  const [isSaving, setIsSaving] = useState<boolean>(false);

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
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIntegration) return;

    setIsSaving(true);
    try {
      await updateIntegrationSettingsAction({
        integrationId: editingIntegration.id,
        apiUrl,
        environment,
        enabled: isEnabled,
      });
      setEditingIntegration(null);
      await loadData();
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickSeedDemoStock = async () => {
    setIsSeedingStock(true);
    setSeedSuccessMsg(null);
    try {
      const res = await seedDemoInventoryAction({
        target: 'ALL_ACTIVE',
        seedQuantity: 5,
        reason: 'Alimentation rapide depuis le Centre des Intégrations',
      });
      if (res.success && res.result) {
        setSeedSuccessMsg(
          `Stock démo initialisé avec succès : ${res.result.updatedProductsCount} produits mis à niveau avec 5 unités.`
        );
        setTimeout(() => setSeedSuccessMsg(null), 5000);
      }
    } finally {
      setIsSeedingStock(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-600" />
            Centre des Intégrations & Gestion des Fournisseurs
          </h2>
          <p className="text-xs text-gray-500">
            Gestion sécurisée des connecteurs externes (EcoTrack, Notifications, Auth, Storage) avec tests de connexion en direct.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            disabled={isLoading}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>

          <Button
            size="sm"
            onClick={handleQuickSeedDemoStock}
            disabled={isSeedingStock}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            {isSeedingStock ? 'Alimentation...' : 'Alimenter Stock Démo (5 unités)'}
          </Button>
        </div>
      </div>

      {/* Demo Notification Banner */}
      {isDemoMode && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-900">Plateforme en Mode Démonstration Client Sécurisé (Sandbox)</span>
              <Badge variant="warning" className="text-[10px] font-bold">
                DEMO MODE ACTIF
              </Badge>
            </div>
            <p className="text-amber-800 leading-relaxed">
              Les appels vers les transporteurs réels et passerelles payantes sont isolés. Vous pouvez tester le cycle complet
              de commande (Panier, Checkout COD 58 Wilayas, Validation de stock, Suivi colis mock) sans frais ni création réelle de bordereaux.
            </p>
          </div>
        </div>
      )}

      {seedSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{seedSuccessMsg}</span>
        </div>
      )}

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((item) => {
          const Icon = CATEGORY_ICONS[item.category] || Layers;
          const isTesting = testingId === item.id;
          const testResult = testResults[item.id];
          const hasSecretsConfigured = item.credentials.some((c) => c.isSecret && c.status === 'Configured');
          const hasMissingSecrets = item.credentials.some(
            (c) => c.isSecret && c.status === 'Missing' && c.requiredForProduction
          );

          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-gray-300 transition-all"
            >
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-gray-900 leading-snug">{item.name}</h3>
                      <span className="text-[11px] text-gray-500 font-medium">{item.provider}</span>
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

      {/* Edit Integration Settings Modal */}
      <Modal
        isOpen={Boolean(editingIntegration)}
        onClose={() => setEditingIntegration(null)}
        title={`Configuration : ${editingIntegration?.name || ''}`}
        size="lg"
      >
        <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg space-y-1 text-[11px]">
            <strong>Gestion Sécurisée des Secrets :</strong>
            <p>
              Les jetons d'accès et mots de passe restent hébergés sur le serveur dans les variables d'environnement Vercel.
              Cette interface vous permet d'ajuster l'URL d'API, le mode Sandbox/Production et l'état du connecteur.
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
            <Button variant="ghost" type="button" onClick={() => setEditingIntegration(null)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-orange-600 hover:bg-orange-700 font-bold text-white"
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer la Configuration'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
