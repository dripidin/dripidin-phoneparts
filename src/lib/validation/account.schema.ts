// Zod Validation Schemas for Customer Identity, Address Book, Profile & Security

import { z } from 'zod';
import { ALGERIA_WILAYAS } from '@/lib/utils';

import { cleanAlgerianPhone, AlgerianPhoneSchema } from './auth.schema';

export const AlgerianPhoneRegex = /^(0)(5|6|7)[0-9]{8}$/;

export const OptionalAlgerianPhoneSchema = z.preprocess(
  (val) => (val === '' || val === undefined || val === null ? undefined : cleanAlgerianPhone(val)),
  z.string().regex(AlgerianPhoneRegex, 'Numéro de téléphone algérien invalide (ex: 0550123456)').optional().or(z.literal(''))
);

/**
 * Profile update schema for B2C & B2B customer accounts
 */
export const ProfileUpdateSchema = z.object({
  fullName: z.string().min(2, 'Le nom complet doit contenir au moins 2 caractères'),
  phone: OptionalAlgerianPhoneSchema,
  phoneSecondary: OptionalAlgerianPhoneSchema,
});

/**
 * Saved shipping and billing address schema
 */
export const AddressSchema = z.object({
  title: z.string().min(2, 'Le libellé de l\'adresse est requis (ex: Domicile, Atelier Belfort)'),
  recipientName: z.string().min(2, 'Le nom du destinataire est requis'),
  recipientPhone: AlgerianPhoneSchema,
  recipientPhoneSecondary: OptionalAlgerianPhoneSchema,
  addressLine: z.string().min(5, 'Adresse complète requise (rue, numéro, quartier)'),
  wilayaCode: z.number().int().min(1).max(58, 'Code de Wilaya invalide (1 à 58)'),
  wilayaName: z.string().min(2, 'Nom de Wilaya requis'),
  communeName: z.string().min(2, 'Nom de la commune requis'),
  postalCode: z.string().optional().or(z.literal('')),
  addressType: z.enum(['HOME', 'WORK', 'WORKSHOP', 'OTHER']),
  isDefault: z.boolean().default(false),
});

/**
 * Change password schema with strength checks
 */
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(8, 'Le mot de passe actuel doit contenir au moins 8 caractères'),
  newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une lettre majuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  confirmPassword: z.string().min(8, 'Veuillez confirmer votre mot de passe'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les nouveaux mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

/**
 * Detailed B2C Registration schema with split names
 */
export const CustomerRegisterB2CSchema = z.object({
  firstName: z.string().min(2, 'Le prénom est requis'),
  lastName: z.string().min(2, 'Le nom est requis'),
  email: z.string().email('Adresse email invalide'),
  phone: AlgerianPhoneSchema,
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Au moins une lettre majuscule')
    .regex(/[0-9]/, 'Au moins un chiffre'),
  passwordConfirmation: z.string().min(8, 'Veuillez confirmer votre mot de passe'),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Vous devez accepter les conditions générales de vente',
  }),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['passwordConfirmation'],
});

/**
 * Detailed B2B Registration schema for Algerian phone repair businesses
 */
export const CustomerRegisterB2BSchema = z.object({
  firstName: z.string().min(2, 'Le prénom du représentant est requis'),
  lastName: z.string().min(2, 'Le nom du représentant est requis'),
  email: z.string().email('Adresse email professionnelle invalide'),
  phone: AlgerianPhoneSchema,
  companyName: z.string().min(2, 'La raison sociale ou nom de l\'atelier est requis'),
  tradeName: z.string().optional().or(z.literal('')),
  rcNumber: z.string().min(5, 'Numéro de Registre de Commerce (RC) requis'),
  nif: z.string().min(9, 'Numéro NIF requis (ex: 000000000000000)').optional().or(z.literal('')),
  nis: z.string().optional().or(z.literal('')),
  articleImposition: z.string().optional().or(z.literal('')),
  wilayaCode: z.number().int().min(1).max(58, 'Veuillez sélectionner une Wilaya'),
  wilayaName: z.string().min(2, 'Nom de Wilaya requis'),
  communeName: z.string().min(2, 'Nom de la commune requis'),
  addressLine: z.string().min(5, 'Adresse exacte de l\'atelier requise'),
  estimatedMonthlyVolumeDzd: z.string().optional(),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Au moins une lettre majuscule')
    .regex(/[0-9]/, 'Au moins un chiffre'),
  passwordConfirmation: z.string().min(8, 'Veuillez confirmer votre mot de passe'),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Vous devez accepter les conditions générales de vente B2B',
  }),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['passwordConfirmation'],
});

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
export type AddressInput = z.infer<typeof AddressSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type CustomerRegisterB2CInput = z.infer<typeof CustomerRegisterB2CSchema>;
export type CustomerRegisterB2BInput = z.infer<typeof CustomerRegisterB2BSchema>;
