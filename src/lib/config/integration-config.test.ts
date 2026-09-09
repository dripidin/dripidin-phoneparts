// HamzaPhone Integration Configuration & Credential Shielding Automated Tests

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { IntegrationConfigService } from './integration-config.service';

describe('IntegrationConfigService & Zero-Leakage Architecture', () => {
  it('should list all supported integrations with masked credential status', () => {
    const mockEnv = {
      NEXT_PUBLIC_SITE_URL: 'https://hamzaphone.vercel.app',
      NEXT_PUBLIC_SUPABASE_URL: 'https://gcqseaefboaijktusjmg.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock-anon-key-value',
      SUPABASE_SERVICE_ROLE_KEY: 'mock-service-role-value-secret',
      ECOTRACK_API_TOKEN: 'mock-ecotrack-token-12345',
    };

    const summaries = IntegrationConfigService.getAllIntegrationsSummary(mockEnv);
    assert.strictEqual(Array.isArray(summaries), true);
    assert.strictEqual(summaries.length >= 7, true);

    // EcoTrack verification
    const ecotrack = summaries.find((s) => s.id === 'ecotrack');
    assert.ok(ecotrack);
    assert.strictEqual(ecotrack.category, 'DELIVERY');
    assert.strictEqual(ecotrack.isConfigured, true);

    // Check that NO credential value is leaked in the summaries
    const serialized = JSON.stringify(summaries);
    assert.strictEqual(serialized.includes('mock-service-role-value-secret'), false);
    assert.strictEqual(serialized.includes('mock-ecotrack-token-12345'), false);

    // Check credential status values are 'Configured' or 'Missing'
    const tokenCred = ecotrack.credentials.find((c) => c.name === 'ECOTRACK_API_TOKEN');
    assert.ok(tokenCred);
    assert.strictEqual(tokenCred.status, 'Configured');
    assert.strictEqual(tokenCred.isSecret, true);
  });

  it('should correctly detect missing optional secrets without breaking demo readiness', () => {
    const minimalEnv = {
      NEXT_PUBLIC_SITE_URL: 'https://hamzaphone.vercel.app',
      NEXT_PUBLIC_SUPABASE_URL: 'https://gcqseaefboaijktusjmg.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock-anon-key',
    };

    const summaries = IntegrationConfigService.getAllIntegrationsSummary(minimalEnv);
    const sms = summaries.find((s) => s.id === 'sms');
    assert.ok(sms);
    assert.strictEqual(sms.isConfigured, false);
    assert.strictEqual(sms.isReadyForDemo, true); // Demo mock active
  });

  it('should update non-secret integration settings safely', () => {
    const updated = IntegrationConfigService.updateIntegrationSettings({
      integrationId: 'ecotrack',
      apiUrl: 'https://sandbox.ecotrack.dz/v1',
      environment: 'sandbox',
      enabled: true,
    });

    assert.strictEqual(updated.apiUrl, 'https://sandbox.ecotrack.dz/v1');
    assert.strictEqual(updated.environment, 'sandbox');
    assert.strictEqual(updated.enabled, true);
  });
});
