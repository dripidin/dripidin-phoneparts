'use client';

// HamzaPhone Storefront Header: Top Bar, Brand Identity, Instant Search & Action Buttons

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  User, 
  ShieldCheck, 
  Truck, 
  PhoneCall, 
  Briefcase, 
  Menu, 
  Search, 
  Smartphone,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { InstantSearchBar } from '@/components/storefront/search/instant-search-bar';
import { useCart } from '@/components/providers/cart-provider';
import { useWebsiteSettings } from '@/lib/hooks/use-settings-cms';

interface StorefrontHeaderProps {
  onOpenMobileMenu?: () => void;
}

export function StorefrontHeader({ onOpenMobileMenu }: StorefrontHeaderProps) {
  const { itemCount, subtotalDzd, setIsCartOpen } = useCart();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const { data: settings } = useWebsiteSettings();

  const phone = settings?.supportPhone || '0550 00 00 00';
  const showAnnouncement = settings?.announcementBarEnabled ?? true;
  const announcementText = settings?.announcementBarText || 'Livraison 58 Wilayas en 24h/48h | Pièces 100% testées';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-2xs">
      
      {/* Top Announcement Bar */}
      {showAnnouncement && (
        <div className="bg-gray-900 text-gray-200 text-[11px] font-medium py-1.5 px-4 hidden sm:block">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-orange-400">
                <Truck className="w-3.5 h-3.5" />
                <span>{settings?.deliveryBadgeText || 'Livraison 58 Wilayas en 24h/48h'}</span>
              </span>
              <span className="text-gray-600">•</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{settings?.paymentBadgeText || 'Paiement à la livraison (COD)'}</span>
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-300">{settings?.warrantyBadgeText || 'Pièces 100% testées & certifiées'}</span>
            </div>

            <div className="flex items-center gap-4">
              <a 
                href={`tel:${phone.replace(/\s/g, '')}`} 
                className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors"
              >
                <PhoneCall className="w-3 h-3 text-orange-400" />
                <span>{phone}</span>
              </a>
              <span className="text-gray-600">•</span>
              <Link 
                href="/admin" 
                className="flex items-center gap-1 text-orange-400 hover:text-orange-300 font-semibold transition-colors"
              >
                <Briefcase className="w-3 h-3" />
                <span>Espace Admin / B2B</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5">
        <div className="flex items-center justify-between gap-4">
          
          {/* Mobile Menu Trigger & Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/25 group-hover:scale-105 transition-transform">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-xl font-extrabold tracking-tight text-gray-900">
                    DRIP<span className="text-orange-500">IDIN</span>
                  </span>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 tracking-wide">
                    DZ
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-gray-400 tracking-wider">
                  DISTRIBUTION & E-COMMERCE MOBILE
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Instant Search Bar */}
          <div className="hidden lg:block flex-1 max-w-2xl px-6">
            <InstantSearchBar />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="lg:hidden p-2.5 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Rechercher"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* B2B Wholesale Portal Link */}
            <Link
              href="/register?type=b2b"
              className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200/60 text-xs font-bold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>Espace Pro & B2B</span>
            </Link>

            {/* Account Link */}
            <Link
              href="/account"
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors text-xs font-semibold"
              title="Mon Compte"
            >
              <User className="w-5 h-5 text-gray-600" />
              <span className="hidden sm:inline">Mon Compte</span>
            </Link>

            {/* Cart Trigger with Real-Time Badge */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2.5 px-3.5 py-2 sm:py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-all shadow-md shadow-orange-500/20 active:scale-95"
              aria-label="Voir le panier"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-gray-900 text-white text-[10px] font-extrabold flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">
                {subtotalDzd > 0 
                  ? `${subtotalDzd.toLocaleString('fr-DZ')} DZD` 
                  : 'Panier'}
              </span>
            </button>
          </div>

        </div>

        {/* Mobile Expandable Search Bar */}
        {showMobileSearch && (
          <div className="lg:hidden mt-3 pt-3 border-t border-gray-100 animate-in fade-in slide-in-from-top-1">
            <InstantSearchBar isMobileFullWidth />
          </div>
        )}
      </div>
    </header>
  );
}
