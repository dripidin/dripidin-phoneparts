// DRIPIDIN Logistics Domain Types & Contracts
// Provider-Agnostic Logistics Foundation for Commercial E-Commerce

import type { DeliveryStatus, DeliveryType } from '@/types/database.types';
import type { Money } from '@/lib/money/types';

export type { DeliveryStatus, DeliveryType };

export type ShipmentStatus = DeliveryStatus;

/**
 * Provider-neutral address model.
 * Bridges CountryProfile regional semantics (Wilaya vs Department vs State)
 * without hard-coding country-specific meanings into core logistics.
 */
export interface ShippingAddress {
  countryCode: string; // ISO 3166-1 alpha-2 (e.g., 'DZ', 'FR')
  administrativeAreaCode?: string | number; // Wilaya code (1..58) or Department code
  administrativeAreaName?: string; // Wilaya name or Department name
  localityCode?: string | number;
  localityName: string; // Commune name or City
  postalCode?: string;
  addressLine1: string;
  addressLine2?: string | null;
  recipientName: string;
  recipientPhone: string;
  recipientPhoneSecondary?: string | null;
}

/**
 * Available delivery method specification offered by the store/provider.
 */
export interface ShippingMethod {
  id: string; // e.g. 'standard-home', 'stopdesk-pickup'
  type: DeliveryType; // 'HOME' | 'DESK'
  name: string; // 'Livraison à Domicile', 'Retrait Stopdesk'
  description?: string;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

/**
 * Calculated shipping rate result with strong Money integration.
 */
export interface ShippingRate {
  method: ShippingMethod;
  cost: Money;
  isFreeShipping: boolean;
  providerCode: string;
  destination: {
    countryCode: string;
    administrativeAreaCode?: string | number;
    administrativeAreaName?: string;
  };
}

/**
 * Explicit capabilities declaring what an integrated delivery provider supports.
 */
export interface ProviderCapabilities {
  createShipment: boolean;
  cancelShipment: boolean;
  tracking: boolean;
  webhook: boolean;
  labelGeneration: boolean;
  codSupport: boolean;
  returnsSupport: boolean;
}

/**
 * Provider-agnostic request to create a tracked shipment.
 */
export interface CreateShipmentRequest {
  orderId: string;
  orderNumber: string;
  recipient: {
    name: string;
    phone: string;
    secondaryPhone?: string | null;
  };
  address: ShippingAddress;
  deliveryType: DeliveryType;
  stopdeskCode?: string | null;
  codAmount: Money;
  declaredValue?: Money;
  weightGrams?: number;
  parcelCount?: number;
  itemDescription?: string;
  allowCustomerToOpenParcel?: boolean;
  customerNotes?: string | null;
}

/**
 * Return structure upon successful shipment registration with a courier.
 */
export interface ShipmentResult {
  providerCode: string;
  trackingNumber: string;
  barcode: string;
  labelUrl?: string | null;
  trackingUrl?: string | null;
  estimatedDeliveryDays?: number;
  rawResponse?: Record<string, unknown>;
}

/**
 * Normalized timeline tracking milestone.
 */
export interface TrackingEvent {
  status: ShipmentStatus;
  providerStatus: string;
  description: string;
  location?: string;
  timestamp: string;
}

/**
 * Detailed shipment entity snapshot.
 */
export interface ShipmentDetails {
  id?: string;
  orderId: string;
  orderNumber: string;
  providerCode: string;
  trackingNumber: string;
  barcode?: string | null;
  status: ShipmentStatus;
  labelUrl?: string | null;
  trackingUrl?: string | null;
  codAmount: Money;
  trackingHistory: TrackingEvent[];
  dispatchedAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Normalized courier connection test health report.
 */
export interface ProviderConnectionTestResult {
  providerCode: string;
  success: boolean;
  message: string;
  latencyMs?: number;
  environment: 'production' | 'sandbox';
  timestamp: string;
  isConfigured?: boolean;
}

/**
 * Normalized inbound webhook event payload.
 * Courier-specific formats must be transformed into this contract before
 * touching domain/order state logic.
 */
export interface NormalizedWebhookEvent {
  providerCode: string;
  externalEventId?: string;
  trackingNumber: string;
  status: ShipmentStatus;
  providerStatus: string;
  description?: string;
  location?: string;
  timestamp: string;
  referenceOrderNumber?: string;
  codCollectedAmount?: number;
  rawPayload: Record<string, unknown>;
}
