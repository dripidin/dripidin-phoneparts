'use server';

// HamzaPhone Staff Management & Role/Permission Server Actions
// Enforces Server-Side RBAC, Last Owner Protection, Self-Protection and Immutable Audit Logging

import { createServerClient } from '@/lib/auth/server';
import { requirePermission, requireStaff, AuthorizationError } from '@/lib/permissions/guards';
import type {
  StaffUserSummary,
  StaffUserDetail,
  RoleDetail,
  CreateStaffInput,
  UpdateStaffInput,
  CreateRoleInput,
  UpdateRoleInput,
} from '@/types/staff-rbac.types';
import type { AppRoleCode } from '@/types/rbac.types';
import { SYSTEM_PERMISSIONS } from '@/lib/permissions/permission-registry';

// In-Memory Staging for Mock / Local Dev Synchronous Fallback
let mockStaffDatabase: StaffUserDetail[] = [
  {
    id: 'user-owner-01',
    email: 'admin@hamzaphone.dz',
    fullName: 'Hamza Benali (Propriétaire)',
    phone: '+213 550 12 34 56',
    role: 'OWNER',
    roleName: 'Propriétaire Fondateur',
    isActive: true,
    lastLoginAt: '2026-08-24T08:30:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    permissionsCount: SYSTEM_PERMISSIONS.length,
    permissions: SYSTEM_PERMISSIONS.map((p) => p.code),
    recentActivity: [
      {
        id: 'act-01',
        action: 'UPDATE_PRICING',
        entityType: 'PRICING',
        entityId: 'HP-SCR-SAM-S21',
        timestamp: '2026-08-24T08:15:00Z',
        details: 'Ajustement prix public Écran S21',
      },
      {
        id: 'act-02',
        action: 'IMPORT_APPLIED',
        entityType: 'IMPORT_JOB',
        entityId: 'job-1787550',
        timestamp: '2026-08-23T14:20:00Z',
        details: 'Import catalogue 1420 références',
      },
    ],
  },
  {
    id: 'user-admin-01',
    email: 'yassine.admin@hamzaphone.dz',
    fullName: 'Yassine Mansouri',
    phone: '+213 661 98 76 54',
    role: 'ADMINISTRATOR',
    roleName: 'Administrateur Opérations',
    isActive: true,
    lastLoginAt: '2026-08-24T07:45:00Z',
    createdAt: '2026-02-15T09:00:00Z',
    permissionsCount: SYSTEM_PERMISSIONS.length - 1,
    permissions: SYSTEM_PERMISSIONS.filter((p) => p.code !== 'all').map((p) => p.code),
    recentActivity: [
      {
        id: 'act-03',
        action: 'UPDATE_ORDER',
        entityType: 'ORDER',
        entityId: 'HP-2026-0801',
        timestamp: '2026-08-24T08:00:00Z',
        details: 'Validation expédition EcoTrack',
      },
    ],
  },
  {
    id: 'user-sales-01',
    email: 'karim.commercial@hamzaphone.dz',
    fullName: 'Karim Brahimi',
    phone: '+213 770 45 67 89',
    role: 'SALES_MANAGER',
    roleName: 'Responsable Commercial B2B',
    isActive: true,
    lastLoginAt: '2026-08-23T16:10:00Z',
    createdAt: '2026-03-01T10:30:00Z',
    permissionsCount: 14,
    permissions: [
      'products.read', 'products.export',
      'pricing.read', 'pricing.update', 'pricing.bulk_percentage', 'pricing.b2b_tiers', 'pricing.customer_override',
      'orders.read', 'orders.create',
      'customers.read', 'customers.update', 'b2b.read', 'b2b.approve', 'b2b.manage_pricing',
      'inventory.read',
    ],
    recentActivity: [
      {
        id: 'act-04',
        action: 'APPROVE_B2B',
        entityType: 'BUSINESS',
        entityId: 'biz-01',
        timestamp: '2026-08-23T15:30:00Z',
        details: 'Approbation compte grossiste Atelier Oran',
      },
    ],
  },
  {
    id: 'user-warehouse-01',
    email: 'mustapha.stock@hamzaphone.dz',
    fullName: 'Mustapha Ziane',
    phone: '+213 555 11 22 33',
    role: 'INVENTORY_MANAGER',
    roleName: 'Responsable Entrepôt Belfort',
    isActive: true,
    lastLoginAt: '2026-08-24T06:00:00Z',
    createdAt: '2026-03-15T08:00:00Z',
    permissionsCount: 6,
    permissions: [
      'products.read', 'products.export', 'products.import',
      'inventory.read', 'inventory.adjust', 'inventory.receive',
    ],
    recentActivity: [
      {
        id: 'act-05',
        action: 'RECEIVE_INVENTORY',
        entityType: 'INVENTORY',
        entityId: 'rec-102',
        timestamp: '2026-08-24T07:10:00Z',
        details: 'Réception arrivage Shenzhen 500 pcs',
      },
    ],
  },
  {
    id: 'user-order-01',
    email: 'nadia.commandes@hamzaphone.dz',
    fullName: 'Nadia Larbi',
    phone: '+213 660 33 44 55',
    role: 'ORDER_MANAGER',
    roleName: 'Responsable Expéditions & Colis',
    isActive: true,
    lastLoginAt: '2026-08-24T08:10:00Z',
    createdAt: '2026-04-01T11:00:00Z',
    permissionsCount: 8,
    permissions: [
      'orders.read', 'orders.create', 'orders.update', 'orders.cancel',
      'delivery.dispatch', 'products.read', 'inventory.read', 'customers.read',
    ],
    recentActivity: [],
  },
  {
    id: 'user-support-01',
    email: 'samia.support@hamzaphone.dz',
    fullName: 'Samia Khelifi',
    phone: '+213 777 99 88 77',
    role: 'SUPPORT',
    roleName: 'Support Clientèle & SAV',
    isActive: false, // Suspended for testing
    lastLoginAt: '2026-08-10T14:00:00Z',
    createdAt: '2026-05-01T10:00:00Z',
    permissionsCount: 3,
    permissions: ['products.read', 'orders.read', 'customers.read'],
    recentActivity: [],
  },
];

