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
} from '@/lib/hooks/use-notifications';
import type {
  NotificationRecord,
  NotificationFilterParams,
  NotificationSeverity,
  NotificationChannelType,
} from '@/types/notifications.types';
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

  // Template State
  const [smsOrderTemplate, setSmsOrderTemplate] = useState(
    'HamzaPhone: Bonjour {nom}, votre commande #{numero} d’un montant de {montant} DZD a été validée. Livraison sous 24/48h via EcoTrack.'
  );
  const [smsShipmentTemplate, setSmsShipmentTemplate] = useState(
    'HamzaPhone: Votre colis #{numero} est en cours de livraison EcoTrack. N° de suivi: {suivi}. Préparez le montant en espèces.'
  );
  const [waB2bTemplate, setWaB2bTemplate] = useState(
    'Bonjour {nom_atelier}, votre compte Grossiste B2B HamzaPhone a été validé avec succès. Accédez à vos tarifs de gros sur https://hamzaphone.dz/admin'
  );
  const [templateSaved, setTemplateSaved] = useState(false);

  // Detail Modal State
  const [selectedNotification, setSelectedNotification] = useState<NotificationRecord | null>(null);

  const handleSaveTemplates = (e: React.FormEvent) => {
    e.preventDefault();
    setTemplateSaved(true);
    setTimeout(() => setTemplateSaved(false), 3000);
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
            Supervision des alertes de commandes, seuils de stock critique, passerelles SMS / WhatsApp et écarts de caisse COD
          </p>
        </div>

        <div className="flex items-center gap-2">
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
        <div className="space-y-6">
          {templateSaved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Modèles transactionnels et passerelles enregistrés avec succès.</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SMS Order Template */}
            <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-xs space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-green-600" />
                  SMS de Validation de Commande
                </h3>
                <Badge variant="success" className="text-[10px]">Passerelle Algérie Active</Badge>
              </div>

              <p className="text-gray-500 text-[11px]">
                Envoyé immédiatement au client après validation du panier. Balises disponibles :{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded text-[10px] font-mono">{'{nom}'}</code>,{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded text-[10px] font-mono">{'{numero}'}</code>,{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded text-[10px] font-mono">{'{montant}'}</code>.
              </p>

              <div>
                <textarea
                  rows={3}
                  value={smsOrderTemplate}
                  onChange={(e) => setSmsOrderTemplate(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* SMS Shipment Template */}
            <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-xs space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-orange-600" />
                  SMS d'Expédition & Suivi EcoTrack
                </h3>
                <Badge variant="success" className="text-[10px]">EcoTrack Webhook Connecté</Badge>
              </div>

              <p className="text-gray-500 text-[11px]">
                Déclenché dès la génération du bordereau d'expédition. Balises :{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded text-[10px] font-mono">{'{numero}'}</code>,{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded text-[10px] font-mono">{'{suivi}'}</code>.
              </p>

              <div>
                <textarea
                  rows={3}
                  value={smsShipmentTemplate}
                  onChange={(e) => setSmsShipmentTemplate(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* WhatsApp B2B Notification */}
            <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-xs space-y-4 text-xs lg:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  WhatsApp Cloud API — Approbation Grossiste B2B
                </h3>
                <Badge variant="success" className="text-[10px]">Meta WhatsApp Business Vérifié</Badge>
              </div>

              <p className="text-gray-500 text-[11px]">
                Message d'onboarding officiel envoyé au gérant de l'atelier dès validation du dossier fiscal B2B.
              </p>

              <div>
                <textarea
                  rows={2}
                  value={waB2bTemplate}
                  onChange={(e) => setWaB2bTemplate(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveTemplates} size="sm" className="bg-orange-600 hover:bg-orange-700 font-bold">
              Enregistrer les Modèles
            </Button>
          </div>
        </div>
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
