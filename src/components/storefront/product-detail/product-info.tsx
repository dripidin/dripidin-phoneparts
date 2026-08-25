'use client';

// HamzaPhone Product Detail Info Component: Pricing, Stock, Order Actions & Algeria Delivery Card

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Truck, 
  ShieldCheck, 
  PhoneCall, 
  Plus, 
  Minus, 
  Share2, 
  Sparkles,
  MessageCircle,
  Building2
} from 'lucide-react';
import type { PublicProductDetail } from '@/lib/services/storefront.service';
import { useCart } from '@/components/providers/cart-provider';

interface ProductInfoProps {
  product: PublicProductDetail;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const { addToCart, setIsCartOpen } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleAddToCart = () => {
    if (product.availableStock <= 0) return;
    addToCart(product, quantity);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      setIsCartOpen(true);
    }, 600);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Bonjour HamzaPhone, je souhaite commander la pièce suivante :\n- ${product.name}\n- SKU : ${product.sku}\n- Prix : ${product.effectivePriceDzd.toLocaleString('fr-DZ')} DZD\n- Quantité : ${quantity}\nLivraison vers Wilaya : `
  );

  return (
    <div className="space-y-6">
      
      {/* 1. Category Breadcrumb & Brand */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 flex-wrap">
          <Link href="/" className="hover:text-orange-600 transition-colors">Accueil</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link href={`/categories/${product.category.slug}`} className="hover:text-orange-600 transition-colors">
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          {product.brand && (
            <Link href={`/brands/${product.brand.slug}`} className="text-orange-600 font-bold hover:underline">
              {product.brand.name}
            </Link>
          )}
        </div>

        {/* Product Title */}
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 leading-tight">
          {product.name}
        </h1>

        {/* SKU & Barcode Row */}
        <div className="flex items-center gap-3 text-xs text-gray-500 pt-1">
          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-medium">
            SKU: {product.sku}
          </span>
          {product.barcode && (
            <span className="font-mono text-gray-400">
              Code-barres: {product.barcode}
            </span>
          )}
        </div>
      </div>

      {/* 2. Stock Status Indicator */}
      <div className="flex items-center gap-3 py-2 border-y border-gray-100">
        {product.availableStock > 5 ? (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>En Stock — Expédition sous 24h</span>
          </div>
        ) : product.availableStock > 0 ? (
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Stock Limité : Plus que {product.availableStock} exemplaire{product.availableStock > 1 ? 's' : ''} disponible{product.availableStock > 1 ? 's' : ''}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold text-red-700 bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Rupture Temporaire de Stock — Réapprovisionnement en cours</span>
          </div>
        )}

        <button
          onClick={handleShare}
          className="ml-auto text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span>{copiedLink ? 'Lien copié !' : 'Partager'}</span>
        </button>
      </div>

      {/* 3. Price Display */}
      <div className="p-4 sm:p-5 rounded-2xl bg-orange-50/60 border border-orange-200/80 space-y-2">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl sm:text-3xl font-extrabold text-orange-600 tracking-tight">
            {product.effectivePriceDzd.toLocaleString('fr-DZ')} DZD
          </span>

          {product.isOnSale && product.b2cSalePriceDzd && (
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base text-gray-400 line-through">
                {product.b2cPriceDzd.toLocaleString('fr-DZ')} DZD
              </span>
              <span className="px-2 py-0.5 rounded-md bg-red-500 text-white text-xs font-bold">
                Promo
              </span>
            </div>
          )}
        </div>

        <p className="text-[11px] text-gray-500">
          Prix TTC en Dinars Algériens (DZD) • Paiement à la réception de votre colis.
        </p>

        {/* B2B Wholesale Notice */}
        <div className="pt-2 border-t border-orange-200/60 flex items-center justify-between text-xs text-orange-900">
          <div className="flex items-center gap-1.5 font-semibold">
            <Building2 className="w-4 h-4 text-orange-600" />
            <span>Atelier de réparation / Revendeur ?</span>
          </div>
          <Link href="/admin" className="font-bold text-orange-600 hover:underline">
            Accéder aux prix grossiste B2B →
          </Link>
        </div>
      </div>

      {/* 4. Quantity Picker & Primary CTAs */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-3">
          
          {/* Quantity Stepper */}
          <div className="flex items-center border border-gray-300 rounded-2xl bg-white p-1 shadow-2xs">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1 || product.availableStock <= 0}
              className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Diminuer la quantité"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center font-bold text-sm text-gray-900">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(Math.min(product.availableStock, quantity + 1))}
              disabled={quantity >= product.availableStock || product.availableStock <= 0}
              className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Augmenter la quantité"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart CTA */}
          <button
            onClick={handleAddToCart}
            disabled={product.availableStock <= 0}
            className={`flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${
              product.availableStock <= 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                : addedAnimation
                ? 'bg-emerald-600 text-white shadow-emerald-500/25'
                : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25'
            }`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-5 h-5 stroke-[3]" />
                <span>Ajouté au panier !</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-5 h-5" />
                <span>Ajouter au Panier</span>
              </>
            )}
          </button>

        </div>

        {/* WhatsApp Fast Order Button */}
        <a
          href={`https://wa.me/213550000000?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Commander rapidement par WhatsApp / Téléphone</span>
        </a>
      </div>

      {/* 5. 58 Wilaya Delivery & Guarantee Card */}
      <div className="bg-gray-50 rounded-2xl border border-gray-200/80 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <h4 className="font-bold text-gray-900">Livraison Express 58 Wilayas</h4>
            <p className="text-gray-500">Expédié par EcoTrack / Yalidine sous 24h à 48h partout en Algérie.</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <h4 className="font-bold text-gray-900">Garantie & Test en Atelier</h4>
            <p className="text-gray-500">Pièce vérifiée et testée avant expédition. Échange garanti en cas de défaut d&apos;usine.</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <h4 className="font-bold text-gray-900">Assistance Technique Disponible</h4>
            <p className="text-gray-500">Besoin d&apos;aide pour vérifier la compatibilité ? Contactez nos techniciens au 0550 00 00 00.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
