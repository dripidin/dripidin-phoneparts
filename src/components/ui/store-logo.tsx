'use client';

// DRIPIDIN Dynamic Store Logo Component
// Renders configured custom logo with automatic fail-safe fallback to dynamic monogram/icon badge

import React, { useState } from 'react';
import Link from 'next/link';
import { Smartphone } from 'lucide-react';
import { useWebsiteSettings } from '@/lib/hooks/use-settings-cms';
import { cn } from '@/lib/utils';

export interface StoreLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
  showSubtext?: boolean;
  textClassName?: string;
  subtextClassName?: string;
  linkToHome?: boolean;
  overrideStoreName?: string;
  overrideLogoUrl?: string | null;
  overrideTagline?: string;
}

export function StoreLogo({
  size = 'md',
  className,
  showText = true,
  showSubtext = true,
  textClassName,
  subtextClassName,
  linkToHome = false,
  overrideStoreName,
  overrideLogoUrl,
  overrideTagline,
}: StoreLogoProps) {
  const { data: settings } = useWebsiteSettings();
  const [imageFailed, setImageFailed] = useState(false);

  const storeName = overrideStoreName || settings?.storeName || 'DRIPIDIN';
  const logoUrl = overrideLogoUrl !== undefined ? overrideLogoUrl : settings?.logoUrl;
  const tagline = overrideTagline || settings?.tagline || 'Distribution & E-Commerce Mobile';

  // Compute initials (e.g. "DRIPIDIN" -> "DR", "Hamza Phone" -> "HP")
  const initials = storeName
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'DZ';

  const sizeClasses = {
    sm: {
      container: 'w-7 h-7 rounded-lg',
      img: 'max-h-7 max-w-7',
      icon: 'w-3.5 h-3.5',
      title: 'text-sm font-bold',
      subtext: 'text-[9px]',
      badge: 'text-[8px] px-1 py-0.2',
    },
    md: {
      container: 'w-10 h-10 rounded-2xl',
      img: 'max-h-10 max-w-10',
      icon: 'w-5 h-5',
      title: 'text-xl font-extrabold',
      subtext: 'text-[10px]',
      badge: 'text-[9px] px-1.5 py-0.5',
    },
    lg: {
      container: 'w-12 h-12 rounded-2xl',
      img: 'max-h-12 max-w-12',
      icon: 'w-6 h-6',
      title: 'text-2xl font-black',
      subtext: 'text-xs',
      badge: 'text-[10px] px-2 py-0.5',
    },
  }[size];

  const hasValidCustomLogo = logoUrl && typeof logoUrl === 'string' && logoUrl.trim().length > 0 && !imageFailed;

  const content = (
    <div className={cn('flex items-center gap-2.5 group select-none', className)}>
      {/* Visual Badge / Logo Image */}
      {hasValidCustomLogo ? (
        <div
          className={cn(
            sizeClasses.container,
            'flex items-center justify-center overflow-hidden bg-white border border-gray-100 shadow-xs group-hover:scale-105 transition-transform'
          )}
        >
          <img
            src={logoUrl}
            alt={`${storeName} Logo`}
            onError={() => setImageFailed(true)}
            className={cn(sizeClasses.img, 'object-contain')}
          />
        </div>
      ) : (
        <div
          className={cn(
            sizeClasses.container,
            'bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/25 group-hover:scale-105 transition-transform font-black tracking-tight'
          )}
          title={storeName}
        >
          {initials.length <= 2 && size !== 'lg' ? (
            <span className="leading-none text-xs">{initials}</span>
          ) : (
            <Smartphone className={sizeClasses.icon} />
          )}
        </div>
      )}

      {/* Typography / Name Display */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                sizeClasses.title,
                'tracking-tight text-gray-900 group-hover:text-orange-600 transition-colors',
                textClassName
              )}
            >
              {storeName}
            </span>
            <span
              className={cn(
                sizeClasses.badge,
                'font-extrabold uppercase rounded-full bg-orange-100 text-orange-700 tracking-wide'
              )}
            >
              DZ
            </span>
          </div>
          {showSubtext && tagline && (
            <span
              className={cn(
                sizeClasses.subtext,
                'font-semibold text-gray-400 tracking-wider uppercase line-clamp-1',
                subtextClassName
              )}
            >
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link href="/" className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-xl">
        {content}
      </Link>
    );
  }

  return content;
}
