'use client';

// HamzaPhone Mobile Navigation: Fixed Bottom Bar & Slide-Over Menu Drawer

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Package, 
  Search, 
  ShoppingBag, 
  User, 
  X, 
  FolderTree, 
  Tag, 
  Sparkles, 
  PhoneCall, 
  Truck, 
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { useCart } from '@/components/providers/cart-provider';
import { useStorefrontCategories, useStorefrontBrands } from '@/lib/hooks/use-storefront-queries';

interface StorefrontMobileNavProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export function StorefrontMobileNav({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: StorefrontMobileNavProps) {
  const pathname = usePathname();
  const { itemCount, setIsCartOpen } = useCart();
  const { data: categories = [] } = useStorefrontCategories();
  const { data: brands = [] } = useStorefrontBrands();

  const navItems = [
    { label: 'Accueil', href: '/', icon: Home },
    { label: 'Catalogue', href: '/products', icon: Package },
    { label: 'Recherche', href: '/search', icon: Search },
    { label: 'Panier', href: '#cart', icon: ShoppingBag, isCartTrigger: true, badge: itemCount },
    { label: 'Mon Compte', href: '/account', icon: User },
  ];

  return (
    <>
      {/* 1. Fixed Bottom Navigation Bar (Mobile only) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 px-2 py-1.5 shadow-lg">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            if (item.isCartTrigger) {
              return (
                <button
                  key={item.label}
                  onClick={() => setIsCartOpen(true)}
                  className="relative flex flex-col items-center py-1 px-3 text-gray-500 hover:text-orange-600 transition-colors"
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {item.badge && item.badge > 0 ? (
                      <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-extrabold flex items-center justify-center">
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[10px] font-semibold mt-0.5">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center py-1 px-3 transition-colors ${
                  isActive ? 'text-orange-600 font-bold' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className="text-[10px] font-semibold mt-0.5">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 2. Slide-Over Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="fixed inset-y-0 left-0 max-w-full flex pr-10">
            <div className="w-screen max-w-xs bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
              
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-gray-900 text-base">
                    Hamza<span className="text-orange-500">Phone</span>
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Links */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                {/* B2B Banner Link */}
                <Link
                  href="/register?type=b2b"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block p-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                >
                  <div className="flex items-center gap-2 font-bold text-xs mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span>Espace Grossiste & B2B</span>
                  </div>
                  <p className="text-[11px] text-orange-100">
                    Tarifs grossiste dégressifs pour ateliers de réparation.
                  </p>
                </Link>

                {/* Categories */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    <FolderTree className="w-3.5 h-3.5" />
                    <span>Catégories de pièces</span>
                  </div>
                  <div className="space-y-1">
                    {categories.map((cat: any) => (
                      <Link
                        key={cat.id}
                        href={`/categories/${cat.slug}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))}
                    <Link
                      href="/products"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-xl text-xs font-bold text-orange-600 hover:bg-orange-50 transition-colors"
                    >
                      Tout le catalogue (4 000+ réf) →
                    </Link>
                  </div>
                </div>

                {/* Popular Brands */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Marques populaires</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {brands.map((b: any) => (
                      <Link
                        key={b.id}
                        href={`/brands/${b.slug}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="px-3 py-2 rounded-lg bg-gray-50 text-xs font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors text-center border border-gray-100"
                      >
                        {b.name}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Contact & Support */}
                <div className="pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-600">
                  <a href="tel:+213550000000" className="flex items-center gap-2 font-medium hover:text-orange-600">
                    <PhoneCall className="w-4 h-4 text-orange-500" />
                    <span>0550 00 00 00 (Service Client)</span>
                  </a>
                  <div className="flex items-center gap-2 text-gray-500 text-[11px]">
                    <Truck className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>Livraison 58 Wilayas (COD)</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Pièces 100% testées & garanties</span>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
