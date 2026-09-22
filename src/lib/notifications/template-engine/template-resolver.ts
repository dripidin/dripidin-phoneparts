// DRIPIDIN Notification Template Resolver
// 4-Tier Fallback Hierarchy: Custom Store (DB) -> Fallback Locale (DB) -> System Default (Code) -> Safe Skip
// Features in-memory caching with revalidation and complete fail-safe isolation from business transactions.

import type {
  DomainEventType,
  NotificationChannelType,
  NotificationTemplate,
  CreateNotificationTemplateInput,
  UpdateNotificationTemplateInput,
  TemplateFilterParams,
} from '@/types/notifications.types';
import { toDbChannel, toDomainChannel } from '../channels/channel-mapper';
import { getSystemDefaultTemplate } from './system-defaults';
import { TemplateValidator } from './template-validator';
import { createServerClient } from '@/lib/auth/server';

export interface ResolvedTemplate {
  subject?: string | null;
  bodyText: string;
  bodyHtml?: string | null;
  source: 'CUSTOM_DB' | 'FALLBACK_LOCALE_DB' | 'SYSTEM_DEFAULT';
  isSystemDefault: boolean;
  version: number;
}

// In-Memory L1 Cache
interface CachedTemplateEntry {
  template: NotificationTemplate | null;
  expiresAt: number;
}

const templateCache = new Map<string, CachedTemplateEntry>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

export class TemplateResolver {
  public static clearCache(): void {
    templateCache.clear();
  }

  /**
   * Resolves a template following the strict 4-tier fallback cascade:
   * 1. Custom Store DB Template (requested locale)
   * 2. Store Default Locale DB Template (fr-DZ)
   * 3. Immutable Compiled System Default (source code)
   * 4. Safe Skip (returns null)
   */
  public static async resolveTemplate(
    eventType: DomainEventType | string,
    channel: NotificationChannelType,
    locale: string = 'fr-DZ',
    supabaseClient?: any
  ): Promise<ResolvedTemplate | null> {
    const cacheKey = `${eventType}:${channel}:${locale}`;
    const now = Date.now();

    // 1. Check L1 Memory Cache for custom DB template
    const cached = templateCache.get(cacheKey);
    if (cached && cached.expiresAt > now && cached.template) {
      if (!cached.template.isActive) {
        return null; // Disabled by store operator
      }
      return {
        subject: cached.template.subject,
        bodyText: cached.template.bodyText,
        bodyHtml: cached.template.bodyHtml,
        source: 'CUSTOM_DB',
        isSystemDefault: cached.template.isSystemDefault ?? false,
        version: cached.template.version,
      };
    }

    // 2. Query Database for Custom Template
    try {
      const supabase = supabaseClient || (await createServerClient());
      const dbChannel = toDbChannel(channel);

      // Query 1: Exact Event x Channel x Locale match
      const { data: customRow, error: customErr } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('event_type', eventType)
        .eq('channel', dbChannel)
        .eq('locale', locale)
        .maybeSingle();

      if (!customErr && customRow) {
        const domainTemplate = this.mapDbRowToTemplate(customRow);
        templateCache.set(cacheKey, { template: domainTemplate, expiresAt: now + CACHE_TTL_MS });

        if (!domainTemplate.isActive) {
          return null; // Channel is intentionally disabled by store operator
        }

        return {
          subject: domainTemplate.subject,
          bodyText: domainTemplate.bodyText,
          bodyHtml: domainTemplate.bodyHtml,
          source: 'CUSTOM_DB',
          isSystemDefault: domainTemplate.isSystemDefault ?? false,
          version: domainTemplate.version,
        };
      }

      // Query 2: Fallback Locale if requested locale is different from fr-DZ
      if (locale !== 'fr-DZ') {
        const { data: fallbackRow } = await supabase
          .from('notification_templates')
          .select('*')
          .eq('event_type', eventType)
          .eq('channel', dbChannel)
          .eq('locale', 'fr-DZ')
          .maybeSingle();

        if (fallbackRow) {
          const fallbackTemplate = this.mapDbRowToTemplate(fallbackRow);
          if (!fallbackTemplate.isActive) {
            return null;
          }
          return {
            subject: fallbackTemplate.subject,
            bodyText: fallbackTemplate.bodyText,
            bodyHtml: fallbackTemplate.bodyHtml,
            source: 'FALLBACK_LOCALE_DB',
            isSystemDefault: fallbackTemplate.isSystemDefault ?? false,
            version: fallbackTemplate.version,
          };
        }
      }
    } catch (err: any) {
      // Non-blocking: DB query failure falls through to immutable system default
      console.warn('[TemplateResolver] Database resolution warning, falling back to system default:', err.message);
    }

    // 3. Fallback to In-Code Immutable System Default
    const systemDefault = getSystemDefaultTemplate(eventType, channel, locale);
    if (systemDefault) {
      return {
        subject: systemDefault.subject,
        bodyText: systemDefault.bodyText,
        bodyHtml: systemDefault.bodyHtml,
        source: 'SYSTEM_DEFAULT',
        isSystemDefault: true,
        version: 1,
      };
    }

    // 4. Safe Skip
    return null;
  }