let mockRolesDatabase: RoleDetail[] = [
  {
    id: 'role-01',
    code: 'OWNER',
    name: 'Propriétaire Fondateur',
    description: 'Accès superadministrateur absolu sans aucune restriction de sécurité.',
    isSystem: true,
    permissions: ['all'],
    userCount: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'role-02',
    code: 'ADMINISTRATOR',
    name: 'Administrateur Général',
    description: 'Gestion intégrale des opérations, catalogue, prix, commandes et personnel.',
    isSystem: true,
    permissions: SYSTEM_PERMISSIONS.filter((p) => p.code !== 'all').map((p) => p.code),
    userCount: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'role-03',
    code: 'SALES_MANAGER',
    name: 'Responsable Commercial / B2B',
    description: 'Gestion des clients grossistes B2B, remises, plafonds de crédit et validation.',
    isSystem: true,
    permissions: [
      'products.read', 'products.export',
      'pricing.read', 'pricing.update', 'pricing.bulk_percentage', 'pricing.b2b_tiers', 'pricing.customer_override',
      'orders.read', 'orders.create',
      'customers.read', 'customers.update', 'b2b.read', 'b2b.approve', 'b2b.manage_pricing',
      'inventory.read',
    ],
    userCount: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'role-04',
    code: 'ORDER_MANAGER',
    name: 'Responsable Commandes & Colis',
    description: 'Traitement des flux de commandes et étiquetage transporteur EcoTrack.',
    isSystem: true,
    permissions: [
      'orders.read', 'orders.create', 'orders.update', 'orders.cancel',
      'delivery.dispatch', 'products.read', 'inventory.read', 'customers.read',
    ],
    userCount: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'role-05',
    code: 'INVENTORY_MANAGER',
    name: 'Responsable Entrepôt & Stock',
    description: 'Mouvements d’inventaire, réceptions fournisseurs et comptabilité de stock.',
    isSystem: true,
    permissions: [
      'products.read', 'products.export', 'products.import',
      'inventory.read', 'inventory.adjust', 'inventory.receive',
    ],
    userCount: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'role-06',
    code: 'CONTENT_MANAGER',
    name: 'Responsable Contenu & Catalogue',
    description: 'Fiches techniques pièces détachées, photos et arborescence de compatibilité.',
    isSystem: true,
    permissions: [
      'products.read', 'products.create', 'products.update', 'products.import', 'products.export', 'products.bulk_update',
      'categories.manage', 'brands.manage',
    ],
    userCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'role-07',
    code: 'SUPPORT',
    name: 'Support Clientèle & SAV',
    description: 'Consultation des commandes et suivi des colis pour assistance client.',
    isSystem: true,
    permissions: ['products.read', 'orders.read', 'customers.read'],
    userCount: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'role-08',
    code: 'VIEWER',
    name: 'Auditeur / Lecteur Seul',
    description: 'Consultation globale en lecture seule pour audit comptable et financier.',
    isSystem: true,
    permissions: [
      'products.read', 'products.export', 'pricing.read', 'inventory.read', 'orders.read', 'customers.read', 'audit.read',
    ],
    userCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

/**
 * 1. Fetch Staff Directory List
 */
export async function getStaffListAction(customClient?: any): Promise<StaffUserSummary[]> {
  const supabase = customClient || await createServerClient();
  await requireStaff(supabase);

  // Return clean list without exposing auth secrets
  return mockStaffDatabase.map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    phone: u.phone,
    role: u.role,
    roleName: u.roleName,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    permissionsCount: u.permissionsCount,
  }));
}

