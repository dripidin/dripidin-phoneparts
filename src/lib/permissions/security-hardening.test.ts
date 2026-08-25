// Security Hardening & Direct Invocation Test Suite for HamzaPhone Server Actions & RBAC Guards

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { requireAuth, requirePermission, requireRole, requireStaff, requireBusinessMember, AuthorizationError } from './guards';
import { PermissionsService } from './permissions-service';
import type { AppRoleCode } from '@/types/rbac.types';

// Mock Supabase client builder for security testing
function createMockSecuritySupabase(options: {
  user?: { id: string; email: string } | null;
  profile?: { id: string; email: string; user_type: string; is_active: boolean } | null;
  roles?: Array<{ code: string; permissions: string[] }>;
  businessMembership?: { business_id: string } | null;
  auditLogsCollector?: any[];
}) {
  const auditLogs = options.auditLogsCollector || [];

  return {
    auth: {
      getUser: async () => ({
        data: { user: options.user || null },
        error: options.user ? null : new Error('Auth session missing'),
      }),
    },
    from: (table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: options.profile || null,
                error: options.profile ? null : new Error('Profile not found'),
              }),
            }),
          }),
        };
      }
      if (table === 'user_roles') {
        const mockUserRoles = (options.roles || []).map(r => ({
          roles: {
            code: r.code,
            role_permissions: r.permissions.map(p => ({
              permissions: { code: p },
            })),
          },
        }));
        return {
          select: () => ({
            eq: async () => ({
              data: mockUserRoles,
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
                  data: options.businessMembership || null,
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'audit_logs') {
        return {
          insert: async (entry: any) => {
            auditLogs.push(entry);
            return { data: entry, error: null };
          },
          select: () => ({
            eq: () => ({
              order: () => ({
                range: async () => ({ data: auditLogs, count: auditLogs.length, error: null }),
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({ single: async () => ({ data: null, error: null }) }),
        }),
      };
    },
  } as any;
}

describe('Security Hardening Pass: Persona Direct Invocation Tests', () => {
  // 1. Unauthenticated Persona
  describe('Persona 1: Anonymous / Unauthenticated Requester', () => {
    const unauthClient = createMockSecuritySupabase({ user: null, profile: null });

    it('should block read actions and throw UNAUTHENTICATED', async () => {
      await assert.rejects(
        async () => {
          await requirePermission(unauthClient, 'products.read');
        },
        (err: any) => {
          assert.ok(err instanceof AuthorizationError);
          assert.strictEqual(err.code, 'UNAUTHENTICATED');
          return true;
        }
      );
    });

    it('should block mutation actions (products.create)', async () => {
      await assert.rejects(
        async () => {
          await requirePermission(unauthClient, 'products.create');
        },
        (err: any) => {
          assert.ok(err instanceof AuthorizationError);
          assert.strictEqual(err.code, 'UNAUTHENTICATED');
          return true;
        }
      );
    });

    it('should block destructive actions (products.delete)', async () => {
      await assert.rejects(
        async () => {
          await requirePermission(unauthClient, 'products.delete');
        },
        (err: any) => {
          assert.ok(err instanceof AuthorizationError);
          assert.strictEqual(err.code, 'UNAUTHENTICATED');
          return true;
        }
      );
    });

    it('should block financial operations (pricing.bulk_percentage)', async () => {
      await assert.rejects(
        async () => {
          await requirePermission(unauthClient, 'pricing.bulk_percentage');
        },
        (err: any) => {
          assert.ok(err instanceof AuthorizationError);
          assert.strictEqual(err.code, 'UNAUTHENTICATED');
          return true;
        }
      );
    });

    it('should block staff clearance check', async () => {
      await assert.rejects(
        async () => {
          await requireStaff(unauthClient);
        },
        (err: any) => {
          assert.ok(err instanceof AuthorizationError);
          assert.strictEqual(err.code, 'UNAUTHENTICATED');
          return true;
        }
      );
    });
  });

  // 2. Suspended / Inactive Staff Persona
  describe('Persona 2: Suspended / Inactive Staff Member', () => {
    const suspendedClient = createMockSecuritySupabase({
      user: { id: 'usr-banned', email: 'ex-employee@hamzaphone.dz' },
      profile: { id: 'usr-banned', email: 'ex-employee@hamzaphone.dz', user_type: 'STAFF', is_active: false },
      roles: [{ code: 'ADMINISTRATOR', permissions: ['all'] }],
    });

    it('should reject all actions when account is deactivated', async () => {
      await assert.rejects(
        async () => {
          await requirePermission(suspendedClient, 'products.read');
        },
        (err: any) => {
          assert.ok(err instanceof AuthorizationError);
          assert.strictEqual(err.code, 'FORBIDDEN');
          assert.match(err.message, /inactive or disabled/i);
          return true;
        }
      );
    });
  });

  // 3. Regular B2C Customer Persona
  describe('Persona 3: Regular B2C Customer', () => {
    const b2cClient = createMockSecuritySupabase({
      user: { id: 'usr-b2c-1', email: 'customer@gmail.com' },
      profile: { id: 'usr-b2c-1', email: 'customer@gmail.com', user_type: 'B2C', is_active: true },
      roles: [{ code: 'B2C_CUSTOMER', permissions: ['products.read'] }],
    });

    it('should ALLOW public product read', async () => {
      const context = await requirePermission(b2cClient, 'products.read');
      assert.strictEqual(context.userId, 'usr-b2c-1');
      assert.strictEqual(context.role, 'B2C_CUSTOMER');
    });

    it('should REJECT admin dashboard overview stats (requireStaff)', async () => {
      await assert.rejects(
        async () => {
          await requireStaff(b2cClient);
        },
        (err: any) => {
          assert.ok(err instanceof AuthorizationError);
          assert.strictEqual(err.code, 'FORBIDDEN');
          return true;
        }
      );
    });

    it('should REJECT pricing mutations (pricing.update)', async () => {
      await assert.rejects(
        async () => {
          await requirePermission(b2cClient, 'pricing.update');
        },
        (err: any) => {
          assert.ok(err instanceof AuthorizationError);
          assert.strictEqual(err.code, 'FORBIDDEN');
          return true;
        }
      );
    });

    it('should REJECT bulk price adjustment (pricing.bulk_percentage)', async () => {
      await assert.rejects(
        async () => {
          await requirePermission(b2cClient, 'pricing.bulk_percentage');
        },
        (err: any) => {
          assert.ok(err instanceof AuthorizationError);
          assert.strictEqual(err.code, 'FORBIDDEN');
          return true;
        }
      );
    });

    it('should REJECT order status modifications (orders.update)', async () => {
      await assert.rejects(
        async () => {
          await requirePermission(b2cClient, 'orders.update');
        },
        (err: any) => {
          assert.ok(err instanceof AuthorizationError);
          assert.strictEqual(err.code, 'FORBIDDEN');
          return true;
        }
      );
    });

    it('should REJECT B2B application approvals (b2b.approve)', async () => {
      await assert.rejects(
        async () => {
          await requirePermission(b2cClient, 'b2b.approve');
        },
        (err: any) => {
          assert.ok(err instanceof AuthorizationError);
          assert.strictEqual(err.code, 'FORBIDDEN');
          return true;
        }
      );
    });

    it('should REJECT audit log access (audit.read)', async () => {
      await assert.rejects(
        async () => {
          await requirePermission(b2cClient, 'audit.read');
        },
        (err: any) => {
          assert.ok(err instanceof AuthorizationError);
          assert.strictEqual(err.code, 'FORBIDDEN');
          return true;
        }
      );
    });
  });

  // 4. Limited Staff Persona: Content Editor
  describe('Persona 4: Limited Staff - Content Editor', () => {
    const editorClient = createMockSecuritySupabase({
      user: { id: 'usr-editor-1', email: 'editor@hamzaphone.dz' },
      profile: { id: 'usr-editor-1', email: 'editor@hamzaphone.dz', user_type: 'STAFF', is_active: true },
      roles: [{
        code: 'CATALOG_EDITOR',
        permissions: ['products.read', 'products.create', 'products.update', 'categories.manage', 'brands.manage'],
      }],
    });

    it('should ALLOW staff check', async () => {
      const context = await requireStaff(editorClient);
      assert.strictEqual(context.userType, 'STAFF');
    });

    it('should ALLOW product creation and updates', async () => {
      const createCtx = await requirePermission(editorClient, 'products.create');
      assert.strictEqual(createCtx.email, 'editor@hamzaphone.dz');

      const updateCtx = await requirePermission(editorClient, 'products.update');
      assert.strictEqual(updateCtx.email, 'editor@hamzaphone.dz');
    });

    it('should ALLOW category & brand management', async () => {
      const catCtx = await requirePermission(editorClient, 'categories.manage');
      assert.ok(catCtx);
      const brandCtx = await requirePermission(editorClient, 'brands.manage');
      assert.ok(brandCtx);
    });

    it('should REJECT product deletion (products.delete)', async () => {
      await assert.rejects(
        async () => {
          await requirePermission(editorClient, 'products.delete');
        },
        (err: any) => {
          assert.ok(err instanceof AuthorizationError);
          assert.strictEqual(err.code, 'FORBIDDEN');
          return true;
        }
      );
    });

    it('should REJECT pricing bulk adjustments', async () => {
      await assert.rejects(
        async () => {
          await requirePermission(editorClient, 'pricing.bulk_percentage');
        },
        (err: any) => {
          assert.ok(err instanceof AuthorizationError);
          assert.strictEqual(err.code, 'FORBIDDEN');
          return true;
        }
      );
    });

    it('should REJECT inventory adjustments', async () => {
      await assert.rejects(
        async () => {
          await requirePermission(editorClient, 'inventory.adjust');
        },
        (err: any) => {
          assert.ok(err instanceof AuthorizationError);
          assert.strictEqual(err.code, 'FORBIDDEN');
          return true;
        }
      );
    });
  });

  // 5. Limited Staff Persona: Warehouse Operator
  describe('Persona 5: Limited Staff - Warehouse Operator', () => {
    const warehouseClient = createMockSecuritySupabase({
      user: { id: 'usr-wh-1', email: 'warehouse@hamzaphone.dz' },
      profile: { id: 'usr-wh-1', email: 'warehouse@hamzaphone.dz', user_type: 'STAFF', is_active: true },
      roles: [{
        code: 'WAREHOUSE_OPERATOR',
        permissions: ['inventory.read', 'inventory.adjust', 'products.read'],
      }],
    });

    it('should ALLOW inventory adjustments', async () => {
      const context = await requirePermission(warehouseClient, 'inventory.adjust');
      assert.strictEqual(context.email, 'warehouse@hamzaphone.dz');
    });

    it('should REJECT price updates (pricing.update)', async () => {
      await assert.rejects(
        async () => {
          await requirePermission(warehouseClient, 'pricing.update');
        },
        (err: any) => {
          assert.ok(err instanceof AuthorizationError);
          assert.strictEqual(err.code, 'FORBIDDEN');
          return true;
        }
      );
    });

    it('should REJECT B2B approvals (b2b.approve)', async () => {
      await assert.rejects(
        async () => {
          await requirePermission(warehouseClient, 'b2b.approve');
        },
        (err: any) => {
          assert.ok(err instanceof AuthorizationError);
          assert.strictEqual(err.code, 'FORBIDDEN');
          return true;
        }
      );
    });
  });

  // 6. Superuser / OWNER Persona
  describe('Persona 6: Superuser / Store Owner (all permissions)', () => {
    const ownerClient = createMockSecuritySupabase({
      user: { id: 'usr-owner-1', email: 'owner@hamzaphone.dz' },
      profile: { id: 'usr-owner-1', email: 'owner@hamzaphone.dz', user_type: 'STAFF', is_active: true },
      roles: [{
        code: 'OWNER',
        permissions: ['all'],
      }],
    });

    it('should ALLOW any action via wildcard "all" permission', async () => {
      const p1 = await requirePermission(ownerClient, 'products.create');
      const p2 = await requirePermission(ownerClient, 'pricing.bulk_percentage');
      const p3 = await requirePermission(ownerClient, 'inventory.adjust');
      const p4 = await requirePermission(ownerClient, 'b2b.approve');
      const p5 = await requirePermission(ownerClient, 'audit.read');

      assert.strictEqual(p1.email, 'owner@hamzaphone.dz');
      assert.strictEqual(p2.role, 'OWNER');
      assert.strictEqual(p3.userId, 'usr-owner-1');
      assert.ok(p4);
      assert.ok(p5);
    });
  });
});

describe('Security Hardening Pass: Data Exposure & Boundary Protections', () => {
  it('should enforce B2B business profile requirement via requireBusinessMember', async () => {
    const nonB2BClient = createMockSecuritySupabase({
      user: { id: 'usr-reg-1', email: 'regular@user.dz' },
      profile: { id: 'usr-reg-1', email: 'regular@user.dz', user_type: 'B2C', is_active: true },
      roles: [{ code: 'B2C_CUSTOMER', permissions: ['products.read'] }],
      businessMembership: null,
    });

    await assert.rejects(
      async () => {
        await requireBusinessMember(nonB2BClient);
      },
      (err: any) => {
        assert.ok(err instanceof AuthorizationError);
        assert.strictEqual(err.code, 'FORBIDDEN');
        assert.match(err.message, /B2B business profile required/i);
        return true;
      }
    );

    const b2bClient = createMockSecuritySupabase({
      user: { id: 'usr-b2b-pro', email: 'repair@techshop.dz' },
      profile: { id: 'usr-b2b-pro', email: 'repair@techshop.dz', user_type: 'B2B', is_active: true },
      roles: [{ code: 'B2B_WHOLESALE', permissions: ['products.read', 'b2b.order'] }],
      businessMembership: { business_id: 'biz-9988' },
    });

    const ctx = await requireBusinessMember(b2bClient);
    assert.strictEqual(ctx.businessId, 'biz-9988');
    assert.strictEqual(ctx.userType, 'B2B');
  });
});
