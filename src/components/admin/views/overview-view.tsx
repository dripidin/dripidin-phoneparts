'use client';

// Overview & Dashboard Command Center View for HamzaPhone

import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDZD, formatDate } from '@/lib/utils';
import { useDashboardOverview } from '@/lib/hooks/use-admin-queries';
import type { AdminTab } from '@/components/admin/admin-sidebar';
import {
  TrendingUp,
  ShoppingCart,
  Boxes,
  Truck,
  ArrowUpRight,
  AlertTriangle,
  Plus,
  Percent,
  FileSpreadsheet,
  CheckCircle2,
  Users,
} from 'lucide-react';

export interface OverviewViewProps {
  onNavigate: (tab: AdminTab) => void;
}

export function OverviewView({ onNavigate }: OverviewViewProps) {
  const { data: overview, isLoading, error } = useDashboardOverview();

  const metrics = overview?.metrics || {
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    b2cCustomersCount: 0,
    b2bCustomersCount: 0,
    totalRevenueDzd: 0,
  };

  const recentOrders = overview?.recentOrders || [];
  const recentActivity = overview?.recentActivity || [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-orange-600 to-amber-600 text-white rounded-2xl p-6 shadow-md">
        <div>
          <h1 className="text-2xl font-black tracking-tight">DRIPIDIN Operations Suite</h1>
          <p className="text-orange-100 text-xs mt-1">
            Plateforme de gestion e-commerce & distribution mobile pour l'Algérie (58 Wilayas)
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('products')}
            className="bg-white text-orange-800 hover:bg-orange-50 font-bold border-none"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouveau Produit
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('pricing')}
            className="bg-orange-700/60 text-white hover:bg-orange-700 font-semibold border-none"
          >
            <Percent className="w-3.5 h-3.5" />
            Ajustement Tarifaire
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('import-export')}
            className="bg-orange-700/60 text-white hover:bg-orange-700 font-semibold border-none"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Import / Export
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Chiffre d'Affaires (GMV)</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {isLoading ? '...' : formatDZD(metrics.totalRevenueDzd)}
              </h3>
              <p className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{metrics.deliveredOrders} livrées avec succès</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Commandes Totales</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {isLoading ? '...' : metrics.totalOrders}
              </h3>
              <p className="text-xs font-medium text-blue-600 flex items-center gap-1 mt-1">
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{metrics.pendingOrders} en attente de confirmation</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Clients & Réparateurs</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {isLoading ? '...' : metrics.b2cCustomersCount + metrics.b2bCustomersCount}
              </h3>
              <p className="text-xs font-medium text-purple-600 flex items-center gap-1 mt-1">
                <Users className="w-3.5 h-3.5" />
                <span>{metrics.b2bCustomersCount} Pro B2B validés</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Critique</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">
                {isLoading ? '...' : metrics.lowStockProducts + metrics.outOfStockProducts}
              </h3>
              <p className="text-xs font-medium text-amber-600 flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{metrics.outOfStockProducts} en rupture de stock</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid: Recent Orders & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-orange-600" />
                Commandes Récentes
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('orders')} className="text-xs">
                Voir toutes <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 font-semibold border-y border-gray-100">
                  <tr>
                    <th className="px-3 py-2.5">N° Commande</th>
                    <th className="px-3 py-2.5">Destinataire</th>
                    <th className="px-3 py-2.5">Wilaya</th>
                    <th className="px-3 py-2.5">Total</th>
                    <th className="px-3 py-2.5">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-gray-400">
                        {isLoading ? 'Chargement des commandes...' : 'Aucune commande enregistrée.'}
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-3 py-3 font-bold text-gray-900">{ord.orderNumber}</td>
                        <td className="px-3 py-3 font-semibold text-gray-800">{ord.recipientName}</td>
                        <td className="px-3 py-3 font-medium text-gray-700">{ord.wilayaName}</td>
                        <td className="px-3 py-3 font-bold text-gray-900">{formatDZD(ord.totalDzd)}</td>
                        <td className="px-3 py-3">
                          <Badge
                            variant={
                              ord.status === 'DELIVERED'
                                ? 'success'
                                : ord.status === 'CONFIRMED'
                                ? 'orange'
                                : ord.status === 'CANCELLED'
                                ? 'error'
                                : 'secondary'
                            }
                          >
                            {ord.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Activity Logs Stream */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Journal d'Activité Récent</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('activity-logs')} className="text-xs">
                Voir tout
              </Button>
            </CardHeader>
            <div className="space-y-2.5">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">
                  {isLoading ? 'Chargement du journal...' : 'Aucune activité récente enregistrée.'}
                </p>
              ) : (
                recentActivity.map((log) => (
                  <div key={log.id} className="text-xs border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span className="font-semibold text-gray-700">{log.actorEmail}</span>
                      <span>{formatDate(log.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 font-mono text-[11px]">
                      <Badge variant="outline" className="text-[10px]">{log.action}</Badge>
                      <span className="text-gray-600 truncate">{log.entityType}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
