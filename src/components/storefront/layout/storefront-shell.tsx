'use client';

// HamzaPhone Storefront Shell Layout Wrapper

import React, { useState } from 'react';
import { StorefrontHeader } from './storefront-header';
import { StorefrontNav } from './storefront-nav';
import { StorefrontMobileNav } from './storefront-mobile-nav';
import { StorefrontFooter } from './storefront-footer';
import { CartDrawer } from './cart-drawer';

export function StorefrontShell({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 selection:bg-orange-500 selection:text-white">
      {/* 1. Header with Search, B2B & Cart */}
      <StorefrontHeader onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

      {/* 2. Desktop Category & Brand Nav */}
      <StorefrontNav />

      {/* 3. Main Page Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* 4. Slide-Over Cart Drawer */}
      <CartDrawer />

      {/* 5. Mobile Bottom Bar & Slide-Over Menu */}
      <StorefrontMobileNav
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* 6. Footer */}
      <StorefrontFooter />
    </div>
  );
}
