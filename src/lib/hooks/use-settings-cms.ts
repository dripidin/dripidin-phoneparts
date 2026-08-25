// TanStack Query Hooks for Website Settings & Homepage CMS

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWebsiteSettingsAction,
  updateWebsiteSettingsAction,
  getSettingsHistoryAction,
  getHomepageSectionsAction,
  updateHomepageSectionAction,
  toggleHomepageSectionAction,
  reorderHomepageSectionsAction,
} from '@/lib/actions/settings-cms.actions';
import type {
  UpdateWebsiteSettingsInput,
  UpdateHomepageSectionInput,
  ReorderHomepageSectionsInput,
} from '@/types/settings-cms.types';

export const SETTINGS_CMS_QUERY_KEYS = {
  settings: ['website_settings'] as const,
  history: ['settings_history'] as const,
  sections: (includeDisabled?: boolean) => ['homepage_sections', includeDisabled] as const,
};

/**
 * Query Website Settings
 */
export function useWebsiteSettings() {
  return useQuery({
    queryKey: SETTINGS_CMS_QUERY_KEYS.settings,
    queryFn: () => getWebsiteSettingsAction(),
  });
}

/**
 * Query Settings History
 */
export function useSettingsHistory() {
  return useQuery({
    queryKey: SETTINGS_CMS_QUERY_KEYS.history,
    queryFn: () => getSettingsHistoryAction(),
  });
}

/**
 * Mutation: Update Website Settings
 */
export function useUpdateWebsiteSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateWebsiteSettingsInput) => updateWebsiteSettingsAction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_CMS_QUERY_KEYS.settings });
      queryClient.invalidateQueries({ queryKey: SETTINGS_CMS_QUERY_KEYS.history });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}

/**
 * Query Homepage CMS Sections
 */
export function useHomepageSections(includeDisabled: boolean = true) {
  return useQuery({
    queryKey: SETTINGS_CMS_QUERY_KEYS.sections(includeDisabled),
    queryFn: () => getHomepageSectionsAction(includeDisabled),
  });
}

/**
 * Mutation: Update Homepage CMS Section
 */
export function useUpdateHomepageSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sectionId, input }: { sectionId: string; input: UpdateHomepageSectionInput }) =>
      updateHomepageSectionAction(sectionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage_sections'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}

/**
 * Mutation: Toggle Homepage Section
 */
export function useToggleHomepageSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sectionId, enabled }: { sectionId: string; enabled: boolean }) =>
      toggleHomepageSectionAction(sectionId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage_sections'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}

/**
 * Mutation: Reorder Homepage Sections
 */
export function useReorderHomepageSections() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReorderHomepageSectionsInput) => reorderHomepageSectionsAction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage_sections'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}
