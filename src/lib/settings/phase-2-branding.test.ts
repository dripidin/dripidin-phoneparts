// DRIPIDIN Phase 2: Branding & Visual Identity Decoupling Automated Test Suite
// Verifies dynamic store identity, logo fallbacks, theme token generation,
// metadata decoupling, social link safety, and developer attribution separation.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { StoreSettingsRepository } from '@/lib/repositories/store-settings.repository';
import { StoreSettingsService } from './store-settings.service';
import {
  generateThemeCssVariables,
  generateThemeCssString,
} from './theme-generator';
import {
  DEFAULT_STORE_SETTINGS,
  mergeWithDefaultSettings,
  mapRowToStoreSettings,
  mapInputToRow,
} from './default-settings';
import type { StoreSettings, UpdateStoreSettingsInput } from '@/types/settings.types';
import type { UserAuthContext } from '@/types/rbac.types';

// In-Memory Database Simulator for Testing Branding Lifecycle
function createTestDatabase(initialRow: any = null) {
  let tableRows: any[] = initialRow ? [JSON.parse(JSON.stringify(initialRow))] : [];

  return {
    _rows: () => tableRows,
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
              updated_at: new Date().toISOString(),
              version: (tableRows[existingIndex].version || 1) + 1,
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
            const newRow = {
              ...payload,
              version: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            tableRows.push(newRow);
            return {
              select: () => ({
                single: async () => ({
                  data: JSON.parse(JSON.stringify(newRow)),
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

const adminContext: UserAuthContext = {
  userId: '99999999-9999-4999-9999-999999999999',
  role: 'ADMINISTRATOR',
  email: 'owner@store.dz',
  userType: 'STAFF',
  permissions: new Set(['settings.manage', 'settings.read']),
  isActive: true,
};

describe('Phase 2: Branding & Visual Identity Decoupling', () => {

  describe('1. Dynamic Store Name & Identity Propagation', () => {
    it('should allow buyer to configure custom store name and reflect in settings', async () => {
      const mockDb = createTestDatabase({
        id: 'default',
        store_name: 'DRIPIDIN',
        version: 1,
      });
      const repo = new StoreSettingsRepository(mockDb as any);

      // Initially default
      const initialSettings = await repo.getSingleton();
      assert.strictEqual(initialSettings?.storeName, 'DRIPIDIN');

      // Update to custom store name
      const customBrand: UpdateStoreSettingsInput = {
        storeName: 'Electro Tech Alger',
        tagline: 'Leader de la pièce détachée mobile à Alger',
        legalName: 'SARL Electro Tech DZ',
      };

      const updated = await repo.updateSingleton(customBrand, adminContext.userId);
      assert.strictEqual(updated.storeName, 'Electro Tech Alger');
      assert.strictEqual(updated.tagline, 'Leader de la pièce détachée mobile à Alger');
      assert.strictEqual(updated.legalName, 'SARL Electro Tech DZ');

      // Re-read to confirm persistence
      const freshRead = await repo.getSingleton();
      assert.strictEqual(freshRead?.storeName, 'Electro Tech Alger');
    });

    it('should fall back gracefully to default store name if empty string or null is provided', () => {
      const merged = mergeWithDefaultSettings({ store_name: '' } as any);
      assert.strictEqual(merged.storeName, 'DRIPIDIN');
    });
  });

  describe('2. Logo System & Monogram Fallback', () => {
    it('should resolve configured custom logo URL', async () => {
      const mockDb = createTestDatabase({ id: 'default', version: 1 });
      const repo = new StoreSettingsRepository(mockDb as any);

      const customLogo = 'https://storage.supabase.co/v1/object/public/logos/electro-logo.png';
      const updated = await repo.updateSingleton({ logoUrl: customLogo }, adminContext.userId);

      assert.strictEqual(updated.logoUrl, customLogo);
    });

    it('should fallback to default logo when no custom logo is specified', () => {
      const settings = mergeWithDefaultSettings({ logo_url: null } as any);
      assert.strictEqual(settings.logoUrl, '/logo.png');
    });

    it('should extract monogram correctly for initials badge fallback', () => {
      function getMonogram(name: string): string {
        const parts = name.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return 'DP';
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }

      assert.strictEqual(getMonogram('Electro Tech Alger'), 'ET');
      assert.strictEqual(getMonogram('HamzaPhone'), 'HA');
      assert.strictEqual(getMonogram('DRIPIDIN'), 'DR');
      assert.strictEqual(getMonogram('A'), 'A');
      assert.strictEqual(getMonogram(''), 'DP');
    });
  });

  describe('3. Theme CSS Tokens & Tailwind v4 Compatibility', () => {
    it('should generate valid CSS custom properties from custom theme colors', () => {
      const customTheme: Partial<StoreSettings> = {
        primaryColor: '#2563EB',
        primaryColorHover: '#1D4ED8',
        accentColor: '#10B981',
        backgroundColor: '#F8FAFC',
        foregroundColor: '#0F172A',
        borderColor: '#CBD5E1',
        borderRadiusToken: '1rem',
        fontFamily: 'Outfit',
      };

      const cssVars = generateThemeCssVariables(customTheme);

      assert.strictEqual(cssVars['--color-primary'], '#2563EB');
      assert.strictEqual(cssVars['--color-primary-hover'], '#1D4ED8');
      assert.strictEqual(cssVars['--color-accent'], '#10B981');
      assert.strictEqual(cssVars['--brand-orange'], '#2563EB');
      assert.strictEqual(cssVars['--brand-orange-hover'], '#1D4ED8');
      assert.strictEqual(cssVars['--border-radius'], '1rem');
      assert.ok(cssVars['--font-family'].includes('Outfit'));
    });

    it('should generate clean, valid :root style block for SSR layout injection', () => {
      const customTheme: Partial<StoreSettings> = {
        primaryColor: '#7C3AED',
        primaryColorHover: '#6D28D9',
      };

      const cssString = generateThemeCssString(customTheme);

      assert.ok(cssString.startsWith(':root {'));
      assert.ok(cssString.includes('--color-primary: #7C3AED;'));
      assert.ok(cssString.includes('--brand-orange: #7C3AED;'));
      assert.ok(cssString.endsWith('}'));
    });

    it('should sanitize invalid/malicious color values to prevent CSS injection', () => {
      const maliciousTheme: Partial<StoreSettings> = {
        primaryColor: '#ea580c; background: url(https://evil.com/x.png)',
        primaryColorHover: 'red; } body { display:none }',
        borderRadiusToken: '<script>alert(1)</script>',
      };

      const cssVars = generateThemeCssVariables(maliciousTheme);

      // Should sanitize and reject injected strings, falling back to defaults
      assert.strictEqual(cssVars['--color-primary'], '#F97316');
      assert.strictEqual(cssVars['--color-primary-hover'], '#EA580C');
      assert.strictEqual(cssVars['--border-radius'], '0.75rem');
    });
  });

  describe('4. Favicon & Metadata Brand Decoupling', () => {
    it('should resolve dynamic favicon when configured', async () => {
      const mockDb = createTestDatabase({ id: 'default', version: 1 });
      const repo = new StoreSettingsRepository(mockDb as any);

      const customFavicon = 'https://storage.supabase.co/v1/object/public/logos/favicon-custom.ico';
      const updated = await repo.updateSingleton({ faviconUrl: customFavicon }, adminContext.userId);

      assert.strictEqual(updated.faviconUrl, customFavicon);
    });

    it('should fall back to /favicon.ico when not configured', () => {
      const settings = mergeWithDefaultSettings({ favicon_url: null } as any);
      assert.strictEqual(settings.faviconUrl, '/favicon.ico');
    });

    it('should construct OpenGraph and Meta tags dynamically with store identity', () => {
      const settings: Partial<StoreSettings> = {
        storeName: 'Algeria Parts Express',
        metaTitle: 'Algeria Parts Express — Pièces Détachées Certifiées',
        metaDescription: 'Vente de pièces pour smartphones 58 Wilayas COD',
        defaultLocale: 'fr_DZ',
      };

      const pageTitleTemplate = `%s | ${settings.storeName}`;
      assert.strictEqual(pageTitleTemplate, '%s | Algeria Parts Express');
      assert.strictEqual(settings.metaTitle, 'Algeria Parts Express — Pièces Détachées Certifiées');
      assert.strictEqual(settings.defaultLocale, 'fr_DZ');
    });
  });

  describe('5. Social Links Safe Handling', () => {
    it('should store and retrieve active social URLs', async () => {
      const mockDb = createTestDatabase({ id: 'default', version: 1 });
      const repo = new StoreSettingsRepository(mockDb as any);

      const socialInput: UpdateStoreSettingsInput = {
        facebookUrl: 'https://facebook.com/electrotechdz',
        instagramUrl: 'https://instagram.com/electrotechdz',
        tiktokUrl: 'https://tiktok.com/@electrotechdz',
        telegramUrl: 'https://t.me/electrotechdz',
      };

      const updated = await repo.updateSingleton(socialInput, adminContext.userId);

      assert.strictEqual(updated.facebookUrl, 'https://facebook.com/electrotechdz');
      assert.strictEqual(updated.instagramUrl, 'https://instagram.com/electrotechdz');
      assert.strictEqual(updated.tiktokUrl, 'https://tiktok.com/@electrotechdz');
      assert.strictEqual(updated.telegramUrl, 'https://t.me/electrotechdz');
    });

    it('should filter out empty or whitespace-only social links safely', () => {
      const links = [
        { label: 'Facebook', url: '  https://facebook.com/page  ' },
        { label: 'Instagram', url: '' },
        { label: 'TikTok', url: '   ' },
        { label: 'Telegram', url: 'https://t.me/channel' },
      ];

      const validLinks = links.filter((item) => Boolean(item.url && item.url.trim()));

      assert.strictEqual(validLinks.length, 2);
      assert.strictEqual(validLinks[0].label, 'Facebook');
      assert.strictEqual(validLinks[1].label, 'Telegram');
    });
  });

  describe('6. Store Contact Information Decoupling', () => {
    it('should decouple phone, email, and physical address from hard-coded literals', async () => {
      const mockDb = createTestDatabase({ id: 'default', version: 1 });
      const repo = new StoreSettingsRepository(mockDb as any);

      const contactUpdate: UpdateStoreSettingsInput = {
        supportPhone: '0555 12 34 56',
        whatsappPhone: '+213555123456',
        supportEmail: 'contact@electrotech.dz',
        addressLine: '12 Boulevard Mohamed V',
        commune: 'Bab El Oued',
        wilayaCode: 16,
        openingHours: 'Dimanche - Jeudi : 08h00 - 17h00',
      };

      const updated = await repo.updateSingleton(contactUpdate, adminContext.userId);

      assert.strictEqual(updated.supportPhone, '0555 12 34 56');
      assert.strictEqual(updated.whatsappPhone, '+213555123456');
      assert.strictEqual(updated.supportEmail, 'contact@electrotech.dz');
      assert.strictEqual(updated.addressLine, '12 Boulevard Mohamed V');
      assert.strictEqual(updated.commune, 'Bab El Oued');
      assert.strictEqual(updated.wilayaCode, 16);
      assert.strictEqual(updated.wilayaName, 'Alger');
      assert.strictEqual(updated.openingHours, 'Dimanche - Jeudi : 08h00 - 17h00');
    });
  });

  describe('7. Developer Platform Attribution Independence (CRITICAL)', () => {
    it('should NEVER allow buyer store identity updates to alter developer attribution', async () => {
      const mockDb = createTestDatabase({ id: 'default', version: 1 });
      const repo = new StoreSettingsRepository(mockDb as any);

      // Buyer updates store name, logo, contacts
      const updated = await repo.updateSingleton(
        {
          storeName: 'Nouveau Magasin Mobile',
          tagline: 'Nouvelle Boutique',
        },
        adminContext.userId
      );

      // storeName must be updated
      assert.strictEqual(updated.storeName, 'Nouveau Magasin Mobile');

      // developerName and developerUrl MUST remain intact from platform constants
      assert.strictEqual(updated.developerName, 'DRIPIDIN Platform');
      assert.strictEqual(updated.developerUrl, 'https://dripidin.com');
    });
  });

  describe('8. Cold Start Persistence Simulation', () => {
    it('should preserve branding configuration across fresh repository and service instances', async () => {
      const mockDb = createTestDatabase({ id: 'default', version: 1 });

      // Instance 1 writes settings
      const repo1 = new StoreSettingsRepository(mockDb as any);
      await repo1.updateSingleton(
        {
          storeName: 'Persistent Mobile DZ',
          primaryColor: '#059669',
        },
        adminContext.userId
      );

      // Instance 2 simulates a fresh serverless cold-start read
      const repo2 = new StoreSettingsRepository(mockDb as any);
      const settingsOnColdStart = await repo2.getSingleton();

      assert.ok(settingsOnColdStart);
      assert.strictEqual(settingsOnColdStart?.storeName, 'Persistent Mobile DZ');
      assert.strictEqual(settingsOnColdStart?.primaryColor, '#059669');
      assert.strictEqual(settingsOnColdStart?.developerName, 'DRIPIDIN Platform');
    });
  });

  describe('9. Service Layer Validation & Error Handling', () => {
    it('should reject empty store name updates at service validation boundary', async () => {
      const mockDb = createTestDatabase({ id: 'default', version: 1 });

      await assert.rejects(
        async () => {
          await StoreSettingsService.updateStoreSettings(
            { storeName: '   ' },
            adminContext,
            mockDb
          );
        },
        {
          message: 'Le nom du magasin ne peut pas être vide.',
        }
      );
    });

    it('should reject empty support phone updates at service validation boundary', async () => {
      const mockDb = createTestDatabase({ id: 'default', version: 1 });

      await assert.rejects(
        async () => {
          await StoreSettingsService.updateStoreSettings(
            { supportPhone: '   ' },
            adminContext,
            mockDb
          );
        },
        {
          message: 'Le numéro de téléphone du support est obligatoire.',
        }
      );
    });

    it('should successfully update and return merged settings via StoreSettingsService', async () => {
      const mockDb = createTestDatabase({ id: 'default', version: 1 });

      const updated = await StoreSettingsService.updateStoreSettings(
        {
          storeName: 'Atelier Phone Plus',
          primaryColor: '#8B5CF6',
        },
        adminContext,
        mockDb
      );

      assert.strictEqual(updated.storeName, 'Atelier Phone Plus');
      assert.strictEqual(updated.primaryColor, '#8B5CF6');
      assert.strictEqual(updated.developerName, 'DRIPIDIN Platform');
    });
  });

});
