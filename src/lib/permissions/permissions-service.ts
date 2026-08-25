// Permissions & Authorization Service for HamzaPhone

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, UserType } from '@/types/database.types';
import type { AppRoleCode, UserAuthContext } from '@/types/rbac.types';

interface ProfileRecord {
  id: string;
  email: string;
  user_type: UserType;
  is_active: boolean;
}

interface UserRoleWithPermissions {
  roles: {
    code: string;
    role_permissions: {
      permissions: {
        code: string;
      } | null;
    }[];
  } | null;
}

export class PermissionsService {
  constructor(private supabase: SupabaseClient<any, any, any>) {}

  /**
   * Resolve complete authorization context for a user
   */
  async resolveUserAuthContext(userId: string): Promise<UserAuthContext | null> {
    // 1. Fetch user profile
    const { data: profileData, error: profileError } = await this.supabase
      .from('profiles')
      .select('id, email, user_type, is_active')
      .eq('id', userId)
      .single();

    if (profileError || !profileData) return null;
    const profile = profileData as ProfileRecord;

    // 2. Fetch assigned roles and their permissions
    const { data: rolePermsData } = await this.supabase
      .from('user_roles')
      .select(`
        roles (
          code,
          role_permissions (
            permissions (code)
          )
        )
      `)
      .eq('user_id', userId);

    const userRoles = (rolePermsData || []) as unknown as UserRoleWithPermissions[];
    const primaryRole = (userRoles[0]?.roles?.code as AppRoleCode) || 'B2C_CUSTOMER';

    const permissions = new Set<string>();

    for (const ur of userRoles) {
      if (ur.roles?.role_permissions) {
        for (const rp of ur.roles.role_permissions) {
          if (rp.permissions?.code) {
            permissions.add(rp.permissions.code);
          }
        }
      }
    }

    // 3. Fetch business membership if B2B
    let businessId: string | null = null;
    if (profile.user_type === 'B2B') {
      const { data: membershipData } = await this.supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      const membership = membershipData as { business_id: string } | null;
      businessId = membership?.business_id || null;
    }

    return {
      userId: profile.id,
      email: profile.email,
      userType: profile.user_type,
      role: primaryRole,
      permissions,
      businessId,
      isActive: profile.is_active,
    };
  }

  /**
   * Check if a user possesses a specific permission
   */
  async hasPermission(userId: string, permissionCode: string): Promise<boolean> {
    const authContext = await this.resolveUserAuthContext(userId);
    if (!authContext || !authContext.isActive) return false;

    if (authContext.permissions.has('all')) return true;
    return authContext.permissions.has(permissionCode);
  }

  /**
   * Check if a user has any of the specified roles
   */
  async hasRole(userId: string, roles: AppRoleCode[]): Promise<boolean> {
    const authContext = await this.resolveUserAuthContext(userId);
    if (!authContext || !authContext.isActive) return false;

    return roles.includes(authContext.role);
  }
}
