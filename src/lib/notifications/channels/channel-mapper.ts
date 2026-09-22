// DRIPIDIN Authoritative Channel Mapper
// Bi-directional translation layer between Application Domain Channels and PostgreSQL Enums.
// Resolves: DASHBOARD == IN_APP and supports TELEGRAM additively.
// Guarantees: Never pass 'DASHBOARD' into PostgreSQL enum queries.

import type { NotificationChannelType } from '@/types/notifications.types';
import type { Database } from '@/types/database.types';

export type DbNotificationChannel = Database['public']['Enums']['notification_channel'];
export type DomainNotificationChannel = NotificationChannelType;

export const CHANNEL_TO_DB_MAP: Record<DomainNotificationChannel, DbNotificationChannel> = {
  DASHBOARD: 'IN_APP',
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  WHATSAPP: 'WHATSAPP',
  TELEGRAM: 'TELEGRAM',
};

export const DB_TO_CHANNEL_MAP: Record<DbNotificationChannel, DomainNotificationChannel> = {
  IN_APP: 'DASHBOARD',
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  WHATSAPP: 'WHATSAPP',
  TELEGRAM: 'TELEGRAM',
};

/**
 * Translates an application domain channel ('DASHBOARD', 'EMAIL', etc.) to its PostgreSQL enum value.
 */
export function toDbChannel(channel: DomainNotificationChannel): DbNotificationChannel {
  const dbChannel = CHANNEL_TO_DB_MAP[channel];
  if (!dbChannel) {
    throw new Error(`[ChannelMapper] Unsupported domain channel: "${channel}"`);
  }
  return dbChannel;
}

/**
 * Translates a PostgreSQL notification_channel enum value ('IN_APP', 'EMAIL', etc.) to its application domain channel.
 */
export function toDomainChannel(dbChannel: DbNotificationChannel): DomainNotificationChannel {
  const domainChannel = DB_TO_CHANNEL_MAP[dbChannel];
  if (!domainChannel) {
    throw new Error(`[ChannelMapper] Unsupported database channel: "${dbChannel}"`);
  }
  return domainChannel;
}

/**
 * Checks if a channel string is a valid domain or database channel.
 */
export function isValidChannel(channel: string): boolean {
  return channel in CHANNEL_TO_DB_MAP || channel in DB_TO_CHANNEL_MAP;
}

