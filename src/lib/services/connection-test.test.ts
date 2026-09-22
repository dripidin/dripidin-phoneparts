// HamzaPhone Safe Connection Testing Service Automated Tests
// Tests Requirement 11 (Safe connectivity, Bearer header, Sanitized diagnostics, Zero leakage)

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ConnectionTestService, sanitizeErrorMessage } from './connection-test.service';

describe('ConnectionTestService: Non-Destructive Connectivity Tests', () => {
  it('should safely test EcoTrack connection in Sandbox/Demo mode without token', async () => {
    const result = await ConnectionTestService.testIntegration('ecotrack', {});
    assert.strictEqual(result.integrationId, 'ecotrack');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.environment, 'sandbox');
    assert.ok(result.latencyMs >= 0);
    assert.ok(result.message.length > 0);
    assert.strictEqual(result.details?.wilayasCovered, 58);
  });

  it('should safely test SMS Gateway in Demo mode without charges', async () => {
    const result = await ConnectionTestService.testIntegration('sms', {});
    assert.strictEqual(result.integrationId, 'sms');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.environment, 'sandbox');
  });

  it('should safely test WhatsApp Cloud API in Demo mode', async () => {
    const result = await ConnectionTestService.testIntegration('whatsapp', {});
    assert.strictEqual(result.integrationId, 'whatsapp');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.environment, 'sandbox');
  });

  it('should safely test Email service in Demo mode without live dispatch', async () => {
    const result = await ConnectionTestService.testIntegration('email', {});
    assert.strictEqual(result.integrationId, 'email');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.environment, 'sandbox');
  });

  it('should safely test Telegram Bot API in Demo mode when token missing', async () => {
    const result = await ConnectionTestService.testIntegration('telegram', {});
    assert.strictEqual(result.integrationId, 'telegram');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.environment, 'sandbox');
  });

  it('should safely test Supabase DB & Auth connectivity when keys provided', async () => {
    const result = await ConnectionTestService.testIntegration('supabase_auth', {
      NEXT_PUBLIC_SUPABASE_URL: 'https://gcqseaefboaijktusjmg.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock-anon',
      SUPABASE_SERVICE_ROLE_KEY: 'mock-service',
    });
    assert.strictEqual(result.integrationId, 'supabase_auth');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.environment, 'production');
  });

  it('should sanitize error messages to prevent secret and bearer token leakage', () => {
    const sensitiveMsg = 'Unauthorized: Bearer secret_token_xyz123 failed for api_token=my_secret_key&secret=super_secret';
    const sanitized = sanitizeErrorMessage(sensitiveMsg);
    assert.strictEqual(sanitized.includes('secret_token_xyz123'), false);
    assert.strictEqual(sanitized.includes('my_secret_key'), false);
    assert.strictEqual(sanitized.includes('super_secret'), false);
    assert.ok(sanitized.includes('Bearer [REDACTED]'));
    assert.ok(sanitized.includes('api_token=[REDACTED]'));
    assert.ok(sanitized.includes('secret=[REDACTED]'));
  });
});
