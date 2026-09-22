// DRIPIDIN Delivery Provider Contract
// Capability-aware, provider-neutral interface for external courier integrations

import type {
  ProviderCapabilities,
  CreateShipmentRequest,
  ShipmentResult,
  TrackingEvent,
  ShipmentStatus,
  ProviderConnectionTestResult,
  NormalizedWebhookEvent,
} from './types';

export interface DeliveryProviderConfig {
  providerCode: string;
  name: string;
  isEnabled: boolean;
  apiUrl: string;
  apiToken?: string;
  webhookSecret?: string;
  environment: 'production' | 'sandbox';
  allowCustomerToOpenParcel?: boolean;
}

export interface IDeliveryProvider {
  readonly providerCode: string;
  readonly providerName: string;
  readonly capabilities: ProviderCapabilities;

  /**
   * Submit authoritative order payload to create a tracked courier shipment
   */
  createShipment(request: CreateShipmentRequest): Promise<ShipmentResult>;

  /**
   * Fetch current tracking status and timeline history from the courier API
   */
  trackShipment(trackingNumber: string): Promise<TrackingEvent[]>;

  /**
   * Cancel an active shipment before physical courier pickup
   */
  cancelShipment(trackingNumber: string, reason?: string): Promise<boolean>;

  /**
   * Get direct printable label URL or PDF stream
   */
  getLabelUrl(trackingNumber: string): Promise<string | null>;

  /**
   * Generate customer-facing public tracking portal URL
   */
  getTrackingUrl(trackingNumber: string): string;

  /**
   * Normalize courier-specific raw status code into canonical ShipmentStatus
   */
  normalizeStatus(rawStatus: string): ShipmentStatus;

  /**
   * Test API connectivity and token health with courier service
   */
  testConnection(): Promise<ProviderConnectionTestResult>;

  /**
   * Parse and normalize inbound webhook request payload
   */
  parseWebhook(rawPayload: unknown, secretToken?: string): NormalizedWebhookEvent;
}
