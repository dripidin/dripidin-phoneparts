// HamzaPhone Checkout & Cart Validation Service
// Server-authoritative Pricing, Transactional Order Creation, Double-Entry Stock Reservation & Guest Tracking

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, OrderStatus, PaymentMethod, DeliveryType, UserType, ProductType } from '@/types/database.types';
import type { PriceResolutionContext } from '@/types/domain.types';
import { PricingService } from './pricing.service';
import { CustomerAccountService } from './customer-account.service';
import { DeliveryPricingService } from '@/lib/delivery/delivery-pricing.service';
import type { CheckoutOrderInput } from '@/lib/validation/order.schema';
import crypto from 'crypto';

export interface ValidatedCartItem {
  productId: string;
  sku: string;
  name: string;
  slug: string;
  mainImage: string;
  productType: ProductType;
  requestedQuantity: number;
  validQuantity: number;
  unitPriceDzd: number;
  originalPriceDzd: number;
  discountPercentage: number;
  pricingTierApplied: string;
  lineTotalDzd: number;
  availableStock: number;
  status: 'OK' | 'PRICE_CHANGED' | 'STOCK_ADJUSTED' | 'OUT_OF_STOCK' | 'UNAVAILABLE';
  warningMessage?: string;
}

export interface ValidatedCartSummary {
  items: ValidatedCartItem[];
  itemCount: number;
  subtotalDzd: number;
  totalSavingsDzd: number;
  shippingCostEstimateDzd: number;
  totalEstimatedDzd: number;
  hasWarnings: boolean;
  warnings: string[];
  canProceedToCheckout: boolean;
  customerType: 'B2C' | 'B2B';
  isApprovedB2B: boolean;
}

// In-memory idempotency cache (keyed by idempotency key or hash of submission)
const idempotencyStore = new Map<string, { orderResult: any; timestamp: number }>();
const IDEMPOTENCY_TTL_MS = 60 * 1000; // 1 minute window

export class CheckoutService {
  constructor(private supabase: SupabaseClient<any, any, any>) {}

