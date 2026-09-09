// HamzaPhone Environment Configuration & Startup Validator
// Enforces strict separation of PUBLIC, SERVER_ONLY, and SECRET variables
// Validates production readiness and prevents credential leakage

export type VariableSensitivity = 'PUBLIC' | 'SERVER_ONLY' | 'SECRET';

export interface EnvVariableSpec {
  name: string;
  sensitivity: VariableSensitivity;
  requiredInProduction: boolean;
  description: string;
  publicPrefixRequired?: boolean;
}

export const ENV_SPECS: EnvVariableSpec[] = [
  // 1. Client-Exposed Public Variables (NEXT_PUBLIC_ prefix mandatory)
  {
    name: 'NEXT_PUBLIC_SITE_URL',
    sensitivity: 'PUBLIC',
    requiredInProduction: true,
    publicPrefixRequired: true,
    description: 'Canonical public domain of DRIPIDIN storefront (e.g., https://dripidin.vercel.app)',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    sensitivity: 'PUBLIC',
    requiredInProduction: true,
    publicPrefixRequired: true,
    description: 'Supabase hosted instance URL',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    sensitivity: 'PUBLIC',
    requiredInProduction: true,
    publicPrefixRequired: true,
    description: 'Supabase public anon key with Row Level Security enforcement',
  },

  // 2. Server-Only Operational Variables (Never bundled into client JavaScript)
  {
    name: 'ECOTRACK_API_URL',
    sensitivity: 'SERVER_ONLY',
    requiredInProduction: false,
    description: 'EcoTrack API endpoint URL (default: https://api.ecotrack.dz/v1)',
  },
  {
    name: 'SMS_GATEWAY_API_URL',
    sensitivity: 'SERVER_ONLY',
    requiredInProduction: false,
    description: 'Algerian SMS provider API endpoint',
  },
  {
    name: 'SMS_GATEWAY_SENDER_ID',
    sensitivity: 'SERVER_ONLY',
    requiredInProduction: false,
    description: 'ARPT approved SMS sender identity (e.g., DRIPIDIN)',
  },
  {
    name: 'WHATSAPP_PHONE_NUMBER_ID',
    sensitivity: 'SERVER_ONLY',
    requiredInProduction: false,
    description: 'Meta WhatsApp Business phone number identifier',
  },

  // 3. Sensitive Server-Only Secrets (Never logged, never returned by APIs/Actions)
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    sensitivity: 'SECRET',
    requiredInProduction: true,
    description: 'Supabase privileged service role secret key',
  },
  {
    name: 'ECOTRACK_WEBHOOK_SECRET',
    sensitivity: 'SECRET',
    requiredInProduction: true,
    description: 'Shared HMAC / Bearer secret token for EcoTrack incoming webhook authentication',
  },
  {
    name: 'ECOTRACK_API_TOKEN',
    sensitivity: 'SECRET',
    requiredInProduction: false,
    description: 'EcoTrack logistics API bearer authorization token',
  },
  {
    name: 'SMS_GATEWAY_API_KEY',
    sensitivity: 'SECRET',
    requiredInProduction: false,
    description: 'National SMS gateway authentication secret',
  },
  {
    name: 'WHATSAPP_CLOUD_API_TOKEN',
    sensitivity: 'SECRET',
    requiredInProduction: false,
    description: 'Meta Graph API permanent access token for WhatsApp notifications',
  },
  {
    name: 'CRON_SECRET',
    sensitivity: 'SECRET',
    requiredInProduction: false,
    description: 'Bearer secret for triggering automated scheduled maintenance jobs',
  },
];

export interface ValidationResult {
  isValid: boolean;
  isProduction: boolean;
  missingRequired: string[];
  warnings: string[];
  publicConfig: Record<string, string>;
}

/**
 * Validates the runtime environment variables against the authoritative specification.
 * Throws an explicit error in production if mandatory secrets are missing.
 */
export function validateEnvironment(env: NodeJS.ProcessEnv = process.env): ValidationResult {
  const isProduction = env.NODE_ENV === 'production';
  const missingRequired: string[] = [];
  const warnings: string[] = [];
  const publicConfig: Record<string, string> = {};

  for (const spec of ENV_SPECS) {
    const value = env[spec.name];

    // Check prefix rule for client-exposed variables
    if (spec.sensitivity === 'PUBLIC' && spec.publicPrefixRequired && !spec.name.startsWith('NEXT_PUBLIC_')) {
      warnings.push(`Variable ${spec.name} is classified as PUBLIC but lacks NEXT_PUBLIC_ prefix.`);
    }

    if (!value || value.trim() === '') {
      if (spec.requiredInProduction && isProduction) {
        missingRequired.push(spec.name);
      } else if (spec.requiredInProduction) {
        warnings.push(`[DEV WARNING] Missing recommended variable in development: ${spec.name}`);
      }
    } else {
      if (spec.sensitivity === 'PUBLIC') {
        publicConfig[spec.name] = value;
      }
    }
  }

  const isValid = missingRequired.length === 0;

  return {
    isValid,
    isProduction,
    missingRequired,
    warnings,
    publicConfig,
  };
}

/**
 * Assert production environment validity at application startup.
 */
export function assertProductionEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  const result = validateEnvironment(env);
  if (!result.isValid) {
    const errorMsg = `[CRITICAL CONFIGURATION ERROR] Production deployment blocked. Missing required environment variables:\n - ${result.missingRequired.join('\n - ')}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Safe public configuration getter (guaranteed to contain 0 secrets)
 */
export function getPublicConfiguration() {
  return {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://dripidin.vercel.app'),
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gcqseaefboaijktusjmg.supabase.co',
    isProduction: process.env.NODE_ENV === 'production',
  };
}
