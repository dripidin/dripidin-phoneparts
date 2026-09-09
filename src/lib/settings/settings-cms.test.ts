// HamzaPhone Website Settings & Homepage CMS Automated Test Suite

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SettingsCmsService } from './settings-cms.service';
import {
  getWebsiteSettingsAction,
  updateWebsiteSettingsAction,
  getSettingsHistoryAction,
  getHomepageSectionsAction,
  updateHomepageSectionAction,
  toggleHomepageSectionAction,
  reorderHomepageSectionsAction,
} from '@/lib/actions/settings-cms.actions';

// Mock persona builder for server action RBAC testing
function createMockPersonaClient(options: {
  userId?: string;
  email?: string;
  userType?: string;
  role?: string;
  permissions?: string[];
}) {
  const user = options.userId ? { id: options.userId, email: options.email || 'admin@hamzaphone.dz' } : null;
  const profile = options.userId
    ? {
        id: options.userId,
        email: options.email || 'admin@hamzaphone.dz',
        user_type: options.userType || 'STAFF',
        is_active: true,
      }
    : null;

  const mockUserRoles = [
    {
      roles: {
        code: options.role || 'ADMINISTRATOR',
        role_permissions: (options.permissions || ['all']).map((p) => ({
          permissions: { code: p },
        })),
      },
    },
  ];

  const auditLogs: any[] = [];
  let currentStoreSettingsRow: any = {
    id: 'default',
    store_name: 'DRIPIDIN',
    support_email: 'metachagour@gmail.com',
    support_phone: '+213 793 73 13 10',
    whatsapp_phone: '+213 540 09 51 66',
    address_line: '',
    city_commune: 'Biskra',
    wilaya_code: 7,
    version: 1,
  };

  return {
    _auditLogs: auditLogs,
    auth: {
      getUser: async () => ({
        data: { user },
        error: user ? null : new Error('Auth session missing'),
      }),
    },
    from: (table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: profile, error: profile ? null : new Error('Not found') }),
            }),
          }),
        };
      }
      if (table === 'user_roles') {
        return {
          select: () => ({
            eq: async () => ({ data: mockUserRoles, error: null }),
          }),
        };
      }
      if (table === 'audit_logs') {
        return {
          insert: async (entry: any) => {
            auditLogs.push(entry);
            return { data: entry, error: null };
          },
        };
      }
      if (table === 'store_settings') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: currentStoreSettingsRow, error: null }),
              single: async () => ({ data: currentStoreSettingsRow, error: null }),
            }),
          }),
          upsert: (payload: any) => {
            currentStoreSettingsRow = { ...currentStoreSettingsRow, ...payload };
            return {
              select: () => ({
                single: async () => ({ data: currentStoreSettingsRow, error: null }),
              }),
            };
          },
        };
      }
      return {
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
      };
    },
  };
}

