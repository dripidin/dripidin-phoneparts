'use client';

// HamzaPhone Storefront Footer: 58 Wilaya Delivery, Trust Guarantees, Partners & Catalog Links

import React from 'react';
import Link from 'next/link';
import { 
  Smartphone, 
  Truck, 
  ShieldCheck, 
  Headphones, 
  MapPin, 
  PhoneCall, 
  Mail, 
  Clock, 
  CreditCard,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useWebsiteSettings } from '@/lib/hooks/use-settings-cms';

export function StorefrontFooter() {
  const { data: settings } = useWebsiteSettings();

  const address = settings?.addressLine || 'Biskra';
  const commune = settings?.commune || 'Biskra';
  const wilayaName = settings?.wilayaName || 'Biskra';
  const phone = settings?.supportPhone || '+213 793 73 13 10';
  const whatsapp = settings?.whatsappPhone || '+213 540 09 51 66';
  const email = settings?.supportEmail || 'metachagour@gmail.com';
  const hours = settings?.openingHours || 'Samedi - Jeudi : 09h00 - 19h00';
  const copyright = settings?.footerCopyrightText || '© 2026 DRIPIDIN. Tous droits réservés.';
  const footerDesc = settings?.footerDescription || 'Plateforme e-commerce et distribution en Algérie. Présent sur les réseaux sociaux, livraison rapide à travers les 58 Wilayas.';

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800 mt-16 pb-20 lg:pb-0">
      
      {/* 1. Value Proposition Pillars */}
      <div className="border-b border-gray-800 bg-gray-950/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/20">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-0.5">{settings?.deliveryBadgeText || 'Livraison 58 Wilayas'}</h4>
                <p className="text-xs text-gray-400">Expédition rapide en 24h à 48h à domicile ou en point relais.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-0.5">{settings?.paymentBadgeText || 'Paiement à la Livraison'}</h4>
                <p className="text-xs text-gray-400">Réglez votre commande en espèces (COD) à la réception du colis.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-0.5">{settings?.warrantyBadgeText || 'Pièces 100% Testées'}</h4>
                <p className="text-xs text-gray-400">Écrans OLED, batteries et composants testés avant emballage sécurisé.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-0.5">{settings?.supportBadgeText || 'Espace Grossiste B2B'}</h4>
                <p className="text-xs text-gray-400">Tarifs préférentiels dégressifs pour ateliers et réparateurs.</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 2. Main Footer Links & Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand & About */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-md">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold text-white">
                DRIP<span className="text-orange-500">IDIN</span>
              </span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              {footerDesc}
            </p>
            <div className="space-y-2 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
                <span>{address}, {commune}, {wilayaName}</span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-orange-400 shrink-0" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-orange-400 shrink-0" />
                <span>{email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400 shrink-0" />
                <span>{hours}</span>
              </div>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Pièces Populaires
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/categories/ecrans-afficheurs" className="hover:text-orange-400 transition-colors">
                  Écrans & Afficheurs OLED
                </Link>
              </li>
              <li>
                <Link href="/categories/batteries" className="hover:text-orange-400 transition-colors">
                  Batteries Haute Capacité
                </Link>
              </li>
              <li>
                <Link href="/categories/connecteurs-charge" className="hover:text-orange-400 transition-colors">
                  Connecteurs de Charge Type-C
                </Link>
              </li>
              <li>
                <Link href="/categories/cameras-capteurs" className="hover:text-orange-400 transition-colors">
                  Caméras Arrière & Avant
                </Link>
              </li>
              <li>
                <Link href="/categories/vitres-chassis" className="hover:text-orange-400 transition-colors">
                  Vitres Tactiles & Châssis
                </Link>
              </li>
              <li>
                <Link href="/categories/outils-consommables" className="hover:text-orange-400 transition-colors">
                  Outils & Tournevis Précision
                </Link>
              </li>
            </ul>
          </div>

          {/* Brands */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Marques Prises en Charge
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/brands/samsung" className="hover:text-orange-400 transition-colors">
                  Pièces Samsung Galaxy
                </Link>
              </li>
              <li>
                <Link href="/brands/apple" className="hover:text-orange-400 transition-colors">
                  Pièces Apple iPhone
                </Link>
              </li>
              <li>
                <Link href="/brands/xiaomi" className="hover:text-orange-400 transition-colors">
                  Pièces Xiaomi & Redmi
                </Link>
              </li>
              <li>
                <Link href="/brands/oppo" className="hover:text-orange-400 transition-colors">
                  Pièces Oppo & Realme
                </Link>
              </li>
              <li>
                <Link href="/brands/huawei" className="hover:text-orange-400 transition-colors">
                  Pièces Huawei & Honor
                </Link>
              </li>
              <li>
                <Link href="/brands/infinix" className="hover:text-orange-400 transition-colors">
                  Pièces Infinix & Tecno
                </Link>
              </li>
            </ul>
          </div>

          {/* B2B & Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Services & B2B
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/admin" className="text-orange-400 font-bold hover:underline">
                  ★ Espace Pro Réparateur
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-orange-400 transition-colors">
                  Tout le Catalogue (4 000+ réf)
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-orange-400 transition-colors">
                  Administration DRIPIDIN
                </Link>
              </li>
              <li>
                <a href="https://wa.me/213540095166" className="hover:text-orange-400 transition-colors">
                  Support WhatsApp (+213 540 09 51 66)
                </a>
              </li>
              <li>
                <span className="text-gray-500">Livraison : EcoTrack / Yalidine</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* 3. Bottom Bar */}
      <div className="border-t border-gray-800 py-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} DRIPIDIN. Tous droits réservés.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Livraison 58 Wilayas</span>
            <span>•</span>
            <span>Paiement Cash on Delivery (COD)</span>
            <span>•</span>
            <span>Pièces Garanties</span>
          </div>
        </div>
      </div>

    </footer>
  );
}
