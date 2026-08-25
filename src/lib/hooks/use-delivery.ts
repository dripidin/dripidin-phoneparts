// TanStack Query Hooks for Logistics, Shipments, EcoTrack Status & Rate Matrix

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getShipmentsListAction,
  createShipmentAction,
  syncShipmentStatusAction,
  cancelShipmentAction,
  testDeliveryProviderAction,
  getDeliveryRatesAction,
} from '@/lib/actions/delivery.actions';
import type { ShipmentsFilterInput } from '@/lib/validation/delivery.schema';

export const DELIVERY_QUERY_KEYS = {
  shipments: (filters?: Partial<ShipmentsFilterInput>) => ['shipments', filters] as const,
  rates: ['delivery_rates'] as const,
  providerStatus: (code: string) => ['provider_status', code] as const,
};

/**
 * Query shipments list with pagination and multi-criteria filters
 */
export function useShipmentsList(filters: Partial<ShipmentsFilterInput> = {}) {
  return useQuery({
    queryKey: DELIVERY_QUERY_KEYS.shipments(filters),
    queryFn: () => getShipmentsListAction(filters),
  });
}

/**
 * Query 58-Wilaya authoritative rate matrix
 */
export function useDeliveryRates() {
  return useQuery({
    queryKey: DELIVERY_QUERY_KEYS.rates,
    queryFn: () => getDeliveryRatesAction(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Mutation to create a shipment with EcoTrack
 */
export function useCreateShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, providerCode = 'ECOTRACK' }: { orderId: string; providerCode?: string }) =>
      createShipmentAction(orderId, providerCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
    },
  });
}

/**
 * Mutation to sync status directly from courier API
 */
export function useSyncShipmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (trackingNumber: string) => syncShipmentStatusAction(trackingNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
    },
  });
}

/**
 * Mutation to cancel shipment
 */
export function useCancelShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      cancelShipmentAction(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

/**
 * Mutation to test connection with courier API
 */
export function useTestProviderConnection() {
  return useMutation({
    mutationFn: (providerCode: string = 'ECOTRACK') => testDeliveryProviderAction(providerCode),
  });
}
