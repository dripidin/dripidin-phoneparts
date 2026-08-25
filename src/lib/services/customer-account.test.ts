// HamzaPhone Customer Identity, Context & Account Unit Tests (Node Test Runner)

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { CustomerAccountService } from './customer-account.service';
import { AddressSchema, ProfileUpdateSchema } from '@/lib/validation/account.schema';

describe('CustomerAccountService & Identity Context', () => {
  
  it('correctly resolves B2C customer context without B2B wholesale access', async () => {
    const mockProfile = {
      id: 'user-b2c-123',
      full_name: 'Karim Benali',
      phone: '0550123456',
      phone_secondary: null,
      user_type: 'B2C',
      is_active: true,
    };

    const mockSupabase = {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: mockProfile, error: null }),
          }),
        }),
      }),
    };

    const service = new CustomerAccountService(mockSupabase as any);
    const context = await service.getCustomerContext('user-b2c-123');

    assert.ok(context !== null);
    assert.strictEqual(context?.userId, 'user-b2c-123');
    assert.strictEqual(context?.fullName, 'Karim Benali');
    assert.strictEqual(context?.userType, 'B2C');
    assert.strictEqual(context?.isB2B, false);
    assert.strictEqual(context?.canAccessWholesalePrices, false);
    assert.strictEqual(context?.business, null);
  });

  it('correctly resolves B2B customer with PENDING approval and denies wholesale tier prices', async () => {
    const mockProfile = {
      id: 'user-b2b-pending',
      full_name: 'Mourad Touati',
      phone: '0550998877',
      phone_secondary: null,
      user_type: 'B2B',
      is_active: true,
    };

    const mockBusinessMember = {
      business_id: 'biz-1',
      role: 'OWNER',
      businesses: {
        id: 'biz-1',
        name: 'SARL Tech Mobile',
        trade_name: 'Phone Fix',
        rc_number: '16/00-123456B22',
        nif: '002216012345678',
        nis: '123456789',
        article_imposition: '16011234567',
        status: 'PENDING',
        tier_code: 'TIER_1',
        credit_limit_dzd: 100000,
        current_balance_dzd: 0,
        wilaya_code: 16,
        wilaya_name: 'Alger',
        commune_name: 'Kouba',
        address_line: '10 Rue Principale',
      },
    };

    const mockSupabase = {
      from: (table: string) => {
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: mockProfile, error: null }),
              }),
            }),
          };
        }
        if (table === 'business_members') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: mockBusinessMember, error: null }),
              }),
            }),
          };
        }
        return {};
      },
    };

    const service = new CustomerAccountService(mockSupabase as any);
    const context = await service.getCustomerContext('user-b2b-pending');

    assert.ok(context !== null);
    assert.strictEqual(context?.isB2B, true);
    assert.strictEqual(context?.b2bStatus, 'PENDING');
    assert.strictEqual(context?.canAccessWholesalePrices, false);
    assert.strictEqual(context?.business?.name, 'SARL Tech Mobile');
  });

  it('grants wholesale pricing access ONLY when B2B account is APPROVED', async () => {
    const mockProfile = {
      id: 'user-b2b-approved',
      full_name: 'Samir Workshop',
      phone: '0550112233',
      phone_secondary: null,
      user_type: 'B2B',
      is_active: true,
    };

    const mockBusinessMember = {
      business_id: 'biz-2',
      role: 'OWNER',
      businesses: {
        id: 'biz-2',
        name: 'Atelier Phone Master',
        status: 'APPROVED',
        tier_code: 'TIER_1',
        credit_limit_dzd: 500000,
        current_balance_dzd: 45000,
        wilaya_code: 31,
        wilaya_name: 'Oran',
        commune_name: 'Oran Centre',
        address_line: 'Boulevard Front de Mer',
      },
    };

    const mockSupabase = {
      from: (table: string) => {
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: mockProfile, error: null }),
              }),
            }),
          };
        }
        if (table === 'business_members') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: mockBusinessMember, error: null }),
              }),
            }),
          };
        }
        return {};
      },
    };

    const service = new CustomerAccountService(mockSupabase as any);
    const context = await service.getCustomerContext('user-b2b-approved');

    assert.ok(context !== null);
    assert.strictEqual(context?.isB2B, true);
    assert.strictEqual(context?.b2bStatus, 'APPROVED');
    assert.strictEqual(context?.canAccessWholesalePrices, true);
  });

  it('throws forbidden error when unapproved user attempts to fetch wholesale pricing list', async () => {
    const mockProfile = {
      id: 'user-b2c-intruder',
      full_name: 'Intruder',
      user_type: 'B2C',
    };

    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: mockProfile, error: null }),
          }),
        }),
      }),
    };

    const service = new CustomerAccountService(mockSupabase as any);
    await assert.rejects(
      async () => {
        await service.getB2BPricingList('user-b2c-intruder');
      },
      {
        message: 'Accès refusé : la grille tarifaire grossiste est réservée aux comptes B2B approuvés.',
      }
    );
  });

  it('validates Algerian phone numbers and 58 Wilaya range in AddressSchema', () => {
    const validAddress = {
      title: 'Atelier Alger',
      recipientName: 'Yacine Phone',
      recipientPhone: '0550123456',
      addressLine: '15 Boulevard Didouche Mourad',
      wilayaCode: 16,
      wilayaName: 'Alger',
      communeName: 'Alger Centre',
      addressType: 'WORKSHOP',
      isDefault: true,
    };

    const result = AddressSchema.safeParse(validAddress);
    assert.strictEqual(result.success, true);

    // Invalid Wilaya code (> 58)
    const invalidWilaya = {
      ...validAddress,
      wilayaCode: 99,
    };
    const failWilayaResult = AddressSchema.safeParse(invalidWilaya);
    assert.strictEqual(failWilayaResult.success, false);

    // Invalid Phone Format
    const invalidPhone = {
      ...validAddress,
      recipientPhone: '12345',
    };
    const failPhoneResult = AddressSchema.safeParse(invalidPhone);
    assert.strictEqual(failPhoneResult.success, false);
  });

  it('validates ProfileUpdateSchema fields', () => {
    const validProfile = {
      fullName: 'Hamza Phone',
      phone: '0661123456',
    };

    const result = ProfileUpdateSchema.safeParse(validProfile);
    assert.strictEqual(result.success, true);

    const invalidProfile = {
      fullName: '',
    };
    const failResult = ProfileUpdateSchema.safeParse(invalidProfile);
    assert.strictEqual(failResult.success, false);
  });
});
