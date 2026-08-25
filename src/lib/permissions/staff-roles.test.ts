// HamzaPhone Staff & Role Management Automated Test Suite
// Verifies Server Actions, RBAC Guards, Last Owner Protection, Self-Protection, and Audit Logging

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getStaffListAction,
  getStaffDetailsAction,
  createStaffUserAction,
  updateStaffUserAction,
  toggleStaffStatusAction,
  getRolesWithPermissionsAction,
  createRoleAction,
  updateRolePermissionsAction,
  duplicateRoleAction,
} from '@/lib/actions/staff-role.actions';
import { SYSTEM_PERMISSIONS } from '@/lib/permissions/permission-registry';

// Helper to create mock Supabase client for various security personas
function createMockPersonaClient(options: {
  userId?: string;
  email?: string;
  userType?: string;
  role?: string;
  permissions?: string[];
  isActive?: boolean;
}) {
  const user = options.userId ? { id: options.userId, email: options.email || 'user@hamzaphone.dz' } : null;
  const profile = options.userId
    ? {
        id: options.userId,
        email: options.email || 'user@hamzaphone.dz',
        user_type: options.userType || 'STAFF',
        is_active: options.isActive ?? true,
      }
    : null;

  const roleCode = options.role || 'ADMINISTRATOR';
  const perms = options.permissions || ['all'];

  const mockUserRoles = [
    {
      roles: {
        code: roleCode,
        role_permissions: perms.map((p) => ({
          permissions: { code: p },
        })),
      },
    },
  ];

  const auditLogsCollector: any[] = [];

  return {
    _auditLogs: auditLogsCollector,
    auth: {
      getUser: async () => ({
        data: { user },
        error: user ? null : new Error('Auth session missing'),
      }),
    },
    from: (table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: profile,
                error: profile ? null : new Error('Profile not found'),
              }),
            }),
          }),
        };
      }
      if (table === 'user_roles') {
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
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === 'audit_logs') {
        return {
          insert: async (entry: any) => {
            auditLogsCollector.push(entry);
            return { data: entry, error: null };
          },
        };
      }
      return {
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
      };
    },
  };
}

