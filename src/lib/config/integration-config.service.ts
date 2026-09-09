// HamzaPhone Central Integration Configuration Service (IntegrationConfigService)
// Resolves provider settings, environments, non-secret options, and secret references
// Decouples business domains from raw process.env and guarantees zero secret leakage to clients

import type {
  IntegrationCategory,
  IntegrationSummary,
  UpdateIntegrationSettingsInput,
  SecretPresenceStatus,
} from '@/types/integrations.types';

export interface PersistentIntegrationState {
  enabled: boolean;
  environment: 'sandbox' | 'production';
  apiUrl?: string;
  nonSecretConfig: Record<string, string | number | boolean>;
  lastTestedAt?: string;
  lastTestSuccess?: boolean;
  lastTestMessage?: string;
  lastTestLatencyMs?: number;
}

// In-memory state for runtime settings (can be synchronized with settings store)
const persistentStateStore: Record<string, PersistentIntegrationState> = {
  ecotrack: {
    enabled: true,
    environment: 'sandbox',
    apiUrl: 'https://api.ecotrack.dz/api/v1',
    nonSecretConfig: {
      providerCode: 'ECOTRACK',
      providerDisplayName: 'EcoTrack Express Algérie (58 Wilayas)',
      allowCustomerToOpenParcel: true,
      defaultPackageWeightKg: 0.5,
    },
  },
  email: {
    enabled: true,
    environment: 'sandbox',
    apiUrl: 'smtp://smtp.resend.com:587',
    nonSecretConfig: {
      provider: 'Resend / SMTP',
      senderEmail: 'metachagour@gmail.com',
      senderName: 'DRIPIDIN',
      b2bInvoiceAttachment: true,
    },
  },
  sms: {
    enabled: true,
    environment: 'sandbox',
    apiUrl: 'https://api.maghrebsms.dz/v1',
    nonSecretConfig: {
      provider: 'MaghrebSMS / Ooredoo Algérie',
      senderId: 'DRIPIDIN',
      orderConfirmationSms: true,
      outForDeliverySms: true,
    },
  },
  whatsapp: {
    enabled: true,
    environment: 'sandbox',
    apiUrl: 'https://graph.facebook.com/v19.0',
    nonSecretConfig: {
      provider: 'Meta WhatsApp Cloud API',
      phoneNumberId: '109876543210987',
      sendTrackingLink: true,
      sendInvoicePdf: true,
    },
  },
  telegram: {
    enabled: true,
    environment: 'sandbox',
    apiUrl: 'https://api.telegram.org',
    nonSecretConfig: {
      provider: 'Telegram Bot API',
      channelOrChatId: '@hamzaphone_alerts',
      operationalAlerts: true,
      lowStockAlerts: true,
    },
  },
  supabase_auth: {
    enabled: true,
    environment: 'production',
    nonSecretConfig: {
      provider: 'Supabase GoTrue Auth',
      jwtExpirySeconds: 3600,
      enableB2BApprovalGate: true,
    },
  },
  supabase_storage: {
    enabled: true,
    environment: 'production',
    nonSecretConfig: {
      provider: 'Supabase S3 Storage',
      publicBucket: 'product-images',
      maxUploadSizeBytes: 5242880, // 5MB
    },
  },
  oauth_google: {
    enabled: false,
    environment: 'sandbox',
    nonSecretConfig: {
      provider: 'Google Identity Services (OAuth 2.0)',
      redirectUri: '/auth/callback',
    },
  },
  monitoring: {
    enabled: false,
    environment: 'sandbox',
    nonSecretConfig: {
      provider: 'Sentry / Vercel OpenTelemetry',
      tracesSampleRate: 0.1,
    },
  },
};

