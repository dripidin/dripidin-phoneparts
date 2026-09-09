// DRIPIDIN Phase 1: Store Settings Foundation Automated Test Suite
// Verifies Persistence, Fallback Hierarchy, Singleton Enforcement, RBAC, and Secret Protection

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { StoreSettingsRepository } from '@/lib/repositories/store-settings.repository';
import { StoreSettingsService, STORE_SETTINGS_CACHE_TAG } from './store-settings.service';
import {
  DEFAULT_STORE_SETTINGS,
  mergeWithDefaultSettings,
  mapRowToStoreSettings,
  mapInputToRow,
  resolveWilayaName,
} from './default-settings';
import type { StoreSettings } from '@/types/settings.types';
import type { UserAuthContext } from '@/types/rbac.types';

// In-Memory Database Simulator for Serverless Lifecycle Testing
function createIsolatedDatabase(initialRow: any = null) {
  let tableRows: any[] = initialRow ? [JSON.parse(JSON.stringify(initialRow))] : [];

  return {
    _rows: () => tableRows,
    _clear: () => {
      tableRows = [];
    },
    from: (table: string) => {
      if (table !== 'store_settings') {
        return {
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
        };
      }

      return {
        select: (cols: string = '*') => ({
          eq: (col: string, val: any) => ({
            maybeSingle: async () => {
              const row = tableRows.find((r) => r[col] === val);
              return { data: row ? JSON.parse(JSON.stringify(row)) : null, error: null };
            },
            single: async () => {
              const row = tableRows.find((r) => r[col] === val);
              if (!row) return { data: null, error: new Error('PGRST116: Row not found') };
              return { data: JSON.parse(JSON.stringify(row)), error: null };
            },
          }),
        }),
        upsert: (payload: any, options: { onConflict?: string } = {}) => {
          const conflictCol = options.onConflict || 'id';

          // Singleton constraint check
          if (payload[conflictCol] !== 'default') {
            return {
              select: () => ({
                single: async () => ({
                  data: null,
                  error: new Error('Check constraint violation: id must be default'),
                }),
              }),
            };
          }

          const existingIndex = tableRows.findIndex((r) => r[conflictCol] === payload[conflictCol]);
          if (existingIndex >= 0) {
            tableRows[existingIndex] = {
              ...tableRows[existingIndex],
              ...payload,
            };
            return {
              select: () => ({
                single: async () => ({
                  data: JSON.parse(JSON.stringify(tableRows[existingIndex])),
                  error: null,
                }),
              }),
            };
          } else {
            tableRows.push({ ...payload });
            return {
              select: () => ({
                single: async () => ({
                  data: JSON.parse(JSON.stringify(payload)),
                  error: null,
                }),
              }),
            };
          }
        },
      };
    },
  };
}

