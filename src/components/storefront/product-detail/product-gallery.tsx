'use client';

// HamzaPhone Product Detail Multi-Image Gallery with Zoom & Thumbnail Strip

import React, { useState } from 'react';
import Image from 'next/image';
import { Sparkles, ZoomIn } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  isFeatured?: boolean;
  isOnSale?: boolean;
}

export function ProductGallery({
  images,
  productName,
  isFeatured = false,
  isOnSale = false,
}: ProductGalleryProps) {
  const fallbackImage = 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&q=80';
  const displayImages = images.length > 0 ? images : [fallbackImage];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const activeImage = displayImages[selectedIndex] || displayImages[0];

  return (
    <div className="space-y-4">
      {/* 1. Main Featured Image */}
      <div className="relative aspect-square w-full bg-white rounded-3xl border border-gray-200/80 p-6 overflow-hidden flex items-center justify-center group shadow-xs">
        
        {/* Floating Badges */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 items-start">
          {isFeatured && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-orange-500 text-white text-xs font-extrabold shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              PRODUIT POPULAIRE
            </span>
          )}
          {isOnSale && (
            <span className="px-3 py-1 rounded-lg bg-red-500 text-white text-xs font-extrabold shadow-sm">
              OFFRE PROMO
            </span>
          )}
        </div>

        {/* Zoom Hint Icon */}
        <button
          onClick={() => setIsZoomed(!isZoomed)}
          className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-white/80 backdrop-blur-xs border border-gray-200 text-gray-600 hover:text-orange-600 transition-colors shadow-xs"
          title="Agrandir l'image"
          aria-label="Agrandir l'image"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Main Image */}
        <div className="relative w-full h-full">
          <Image
            src={activeImage}
            alt={`${productName} - Vue ${selectedIndex + 1}`}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className={`object-contain object-center transition-transform duration-300 ${
              isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in group-hover:scale-105'
            }`}
            onClick={() => setIsZoomed(!isZoomed)}
          />
        </div>
      </div>

      {/* 2. Thumbnail Strip */}
      {displayImages.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
          {displayImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedIndex(idx);
                setIsZoomed(false);
              }}
              className={`relative w-16 sm:w-20 aspect-square rounded-2xl bg-white p-2 border-2 transition-all shrink-0 overflow-hidden ${
                idx === selectedIndex
                  ? 'border-orange-500 shadow-md ring-2 ring-orange-500/20'
                  : 'border-gray-200/80 hover:border-gray-300 opacity-70 hover:opacity-100'
              }`}
            >
              <Image
                src={img}
                alt={`${productName} miniature ${idx + 1}`}
                fill
                sizes="80px"
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
