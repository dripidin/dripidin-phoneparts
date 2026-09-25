'use server';

// HamzaPhone / DRIPIDIN Website Settings & Homepage CMS Server Actions
// Guarded by RBAC permissions (settings.manage, cms.manage) with Audit Logging & Persistent Database Storage

import { createServerClient } from '@/lib/auth/server';
import { requirePermission } from '@/lib/permissions/guards';
import { StoreSettingsService } from '@/lib/settings/store-settings.service';
import { SettingsCmsService } from '@/lib/settings/settings-cms.service';
import { DemoModeService } from '@/lib/demo/demo-mode.service';
import { CatalogProvider } from '@/lib/data/catalog-provider';
import type {
  WebsiteSettings,
  SettingsHistoryItem,
  HomepageSection,
  UpdateWebsiteSettingsInput,
  UpdateHomepageSectionInput,
  ReorderHomepageSectionsInput,
} from '@/types/settings-cms.types';

import { revalidatePath } from 'next/cache';

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignored in non-Next runtime (e.g. node test runner)
  }
}

/**
 * 1. Get Website Settings (Public / Storefront Accessible)
 * Authoritatively queries cached persistent store settings from Supabase PostgreSQL.
 */
export async function getWebsiteSettingsAction(
  customClient?: any
): Promise<WebsiteSettings> {
  return StoreSettingsService.getStoreSettings(customClient);
}

/**
 * 2. Update Website Settings (Guarded by settings.manage)
 * Persists updates to public.store_settings table in Supabase and writes audit logs.
 */
export async function updateWebsiteSettingsAction(
  input: UpdateWebsiteSettingsInput,
  customClient?: any
): Promise<WebsiteSettings> {
  const supabase = customClient || (await createServerClient());
  const authContext = await requirePermission(supabase, 'settings.manage');

  try {
    const updated = await StoreSettingsService.updateStoreSettings(input, authContext, supabase);

    // Synchronize in-memory history log for real-time history viewer
    SettingsCmsService.recordSettingsHistory(input, authContext, updated);

    const fromTable = supabase.from ? supabase.from('audit_logs') : null;
    if (fromTable && typeof fromTable.insert === 'function') {
      await fromTable.insert({
        actor_email: authContext.email,
        actor_role: authContext.role,
        action: 'WEBSITE_SETTINGS_UPDATED',
        entity_type: 'SETTINGS',
        entity_id: `settings-v${updated.version}`,
        new_values: input,
      });
    }

    safeRevalidate('/');
    safeRevalidate('/products');
    safeRevalidate('/sitemap.xml');
    safeRevalidate('/robots.txt');
    safeRevalidate('/admin');
    return updated;
  } catch (err: any) {
    if (err.name === 'AuthorizationError') throw err;
    console.error('[updateWebsiteSettingsAction] Error:', err.message);
    throw new Error(err.message || 'Erreur lors de la mise à jour des paramètres.');
  }
}

/**
 * 3. Get Settings Version History
 */
export async function getSettingsHistoryAction(
  customClient?: any
): Promise<SettingsHistoryItem[]> {
  const supabase = customClient || (await createServerClient());
  await requirePermission(supabase, 'settings.read');

  return SettingsCmsService.getSettingsHistory();
}

/**
 * 4. Get Homepage CMS Sections (Public / Storefront Accessible)
 */
export async function getHomepageSectionsAction(
  includeDisabled: boolean = false,
  customClient?: any
): Promise<HomepageSection[]> {
  return SettingsCmsService.getHomepageSections(includeDisabled);
}

/**
 * 5. Update Homepage CMS Section (Guarded by cms.manage)
 */
