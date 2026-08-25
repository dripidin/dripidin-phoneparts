'use server';

// HamzaPhone Customer Account Server Actions: Profile & Address Mutations with Authenticated Session Guard

import { createServerClient } from '@/lib/auth/server';
import { requireAuth } from '@/lib/permissions/guards';
import { CustomerAccountService } from '@/lib/services/customer-account.service';
import {
  ProfileUpdateSchema,
  AddressSchema,
  type ProfileUpdateInput,
  type AddressInput,
} from '@/lib/validation/account.schema';

/**
 * Update authenticated customer's profile
 */
export async function updateCustomerProfileAction(rawInput: ProfileUpdateInput) {
  const parsed = ProfileUpdateSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Données invalides' };
  }

  try {
    const supabase = createServerClient();
    const user = await requireAuth(supabase);
    const service = new CustomerAccountService(supabase);

    const updated = await service.updateProfile(user.userId, parsed.data);
    return { success: true, profile: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur lors de la mise à jour' };
  }
}

/**
 * Save new or edit existing address for authenticated customer
 */
export async function saveCustomerAddressAction(rawInput: AddressInput, addressId?: string) {
  const parsed = AddressSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Données d\'adresse invalides' };
  }

  try {
    const supabase = createServerClient();
    const user = await requireAuth(supabase);
    const service = new CustomerAccountService(supabase);

    let address;
    if (addressId) {
      address = await service.updateAddress(user.userId, addressId, parsed.data);
    } else {
      address = await service.createAddress(user.userId, parsed.data);
    }

    return { success: true, address };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur d\'enregistrement de l\'adresse' };
  }
}

/**
 * Delete customer address
 */
export async function deleteCustomerAddressAction(addressId: string) {
  if (!addressId) {
    return { success: false, error: 'Identifiant d\'adresse manquant' };
  }

  try {
    const supabase = createServerClient();
    const user = await requireAuth(supabase);
    const service = new CustomerAccountService(supabase);

    await service.deleteAddress(user.userId, addressId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur lors de la suppression de l\'adresse' };
  }
}

/**
 * Set target address as primary default
 */
export async function setDefaultCustomerAddressAction(addressId: string) {
  if (!addressId) {
    return { success: false, error: 'Identifiant d\'adresse manquant' };
  }

  try {
    const supabase = createServerClient();
    const user = await requireAuth(supabase);
    const service = new CustomerAccountService(supabase);

    await service.setDefaultAddress(user.userId, addressId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur de définition de l\'adresse par défaut' };
  }
}
