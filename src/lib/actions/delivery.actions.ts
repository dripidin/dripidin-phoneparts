'use server';

// Protected Server Actions for Delivery, Shipment Operations & Logistics Management

import { createServerClient } from '@/lib/auth/server';
import { requirePermission, requireStaff } from '@/lib/permissions/guards';
import { DeliveryService } from '@/lib/services/delivery.service';
import { DeliveryPricingService } from '@/lib/delivery/delivery-pricing.service';
import {
  CreateShipmentSchema,
  CancelShipmentSchema,
  ShipmentsFilterSchema,
  type ShipmentsFilterInput,
} from '@/lib/validation/delivery.schema';

/**
 * Create an authoritative shipment with EcoTrack or designated courier provider
 */
export async function createShipmentAction(orderId: string, providerCode: string = 'ECOTRACK') {
  const supabase = await createServerClient();
  const authContext = await requirePermission(supabase, 'orders.update');

  const validated = CreateShipmentSchema.parse({ orderId, providerCode });
  const deliveryService = new DeliveryService(supabase);

  return await deliveryService.createShipment(
    validated.orderId,
    validated.providerCode,
    authContext
  );
}

/**
 * Synchronize live status and tracking events from the courier API
 */
export async function syncShipmentStatusAction(trackingNumber: string) {
  const supabase = await createServerClient();
  const authContext = await requirePermission(supabase, 'orders.read');

  const deliveryService = new DeliveryService(supabase);
  return await deliveryService.syncShipmentStatus(trackingNumber, authContext);
}

/**
 * Cancel an active shipment before physical courier pickup
 */
export async function cancelShipmentAction(orderId: string, reason?: string) {
  const supabase = await createServerClient();
  const authContext = await requirePermission(supabase, 'orders.update');

  const validated = CancelShipmentSchema.parse({ orderId, reason });
  const deliveryService = new DeliveryService(supabase);

  return await deliveryService.cancelShipment(
    validated.orderId,
    validated.reason,
    authContext
  );
}

/**
 * List shipments with multi-criteria filtering for Admin Logistics Console
 */
export async function getShipmentsListAction(filters: Partial<ShipmentsFilterInput> = {}) {
  const supabase = await createServerClient();
  await requireStaff(supabase);

  const validated = ShipmentsFilterSchema.parse({
    page: filters.page || 1,
    pageSize: filters.pageSize || 20,
    search: filters.search,
    providerCode: filters.providerCode,
    status: filters.status,
    wilayaCode: filters.wilayaCode,
    deliveryType: filters.deliveryType,
  });

  const deliveryService = new DeliveryService(supabase);
  return await deliveryService.getShipmentsList(validated);
}

/**
 * Test connectivity and token health with a courier provider API
 */
export async function testDeliveryProviderAction(providerCode: string = 'ECOTRACK') {
  const supabase = await createServerClient();
  await requireStaff(supabase);

  const deliveryService = new DeliveryService(supabase);
  return await deliveryService.testProviderConnection(providerCode);
}

/**
 * Get the authoritative 58-Wilaya delivery pricing matrix
 */
export async function getDeliveryRatesAction() {
  return DeliveryPricingService.getAllWilayaRates();
}