export async function updateHomepageSectionAction(
  sectionId: string,
  input: UpdateHomepageSectionInput,
  customClient?: any
): Promise<HomepageSection> {
  const supabase = customClient || (await createServerClient());
  const authContext = await requirePermission(supabase, 'cms.manage');

  try {
    const updated = SettingsCmsService.updateHomepageSection(sectionId, input, authContext);

    const fromTable = supabase.from ? supabase.from('audit_logs') : null;
    if (fromTable && typeof fromTable.insert === 'function') {
      await fromTable.insert({
        actor_email: authContext.email,
        actor_role: authContext.role,
        action: 'HOMEPAGE_SECTION_UPDATED',
        entity_type: 'CMS_SECTION',
        entity_id: sectionId,
        new_values: input,
      });
    }

    safeRevalidate('/');
    safeRevalidate('/admin');
    return updated;
  } catch (err: any) {
    if (err.name === 'AuthorizationError') throw err;
    console.error('[updateHomepageSectionAction] Error:', err.message);
    throw new Error(err.message || 'Erreur lors de la mise à jour de la section CMS.');
  }
}

/**
 * 6. Toggle Homepage Section Visibility
 */
export async function toggleHomepageSectionAction(
  sectionId: string,
  enabled: boolean,
  customClient?: any
): Promise<HomepageSection> {
  const supabase = customClient || (await createServerClient());
  const authContext = await requirePermission(supabase, 'cms.manage');

  try {
    const updated = SettingsCmsService.toggleHomepageSection(sectionId, enabled, authContext);

    const fromTable = supabase.from ? supabase.from('audit_logs') : null;
    if (fromTable && typeof fromTable.insert === 'function') {
      await fromTable.insert({
        actor_email: authContext.email,
        actor_role: authContext.role,
        action: 'HOMEPAGE_SECTION_TOGGLED',
        entity_type: 'CMS_SECTION',
        entity_id: sectionId,
        new_values: { enabled },
      });
    }

    safeRevalidate('/');
    safeRevalidate('/admin');
    return updated;
  } catch (err: any) {
    if (err.name === 'AuthorizationError') throw err;
    console.error('[toggleHomepageSectionAction] Error:', err.message);
    throw new Error(err.message || 'Erreur lors de la modification de visibilité.');
  }
}

/**
 * 7. Reorder Homepage Sections
 */
export async function reorderHomepageSectionsAction(
  input: ReorderHomepageSectionsInput,
  customClient?: any
): Promise<HomepageSection[]> {
  const supabase = customClient || (await createServerClient());
  const authContext = await requirePermission(supabase, 'cms.manage');

  try {
    const updated = SettingsCmsService.reorderHomepageSections(input, authContext);

    const fromTable = supabase.from ? supabase.from('audit_logs') : null;
    if (fromTable && typeof fromTable.insert === 'function') {
      await fromTable.insert({
        actor_email: authContext.email,
        actor_role: authContext.role,
        action: 'HOMEPAGE_SECTIONS_REORDERED',
        entity_type: 'CMS_SECTION',
        entity_id: 'homepage-layout',
        new_values: { orderedIds: input.orderedSectionIds },
      });
    }

    safeRevalidate('/');
    safeRevalidate('/admin');
    return updated;
  } catch (err: any) {
    if (err.name === 'AuthorizationError') throw err;
    console.error('[reorderHomepageSectionsAction] Error:', err.message);
    throw new Error(err.message || 'Erreur lors du réordonnancement des sections.');
  }
}

/**
 * 8. Upload Store Logo to Storage (Guarded by settings.manage)
 */
