// Zod Validation Schemas for Delivery Operations, EcoTrack Webhooks & Shipping Rates

import { z } from 'zod';

export const CreateShipmentSchema = z.object({
  orderId: z.string().uuid('ID de commande invalide'),
  providerCode: z.string().default('ECOTRACK'),
});

export const CancelShipmentSchema = z.object({
  orderId: z.string().uuid('ID de commande invalide'),
  reason: z.string().max(255).optional().default('Annulation demandée par le gestionnaire'),
});

export const CalculateDeliveryRateSchema = z.object({
  wilayaCode: z.number().int().min(1).max(58, 'Code de Wilaya invalide (1 à 58)'),
  deliveryType: z.enum(['HOME', 'DESK']).default('HOME'),
  subtotalDzd: z.number().nonnegative().optional().default(0),
  providerCode: z.string().optional().default('ECOTRACK'),
});

export const EcoTrackWebhookPayloadSchema = z.object({
  event_id: z.string().optional(),
  tracking_code: z.string().min(1, 'Code de suivi manquant'),
  reference: z.string().optional(), // Order number e.g. HP-2026-123456
  status: z.string().min(1, 'Statut manquant'),
  status_text: z.string().optional(),
  wilaya_name: z.string().optional(),
  timestamp: z.string().optional(),
  montant: z.number().optional(),
  secret_token: z.string().optional(),
});

export const ShipmentsFilterSchema = z.object({
  search: z.string().optional(),
  providerCode: z.string().optional(),
  status: z.enum([
    'PENDING',
    'PICKED_UP',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'FAILED',
    'RETURNED',
    'CANCELLED',
  ]).optional(),
  wilayaCode: z.number().int().min(1).max(58).optional(),
  deliveryType: z.enum(['HOME', 'DESK']).optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

export type CreateShipmentInputSchema = z.infer<typeof CreateShipmentSchema>;
export type CancelShipmentInputSchema = z.infer<typeof CancelShipmentSchema>;
export type CalculateDeliveryRateInputSchema = z.infer<typeof CalculateDeliveryRateSchema>;
export type EcoTrackWebhookPayload = z.infer<typeof EcoTrackWebhookPayloadSchema>;
export type ShipmentsFilterInput = z.infer<typeof ShipmentsFilterSchema>;
