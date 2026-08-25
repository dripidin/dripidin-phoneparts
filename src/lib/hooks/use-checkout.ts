'use client';

// HamzaPhone Checkout & Cart Validation React Query Hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  validateCartAction,
  submitCheckoutOrderAction,
  lookupGuestOrderAction,
} from '@/lib/actions/checkout.actions';
import type { CheckoutOrderInput } from '@/lib/validation/order.schema';
import type { ValidatedCartSummary } from '@/lib/services/checkout.service';

/**
 * Hook to validate cart items against live database prices, stock, and B2B wholesale status
 */
export function useCartValidation(
  items: Array<{ productId: string; quantity: number }>,
  wilayaCode: number = 16,
  enabled: boolean = true
) {
  return useQuery<ValidatedCartSummary>({
    queryKey: ['cart-validation', items, wilayaCode],
    queryFn: async () => {
      if (!items || items.length === 0) {
        return {
          items: [],
          itemCount: 0,
          subtotalDzd: 0,
          totalSavingsDzd: 0,
          shippingCostEstimateDzd: 0,
          totalEstimatedDzd: 0,
          hasWarnings: false,
          warnings: [],
          canProceedToCheckout: false,
          customerType: 'B2C',
          isApprovedB2B: false,
        };
      }

      const res = await validateCartAction(items, wilayaCode);
      if (!res.success || !res.summary) {
        throw new Error(res.error || 'Erreur lors de la validation du panier');
      }
      return res.summary;
    },
    enabled: enabled && items.length > 0,
    staleTime: 10 * 1000, // 10 seconds stale time
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to submit order with atomic stock reservation and optimistic UI
 */
export function useSubmitOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      input,
      idempotencyKey,
    }: {
      input: CheckoutOrderInput;
      idempotencyKey?: string;
    }) => {
      const res = await submitCheckoutOrderAction(input, idempotencyKey);
      if (!res.success || !res.order) {
        throw new Error(res.error || 'Échec de la validation de la commande.');
      }
      return res.order;
    },
    onSuccess: () => {
      // Invalidate relevant order caches
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
      queryClient.invalidateQueries({ queryKey: ['customer-context'] });
      queryClient.invalidateQueries({ queryKey: ['cart-validation'] });
    },
  });
}

/**
 * Hook for dual-token guest order tracking
 */
export function useGuestOrderLookup(
  orderNumber: string,
  trackingToken: string,
  enabled: boolean = false
) {
  return useQuery({
    queryKey: ['guest-order-lookup', orderNumber, trackingToken],
    queryFn: async () => {
      const res = await lookupGuestOrderAction(orderNumber, trackingToken);
      if (!res.success || !res.order) {
        throw new Error(res.error || 'Commande introuvable.');
      }
      return res.order;
    },
    enabled: enabled && !!orderNumber && !!trackingToken,
    staleTime: 30 * 1000,
  });
}
