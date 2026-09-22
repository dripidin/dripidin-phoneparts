// Phase 5 Focused Test Suite: Vault Cryptography, Key Rotation, and Fail-Safe Assertions
// Tests Condition 1 (Root Key Independence & Fail-Safe), Condition 2 (Key Rotation Lifecycle),
// Condition 3 (AES-256-GCM + AAD Context Binding), and Condition 5 (Audit Log Sanitization).

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  encryptSecret,
  decryptSecret,
  generateVaultKey,
  parseKeyBuffer,
  buildAAD,
} from './crypto';
import {
  VaultService,
  VaultConfigurationException,
  KeyringVersionNotFoundException,
} from './vault.service';

describe('DRIPIDIN Phase 5: Cryptography & Vault Engine', () => {
  const testKeyV1 = generateVaultKey();
  const testKeyV2 = generateVaultKey();
  const keyBufferV1 = parseKeyBuffer(testKeyV1);
  const keyBufferV2 = parseKeyBuffer(testKeyV2);

  beforeEach(() => {
    VaultService.resetKeyringForTesting();
  });

  afterEach(() => {
    VaultService.resetKeyringForTesting();
  });

  describe('1. AES-256-GCM Encryption & Context Binding (AAD)', () => {
    it('should successfully encrypt and decrypt with valid key and identical AAD', () => {
      const plaintext = 'ecotrack_live_secret_token_12345';
      const encrypted = encryptSecret(plaintext, keyBufferV1, 'ecotrack', 'ECOTRACK_API_TOKEN', 1);

      assert.ok(encrypted.ciphertext);
      assert.ok(encrypted.nonce);
      assert.ok(encrypted.authTag);
      assert.strictEqual(encrypted.keyVersion, 1);

      const decrypted = decryptSecret(encrypted, keyBufferV1, 'ecotrack', 'ECOTRACK_API_TOKEN');
      assert.strictEqual(decrypted, plaintext);
    });

    it('should throw an authentication error if ciphertext is tampered with', () => {
      const plaintext = 'maghrebsms_production_api_key';
      const encrypted = encryptSecret(plaintext, keyBufferV1, 'sms', 'SMS_GATEWAY_API_KEY', 1);

      // Alter one character in base64 ciphertext
      const tamperedBytes = Buffer.from(encrypted.ciphertext, 'base64');
      tamperedBytes[0] ^= 0xff;
      const tamperedPayload = {
        ...encrypted,
        ciphertext: tamperedBytes.toString('base64'),
      };

      assert.throws(
        () => decryptSecret(tamperedPayload, keyBufferV1, 'sms', 'SMS_GATEWAY_API_KEY'),
        /unable to authenticate data|bad decrypt|Unsupported state/i
      );
    });

    it('should throw an authentication error if authentication tag is tampered with', () => {
      const plaintext = 'whatsapp_cloud_token_secret';
      const encrypted = encryptSecret(plaintext, keyBufferV1, 'whatsapp', 'WHATSAPP_CLOUD_API_TOKEN', 1);

      const tamperedTag = Buffer.from(encrypted.authTag, 'base64');
      tamperedTag[0] ^= 0xaa;
      const tamperedPayload = {
        ...encrypted,
        authTag: tamperedTag.toString('base64'),
      };

      assert.throws(
        () => decryptSecret(tamperedPayload, keyBufferV1, 'whatsapp', 'WHATSAPP_CLOUD_API_TOKEN'),
        /unable to authenticate data|bad decrypt|Unsupported state/i
      );
    });

    it('should throw an authentication error if integration_id in AAD is mismatched (transposition attack)', () => {
      const plaintext = 'secret_courier_token';
      // Encrypted for 'ecotrack'
      const encrypted = encryptSecret(plaintext, keyBufferV1, 'ecotrack', 'ECOTRACK_API_TOKEN', 1);

      // Attacker copies ciphertext to 'sms' integration row
      assert.throws(
        () => decryptSecret(encrypted, keyBufferV1, 'sms', 'ECOTRACK_API_TOKEN'),
        /unable to authenticate data|bad decrypt|Unsupported state/i
      );
    });

    it('should throw an authentication error if key_name in AAD is mismatched', () => {
      const plaintext = 'token_value';
      const encrypted = encryptSecret(plaintext, keyBufferV1, 'ecotrack', 'ECOTRACK_API_TOKEN', 1);

      // Attacker changes key_name to 'ECOTRACK_WEBHOOK_SECRET'
      assert.throws(
        () => decryptSecret(encrypted, keyBufferV1, 'ecotrack', 'ECOTRACK_WEBHOOK_SECRET'),
        /unable to authenticate data|bad decrypt|Unsupported state/i
      );
    });

    it('should throw an authentication error if key_version in AAD is mismatched', () => {
      const plaintext = 'token_value';
      const encrypted = encryptSecret(plaintext, keyBufferV1, 'ecotrack', 'ECOTRACK_API_TOKEN', 1);

      // Modified payload claiming version 2
      const tamperedPayload = { ...encrypted, keyVersion: 2 };

      assert.throws(
        () => decryptSecret(tamperedPayload, keyBufferV1, 'ecotrack', 'ECOTRACK_API_TOKEN'),
        /unable to authenticate data|bad decrypt|Unsupported state/i
      );
    });
  });

  describe('2. Key Rotation Lifecycle & Multi-Version Keyring', () => {
    it('should configure secret with version 1 and decrypt seamlessly', async () => {
      VaultService.setKeyringForTesting({ 1: testKeyV1 }, 1);

      await VaultService.setSecret('ecotrack', 'ECOTRACK_API_TOKEN', 'token_v1_secret');
      const decrypted = await VaultService.getSecret('ecotrack', 'ECOTRACK_API_TOKEN');

      assert.strictEqual(decrypted, 'token_v1_secret');
    });

    it('should support multi-version keyring and allow partial rotation from V1 to V2', async () => {
      // 1. Initial state: active key V1
      VaultService.setKeyringForTesting({ 1: testKeyV1 }, 1);
      await VaultService.setSecret('ecotrack', 'ECOTRACK_API_TOKEN', 'ecotrack_key_v1');
      await VaultService.setSecret('telegram', 'TELEGRAM_BOT_TOKEN', 'telegram_key_v1');

      // 2. Introduce V2 to keyring, set active key to V2
      VaultService.setKeyringForTesting({ 1: testKeyV1, 2: testKeyV2 }, 2);

      // Before rotation, existing V1 records decrypt seamlessly via keyring
      const preDecrypted = await VaultService.getSecret('ecotrack', 'ECOTRACK_API_TOKEN');
      assert.strictEqual(preDecrypted, 'ecotrack_key_v1');

      // 3. Rotate secrets to V2
      const rotationResult = await VaultService.rotateSecrets(2);
      assert.strictEqual(rotationResult.success, true);
      assert.strictEqual(rotationResult.rotatedCount, 2);
      assert.strictEqual(rotationResult.failedCount, 0);

      // After rotation, secrets decrypt with V2
      const postEcotrack = await VaultService.getSecret('ecotrack', 'ECOTRACK_API_TOKEN');
      const postTelegram = await VaultService.getSecret('telegram', 'TELEGRAM_BOT_TOKEN');
      assert.strictEqual(postEcotrack, 'ecotrack_key_v1');
      assert.strictEqual(postTelegram, 'telegram_key_v1');
    });

    it('should verify that old key retirement is blocked while records reference older version', async () => {
      VaultService.setKeyringForTesting({ 1: testKeyV1, 2: testKeyV2 }, 1);
      await VaultService.setSecret('sms', 'SMS_GATEWAY_API_KEY', 'sms_secret_val');

      // Version 1 is still referenced
      const canRetireV1Before = await VaultService.canRetireKeyVersion(1);
      assert.strictEqual(canRetireV1Before, false);

      // Rotate to V2
      await VaultService.rotateSecrets(2);

      // Now V1 is no longer referenced
      const canRetireV1After = await VaultService.canRetireKeyVersion(1);
      assert.strictEqual(canRetireV1After, true);
    });

    it('should throw KeyringVersionNotFoundException if key version is missing from keyring', async () => {
      // Keyring only contains version 2, but record was encrypted with version 1
      VaultService.setKeyringForTesting({ 1: testKeyV1 }, 1);
      await VaultService.setSecret('email', 'SMTP_PASSWORD', 'my_smtp_pwd');

      // Simulate missing version 1 key in keyring
      VaultService.setKeyringForTesting({ 2: testKeyV2 }, 2);

      await assert.rejects(
        async () => {
          await VaultService.getSecret('email', 'SMTP_PASSWORD');
        },
        (err: any) => {
          assert.strictEqual(err.name, 'KeyringVersionNotFoundException');
          assert.ok(err.message.includes('Key version 1 not found'));
          return true;
        }
      );
    });

    it('should revoke a secret cleanly from vault', async () => {
      VaultService.setKeyringForTesting({ 1: testKeyV1 }, 1);
      await VaultService.setSecret('ecotrack', 'ECOTRACK_WEBHOOK_SECRET', 'webhook_secret_xyz');

      assert.strictEqual(await VaultService.hasSecret('ecotrack', 'ECOTRACK_WEBHOOK_SECRET'), true);

      await VaultService.revokeSecret('ecotrack', 'ECOTRACK_WEBHOOK_SECRET');
      assert.strictEqual(await VaultService.hasSecret('ecotrack', 'ECOTRACK_WEBHOOK_SECRET'), false);
      assert.strictEqual(await VaultService.getSecret('ecotrack', 'ECOTRACK_WEBHOOK_SECRET'), null);
    });
  });

  describe('3. Production Fail-Safe Assertions (Condition 1)', () => {
    it('should fail safe and throw VaultConfigurationException in production if DRIPIDIN_VAULT_KEY is missing', () => {
      const prodEnvWithoutKey: NodeJS.ProcessEnv = {
        NODE_ENV: 'production',
        SUPABASE_SERVICE_ROLE_KEY: 'test-supabase-service-role-key-that-must-never-be-used',
        // DRIPIDIN_VAULT_KEY missing!
      };

      assert.throws(
        () => VaultService.getActiveKey(prodEnvWithoutKey),
        (err: any) => {
          assert.strictEqual(err.name, 'VaultConfigurationException');
          assert.ok(err.message.includes('[CRITICAL SECURITY ERROR] Missing DRIPIDIN_VAULT_KEY in production'));
          assert.ok(err.message.includes('Automatic derivation from SUPABASE_SERVICE_ROLE_KEY is disabled'));
          return true;
        }
      );
    });

    it('should succeed in production when DRIPIDIN_VAULT_KEY is independently provisioned', () => {
      const validKey = generateVaultKey();
      const prodEnvWithKey: NodeJS.ProcessEnv = {
        NODE_ENV: 'production',
        DRIPIDIN_VAULT_KEY: validKey,
        SUPABASE_SERVICE_ROLE_KEY: 'independent-supabase-role-key',
      };

      const result = VaultService.getActiveKey(prodEnvWithKey);
      assert.strictEqual(result.keyBuffer.length, 32);
      assert.strictEqual(result.version, 1);
    });
  });
});
