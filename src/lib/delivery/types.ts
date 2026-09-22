// Logistics Abstraction: Provider Contracts & Domain Types (Backward-Compatibility Facade)
// Re-exports domain contracts from @/lib/logistics while preserving legacy interface signatures

import type { DeliveryStatus, DeliveryType, OrderStatus } from '@/types/database.types';
import type {
  ProviderCapabilities,
  ShipmentResult,
  TrackingEvent,
  ProviderConnectionTestResult,
  NormalizedWebhookEvent,
} from '@/lib/logistics/types';
import type { DeliveryProviderConfig } from '@/lib/logistics/contracts';

export type {
  DeliveryStatus,
  DeliveryType,
  OrderStatus,
  ProviderCapabilities,
  ShipmentResult,
  TrackingEvent,
  ProviderConnectionTestResult,
  DeliveryProviderConfig,
  NormalizedWebhookEvent,
};

export interface CreateShipmentInput {
  orderId: string;
  orderNumber: string;
  recipientName: string;
  recipientPhone: string;
  recipientPhoneSecondary?: string | null;
  wilayaCode: number;
  wilayaName: string;
  communeName: string;
  addressLine: string;
  deliveryType: DeliveryType;
  stopdeskCode?: string | null;
  codAmountDzd: number; // 0 if prepaid, otherwise total order amount to collect
  declaredValueDzd?: number;
  weightGrams?: number;
  parcelCount?: number;
  itemDescription?: string;
  allowCustomerToOpenParcel?: boolean;
  customerNotes?: string | null;
}

export interface ShipmentDetails {
  id?: string;
  orderId: string;
  orderNumber: string;
  providerCode: string;
  trackingNumber: string;
  barcode?: string | null;
  status: DeliveryStatus;
  labelUrl?: string | null;
  codAmountDzd: number;
  trackingHistory: TrackingEvent[];
  dispatchedAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryProvider {
  readonly providerCode: string;
  readonly providerName: string;

  /**
   * Submit an authoritative order to create a tracked courier shipment
   */
  createShipment(input: CreateShipmentInput | any): Promise<ShipmentResult>;

  /**
   * Fetch current status and timeline events for an active shipment
   */
  trackShipment(trackingNumber: string): Promise<TrackingEvent[]>;

  /**
   * Cancel a shipment before physical pickup
   */
  cancelShipment(trackingNumber: string, reason?: string): Promise<boolean>;

  /**
   * Get direct printable shipping label URL or PDF stream
   */
  getLabelUrl(trackingNumber: string): Promise<string | null>;

  /**
   * Normalize courier-specific raw status code into internal DeliveryStatus
   */
  normalizeStatus(rawStatus: string): DeliveryStatus;

  /**
   * Test connection and token validity with the courier API
   */
  testConnection(): Promise<ProviderConnectionTestResult>;
}
