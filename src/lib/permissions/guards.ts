// Server Action & API Route Permission Guards for HamzaPhone

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import type { AppRoleCode, UserAuthContext } from '@/types/rbac.types';
import { PermissionsService } from './permissions-service';

export class AuthorizationError extends Error {
  constructor(message: string, public code: 'UNAUTHENTICATED' | 'FORBIDDEN' = 'FORBIDDEN') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Ensures the request is from an authenticated user and returns their auth context
 */
export async function requireAuth(supabase: SupabaseClient<any, any, any>): Promise<UserAuthContext> {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthorizationError('Authentication required to access this resource', 'UNAUTHENTICATED');
  }

  const permissionsService = new PermissionsService(supabase);
  const context = await permissionsService.resolveUserAuthContext(user.id);

  if (!context || !context.isActive) {
    throw new AuthorizationError('User account is inactive or disabled', 'FORBIDDEN');
  }

  return context;
}

/**
 * Ensures the authenticated user holds a specific granular permission
 */
export async function requirePermission(
  supabase: SupabaseClient<any, any, any>,
  permissionCode: string
): Promise<UserAuthContext> {
  const context = await requireAuth(supabase);

  if (context.permissions.has('all')) {
    return context;
  }

  if (!context.permissions.has(permissionCode)) {
    throw new AuthorizationError(
      `Access denied: Missing required permission [${permissionCode}]`,
      'FORBIDDEN'
    );
  }

  return context;
}

/**
 * Ensures the user has one of the allowed roles
 */
export async function requireRole(
  supabase: SupabaseClient<any, any, any>,
  allowedRoles: AppRoleCode[]
): Promise<UserAuthContext> {
  const context = await requireAuth(supabase);

  if (!allowedRoles.includes(context.role)) {
    throw new AuthorizationError(
      `Access denied: Role [${context.role}] is not authorized for this operation`,
      'FORBIDDEN'
    );
  }

  return context;
}

/**
 * Ensures the user is an active staff/admin member
 */
export async function requireStaff(supabase: SupabaseClient<any, any, any>): Promise<UserAuthContext> {
  const context = await requireAuth(supabase);

  if (context.userType !== 'STAFF' && context.role !== 'OWNER' && context.role !== 'ADMINISTRATOR') {
    throw new AuthorizationError('Access denied: Staff clearance required', 'FORBIDDEN');
  }

  return context;
}

/**
 * Ensures the user belongs to an approved B2B business
 */
export async function requireBusinessMember(supabase: SupabaseClient<any, any, any>): Promise<UserAuthContext> {
  const context = await requireAuth(supabase);

  if (!context.businessId) {
    throw new AuthorizationError('Access denied: Active B2B business profile required', 'FORBIDDEN');
  }

  return context;
}