export class IntegrationConfigService {
  /**
   * Determine whether current platform execution is in Demo / Sandbox mode
   */
  static isDemoMode(): boolean {
    const forced = process.env.DRIPIDIN_DEMO_MODE ?? process.env.HAMZAPHONE_DEMO_MODE;
    if (forced === 'true' || forced === '1') return true;
    if (forced === 'false' || forced === '0') return false;

    // By default on vercel preview or demo deployment domain, demo mode is enabled
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    if (siteUrl.includes('vercel.app') || siteUrl.includes('localhost')) {
      return true;
    }

    return process.env.NODE_ENV !== 'production';
  }

  /**
   * Helper to check secret presence safely without returning or logging the value
   */
  private static checkSecretStatus(keyName: string, env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): SecretPresenceStatus {
    const val = env[keyName];
    return val && val.trim().length > 0 ? 'Configured' : 'Missing';
  }

  /**
   * Get all integrations summary for Admin Integration Center (100% Safe, 0 Secrets Leaked)
   */
  static getAllIntegrationsSummary(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): IntegrationSummary[] {
    const supabaseUrlStatus = this.checkSecretStatus('NEXT_PUBLIC_SUPABASE_URL', env);
    const supabaseAnonStatus = this.checkSecretStatus('NEXT_PUBLIC_SUPABASE_ANON_KEY', env);
    const supabaseServiceStatus = this.checkSecretStatus('SUPABASE_SERVICE_ROLE_KEY', env);
    const ecotrackTokenStatus = this.checkSecretStatus('ECOTRACK_API_TOKEN', env);
    const ecotrackWebhookStatus = this.checkSecretStatus('ECOTRACK_WEBHOOK_SECRET', env);
    const smsKeyStatus = this.checkSecretStatus('SMS_GATEWAY_API_KEY', env);
    const whatsappTokenStatus = this.checkSecretStatus('WHATSAPP_CLOUD_API_TOKEN', env);
    const telegramTokenStatus = this.checkSecretStatus('TELEGRAM_BOT_TOKEN', env);
    const smtpPasswordStatus = this.checkSecretStatus('SMTP_PASSWORD', env);
    const sentryDsnStatus = this.checkSecretStatus('SENTRY_DSN', env);
    const cronSecretStatus = this.checkSecretStatus('CRON_SECRET', env);

    const isDemo = this.isDemoMode();

    return [
      // 1. EcoTrack Delivery Integration
      {
        id: 'ecotrack',
        name: 'Livraison EcoTrack (58 Wilayas)',
        category: 'DELIVERY',
        provider: 'EcoTrack Express DZ',
        enabled: persistentStateStore.ecotrack.enabled,
        environment: persistentStateStore.ecotrack.environment,
        demoStatus: 'OPTIONAL_FOR_DEMO',
        isConfigured: ecotrackTokenStatus === 'Configured',
        isReadyForDemo: true, // Demo mock active if token missing
        isReadyForProduction: ecotrackTokenStatus === 'Configured' && ecotrackWebhookStatus === 'Configured',
        apiUrl: persistentStateStore.ecotrack.apiUrl || env.ECOTRACK_API_URL || 'https://api.ecotrack.dz/api/v1',
        nonSecretConfig: persistentStateStore.ecotrack.nonSecretConfig,
        credentials: [
          {
            name: 'ECOTRACK_API_TOKEN',
            classification: 'SERVER_SECRET',
            status: ecotrackTokenStatus,
            isSecret: true,
            requiredForDemo: false,
            requiredForProduction: true,
            description: 'Jeton d\'authentification Bearer pour l\'API officielle EcoTrack',
          },
          {
            name: 'ECOTRACK_WEBHOOK_SECRET',
            classification: 'WEBHOOK_SECRET',
            status: ecotrackWebhookStatus,
            isSecret: true,
            requiredForDemo: false,
            requiredForProduction: true,
            description: 'Secret HMAC pour valider les webhooks de mise à jour des colis',
          },
          {
            name: 'ECOTRACK_API_URL',
            classification: 'SERVER_CONFIG',
            status: this.checkSecretStatus('ECOTRACK_API_URL', env),
            isSecret: false,
            requiredForDemo: false,
            requiredForProduction: false,
            description: 'Point de terminaison API (sandbox vs production)',
          },
        ],
        lastTestedAt: persistentStateStore.ecotrack.lastTestedAt,
        lastTestSuccess: persistentStateStore.ecotrack.lastTestSuccess,
        lastTestMessage: persistentStateStore.ecotrack.lastTestMessage,
        lastTestLatencyMs: persistentStateStore.ecotrack.lastTestLatencyMs,
      },

      // 2. Email Notification Provider
      {
        id: 'email',
        name: 'Emails Transactionnels & Factures B2B',
        category: 'EMAIL',
        provider: 'Resend / SMTP Gateway',
        enabled: persistentStateStore.email.enabled,
        environment: persistentStateStore.email.environment,
        demoStatus: 'OPTIONAL_FOR_DEMO',
        isConfigured: smtpPasswordStatus === 'Configured',
        isReadyForDemo: true,
        isReadyForProduction: smtpPasswordStatus === 'Configured',
        apiUrl: persistentStateStore.email.apiUrl,
        nonSecretConfig: persistentStateStore.email.nonSecretConfig,
        credentials: [
          {
            name: 'SMTP_PASSWORD',
            classification: 'SERVER_SECRET',
            status: smtpPasswordStatus,
            isSecret: true,
            requiredForDemo: false,
            requiredForProduction: true,
            description: 'Mot de passe SMTP ou clé API Resend pour l\'envoi des factures',
          },
          {
            name: 'SMTP_HOST',
            classification: 'SERVER_CONFIG',
            status: this.checkSecretStatus('SMTP_HOST', env),
            isSecret: false,
            requiredForDemo: false,
            requiredForProduction: true,
            description: 'Hôte du serveur SMTP d\'envoi (ex: smtp.resend.com)',
          },
        ],
        lastTestedAt: persistentStateStore.email.lastTestedAt,
        lastTestSuccess: persistentStateStore.email.lastTestSuccess,
        lastTestMessage: persistentStateStore.email.lastTestMessage,
        lastTestLatencyMs: persistentStateStore.email.lastTestLatencyMs,
      },

      // 3. SMS Gateway
      {
        id: 'sms',
        name: 'Passerelle SMS Nationale (Algérie)',
        category: 'SMS',
        provider: 'MaghrebSMS / Ooredoo / Mobilis',
        enabled: persistentStateStore.sms.enabled,
        environment: persistentStateStore.sms.environment,
        demoStatus: 'OPTIONAL_FOR_DEMO',
        isConfigured: smsKeyStatus === 'Configured',
        isReadyForDemo: true,
        isReadyForProduction: smsKeyStatus === 'Configured',
        apiUrl: persistentStateStore.sms.apiUrl || env.SMS_GATEWAY_API_URL || 'https://api.maghrebsms.dz/v1',
        nonSecretConfig: persistentStateStore.sms.nonSecretConfig,
        credentials: [
          {
            name: 'SMS_GATEWAY_API_KEY',
            classification: 'SERVER_SECRET',
            status: smsKeyStatus,
            isSecret: true,
            requiredForDemo: false,
            requiredForProduction: true,
            description: 'Clé d\'authentification de la passerelle SMS algérienne',
          },
          {
            name: 'SMS_GATEWAY_SENDER_ID',
            classification: 'SERVER_CONFIG',
            status: this.checkSecretStatus('SMS_GATEWAY_SENDER_ID', env),
            isSecret: false,
            requiredForDemo: false,
            requiredForProduction: true,
            description: 'Identifiant d\'émetteur validé ARPT (ex: HamzaPhone)',
          },
        ],
        lastTestedAt: persistentStateStore.sms.lastTestedAt,
        lastTestSuccess: persistentStateStore.sms.lastTestSuccess,
        lastTestMessage: persistentStateStore.sms.lastTestMessage,
        lastTestLatencyMs: persistentStateStore.sms.lastTestLatencyMs,
      },

      // 4. WhatsApp Cloud API
      {
        id: 'whatsapp',
        name: 'WhatsApp Business Notifications',
        category: 'WHATSAPP',
        provider: 'Meta Cloud API',
        enabled: persistentStateStore.whatsapp.enabled,
        environment: persistentStateStore.whatsapp.environment,
        demoStatus: 'OPTIONAL_FOR_DEMO',
        isConfigured: whatsappTokenStatus === 'Configured',
        isReadyForDemo: true,
        isReadyForProduction: whatsappTokenStatus === 'Configured',
        apiUrl: persistentStateStore.whatsapp.apiUrl,
        nonSecretConfig: persistentStateStore.whatsapp.nonSecretConfig,
        credentials: [
          {
            name: 'WHATSAPP_CLOUD_API_TOKEN',
            classification: 'SERVER_SECRET',
            status: whatsappTokenStatus,
            isSecret: true,
            requiredForDemo: false,
            requiredForProduction: true,
            description: 'Jeton d\'accès permanent Meta Cloud API pour WhatsApp Business',
          },
          {
            name: 'WHATSAPP_PHONE_NUMBER_ID',
            classification: 'SERVER_CONFIG',
            status: this.checkSecretStatus('WHATSAPP_PHONE_NUMBER_ID', env),
            isSecret: false,
            requiredForDemo: false,
            requiredForProduction: true,
            description: 'Identifiant du numéro de téléphone WhatsApp Business',
          },
        ],
        lastTestedAt: persistentStateStore.whatsapp.lastTestedAt,
        lastTestSuccess: persistentStateStore.whatsapp.lastTestSuccess,
        lastTestMessage: persistentStateStore.whatsapp.lastTestMessage,
        lastTestLatencyMs: persistentStateStore.whatsapp.lastTestLatencyMs,
      },

      // 5. Telegram Bot Alerts
      {
        id: 'telegram',
        name: 'Alertes Opérationnelles Telegram',
        category: 'TELEGRAM',
        provider: 'Telegram Bot API',
        enabled: persistentStateStore.telegram.enabled,
        environment: persistentStateStore.telegram.environment,
        demoStatus: 'OPTIONAL_FOR_DEMO',
        isConfigured: telegramTokenStatus === 'Configured',
        isReadyForDemo: true,
        isReadyForProduction: telegramTokenStatus === 'Configured',
        apiUrl: persistentStateStore.telegram.apiUrl,
        nonSecretConfig: persistentStateStore.telegram.nonSecretConfig,
        credentials: [
          {
            name: 'TELEGRAM_BOT_TOKEN',
            classification: 'SERVER_SECRET',
            status: telegramTokenStatus,
            isSecret: true,
            requiredForDemo: false,
            requiredForProduction: false,
            description: 'Token du bot Telegram pour les alertes de commandes et stock faible',
          },
          {
            name: 'TELEGRAM_CHAT_ID',
            classification: 'SERVER_CONFIG',
            status: this.checkSecretStatus('TELEGRAM_CHAT_ID', env),
            isSecret: false,
            requiredForDemo: false,
            requiredForProduction: false,
            description: 'Identifiant du groupe ou canal privé Telegram de l\'équipe',
          },
        ],
        lastTestedAt: persistentStateStore.telegram.lastTestedAt,
        lastTestSuccess: persistentStateStore.telegram.lastTestSuccess,
        lastTestMessage: persistentStateStore.telegram.lastTestMessage,
        lastTestLatencyMs: persistentStateStore.telegram.lastTestLatencyMs,
      },

      // 6. Supabase Database & Auth (Mandatory)
      {
        id: 'supabase_auth',
        name: 'Supabase PostgreSQL & Authentification',
        category: 'AUTH_OAUTH',
        provider: 'Supabase Managed Cloud',
        enabled: true,
        environment: 'production',
        demoStatus: 'REQUIRED_FOR_DEMO',
        isConfigured:
          supabaseUrlStatus === 'Configured' &&
          supabaseAnonStatus === 'Configured' &&
          supabaseServiceStatus === 'Configured',
        isReadyForDemo:
          supabaseUrlStatus === 'Configured' &&
          supabaseAnonStatus === 'Configured' &&
          supabaseServiceStatus === 'Configured',
        isReadyForProduction:
          supabaseUrlStatus === 'Configured' &&
          supabaseAnonStatus === 'Configured' &&
          supabaseServiceStatus === 'Configured',
        apiUrl: env.NEXT_PUBLIC_SUPABASE_URL || 'https://gcqseaefboaijktusjmg.supabase.co',
        nonSecretConfig: persistentStateStore.supabase_auth.nonSecretConfig,
        credentials: [
          {
            name: 'NEXT_PUBLIC_SUPABASE_URL',
            classification: 'PUBLIC_CONFIG',
            status: supabaseUrlStatus,
            isSecret: false,
            requiredForDemo: true,
            requiredForProduction: true,
            description: 'URL canonique du projet Supabase hébergé',
          },
          {
            name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
            classification: 'PUBLIC_CONFIG',
            status: supabaseAnonStatus,
            isSecret: false,
            requiredForDemo: true,
            requiredForProduction: true,
            description: 'Clé publique anon avec application stricte des règles RLS',
          },
          {
            name: 'SUPABASE_SERVICE_ROLE_KEY',
            classification: 'SERVER_SECRET',
            status: supabaseServiceStatus,
            isSecret: true,
            requiredForDemo: true,
            requiredForProduction: true,
            description: 'Clé super-administrateur serveur pour écritures multi-tables et migrations',
          },
        ],
        lastTestedAt: persistentStateStore.supabase_auth.lastTestedAt,
        lastTestSuccess: persistentStateStore.supabase_auth.lastTestSuccess,
        lastTestMessage: persistentStateStore.supabase_auth.lastTestMessage,
        lastTestLatencyMs: persistentStateStore.supabase_auth.lastTestLatencyMs,
      },

      // 7. Supabase Storage CDN (Mandatory for Images)
      {
        id: 'supabase_storage',
        name: 'Stockage Médias & Images Catalogue',
        category: 'STORAGE',
        provider: 'Supabase Object Storage (S3)',
        enabled: true,
        environment: 'production',
        demoStatus: 'REQUIRED_FOR_DEMO',
        isConfigured: supabaseUrlStatus === 'Configured',
        isReadyForDemo: true,
        isReadyForProduction: true,
        apiUrl: `${env.NEXT_PUBLIC_SUPABASE_URL || 'https://gcqseaefboaijktusjmg.supabase.co'}/storage/v1`,
        nonSecretConfig: persistentStateStore.supabase_storage.nonSecretConfig,
        credentials: [
          {
            name: 'SUPABASE_STORAGE_BUCKET',
            classification: 'SERVER_CONFIG',
            status: 'Configured',
            isSecret: false,
            requiredForDemo: true,
            requiredForProduction: true,
            description: 'Bucket public product-images hébergeant les visuels des pièces',
          },
        ],
        lastTestedAt: persistentStateStore.supabase_storage.lastTestedAt,
        lastTestSuccess: persistentStateStore.supabase_storage.lastTestSuccess,
        lastTestMessage: persistentStateStore.supabase_storage.lastTestMessage,
        lastTestLatencyMs: persistentStateStore.supabase_storage.lastTestLatencyMs,
      },

      // 8. OAuth Providers
      {
        id: 'oauth_google',
        name: 'Connexion Sociale Google OAuth 2.0',
        category: 'AUTH_OAUTH',
        provider: 'Google Identity Services',
        enabled: persistentStateStore.oauth_google.enabled,
        environment: persistentStateStore.oauth_google.environment,
        demoStatus: 'PRODUCTION_ONLY',
        isConfigured: this.checkSecretStatus('GOOGLE_CLIENT_SECRET', env) === 'Configured',
        isReadyForDemo: false, // Email/Password available
        isReadyForProduction: this.checkSecretStatus('GOOGLE_CLIENT_SECRET', env) === 'Configured',
        nonSecretConfig: persistentStateStore.oauth_google.nonSecretConfig,
        credentials: [
          {
            name: 'GOOGLE_CLIENT_ID',
            classification: 'PUBLIC_CONFIG',
            status: this.checkSecretStatus('GOOGLE_CLIENT_ID', env),
            isSecret: false,
            requiredForDemo: false,
            requiredForProduction: true,
            description: 'Client ID OAuth Google configuré dans la console Supabase',
          },
          {
            name: 'GOOGLE_CLIENT_SECRET',
            classification: 'OAUTH_SECRET',
            status: this.checkSecretStatus('GOOGLE_CLIENT_SECRET', env),
            isSecret: true,
            requiredForDemo: false,
            requiredForProduction: true,
            description: 'Secret client OAuth Google renseigné dans Supabase Auth',
          },
        ],
      },

      // 9. Error Monitoring & APM
      {
        id: 'monitoring',
        name: 'Surveillance des Erreurs & APM',
        category: 'MONITORING',
        provider: 'Sentry / OpenTelemetry',
        enabled: persistentStateStore.monitoring.enabled,
        environment: persistentStateStore.monitoring.environment,
        demoStatus: 'PRODUCTION_ONLY',
        isConfigured: sentryDsnStatus === 'Configured',
        isReadyForDemo: true, // Native logger active
        isReadyForProduction: sentryDsnStatus === 'Configured',
        nonSecretConfig: persistentStateStore.monitoring.nonSecretConfig,
        credentials: [
          {
            name: 'SENTRY_DSN',
            classification: 'SERVER_SECRET',
            status: sentryDsnStatus,
            isSecret: true,
            requiredForDemo: false,
            requiredForProduction: false,
            description: 'DSN Sentry pour la capture des exceptions serveur et client',
          },
        ],
      },
    ];
  }

