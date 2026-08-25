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
  const supabase = customClient || createServerClient();
  const authContext = await requirePermission(supabase, 'settings.manage');

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

  return updated;
}

/**
 * 3. Get Settings Version History
 */
export async function getSettingsHistoryAction(
  customClient?: any
): Promise<SettingsHistoryItem[]> {
  const supabase = customClient || createServerClient();
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
  const supabase = customClient || createServerClient();
  const authContext = await requirePermission(supabase, 'cms.manage');

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

  return updated;
}

/**
 * 6. Toggle Homepage Section Visibility
 */
export async function toggleHomepageSectionAction(
  sectionId: string,
  enabled: boolean,
  customClient?: any
): Promise<HomepageSection> {
  const supabase = customClient || createServerClient();
  const authContext = await requirePermission(supabase, 'cms.manage');

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

  return updated;
}

/**
 * 7. Reorder Homepage Sections
 */
export async function reorderHomepageSectionsAction(
  input: ReorderHomepageSectionsInput,
  customClient?: any
): Promise<HomepageSection[]> {
  const supabase = customClient || createServerClient();
  const authContext = await requirePermission(supabase, 'cms.manage');

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

  return updated;
}
