// TanStack Query Hooks for Staff Directory, Role Management & Permissions

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import type {
  CreateStaffInput,
  UpdateStaffInput,
  CreateRoleInput,
  UpdateRoleInput,
} from '@/types/staff-rbac.types';

export const STAFF_ROLE_QUERY_KEYS = {
  staffList: ['staff_list'] as const,
  staffDetail: (id: string) => ['staff_detail', id] as const,
  rolesList: ['roles_with_permissions'] as const,
};

/**
 * Query Staff Members List
 */
export function useStaffList() {
  return useQuery({
    queryKey: STAFF_ROLE_QUERY_KEYS.staffList,
    queryFn: () => getStaffListAction(),
  });
}

/**
 * Query Detailed Staff User Profile with Activity
 */
export function useStaffDetails(staffId: string | null) {
  return useQuery({
    queryKey: STAFF_ROLE_QUERY_KEYS.staffDetail(staffId || ''),
    queryFn: () => getStaffDetailsAction(staffId!),
    enabled: Boolean(staffId),
  });
}

/**
 * Query All Roles with Permissions
 */
export function useRolesWithPermissions() {
  return useQuery({
    queryKey: STAFF_ROLE_QUERY_KEYS.rolesList,
    queryFn: () => getRolesWithPermissionsAction(),
  });
}

/**
 * Mutation: Create Staff Member
 */
export function useCreateStaffUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateStaffInput) => createStaffUserAction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_ROLE_QUERY_KEYS.staffList });
      queryClient.invalidateQueries({ queryKey: STAFF_ROLE_QUERY_KEYS.rolesList });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}

/**
 * Mutation: Update Staff User / Role
 */
export function useUpdateStaffUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ staffId, input }: { staffId: string; input: UpdateStaffInput }) =>
      updateStaffUserAction(staffId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: STAFF_ROLE_QUERY_KEYS.staffList });
      queryClient.invalidateQueries({ queryKey: STAFF_ROLE_QUERY_KEYS.staffDetail(variables.staffId) });
      queryClient.invalidateQueries({ queryKey: STAFF_ROLE_QUERY_KEYS.rolesList });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}

/**
 * Mutation: Toggle Staff Status (Suspend / Reactivate)
 */
export function useToggleStaffStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ staffId, isActive }: { staffId: string; isActive: boolean }) =>
      toggleStaffStatusAction(staffId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_ROLE_QUERY_KEYS.staffList });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}

/**
 * Mutation: Create Custom Role
 */
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRoleInput) => createRoleAction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_ROLE_QUERY_KEYS.rolesList });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}

/**
 * Mutation: Update Role Permissions
 */
export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, input }: { roleId: string; input: UpdateRoleInput }) =>
      updateRolePermissionsAction(roleId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_ROLE_QUERY_KEYS.rolesList });
      queryClient.invalidateQueries({ queryKey: STAFF_ROLE_QUERY_KEYS.staffList });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}

/**
 * Mutation: Duplicate Role
 */
export function useDuplicateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sourceRoleId, newRoleCode, newRoleName }: { sourceRoleId: string; newRoleCode: string; newRoleName: string }) =>
      duplicateRoleAction(sourceRoleId, newRoleCode, newRoleName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_ROLE_QUERY_KEYS.rolesList });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}
