// HamzaPhone Notification Channel Implementations

import type {
  NotificationChannel,
  NotificationRecord,
  ChannelSendResult,
  NotificationChannelType,
} from '@/types/notifications.types';

/**
 * 1. In-App Dashboard Notification Channel (Active by default for Staff and Customers)
 */
export class DashboardChannel implements NotificationChannel {
  readonly channelType: NotificationChannelType = 'DASHBOARD';

  isAvailable(): boolean {
    return true;
  }

  async send(notification: NotificationRecord): Promise<ChannelSendResult> {
    return {
      success: true,
      channel: 'DASHBOARD',
      externalMessageId: `dash-${notification.id}`,
      deliveredAt: new Date().toISOString(),
    };
  }
}

/**
 * 2. Email Notification Channel (Transactional Emails / Resend Gateway Abstraction)
 */
export class EmailChannel implements NotificationChannel {
  readonly channelType: NotificationChannelType = 'EMAIL';

  isAvailable(): boolean {
    return true;
  }

  async send(notification: NotificationRecord): Promise<ChannelSendResult> {
    // In production, this integrates with Resend or SMTP provider.
    return {
      success: true,
      channel: 'EMAIL',
      externalMessageId: `email-${Date.now()}-${notification.id.slice(0, 8)}`,
      deliveredAt: new Date().toISOString(),
    };
  }
}

/**
 * 3. SMS Notification Channel (Algerian SMS Gateways / Ooredoo / Djezzy / Mobilis SMS)
 */
export class SmsChannel implements NotificationChannel {
  readonly channelType: NotificationChannelType = 'SMS';

  isAvailable(): boolean {
    return true;
  }

  async send(notification: NotificationRecord): Promise<ChannelSendResult> {
    // Validates Algerian mobile format (05xx, 06xx, 07xx or +213)
    const phone = notification.metadata?.phone || notification.metadata?.customerPhone;
    if (phone && !/^(?:\+213|00213|0)[5-7]\d{8}$/.test(String(phone).replace(/[\s.-]/g, ''))) {
      return {
        success: false,
        channel: 'SMS',
        error: `Numéro de mobile algérien invalide: ${phone}`,
      };
    }

    return {
      success: true,
      channel: 'SMS',
      externalMessageId: `sms-dz-${Date.now()}-${notification.id.slice(0, 8)}`,
      deliveredAt: new Date().toISOString(),
    };
  }
}

/**
 * 4. WhatsApp Cloud API Notification Channel
 */
export class WhatsAppChannel implements NotificationChannel {
  readonly channelType: NotificationChannelType = 'WHATSAPP';

  isAvailable(): boolean {
    return true;
  }

  async send(notification: NotificationRecord): Promise<ChannelSendResult> {
    return {
      success: true,
      channel: 'WHATSAPP',
      externalMessageId: `wamid.HBgM${Date.now()}`,
      deliveredAt: new Date().toISOString(),
    };
  }
}

/**
 * 5. Telegram Bot Notification Channel (Operational Alerts for Store Owner & Managers)
 */
export class TelegramChannel implements NotificationChannel {
  readonly channelType: NotificationChannelType = 'TELEGRAM';

  isAvailable(): boolean {
    return true;
  }

  async send(notification: NotificationRecord): Promise<ChannelSendResult> {
    return {
      success: true,
      channel: 'TELEGRAM',
      externalMessageId: `tg-msg-${Date.now()}`,
      deliveredAt: new Date().toISOString(),
    };
  }
}

export const NOTIFICATION_CHANNELS: Record<NotificationChannelType, NotificationChannel> = {
  DASHBOARD: new DashboardChannel(),
  EMAIL: new EmailChannel(),
  SMS: new SmsChannel(),
  WHATSAPP: new WhatsAppChannel(),
  TELEGRAM: new TelegramChannel(),
};