  /**
   * Get configuration for a specific provider
   */
  static getIntegration(integrationId: string): PersistentIntegrationState {
    const state = persistentStateStore[integrationId];
    if (!state) {
      throw new Error(`Intégration inconnue: ${integrationId}`);
    }
    return { ...state };
  }

  /**
   * Update non-secret integration parameters
   */
  static updateIntegrationSettings(input: UpdateIntegrationSettingsInput): PersistentIntegrationState {
    const current = persistentStateStore[input.integrationId];
    if (!current) {
      throw new Error(`Intégration introuvable: ${input.integrationId}`);
    }

    if (input.enabled !== undefined) current.enabled = input.enabled;
    if (input.environment !== undefined) current.environment = input.environment;
    if (input.apiUrl !== undefined) current.apiUrl = input.apiUrl;
    if (input.nonSecretConfig) {
      current.nonSecretConfig = {
        ...current.nonSecretConfig,
        ...input.nonSecretConfig,
      };
    }

    return { ...current };
  }

  /**
   * Record connection test outcome
   */
  static recordTestResult(
    integrationId: string,
    success: boolean,
    message: string,
    latencyMs: number
  ): void {
    const current = persistentStateStore[integrationId];
    if (current) {
      current.lastTestedAt = new Date().toISOString();
      current.lastTestSuccess = success;
      current.lastTestMessage = message;
      current.lastTestLatencyMs = latencyMs;
    }
  }

  /**
   * Resolve EcoTrack provider runtime options
   */
  static getEcoTrackConfig(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env) {
    const state = persistentStateStore.ecotrack;
    const apiToken = env.ECOTRACK_API_TOKEN || '';
    const webhookSecret = env.ECOTRACK_WEBHOOK_SECRET || '';
    const isMock = !apiToken || this.isDemoMode() || state.environment === 'sandbox';

    return {
      enabled: state.enabled,
      environment: state.environment,
      apiUrl: state.apiUrl || env.ECOTRACK_API_URL || 'https://api.ecotrack.dz/api/v1',
      apiToken,
      webhookSecret,
      isMock,
      allowCustomerToOpenParcel: Boolean(state.nonSecretConfig?.allowCustomerToOpenParcel ?? true),
    };
  }
}
