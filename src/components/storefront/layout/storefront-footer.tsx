'use client';

// DRIPIDIN Storefront Footer: 58 Wilaya Delivery, Trust Guarantees, Partners & Catalog Links
// Fully Decoupled Store Branding with Independent Developer Platform Attribution

import React from 'react';
import Link from 'next/link';
import { 
  Smartphone, 
  Truck, 
  ShieldCheck, 
  MapPin, 
  PhoneCall, 
  Mail, 
  Clock, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useWebsiteSettings } from '@/lib/hooks/use-settings-cms';
import { StoreLogo } from '@/components/ui/store-logo';

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-3.04-1.52z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  );
}

export function StorefrontFooter() {
  const { data: settings } = useWebsiteSettings();

  const storeName = settings?.storeName || 'DRIPIDIN';
  const address = settings?.addressLine || 'Centre Ville';
  const commune = settings?.commune || settings?.cityCommune || 'Biskra';
  const wilayaName = settings?.wilayaName || 'Biskra';
  const phone = settings?.supportPhone || '+213 793 73 13 10';
  const rawWhatsapp = settings?.whatsappPhone || '+213 540 09 51 66';
  const whatsappClean = rawWhatsapp.replace(/\D/g, '');
  const email = settings?.supportEmail || 'contact@dripidin.com';
  const hours = settings?.openingHours || 'Samedi - Jeudi : 09h00 - 19h00';
  const copyright = settings?.footerCopyrightText || `© ${new Date().getFullYear()} ${storeName}. Tous droits réservés.`;
  const footerDesc = settings?.footerDescription || 'Plateforme e-commerce et distribution en Algérie. Présent sur les réseaux sociaux, livraison rapide à travers les 58 Wilayas.';

  // Social Links List - Only render platforms with valid URLs
  const socialPlatforms = [
    { name: 'Facebook', url: settings?.facebookUrl, icon: FacebookIcon },
    { name: 'Instagram', url: settings?.instagramUrl, icon: InstagramIcon },
    { name: 'TikTok', url: settings?.tiktokUrl, icon: TikTokIcon },
    { name: 'YouTube', url: settings?.youtubeUrl, icon: YouTubeIcon },
    { name: 'Telegram', url: settings?.telegramUrl, icon: TelegramIcon },
  ].filter((p) => p.url && typeof p.url === 'string' && p.url.trim().length > 0 && p.url.trim() !== '#');

  const developerName = settings?.developerName || 'DRIPIDIN Platform';
  const developerUrl = settings?.developerUrl || 'https://dripidin.com';

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
            <StoreLogo linkToHome size="md" textClassName="text-white" />
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
                <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-white transition-colors">{phone}</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-orange-400 shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-white transition-colors">{email}</a>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400 shrink-0" />
                <span>{hours}</span>
              </div>
            </div>

            {/* Social Links (Dynamic fail-safe) */}
            {socialPlatforms.length > 0 && (
              <div className="pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Suivez-nous
                </div>
                <div className="flex items-center gap-2.5">
                  {socialPlatforms.map((item) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.name}
                        href={item.url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={item.name}
                        className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-orange-500 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
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
                  Administration {storeName}
                </Link>
              </li>
              <li>
                <a href={`https://wa.me/${whatsappClean}`} target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">
                  Support WhatsApp ({rawWhatsapp})
                </a>
              </li>
              <li>
                <span className="text-gray-500">Livraison : 58 Wilayas (EcoTrack)</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* 3. Bottom Bar with Independent Developer Platform Attribution */}
      <div className="border-t border-gray-800 py-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>{copyright}</p>
          
          <div className="flex items-center gap-4 text-[11px]">
            <span>Livraison 58 Wilayas</span>
            <span>•</span>
            <span>Paiement Cash on Delivery (COD)</span>
            <span>•</span>
            <span>Pièces Garanties</span>
          </div>

          {/* Developer Platform Attribution (Strictly decoupled from buyer store identity) */}
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <span>Propulsé par</span>
            <a
              href={developerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-gray-400 hover:text-orange-400 transition-colors underline decoration-dotted"
            >
              {developerName}
            </a>
          </div>
        </div>
      </div>

    </footer>
  );
}
