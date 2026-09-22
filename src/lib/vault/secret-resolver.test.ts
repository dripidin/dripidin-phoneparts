// Phase 5 Focused Test Suite: SecretResolver Priority & Fallback Architecture
// Tests Condition 6 (Zero Secret Leakage), Requirement 8 (SecretResolver Entrypoint),
// and Requirement 9 (Vault -> Approved ENV Fallback Hierarchy).

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { SecretResolver } from './secret-resolver';
import { VaultService } from './vault.service';
import { generateVaultKey } from './crypto';

describe('DRIPIDIN Phase 5: SecretResolver & Fallback Hierarchy', () => {
  const testKey = generateVaultKey();

  beforeEach(() => {
    VaultService.resetKeyringForTesting();
    VaultService.setKeyringForTesting({ 1: testKey }, 1);
  });

  afterEach(() => {
    VaultService.resetKeyringForTesting();
  });

  it('1. should resolve secret from Vault with top priority over ENV fallback', async () => {
    // Both Vault and ENV have values for ECOTRACK_API_TOKEN
    await VaultService.setSecret('ecotrack', 'ECOTRACK_API_TOKEN', 'vault_token_value_priority');
    const mockEnv = {
      ECOTRACK_API_TOKEN: 'env_fallback_token_value',
    };

    const resolved = await SecretResolver.getSecret('ecotrack', 'ECOTRACK_API_TOKEN', undefined, mockEnv);
    assert.strictEqual(resolved, 'vault_token_value_priority');

    const source = await SecretResolver.getSecretSource('ecotrack', 'ECOTRACK_API_TOKEN', undefined, mockEnv);
    assert.strictEqual(source, 'VAULT');
  });

  it('2. should fall back to approved ENV when secret is not in Vault', async () => {
    // Secret not stored in Vault
    const mockEnv = {
      SMS_GATEWAY_API_KEY: 'env_provided_sms_key_123',
    };

    const resolved = await SecretResolver.getSecret('sms', 'SMS_GATEWAY_API_KEY', undefined, mockEnv);
    assert.strictEqual(resolved, 'env_provided_sms_key_123');

    const source = await SecretResolver.getSecretSource('sms', 'SMS_GATEWAY_API_KEY', undefined, mockEnv);
    assert.strictEqual(source, 'ENV');

    const presence = await SecretResolver.hasSecret('sms', 'SMS_GATEWAY_API_KEY', undefined, mockEnv);
    assert.strictEqual(presence, 'Configured');
  });

  it('3. should return null and Missing when secret is not in Vault and not in ENV', async () => {
    const emptyEnv = {};

    const resolved = await SecretResolver.getSecret('whatsapp', 'WHATSAPP_CLOUD_API_TOKEN', undefined, emptyEnv);
    assert.strictEqual(resolved, null);

    const presence = await SecretResolver.hasSecret('whatsapp', 'WHATSAPP_CLOUD_API_TOKEN', undefined, emptyEnv);
    assert.strictEqual(presence, 'Missing');

    const source = await SecretResolver.getSecretSource('whatsapp', 'WHATSAPP_CLOUD_API_TOKEN', undefined, emptyEnv);
    assert.strictEqual(source, 'MISSING');
  });

  it('4. should reject unapproved arbitrary environment variables as fallback', async () => {
    const suspiciousEnv = {
      ARBITRARY_PRIVATE_SECRET: 'leaked_data',
    };

    const resolved = await SecretResolver.getSecret('custom', 'ARBITRARY_PRIVATE_SECRET', undefined, suspiciousEnv);
    assert.strictEqual(resolved, null);
  });

  it('5. should verify that hasSecret returns strictly masked presence without exposing secret value', async () => {
    await VaultService.setSecret('telegram', 'TELEGRAM_BOT_TOKEN', 'super_secret_bot_token_999');

    const presence = await SecretResolver.hasSecret('telegram', 'TELEGRAM_BOT_TOKEN');
    assert.strictEqual(presence, 'Configured');
    // Ensure presence is string literal 'Configured', not containing any token fragments
    assert.strictEqual(presence.includes('super_secret'), false);
  });
});
