// Zod Validation Schemas for Authentication & User Registration

import { z } from 'zod';

export function cleanAlgerianPhone(val: unknown): string {
  if (typeof val !== 'string') return '';
  const cleaned = val.replace(/[\s\-\.\(\)]/g, '');
  if (cleaned.startsWith('+213')) {
    return '0' + cleaned.slice(4);
  }
  if (cleaned.startsWith('00213')) {
    return '0' + cleaned.slice(5);
  }
  return cleaned;
}

export const AlgerianPhoneSchema = z.preprocess(
  cleanAlgerianPhone,
  z.string().regex(/^(0)(5|6|7)[0-9]{8}$/, 'Numéro de téléphone algérien invalide (ex: 0550123456)')
);

export const LoginSchema = z.object({
  email: z.string().email('Format d\'email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

export const RegisterB2CSchema = z.object({
  email: z.string().email('Format d\'email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  fullName: z.string().min(2, 'Le nom complet est requis'),
  phone: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : cleanAlgerianPhone(val)),
    z.string().regex(/^(0)(5|6|7)[0-9]{8}$/, 'Numéro de téléphone algérien invalide (ex: 0550123456)').optional()
  ),
});

export const RegisterB2BSchema = z.object({
  email: z.string().email('Format d\'email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  fullName: z.string().min(2, 'Le nom complet du représentant est requis'),
  phone: AlgerianPhoneSchema,
  companyName: z.string().min(2, 'Le nom de l\'entreprise ou atelier est requis'),
  tradeName: z.string().optional(),
  rcNumber: z.string().min(5, 'Numéro de Registre de Commerce (RC) requis'),
  nif: z.string().min(9, 'Numéro NIF requis').optional(),
  nis: z.string().optional(),
  wilayaCode: z.number().int().min(1).max(58, 'Code de Wilaya invalide (1 à 58)'),
  wilayaName: z.string().min(2, 'Nom de Wilaya requis'),
  communeName: z.string().min(2, 'Nom de Commune requis'),
  addressLine: z.string().min(5, 'Adresse complète requise'),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email('Format d\'email invalide'),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterB2CInput = z.infer<typeof RegisterB2CSchema>;
export type RegisterB2BInput = z.infer<typeof RegisterB2BSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
