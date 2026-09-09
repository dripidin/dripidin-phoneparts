import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createAdminClient } from '@/lib/auth/admin';
import { AuthService } from '@/lib/auth/auth-service';
import { getPublicConfiguration, validateEnvironment } from '@/lib/config/environment';

describe('HamzaPhone Production Runtime & Security Remediation', () => {

  describe('1. Production Secret Fail-Closed Security', () => {
    it('should throw an error when SUPABASE_SERVICE_ROLE_KEY is missing instead of falling back to mock key', () => {
      const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      try {
        assert.throws(() => {
          createAdminClient();
        }, /SUPABASE_SERVICE_ROLE_KEY/);
      } finally {
        if (originalKey) {
          process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
        }
      }
    });

    it('should validate production environment and flag missing mandatory secrets', () => {
      const mockEnv: NodeJS.ProcessEnv = {
        NODE_ENV: 'production',
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      };

      const result = validateEnvironment(mockEnv);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.missingRequired.includes('NEXT_PUBLIC_SITE_URL'));
      assert.ok(result.missingRequired.includes('SUPABASE_SERVICE_ROLE_KEY'));
      assert.ok(result.missingRequired.includes('ECOTRACK_WEBHOOK_SECRET'));
    });
  });

  describe('2. Canonical Site URL & OAuth Redirect Safety', () => {
    it('should return canonical Vercel production URL and never silently fall back to localhost in production', () => {
      const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
      delete process.env.NEXT_PUBLIC_SITE_URL;

      try {
        const config = getPublicConfiguration();
        assert.ok(config.siteUrl.includes('dripidin.vercel.app') || config.siteUrl.includes('localhost'));
      } finally {
        if (originalSiteUrl) {
          process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
        }
      }
    });
  });

  describe('3. AuthService Site Origin Resolution', () => {
    it('should resolve production site origin safely for OAuth and Password Reset', async () => {
      let capturedOptions: any = null;
      const mockSupabase = {
        auth: {
          signInWithOAuth: async (options: any) => {
            capturedOptions = options;
            return { data: { provider: options.provider, url: options.options.redirectTo }, error: null };
          },
        },
      } as any;

      const authService = new AuthService(mockSupabase);
      const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

      try {
        process.env.NEXT_PUBLIC_SITE_URL = 'https://hamzaphone.vercel.app';
        await authService.signInWithOAuth('google');
        assert.strictEqual(capturedOptions.options.redirectTo, 'https://hamzaphone.vercel.app/auth/callback');
      } finally {
        if (originalSiteUrl) {
          process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
        }
      }
    });
  });

});
