// DRIPIDIN Platform — Phase 8 Demo Mode Domain Types
// Authoritative definitions for store operational mode, data isolation, and provider execution plans.

export type StoreOperationalMode = 'DEMO' | 'PRODUCTION';

export interface DemoModeResolution {
  mode: StoreOperationalMode;
  isDemo: boolean;
  source: 'STORE_SETTINGS' | 'ENV_OVERRIDE' | 'DEFAULT_FAILSAFE';
  reason: string;
}

export type ProviderAction = 'SIMULATE' | 'REAL_PROVIDER' | 'BLOCK';

export interface ProviderExecutionPlan {
  action: ProviderAction;
  isDemo: boolean;
  isSimulated?: boolean;
  providerName: string;
  reason: string;
}

export interface DemoProviderReceipt {
  simulated: true;
  isDemo: true;
  providerReceipt: string;
  deliveredAt: string;
  providerName?: string;
  metadata?: Record<string, unknown>;
}

export interface DemoIsolationFilter {
  isDemo?: boolean;
}
