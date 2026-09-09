// HamzaPhone Safe Connection Testing Service Automated Tests

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ConnectionTestService } from './connection-test.service';

describe('ConnectionTestService: Non-Destructive Connectivity Tests', () => {
  it('should safely test EcoTrack connection in Sandbox/Demo mode without token', async () => {
    const result = await ConnectionTestService.testIntegration('ecotrack', {});
    assert.strictEqual(result.integrationId, 'ecotrack');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.environment, 'sandbox');
    assert.ok(result.latencyMs >= 0);
    assert.ok(result.message.length > 0);
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
  });

  it('should safely test Supabase DB & Auth connectivity', async () => {
    const result = await ConnectionTestService.testIntegration('supabase_auth', {
      NEXT_PUBLIC_SUPABASE_URL: 'https://gcqseaefboaijktusjmg.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock-anon',
    });
    assert.strictEqual(result.integrationId, 'supabase_auth');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.environment, 'production');
  });
});
