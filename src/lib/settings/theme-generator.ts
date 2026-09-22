// DRIPIDIN Dynamic Theme Engine
// Generates Server-Side Resolved CSS Custom Properties from StoreSettings

import type { StoreSettings } from '@/types/settings.types';
import { DEFAULT_STORE_SETTINGS } from '@/lib/settings/default-settings';

/**
 * Sanitizes a color or CSS string to prevent injection.
 * Only allows valid hex, rgb, hsl, or standard CSS keyword values.
 */
function sanitizeCssValue(value?: string | null, fallback: string = ''): string {
  if (!value || typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  // Allow hex (#fff, #ffffff, #ffffff80), rgb/rgba, hsl/hsla, and standard alphanumeric tokens
  if (/^#([0-9a-fA-F]{3,8})$/.test(trimmed)) return trimmed;
  if (/^(rgb|hsl)a?\([^<>{};"']+\)$/.test(trimmed)) return trimmed;
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed;
  return fallback;
}

/**
 * Generates an object of CSS custom properties based on active store settings.
 */
export function generateThemeCssVariables(settings?: Partial<StoreSettings> | null): Record<string, string> {
  const s = settings || DEFAULT_STORE_SETTINGS;

  const primary = sanitizeCssValue(s.primaryColor, '#F97316');
  const primaryHover = sanitizeCssValue(s.primaryColorHover, '#EA580C');
  const accent = sanitizeCssValue(s.accentColor, '#10B981');
  const background = sanitizeCssValue(s.backgroundColor, '#FFFFFF');
  const foreground = sanitizeCssValue(s.foregroundColor, '#111827');
  const border = sanitizeCssValue(s.borderColor, '#E5E7EB');
  const fontFamily = sanitizeCssValue(s.fontFamily, 'Inter');
  const borderRadius = sanitizeCssValue(s.borderRadiusToken, '0.75rem');

  return {
    '--color-primary': primary,
    '--color-primary-hover': primaryHover,
    '--color-accent': accent,
    '--color-background': background,
    '--color-foreground': foreground,
    '--color-border': border,
    '--border-radius': borderRadius,
    '--font-family': `${fontFamily}, system-ui, -apple-system, sans-serif`,
    '--brand-orange': primary,
    '--brand-orange-hover': primaryHover,
  };
}

/**
 * Generates an inline <style> string for SSR injection in the root layout.
 */
export function generateThemeCssString(settings?: Partial<StoreSettings> | null): string {
  const vars = generateThemeCssVariables(settings);
  const declarations = Object.entries(vars)
    .map(([prop, val]) => `  ${prop}: ${val};`)
    .join('\n');

  return `:root {\n${declarations}\n}`;
}
