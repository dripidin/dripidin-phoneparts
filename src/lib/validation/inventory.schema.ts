// Zod Validation Schemas for Inventory Operations & Adjustments

import { z } from 'zod';

export const InventoryAdjustmentSchema = z.object({
  productId: z.string().uuid('ID de produit invalide'),
  transactionType: z.enum([
    'RECEIVING',
    'RESERVATION',
    'RESERVATION_RELEASE',
    'FULFILLMENT_OUT',
    'MANUAL_ADJUSTMENT',
    'DAMAGED_WRITEOFF',
    'CUSTOMER_RETURN_RESTOCK',
    'SUPPLIER_RETURN',
  ]),
  quantityChange: z.number().int().refine((val) => val !== 0, {
    message: 'La variation de quantité ne peut pas être égale à 0',
  }),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  warehouseBin: z.string().max(32).optional(),
  notes: z.string().max(500).optional(),
});

export const BatchReceiveInventorySchema = z.object({
  supplierId: z.string().uuid().optional(),
  purchaseOrderReference: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive('La quantité reçue doit être positive'),
      unitCostDzd: z.number().min(0).optional(),
      warehouseBin: z.string().optional(),
    })
  ).min(1, 'Au moins un article doit être spécifié'),
});

export type InventoryAdjustmentInput = z.infer<typeof InventoryAdjustmentSchema>;
export type BatchReceiveInventoryInput = z.infer<typeof BatchReceiveInventorySchema>;
