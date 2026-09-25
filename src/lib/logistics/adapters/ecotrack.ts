// DRIPIDIN EcoTrack Logistics Provider Adapter
// Concrete implementation of IDeliveryProvider isolating EcoTrack-specific payloads

import type { IDeliveryProvider, DeliveryProviderConfig } from '../contracts';
import type {
  ProviderCapabilities,
  CreateShipmentRequest,
  ShipmentResult,
  TrackingEvent,
  ShipmentStatus,
  ProviderConnectionTestResult,
  NormalizedWebhookEvent,
} from '../types';
import { IntegrationConfigService } from '@/lib/config/integration-config.service';
import { SecretResolver } from '@/lib/vault/secret-resolver';

import { createMoney } from '@/lib/money';

export type AnyShipmentInput =
  | CreateShipmentRequest
  | {
      orderId: string;
      orderNumber: string;
      recipientName: string;
      recipientPhone: string;
      recipientPhoneSecondary?: string | null;
      wilayaCode: number;
      wilayaName: string;
      communeName: string;
      addressLine: string;
      deliveryType: any;
      stopdeskCode?: string | null;
      codAmountDzd: number;
      declaredValueDzd?: number;
      weightGrams?: number;
      parcelCount?: number;
      itemDescription?: string;
      allowCustomerToOpenParcel?: boolean;
      customerNotes?: string | null;
      isDemo?: boolean;
    };

export class EcoTrackDeliveryProvider implements IDeliveryProvider {
  readonly providerCode = 'ECOTRACK';
  readonly providerName = 'EcoTrack Express';

  readonly capabilities: ProviderCapabilities = {
    createShipment: true,
    cancelShipment: true,
    tracking: true,
    webhook: true,
    labelGeneration: true,
    codSupport: true,
    returnsSupport: true,
  };

  private apiUrl: string;
  private apiToken: string;
  private webhookSecret: string;
  private environment: 'production' | 'sandbox';
  private allowCustomerToOpenParcel: boolean;

  constructor(config?: Partial<DeliveryProviderConfig>) {
    const resolved = IntegrationConfigService.getEcoTrackConfig();
    this.apiUrl = config?.apiUrl || resolved.apiUrl;
    this.apiToken = config?.apiToken || resolved.apiToken;
    this.webhookSecret = config?.webhookSecret || resolved.webhookSecret;
    this.environment = config?.environment || resolved.environment;
    this.allowCustomerToOpenParcel =
      config?.allowCustomerToOpenParcel ?? resolved.allowCustomerToOpenParcel;
  }