/**
 * 2. Fetch Detailed Staff User Profile with Audit Activity & Effective Permissions
 */
export async function getStaffDetailsAction(staffId: string, customClient?: any): Promise<StaffUserDetail> {
  const supabase = customClient || await createServerClient();
  await requirePermission(supabase, 'users.manage');

  const staff = mockStaffDatabase.find((u) => u.id === staffId);
  if (!staff) {
    throw new Error(`Utilisateur staff introuvable (ID: ${staffId})`);
  }

  return staff;
}

/**
 * 3. Create a New Staff Member
 */
export async function createStaffUserAction(input: CreateStaffInput, customClient?: any): Promise<StaffUserDetail> {
  const supabase = customClient || await createServerClient();
  const authContext = await requirePermission(supabase, 'users.manage');

  // Privilege Escalation Prevention: Non-owners cannot create OWNER accounts
  if (input.roleCode === 'OWNER' && authContext.role !== 'OWNER') {
    throw new AuthorizationError('Seul un Propriétaire (OWNER) peut désigner un autre compte OWNER.', 'FORBIDDEN');
  }

  // Validate unique email
  if (mockStaffDatabase.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
    throw new Error(`Un compte avec l'adresse e-mail "${input.email}" existe déjà.`);
  }

  const role = mockRolesDatabase.find((r) => r.code === input.roleCode);
  if (!role) {
    throw new Error(`Rôle invalide ou inexistant: "${input.roleCode}"`);
  }

  const newStaffId = `user-staff-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const now = new Date().toISOString();

  const newStaff: StaffUserDetail = {
    id: newStaffId,
    email: input.email.toLowerCase().trim(),
    fullName: input.fullName.trim(),
    phone: input.phone || null,
    role: role.code,
    roleName: role.name,
    isActive: input.isActive ?? true,
    lastLoginAt: null,
    createdAt: now,
    permissionsCount: role.permissions.length,
    permissions: role.permissions,
    recentActivity: [],
  };

  mockStaffDatabase.push(newStaff);
  role.userCount++;

  // Record Audit Log
  const fromTable = supabase.from ? supabase.from('audit_logs') : null;
  if (fromTable && typeof fromTable.insert === 'function') {
    await fromTable.insert({
      actor_email: authContext.email,
      actor_role: authContext.role,
      action: 'STAFF_CREATED',
      entity_type: 'STAFF_USER',
      entity_id: newStaffId,
      new_values: {
        email: newStaff.email,
        fullName: newStaff.fullName,
        role: newStaff.role,
      },
    });
  }

  return newStaff;
}

/**
 * 4. Update Staff User & Role (With Last Owner & Self Protection)
 */
export async function updateStaffUserAction(staffId: string, input: UpdateStaffInput, customClient?: any): Promise<StaffUserDetail> {
  const supabase = customClient || await createServerClient();
  const authContext = await requirePermission(supabase, 'users.manage');

  const staff = mockStaffDatabase.find((u) => u.id === staffId);
  if (!staff) {
    throw new Error(`Utilisateur staff introuvable (ID: ${staffId})`);
  }

  // Safeguard 1: Last Owner Protection
  const activeOwners = mockStaffDatabase.filter((u) => u.role === 'OWNER' && u.isActive);
  const isTargetLastOwner = staff.role === 'OWNER' && activeOwners.length <= 1;

  if (isTargetLastOwner) {
    if (input.isActive === false) {
      throw new Error('Action refusée : Impossible de désactiver ou suspendre le dernier compte Propriétaire (OWNER) actif.');
    }
    if (input.roleCode && input.roleCode !== 'OWNER') {
      throw new Error('Action refusée : Impossible de rétrograder le dernier compte Propriétaire (OWNER) du système.');
    }
  }

  // Safeguard 2: Privilege Escalation Prevention
  if (input.roleCode === 'OWNER' && staff.role !== 'OWNER' && authContext.role !== 'OWNER') {
    throw new AuthorizationError('Seul un Propriétaire (OWNER) peut accorder le rôle OWNER.', 'FORBIDDEN');
  }

  // Safeguard 3: Self-Lockout Warning/Block
  if (staff.email === authContext.email && input.isActive === false) {
    throw new Error('Action refusée : Vous ne pouvez pas désactiver votre propre compte administrateur actif.');
  }

  // Apply Updates
  if (input.fullName) staff.fullName = input.fullName.trim();
  if (input.phone !== undefined) staff.phone = input.phone;
  if (input.isActive !== undefined) staff.isActive = input.isActive;

  if (input.roleCode && input.roleCode !== staff.role) {
    const newRole = mockRolesDatabase.find((r) => r.code === input.roleCode);
    if (!newRole) throw new Error(`Rôle invalide: ${input.roleCode}`);

    // Update member counts
    const oldRole = mockRolesDatabase.find((r) => r.code === staff.role);
    if (oldRole) oldRole.userCount = Math.max(0, oldRole.userCount - 1);
    newRole.userCount++;

    staff.role = newRole.code;
    staff.roleName = newRole.name;
    staff.permissions = newRole.permissions;
    staff.permissionsCount = newRole.permissions.length;
  }

  // Record Audit Log
  const fromTable = supabase.from ? supabase.from('audit_logs') : null;
  if (fromTable && typeof fromTable.insert === 'function') {
    await fromTable.insert({
      actor_email: authContext.email,
      actor_role: authContext.role,
      action: 'STAFF_UPDATED',
      entity_type: 'STAFF_USER',
      entity_id: staffId,
      new_values: {
        fullName: staff.fullName,
        role: staff.role,
        isActive: staff.isActive,
      },
    });
  }

  return staff;
}

/**
 * 5. Toggle Staff Account Status (Suspend / Reactivate)
 */
export async function toggleStaffStatusAction(staffId: string, isActive: boolean, customClient?: any): Promise<{ success: boolean; isActive: boolean }> {
  const supabase = customClient || await createServerClient();
  const authContext = await requirePermission(supabase, 'users.manage');

  const staff = mockStaffDatabase.find((u) => u.id === staffId);
  if (!staff) {
    throw new Error(`Utilisateur staff introuvable (ID: ${staffId})`);
  }

  // Last Owner Protection
  if (!isActive && staff.role === 'OWNER') {
    const activeOwners = mockStaffDatabase.filter((u) => u.role === 'OWNER' && u.isActive);
    if (activeOwners.length <= 1) {
      throw new Error('Action refusée : Impossible de suspendre le dernier compte Propriétaire (OWNER) actif.');
    }
  }

  // Self-Lockout Protection
  if (!isActive && staff.email === authContext.email) {
    throw new Error('Action refusée : Vous ne pouvez pas suspendre votre propre compte connecté.');
  }

  staff.isActive = isActive;

  const fromTable = supabase.from ? supabase.from('audit_logs') : null;
  if (fromTable && typeof fromTable.insert === 'function') {
    await fromTable.insert({
      actor_email: authContext.email,
      actor_role: authContext.role,
      action: isActive ? 'STAFF_ACTIVATED' : 'STAFF_SUSPENDED',
      entity_type: 'STAFF_USER',
      entity_id: staffId,
      new_values: { isActive, targetEmail: staff.email },
    });
  }

  return { success: true, isActive };
}

/**
 * 6. Get All System & Custom Roles with Assigned Permissions
 */
export async function getRolesWithPermissionsAction(customClient?: any): Promise<RoleDetail[]> {
  const supabase = customClient || await createServerClient();
  await requireStaff(supabase);

  return mockRolesDatabase;
}

/**
 * 7. Create a Custom Role
 */
export async function createRoleAction(input: CreateRoleInput, customClient?: any): Promise<RoleDetail> {
  const supabase = customClient || await createServerClient();
  const authContext = await requirePermission(supabase, 'settings.manage');

  const normalizedCode = input.code.toUpperCase().replace(/[^A-Z0-9_]/g, '_');

  if (mockRolesDatabase.some((r) => r.code === normalizedCode)) {
    throw new Error(`Un rôle avec le code "${normalizedCode}" existe déjà.`);
  }

  const newRole: RoleDetail = {
    id: `role-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    code: normalizedCode,
    name: input.name.trim(),
    description: input.description || 'Rôle opérationnel sur mesure',
    isSystem: false,
    permissions: input.permissionCodes,
    userCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockRolesDatabase.push(newRole);

  const fromTable = supabase.from ? supabase.from('audit_logs') : null;
  if (fromTable && typeof fromTable.insert === 'function') {
    await fromTable.insert({
      actor_email: authContext.email,
      actor_role: authContext.role,
      action: 'ROLE_CREATED',
      entity_type: 'ROLE',
      entity_id: newRole.id,
      new_values: newRole,
    });
  }

  return newRole;
}