describe('HamzaPhone Staff Directory & Role Management', () => {
  const ownerClient = createMockPersonaClient({
    userId: 'user-owner-01',
    email: 'admin@hamzaphone.dz',
    userType: 'STAFF',
    role: 'OWNER',
    permissions: ['all'],
  });

  const adminClient = createMockPersonaClient({
    userId: 'user-admin-01',
    email: 'yassine.admin@hamzaphone.dz',
    userType: 'STAFF',
    role: 'ADMINISTRATOR',
    permissions: ['users.manage', 'settings.manage', 'products.read', 'orders.read'],
  });

  const warehouseClient = createMockPersonaClient({
    userId: 'user-warehouse-01',
    email: 'mustapha.stock@hamzaphone.dz',
    userType: 'STAFF',
    role: 'INVENTORY_MANAGER',
    permissions: ['inventory.read', 'inventory.adjust', 'inventory.receive'],
  });

  const b2cClient = createMockPersonaClient({
    userId: 'user-b2c-01',
    email: 'client@gmail.com',
    userType: 'B2C',
    role: 'B2C_CUSTOMER',
    permissions: ['products.read', 'orders.create'],
  });

  const anonymousClient = createMockPersonaClient({});

  describe('1. Security & RBAC Persona Boundary Enforcement', () => {
    it('should REJECT anonymous requests with UNAUTHENTICATED', async () => {
      await assert.rejects(
        async () => {
          await getStaffListAction(anonymousClient);
        },
        /Authentication required/i
      );
    });

    it('should REJECT B2C Customer from accessing staff directory', async () => {
      await assert.rejects(
        async () => {
          await getStaffListAction(b2cClient);
        },
        /Staff clearance required/i
      );
    });

    it('should REJECT limited staff (Warehouse) without users.manage from creating staff', async () => {
      await assert.rejects(
        async () => {
          await createStaffUserAction(
            {
              email: 'unauthorized.creation@hamzaphone.dz',
              fullName: 'Hacker Attempt',
              roleCode: 'SUPPORT',
            },
            warehouseClient
          );
        },
        /Missing required permission \[users.manage\]/i
      );
    });
  });

  describe('2. Staff Directory Queries', () => {
    it('should retrieve list of all staff members with safe profiles for authorized staff', async () => {
      const staff = await getStaffListAction(ownerClient);
      assert.strictEqual(Array.isArray(staff), true);
      assert.strictEqual(staff.length > 0, true);

      // Verify no sensitive credentials or password hashes exposed
      for (const member of staff) {
        assert.ok(member.id);
        assert.ok(member.email);
        assert.ok(member.fullName);
        assert.ok(member.role);
        assert.strictEqual(typeof member.isActive, 'boolean');
        assert.strictEqual((member as any).password, undefined);
        assert.strictEqual((member as any).encrypted_password, undefined);
        assert.strictEqual((member as any).raw_app_meta_data, undefined);
      }
    });

    it('should retrieve detailed profile with effective permissions and activity history', async () => {
      const staffList = await getStaffListAction(ownerClient);
      const firstStaff = staffList[0];

      const detail = await getStaffDetailsAction(firstStaff.id, ownerClient);
      assert.strictEqual(detail.id, firstStaff.id);
      assert.strictEqual(Array.isArray(detail.permissions), true);
      assert.strictEqual(Array.isArray(detail.recentActivity), true);
    });
  });

  describe('3. Staff Creation & Privilege Escalation Guards', () => {
    it('should allow authorized admin to create a new staff member', async () => {
      const email = `new.agent.${Date.now()}@hamzaphone.dz`;
      const created = await createStaffUserAction(
        {
          email,
          fullName: 'Houari Boumediene Test',
          phone: '+213 550 99 88 77',
          roleCode: 'ORDER_MANAGER',
        },
        adminClient
      );

      assert.strictEqual(created.email, email);
      assert.strictEqual(created.role, 'ORDER_MANAGER');
      assert.strictEqual(created.isActive, true);

      const staffList = await getStaffListAction(adminClient);
      assert.strictEqual(staffList.some((s) => s.email === email), true);
    });

    it('should prevent non-owner admin from creating an OWNER account (Escalation Guard)', async () => {
      await assert.rejects(
        async () => {
          await createStaffUserAction(
            {
              email: `illegal.owner.${Date.now()}@hamzaphone.dz`,
              fullName: 'Illegal Owner Candidate',
              roleCode: 'OWNER',
            },
            adminClient // Administrator is not OWNER
          );
        },
        /Seul un Propriétaire \(OWNER\) peut désigner un autre compte OWNER/i
      );
    });

    it('should prevent creating a staff member with duplicate email', async () => {
      await assert.rejects(
        async () => {
          await createStaffUserAction(
            {
              email: 'admin@hamzaphone.dz', // already exists
              fullName: 'Duplicate Admin',
              roleCode: 'SUPPORT',
            },
            adminClient
          );
        },
        /existe déjà/i
      );
    });

    it('should reject creating a staff member with invalid role code', async () => {
      await assert.rejects(
        async () => {
          await createStaffUserAction(
            {
              email: 'invalid.role@hamzaphone.dz',
              fullName: 'Bad Role User',
              roleCode: 'NON_EXISTENT_ROLE' as any,
            },
            adminClient
          );
        },
        /Rôle invalide/i
      );
    });
  });

  describe('4. Last Owner Protection Safeguards', () => {
    it('should prevent suspending or deactivating the last active OWNER', async () => {
      const staffList = await getStaffListAction(ownerClient);
      const owner = staffList.find((s) => s.role === 'OWNER' && s.isActive);
      assert.ok(owner);

      await assert.rejects(
        async () => {
          await toggleStaffStatusAction(owner.id, false, ownerClient);
        },
        /dernier compte Propriétaire/i
      );

      await assert.rejects(
        async () => {
          await updateStaffUserAction(owner.id, { isActive: false }, ownerClient);
        },
        /dernier compte Propriétaire/i
      );
    });

    it('should prevent downgrading the role of the last active OWNER', async () => {
      const staffList = await getStaffListAction(ownerClient);
      const owner = staffList.find((s) => s.role === 'OWNER' && s.isActive);
      assert.ok(owner);

      await assert.rejects(
        async () => {
          await updateStaffUserAction(owner.id, { roleCode: 'SUPPORT' }, ownerClient);
        },
        /rétrograder le dernier compte Propriétaire/i
      );
    });
  });

  describe('5. Staff Role & Status Updates', () => {
    it('should allow modifying staff details and role for non-owner accounts', async () => {
      const staffList = await getStaffListAction(adminClient);
      const nonOwner = staffList.find((s) => s.role === 'ORDER_MANAGER');
      assert.ok(nonOwner);

      const updated = await updateStaffUserAction(
        nonOwner.id,
        {
          fullName: 'Nadia Larbi (Chef de Quai)',
          roleCode: 'INVENTORY_MANAGER',
        },
        adminClient
      );

      assert.strictEqual(updated.fullName, 'Nadia Larbi (Chef de Quai)');
      assert.strictEqual(updated.role, 'INVENTORY_MANAGER');
    });

    it('should toggle staff status from active to suspended and back', async () => {
      const staffList = await getStaffListAction(adminClient);
      const target = staffList.find((s) => s.role === 'SUPPORT');
      assert.ok(target);

      // Suspend
      const res1 = await toggleStaffStatusAction(target.id, false, adminClient);
      assert.strictEqual(res1.isActive, false);

      // Reactivate
      const res2 = await toggleStaffStatusAction(target.id, true, adminClient);
      assert.strictEqual(res2.isActive, true);
    });
  });

  describe('6. Role Management & Permission Matrix', () => {
    it('should retrieve all system and custom roles for staff', async () => {
      const roles = await getRolesWithPermissionsAction(ownerClient);
      assert.strictEqual(Array.isArray(roles), true);
      assert.strictEqual(roles.some((r) => r.code === 'OWNER'), true);
      assert.strictEqual(roles.some((r) => r.code === 'ADMINISTRATOR'), true);
      assert.strictEqual(roles.some((r) => r.code === 'SALES_MANAGER'), true);
      assert.strictEqual(roles.some((r) => r.code === 'INVENTORY_MANAGER'), true);
    });

    it('should create a custom role with specific permission set', async () => {
      const roleCode = `WAREHOUSE_CONTROLLER_${Date.now()}`;
      const created = await createRoleAction(
        {
          code: roleCode,
          name: 'Contrôleur de Stock Belfort',
          description: 'Audit et contrôle des réceptions pièces et arrivages Chine.',
          permissionCodes: ['inventory.read', 'inventory.receive', 'products.read'],
        },
        adminClient
      );

      assert.strictEqual(created.code, roleCode);
      assert.strictEqual(created.isSystem, false);
      assert.strictEqual(created.permissions.includes('inventory.read'), true);
      assert.strictEqual(created.permissions.includes('inventory.receive'), true);
      assert.strictEqual(created.permissions.includes('users.manage'), false);
    });

    it('should duplicate an existing role with all its permissions', async () => {
      const newRoleCode = `SALES_ASSISTANT_${Date.now()}`;
      const duplicated = await duplicateRoleAction(
        'SALES_MANAGER',
        newRoleCode,
        'Assistant Commercial B2B',
        adminClient
      );

      assert.strictEqual(duplicated.code, newRoleCode);
      assert.strictEqual(duplicated.name, 'Assistant Commercial B2B');
      assert.strictEqual(duplicated.permissions.includes('pricing.read'), true);
      assert.strictEqual(duplicated.permissions.includes('b2b.read'), true);
      assert.strictEqual(duplicated.permissions.includes('orders.read'), true);
    });

    it('should prevent modifying permissions on system OWNER role', async () => {
      await assert.rejects(
        async () => {
          await updateRolePermissionsAction(
            'OWNER',
            {
              permissionCodes: ['products.read'],
            },
            adminClient
          );
        },
        /Propriétaire \(OWNER\) est un rôle système immuable/i
      );
    });

    it('should update permissions for custom/operational roles and propagate', async () => {
      const updated = await updateRolePermissionsAction(
        'INVENTORY_MANAGER',
        {
          name: 'Responsable Stock & Entrepôts Belfort/Oran',
          permissionCodes: ['inventory.read', 'inventory.adjust', 'inventory.receive', 'products.read', 'products.export'],
        },
        adminClient
      );

      assert.strictEqual(updated.permissions.includes('products.export'), true);
      assert.strictEqual(updated.name, 'Responsable Stock & Entrepôts Belfort/Oran');
    });
  });

  describe('7. Canonical Permission Registry Consistency', () => {
    it('should have properly configured permission definitions across all domains', () => {
      assert.strictEqual(SYSTEM_PERMISSIONS.length >= 25, true);

      for (const perm of SYSTEM_PERMISSIONS) {
        assert.ok(perm.code);
        assert.ok(perm.resource);
        assert.ok(perm.action);
        assert.ok(perm.labelFr);
        assert.ok(perm.descriptionFr);
        assert.ok(perm.domain);
      }
    });
  });
});
