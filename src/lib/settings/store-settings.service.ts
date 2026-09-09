// DRIPIDIN Authoritative Store Settings Business Service
// Cached, Database-Backed Singleton Provider with Fallback & Revalidation

import { unstable_cache, revalidateTag, updateTag, revalidatePath } from 'next/cache';
import type { StoreSettings, UpdateStoreSettingsInput } from '@/types/settings.types';
import type { UserAuthContext } from '@/types/rbac.types';
import { StoreSettingsRepository } from '@/lib/repositories/store-settings.repository';
import {
  DEFAULT_STORE_SETTINGS,
  mergeWithDefaultSettings,
} from '@/lib/settings/default-settings';
import { createServerClient } from '@/lib/auth/server';

export const STORE_SETTINGS_CACHE_TAG = 'store_settings';
export const STORE_SETTINGS_CACHE_KEY = 'store_settings_singleton';

export function safeRevalidateTag(tag: string) {
  try {
    if (typeof updateTag === 'function') {
      updateTag(tag);
    }
    if (typeof revalidateTag === 'function') {
      revalidateTag(tag, { expire: 0 });
    }
  } catch {
    // Ignored in non-Next runtime (e.g. node test runner)
  }
}

export function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignored in non-Next runtime
  }
}

/**
 * Direct database reader (un-cached).
 */
async function fetchStoreSettingsDirect(supabaseClient?: any): Promise<StoreSettings> {
  try {
    const supabase = supabaseClient || (await createServerClient());
    const repo = new StoreSettingsRepository(supabase);
    const dbSettings = await repo.getSingleton();
    return mergeWithDefaultSettings(dbSettings);
  } catch (err: any) {
    console.warn('[StoreSettingsService] Direct fetch warning, using default fallback:', err.message);
    return { ...DEFAULT_STORE_SETTINGS };
  }
}

/**
 * Next.js unstable_cache wrapper for high-performance cached reads.
 * Auto-revalidates when safeRevalidateTag('store_settings') is invoked.
 */
const getCachedStoreSettingsInternal = unstable_cache(
  async () => {
    return fetchStoreSettingsDirect();
  },
  [STORE_SETTINGS_CACHE_KEY],
  {
    tags: [STORE_SETTINGS_CACHE_TAG],
    revalidate: 3600, // Background revalidation after 1 hour if not purged
  }
);

export class StoreSettingsService {
  /**
   * 1. Get Store Settings
   * Resolves authoritative store settings from cache / database with fallback to DEFAULT_STORE_SETTINGS.
   * If a customClient is provided (e.g. in test suites or specialized contexts), bypasses Next.js cache.
   */
  static async getStoreSettings(customClient?: any): Promise<StoreSettings> {
    if (customClient) {
      return fetchStoreSettingsDirect(customClient);
    }

    try {
      return await getCachedStoreSettingsInternal();
    } catch {
      // Fallback for execution outside active Next.js request context
      return fetchStoreSettingsDirect();
    }
  }

  /**
   * 2. Synchronous Immediate Fallback
   * For early SSR renders, error boundaries, or static initial states before async resolution.
   */
  static getSynchronousFallback(): StoreSettings {
    return { ...DEFAULT_STORE_SETTINGS };
  }

  /**
   * 3. Update Store Settings
   * Validates inputs, persists to database via repository, and purges cache tags.
   */
  static async updateStoreSettings(
    input: UpdateStoreSettingsInput,
    authContext: UserAuthContext,
    customClient?: any
  ): Promise<StoreSettings> {
    // Validation
    if (input.storeName !== undefined && !input.storeName.trim()) {
      throw new Error('Le nom du magasin ne peut pas être vide.');
    }
    if (input.supportPhone !== undefined && !input.supportPhone.trim()) {
      throw new Error('Le numéro de téléphone du support est obligatoire.');
    }
    if (input.supportEmail !== undefined && !input.supportEmail.trim()) {
      throw new Error('L\'adresse email du support est obligatoire.');
    }

    const supabase = customClient || (await createServerClient());
    const repo = new StoreSettingsRepository(supabase);

    const updated = await repo.updateSingleton(input, authContext.userId);
    const result = mergeWithDefaultSettings(updated);
    if (authContext.email) {
      result.updatedBy = authContext.email;
    }

    // Invalidate Next.js cache tag and paths
    safeRevalidateTag(STORE_SETTINGS_CACHE_TAG);
    safeRevalidatePath('/');
    safeRevalidatePath('/admin');
    safeRevalidatePath('/checkout');
    safeRevalidatePath('/cart');

    return result;
  }
}
