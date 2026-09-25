// DRIPIDIN Platform — Phase 8 Demo Mode Service
// Authoritative singleton resolving operational mode, data isolation, and provider safety fail-safes.

import type { StoreSettings } from '@/types/settings.types';
import type { DemoModeResolution, ProviderAction, ProviderExecutionPlan, StoreOperationalMode } from './types';

export class ProviderConfigurationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderConfigurationException';
  }
}

export class DemoModeService {
  /**
   * Evaluates environment variable override if explicitly configured.
   * FORCE_DEMO_MODE=true or FORCE_DEMO_MODE=false
   */
  private static getEnvOverride(): boolean | null {
    const envVal = process.env.FORCE_DEMO_MODE;
    if (envVal !== undefined && envVal !== null) {
      const lower = envVal.trim().toLowerCase();
      if (lower === 'true' || lower === '1') return true;
      if (lower === 'false' || lower === '0') return false;
    }
    return null;
  }

  /**
   * Synchronously inspects settings object (e.g. during SSR render or when settings are preloaded).
   */
  static isDemoModeSync(settings?: Partial<StoreSettings> | null): boolean {
    const envOverride = this.getEnvOverride();
    if (envOverride !== null) {
      return envOverride;
    }
    if (settings && typeof settings.forceDemoMode === 'boolean') {
      return settings.forceDemoMode;
    }
    // Safe default when settings unavailable
    return true;
  }

  /**
   * Authoritative async resolution of the current store operational mode.
   * Evaluates environment overrides, persistent database settings, and defaults.
   * Safe invariant: DB/settings unavailable -> DEMO for side-effect safety.
   */
  static async getEffectiveMode(
    customSettings?: Partial<StoreSettings> | null,
    customClient?: any
  ): Promise<DemoModeResolution> {
    const envOverride = this.getEnvOverride();
    if (envOverride !== null) {
      return {
        isDemo: envOverride,
        mode: envOverride ? 'DEMO' : 'PRODUCTION',
        source: 'ENV_OVERRIDE',
        reason: `FORCE_DEMO_MODE environment override is set to ${envOverride}`,
      };
    }

    try {
      let isDemo = true; // Safe default for side-effect safety

      if (customSettings) {
        if (typeof (customSettings as any).forceDemoMode === 'boolean') {
          isDemo = (customSettings as any).forceDemoMode;
          return {
            isDemo,
            mode: isDemo ? 'DEMO' : 'PRODUCTION',
            source: 'STORE_SETTINGS',
            reason: isDemo ? 'Explicit custom settings force_demo_mode is true' : 'Explicit custom settings force_demo_mode is false',
          };
        }
        if (typeof (customSettings as any).isDemo === 'boolean') {
          isDemo = (customSettings as any).isDemo;
          return {
            isDemo,
            mode: isDemo ? 'DEMO' : 'PRODUCTION',
            source: 'STORE_SETTINGS',
            reason: isDemo ? 'Explicit custom settings isDemo is true' : 'Explicit custom settings isDemo is false',
          };
        }
      }

      if (customClient) {
        const { StoreSettingsRepository } = await import('@/lib/repositories/store-settings.repository');
        const repo = new StoreSettingsRepository(customClient);
        const dbSettings = await repo.getSingleton();
        if (!dbSettings) {
          return {
            isDemo: true,
            mode: 'DEMO',
            source: 'DEFAULT_FAILSAFE',
            reason: 'Database settings unavailable; failing closed to DEMO sandbox mode for safety.',
          };
        }
        isDemo = Boolean(dbSettings.forceDemoMode);
        return {
          isDemo,
          mode: isDemo ? 'DEMO' : 'PRODUCTION',
          source: 'STORE_SETTINGS',
          reason: isDemo ? 'Database store_settings.force_demo_mode is active' : 'Database store_settings.force_demo_mode is disabled',
        };
      }

      // Check authoritative database connection without depending on next/headers
      try {
        const { createClient } = await import('@/lib/auth/client');
        const client = createClient();
        const { data: dbRow, error } = await (client.from('store_settings') as any)
          .select('force_demo_mode')
          .limit(1)
          .maybeSingle();

        if (error || !dbRow) {
          return {
            isDemo: true,
            mode: 'DEMO',
            source: 'DEFAULT_FAILSAFE',
            reason: 'Database store_settings row unavailable; failing closed to DEMO sandbox mode for safety.',
          };
        }
        isDemo = Boolean(dbRow.force_demo_mode);
        return {
          isDemo,
          mode: isDemo ? 'DEMO' : 'PRODUCTION',
          source: 'STORE_SETTINGS',
          reason: isDemo ? 'StoreSettings.force_demo_mode is active' : 'StoreSettings.force_demo_mode is disabled',
        };
      } catch {
        // Database connection or server context unavailable
        return {
          isDemo: true,
          mode: 'DEMO',
          source: 'DEFAULT_FAILSAFE',
          reason: 'Database connection unavailable; failing closed to DEMO sandbox mode for safety.',
        };
      }
    } catch (err: any) {
      // Production fail-safe: if settings cannot be read, log warning and fail closed for safety
      return {
        isDemo: true,
        mode: 'DEMO',
        source: 'DEFAULT_FAILSAFE',
        reason: 'Error reading store settings; failed closed to DEMO mode for external provider safety.',
      };
    }
  }

