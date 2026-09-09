// HamzaPhone Global Website Settings & Structured CMS Types
// Extended from authoritative StoreSettings for backward compatibility.

import type { StoreSettings, UpdateStoreSettingsInput } from './settings.types';

export type { StoreSettings, UpdateStoreSettingsInput };

export interface WebsiteSettings extends StoreSettings {
  // WebsiteSettings inherits all typed store settings.
  // Backward compatibility fields commune and announcementBarEnabled are guaranteed.
}

export type UpdateWebsiteSettingsInput = UpdateStoreSettingsInput;

export interface SettingsHistoryItem {
  id: string;
  version: number;
  changedBy: string;
  changedAt: string;
  changesSummary: string;
  previousSettings: Partial<WebsiteSettings>;
  updatedSettings: Partial<WebsiteSettings>;
}

export interface HomepageSection {
  id: string;
  sectionKey: string;
  name: string;
  enabled: boolean;
  orderIndex: number;
  title: string;
  subtitle: string;
  content?: string;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  badgeText?: string | null;
  metadata?: Record<string, any>;
  updatedAt: string;
  updatedBy: string;
}

export interface UpdateHomepageSectionInput {
  name?: string;
  enabled?: boolean;
  orderIndex?: number;
  title?: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  badgeText?: string | null;
  metadata?: Record<string, any>;
}

export interface ReorderHomepageSectionsInput {
  orderedSectionIds: string[];
}
