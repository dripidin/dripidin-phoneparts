// DRIPIDIN SEO Input Validation & Safeguards
// Validates store-owner SEO configuration preventing malformed URLs, XSS vectors, and over-length fields.

import { z } from 'zod';

const DANGEROUS_PROTOCOLS = /^(javascript|data|vbscript|file):/i;

export const SeoSettingsSchema = z.object({
  metaTitle: z
    .string()
    .max(120, 'Le titre SEO ne doit pas dépasser 120 caractères.')
    .optional()
    .transform((val) => (val ? val.trim() : '')),

  metaDescription: z
    .string()
    .max(320, 'La meta-description ne doit pas dépasser 320 caractères.')
    .optional()
    .transform((val) => (val ? val.trim() : '')),

  metaKeywords: z
    .string()
    .max(255, 'Les mots-clés ne doivent pas dépasser 255 caractères.')
    .optional()
    .transform((val) => (val ? val.trim() : '')),

  canonicalBaseUrl: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true;
        const trimmed = val.trim();
        if (DANGEROUS_PROTOCOLS.test(trimmed)) return false;
        try {
          const parsed = new URL(trimmed);
          return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
          return false;
        }
      },
      {
        message: "L'URL canonique doit être une URL absolue valide (ex: https://maboutique.com)",
      }
    )
    .transform((val) => (val ? val.trim().replace(/\/+$/, '') : '')),

  ogImageUrl: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true;
        const trimmed = val.trim();
        if (DANGEROUS_PROTOCOLS.test(trimmed)) return false;
        // Accept relative path (/og-image.jpg) or absolute http/https URL
        if (trimmed.startsWith('/')) return true;
        try {
          const parsed = new URL(trimmed);
          return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
          return false;
        }
      },
      {
        message: "L'URL d'image OpenGraph doit être un chemin relatif (/image.jpg) ou une URL absolue valide.",
      }
    )
    .transform((val) => (val ? val.trim() : '')),

  seoIndexable: z.boolean().default(true),

  seoFollowLinks: z.boolean().default(true),

  twitterHandle: z
    .string()
    .max(64, "L'identifiant Twitter ne doit pas dépasser 64 caractères.")
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true;
        return /^@?[A-Za-z0-9_]{1,15}$/.test(val.trim());
      },
      {
        message: "L'identifiant Twitter doit comporter entre 1 et 15 caractères alphanumériques (ex: @maboutique)",
      }
    )
    .transform((val) => {
      if (!val) return '';
      const trimmed = val.trim();
      return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
    }),
});

export type ValidatedSeoSettings = z.infer<typeof SeoSettingsSchema>;
