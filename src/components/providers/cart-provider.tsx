'use client';

// HamzaPhone Client Cart Context with LocalStorage Persistence & Server Validation Sync

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { PublicProductSummary } from '@/lib/services/storefront.service';
import { validateCartAction } from '@/lib/actions/checkout.actions';

export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  slug: string;
  mainImage: string;
  priceDzd: number;
  quantity: number;
  availableStock: number;
  pricingTierApplied?: string;
  warning?: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotalDzd: number;
  addToCart: (product: PublicProductSummary, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  syncWithServer: () => Promise<void>;
  isSyncing: boolean;
  serverWarnings: string[];
  clearWarnings: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'hamzaphone_cart_v2';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [serverWarnings, setServerWarnings] = useState<string[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage parse error
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync cart changes to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch {
        // Ignore quota errors
      }
    }
  }, [items, isLoaded]);

  // Synchronize cart with live database prices and stock
  const syncWithServer = useCallback(async () => {
    if (items.length === 0) return;
    setIsSyncing(true);
    try {
      const payload = items.map(i => ({ productId: i.productId, quantity: i.quantity }));
      const res = await validateCartAction(payload);

      if (res.success && res.summary) {
        const summary = res.summary;
        if (summary.warnings.length > 0) {
          setServerWarnings(summary.warnings);
        }

        // Update local items with authoritative prices and stock
        setItems((prev) => {
          return prev
            .map((localItem) => {
              const serverItem = summary.items.find(s => s.productId === localItem.productId);
              if (!serverItem) return localItem;
              if (serverItem.validQuantity === 0 && (serverItem.status === 'UNAVAILABLE' || serverItem.status === 'OUT_OF_STOCK')) {
                return null; // Will filter out
              }
              return {
                ...localItem,
                name: serverItem.name,
                sku: serverItem.sku,
                mainImage: serverItem.mainImage,
                priceDzd: serverItem.unitPriceDzd,
                quantity: serverItem.validQuantity,
                availableStock: serverItem.availableStock,
                pricingTierApplied: serverItem.pricingTierApplied,
                warning: serverItem.warningMessage,
              };
            })
            .filter((item): item is CartItem => item !== null);
        });
      }
    } catch {
      // Fail silently for background sync
    } finally {
      setIsSyncing(false);
    }
  }, [items]);

  // Automatically sync when drawer opens
  useEffect(() => {
    if (isCartOpen && items.length > 0) {
      syncWithServer();
    }
  }, [isCartOpen, syncWithServer]);

  const addToCart = (product: PublicProductSummary, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: Math.min(item.availableStock || 99, item.quantity + quantity) }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          slug: product.slug,
          mainImage: product.mainImage,
          priceDzd: product.effectivePriceDzd,
          quantity: Math.min(product.availableStock || 99, Math.max(1, quantity)),
          availableStock: product.availableStock,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(item.availableStock || 99, quantity) }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setServerWarnings([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const clearWarnings = () => {
    setServerWarnings([]);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalDzd = items.reduce((sum, item) => sum + item.priceDzd * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotalDzd,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        syncWithServer,
        isSyncing,
        serverWarnings,
        clearWarnings,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
