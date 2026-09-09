// HamzaPhone Integration Configuration & Credential Architecture Types
// Strict typing for IntegrationConfigService, Admin Integration Center, and Safe Connection Tests

export type IntegrationCategory =
  | 'DELIVERY'
  | 'EMAIL'
  | 'SMS'
  | 'WHATSAPP'
  | 'TELEGRAM'
  | 'PAYMENT'
  | 'AUTH_OAUTH'
  | 'STORAGE'
  | 'MONITORING'
  | 'ANALYTICS';

export type ConfigClassification =
  | 'PUBLIC_CONFIG'
  | 'SERVER_CONFIG'
  | 'SERVER_SECRET'
  | 'OAUTH_SECRET'
  | 'WEBHOOK_SECRET'
  | 'USER_MANAGED_SETTING';

export type DemoRequirementStatus =
  | 'REQUIRED_FOR_DEMO'
  | 'OPTIONAL_FOR_DEMO'
  | 'PRODUCTION_ONLY'
  | 'NOT_CURRENTLY_USED';

export type SecretPresenceStatus = 'Configured' | 'Missing';

export interface CredentialFieldStatus {
  name: string;
  classification: ConfigClassification;
  status: SecretPresenceStatus;
  isSecret: boolean;
  requiredForDemo: boolean;
  requiredForProduction: boolean;
  description: string;
}

export interface IntegrationSummary {
  id: string;
  name: string;
  category: IntegrationCategory;
  provider: string;
  enabled: boolean;
  environment: 'sandbox' | 'production';
  demoStatus: DemoRequirementStatus;
  isConfigured: boolean;
  isReadyForDemo: boolean;
  isReadyForProduction: boolean;
  apiUrl?: string;
  nonSecretConfig: Record<string, string | number | boolean>;
  credentials: CredentialFieldStatus[];
  lastTestedAt?: string;
  lastTestSuccess?: boolean;
  lastTestMessage?: string;
  lastTestLatencyMs?: number;
}

export interface SafeConnectionTestResult {
  integrationId: string;
  provider: string;
  success: boolean;
  environment: 'sandbox' | 'production';
  message: string;
  latencyMs: number;
  testedAt: string;
  details?: Record<string, string | number | boolean>;
}

export interface UpdateIntegrationSettingsInput {
  integrationId: string;
  enabled?: boolean;
  environment?: 'sandbox' | 'production';
  apiUrl?: string;
  nonSecretConfig?: Record<string, string | number | boolean>;
}

export interface DemoInventorySeedInput {
  target: 'ALL_ACTIVE' | 'CATEGORY' | 'SELECTED_PRODUCTS';
  categoryId?: string;
  productIds?: string[];
  seedQuantity: number;
  reason?: string;
}

export interface DemoInventorySeedResult {
  success: boolean;
  target: string;
  updatedProductsCount: number;
  totalUnitsAdded: number;
  appliedStockPerProduct: number;
  auditLogId: string;
  timestamp: string;
}