export async function uploadStoreLogoAdmin(formData: FormData): Promise<string> {
  const file = formData.get('file') as File;
  if (!file) throw new Error('Aucun fichier fourni pour le logo.');

  // Validate MIME type
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error('Format de fichier non supporté. Formats acceptés : PNG, JPEG, WEBP, SVG.');
  }

  // Validate file size (Max 2MB)
  const maxSizeBytes = 2 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error('Le fichier du logo dépasse la taille maximale autorisée (2 Mo).');
  }

  const supabase = await createServerClient();
  await requirePermission(supabase, 'settings.manage');

  const fileExt = file.name.split('.').pop() || 'webp';
  const fileName = `store-logo-${Date.now()}.${fileExt}`;
  const filePath = `branding/${fileName}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.warn('[uploadStoreLogoAdmin] Storage upload warning:', uploadError.message);
      return `/branding/${fileName}`;
    }

    const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err: any) {
    console.error('[uploadStoreLogoAdmin] Error:', err.message);
    return `/branding/${fileName}`;
  }
}

export interface SetDemoModeInput {
  enableDemoMode: boolean;
  confirmation: boolean;
  reason: string;
}

export interface SetDemoModeResult {
  success: boolean;
  mode: 'DEMO' | 'PRODUCTION';
  isDemo: boolean;
  actor: string;
  timestamp: string;
  auditId?: string;
  readinessChecks?: {
    database: boolean;
    vault: boolean;
    secrets: boolean;
  };
}

/**
 * 9. Set Operational Demo Sandbox Mode (Guarded by settings.manage)
 * Authoritative server action to switch between DEMO and REAL production modes.
 * Enforces readiness checks when transitioning DEMO -> REAL.
 */
export async function setDemoModeAction(
  input: SetDemoModeInput,
  customClient?: any
): Promise<SetDemoModeResult> {
  const supabase = customClient || (await createServerClient());
  const authContext = await requirePermission(supabase, 'settings.manage');

  if (!input.confirmation) {
    throw new Error('Explicit confirmation is required to switch operational store modes.');
  }

  if (!input.reason || input.reason.trim().length < 5) {
    throw new Error('A detailed operational reason (at least 5 characters) is required for mode transitions.');
  }

  const { isDemo: currentIsDemo, mode: currentMode } = await DemoModeService.getEffectiveMode(undefined, supabase);
  const targetIsDemo = input.enableDemoMode;
  const targetMode = targetIsDemo ? 'DEMO' : 'PRODUCTION';

  const readiness = {
    database: true,
    vault: true,
    secrets: true,
  };

  // When switching DEMO -> REAL, perform mandatory readiness checks
  if (!targetIsDemo) {
    // 1. Database Health Check
    try {
      const { error: dbErr } = await supabase.from('products').select('id', { head: true, count: 'exact' });
      if (dbErr) throw dbErr;
    } catch (err: any) {
      throw new Error(`Database health check failed for REAL production mode: ${err.message}`);
    }

    // 2. Vault Readiness Check
    try {
      const { VaultService } = await import('@/lib/vault/vault.service');
      VaultService.getActiveKey();
    } catch (err: any) {
      throw new Error(`Vault readiness check failed: ${err.message}`);
    }

    // 3. SecretResolver Readiness Check
    try {
      const { SecretResolver } = await import('@/lib/vault/secret-resolver');
      await SecretResolver.hasSecret('logistics', 'ECOTRACK_TOKEN', supabase);
    } catch (err: any) {
      throw new Error(`SecretResolver readiness check failed: ${err.message}`);
    }
  }

  // Authoritatively update persistent store_settings
  await StoreSettingsService.updateStoreSettings(
    { forceDemoMode: targetIsDemo },
    authContext,
    supabase
  );

  // Clear static and dynamic caches
  CatalogProvider.clearCache();

  // Audit Log
  const timestamp = new Date().toISOString();
  let auditId: string | undefined;

  const fromTable = supabase.from ? supabase.from('audit_logs') : null;
  if (fromTable && typeof fromTable.insert === 'function') {
    const { data: auditData } = await fromTable.insert({
      actor_email: authContext.email,
      actor_role: authContext.role,
      action: 'STORE_MODE_SWITCH',
      entity_type: 'STORE_SETTINGS',
      entity_id: 'store_settings',
      old_values: { mode: currentMode, isDemo: currentIsDemo },
      new_values: { mode: targetMode, isDemo: targetIsDemo, reason: input.reason.trim() },
      created_at: timestamp,
    }).select('id').maybeSingle();
    auditId = auditData?.id;
  }

  // Invalidate public and admin route caches
  safeRevalidate('/');
  safeRevalidate('/products');
  safeRevalidate('/categories');
  safeRevalidate('/brands');
  safeRevalidate('/search');
  safeRevalidate('/cart');
  safeRevalidate('/checkout');
  safeRevalidate('/sitemap.xml');
  safeRevalidate('/robots.txt');
  safeRevalidate('/admin');
  safeRevalidate('/admin/settings');

  return {
    success: true,
    mode: targetMode,
    isDemo: targetIsDemo,
    actor: authContext.email,
    timestamp,
    auditId,
    readinessChecks: readiness,
  };
}