describe('HamzaPhone Website Settings & Homepage CMS Engine', () => {
  const adminClient = createMockPersonaClient({
    userId: 'user-admin',
    email: 'admin@hamzaphone.dz',
    role: 'ADMINISTRATOR',
    permissions: ['settings.read', 'settings.manage', 'cms.read', 'cms.manage', 'audit.read'],
  });

  const contentManagerClient = createMockPersonaClient({
    userId: 'user-content',
    email: 'content@hamzaphone.dz',
    role: 'CONTENT_MANAGER',
    permissions: ['cms.read', 'cms.manage', 'settings.read'], // No settings.manage
  });

  const viewerClient = createMockPersonaClient({
    userId: 'user-viewer',
    email: 'viewer@hamzaphone.dz',
    role: 'VIEWER',
    permissions: ['settings.read', 'cms.read'], // No settings.manage or cms.manage
  });

  const b2cCustomerClient = createMockPersonaClient({
    userId: 'user-customer',
    email: 'client@gmail.com',
    userType: 'B2C',
    role: 'B2C_CUSTOMER',
    permissions: ['products.read'],
  });

  describe('1. Public Website Settings Retrieval & Dynamic Defaults', () => {
    it('should retrieve active website settings with default 58 Wilaya messaging', async () => {
      const settings = await getWebsiteSettingsAction();
      assert.ok(settings);
      assert.strictEqual(settings.storeName, 'DRIPIDIN');
      assert.strictEqual(settings.coverageWilayasCount, 58);
      assert.ok(settings.supportPhone);
      assert.ok(settings.announcementBarEnabled);
    });
  });

  describe('2. Website Settings Updates, Versioning & Audit Recording', () => {
    it('should allow authorized admin to update contact details and increment version', async () => {
      const updated = await updateWebsiteSettingsAction(
        {
          supportPhone: '0555 99 88 77',
          announcementBarText: '🚚 Livraison Express 58 Wilayas en 24h/48h avec EcoTrack !',
        },
        adminClient
      );

      assert.strictEqual(updated.supportPhone, '0555 99 88 77');
      assert.strictEqual(
        updated.announcementBarText,
        '🚚 Livraison Express 58 Wilayas en 24h/48h avec EcoTrack !'
      );
      assert.ok(updated.version >= 2);
      assert.strictEqual(updated.updatedBy, 'admin@hamzaphone.dz');

      // Verify history audit record
      const history = await getSettingsHistoryAction(adminClient);
      assert.ok(history.length >= 2);
      assert.strictEqual(history[0].changedBy, 'admin@hamzaphone.dz');
    });

    it('should allow updating store/warehouse Wilaya, Commune, address and Logo', async () => {
      const updated = await updateWebsiteSettingsAction(
        {
          wilayaCode: 31,
          wilayaName: 'Oran',
          commune: 'Bir El Djir',
          addressLine: 'Zone d’Activité 2, Oran',
          logoUrl: '/branding/store-logo-oran.png',
        },
        adminClient
      );

      assert.strictEqual(updated.wilayaCode, 31);
      assert.strictEqual(updated.wilayaName, 'Oran');
      assert.strictEqual(updated.commune, 'Bir El Djir');
      assert.strictEqual(updated.addressLine, 'Zone d’Activité 2, Oran');
      assert.strictEqual(updated.logoUrl, '/branding/store-logo-oran.png');
    });

    it('should reject update if store name or support phone is empty (Validation)', async () => {
      await assert.rejects(
        async () => {
          await updateWebsiteSettingsAction({ storeName: '   ' }, adminClient);
        },
        /Le nom du magasin ne peut pas être vide/i
      );

      await assert.rejects(
        async () => {
          await updateWebsiteSettingsAction({ supportPhone: '' }, adminClient);
        },
        /Le numéro de téléphone du support est obligatoire/i
      );
    });

    it('should reject staff without settings.manage from updating settings (RBAC Guard)', async () => {
      await assert.rejects(
        async () => {
          await updateWebsiteSettingsAction({ storeName: 'Hacked Store' }, contentManagerClient);
        },
        /Missing required permission \[settings.manage\]/i
      );
    });
  });

  describe('3. Structured Homepage CMS Sections', () => {
    it('should retrieve ordered homepage sections', async () => {
      const sections = await getHomepageSectionsAction(true);
      assert.ok(sections.length >= 8);

      // Verify orderIndex is sequential
      for (let i = 0; i < sections.length - 1; i++) {
        assert.ok(sections[i].orderIndex <= sections[i + 1].orderIndex);
      }
    });

    it('should allow Content Manager to update section title and CTA', async () => {
      const updatedSection = await updateHomepageSectionAction(
        'sec-hero',
        {
          title: 'Toutes vos Pièces Détachées Smartphones en Algérie',
          ctaLabel: 'Découvrir nos Écrans & Batteries',
        },
        contentManagerClient
      );

      assert.strictEqual(
        updatedSection.title,
        'Toutes vos Pièces Détachées Smartphones en Algérie'
      );
      assert.strictEqual(updatedSection.ctaLabel, 'Découvrir nos Écrans & Batteries');
      assert.strictEqual(updatedSection.updatedBy, 'content@hamzaphone.dz');
    });

    it('should allow toggling section visibility (enable / disable)', async () => {
      const toggled = await toggleHomepageSectionAction('sec-reviews', false, contentManagerClient);
      assert.strictEqual(toggled.enabled, false);

      // Verify non-disabled query excludes it
      const activeOnly = await getHomepageSectionsAction(false);
      assert.strictEqual(activeOnly.find((s) => s.id === 'sec-reviews'), undefined);

      // Toggle back on
      await toggleHomepageSectionAction('sec-reviews', true, contentManagerClient);
    });

    it('should allow reordering sections and update orderIndex accordingly', async () => {
      const sections = await getHomepageSectionsAction(true);
      const reversedIds = sections.map((s) => s.id).reverse();

      const reordered = await reorderHomepageSectionsAction(
        { orderedSectionIds: reversedIds },
        contentManagerClient
      );

      assert.strictEqual(reordered[0].id, reversedIds[0]);
      assert.strictEqual(reordered[0].orderIndex, 1);
    });

    it('should reject viewer without cms.manage from modifying homepage sections', async () => {
      await assert.rejects(
        async () => {
          await updateHomepageSectionAction('sec-hero', { title: 'Unauthorized Title' }, viewerClient);
        },
        /Missing required permission \[cms.manage\]/i
      );
    });
  });
});
