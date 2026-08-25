// HamzaPhone Analytics & Business Intelligence Dashboard Console

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Smartphone,
  ShoppingBag,
  Package,
  Truck,
  Users,
  Search,
  Filter,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import { formatDZD } from '@/lib/utils';
import { useAnalyticsOverview, useExportAnalyticsReport } from '@/lib/hooks/use-analytics';
import { AnalyticsPeriod } from '@/types/analytics.types';

export function AnalyticsView() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const [customerType, setCustomerType] = useState<'ALL' | 'B2C' | 'B2B'>('ALL');
  const [activeTab, setActiveTab] = useState<
    'sales' | 'orders_funnel' | 'products_search' | 'b2c_b2b' | 'inventory' | 'logistics_payments'
  >('sales');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [exportingType, setExportingType] = useState<string | null>(null);

  const { data: report, isLoading, isError, refetch } = useAnalyticsOverview({
    period,
    customerType,
    startDate: customStart || undefined,
    endDate: customEnd || undefined,
  });

  const exportReport = useExportAnalyticsReport();

  const handleExport = async (
    type: 'SALES' | 'ORDERS' | 'PRODUCTS' | 'INVENTORY' | 'DELIVERY' | 'PAYMENTS'
  ) => {
    setExportingType(type);
    try {
      await exportReport.mutateAsync({
        reportType: type,
        params: {
          period,
          customerType,
          startDate: customStart || undefined,
          endDate: customEnd || undefined,
        },
      });
    } finally {
      setExportingType(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-8 h-8 border-3 border-orange-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-500">
          Agrégation des données opérationnelles HamzaPhone en cours...
        </p>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
        <h3 className="text-base font-bold text-red-900">
          Impossible de charger les statistiques
        </h3>
        <p className="text-xs text-red-700">
          Vérifiez vos habilitations RBAC (permission <code className="bg-red-100 px-1 py-0.5 rounded">analytics.read</code> requise).
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const { sales, orders, products, customers, comparison, inventory, delivery, payments, search, funnel } = report;

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Statistiques & Business Intelligence (Belfort)
              </h2>
              <p className="text-xs text-gray-500">
                Données réelles agrégées — Fuseau horaire Algérie ({report.timezone})
              </p>
            </div>
          </div>
        </div>

        {/* Global Filters & Export Dropdown */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Selector */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-lg transition ${
                period === 'today'
                  ? 'bg-white text-gray-900 font-bold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => setPeriod('7d')}
              className={`px-3 py-1.5 rounded-lg transition ${
                period === '7d'
                  ? 'bg-white text-gray-900 font-bold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              7 Jours
            </button>
            <button
              onClick={() => setPeriod('30d')}
              className={`px-3 py-1.5 rounded-lg transition ${
                period === '30d'
                  ? 'bg-white text-gray-900 font-bold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              30 Jours
            </button>
            <button
              onClick={() => setPeriod('90d')}
              className={`px-3 py-1.5 rounded-lg transition ${
                period === '90d'
                  ? 'bg-white text-gray-900 font-bold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              90 Jours
            </button>
          </div>

          {/* Segment Selector */}
          <select
            value={customerType}
            onChange={(e) => setCustomerType(e.target.value as any)}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="ALL">Tous les Segments</option>
            <option value="B2C">Particuliers (B2C)</option>
            <option value="B2B">Grossistes / Ateliers (B2B)</option>
          </select>

          {/* Export CSV Menu */}
          <div className="relative group">
            <button
              disabled={Boolean(exportingType)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {exportingType ? 'Export en cours...' : 'Exporter Rapport'}
            </button>

            <div className="absolute right-0 top-full mt-1 hidden group-hover:block w-48 bg-white border border-gray-200 rounded-xl shadow-lg p-1.5 z-20 space-y-1">
              <button
                onClick={() => handleExport('SALES')}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-lg font-medium"
              >
                📊 Rapport des Ventes (CSV)
              </button>
              <button
                onClick={() => handleExport('PRODUCTS')}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-lg font-medium"
              >
                📱 Performance Produits (CSV)
              </button>
              <button
                onClick={() => handleExport('INVENTORY')}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-lg font-medium"
              >
                📦 Rapport des Stocks (CSV)
              </button>
              <button
                onClick={() => handleExport('DELIVERY')}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-lg font-medium"
              >
                🚚 Logistique 58 Wilayas (CSV)
              </button>
              <button
                onClick={() => handleExport('PAYMENTS')}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-lg font-medium"
              >
                💰 Rapprochement COD (CSV)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('sales')}
          className={`pb-2.5 px-3.5 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
            activeTab === 'sales'
              ? 'border-orange-600 text-orange-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Ventes & Rentabilité
        </button>
        <button
          onClick={() => setActiveTab('orders_funnel')}
          className={`pb-2.5 px-3.5 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
            activeTab === 'orders_funnel'
              ? 'border-orange-600 text-orange-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Commandes & Entonnoir
        </button>
        <button
          onClick={() => setActiveTab('products_search')}
          className={`pb-2.5 px-3.5 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
            activeTab === 'products_search'
              ? 'border-orange-600 text-orange-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          Produits & Recherches
        </button>
        <button
          onClick={() => setActiveTab('b2c_b2b')}
          className={`pb-2.5 px-3.5 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
            activeTab === 'b2c_b2b'
              ? 'border-orange-600 text-orange-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Comparatif B2C vs B2B
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-2.5 px-3.5 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'border-orange-600 text-orange-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Package className="w-4 h-4" />
          Stocks & Entrepôt
        </button>
        <button
          onClick={() => setActiveTab('logistics_payments')}
          className={`pb-2.5 px-3.5 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
            activeTab === 'logistics_payments'
              ? 'border-orange-600 text-orange-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Truck className="w-4 h-4" />
          Logistique 58 Wilayas & COD
        </button>
      </div>

      {/* TAB 1: SALES & PROFITABILITY */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Chiffre d'Affaires Brut
              </p>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                {formatDZD(sales.grossSalesDzd)}
              </h3>
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 pt-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Ventes totales sur la période
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Chiffre d'Affaires Net
              </p>
              <h3 className="text-2xl font-black text-emerald-600 tracking-tight">
                {formatDZD(sales.netSalesDzd)}
              </h3>
              <p className="text-xs text-gray-500 pt-1">Commandes effectivement livrées</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Espèces Encaissées COD
              </p>
              <h3 className="text-2xl font-black text-blue-600 tracking-tight">
                {formatDZD(sales.codCollectedDzd)}
              </h3>
              <p className="text-xs text-gray-500 pt-1">
                Rapproché : {formatDZD(sales.reconciledDzd)}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Marge Brute Réalisée
              </p>
              {sales.grossMarginDzd !== null && sales.grossMarginDzd !== undefined ? (
                <>
                  <h3 className="text-2xl font-black text-purple-600 tracking-tight">
                    {formatDZD(sales.grossMarginDzd)}
                  </h3>
                  <p className="text-xs text-purple-700 font-semibold pt-1">
                    Taux de Marge : {sales.grossMarginPercentage}%
                  </p>
                </>
              ) : (
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                    Accès Réservé Direction
                  </span>
                  <p className="text-[11px] text-gray-400 mt-1">Requiert pricing.read</p>
                </div>
              )}
            </div>
          </div>

          {/* Sales Breakdown Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-orange-600" />
                Décomposition des Flux Financiers
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/60 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 font-medium">Revenus Frais de Livraison</span>
                    <span className="font-bold text-gray-900">{formatDZD(sales.deliveryRevenueDzd)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 font-medium">Remises B2B Grossistes</span>
                    <span className="font-bold text-orange-600">-{formatDZD(sales.discountsDzd)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 font-medium">Retours / Annulations</span>
                    <span className="font-bold text-red-600">-{formatDZD(sales.refundedDzd)}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/60 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 font-medium">COD en Cours de Collecte</span>
                    <span className="font-bold text-amber-600">{formatDZD(sales.codOutstandingDzd)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 font-medium">COD Clôturé & Rapproché</span>
                    <span className="font-bold text-emerald-600">{formatDZD(sales.reconciledDzd)}</span>
                  </div>
                  {sales.costOfGoodsSoldDzd !== null && sales.costOfGoodsSoldDzd !== undefined && (
                    <div className="flex justify-between text-xs border-t border-gray-200 pt-1.5">
                      <span className="text-gray-600 font-medium">Coût des Marchandises (COGS)</span>
                      <span className="font-bold text-gray-900">{formatDZD(sales.costOfGoodsSoldDzd)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Cohort Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Part du Chiffre d'Affaires Grossistes
              </h3>
              <div className="text-center py-4 space-y-2">
                <p className="text-4xl font-black text-blue-600">
                  {comparison.b2bRevenueSharePercentage}%
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  Généré par les ateliers de réparation et grossistes B2B
                </p>
              </div>

              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden flex">
                <div
                  className="bg-blue-600 h-full"
                  style={{ width: `${comparison.b2bRevenueSharePercentage}%` }}
                />
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${100 - comparison.b2bRevenueSharePercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-gray-500 font-semibold">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600" /> B2B : {formatDZD(comparison.b2b.revenueDzd)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> B2C : {formatDZD(comparison.b2c.revenueDzd)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS & FUNNEL */}
      {activeTab === 'orders_funnel' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs text-center space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Total Commandes</p>
              <h4 className="text-xl font-black text-gray-900">{orders.totalOrders}</h4>
            </div>
            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs text-center space-y-1">
              <p className="text-[10px] font-bold text-amber-600 uppercase">En Attente</p>
              <h4 className="text-xl font-black text-amber-600">{orders.pendingCount}</h4>
            </div>
            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs text-center space-y-1">
              <p className="text-[10px] font-bold text-blue-600 uppercase">Expédiées</p>
              <h4 className="text-xl font-black text-blue-600">{orders.shippedCount}</h4>
            </div>
            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs text-center space-y-1">
              <p className="text-[10px] font-bold text-emerald-600 uppercase">Livrées</p>
              <h4 className="text-xl font-black text-emerald-600">{orders.deliveredCount}</h4>
            </div>
            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs text-center space-y-1">
              <p className="text-[10px] font-bold text-red-600 uppercase">Annulées</p>
              <h4 className="text-xl font-black text-red-600">{orders.cancelledCount}</h4>
            </div>
            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs text-center space-y-1">
              <p className="text-[10px] font-bold text-purple-600 uppercase">Panier Moyen</p>
              <h4 className="text-xl font-black text-purple-600">
                {formatDZD(orders.averageOrderValueDzd)}
              </h4>
            </div>
          </div>

          {/* Conversion Funnel */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                  Entonnoir de Conversion Vitrine & Commande
                </h3>
                <p className="text-xs text-gray-500">
                  Parcours visiteur de la découverte à la livraison du colis
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 font-medium block">Taux de Conversion Global</span>
                <span className="text-lg font-black text-orange-600">{funnel.overallConversionRate}%</span>
              </div>
            </div>

            <div className="space-y-4">
              {funnel.steps.map((step, idx) => (
                <div key={step.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-800">
                      {idx + 1}. {step.name}
                    </span>
                    <span className="text-gray-900">
                      {step.count.toLocaleString()} ({step.percentageFromFirst}% du départ)
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        idx === 0
                          ? 'bg-blue-500'
                          : idx === 1
                          ? 'bg-indigo-500'
                          : idx === 2
                          ? 'bg-amber-500'
                          : idx === 3
                          ? 'bg-orange-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(4, step.percentageFromFirst)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCTS & SEARCH */}
      {activeTab === 'products_search' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Sellers */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Meilleures Ventes (Top Sellers)
              </h3>
              <div className="divide-y divide-gray-100">
                {products.topSellers.slice(0, 5).map((p) => (
                  <div key={p.productId} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-gray-900">{p.name}</p>
                      <p className="text-[11px] text-gray-400">{p.sku} • {p.brandName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{p.unitsSold} unités</p>
                      <p className="text-emerald-600 font-semibold">{formatDZD(p.revenueDzd)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart Abandoned Products */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Produits Fréquemment Ajoutés mais Abandonnés
              </h3>
              <div className="divide-y divide-gray-100">
                {products.cartAbandonedProducts.slice(0, 5).map((p) => (
                  <div key={p.productId} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-gray-900">{p.name}</p>
                      <p className="text-[11px] text-gray-400">Stock restant : {p.currentStock}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-600">{p.cartAdditionsCount} ajouts panier</p>
                      <p className="text-red-500 font-semibold">{p.purchasesCount} achetés ({p.conversionRate}%)</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Search Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" />
                Recherches les Plus Populaires
              </h3>
              <div className="divide-y divide-gray-100">
                {search.topSearches.map((s) => (
                  <div key={s.query} className="py-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-800">"{s.query}"</span>
                    <span className="text-gray-500 font-medium">
                      {s.searchCount} requêtes ({s.resultCountAvg} résultats moy.)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-red-600" />
                Recherches Sans Aucun Résultat (Opportunités Stock)
              </h3>
              <div className="divide-y divide-gray-100">
                {search.noResultSearches.length > 0 ? (
                  search.noResultSearches.map((s) => (
                    <div key={s.query} className="py-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-red-700">"{s.query}"</span>
                      <span className="text-red-500 font-medium">{s.searchCount} fois demandée</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 py-4 text-center">
                    Aucune recherche sans résultat sur cette période
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: B2C VS B2B COMPARISON */}
      {activeTab === 'b2c_b2b' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* B2C Cohort Card */}
            <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-emerald-900 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  Segment Particuliers (B2C)
                </h3>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">
                  {comparison.b2c.customerCount} Clients
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-gray-400 font-semibold">Chiffre d'Affaires</p>
                  <p className="text-base font-black text-gray-900 mt-0.5">{formatDZD(comparison.b2c.revenueDzd)}</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-gray-400 font-semibold">Panier Moyen</p>
                  <p className="text-base font-black text-emerald-600 mt-0.5">{formatDZD(comparison.b2c.aovDzd)}</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-gray-400 font-semibold">Articles / Commande</p>
                  <p className="text-base font-black text-gray-900 mt-0.5">{comparison.b2c.itemsPerOrderAvg}</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-gray-400 font-semibold">Taux de Retour</p>
                  <p className="text-base font-black text-gray-900 mt-0.5">{comparison.b2c.returnRate}%</p>
                </div>
              </div>
            </div>

            {/* B2B Cohort Card */}
            <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-blue-900 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-600" />
                  Segment Grossistes & Ateliers (B2B)
                </h3>
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
                  {comparison.b2b.customerCount} Ateliers
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-gray-400 font-semibold">Chiffre d'Affaires</p>
                  <p className="text-base font-black text-gray-900 mt-0.5">{formatDZD(comparison.b2b.revenueDzd)}</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-gray-400 font-semibold">Panier Moyen</p>
                  <p className="text-base font-black text-blue-600 mt-0.5">{formatDZD(comparison.b2b.aovDzd)}</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-gray-400 font-semibold">Articles / Commande</p>
                  <p className="text-base font-black text-gray-900 mt-0.5">{comparison.b2b.itemsPerOrderAvg}</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-gray-400 font-semibold">Taux de Retour</p>
                  <p className="text-base font-black text-emerald-600 mt-0.5">{comparison.b2b.returnRate}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: INVENTORY ANALYTICS */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Unités en Stock Total</p>
              <h3 className="text-2xl font-black text-gray-900">{inventory.totalStockUnits.toLocaleString()}</h3>
              <p className="text-xs text-gray-500 pt-1">Disponibles : {inventory.availableStockUnits.toLocaleString()}</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Valeur du Stock (Prix Public)</p>
              <h3 className="text-2xl font-black text-orange-600">{formatDZD(inventory.totalStockValueRetailDzd)}</h3>
              <p className="text-xs text-gray-500 pt-1">Sur l'ensemble du catalogue Belfort</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Valeur au Coût d'Achat</p>
              {inventory.totalStockValueCostDzd !== null && inventory.totalStockValueCostDzd !== undefined ? (
                <>
                  <h3 className="text-2xl font-black text-purple-600">{formatDZD(inventory.totalStockValueCostDzd)}</h3>
                  <p className="text-xs text-purple-700 font-semibold pt-1">Coût fournisseur net</p>
                </>
              ) : (
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 text-gray-500 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                    Confidentiel Coût
                  </span>
                </div>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Alertes Réassort</p>
              <div className="flex items-center gap-3 pt-1">
                <div>
                  <span className="text-xs text-amber-600 font-bold block">{inventory.lowStockCount}</span>
                  <span className="text-[10px] text-gray-400">Stock Faible</span>
                </div>
                <div className="border-l border-gray-200 pl-3">
                  <span className="text-xs text-red-600 font-bold block">{inventory.outOfStockCount}</span>
                  <span className="text-[10px] text-gray-400">Ruptures</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: LOGISTICS 58 WILAYAS & PAYMENTS */}
      {activeTab === 'logistics_payments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Delivery Success & Distribution */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-orange-600" />
                Performance Expéditions EcoTrack
              </h3>
              <div className="text-center py-3 space-y-1">
                <p className="text-3xl font-black text-emerald-600">{delivery.deliverySuccessRate}%</p>
                <p className="text-xs text-gray-500 font-medium">Taux de Livraison Conforme</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Expéditions :</span>
                  <span className="font-bold text-gray-900">{delivery.totalShipments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Livraison Domicile :</span>
                  <span className="font-bold text-gray-900">{delivery.domicileShipmentsCount} ({delivery.domicilePercentage}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Retrait Stopdesk :</span>
                  <span className="font-bold text-gray-900">{delivery.stopdeskShipmentsCount}</span>
                </div>
              </div>
            </div>

            {/* Wilaya Top Distribution */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                Répartition des Commandes par Wilaya (Top Régions)
              </h3>

              <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto pr-1">
                {delivery.wilayaDistribution.slice(0, 8).map((w) => (
                  <div key={w.wilayaCode} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-gray-900">{w.wilayaCode}. {w.wilayaName}</span>
                      <span className="text-gray-400 text-[11px] block">{w.shipmentsCount} colis ({w.successRate}% succès)</span>
                    </div>
                    <span className="font-bold text-gray-900">{formatDZD(w.totalRevenueDzd)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
