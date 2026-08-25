// HamzaPhone Import / Export Domain Types & Contracts
// Supports large-scale 4,000+ catalog synchronization, supplier mappings, dry-run diffs, and security boundaries

import type { ProductType } from '@/types/database.types';

export type ImportJobStatus =
  | 'UPLOADED'
  | 'PARSING'
  | 'VALIDATING'
  | 'READY_FOR_REVIEW'
  | 'APPLYING'
  | 'COMPLETED'
  | 'PARTIAL'
  | 'FAILED'
  | 'CANCELLED';

export type ImportMode =
  | 'CREATE_ONLY'      // Only insert strictly new SKUs; skip existing
  | 'UPDATE_ONLY'      // Only update matching existing products; skip new
  | 'UPSERT'           // Insert new and update existing
  | 'PRICE_ONLY'       // Only update supplier cost and optionally recalculate retail/wholesale
  | 'STOCK_ONLY';      // Only update stock quantities via receiving ledger

export type FileType = 'CSV' | 'XLSX';

export type ValidationSeverity = 'ERROR' | 'WARNING' | 'INFO';

/**
 * Standard HamzaPhone Canonical Field Names for Column Mapping
 */
export type CanonicalFieldKey =
  | 'sku'
  | 'supplier_sku'
  | 'barcode'
  | 'name'
  | 'brand_name'
  | 'category_path'
  | 'product_type'
  | 'cost_price_dzd'
  | 'b2c_price_dzd'
  | 'b2b_price_dzd'
  | 'stock_quantity'
  | 'low_stock_threshold'
  | 'weight_grams'
  | 'description'
  | 'short_description'
  | 'compatibility_raw';

export interface ColumnMappingConfig {
  [supplierHeader: string]: CanonicalFieldKey | 'IGNORE';
}

export interface SupplierMappingTemplate {
  id: string;
  supplierId: string;
  supplierName: string;
  templateName: string;
  mapping: ColumnMappingConfig;
  hasHeaderRow: boolean;
  delimiter?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RawParsedRow {
  rowNumber: number;
  data: Record<string, string | number | null | undefined>;
}

export interface ValidatedImportRow {
  rowNumber: number;
  rawSku?: string;
  resolvedSku?: string;
  existingProductId?: string | null;
  matchType: 'NEW' | 'EXISTING' | 'CONFLICT' | 'INVALID';
  canonicalData: Partial<{
    sku: string;
    supplier_sku: string | null;
    barcode: string | null;
    name: string | null;
    brand_name: string | null;
    category_path: string | null;
    product_type: ProductType | null;
    cost_price_dzd: number | null;
    b2c_price_dzd: number | null;
    b2b_price_dzd: number | null;
    stock_quantity: number | null;
    low_stock_threshold: number | null;
    weight_grams: number | null;
    description: string | null;
    short_description: string | null;
    compatibility_raw: string | null;
  }>;
  diff?: RowDiff;
  status: 'VALID' | 'WARNING' | 'ERROR';
  messages: Array<{
    severity: ValidationSeverity;
    field?: string;
    message: string;
  }>;
}

export interface RowDiff {
  costPrice?: { old: number; new: number; changePercent: number };
  b2cPrice?: { old: number; new: number; changePercent: number };
  b2bPrice?: { old: number; new: number; changePercent: number };
  stockQuantity?: { old: number; new: number; delta: number };
  name?: { old: string; new: string };
  brand?: { old: string; new: string };
  category?: { old: string; new: string };
  grossMarginPercent?: { old: number; new: number };
}

export interface ImportPreviewSummary {
  jobId: string;
  fileName: string;
  fileType: FileType;
  supplierId?: string | null;
  supplierName?: string | null;
  importMode: ImportMode;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  newCount: number;
  updateCount: number;
  unchangedCount: number;
  conflictCount: number;
  warningCount: number;
  errorCount: number;
  sampleRows: ValidatedImportRow[];
  totalStockDelta: number;
  averageCostChangePercent: number;
}

export interface ImportJobRecord {
  id: string;
  supplier_id?: string | null;
  supplier_name?: string | null;
  file_name: string;
  file_type: FileType;
  import_mode: ImportMode;
  status: ImportJobStatus;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  new_products: number;
  updated_products: number;
  unchanged_products: number;
  conflict_count: number;
  warning_count: number;
  error_count: number;
  column_mapping: ColumnMappingConfig;
  errors_summary: Array<{
    row: number;
    sku?: string;
    severity: ValidationSeverity;
    field?: string;
    message: string;
  }>;
  applied_by_email?: string | null;
  created_by?: string | null;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface ImportExecutionResult {
  jobId: string;
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED';
  totalProcessed: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  inventoryTransactionsRecorded: number;
  priceHistoriesRecorded: number;
  executionTimeMs: number;
  errorLog: Array<{
    row: number;
    sku: string;
    error: string;
  }>;
}

/**
 * Multi-Criteria Catalog Export Query Contract
 */
export interface CatalogExportFilter {
  categoryId?: string;
  brandId?: string;
  supplierId?: string;
  stockStatus?: 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  productStatus?: 'ALL' | 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  priceMinDzd?: number;
  priceMaxDzd?: number;
  searchQuery?: string;
  format: 'CSV' | 'XLSX';
  includeCostPrice?: boolean; // Granted only if user has pricing.read / products.export
}

export interface ExportResult {
  fileName: string;
  mimeType: string;
  dataBase64?: string;
  buffer?: Buffer;
  rowCount: number;
  exportedAt: string;
}
