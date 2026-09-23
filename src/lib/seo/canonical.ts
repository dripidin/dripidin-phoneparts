// DRIPIDIN Centralized Canonical URL Resolver
// Enforces single-source-of-truth canonical URL generation across storefront metadata, JSON-LD, and XML sitemaps.

import type { StoreSettings } from '@/types/settings.types';

const DANGEROUS_PROTOCOLS = /^(javascript|data|vbscript|file):/i;

/**
 * Normalizes a base URL by removing any trailing slashes and verifying HTTPS/HTTP.
 */
function sanitizeBaseUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed || DANGEROUS_PROTOCOLS.test(trimmed)) return null;

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return `${parsed.protocol}//${parsed.host}`.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

/**
 * Resolves the authoritative public base URL with a deterministic fallback hierarchy:
 * 1. StoreSettings.canonicalBaseUrl (configured by buyer via Admin Console)
 * 2. process.env.NEXT_PUBLIC_SITE_URL
 * 3. process.env.VERCEL_PROJECT_PRODUCTION_URL
 * 4. process.env.VERCEL_URL
 * 5. Environment fallback (localhost:3000 in development, https://dripidin.com in production)
 */
export function resolveCanonicalBaseUrl(settings?: Partial<StoreSettings> | null): string {
  // 1. Buyer configured canonical base URL
  const configured = sanitizeBaseUrl(settings?.canonicalBaseUrl);
  if (configured) return configured;

  // 2. Explicit public site URL env
  const envPublic = sanitizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL);
  if (envPublic) return envPublic;

  // 3. Vercel Project Production URL (stable custom domain / production alias)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    const vercelProd = sanitizeBaseUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);
    if (vercelProd) return vercelProd;
  }

  // 4. Vercel deployment URL
  if (process.env.VERCEL_URL) {
    const vercelDeployment = sanitizeBaseUrl(process.env.VERCEL_URL);
    if (vercelDeployment) return vercelDeployment;
  }

  // 5. Environment default fallback (zero hardcoded legacy references)
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  return 'https://dripidin.com';
}

/**
 * Constructs an absolute canonical URL from a pathname.
 * Strips query parameters and URL hashes to avoid duplicate/thin indexing variants.
 * Guarantees standard slash normalization.
 */
export function buildCanonicalUrl(path: string, settings?: Partial<StoreSettings> | null): string {
  const base = resolveCanonicalBaseUrl(settings);
  if (!path || path === '/' || path === '') {
    return `${base}/`;
  }

  // Strip query string and fragment to guarantee pure canonical representation
  const cleanPath = path.split('?')[0].split('#')[0].trim();
  const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;

  // Guarantee clean trailing-slash-free path unless it's root
  const trimmedPath = normalizedPath.length > 1 ? normalizedPath.replace(/\/+$/, '') : normalizedPath;

  return `${base}${trimmedPath}`;
}
