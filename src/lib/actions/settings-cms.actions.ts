'use server';

// HamzaPhone Website Settings & Homepage CMS Server Actions
// Guarded by RBAC permissions (settings.manage, cms.manage) with Audit Logging

import { createServerClient } from '@/lib/auth/server';
import { requirePermission } from '@/lib/permissions/guards';
import { SettingsCmsService } from '@/lib/settings/settings-cms.service';
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
 */
export async function getWebsiteSettingsAction(
  customClient?: any
): Promise<WebsiteSettings> {
  return SettingsCmsService.getWebsiteSettings();
}

/**
 * 2. Update Website Settings (Guarded by settings.manage)
 */
export async function updateWebsiteSettingsAction(
  input: UpdateWebsiteSettingsInput,
  customClient?: any
): Promise<WebsiteSettings> {
  const supabase = customClient || await createServerClient();
  const authContext = await requirePermission(supabase, 'settings.manage');

  try {
    const updated = SettingsCmsService.updateWebsiteSettings(input, authContext);

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
  const supabase = customClient || await createServerClient();
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
  const supabase = customClient || await createServerClient();
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
  const supabase = customClient || await createServerClient();
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
  const supabase = customClient || await createServerClient();
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