  /**
   * Submit authoritative order payload to create EcoTrack shipment
   */
  async createShipment(rawInput: AnyShipmentInput): Promise<ShipmentResult> {
    // Normalize input if legacy structure was provided
    const isLegacy = 'codAmountDzd' in rawInput;
    const orderNumber = rawInput.orderNumber;
    const recipientName = isLegacy ? rawInput.recipientName : rawInput.recipient.name;
    const recipientPhone = isLegacy ? rawInput.recipientPhone : rawInput.recipient.phone;
    const recipientPhoneSecondary = isLegacy
      ? rawInput.recipientPhoneSecondary
      : rawInput.recipient.secondaryPhone;
    const addressLine = isLegacy ? rawInput.addressLine : rawInput.address.addressLine1;
    const wilayaNum = isLegacy
      ? rawInput.wilayaCode
      : Number(rawInput.address.administrativeAreaCode) || 16;
    const communeName = isLegacy ? rawInput.communeName : rawInput.address.localityName;
    const deliveryType = rawInput.deliveryType;
    const stopdeskCode = rawInput.stopdeskCode;
    const codAmount = isLegacy ? rawInput.codAmountDzd : rawInput.codAmount.amount;
    const customerNotes = rawInput.customerNotes;
    const itemDescription = rawInput.itemDescription;

    // Authoritative Phase 8 Demo & Secret Resolution
    const { DemoModeService } = await import('@/lib/demo/demo-mode.service');
    const modeRes = await DemoModeService.getEffectiveMode();
    const isExplicitDemo = modeRes.isDemo || orderNumber.startsWith('DEMO-') || Boolean((rawInput as any).isDemo);
    const effectiveToken = (await SecretResolver.getSecret('logistics', 'ECOTRACK_TOKEN')) || this.apiToken || '';

    const plan = isExplicitDemo
      ? { action: 'SIMULATE' as const, isDemo: true, providerName: 'ECOTRACK', reason: 'DEMO store mode active' }
      : await DemoModeService.requireRealProviderOrThrow('ECOTRACK', Boolean(effectiveToken));

    if (plan.action === 'SIMULATE') {
      const mockCode = `ECO-SIM-${orderNumber.replace(/[^0-9]/g, '') || Math.floor(100000 + Math.random() * 900000)}`;
      const mockLabelUrl = `https://ecotrack.dz/mock-label.pdf?code=${mockCode}`;
      return {
        providerCode: this.providerCode,
        trackingNumber: mockCode,
        barcode: mockCode,
        labelUrl: mockLabelUrl,
        trackingUrl: this.getTrackingUrl(mockCode),
        estimatedDeliveryDays: wilayaNum === 16 ? 1 : 2,
        rawResponse: {
          simulated: true,
          isDemo: true,
          status: 'success',
          tracking_code: mockCode,
          barcode: mockCode,
          label_url: mockLabelUrl,
          reference: orderNumber,
        },
      };
    }

    const payload = {
      api_token: effectiveToken,
      reference: orderNumber,
      nom_client: recipientName,
      telephone: recipientPhone,
      telephone_2: recipientPhoneSecondary || '',
      adresse: addressLine,
      code_wilaya: wilayaNum,
      commune: communeName,
      montant: codAmount,
      type: deliveryType === 'DESK' ? 2 : 1, // 1: Domicile, 2: Stop Desk
      stopdesk_code: stopdeskCode || '',
      remarque:
        customerNotes ||
        itemDescription ||
        'Pièces détachées smartphone',
      ouvrir_colis: this.allowCustomerToOpenParcel ? 1 : 0,
    };

    try {
      const response = await fetch(`${this.apiUrl}/create_colis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || (data && data.status === 'error')) {
        const errorMsg = data?.message || data?.error || `EcoTrack HTTP ${response.status}`;
        throw new Error(`Erreur EcoTrack: ${errorMsg}`);
      }

      const trackingCode = data.tracking_code || data.code_suivi || data.tracking_number;
      if (!trackingCode) {
        throw new Error('Réponse EcoTrack invalide : code de suivi manquant');
      }

      return {
        providerCode: this.providerCode,
        trackingNumber: trackingCode,
        barcode: data.barcode || trackingCode,
        labelUrl:
          data.label_url ||
          `${this.apiUrl}/label/${trackingCode}?api_token=${this.apiToken}`,
        trackingUrl: this.getTrackingUrl(trackingCode),
        estimatedDeliveryDays: wilayaNum === 16 ? 1 : 2,
        rawResponse: data,
      };
    } catch (err: any) {
      if (err.message?.startsWith('Erreur EcoTrack:')) throw err;
      throw new Error(`Impossible de contacter le serveur EcoTrack: ${err.message}`);
    }
  }

  /**
   * Fetch current tracking timeline from EcoTrack
   */
  async trackShipment(trackingNumber: string): Promise<TrackingEvent[]> {
    const { DemoModeService } = await import('@/lib/demo/demo-mode.service');
    const isDemo = trackingNumber.startsWith('ECO-SIM-') || (await DemoModeService.isDemoMode());
    if (isDemo) {
      return [
        {
          status: 'PENDING',
          providerStatus: 'pret_a_expedier',
          description: 'Colis créé et enregistré dans le simulateur EcoTrack',
          location: 'Alger Centre',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          status: 'IN_TRANSIT',
          providerStatus: 'en_transit',
          description: "Colis simulé en cours d'acheminement vers le centre de tri",
          location: 'Hub Alger Belfort',
          timestamp: new Date().toISOString(),
        },
      ];
    }

    const effectiveToken = this.apiToken || (await SecretResolver.getSecret('logistics', 'ECOTRACK_TOKEN')) || '';
    await DemoModeService.requireRealProviderOrThrow('ECOTRACK', Boolean(effectiveToken));

    try {
      const response = await fetch(
        `${this.apiUrl}/track/${trackingNumber}?api_token=${this.apiToken}`,
        { headers: { Accept: 'application/json' } }
      );

      if (!response.ok) {
        throw new Error(`Erreur suivi EcoTrack HTTP ${response.status}`);
      }

      const data = await response.json();
      const history = data.history || data.events || [];

      return history.map((event: any) => ({
        status: this.normalizeStatus(event.status_code || event.status || ''),
        providerStatus: event.status_code || event.status || 'unknown',
        description:
          event.status_text || event.description || event.status || 'Mise à jour statut',
        location: event.wilaya_name || event.location || undefined,
        timestamp: event.created_at || event.timestamp || new Date().toISOString(),
      }));
    } catch (err: any) {
      throw new Error(
        `Erreur lors de la récupération du suivi EcoTrack: ${err.message}`
      );
    }
  }

  /**
   * Cancel an EcoTrack shipment before physical courier pickup
   */
  async cancelShipment(trackingNumber: string, reason?: string): Promise<boolean> {
    const { DemoModeService } = await import('@/lib/demo/demo-mode.service');
    const isDemo = trackingNumber.startsWith('ECO-SIM-') || (await DemoModeService.isDemoMode());
    if (isDemo) return true;

    const effectiveToken = this.apiToken || (await SecretResolver.getSecret('logistics', 'ECOTRACK_TOKEN')) || '';
    await DemoModeService.requireRealProviderOrThrow('ECOTRACK', Boolean(effectiveToken));

    try {
      const response = await fetch(`${this.apiUrl}/cancel_colis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          api_token: this.apiToken,
          tracking_code: trackingNumber,
          motif: reason || 'Annulation demandée par le marchand',
        }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get direct printable label URL
   */
  async getLabelUrl(trackingNumber: string): Promise<string | null> {
    return `${this.apiUrl}/label/${trackingNumber}?api_token=${this.apiToken}`;
  }

  /**
   * Get public tracking portal URL
   */
  getTrackingUrl(trackingNumber: string): string {
    return `https://ecotrack.dz/track/${trackingNumber}`;
  }

  /**
   * Normalize raw EcoTrack status string into internal ShipmentStatus
   */
  normalizeStatus(rawStatus: string): ShipmentStatus {
    const s = (rawStatus || '').toLowerCase().trim();

    // 1. Pending / Created
    if (['pret_a_expedier', 'created', 'nouveau', 'enregistre', 'pending'].includes(s)) {
      return 'PENDING';
    }

    // 2. Picked up / Received in hub
    if (['recu', 'ramasse', 'picked_up', 'en_hub', 'centre', 'hub'].includes(s)) {
      return 'PICKED_UP';
    }

    // 3. In Transit between wilayas
    if (['en_transit', 'en_voyage', 'vers_destination', 'in_transit', 'transfert'].includes(s)) {
      return 'IN_TRANSIT';
    }

    // 4. Out for delivery
    if (['en_livraison', 'en_cours', 'distribue', 'out_for_delivery', 'en_tournee'].includes(s)) {
      return 'OUT_FOR_DELIVERY';
    }

    // 5. Delivered & COD collected
    if (['livre', 'delivered', 'livree', 'paye', 'encaisse', 'complete'].includes(s)) {
      return 'DELIVERED';
    }

    // 6. Failed attempt
    if (['echec', 'echec_livraison', 'non_abouti', 'absent', 'injoignable', 'reporte', 'failed'].includes(s)) {
      return 'FAILED';
    }

    // 7. Returned to warehouse
    if (['retour', 'retour_recu', 'retourne', 'returned', 'retour_magasin'].includes(s)) {
      return 'RETURNED';
    }

    // 8. Cancelled
    if (['annule', 'cancelled', 'annulee'].includes(s)) {
      return 'CANCELLED';
    }

    return 'PENDING';
  }

  /**
   * Test API connectivity and token health
   */
  async testConnection(): Promise<ProviderConnectionTestResult> {
    const startTime = Date.now();

    if (!this.apiToken || this.environment === 'sandbox') {
      return {
        providerCode: this.providerCode,
        success: true,
        message: 'Mode Sandbox/Mock actif (Aucun jeton API réel requis, émulation locale active)',
        latencyMs: 15,
        environment: 'sandbox',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const response = await fetch(`${this.apiUrl}/ping`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${this.apiToken}`,
        },
      });

      const latencyMs = Date.now() - startTime;

      if (response.ok) {
        return {
          providerCode: this.providerCode,
          success: true,
          message: "Connexion à l'API EcoTrack établie avec succès",
          latencyMs,
          environment: this.environment,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        providerCode: this.providerCode,
        success: false,
        message: `Échec de l'authentification EcoTrack (HTTP ${response.status})`,
        latencyMs,
        environment: this.environment,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        providerCode: this.providerCode,
        success: false,
        message: `Erreur réseau lors du test EcoTrack: ${err.message}`,
        latencyMs: Date.now() - startTime,
        environment: this.environment,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Parse inbound EcoTrack webhook payload into NormalizedWebhookEvent
   */
  parseWebhook(rawPayload: any, secretToken?: string): NormalizedWebhookEvent {
    // Check secret token if configured (check both instance and process.env dynamically)
    const expectedSecret = this.webhookSecret || process.env.ECOTRACK_WEBHOOK_SECRET;
    if (expectedSecret && secretToken && secretToken !== expectedSecret) {
      throw new Error('Jeton de signature webhook EcoTrack invalide.');
    }

    const rawStatus = rawPayload?.status || '';
    const normalizedStatus = this.normalizeStatus(rawStatus);

    return {
      providerCode: this.providerCode,
      externalEventId: rawPayload?.event_id,
      trackingNumber: rawPayload?.tracking_code || '',
      status: normalizedStatus,
      providerStatus: rawStatus,
      description: rawPayload?.status_text,
      location: rawPayload?.wilaya_name,
      timestamp: rawPayload?.timestamp || '',
      referenceOrderNumber: rawPayload?.reference,
      codCollectedAmount:
        typeof rawPayload?.montant === 'number' ? rawPayload.montant : undefined,
      rawPayload: typeof rawPayload === 'object' && rawPayload !== null ? rawPayload : {},
    };
  }
}

export { EcoTrackDeliveryProvider as EcoTrackAdapter };

