'use server';

// HamzaPhone Customer Authentication Server Actions

import { createServerClient } from '@/lib/auth/server';
import { AuthService } from '@/lib/auth/auth-service';
import { requireAuth } from '@/lib/permissions/guards';
import {
  LoginSchema,
  ResetPasswordSchema,
  type LoginInput,
  type ResetPasswordInput,
} from '@/lib/validation/auth.schema';
import {
  CustomerRegisterB2CSchema,
  CustomerRegisterB2BSchema,
  ChangePasswordSchema,
  type CustomerRegisterB2CInput,
  type CustomerRegisterB2BInput,
  type ChangePasswordInput,
} from '@/lib/validation/account.schema';

/**
 * Sign in with email and password
 */
export async function loginWithPasswordAction(rawInput: LoginInput) {
  const parsed = LoginSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Données invalides' };
  }

  try {
    const supabase = createServerClient();
    const authService = new AuthService(supabase);
    const result = await authService.signInWithPassword(parsed.data.email, parsed.data.password);
    return { success: true, user: result.user };
  } catch (err: any) {
    return { success: false, error: err.message || 'Identifiants incorrects' };
  }
}

/**
 * Register a new B2C customer account
 */
export async function registerB2CAction(rawInput: CustomerRegisterB2CInput) {
  const parsed = CustomerRegisterB2CSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Données invalides' };
  }

  try {
    const supabase = createServerClient();
    const authService = new AuthService(supabase);
    const fullName = `${parsed.data.firstName.trim()} ${parsed.data.lastName.trim()}`;

    const result = await authService.registerB2C({
      email: parsed.data.email.trim(),
      password: parsed.data.password,
      fullName,
      phone: parsed.data.phone,
    });

    return { success: true, user: result.user };
  } catch (err: any) {
    return { success: false, error: err.message || 'Échec de l\'inscription' };
  }
}

/**
 * Register a new B2B workshop / reseller business account
 */
export async function registerB2BAction(rawInput: CustomerRegisterB2BInput) {
  const parsed = CustomerRegisterB2BSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Données invalides' };
  }

  try {
    const supabase = createServerClient();
    const authService = new AuthService(supabase);
    const fullName = `${parsed.data.firstName.trim()} ${parsed.data.lastName.trim()}`;

    const result = await authService.registerB2B({
      email: parsed.data.email.trim(),
      password: parsed.data.password,
      fullName,
      phone: parsed.data.phone,
      companyName: parsed.data.companyName.trim(),
      tradeName: parsed.data.tradeName?.trim() || undefined,
      rcNumber: parsed.data.rcNumber.trim(),
      nif: parsed.data.nif?.trim() || undefined,
      nis: parsed.data.nis?.trim() || undefined,
      wilayaCode: parsed.data.wilayaCode,
      wilayaName: parsed.data.wilayaName,
      communeName: parsed.data.communeName,
      addressLine: parsed.data.addressLine,
      metadata: {
        article_imposition: parsed.data.articleImposition || undefined,
        estimated_volume: parsed.data.estimatedMonthlyVolumeDzd || undefined,
      },
    });

    return { success: true, user: result.user };
  } catch (err: any) {
    return { success: false, error: err.message || 'Échec de l\'inscription B2B' };
  }
}

/**
 * Request password reset email
 */
export async function requestPasswordResetAction(rawInput: ResetPasswordInput) {
  const parsed = ResetPasswordSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Email invalide' };
  }

  try {
    const supabase = createServerClient();
    const authService = new AuthService(supabase);
    await authService.requestPasswordReset(parsed.data.email);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Échec de la demande de réinitialisation' };
  }
}

/**
 * Update password from authenticated account settings
 */
export async function updatePasswordAction(rawInput: ChangePasswordInput) {
  const parsed = ChangePasswordSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Mot de passe invalide' };
  }

  try {
    const supabase = createServerClient();
    const user = await requireAuth(supabase);

    const { error } = await supabase.auth.updateUser({
      password: parsed.data.newPassword,
    });

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Échec de modification du mot de passe' };
  }
}

/**
 * Sign out current customer
 */
export async function logoutAction() {
  try {
    const supabase = createServerClient();
    const authService = new AuthService(supabase);
    await authService.signOut();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Échec de déconnexion' };
  }
}
