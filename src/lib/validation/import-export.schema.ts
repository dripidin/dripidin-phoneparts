// Zod Validation Schemas for CSV & Excel Streaming Imports

import { z } from 'zod';

export const ImportRowSchema = z.object({
  sku: z.string().min(3).max(64),
  barcode: z.string().max(64).optional().nullable(),
  supplier_sku: z.string().max(64).optional().nullable(),
  name: z.string().min(2).max(255),
  brand_name: z.string().min(2).max(100),
  category_name: z.string().min(2).max(150),
  product_type: z.enum([
    'OEM_ORIGINAL',
    'SERVICE_PACK',
    'REFURBISHED',
    'HIGH_COPY',
    'AFTERMARKET',
    'ACCESSORY',
    'TOOL',
  ]).default('AFTERMARKET'),
  cost_price_dzd: z.coerce.number().min(0),
  b2c_price_dzd: z.coerce.number().min(0),
  b2c_sale_price_dzd: z.coerce.number().min(0).optional().nullable(),
  b2b_price_dzd: z.coerce.number().min(0),
  stock_quantity: z.coerce.number().int().min(0).default(0),
  low_stock_threshold: z.coerce.number().int().min(0).default(5),
  weight_grams: z.coerce.number().min(1).default(50),
  compatibility_raw: z.string().optional().nullable(),
  supplier_code: z.string().optional().nullable(),
});

export const ImportBatchConfigSchema = z.object({
  conflictMode: z.enum(['UPDATE_EXISTING', 'PRICES_ONLY', 'STOCK_ONLY', 'SKIP_EXISTING']).default('UPDATE_EXISTING'),
  autoCreateMissingBrands: z.boolean().default(true),
  autoCreateMissingCategories: z.boolean().default(true),
  defaultWarehouseBin: z.string().default('DEFAULT'),
});

export type ImportRow = z.infer<typeof ImportRowSchema>;
export type ImportBatchConfig = z.infer<typeof ImportBatchConfigSchema>;
