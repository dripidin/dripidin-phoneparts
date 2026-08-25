// Test Suite for Environment Variable Validation & Classification
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateEnvironment,
  assertProductionEnvironment,
  getPublicConfiguration,
  ENV_SPECS,
} from './environment';

describe('HamzaPhone Environment Configuration & Startup Validator', () => {
  it('1. should classify all environment variables correctly', () => {
    assert.ok(ENV_SPECS.length >= 10);
    const publicSpecs = ENV_SPECS.filter((s) => s.sensitivity === 'PUBLIC');
    const secretSpecs = ENV_SPECS.filter((s) => s.sensitivity === 'SECRET');
    const serverOnlySpecs = ENV_SPECS.filter((s) => s.sensitivity === 'SERVER_ONLY');

    assert.ok(publicSpecs.length > 0);
    assert.ok(secretSpecs.length > 0);
    assert.ok(serverOnlySpecs.length > 0);

    // Verify all public variables follow NEXT_PUBLIC_ convention
    for (const pub of publicSpecs) {
      if (pub.publicPrefixRequired) {
        assert.ok(pub.name.startsWith('NEXT_PUBLIC_'));
      }
    }
  });

  it('2. should pass validation when all required production variables are supplied', () => {
    const mockProdEnv: NodeJS.ProcessEnv = {
      NODE_ENV: 'production',
      NEXT_PUBLIC_SITE_URL: 'https://hamzaphone.dz',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key-12345',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-secret',
      ECOTRACK_WEBHOOK_SECRET: 'test-ecotrack-secret',
    };

    const result = validateEnvironment(mockProdEnv);
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.isProduction, true);
    assert.strictEqual(result.missingRequired.length, 0);
  });

  it('3. should detect missing required variables in production', () => {
    const mockIncompleteProdEnv: NodeJS.ProcessEnv = {
      NODE_ENV: 'production',
      NEXT_PUBLIC_SITE_URL: 'https://hamzaphone.dz',
      // Missing SUPABASE_SERVICE_ROLE_KEY, ECOTRACK_WEBHOOK_SECRET, NEXT_PUBLIC_SUPABASE_ANON_KEY
    };

    const result = validateEnvironment(mockIncompleteProdEnv);
    assert.strictEqual(result.isValid, false);
    assert.ok(result.missingRequired.includes('SUPABASE_SERVICE_ROLE_KEY'));
    assert.ok(result.missingRequired.includes('ECOTRACK_WEBHOOK_SECRET'));
    assert.ok(result.missingRequired.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY'));
  });

  it('4. assertProductionEnvironment should throw clear exception when required secrets are missing', () => {
    const mockIncompleteProdEnv: NodeJS.ProcessEnv = {
      NODE_ENV: 'production',
    };

    assert.throws(
      () => {
        assertProductionEnvironment(mockIncompleteProdEnv);
      },
      /CRITICAL CONFIGURATION ERROR[\s\S]*SUPABASE_SERVICE_ROLE_KEY/
    );
  });

  it('5. getPublicConfiguration should never expose secret values', () => {
    const publicConfig = getPublicConfiguration();
    assert.strictEqual(typeof publicConfig.siteUrl, 'string');
    assert.strictEqual(typeof publicConfig.supabaseUrl, 'string');
    // Ensure no secret keys exist on the publicConfig object
    assert.strictEqual((publicConfig as any).SUPABASE_SERVICE_ROLE_KEY, undefined);
    assert.strictEqual((publicConfig as any).ECOTRACK_WEBHOOK_SECRET, undefined);
    assert.strictEqual((publicConfig as any).ECOTRACK_API_TOKEN, undefined);
  });
});
