// Zod Validation Schemas for Pricing, Bulk Modifiers and B2B Tier Overrides

import { z } from 'zod';

export const BulkPriceAdjustmentSchema = z.object({
  scope: z.enum(['ALL', 'SUPPLIER', 'BRAND', 'CATEGORY', 'SELECTED_SKUS']),
  scopeTargetId: z.string().optional(),
  selectedSkus: z.array(z.string()).optional(),
  targetField: z.enum(['B2C_PRICE', 'B2B_PRICE', 'BOTH']),
  percentageChange: z.number().min(-90, 'La réduction ne peut excéder 90%').max(500, 'L\'augmentation ne peut excéder 500%'),
  roundingUnitDzd: z.union([z.literal(10), z.literal(50), z.literal(100)]).default(10),
  allowBelowCostOverride: z.boolean().default(false),
  justification: z.string().min(5, 'Une justification est requise pour consigner l\'ajustement').max(255),
});

export const SetB2BTierPriceSchema = z.object({
  productId: z.string().uuid(),
  tierId: z.string().uuid(),
  priceDzd: z.number().min(0, 'Le prix de gros doit être positif'),
  minQuantity: z.number().int().min(1).default(1),
});

export const SetCustomerSpecificPriceSchema = z.object({
  businessId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  productId: z.string().uuid(),
  customPriceDzd: z.number().min(0, 'Le prix personnalisé doit être positif'),
  validUntil: z.string().datetime().optional().nullable(),
  notes: z.string().max(255).optional(),
}).refine((data) => data.businessId || data.userId, {
  message: 'L\'ID d\'entreprise ou d\'utilisateur doit être fourni',
});

export type BulkPriceAdjustmentInput = z.infer<typeof BulkPriceAdjustmentSchema>;
export type SetB2BTierPriceInput = z.infer<typeof SetB2BTierPriceSchema>;
export type SetCustomerSpecificPriceInput = z.infer<typeof SetCustomerSpecificPriceSchema>;
