'use client';

// HamzaPhone Instant Search Bar with Debounced Sub-50ms Discovery & Keyboard Controls

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import { useInstantSearch } from '@/lib/hooks/use-storefront-queries';
import { InstantSearchOverlay } from './instant-search-overlay';

interface InstantSearchBarProps {
  placeholder?: string;
  className?: string;
  isMobileFullWidth?: boolean;
}

export function InstantSearchBar({
  placeholder = 'Rechercher une pièce (ex: écran Samsung S22, A2633, batterie iPhone)...',
  className = '',
  isMobileFullWidth = false,
}: InstantSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce query input by 180ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  // Hook for instant search queries
  const { data: suggestions, isLoading } = useInstantSearch(debouncedQuery, isOpen);

  // Close overlay on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || !suggestions) {
      if (e.key === 'Enter' && query.trim().length > 0) {
        e.preventDefault();
        router.push(`/products?search=${encodeURIComponent(query.trim())}`);
        setIsOpen(false);
      }
      return;
    }

    const productCount = suggestions.products.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < productCount - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : productCount - 1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < productCount) {
        const selectedProd = suggestions.products[selectedIndex];
        router.push(`/products/${selectedProd.slug}`);
        setIsOpen(false);
      } else if (query.trim().length > 0) {
        router.push(`/products?search=${encodeURIComponent(query.trim())}`);
        setIsOpen(false);
      }
    }
  };

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length > 0) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full ${className}`}
    >
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen && e.target.value.trim().length >= 2) {
                setIsOpen(true);
              }
            }}
            onFocus={() => {
              if (query.trim().length >= 2) {
                setIsOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full pl-11 pr-10 py-2.5 sm:py-3 bg-white text-gray-900 placeholder:text-gray-400 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs sm:text-sm font-medium transition-all shadow-xs ${
              isMobileFullWidth ? 'text-base' : ''
            }`}
            autoComplete="off"
            spellCheck="false"
            aria-label="Rechercher des pièces détachées smartphone"
            aria-expanded={isOpen}
            aria-controls="search-suggestions-panel"
          />

          {/* Search Icon */}
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
            ) : (
              <Search className="w-4 h-4 text-orange-500" />
            )}
          </div>

          {/* Clear Button */}
          {query.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Effacer la recherche"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Real-time suggestions dropdown */}
      <InstantSearchOverlay
        suggestions={suggestions}
        isLoading={isLoading}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        query={query}
        selectedIndex={selectedIndex}
      />
    </div>
  );
}
