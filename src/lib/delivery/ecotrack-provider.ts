// EcoTrack Logistics Provider Adapter for HamzaPhone (58 Algerian Wilayas)
// Concrete implementation of DeliveryProvider interface for EcoTrack API

import type { DeliveryStatus } from '@/types/database.types';
import { IntegrationConfigService } from '@/lib/config/integration-config.service';
import type {
  DeliveryProvider,
  CreateShipmentInput,
  ShipmentResult,
  TrackingEvent,
  ProviderConnectionTestResult,
  DeliveryProviderConfig,
} from './types';

export class EcoTrackDeliveryProvider implements DeliveryProvider {
  readonly providerCode = 'ECOTRACK';
  readonly providerName = 'EcoTrack Express';

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
    this.allowCustomerToOpenParcel = config?.allowCustomerToOpenParcel ?? resolved.allowCustomerToOpenParcel;
  }

  /**
   * Submit authoritative order payload to create EcoTrack shipment
   */
  async createShipment(input: CreateShipmentInput): Promise<ShipmentResult> {
    // If no active token is provided (local dev / test / sandbox mock), generate deterministic mock shipment
    if (!this.apiToken) {
      const mockCode = `ECO-${input.orderNumber.replace(/[^0-9]/g, '') || Math.floor(100000 + Math.random() * 900000)}`;
      return {
        providerCode: this.providerCode,
        trackingNumber: mockCode,
        barcode: mockCode,
        labelUrl: `https://ecotrack.dz/labels/${mockCode}.pdf`,
        estimatedDeliveryDays: input.wilayaCode === 16 ? 1 : 2,
        rawResponse: {
          mock: true,
          status: 'success',
          tracking_code: mockCode,
          reference: input.orderNumber,
        },
      };
    }

    const payload = {
      api_token: this.apiToken,
      reference: input.orderNumber,
      nom_client: input.recipientName,
      telephone: input.recipientPhone,
      telephone_2: input.recipientPhoneSecondary || '',
      adresse: input.addressLine,
      code_wilaya: input.wilayaCode,
      commune: input.communeName,
      montant: input.codAmountDzd,
      type: input.deliveryType === 'DESK' ? 2 : 1, // 1: Domicile, 2: Stop Desk
      stopdesk_code: input.stopdeskCode || '',
      remarque: input.customerNotes || input.itemDescription || 'Pièces détachées smartphone',
      ouvrir_colis: this.allowCustomerToOpenParcel ? 1 : 0,
    };

    try {
      const response = await fetch(`${this.apiUrl}/create_colis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
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
        labelUrl: data.label_url || `${this.apiUrl}/label/${trackingCode}?api_token=${this.apiToken}`,
        estimatedDeliveryDays: input.wilayaCode === 16 ? 1 : 2,
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
    if (!this.apiToken) {
      // Mock history for test/sandbox
      return [
        {
          status: 'PENDING',
          providerStatus: 'pret_a_expedier',
          description: 'Colis créé et enregistré dans le système EcoTrack',
          location: 'Alger Centre',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          status: 'IN_TRANSIT',
          providerStatus: 'en_transit',
          description: 'Colis en cours d\'acheminement vers le centre de tri régional',
          location: 'Hub Alger Belfort',
          timestamp: new Date().toISOString(),
        },
      ];
    }

    try {
      const response = await fetch(`${this.apiUrl}/track/${trackingNumber}?api_token=${this.apiToken}`, {
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Erreur suivi EcoTrack HTTP ${response.status}`);
      }

      const data = await response.json();
      const history = data.history || data.events || [];

      return history.map((event: any) => ({
        status: this.normalizeStatus(event.status_code || event.status || ''),
        providerStatus: event.status_code || event.status || 'unknown',
        description: event.status_text || event.description || event.status || 'Mise à jour statut',
        location: event.wilaya_name || event.location || undefined,
        timestamp: event.created_at || event.timestamp || new Date().toISOString(),
      }));
    } catch (err: any) {
      throw new Error(`Erreur lors de la récupération du suivi EcoTrack: ${err.message}`);
    }
  }

  /**
   * Cancel an EcoTrack shipment before physical driver pickup
   */
  async cancelShipment(trackingNumber: string, reason?: string): Promise<boolean> {
    if (!this.apiToken) return true;

    try {
      const response = await fetch(`${this.apiUrl}/cancel_colis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          api_token: this.apiToken,
          tracking_code: trackingNumber,
          motif: reason || 'Annulation demandée par HamzaPhone',
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
   * Normalize raw EcoTrack status string into internal DeliveryStatus
   */
  normalizeStatus(rawStatus: string): DeliveryStatus {
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

    // 4. Out for delivery (courier on road)
    if (['en_livraison', 'en_cours', 'distribue', 'out_for_delivery', 'en_tournee'].includes(s)) {
      return 'OUT_FOR_DELIVERY';
    }

    // 5. Delivered & COD collected
    if (['livre', 'delivered', 'livree', 'paye', 'encaisse', 'complete'].includes(s)) {
      return 'DELIVERED';
    }

    // 6. Failed attempt / Customer unavailable
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

    if (!this.apiToken) {
      return {
        providerCode: this.providerCode,
        success: true,
        message: 'Mode Sandbox/Mock actif (Aucun jeton API configuré, émulation locale active)',
        latencyMs: 15,
        environment: 'sandbox',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const response = await fetch(`${this.apiUrl}/ping?api_token=${this.apiToken}`, {
        headers: { 'Accept': 'application/json' },
      });

      const latencyMs = Date.now() - startTime;

      if (response.ok) {
        return {
          providerCode: this.providerCode,
          success: true,
          message: 'Connexion à l\'API EcoTrack établie avec succès',
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
}
