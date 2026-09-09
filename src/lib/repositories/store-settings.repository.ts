// DRIPIDIN Store Settings Repository
// Direct PostgreSQL Data Access Layer for public.store_settings singleton table

import type { SupabaseClient } from '@supabase/supabase-js';
import type { StoreSettings, UpdateStoreSettingsInput } from '@/types/settings.types';
import {
  DEFAULT_STORE_SETTINGS,
  mapRowToStoreSettings,
  mapInputToRow,
  mergeWithDefaultSettings,
} from '@/lib/settings/default-settings';

export class StoreSettingsRepository {
  constructor(private supabase: SupabaseClient<any, any, any>) {}

  /**
   * Fetch the singleton store settings row (id = 'default').
   * Returns null if the row does not exist or if database query fails safely.
   */
  async getSingleton(): Promise<StoreSettings | null> {
    try {
      const table = this.supabase?.from ? (this.supabase.from('store_settings') as any) : null;
      if (!table || typeof table.select !== 'function') {
        return null;
      }

      const query = table.select('*').eq('id', 'default');
      const res = typeof query.maybeSingle === 'function'
        ? await query.maybeSingle()
        : (typeof query.single === 'function' ? await query.single() : await query);

      const data = res?.data;
      const error = res?.error;

      if (error) {
        console.warn('[StoreSettingsRepository.getSingleton] Supabase query warning:', error.message);
        return null;
      }

      if (!data) {
        return null;
      }

      return mapRowToStoreSettings(data);
    } catch (err: any) {
      console.error('[StoreSettingsRepository.getSingleton] Unexpected error:', err.message);
      return null;
    }
  }

  /**
   * Updates the singleton store settings row with caller-supplied fields.
   * Auto-increments version and sets updated_at / updated_by.
   */
  async updateSingleton(
    input: UpdateStoreSettingsInput,
    authUserId?: string
  ): Promise<StoreSettings> {
    const rowPayload = mapInputToRow(input);

    // Fetch current version to increment
    const current = await this.getSingleton();
    const currentVersion = current?.version ?? 1;
    rowPayload.version = currentVersion + 1;
    rowPayload.updated_at = new Date().toISOString();

    const isUuid = authUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authUserId);
    if (isUuid) {
      rowPayload.updated_by = authUserId;
    }

    const table = this.supabase?.from ? (this.supabase.from('store_settings') as any) : null;
    if (!table || typeof table.upsert !== 'function') {
      // Mock client fallback
      return mapRowToStoreSettings({ id: 'default', ...rowPayload });
    }

    // Upsert singleton row (id = 'default')
    const { data, error } = await table
      .upsert(
        {
          id: 'default',
          ...rowPayload,
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();

    if (error) {
      console.error('[StoreSettingsRepository.updateSingleton] Update failed:', error.message);
      throw new Error(`Échec de l'enregistrement des paramètres: ${error.message}`);
    }

    return mapRowToStoreSettings(data);
  }

  /**
   * Ensures the singleton row is initialized in the database.
   * Idempotent: does nothing if the row already exists.
   */
  async ensureInitialized(): Promise<StoreSettings> {
    const existing = await this.getSingleton();
    if (existing) {
      return existing;
    }

    const table = this.supabase?.from ? (this.supabase.from('store_settings') as any) : null;
    if (!table || typeof table.upsert !== 'function') {
      return { ...DEFAULT_STORE_SETTINGS };
    }

    const initialRow = mapInputToRow(DEFAULT_STORE_SETTINGS);
    const { data, error } = await table
      .upsert(
        {
          id: 'default',
          ...initialRow,
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();

    if (error) {
      console.warn('[StoreSettingsRepository.ensureInitialized] Initialization fallback:', error.message);
      return { ...DEFAULT_STORE_SETTINGS };
    }

    return mapRowToStoreSettings(data);
  }
}
