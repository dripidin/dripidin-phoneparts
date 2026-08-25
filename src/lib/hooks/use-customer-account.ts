'use client';

// HamzaPhone Customer Account & Authentication TanStack Query Hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/auth/client';
import { CustomerAccountService } from '@/lib/services/customer-account.service';
import {
  updateCustomerProfileAction,
  saveCustomerAddressAction,
  deleteCustomerAddressAction,
  setDefaultCustomerAddressAction,
} from '@/lib/actions/customer-account.actions';
import { updatePasswordAction, logoutAction } from '@/lib/actions/auth.actions';
import type { ProfileUpdateInput, AddressInput, ChangePasswordInput } from '@/lib/validation/account.schema';

/**
 * Hook to retrieve authenticated customer context (Profile + B2B Status + Tier)
 */
export function useCustomerContext() {
  return useQuery({
    queryKey: ['customer', 'context'],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const service = new CustomerAccountService(supabase);
      return service.getCustomerContext(user.id);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to retrieve user's saved addresses
 */
export function useCustomerAddresses() {
  return useQuery({
    queryKey: ['customer', 'addresses'],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const service = new CustomerAccountService(supabase);
      return service.getAddresses(user.id);
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to retrieve user's past and active orders
 */
export function useCustomerOrders() {
  return useQuery({
    queryKey: ['customer', 'orders'],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const service = new CustomerAccountService(supabase);
      return service.getOrders(user.id);
    },
    staleTime: 1000 * 60 * 3,
  });
}

/**
 * Hook to retrieve single order details
 */
export function useCustomerOrderDetail(orderId: string) {
  return useQuery({
    queryKey: ['customer', 'orders', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const service = new CustomerAccountService(supabase);
      return service.getOrderById(user.id, orderId);
    },
    enabled: Boolean(orderId),
  });
}

/**
 * Hook to retrieve B2B Wholesale Pricing List (strictly for APPROVED B2B users)
 */
export function useB2BWholesalePricing() {
  return useQuery({
    queryKey: ['customer', 'b2b-pricing'],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const service = new CustomerAccountService(supabase);
      return service.getB2BPricingList(user.id);
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Mutations for profile, address, and password
 */
export function useCustomerMutations() {
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: async (input: ProfileUpdateInput) => {
      const res = await updateCustomerProfileAction(input);
      if (!res.success) throw new Error(res.error);
      return res.profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'context'] });
    },
  });

  const saveAddressMutation = useMutation({
    mutationFn: async ({ input, addressId }: { input: AddressInput; addressId?: string }) => {
      const res = await saveCustomerAddressAction(input, addressId);
      if (!res.success) throw new Error(res.error);
      return res.address;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'addresses'] });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const res = await deleteCustomerAddressAction(addressId);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'addresses'] });
    },
  });

  const setDefaultAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const res = await setDefaultCustomerAddressAction(addressId);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'addresses'] });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (input: ChangePasswordInput) => {
      const res = await updatePasswordAction(input);
      if (!res.success) throw new Error(res.error);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await logoutAction();
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/login';
    },
  });

  return {
    updateProfile: updateProfileMutation,
    saveAddress: saveAddressMutation,
    deleteAddress: deleteAddressMutation,
    setDefaultAddress: setDefaultAddressMutation,
    changePassword: changePasswordMutation,
    logout: logoutMutation,
  };
}
