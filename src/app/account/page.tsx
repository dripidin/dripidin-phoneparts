// HamzaPhone Customer Account Overview Hub Page

import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { 
  Package, 
  MapPin, 
  User, 
  CreditCard, 
  Sparkles, 
  ArrowRight, 
  Building2, 
  MessageCircle,
  Truck
} from 'lucide-react';
import { createServerClient } from '@/lib/auth/server';
import { CustomerAccountService } from '@/lib/services/customer-account.service';
import { AccountShell } from '@/components/storefront/account/account-shell';
import { B2BStatusBanner } from '@/components/storefront/account/b2b-status-banner';

export const metadata: Metadata = {
  title: 'Mon Compte | HamzaPhone Algérie',
  description: 'Tableau de bord de votre compte client et atelier HamzaPhone.',
};

export default async function AccountOverviewPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account');
  }

  const service = new CustomerAccountService(supabase);
  const [context, orders, addresses] = await Promise.all([
    service.getCustomerContext(user.id),
    service.getOrders(user.id),
    service.getAddresses(user.id),
  ]);

  if (!context) {
    redirect('/login?next=/account');
  }

  const recentOrders = orders.slice(0, 3);
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];

  return (
    <AccountShell context={context}>
      <div className="space-y-6">
        
        {/* B2B Status Alert if applicable */}
        {context.isB2B && (
          <B2BStatusBanner
            status={context.b2bStatus}
            tierCode={context.business?.tierCode}
            creditLimitDzd={context.business?.creditLimitDzd}
          />
        )}

        {/* 1. Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Commandes passées</span>
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-gray-900">
              {orders.length}
            </div>
            <Link href="/account/orders" className="text-[11px] font-bold text-orange-600 hover:underline block pt-1">
              Voir tout l&apos;historique →
            </Link>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Adresses enregistrées</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-gray-900">
              {addresses.length}
            </div>
            <Link href="/account/addresses" className="text-[11px] font-bold text-orange-600 hover:underline block pt-1">
              Gérer le carnet d&apos;adresses →
            </Link>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Statut du Compte</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg font-extrabold text-purple-700 truncate">
              {context.isB2B ? `B2B ${context.b2bStatus}` : 'Particulier B2C'}
            </div>
            <span className="text-[11px] text-gray-400 block pt-1">
              {context.isB2B ? 'Espace Pro Grossiste' : 'Tarifs publics standards'}
            </span>
          </div>

        </div>

        {/* 2. Recent Orders & Default Address */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Recent Orders List (Left 8 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">
                Dernières Commandes
              </h3>
              <Link href="/account/orders" className="text-xs font-bold text-orange-600 hover:underline">
                Toutes ({orders.length})
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-500 space-y-3">
                <p>Vous n&apos;avez pas encore passé de commande.</p>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors"
                >
                  <span>Explorer les pièces disponibles</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentOrders.map((o) => (
                  <div key={o.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-mono font-bold text-gray-900 block">
                        #{o.orderNumber}
                      </span>
                      <span className="text-gray-400 text-[11px]">
                        {new Date(o.createdAt).toLocaleDateString('fr-DZ')} • {o.itemsCount} article{o.itemsCount > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="text-right">
                      <strong className="text-orange-600 font-extrabold block">
                        {o.totalAmountDzd.toLocaleString('fr-DZ')} DZD
                      </strong>
                      <Link
                        href={`/account/orders/${o.id}`}
                        className="text-[11px] font-bold text-gray-500 hover:text-orange-600 transition-colors"
                      >
                        Détails →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Default Address & WhatsApp Card (Right 5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Default Address */}
            <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">
                  Adresse Principale
                </h3>
                <Link href="/account/addresses" className="text-xs font-bold text-orange-600 hover:underline">
                  Modifier
                </Link>
              </div>

              {defaultAddress ? (
                <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="font-bold text-gray-900">{defaultAddress.title} — {defaultAddress.recipientName}</p>
                  <p>{defaultAddress.recipientPhone}</p>
                  <p className="text-gray-700 font-medium leading-relaxed pt-1">
                    {defaultAddress.addressLine}, {defaultAddress.communeName}
                  </p>
                  <p className="font-bold text-gray-800">
                    Wilaya {defaultAddress.wilayaCode.toString().padStart(2, '0')} - {defaultAddress.wilayaName}
                  </p>
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-gray-500">
                  <p className="mb-2">Aucune adresse enregistrée.</p>
                  <Link
                    href="/account/addresses"
                    className="inline-flex items-center gap-1 text-orange-600 font-bold hover:underline"
                  >
                    + Ajouter une adresse
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Assistance Card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-3xl p-5 text-white shadow-md space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm">Assistance & Commandes</h4>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                Une question sur une référence de pièce ou le suivi de votre livraison ?
              </p>

              <a
                href="https://wa.me/213550000000"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>Contacter le support WhatsApp</span>
              </a>
            </div>

          </div>

        </div>

      </div>
    </AccountShell>
  );
}
