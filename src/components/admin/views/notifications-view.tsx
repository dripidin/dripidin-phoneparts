'use client';

// HamzaPhone Admin Notification Center & Operational Communication Gateway
// Hub for multi-channel alerts (Dashboard, SMS, WhatsApp, Telegram), template management, and staff preferences.

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import {
  useNotificationsList,
  useNotificationMetrics,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  useRetryNotification,
  useStaffNotificationPreferences,
  useUpdateStaffNotificationPreferences,
  useNotificationTemplates,
  useSaveNotificationTemplate,
  useResetNotificationTemplate,
  useProcessNotificationQueue,
} from '@/lib/hooks/use-notifications';
import type {
  NotificationRecord,
  NotificationFilterParams,
  NotificationSeverity,
  NotificationChannelType,
  DomainEventType,
} from '@/types/notifications.types';
import {
  CONFIGURABLE_EVENT_TYPES,
  NOTIFICATION_EVENT_REGISTRY,
} from '@/lib/notifications/template-engine/event-registry';
import {
  getVariableDefinitionsForEvent,
  SAMPLE_PREVIEW_DATA,
} from '@/lib/notifications/template-engine/variable-registry';
import { renderTemplate } from '@/lib/notifications/template-engine/variable-renderer';
import { getSystemDefaultTemplate } from '@/lib/notifications/template-engine/system-defaults';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Clock,
  Trash2,
  CheckCheck,
  RotateCcw,
  Search,
  MessageSquare,
  Mail,
  Send,
  Smartphone,
  Sliders,
  Sparkles,
  ShieldCheck,
  Truck,
  DollarSign,
  Package,
  Layers,
  Building2,
  FileSpreadsheet,
  Check,
  RefreshCw,
  Eye,
  Undo2,
  Save,
  HelpCircle,
} from 'lucide-react';