  /**
   * Retrieves all templates matching query parameters for the Admin Notification Center.
   */
  public static async listTemplates(
    params?: TemplateFilterParams,
    supabaseClient?: any
  ): Promise<NotificationTemplate[]> {
    try {
      const supabase = supabaseClient || (await createServerClient());
      let query = supabase.from('notification_templates').select('*').order('created_at', { ascending: true });

      if (params?.eventType && params.eventType !== 'ALL') {
        query = query.eq('event_type', params.eventType);
      }
      if (params?.channel && params.channel !== 'ALL') {
        query = query.eq('channel', toDbChannel(params.channel));
      }
      if (params?.locale) {
        query = query.eq('locale', params.locale);
      }
      if (typeof params?.isActive === 'boolean') {
        query = query.eq('is_active', params.isActive);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row: any) => this.mapDbRowToTemplate(row));
    } catch (err: any) {
      console.error('[TemplateResolver] listTemplates error:', err);
      return [];
    }
  }

  /**
   * Retrieves a single template by ID.
   */
  public static async getTemplateById(
    templateId: string,
    supabaseClient?: any
  ): Promise<NotificationTemplate | null> {
    try {
      const supabase = supabaseClient || (await createServerClient());
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('id', templateId)
        .maybeSingle();

      if (error || !data) return null;
      return this.mapDbRowToTemplate(data);
    } catch {
      return null;
    }
  }

  /**
   * Creates or updates a store template with strict validation.
   */
  public static async saveTemplate(
    input: CreateNotificationTemplateInput,
    actorId?: string,
    supabaseClient?: any
  ): Promise<NotificationTemplate> {
    // 1. Validate syntax, tokens, and channel constraints
    const validation = TemplateValidator.validate({
      eventType: input.eventType,
      channel: input.channel,
      subject: input.subject,
      bodyText: input.bodyText,
      bodyHtml: input.bodyHtml,
    });

    if (!validation.valid) {
      throw new Error(`Validation du modèle échouée : ${validation.errors.join('; ')}`);
    }

    const supabase = supabaseClient || (await createServerClient());
    const dbChannel = toDbChannel(input.channel);
    const locale = input.locale || 'fr-DZ';

    // 2. Check for existing template
    const { data: existing } = await supabase
      .from('notification_templates')
      .select('id, version')
      .eq('event_type', input.eventType)
      .eq('channel', dbChannel)
      .eq('locale', locale)
      .maybeSingle();

    const cleanHtml = validation.sanitizedHtml ?? input.bodyHtml ?? null;

    let savedRow: any;
    if (existing) {
      // Update existing record
      const nextVersion = (existing.version || 1) + 1;
      const { data, error } = await supabase
        .from('notification_templates')
        .update({
          subject: input.subject ?? null,
          body_text: input.bodyText,
          body_html: cleanHtml,
          is_active: input.isActive ?? true,
          version: nextVersion,
          updated_at: new Date().toISOString(),
          updated_by: actorId ?? null,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      savedRow = data;
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('notification_templates')
        .insert({
          event_type: input.eventType,
          channel: dbChannel,
          locale,
          subject: input.subject ?? null,
          body_text: input.bodyText,
          body_html: cleanHtml,
          is_active: input.isActive ?? true,
          is_system_default: input.isSystemDefault ?? false,
          version: 1,
          updated_by: actorId ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      savedRow = data;
    }

    const template = this.mapDbRowToTemplate(savedRow);
    const cacheKey = `${input.eventType}:${input.channel}:${locale}`;
    templateCache.set(cacheKey, { template, expiresAt: Date.now() + CACHE_TTL_MS });

    return template;
  }

  /**
   * Resets a custom template back to system default by removing or deactivating the custom override.
   */
  public static async resetToDefault(
    eventType: DomainEventType,
    channel: NotificationChannelType,
    locale: string = 'fr-DZ',
    actorId?: string,
    supabaseClient?: any
  ): Promise<boolean> {
    try {
      const supabase = supabaseClient || (await createServerClient());
      const dbChannel = toDbChannel(channel);

      // Delete custom override from table
      const { error } = await supabase
        .from('notification_templates')
        .delete()
        .eq('event_type', eventType)
        .eq('channel', dbChannel)
        .eq('locale', locale);

      if (error) throw error;

      // Invalidate cache
      const cacheKey = `${eventType}:${channel}:${locale}`;
      templateCache.delete(cacheKey);

      return true;
    } catch (err: any) {
      console.error('[TemplateResolver] resetToDefault error:', err);
      return false;
    }
  }

  /**
   * Helper to map raw database row to application domain NotificationTemplate.
   */
  private static mapDbRowToTemplate(row: any): NotificationTemplate {
    return {
      id: row.id,
      eventType: row.event_type as DomainEventType,
      channel: toDomainChannel(row.channel),
      locale: row.locale,
      subject: row.subject,
      bodyText: row.body_text,
      bodyHtml: row.body_html,
      isActive: row.is_active,
      isSystemDefault: row.is_system_default,
      version: row.version,
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
    };
  }
}
