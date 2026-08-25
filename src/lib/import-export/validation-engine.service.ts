// HamzaPhone Import Validation Engine & Conflict Detector
// Comprehensive row-level schema checks, in-file duplicate detection, DB collision analysis, and diff computation

import { z } from 'zod';
import type {
  ColumnMappingConfig,
  CanonicalFieldKey,
  RawParsedRow,
  ValidatedImportRow,
  ValidationSeverity,
  ImportMode,
  RowDiff,
} from './types';
import type { ProductType } from '@/types/database.types';

export const RawCanonicalRowSchema = z.object({
  sku: z.string().min(2, 'Le code SKU doit comporter au moins 2 caractères').max(64, 'SKU trop long (max 64 caractères)'),
  supplier_sku: z.string().max(64).optional().nullable(),
  barcode: z.string().max(64).optional().nullable(),
  name: z.string().min(3, 'Le nom du produit doit comporter au moins 3 caractères').max(255).optional().nullable(),
  brand_name: z.string().max(100).optional().nullable(),
  category_path: z.string().max(255).optional().nullable(),
  product_type: z.enum([
    'OEM_ORIGINAL',
    'SERVICE_PACK',
    'REFURBISHED',
    'HIGH_COPY',
    'AFTERMARKET',
    'ACCESSORY',
    'TOOL',
  ]).optional().nullable(),
  cost_price_dzd: z.coerce.number().positive('Le prix d’achat doit être strictement positif (> 0)').optional().nullable(),
  b2c_price_dzd: z.coerce.number().positive('Le prix public B2C doit être strictement positif (> 0)').optional().nullable(),
  b2b_price_dzd: z.coerce.number().positive('Le prix grossiste B2B doit être strictement positif (> 0)').optional().nullable(),
  stock_quantity: z.coerce.number().int('La quantité doit être un entier').min(0, 'Le stock ne peut pas être négatif').optional().nullable(),
  low_stock_threshold: z.coerce.number().int().min(0).optional().nullable(),
  weight_grams: z.coerce.number().positive().optional().nullable(),
  description: z.string().optional().nullable(),
  short_description: z.string().optional().nullable(),
  compatibility_raw: z.string().optional().nullable(),
});

export interface ExistingProductLookup {
  id: string;
  sku: string;
  barcode?: string | null;
  supplierSku?: string | null;
  name: string;
  brandName?: string | null;
  categoryName?: string | null;
  costPriceDzd: number;
  b2cPriceDzd: number;
  b2bPriceDzd: number;
  stockQuantity: number;
  availableStock: number;
}