export function NotificationsView() {
  const [activeTab, setActiveTab] = useState<'INBOX' | 'TEMPLATES' | 'PREFERENCES'>('INBOX');

  // Filters State
  const [filters, setFilters] = useState<NotificationFilterParams>({
    channel: 'ALL',
    severity: 'ALL',
    status: 'ALL',
    entityType: 'ALL',
    read: 'ALL',
  });
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'UNREAD' | 'CRITICAL' | 'ORDERS' | 'INVENTORY' | 'PAYMENTS' | 'B2B'>('ALL');

  // Queries
  const { data: notifications = [], isLoading } = useNotificationsList({
    ...filters,
    read: quickFilter === 'UNREAD' ? false : filters.read,
    severity: quickFilter === 'CRITICAL' ? 'CRITICAL' : filters.severity,
    entityType:
      quickFilter === 'ORDERS'
        ? 'ORDER'
        : quickFilter === 'INVENTORY'
        ? 'INVENTORY'
        : quickFilter === 'PAYMENTS'
        ? 'PAYMENT'
        : quickFilter === 'B2B'
        ? 'B2B_APPLICATION'
        : filters.entityType,
  });

  const { data: metrics } = useNotificationMetrics();
  const { data: staffPrefs } = useStaffNotificationPreferences();

  // Mutations
  const markReadMutation = useMarkNotificationAsRead();
  const markAllReadMutation = useMarkAllNotificationsAsRead();
  const deleteMutation = useDeleteNotification();
  const retryMutation = useRetryNotification();
  const updatePrefsMutation = useUpdateStaffNotificationPreferences();

  // Queue Sweep Mutation
  const processQueueMutation = useProcessNotificationQueue();
  const [sweepResult, setSweepResult] = useState<{ processed: number; succeeded: number; failed: number } | null>(null);

  // Detail Modal State
  const [selectedNotification, setSelectedNotification] = useState<NotificationRecord | null>(null);

  const handleSweepQueue = async () => {
    try {
      const res = await processQueueMutation.mutateAsync();
      setSweepResult(res);
      setTimeout(() => setSweepResult(null), 5000);
    } catch {
      // Handled by UI
    }
  };

  const getSeverityBadge = (severity: NotificationSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <Badge variant="destructive" className="text-[10px] flex items-center gap-1 font-bold">
            <AlertOctagon className="w-3 h-3" /> Critique
          </Badge>
        );
      case 'WARNING':
        return (
          <Badge variant="outline" className="text-amber-800 bg-amber-50 border-amber-200 text-[10px] flex items-center gap-1 font-bold">
            <AlertTriangle className="w-3 h-3" /> Attention
          </Badge>
        );
      case 'SUCCESS':
        return (
          <Badge variant="success" className="text-[10px] flex items-center gap-1 font-bold">
            <CheckCircle2 className="w-3 h-3" /> Succès
          </Badge>
        );
      case 'INFO':
      default:
        return (
          <Badge variant="secondary" className="text-[10px] flex items-center gap-1">
            <Info className="w-3 h-3 text-blue-500" /> Information
          </Badge>
        );
    }
  };

  const getChannelBadge = (channel: NotificationChannelType) => {
    switch (channel) {
      case 'SMS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
            <Smartphone className="w-3 h-3" /> SMS Algérie
          </span>
        );
      case 'WHATSAPP':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <MessageSquare className="w-3 h-3" /> WhatsApp API
          </span>
        );
      case 'EMAIL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Mail className="w-3 h-3" /> Email
          </span>
        );
      case 'TELEGRAM':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <Send className="w-3 h-3" /> Telegram Bot
          </span>
        );
      case 'DASHBOARD':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
            <Bell className="w-3 h-3" /> Dashboard
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-600" />
            Centre de Notifications & Alertes Opérationnelles
          </h2>
          <p className="text-xs text-gray-500">
            Supervision des alertes de commandes, seuils de stock critique, passerelles SMS / WhatsApp et modèles transactionnels
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSweepQueue}
            disabled={processQueueMutation.isPending}
            className="text-xs h-8 flex items-center gap-1.5 font-semibold text-gray-700 hover:text-orange-600 border-gray-300"
            title="Déclencher le balayage asynchrone des notifications en attente ou à réexpédier"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${processQueueMutation.isPending ? 'animate-spin text-orange-600' : ''}`} />
            {processQueueMutation.isPending ? 'Traitement...' : 'Balayer la file'}
          </Button>

          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('INBOX')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'INBOX' ? 'bg-white text-orange-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              Boîte de Réception
              {(metrics?.totalUnreadCount ?? 0) > 0 && (
                <span className="px-1.5 py-0.2 bg-orange-600 text-white rounded-full text-[9px] font-bold">
                  {metrics?.totalUnreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('TEMPLATES')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'TEMPLATES' ? 'bg-white text-orange-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Modèles & Passerelles
            </button>

            <button
              onClick={() => setActiveTab('PREFERENCES')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'PREFERENCES' ? 'bg-white text-orange-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Préférences
            </button>
          </div>
        </div>
      </div>

      {/* Sweep Queue Result Banner */}
      {sweepResult && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Balayage terminé : <strong>{sweepResult.processed}</strong> notifications vérifiées (
              <span className="text-emerald-700 font-bold">{sweepResult.succeeded} expédiée(s)</span>,{' '}
              <span className="text-red-700 font-bold">{sweepResult.failed} échec(s) / replanifiée(s)</span>).
            </span>
          </div>
          <button onClick={() => setSweepResult(null)} className="text-blue-500 hover:text-blue-800 font-bold text-sm px-1">
            ✕
          </button>
        </div>
      )}

      {/* Metric Counters Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <span className="text-gray-500 block text-[11px]">Total Non Lues</span>
          <strong className="text-lg font-bold text-gray-900 block mt-0.5">
            {metrics?.totalUnreadCount ?? 0}
          </strong>
          <span className="text-[10px] text-gray-400">Alertes à traiter</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <span className="text-gray-500 block text-[11px]">Alertes Critiques</span>
          <strong className="text-lg font-bold text-red-600 block mt-0.5">
            {metrics?.criticalCount ?? 0}
          </strong>
          <span className="text-[10px] text-red-400 font-bold">Ruptures stock / Échecs</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <span className="text-gray-500 block text-[11px]">Avertissements</span>
          <strong className="text-lg font-bold text-amber-600 block mt-0.5">
            {metrics?.warningCount ?? 0}
          </strong>
          <span className="text-[10px] text-gray-400">Écarts COD / Retards</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <span className="text-gray-500 block text-[11px]">Événements Aujourd’hui</span>
          <strong className="text-lg font-bold text-blue-600 block mt-0.5">
            {metrics?.todayCount ?? 0}
          </strong>
          <span className="text-[10px] text-gray-400">Dernières 24 heures</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <span className="text-gray-500 block text-[11px]">Échecs d'Envoi</span>
          <strong className="text-lg font-bold text-purple-600 block mt-0.5">
            {metrics?.failedDeliveriesCount ?? 0}
          </strong>
          <span className="text-[10px] text-gray-400">Passerelles à réexpédier</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INBOX                                                              */}
      {/* ========================================================================= */}
      {activeTab === 'INBOX' && (
        <div className="space-y-4">
          {/* Quick Filter Pills */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuickFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                  quickFilter === 'ALL' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Toutes ({notifications.length})
              </button>
              <button
                onClick={() => setQuickFilter('UNREAD')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  quickFilter === 'UNREAD'
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Non lues ({metrics?.totalUnreadCount ?? 0})
              </button>
              <button
                onClick={() => setQuickFilter('CRITICAL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  quickFilter === 'CRITICAL'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
                }`}
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                Critiques ({metrics?.criticalCount ?? 0})
              </button>
              <button
                onClick={() => setQuickFilter('ORDERS')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                  quickFilter === 'ORDERS' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Commandes
              </button>
              <button
                onClick={() => setQuickFilter('INVENTORY')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                  quickFilter === 'INVENTORY' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Stock Belfort
              </button>
              <button
                onClick={() => setQuickFilter('PAYMENTS')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                  quickFilter === 'PAYMENTS' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Paiements COD
              </button>
              <button
                onClick={() => setQuickFilter('B2B')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                  quickFilter === 'B2B' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Grossistes B2B
              </button>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending || (metrics?.totalUnreadCount ?? 0) === 0}
              className="text-xs shrink-0"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              Tout marquer comme lu
            </Button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <Input
                placeholder="Rechercher titre, message, N° commande..."
                value={filters.searchQuery || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
                className="pl-8 text-xs h-8"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 font-bold">Canal :</span>
                <Select
                  value={filters.channel || 'ALL'}
                  onChange={(e) => setFilters((prev) => ({ ...prev, channel: e.target.value as any }))}
                  className="text-xs h-8"
                >
                  <option value="ALL">Tous les canaux</option>
                  <option value="DASHBOARD">Dashboard</option>
                  <option value="SMS">SMS Passerelle</option>
                  <option value="WHATSAPP">WhatsApp Cloud API</option>
                  <option value="TELEGRAM">Telegram Bot</option>
                </Select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 font-bold">Gravité :</span>
                <Select
                  value={filters.severity || 'ALL'}
                  onChange={(e) => setFilters((prev) => ({ ...prev, severity: e.target.value as any }))}
                  className="text-xs h-8"
                >
                  <option value="ALL">Toutes</option>
                  <option value="CRITICAL">Critique</option>
                  <option value="WARNING">Attention</option>
                  <option value="INFO">Information</option>
                  <option value="SUCCESS">Succès</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="p-8 bg-white rounded-xl border border-gray-200 text-center text-gray-400 text-xs">
                Chargement des notifications en temps réel...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 bg-white rounded-xl border border-gray-200 text-center text-gray-400 text-xs">
                Aucune notification ne correspond aux filtres actuels.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 bg-white rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    !n.read
                      ? 'border-orange-200 bg-orange-50/20 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="pt-0.5">
                      {!n.read ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-600 mt-1" />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-300 mt-1" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className={`text-xs ${!n.read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                          {n.title}
                        </h4>
                        {getSeverityBadge(n.severity)}
                        {getChannelBadge(n.channel)}
                      </div>

                      <p className="text-gray-600 text-xs leading-relaxed">{n.message}</p>

                      <div className="flex items-center gap-3 text-[10px] text-gray-400 pt-0.5">
                        <span>{formatDate(n.createdAt)}</span>
                        {n.deliveredAt && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                              <Check className="w-3 h-3" /> Délivré
                            </span>
                          </>
                        )}
                        {n.errorInfo && (
                          <>
                            <span>•</span>
                            <span className="text-red-600 font-bold">{n.errorInfo}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    {n.status === 'FAILED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => retryMutation.mutate(n.id)}
                        disabled={retryMutation.isPending}
                        className="h-7 px-2 text-[11px] text-orange-700 border-orange-200 hover:bg-orange-50 font-bold"
                        title="Réessayer l'envoi"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Réessayer ({n.retryCount}/{n.maxRetries})
                      </Button>
                    )}

                    {!n.read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markReadMutation.mutate(n.id)}
                        className="h-7 px-2 text-[11px] text-gray-600 hover:text-gray-900"
                        title="Marquer comme lu"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Lu
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(n.id)}
                      className="h-7 px-2 text-[11px] text-gray-400 hover:text-red-600"
                      title="Supprimer la notification"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TEMPLATES & GATEWAYS                                               */}
      {/* ========================================================================= */}
      {activeTab === 'TEMPLATES' && (
        <NotificationTemplatesManager />
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STAFF NOTIFICATION PREFERENCES                                     */}
      {/* ========================================================================= */}
      {activeTab === 'PREFERENCES' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-6 text-xs max-w-2xl">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-orange-600" />
              Canaux & Préférences de Réception Personnelles
            </h3>
            <p className="text-gray-500 text-[11px]">
              Choisissez les catégories d'alertes à afficher sur votre tableau de bord et à recevoir par notification.
            </p>
          </div>

          <div className="divide-y divide-gray-100 space-y-3 pt-2">
            <label className="flex items-center justify-between pt-3 cursor-pointer">
              <div>
                <span className="font-bold text-gray-900 block">Nouvelles Commandes Clients & B2B</span>
                <span className="text-gray-500 text-[11px]">Alerte sonore et notification à chaque commande passée.</span>
              </div>
              <input
                type="checkbox"
                defaultChecked={staffPrefs?.newOrders ?? true}
                onChange={(e) => updatePrefsMutation.mutate({ newOrders: e.target.checked })}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
            </label>

            <label className="flex items-center justify-between pt-3 cursor-pointer">
              <div>
                <span className="font-bold text-gray-900 block">Alertes Stock Critique & Ruptures</span>
                <span className="text-gray-500 text-[11px]">Notification immédiate dès qu'un article passe sous son seuil.</span>
              </div>
              <input
                type="checkbox"
                defaultChecked={staffPrefs?.lowStockAlerts ?? true}
                onChange={(e) => updatePrefsMutation.mutate({ lowStockAlerts: e.target.checked })}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
            </label>

            <label className="flex items-center justify-between pt-3 cursor-pointer">
              <div>
                <span className="font-bold text-gray-900 block">Candidatures Grossistes B2B</span>
                <span className="text-gray-500 text-[11px]">Alerte lorsqu'un réparateur soumet son dossier RC/NIF.</span>
              </div>
              <input
                type="checkbox"
                defaultChecked={staffPrefs?.b2bApplications ?? true}
                onChange={(e) => updatePrefsMutation.mutate({ b2bApplications: e.target.checked })}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
            </label>

            <label className="flex items-center justify-between pt-3 cursor-pointer">
              <div>
                <span className="font-bold text-gray-900 block">Écarts de Paiement & Rapprochement COD</span>
                <span className="text-gray-500 text-[11px]">Alerte sur les divergences de caisse ou retenues EcoTrack.</span>
              </div>
              <input
                type="checkbox"
                defaultChecked={staffPrefs?.paymentDiscrepancies ?? true}
                onChange={(e) => updatePrefsMutation.mutate({ paymentDiscrepancies: e.target.checked })}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
            </label>

            <label className="flex items-center justify-between pt-3 cursor-pointer">
              <div>
                <span className="font-bold text-gray-900 block">Échecs de Livraison & Retours Transporteur</span>
                <span className="text-gray-500 text-[11px]">Suivi des colis non remis ou en instance au stopdesk.</span>
              </div>
              <input
                type="checkbox"
                defaultChecked={staffPrefs?.deliveryFailures ?? true}
                onChange={(e) => updatePrefsMutation.mutate({ deliveryFailures: e.target.checked })}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: Persistent Notification Templates Workstation
// =============================================================================

const CHANNEL_ICONS: Record<NotificationChannelType, React.ElementType> = {
  DASHBOARD: Bell,
  SMS: Smartphone,
  WHATSAPP: MessageSquare,
  EMAIL: Mail,
  TELEGRAM: Send,
};

const CHANNEL_LABELS: Record<NotificationChannelType, string> = {
  DASHBOARD: 'Dashboard In-App',
  SMS: 'SMS Passerelle',
  WHATSAPP: 'WhatsApp API',
  EMAIL: 'Email Transactionnel',
  TELEGRAM: 'Telegram Bot',
};

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  COMMERCE: { label: 'Commandes', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  PAYMENT: { label: 'Paiements & Caisse', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  LOGISTICS: { label: 'Logistique', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  B2B: { label: 'Grossistes B2B', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  INVENTORY: { label: 'Stock Belfort', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  AUTH: { label: 'Comptes & Sécurité', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

function NotificationTemplatesManager() {
  const [selectedEvent, setSelectedEvent] = useState<DomainEventType>('order.created');
  const [selectedChannel, setSelectedChannel] = useState<NotificationChannelType>('SMS');
  const [selectedLocale] = useState<string>('fr-DZ');
  const [eventSearch, setEventSearch] = useState<string>('');

  // Form State
  const [subject, setSubject] = useState<string>('');
  const [bodyText, setBodyText] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState<boolean>(false);

  // Queries & Mutations
  const { data: dbTemplates, isLoading } = useNotificationTemplates();
  const saveMutation = useSaveNotificationTemplate();
  const resetMutation = useResetNotificationTemplate();

  const eventDef = NOTIFICATION_EVENT_REGISTRY[selectedEvent] || NOTIFICATION_EVENT_REGISTRY['order.created'];
  const availableVars = getVariableDefinitionsForEvent(selectedEvent);

  // Find existing DB template
  const currentDbTemplate = dbTemplates?.find(
    (t) => t.eventType === selectedEvent && t.channel === selectedChannel && t.locale === selectedLocale
  );
  const systemDefault = getSystemDefaultTemplate(selectedEvent, selectedChannel, selectedLocale);

  // Sync form state when selection changes or data loads
  React.useEffect(() => {
    if (currentDbTemplate) {
      setSubject(currentDbTemplate.subject || '');
      setBodyText(currentDbTemplate.bodyText || '');
      setIsActive(currentDbTemplate.isActive);
    } else if (systemDefault) {
      setSubject(systemDefault.subject || '');
      setBodyText(systemDefault.bodyText || '');
      setIsActive(true);
    } else {
      setSubject('');
      setBodyText('');
      setIsActive(true);
    }
    setIsDirty(false);
  }, [selectedEvent, selectedChannel, selectedLocale, currentDbTemplate, systemDefault]);

  // Insert Variable helper
  const handleInsertVariable = (tokenName: string) => {
    const token = `{{${tokenName}}}`;
    setBodyText((prev) => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + token);
    setIsDirty(true);
  };

  // Save handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    try {
      await saveMutation.mutateAsync({
        eventType: selectedEvent,
        channel: selectedChannel,
        locale: selectedLocale,
        subject: eventDef.hasSubject || selectedChannel === 'EMAIL' || selectedChannel === 'DASHBOARD' ? subject : undefined,
        bodyText,
        isActive,
      });

      setIsDirty(false);
      setStatusMessage({
        type: 'success',
        text: `Modèle [${eventDef.displayName} • ${CHANNEL_LABELS[selectedChannel]}] enregistré avec succès.`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Erreur lors de l’enregistrement du modèle.',
      });
    }
  };

  // Reset to default handler
  const handleResetConfirm = async () => {
    try {
      await resetMutation.mutateAsync({
        eventType: selectedEvent,
        channel: selectedChannel,
        locale: selectedLocale,
      });

      setResetModalOpen(false);
      setIsDirty(false);
      setStatusMessage({
        type: 'success',
        text: `Modèle réinitialisé aux valeurs d’usine avec succès.`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Erreur lors de la réinitialisation.',
      });
    }
  };

  // Filtered Events
  const filteredEvents: DomainEventType[] = CONFIGURABLE_EVENT_TYPES.filter((evt: DomainEventType) => {
    const def = NOTIFICATION_EVENT_REGISTRY[evt];
    if (!def) return false;
    if (!eventSearch.trim()) return true;
    const q = eventSearch.toLowerCase();
    return (
      (def.displayName || '').toLowerCase().includes(q) ||
      (def.descriptionFr || '').toLowerCase().includes(q) ||
      evt.toLowerCase().includes(q) ||
      (def.category || '').toLowerCase().includes(q)
    );
  });

  // SMS Guidance calculation
  const smsLength = bodyText.length;
  const isSms = selectedChannel === 'SMS';
  const smsSegments = smsLength <= 160 ? 1 : Math.ceil(smsLength / 153);
  const isMultipartSms = smsSegments > 1;

  // Safe Deterministic Preview Rendering
  let renderedSubjectPreview = '';
  let renderedBodyPreview = '';
  try {
    renderedSubjectPreview = renderTemplate(subject, SAMPLE_PREVIEW_DATA);
    renderedBodyPreview = renderTemplate(bodyText, SAMPLE_PREVIEW_DATA);
  } catch {
    renderedBodyPreview = bodyText;
  }

  const isCustomized = Boolean(currentDbTemplate && !currentDbTemplate.isSystemDefault);

  return (
    <div className="space-y-6">
      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="font-bold text-sm px-1">
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Events Master on Left, Template Editor on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Event List */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200 shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              Événements Configurables ({CONFIGURABLE_EVENT_TYPES.length})
            </h3>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            <Input
              placeholder="Filtrer événements..."
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>

          <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredEvents.map((evt: DomainEventType) => {
              const def = NOTIFICATION_EVENT_REGISTRY[evt];
              const isSelected = selectedEvent === evt;
              const cat = (def && CATEGORY_LABELS[def.category]) || { label: def?.category || 'Événement', color: 'bg-gray-100 text-gray-700' };

              return (
                <button
                  key={evt}
                  onClick={() => {
                    setSelectedEvent(evt);
                    if (def?.supportedChannels && !def.supportedChannels.includes(selectedChannel)) {
                      setSelectedChannel(def.defaultChannels[0] || 'SMS');
                    }
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all text-xs flex flex-col gap-1 ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/40 shadow-xs ring-1 ring-orange-500'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${isSelected ? 'text-orange-900' : 'text-gray-900'}`}>
                      {def?.displayName || evt}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${cat.color}`}>
                      {cat.label}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-500 line-clamp-1">{def?.descriptionFr || ''}</p>

                  <div className="flex items-center gap-1.5 pt-1 text-[10px] text-gray-400">
                    <span>Canaux :</span>
                    <div className="flex items-center gap-1">
                      {(def?.supportedChannels || def?.defaultChannels || []).map((c: NotificationChannelType) => {
                        const Icon = CHANNEL_ICONS[c] || Bell;
                        return (
                          <span
                            key={c}
                            title={CHANNEL_LABELS[c]}
                            className={`p-0.5 rounded ${
                              def?.defaultChannels.includes(c) ? 'text-orange-600 bg-orange-100' : 'text-gray-400'
                            }`}
                          >
                            <Icon className="w-2.5 h-2.5" />
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Template Workstation & Preview */}
        <div className="lg:col-span-8 space-y-4">
          {/* Channel Selector Bar */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(['DASHBOARD', 'SMS', 'WHATSAPP', 'EMAIL', 'TELEGRAM'] as NotificationChannelType[]).map((chan) => {
                const Icon = CHANNEL_ICONS[chan];
                const isSupported = eventDef?.supportedChannels?.includes(chan) ?? true;
                const isSelected = selectedChannel === chan;

                return (
                  <button
                    key={chan}
                    onClick={() => setSelectedChannel(chan)}
                    disabled={!isSupported}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-gray-900 text-white shadow-xs'
                        : isSupported
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-300 cursor-not-allowed opacity-50'
                    }`}
                    title={!isSupported ? 'Canal non supporté pour cet événement' : CHANNEL_LABELS[chan]}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{CHANNEL_LABELS[chan]}</span>
                    {!isSupported && <span className="text-[9px] font-normal">(N/A)</span>}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              {isCustomized ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <Sliders className="w-3 h-3" /> Personnalisé (DB v{currentDbTemplate?.version || 1})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Système d'origine
                </span>
              )}
            </div>
          </div>

          {/* Main Editor Card */}
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-5 text-xs">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <span>{eventDef.displayName}</span>
                  <span className="text-gray-400 font-normal">→</span>
                  <span className="text-orange-600 font-semibold">{CHANNEL_LABELS[selectedChannel]}</span>
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5">{eventDef?.descriptionFr || ''}</p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                  <span>Activer ce modèle :</span>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => {
                      setIsActive(e.target.checked);
                      setIsDirty(true);
                    }}
                    className="rounded text-orange-600 focus:ring-orange-500 h-4 w-4"
                  />
                </label>
              </div>
            </div>

            {/* Subject field (for Email & Dashboard) */}
            {(eventDef.hasSubject || selectedChannel === 'EMAIL' || selectedChannel === 'DASHBOARD') && (
              <div className="space-y-1.5">
                <label className="font-bold text-gray-700 block">
                  Objet / Titre de la notification <span className="text-red-500">*</span>
                </label>
                <Input
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Ex: Commande confirmée #{{orderNumber}}"
                  className="text-xs h-9 font-mono"
                  required
                />
              </div>
            )}

            {/* Body Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-gray-700 block">
                  Corps du message transactionnel <span className="text-red-500">*</span>
                </label>

                {/* SMS Character counter guidance */}
                {isSms && (
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold ${
                        smsLength > 306
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : isMultipartSms
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-green-50 text-green-700 border border-green-200'
                      }`}
                    >
                      {smsLength} car. ({smsSegments} segment{isMultipartSms ? 's concatinés' : ' GSM-7'})
                    </span>
                  </div>
                )}
              </div>

              <textarea
                rows={selectedChannel === 'EMAIL' ? 7 : 4}
                value={bodyText}
                onChange={(e) => {
                  setBodyText(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full p-3 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono leading-relaxed"
                placeholder="Saisissez le texte du message avec les variables autorisées {{variableName}}..."
                required
              />
            </div>

            {/* Available Variables Palette */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-gray-700 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-orange-600" />
                  Variables autorisées pour cet événement (Cliquez pour insérer) :
                </span>
                <span className="text-gray-400">Total : {availableVars.length}</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {availableVars.map((v) => (
                  <button
                    key={v.token}
                    type="button"
                    onClick={() => handleInsertVariable(v.token)}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-orange-50 hover:border-orange-300 border border-gray-300 rounded text-[11px] font-mono font-semibold text-gray-700 transition-all shadow-2xs"
                    title={`${v.description} (Type: ${v.type})`}
                  >
                    <span>{`{{${v.token}}}`}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Deterministic Live Preview Panel */}
            <div className="p-4 bg-gray-900 rounded-xl text-white space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold flex items-center gap-1.5 text-orange-400">
                  <Eye className="w-4 h-4" />
                  Aperçu Déterministe en Temps Réel
                </span>
                <span className="text-[10px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                  Données synthétiques de test • Zéro PII client
                </span>
              </div>

              <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 font-mono text-xs space-y-2">
                {renderedSubjectPreview && (
                  <div className="pb-1.5 border-b border-gray-700 text-gray-200">
                    <span className="text-gray-400 text-[10px] uppercase block font-sans">Objet :</span>
                    <strong className="text-white">{renderedSubjectPreview}</strong>
                  </div>
                )}
                <div className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {renderedBodyPreview || <span className="text-gray-500 italic">Aucun texte à prévisualiser</span>}
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
              <div>
                {isCustomized ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setResetModalOpen(true)}
                    disabled={resetMutation.isPending}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 font-bold"
                  >
                    <Undo2 className="w-3.5 h-3.5 mr-1" />
                    Réinitialiser au défaut système
                  </Button>
                ) : (
                  <span className="text-[11px] text-gray-400 italic">
                    Modèle par défaut actif. Vos modifications créeront une version personnalisée.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={saveMutation.isPending}
                  className="bg-orange-600 hover:bg-orange-700 font-bold text-xs"
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer le modèle'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {resetModalOpen && (
        <Modal
          isOpen={resetModalOpen}
          onClose={() => setResetModalOpen(false)}
          title="Réinitialiser aux valeurs système par défaut"
        >
          <div className="space-y-4 text-xs">
            <p className="text-gray-600 leading-relaxed">
              Êtes-vous certain de vouloir réinitialiser le modèle pour l’événement{' '}
              <strong className="text-gray-900">{eventDef.displayName}</strong> sur le canal{' '}
              <strong className="text-gray-900">{CHANNEL_LABELS[selectedChannel]}</strong> ?
            </p>
            <p className="text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              Toutes vos personnalisations textuelles pour ce modèle seront supprimées et le texte d’usine
              déterministe sera restauré. Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setResetModalOpen(false)}>
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={handleResetConfirm}
                disabled={resetMutation.isPending}
                className="bg-red-600 hover:bg-red-700 font-bold text-white"
              >
                {resetMutation.isPending ? 'Réinitialisation...' : 'Confirmer la réinitialisation'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
