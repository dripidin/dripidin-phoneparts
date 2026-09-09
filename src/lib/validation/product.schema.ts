// Zod Validation Schemas for Products, Catalog, and Compatibility

import { z } from 'zod';

export const DeviceCompatibilitySchema = z.object({
  brandName: z.string().min(1),
  brandSlug: z.string().min(1),
  modelName: z.string().min(1),
  modelSlug: z.string().min(1),
  modelCode: z.string().min(1),
  variants: z.array(z.string()).default([]),
  year: z.number().int().optional(),
  notes: z.string().optional(),
});

export const CreateProductSchema = z.object({
  sku: z.string().min(3, 'Le SKU doit comporter au moins 3 caractères').max(64),
  barcode: z.string().max(64).optional().nullable(),
  supplierSku: z.string().max(64).optional().nullable(),
  name: z.string().min(3, 'Le nom du produit est requis').max(255),
  slug: z.string().min(3).max(255).optional(),
  brandId: z.string().uuid('ID de marque invalide'),
  categoryId: z.string().uuid('ID de catégorie invalide'),
  productType: z.enum([
    'OEM_ORIGINAL',
    'SERVICE_PACK',
    'REFURBISHED',
    'HIGH_COPY',
    'AFTERMARKET',
    'ACCESSORY',
    'TOOL',
  ]),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED', 'DISCONTINUED']).default('DRAFT'),
  isVisible: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  shortDescription: z.string().max(500).optional().nullable(),
  description: z.string().optional().nullable(),
  mainImage: z
    .string()
    .min(1, "L'image principale est requise")
    .refine(
      (val) =>
        val.startsWith('http://') ||
        val.startsWith('https://') ||
        val.startsWith('/') ||
        val.startsWith('catalog/') ||
        val.startsWith('products/'),
      { message: "Format d'URL ou chemin d'image invalide" }
    )
    .default('/images/placeholder-product.webp'),
  gallery: z.array(z.string().min(1)).default([]),
  
  // Financials in DZD
  costPriceDzd: z.number().min(0, 'Le prix de revient ne peut pas être négatif'),
  b2cPriceDzd: z.number().min(0, 'Le prix B2C ne peut pas être négatif'),
  b2cSalePriceDzd: z.number().min(0).optional().nullable(),
  b2bPriceDzd: z.number().min(0, 'Le prix B2B ne peut pas être négatif'),
  
  // Initial Stock
  stockQuantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  weightGrams: z.number().min(0).default(50.0),
  dimensionsCm: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
  }).optional(),
  
  compatibility: z.array(DeviceCompatibilitySchema).default([]),
  primarySupplierId: z.string().uuid().optional().nullable(),
});

export const UpdateProductSchema = CreateProductSchema.partial().extend({
  id: z.string().uuid().optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type DeviceCompatibilityInput = z.infer<typeof DeviceCompatibilitySchema>;