  /**
   * Helper returning boolean whether the platform is currently operating in Demo Mode.
   */
  static async isDemoMode(
    customSettings?: Partial<StoreSettings> | null,
    customClient?: any
  ): Promise<boolean> {
    const res = await this.getEffectiveMode(customSettings, customClient);
    return res.isDemo;
  }

  /**
   * Evaluates Provider Side-Effect Matrix according to Rule 2:
   * - DEMO + credentials -> SIMULATE
   * - DEMO + no credentials -> SIMULATE
   * - REAL + credentials -> REAL_PROVIDER
   * - REAL + no credentials -> BLOCK (throw)
   * - UNKNOWN -> BLOCK (throw)
   */
  static async requireRealProviderOrThrow(
    providerName: string,
    credentialsExist: boolean,
    customSettings?: Partial<StoreSettings> | null,
    customClient?: any
  ): Promise<ProviderExecutionPlan> {
    const resolution = await this.getEffectiveMode(customSettings, customClient);

    if (resolution.isDemo) {
      return {
        action: 'SIMULATE',
        isSimulated: true,
        isDemo: true,
        providerName,
        reason: `Demo mode active; simulating ${providerName} operations safely.`,
      };
    }

    if (resolution.mode === 'PRODUCTION') {
      if (!credentialsExist) {
        throw new ProviderConfigurationException(
          `[CRITICAL] Production store attempted external provider call (${providerName}) without configured credentials. Refusing to silently simulate in real mode.`
        );
      }
      return {
        action: 'REAL_PROVIDER',
        isSimulated: false,
        isDemo: false,
        providerName,
        reason: `Production mode active with verified credentials for ${providerName}.`,
      };
    }

    throw new ProviderConfigurationException(
      `[CRITICAL] Ambiguous store operational mode encountered during ${providerName} dispatch. Halting for safety.`
    );
  }

  /**
   * Tags an order payload with appropriate is_demo flag and order_number prefix.
   */
  static tagOrder(orderPayload: Record<string, any>, isDemo: boolean): Record<string, any> {
    const baseNumber = String(orderPayload.order_number || orderPayload.orderNumber || '');
    let orderNumber = baseNumber;

    if (isDemo && !orderNumber.startsWith('DEMO-')) {
      orderNumber = `DEMO-${orderNumber}`;
    }

    return {
      ...orderPayload,
      order_number: orderNumber,
      orderNumber: orderNumber,
      is_demo: isDemo,
    };
  }

  /**
   * Tags a delivery manifest payload with is_demo flag.
   */
  static tagDelivery(deliveryPayload: Record<string, any>, isDemo: boolean): Record<string, any> {
    return {
      ...deliveryPayload,
      is_demo: isDemo,
    };
  }

  /**
   * Tags a notification queue record with is_demo flag.
   */
  static tagNotification(notificationPayload: Record<string, any>, isDemo: boolean): Record<string, any> {
    return {
      ...notificationPayload,
      is_demo: isDemo,
      metadata: {
        ...(notificationPayload.metadata || {}),
        isDemo,
      },
    };
  }

  /**
   * Tags an inventory transaction with is_demo flag.
   */
  static tagInventoryTransaction(txPayload: Record<string, any>, isDemo: boolean): Record<string, any> {
    return {
      ...txPayload,
      is_demo: isDemo,
      reference_type: isDemo ? 'DEMO_ORDER' : (txPayload.reference_type || 'ORDER'),
    };
  }
}