/**
 * 8. Update Role Permissions & Metadata
 */
export async function updateRolePermissionsAction(roleId: string, input: UpdateRoleInput, customClient?: any): Promise<RoleDetail> {
  const supabase = customClient || await createServerClient();
  const authContext = await requirePermission(supabase, 'settings.manage');

  const role = mockRolesDatabase.find((r) => r.id === roleId || r.code === roleId);
  if (!role) {
    throw new Error(`Rôle introuvable (ID: ${roleId})`);
  }

  // Protect system OWNER role from being stripped of 'all'
  if (role.code === 'OWNER') {
    throw new Error('Le rôle Propriétaire (OWNER) est un rôle système immuable doté du privilège superadmin total.');
  }

  if (input.name) role.name = input.name.trim();
  if (input.description !== undefined) role.description = input.description;
  role.permissions = input.permissionCodes;
  role.updatedAt = new Date().toISOString();

  // Sync permissions to any staff user with this role
  for (const staff of mockStaffDatabase) {
    if (staff.role === role.code) {
      staff.permissions = role.permissions;
      staff.permissionsCount = role.permissions.length;
    }
  }

  const fromTable = supabase.from ? supabase.from('audit_logs') : null;
  if (fromTable && typeof fromTable.insert === 'function') {
    await fromTable.insert({
      actor_email: authContext.email,
      actor_role: authContext.role,
      action: 'ROLE_PERMISSIONS_UPDATED',
      entity_type: 'ROLE',
      entity_id: role.id,
      new_values: {
        roleCode: role.code,
        permissionCount: role.permissions.length,
        permissions: role.permissions,
      },
    });
  }

  return role;
}

/**
 * 9. Duplicate Existing Role into a New Custom Role
 */
export async function duplicateRoleAction(
  sourceRoleId: string,
  newRoleCode: string,
  newRoleName: string,
  customClient?: any
): Promise<RoleDetail> {
  const supabase = customClient || await createServerClient();
  await requirePermission(supabase, 'settings.manage');

  const source = mockRolesDatabase.find((r) => r.id === sourceRoleId || r.code === sourceRoleId);
  if (!source) {
    throw new Error(`Rôle source introuvable: ${sourceRoleId}`);
  }

  return createRoleAction(
    {
      code: newRoleCode,
      name: newRoleName,
      description: `Dupliqué depuis ${source.name}`,
      permissionCodes: [...source.permissions],
    },
    supabase
  );
}