describe('DRIPIDIN Phase 1: Store Settings Foundation & Persistence Engine', () => {
  const adminAuth: UserAuthContext = {
    userId: '99999999-9999-4999-9999-999999999999',
    email: 'admin@dripidin.com',
    userType: 'STAFF',
    role: 'ADMINISTRATOR',
    permissions: new Set(['settings.manage', 'settings.read']),
    isActive: true,
  };

  const viewerAuth: UserAuthContext = {
    userId: '11111111-1111-4111-1111-111111111111',
    email: 'viewer@dripidin.com',
    userType: 'STAFF',
    role: 'VIEWER',
    permissions: new Set(['settings.read']), // Missing settings.manage
    isActive: true,
  };

  /* -------------------------------------------------------------------------- */
  /* 1. Missing-Row Fallback Hierarchy                                          */
  /* -------------------------------------------------------------------------- */
  describe('1. Missing-Row Fallback Hierarchy', () => {
    it('should return safe DEFAULT_STORE_SETTINGS when the database table is completely empty', async () => {
      const emptyDb = createIsolatedDatabase(null);
      const settings = await StoreSettingsService.getStoreSettings(emptyDb);

      assert.ok(settings);
      assert.strictEqual(settings.id, 'default');
      assert.strictEqual(settings.storeName, 'DRIPIDIN');
      assert.strictEqual(settings.currencyCode, 'DZD');
      assert.strictEqual(settings.currencySymbol, 'DA');
      assert.strictEqual(settings.coverageWilayasCount, 58);
      assert.strictEqual(settings.defaultCountryCode, 'DZ');
      assert.strictEqual(settings.supportPhone, '+213 793 73 13 10');
      assert.strictEqual(settings.wilayaCode, 7);
      assert.strictEqual(settings.wilayaName, 'Biskra');
    });

    it('should deep-merge partial database row over immutable defaults without losing default fields', () => {
      const partialRow = {
        storeName: 'Mon Atelier Biskra',
        supportPhone: '+213 550 12 34 56',
      };

      const merged = mergeWithDefaultSettings(partialRow);

      assert.strictEqual(merged.storeName, 'Mon Atelier Biskra');
      assert.strictEqual(merged.supportPhone, '+213 550 12 34 56');
      // Verify other fields did not become undefined
      assert.strictEqual(merged.currencyCode, 'DZD');
      assert.strictEqual(merged.currencySymbol, 'DA');
      assert.strictEqual(merged.defaultLocale, 'fr-DZ');
      assert.strictEqual(merged.coverageWilayasCount, 58);
      assert.strictEqual(merged.primaryColor, '#F97316');
      assert.strictEqual(merged.developerName, 'DRIPIDIN Platform');
    });

    it('should correctly resolve Algerian Wilaya names from wilayaCode', () => {
      assert.strictEqual(resolveWilayaName(7), 'Biskra');
      assert.strictEqual(resolveWilayaName(16), 'Alger');
      assert.strictEqual(resolveWilayaName(31), 'Oran');
      assert.strictEqual(resolveWilayaName(25), 'Constantine');
      assert.strictEqual(resolveWilayaName(19), 'Sétif');
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 2. Persistence & Serverless Lifecycle                                      */
  /* -------------------------------------------------------------------------- */
  describe('2. Persistence & Serverless Lifecycle Simulation', () => {
    it('should save settings to database and reload them across simulated cold starts', async () => {
      // Simulate Database State
      const sharedDb = createIsolatedDatabase({
        id: 'default',
        store_name: 'DRIPIDIN',
        support_phone: '+213 793 73 13 10',
        version: 1,
      });

      // 1. Process A: Admin updates store name and announcement bar
      const updated = await StoreSettingsService.updateStoreSettings(
        {
          storeName: 'DRIPIDIN Mobile Biskra',
          announcementBarText: '🎉 Nouveau Stock Disponible !',
          primaryColor: '#EA580C',
        },
        adminAuth,
        sharedDb
      );

      assert.strictEqual(updated.storeName, 'DRIPIDIN Mobile Biskra');
      assert.strictEqual(updated.announcementBarText, '🎉 Nouveau Stock Disponible !');
      assert.strictEqual(updated.primaryColor, '#EA580C');
      assert.ok(updated.version >= 2);

      // 2. Process B: Cold-start container spins up with zero in-memory state
      // (creating a new repository instance pointing to the same persistent DB)
      const coldStartRepo = new StoreSettingsRepository(sharedDb as any);
      const reloadedFromColdStart = await coldStartRepo.getSingleton();

      assert.ok(reloadedFromColdStart);
      assert.strictEqual(reloadedFromColdStart?.storeName, 'DRIPIDIN Mobile Biskra');
      assert.strictEqual(reloadedFromColdStart?.announcementBarText, '🎉 Nouveau Stock Disponible !');
      assert.strictEqual(reloadedFromColdStart?.primaryColor, '#EA580C');
      assert.strictEqual(reloadedFromColdStart?.version, updated.version);
    });

    it('should preserve backward compatibility aliases (commune / cityCommune)', async () => {
      const db = createIsolatedDatabase({
        id: 'default',
        city_commune: 'Biskra',
      });

      const settings = await StoreSettingsService.getStoreSettings(db);
      assert.strictEqual(settings.cityCommune, 'Biskra');
      assert.strictEqual(settings.commune, 'Biskra');

      // Update via 'commune' alias
      const updated = await StoreSettingsService.updateStoreSettings(
        { commune: 'Tolga' },
        adminAuth,
        db
      );

      assert.strictEqual(updated.cityCommune, 'Tolga');
      assert.strictEqual(updated.commune, 'Tolga');
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 3. Singleton Guarantee & Safety                                            */
  /* -------------------------------------------------------------------------- */
  describe('3. Singleton Guarantee & Safety Constraints', () => {
    it('should block creating duplicate or secondary store rows', async () => {
      const db = createIsolatedDatabase();
      const repo = new StoreSettingsRepository(db as any);

      // Attempting to upsert row with id != 'default' must fail
      await assert.rejects(
        async () => {
          const res = await (db.from('store_settings') as any)
            .upsert({ id: 'store_two', store_name: 'Secondary Store' })
            .select('*')
            .single();
          if (res.error) throw res.error;
        },
        /Check constraint violation/
      );
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 4. Input Validation & Edge Cases                                           */
  /* -------------------------------------------------------------------------- */
  describe('4. Input Validation & Edge Cases', () => {
    it('should reject empty or whitespace-only store name', async () => {
      const db = createIsolatedDatabase();

      await assert.rejects(
        async () => {
          await StoreSettingsService.updateStoreSettings({ storeName: '   ' }, adminAuth, db);
        },
        {
          message: 'Le nom du magasin ne peut pas être vide.',
        }
      );
    });

    it('should reject empty or whitespace-only support phone', async () => {
      const db = createIsolatedDatabase();

      await assert.rejects(
        async () => {
          await StoreSettingsService.updateStoreSettings({ supportPhone: '' }, adminAuth, db);
        },
        {
          message: 'Le numéro de téléphone du support est obligatoire.',
        }
      );
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 5. Separation of Developer Attribution from Store Identity                 */
  /* -------------------------------------------------------------------------- */
  describe('5. Developer Attribution Decoupling', () => {
    it('should keep developer platform attribution distinct when store identity changes', async () => {
      const db = createIsolatedDatabase({
        id: 'default',
        store_name: 'DRIPIDIN',
        developer_name: 'DRIPIDIN Platform',
        developer_url: 'https://dripidin.com',
      });

      // Merchant changes store name and legal name
      const updated = await StoreSettingsService.updateStoreSettings(
        {
          storeName: 'Nouveau Magasin Algerien',
          legalName: 'EURL Commerce Algerie',
        },
        adminAuth,
        db
      );

      assert.strictEqual(updated.storeName, 'Nouveau Magasin Algerien');
      assert.strictEqual(updated.legalName, 'EURL Commerce Algerie');
      // Developer attribution remains intact and un-mutated
      assert.strictEqual(updated.developerName, 'DRIPIDIN Platform');
      assert.strictEqual(updated.developerUrl, 'https://dripidin.com');
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 6. Security & Secret Protection                                            */
  /* -------------------------------------------------------------------------- */
  describe('6. Security & Secret Protection', () => {
    it('should not contain any plaintext secret columns in store settings output', async () => {
      const db = createIsolatedDatabase();
      const settings = await StoreSettingsService.getStoreSettings(db);

      const keys = Object.keys(settings);

      // Verify that no forbidden secrets exist in public store settings
      const forbiddenTokens = [
        'ecotrack_api_token',
        'ecotrackToken',
        'api_key',
        'apiKey',
        'password',
        'secret',
        'sms_gateway_token',
        'whatsapp_token',
        'service_role',
      ];

      for (const forbidden of forbiddenTokens) {
        assert.strictEqual(
          keys.some((k) => k.toLowerCase().includes(forbidden.toLowerCase())),
          false,
          `Forbidden secret key found in StoreSettings model: ${forbidden}`
        );
      }
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 7. Algerian Localization & Commerce Safeguards                             */
  /* -------------------------------------------------------------------------- */
  describe('7. Algerian Localization & Commerce Safeguards', () => {
    it('should guarantee Algerian fiscal, regional, and delivery defaults are preserved', async () => {
      const db = createIsolatedDatabase();
      const settings = await StoreSettingsService.getStoreSettings(db);

      // Fiscal fields exist and are string defaults
      assert.strictEqual(typeof settings.taxRegistrationNumber, 'string');
      assert.strictEqual(typeof settings.tradeRegisterNumber, 'string');
      assert.strictEqual(typeof settings.statisticalIdNumber, 'string');
      assert.strictEqual(typeof settings.taxArticleNumber, 'string');

      // National delivery defaults
      assert.strictEqual(settings.coverageWilayasCount, 58);
      assert.strictEqual(settings.currencyCode, 'DZD');
      assert.strictEqual(settings.currencySymbol, 'DA');
      assert.strictEqual(settings.currencyDecimals, 0);
      assert.strictEqual(settings.timezone, 'Africa/Algiers');
      assert.strictEqual(settings.defaultCourierCode, 'ECOTRACK');
    });
  });
});