export class ValidationEngineService {
  /**
   * Validate a complete batch of parsed rows against mapping, in-file duplicates, and existing database products
   */
  public static validateBatch(
    rows: RawParsedRow[],
    mapping: ColumnMappingConfig,
    importMode: ImportMode,
    existingProductsMap: Map<string, ExistingProductLookup>, // key: normalized SKU
    existingBarcodesMap: Map<string, ExistingProductLookup> = new Map() // key: barcode
  ): ValidatedImportRow[] {
    const validatedRows: ValidatedImportRow[] = [];
    const seenFileSkus = new Map<string, number>(); // sku -> first rowNumber
    const seenFileBarcodes = new Map<string, number>(); // barcode -> first rowNumber

    for (const rawRow of rows) {
      const rowMessages: Array<{ severity: ValidationSeverity; field?: string; message: string }> = [];
      const canonicalData: Record<string, any> = {};

      // 1. Transform raw supplier columns into canonical fields based on mapping
      for (const [header, canonicalKey] of Object.entries(mapping)) {
        if (canonicalKey === 'IGNORE' || !canonicalKey) continue;
        const cellValue = rawRow.data[header];
        if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
          canonicalData[canonicalKey] = cellValue;
        }
      }

      // 2. Validate SKU presence
      const rawSku = canonicalData.sku ? String(canonicalData.sku).trim() : '';
      if (!rawSku) {
        validatedRows.push({
          rowNumber: rawRow.rowNumber,
          rawSku: undefined,
          resolvedSku: undefined,
          existingProductId: null,
          matchType: 'INVALID',
          canonicalData: {},
          status: 'ERROR',
          messages: [{ severity: 'ERROR', field: 'sku', message: 'Colonne SKU vide ou non mappée' }],
        });
        continue;
      }

      const normalizedSku = rawSku.toUpperCase();
      canonicalData.sku = normalizedSku;

      // 3. Check for in-file SKU duplicates
      if (seenFileSkus.has(normalizedSku)) {
        const firstRow = seenFileSkus.get(normalizedSku)!;
        rowMessages.push({
          severity: 'ERROR',
          field: 'sku',
          message: `SKU dupliqué dans le fichier (déjà présent à la ligne ${firstRow})`,
        });
      } else {
        seenFileSkus.set(normalizedSku, rawRow.rowNumber);
      }

      // 4. Check for in-file Barcode duplicates
      const rawBarcode = canonicalData.barcode ? String(canonicalData.barcode).trim() : null;
      if (rawBarcode) {
        if (seenFileBarcodes.has(rawBarcode)) {
          const firstRow = seenFileBarcodes.get(rawBarcode)!;
          rowMessages.push({
            severity: 'WARNING',
            field: 'barcode',
            message: `Code-barres dupliqué dans le fichier (déjà présent à la ligne ${firstRow})`,
          });
        } else {
          seenFileBarcodes.set(rawBarcode, rawRow.rowNumber);
        }
      }

      // 5. Schema Type Coercion & Bounds Validation with Zod
      const parseResult = RawCanonicalRowSchema.safeParse(canonicalData);
      if (!parseResult.success) {
        for (const issue of parseResult.error.issues) {
          rowMessages.push({
            severity: 'ERROR',
            field: issue.path.join('.'),
            message: issue.message,
          });
        }
      }

      const parsedData = parseResult.success ? parseResult.data : canonicalData;

      // 6. Mode-Specific Mandatory Field Checks
      if (importMode === 'CREATE_ONLY' || importMode === 'UPSERT') {
        if (!parsedData.name && !existingProductsMap.has(normalizedSku)) {
          rowMessages.push({
            severity: 'ERROR',
            field: 'name',
            message: 'La désignation du produit est obligatoire pour la création d’un nouvel article',
          });
        }
      }

      if (importMode === 'PRICE_ONLY') {
        if (parsedData.cost_price_dzd === undefined && parsedData.b2c_price_dzd === undefined) {
          rowMessages.push({
            severity: 'ERROR',
            field: 'cost_price_dzd',
            message: 'Le mode "Mise à jour Prix" requiert au minimum un prix d’achat ou un prix public',
          });
        }
      }

      if (importMode === 'STOCK_ONLY') {
        if (parsedData.stock_quantity === undefined) {
          rowMessages.push({
            severity: 'ERROR',
            field: 'stock_quantity',
            message: 'Le mode "Mise à jour Stock" requiert une quantité en stock',
          });
        }
      }

      // 7. Match against Database Catalog
      const existingProduct = existingProductsMap.get(normalizedSku);
      let matchType: ValidatedImportRow['matchType'] = existingProduct ? 'EXISTING' : 'NEW';
      let diff: RowDiff | undefined;

      if (importMode === 'CREATE_ONLY' && existingProduct) {
        rowMessages.push({
          severity: 'WARNING',
          field: 'sku',
          message: `Le produit existe déjà dans le catalogue (SKU: ${normalizedSku}) - sera ignoré en mode CRÉATION SEULE`,
        });
      }

      if (importMode === 'UPDATE_ONLY' && !existingProduct) {
        rowMessages.push({
          severity: 'WARNING',
          field: 'sku',
          message: `Produit introuvable dans le catalogue (SKU: ${normalizedSku}) - sera ignoré en mode MODIFICATION SEULE`,
        });
      }

      // Check external barcode conflict with a different SKU in DB
      if (rawBarcode && existingBarcodesMap.has(rawBarcode)) {
        const barcodeConflict = existingBarcodesMap.get(rawBarcode)!;
        if (barcodeConflict.sku.toUpperCase() !== normalizedSku) {
          matchType = 'CONFLICT';
          rowMessages.push({
            severity: 'ERROR',
            field: 'barcode',
            message: `Conflit code-barres : ${rawBarcode} est déjà assigné à l’article ${barcodeConflict.sku} ("${barcodeConflict.name}")`,
          });
        }
      }

      // 8. Calculate Before/After Diffs & Margins
      if (existingProduct) {
        diff = {};
        const oldCost = existingProduct.costPriceDzd;
        const newCost = parsedData.cost_price_dzd !== undefined ? parsedData.cost_price_dzd : oldCost;

        const oldB2c = existingProduct.b2cPriceDzd;
        const newB2c = parsedData.b2c_price_dzd !== undefined ? parsedData.b2c_price_dzd : oldB2c;

        const oldB2b = existingProduct.b2bPriceDzd;
        const newB2b = parsedData.b2b_price_dzd !== undefined ? parsedData.b2b_price_dzd : oldB2b;

        const oldStock = existingProduct.stockQuantity;
        const newStock = parsedData.stock_quantity !== undefined ? parsedData.stock_quantity : oldStock;

        if (parsedData.cost_price_dzd !== undefined && parsedData.cost_price_dzd !== oldCost) {
          const changePercent = oldCost > 0 ? Number((((newCost - oldCost) / oldCost) * 100).toFixed(1)) : 0;
          diff.costPrice = { old: oldCost, new: newCost, changePercent };

          // Price spike warning (> 50% increase or > 50% drop)
          if (Math.abs(changePercent) >= 50) {
            rowMessages.push({
              severity: 'WARNING',
              field: 'cost_price_dzd',
              message: `Variation importante du coût d’achat (${changePercent > 0 ? '+' : ''}${changePercent}%) : ${oldCost} -> ${newCost} DZD`,
            });
          }
        }

        if (parsedData.b2c_price_dzd !== undefined && parsedData.b2c_price_dzd !== oldB2c) {
          const changePercent = oldB2c > 0 ? Number((((newB2c - oldB2c) / oldB2c) * 100).toFixed(1)) : 0;
          diff.b2cPrice = { old: oldB2c, new: newB2c, changePercent };
        }

        if (parsedData.b2b_price_dzd !== undefined && parsedData.b2b_price_dzd !== oldB2b) {
          const changePercent = oldB2b > 0 ? Number((((newB2b - oldB2b) / oldB2b) * 100).toFixed(1)) : 0;
          diff.b2bPrice = { old: oldB2b, new: newB2b, changePercent };
        }

        if (parsedData.stock_quantity !== undefined && parsedData.stock_quantity !== oldStock) {
          diff.stockQuantity = { old: oldStock, new: newStock, delta: newStock - oldStock };
        }

        // Margin Safety Analysis
        const oldMargin = oldB2c > 0 ? Number((((oldB2c - oldCost) / oldB2c) * 100).toFixed(1)) : 0;
        const newMargin = newB2c > 0 ? Number((((newB2c - newCost) / newB2c) * 100).toFixed(1)) : 0;
        diff.grossMarginPercent = { old: oldMargin, new: newMargin };

        if (newB2c < newCost) {
          rowMessages.push({
            severity: 'WARNING',
            field: 'b2c_price_dzd',
            message: `Vente à perte détectée : Prix public (${newB2c} DZD) inférieur au prix d’achat (${newCost} DZD)`,
          });
        } else if (newMargin < 10 && newMargin >= 0) {
          rowMessages.push({
            severity: 'WARNING',
            field: 'b2c_price_dzd',
            message: `Marge commerciale très faible (${newMargin}%) sur cette référence`,
          });
        }
      }

      // 9. Aggregate Row Status
      const hasErrors = rowMessages.some((m) => m.severity === 'ERROR');
      const hasWarnings = rowMessages.some((m) => m.severity === 'WARNING');
      const status = hasErrors ? 'ERROR' : hasWarnings ? 'WARNING' : 'VALID';

      validatedRows.push({
        rowNumber: rawRow.rowNumber,
        rawSku,
        resolvedSku: normalizedSku,
        existingProductId: existingProduct?.id || null,
        matchType,
        canonicalData: parsedData,
        diff,
        status,
        messages: rowMessages,
      });
    }

    return validatedRows;
  }
}
