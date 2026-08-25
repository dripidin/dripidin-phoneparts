'use server';

// HamzaPhone Checkout Server Actions
// Server-Authoritative Cart Validation, Order Submission & Guest Order Tracking

import { createServerClient } from '@/lib/auth/server';
import { CheckoutService } from '@/lib/services/checkout.service';
import { CheckoutOrderSchema, type CheckoutOrderInput } from '@/lib/validation/order.schema';
import { revalidatePath } from 'next/cache';

/**
 * Validate cart items against live database prices, stock, and B2B wholesale status
 */
export async function validateCartAction(
  items: Array<{ productId: string; quantity: number }>,
  wilayaCode: number = 16
) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const checkoutService = new CheckoutService(supabase);
    const summary = await checkoutService.validateCart(items, user?.id || null, wilayaCode);

    return {
      success: true,
      summary,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la validation du panier',
    };
  }
}

/**
 * Submit Checkout Order with atomic stock reservation and snapshotting
 */
export async function submitCheckoutOrderAction(
  rawInput: CheckoutOrderInput,
  idempotencyKey?: string
) {
  try {
    // 1. Validate form schema
    const parsedInput = CheckoutOrderSchema.parse(rawInput);

    // 2. Resolve server session
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const checkoutService = new CheckoutService(supabase);
    const result = await checkoutService.processOrderCheckout(
      parsedInput,
      user?.id || null,
      idempotencyKey || null
    );

    // Revalidate customer order history cache and admin views
    revalidatePath('/account/orders');
    revalidatePath('/admin');

    return {
      success: true,
      order: result.order,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Impossible de finaliser votre commande. Veuillez réessayer.',
    };
  }
}

/**
 * Public & Guest Dual-Token Order Lookup
 */
export async function lookupGuestOrderAction(
  orderNumber: string,
  trackingToken: string
) {
  try {
    const supabase = await createServerClient();
    const checkoutService = new CheckoutService(supabase);
    const order = await checkoutService.lookupGuestOrder(orderNumber, trackingToken);

    return {
      success: true,
      order,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Commande introuvable ou clé de suivi incorrecte.',
    };
  }
}
