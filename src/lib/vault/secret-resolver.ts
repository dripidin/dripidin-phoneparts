// DRIPIDIN Central Secret Resolver (SecretResolver)
// Server-Only Execution: Single entrypoint for application code to resolve integration secrets.
// Enforces explicit priority: Encrypted Vault -> Approved Infrastructure ENV -> Missing.
// Guarantees zero secret leakage to browser bundles and public client components.

import { VaultService } from './vault.service';
import type { SecretPresenceStatus } from '@/types/integrations.types';

export type SecretSource = 'VAULT' | 'ENV' | 'MISSING';

export class SecretResolver {
  /**
   * Approved environment variable fallback keys for store integrations.
   * Prevents arbitrary or unintended process.env variables from being resolved.
   */
  private static readonly APPROVED_ENV_KEYS = new Set<string>([
    'ECOTRACK_API_TOKEN',
    'ECOTRACK_WEBHOOK_SECRET',
    'SMS_GATEWAY_API_KEY',
    'WHATSAPP_CLOUD_API_TOKEN',
    'TELEGRAM_BOT_TOKEN',
    'SMTP_PASSWORD',
    'RESEND_API_KEY',
    'GOOGLE_CLIENT_SECRET',
    'SENTRY_DSN',
  ]);

  /**
   * Retrieve the decrypted secret value for an integration.
   * Priority: Encrypted Vault -> Approved ENV -> null.
   *
   * STRICT SECURITY RULE: Server-only! Never call from React Client Components.
   */
  public static async getSecret(
    integrationId: string,
    keyName: string,
    supabaseClient?: any,
    env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
  ): Promise<string | null> {
    // 1. Check encrypted database vault first
    try {
      const vaultValue = await VaultService.getSecret(integrationId, keyName, supabaseClient, env);
      if (vaultValue !== null && vaultValue.trim().length > 0) {
        return vaultValue;
      }
    } catch (err: any) {
      // If production vault key is missing, VaultService throws VaultConfigurationException.
      // Re-throw if critical in production, or fall back if in dev.
      if (env.NODE_ENV === 'production') {
        throw err;
      }
    }

    // 2. Check approved infrastructure environment variables
    if (this.APPROVED_ENV_KEYS.has(keyName)) {
      const envVal = env[keyName];
      if (envVal && envVal.trim().length > 0) {
        return envVal.trim();
      }
    }

    return null;
  }

  /**
   * Determine whether a secret is configured without returning or logging its value.
   * Returns 'Configured' or 'Missing'. Safe to send to administrative UI.
   */
  public static async hasSecret(
    integrationId: string,
    keyName: string,
    supabaseClient?: any,
    env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
  ): Promise<SecretPresenceStatus> {
    // 1. Check vault presence
    const inVault = await VaultService.hasSecret(integrationId, keyName, supabaseClient);
    if (inVault) {
      return 'Configured';
    }

    // 2. Check approved ENV
    if (this.APPROVED_ENV_KEYS.has(keyName)) {
      const envVal = env[keyName];
      if (envVal && envVal.trim().length > 0) {
        return 'Configured';
      }
    }

    return 'Missing';
  }

  /**
   * Resolves the origin source of a secret ('VAULT', 'ENV', or 'MISSING').
   * Allows Admin UI to display whether a secret is managed in the database or host environment.
   */
  public static async getSecretSource(
    integrationId: string,
    keyName: string,
    supabaseClient?: any,
    env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
  ): Promise<SecretSource> {
    const inVault = await VaultService.hasSecret(integrationId, keyName, supabaseClient);
    if (inVault) {
      return 'VAULT';
    }

    if (this.APPROVED_ENV_KEYS.has(keyName)) {
      const envVal = env[keyName];
      if (envVal && envVal.trim().length > 0) {
        return 'ENV';
      }
    }

    return 'MISSING';
  }
}