  /**
   * Authoritative Cart Validation
   * Re-evaluates all product prices, visibility, active status, stock availability,
   * and customer context (B2C vs APPROVED B2B vs UNAPPROVED B2B).
   */
  async validateCart(
    items: Array<{ productId: string; quantity: number }>,
    userId?: string | null,
    wilayaCode: number = 16
  ): Promise<ValidatedCartSummary> {
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

    // 1. Resolve Customer Context
    let customerType: 'B2C' | 'B2B' = 'B2C';
    let isApprovedB2B = false;
    let businessId: string | null = null;
    let tierCode: string | null = null;

    if (userId) {
      const accountService = new CustomerAccountService(this.supabase);
      try {
        const customerContext = await accountService.getCustomerContext(userId);
        if (customerContext) {
          customerType = customerContext.userType === 'B2B' ? 'B2B' : 'B2C';
          isApprovedB2B = customerContext.canAccessWholesalePrices;
          if (isApprovedB2B && customerContext.business) {
            businessId = customerContext.business.id;
            tierCode = customerContext.business.tierCode;
          }
        }
      } catch {
        // Fallback to standard B2C
      }
    }

    // 2. Query products by ID
    const productIds = items.map(i => i.productId);
    const { data: productsData, error: productsError } = await (this.supabase
      .from('products') as any)
      .select(`
        id,
        sku,
        name,
        slug,
        main_image,
        product_type,
        status,
        is_visible,
        cost_price_dzd,
        b2c_price_dzd,
        b2c_sale_price_dzd,
        b2b_price_dzd,
        stock_quantity,
        reserved_stock,
        available_stock
      `)
      .in('id', productIds);

    const products = (productsData || []) as any[];
    const productMap = new Map<string, any>(products.map(p => [p.id, p]));

    // 3. Fetch B2B Tier Prices if approved B2B
    let tierPricesMap = new Map<string, any[]>();
    if (isApprovedB2B && tierCode) {
      const { data: tierData } = await (this.supabase
        .from('b2b_tier_prices') as any)
        .select('*')
        .in('product_id', productIds);

      for (const tp of (tierData || []) as any[]) {
        const existing = tierPricesMap.get(tp.product_id) || [];
        existing.push(tp);
        tierPricesMap.set(tp.product_id, existing);
      }
    }

    // 4. Validate and Price Each Line Item
    const validatedItems: ValidatedCartItem[] = [];
    const warnings: string[] = [];
    let subtotalDzd = 0;
    let totalSavingsDzd = 0;
    let itemCount = 0;

    for (const item of items) {
      const product = productMap.get(item.productId);

      if (!product || !product.is_visible || product.status !== 'ACTIVE') {
        validatedItems.push({
          productId: item.productId,
          sku: product?.sku || 'UNKNOWN',
          name: product?.name || 'Produit indisponible',
          slug: product?.slug || '',
          mainImage: product?.main_image || '/images/placeholder.png',
          productType: product?.product_type || 'AFTERMARKET',
          requestedQuantity: item.quantity,
          validQuantity: 0,
          unitPriceDzd: 0,
          originalPriceDzd: 0,
          discountPercentage: 0,
          pricingTierApplied: 'UNAVAILABLE',
          lineTotalDzd: 0,
          availableStock: 0,
          status: 'UNAVAILABLE',
          warningMessage: 'Ce produit n\'est plus disponible à la vente.',
        });
        warnings.push(`Le produit "${product?.name || item.productId}" n'est plus disponible.`);
        continue;
      }

      const availableStock = Math.max(0, product.available_stock ?? (product.stock_quantity - (product.reserved_stock || 0)));

      if (availableStock <= 0) {
        validatedItems.push({
          productId: product.id,
          sku: product.sku,
          name: product.name,
          slug: product.slug,
          mainImage: product.main_image,
          productType: product.product_type,
          requestedQuantity: item.quantity,
          validQuantity: 0,
          unitPriceDzd: product.b2c_price_dzd,
          originalPriceDzd: product.b2c_price_dzd,
          discountPercentage: 0,
          pricingTierApplied: 'OUT_OF_STOCK',
          lineTotalDzd: 0,
          availableStock: 0,
          status: 'OUT_OF_STOCK',
          warningMessage: 'Produit en rupture de stock temporaire.',
        });
        warnings.push(`Le produit "${product.name}" est en rupture de stock.`);
        continue;
      }

      let validQuantity = Math.max(1, Math.min(item.quantity, availableStock));
      let itemStatus: ValidatedCartItem['status'] = 'OK';
      let itemWarning: string | undefined;

      if (item.quantity > availableStock) {
        itemStatus = 'STOCK_ADJUSTED';
        itemWarning = `Quantité ajustée à ${availableStock} (stock disponible maximum).`;
        warnings.push(`La quantité pour "${product.name}" a été ajustée à ${availableStock} unités.`);
      }

      // Calculate authoritative server price
      const tierPrices = tierPricesMap.get(product.id) || [];
      const priceContext: PriceResolutionContext = {
        quantity: validQuantity,
        tierCode: isApprovedB2B ? tierCode : undefined,
        businessId: isApprovedB2B ? businessId : undefined,
      };

      const resolved = PricingService.resolvePrice(product, tierPrices, null, priceContext);
      const lineTotal = resolved.unitPriceDzd * validQuantity;

      subtotalDzd += lineTotal;
      totalSavingsDzd += resolved.savingsDzd;
      itemCount += validQuantity;

      validatedItems.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        slug: product.slug,
        mainImage: product.main_image,
        productType: product.product_type,
        requestedQuantity: item.quantity,
        validQuantity,
        unitPriceDzd: resolved.unitPriceDzd,
        originalPriceDzd: resolved.originalPriceDzd,
        discountPercentage: resolved.discountPercentage,
        pricingTierApplied: resolved.pricingTierApplied,
        lineTotalDzd: lineTotal,
        availableStock,
        status: itemStatus,
        warningMessage: itemWarning,
      });
    }

    const shippingCostEstimateDzd = wilayaCode === 16 ? 400 : 600;
    const totalEstimatedDzd = subtotalDzd + (itemCount > 0 ? shippingCostEstimateDzd : 0);
    const canProceedToCheckout = validatedItems.some(i => i.validQuantity > 0);

    return {
      items: validatedItems,
      itemCount,
      subtotalDzd,
      totalSavingsDzd,
      shippingCostEstimateDzd: itemCount > 0 ? shippingCostEstimateDzd : 0,
      totalEstimatedDzd,
      hasWarnings: warnings.length > 0,
      warnings,
      canProceedToCheckout,
      customerType,
      isApprovedB2B,
    };
  }

  /**
   * Process Order Checkout Atomically
   * Strictly resolves identity, authorizes wholesale discounts, validates stock,
   * performs double-entry stock reservation, snapshots line items & addresses,
   * and generates human-friendly order numbers + tracking tokens.
   */
  async processOrderCheckout(
    input: CheckoutOrderInput,
    authenticatedUserId?: string | null,
    idempotencyKey?: string | null
  ) {
    // 1. Idempotency Check
    if (idempotencyKey) {
      const cached = idempotencyStore.get(idempotencyKey);
      if (cached && (Date.now() - cached.timestamp < IDEMPOTENCY_TTL_MS)) {
        return cached.orderResult;
      }
    }

    // Clean old idempotency keys
    for (const [key, val] of idempotencyStore.entries()) {
      if (Date.now() - val.timestamp > IDEMPOTENCY_TTL_MS) {
        idempotencyStore.delete(key);
      }
    }

    // 2. Resolve Server-Authoritative Identity
    let customerId: string | null = null;
    let businessId: string | null = null;
    let isGuest = true;
    let customerType: UserType = 'B2C';
    let isApprovedB2B = false;
    let tierCode: string | null = null;

    if (authenticatedUserId) {
      const accountService = new CustomerAccountService(this.supabase);
      const customerContext = await accountService.getCustomerContext(authenticatedUserId);
      if (customerContext) {
        customerId = customerContext.userId;
        isGuest = false;
        customerType = customerContext.userType;
        isApprovedB2B = customerContext.canAccessWholesalePrices;
        if (isApprovedB2B && customerContext.business) {
          businessId = customerContext.business.id;
          tierCode = customerContext.business.tierCode;
        }
      }
    }

    // 3. Authoritative Re-fetch and Stock Verification
    const productIds = input.items.map(i => i.productId);
    const { data: productsData, error: fetchError } = await (this.supabase
      .from('products') as any)
      .select(`
        id,
        sku,
        name,
        slug,
        product_type,
        status,
        is_visible,
        cost_price_dzd,
        b2c_price_dzd,
        b2c_sale_price_dzd,
        b2b_price_dzd,
        stock_quantity,
        reserved_stock,
        available_stock
      `)
      .in('id', productIds);

    const products = (productsData || []) as any[];
    if (fetchError || products.length === 0) {
      throw new Error('Impossible de charger les produits pour la commande.');
    }

    const productMap = new Map<string, any>(products.map(p => [p.id, p]));

    // Fetch tier prices if approved B2B
    let tierPricesMap = new Map<string, any[]>();
    if (isApprovedB2B && tierCode) {
      const { data: tierData } = await (this.supabase
        .from('b2b_tier_prices') as any)
        .select('*')
        .in('product_id', productIds);

      for (const tp of (tierData || []) as any[]) {
        const existing = tierPricesMap.get(tp.product_id) || [];
        existing.push(tp);
        tierPricesMap.set(tp.product_id, existing);
      }
    }

    // 4. Validate quantities & recalculate prices
    let calculatedSubtotalDzd = 0;
    let calculatedDiscountDzd = 0;
    const itemsToSnapshot: Array<{
      product_id: string;
      sku: string;
      product_name: string;
      unit_price_dzd: number;
      quantity: number;
      total_price_dzd: number;
      product_type_snapshot: ProductType;
    }> = [];

    for (const item of input.items) {
      const product = productMap.get(item.productId);
      if (!product || !product.is_visible || product.status !== 'ACTIVE') {
        throw new Error(`Le produit ${product?.name || item.productId} n'est plus disponible.`);
      }

      const availableStock = Math.max(0, product.available_stock ?? (product.stock_quantity - (product.reserved_stock || 0)));
      if (availableStock < item.quantity) {
        throw new Error(
          `Le produit "${product.name}" n'est plus disponible dans la quantité demandée (${availableStock} unité(s) restante(s)).`
        );
      }

      const tierPrices = tierPricesMap.get(product.id) || [];
      const priceContext: PriceResolutionContext = {
        quantity: item.quantity,
        tierCode: isApprovedB2B ? tierCode : undefined,
        businessId: isApprovedB2B ? businessId : undefined,
      };

      const resolved = PricingService.resolvePrice(product, tierPrices, null, priceContext);
      const lineTotal = resolved.unitPriceDzd * item.quantity;
      calculatedSubtotalDzd += lineTotal;
      calculatedDiscountDzd += resolved.savingsDzd;

      itemsToSnapshot.push({
        product_id: product.id,
        sku: product.sku,
        product_name: product.name,
        unit_price_dzd: resolved.unitPriceDzd,
        quantity: item.quantity,
        total_price_dzd: lineTotal,
        product_type_snapshot: product.product_type,
      });
    }

    // Calculate authoritative shipping cost based on Algerian Wilaya & Delivery Type
    const deliveryRate = DeliveryPricingService.calculateDeliveryCost({
      wilayaCode: input.wilayaCode,
      deliveryType: input.deliveryType,
      subtotalDzd: calculatedSubtotalDzd,
    });
    const shippingCostDzd = deliveryRate.finalCostDzd;
    const calculatedTotalDzd = calculatedSubtotalDzd + shippingCostDzd;

    // Generate Human-friendly Order Number (HP-2026-XXXXXX)
    const currentYear = new Date().getFullYear();
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `HP-${currentYear}-${randomSuffix}`;

    // Generate Secure Dual-Verification Tracking Token (32 hex characters)
    const trackingToken = crypto.randomBytes(16).toString('hex');

    // 5. Insert Order Header Snapshot
    const { data: orderData, error: orderInsertError } = await (this.supabase
      .from('orders') as any)
      .insert({
        order_number: orderNumber,
        customer_id: customerId,
        business_id: businessId,
        is_guest: isGuest,
        customer_type: customerType,
        recipient_name: input.recipientName.trim(),
        recipient_phone: input.recipientPhone.trim(),
        recipient_phone_secondary: input.recipientPhoneSecondary?.trim() || null,
        shipping_address_line: input.shippingAddressLine.trim(),
        wilaya_code: input.wilayaCode,
        wilaya_name: input.wilayaName.trim(),
        commune_name: input.communeName.trim(),
        delivery_type: input.deliveryType,
        stopdesk_code: input.stopdeskCode || null,
        subtotal_dzd: calculatedSubtotalDzd,
        discount_dzd: calculatedDiscountDzd,
        shipping_cost_dzd: shippingCostDzd,
        total_dzd: calculatedTotalDzd,
        status: 'PENDING' as OrderStatus,
        payment_method: input.paymentMethod,
        payment_status: 'UNPAID',
        tracking_token: trackingToken,
        customer_notes: input.customerNotes?.trim() || null,
      })
      .select()
      .single();

    const order = orderData as any;
    if (orderInsertError || !order) {
      throw new Error(`Erreur lors de la création de la commande: ${orderInsertError?.message}`);
    }

    // 6. Insert Order Items Snapshot
    const orderItemsPayload = itemsToSnapshot.map(item => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsInsertError } = await (this.supabase
      .from('order_items') as any)
      .insert(orderItemsPayload);

    if (itemsInsertError) {
      throw new Error(`Erreur lors de l'enregistrement des articles: ${itemsInsertError.message}`);
    }

    // 7. Initialize Order Status History
    await (this.supabase
      .from('order_status_history') as any)
      .insert({
        order_id: order.id,
        new_status: 'PENDING',
        reason: isGuest ? 'Commande passée par un visiteur (Guest)' : 'Commande passée par un client authentifié',
        changed_by: customerId,
      });

    // 8. Atomic Double-Entry Stock Reservation
    for (const item of input.items) {
      const product = productMap.get(item.productId);
      const currentPhysical = product.stock_quantity || 0;
      const currentReserved = product.reserved_stock || 0;
      const newReserved = currentReserved + item.quantity;
      const newAvailable = Math.max(0, currentPhysical - newReserved);

      // Record double-entry reservation transaction
      await (this.supabase
        .from('inventory_transactions') as any)
        .insert({
          product_id: item.productId,
          transaction_type: 'RESERVATION',
          quantity_change: item.quantity,
          previous_stock: currentPhysical,
          new_stock: currentPhysical,
          previous_reserved: currentReserved,
          new_reserved: newReserved,
          reference_type: 'ORDER',
          reference_id: order.order_number,
          notes: `Réservation de stock pour commande ${order.order_number}`,
          created_by: customerId,
        });

      // Update product stocks
      await (this.supabase
        .from('products') as any)
        .update({
          reserved_stock: newReserved,
          available_stock: newAvailable,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.productId);
    }

    const result = {
      success: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        trackingToken: order.tracking_token,
        totalDzd: order.total_dzd,
        subtotalDzd: order.subtotal_dzd,
        shippingCostDzd: order.shipping_cost_dzd,
        discountDzd: order.discount_dzd,
        recipientName: order.recipient_name,
        recipientPhone: order.recipient_phone,
        shippingAddressLine: order.shipping_address_line,
        wilayaName: order.wilaya_name,
        communeName: order.commune_name,
        itemsCount: itemsToSnapshot.length,
        status: order.status,
        paymentMethod: order.payment_method,
        createdAt: order.created_at,
      },
    };

    // Cache in idempotency store
    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, {
        orderResult: result,
        timestamp: Date.now(),
      });
    }

    return result;
  }

  /**
   * Dual-Verification Guest & Public Order Lookup
   * Requires both orderNumber and trackingToken for authorization
   */
  async lookupGuestOrder(orderNumber: string, trackingToken: string) {
    if (!orderNumber || !trackingToken) {
      throw new Error('Numéro de commande et clé de suivi requis.');
    }

    const { data: orderData, error: orderError } = await (this.supabase
      .from('orders') as any)
      .select(`
        id,
        order_number,
        is_guest,
        recipient_name,
        recipient_phone,
        shipping_address_line,
        wilaya_name,
        commune_name,
        delivery_type,
        subtotal_dzd,
        discount_dzd,
        shipping_cost_dzd,
        total_dzd,
        status,
        payment_method,
        payment_status,
        tracking_number,
        tracking_token,
        courier_code,
        created_at,
        order_items(
          id,
          product_id,
          sku,
          product_name,
          unit_price_dzd,
          quantity,
          total_price_dzd,
          product_type_snapshot
        ),
        order_status_history(
          id,
          previous_status,
          new_status,
          reason,
          created_at
        )
      `)
      .eq('order_number', orderNumber.trim())
      .single();

    const order = orderData as any;
    if (orderError || !order) {
      throw new Error('Commande introuvable avec ce numéro.');
    }

    // Enforce dual-verification token matching
    if (order.tracking_token !== trackingToken.trim()) {
      throw new Error('Clé de suivi invalide pour cette commande.');
    }

    return order;
  }
}
