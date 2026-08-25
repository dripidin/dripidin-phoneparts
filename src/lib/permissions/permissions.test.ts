// Unit tests for Permissions & Authorization Guards in HamzaPhone

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PermissionsService } from './permissions-service';
import { requirePermission, requireStaff, AuthorizationError } from './guards';
import type { AppRoleCode } from '@/types/rbac.types';

// Mock Supabase client generator
function createMockSupabase(mockProfile: any, mockRoles: any[], mockBusiness?: any) {
  return {
    auth: {
      getUser: async () => ({
        data: { user: mockProfile ? { id: mockProfile.id, email: mockProfile.email } : null },
        error: mockProfile ? null : new Error('No session'),
      }),
    },
    from: (table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: mockProfile,
                error: mockProfile ? null : new Error('Not found'),
              }),
            }),
          }),
        };
      }
      if (table === 'user_roles') {
        return {
          select: () => ({
            eq: async () => ({
              data: mockRoles,
              error: null,
            }),
          }),
        };
      }
      if (table === 'business_members') {
        return {
          select: () => ({
            eq: () => ({
              limit: () => ({
                maybeSingle: async () => ({
                  data: mockBusiness,
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return { select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }) };
    },
  } as any;
}

describe('PermissionsService & RBAC Evaluation', () => {
  it('should grant access when user has the exact permission', async () => {
    const mockSupabase = createMockSupabase(
      { id: 'user-1', email: 'sales@hamzaphone.dz', user_type: 'STAFF', is_active: true },
      [
        {
          roles: {
            code: 'SALES_MANAGER',
            role_permissions: [{ permissions: { code: 'pricing.update' } }],
          },
        },
      ]
    );

    const service = new PermissionsService(mockSupabase);
    const hasPerm = await service.hasPermission('user-1', 'pricing.update');
    assert.strictEqual(hasPerm, true);

    const hasDeletePerm = await service.hasPermission('user-1', 'products.delete');
    assert.strictEqual(hasDeletePerm, false);
  });

  it('should grant access to any permission when user has "all" (Superuser / OWNER)', async () => {
    const mockSupabase = createMockSupabase(
      { id: 'owner-1', email: 'owner@hamzaphone.dz', user_type: 'STAFF', is_active: true },
      [
        {
          roles: {
            code: 'OWNER',
            role_permissions: [{ permissions: { code: 'all' } }],
          },
        },
      ]
    );

    const service = new PermissionsService(mockSupabase);
    const hasAuditPerm = await service.hasPermission('owner-1', 'audit.read');
    const hasRandomPerm = await service.hasPermission('owner-1', 'products.delete');
    assert.strictEqual(hasAuditPerm, true);
    assert.strictEqual(hasRandomPerm, true);
  });

  it('should deny permissions if user profile is inactive', async () => {
    const mockSupabase = createMockSupabase(
      { id: 'banned-1', email: 'banned@hamzaphone.dz', user_type: 'STAFF', is_active: false },
      [
        {
          roles: {
            code: 'ADMINISTRATOR',
            role_permissions: [{ permissions: { code: 'products.read' } }],
          },
        },
      ]
    );

    const service = new PermissionsService(mockSupabase);
    const hasPerm = await service.hasPermission('banned-1', 'products.read');
    assert.strictEqual(hasPerm, false);
  });
});

describe('Permission Guards (requirePermission & requireStaff)', () => {
  it('should throw AuthorizationError when user is not authenticated', async () => {
    const mockSupabase = createMockSupabase(null, []);

    await assert.rejects(
      async () => {
        await requirePermission(mockSupabase, 'products.read');
      },
      (err: any) => {
        assert.ok(err instanceof AuthorizationError);
        assert.strictEqual(err.code, 'UNAUTHENTICATED');
        return true;
      }
    );
  });

  it('should throw AuthorizationError with FORBIDDEN when permission is missing', async () => {
    const mockSupabase = createMockSupabase(
      { id: 'b2c-1', email: 'client@gmail.com', user_type: 'B2C', is_active: true },
      [
        {
          roles: {
            code: 'B2C_CUSTOMER',
            role_permissions: [{ permissions: { code: 'products.read' } }],
          },
        },
      ]
    );

    await assert.rejects(
      async () => {
        await requirePermission(mockSupabase, 'pricing.bulk_percentage');
      },
      (err: any) => {
        assert.ok(err instanceof AuthorizationError);
        assert.strictEqual(err.code, 'FORBIDDEN');
        return true;
      }
    );
  });

  it('should succeed when requireStaff is called with a staff user', async () => {
    const mockSupabase = createMockSupabase(
      { id: 'staff-1', email: 'admin@hamzaphone.dz', user_type: 'STAFF', is_active: true },
      [
        {
          roles: {
            code: 'ADMINISTRATOR',
            role_permissions: [{ permissions: { code: 'all' } }],
          },
        },
      ]
    );

    const context = await requireStaff(mockSupabase);
    assert.strictEqual(context.userId, 'staff-1');
    assert.strictEqual(context.userType, 'STAFF');
  });
});
