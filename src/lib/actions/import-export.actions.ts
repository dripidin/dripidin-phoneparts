'use server';

// HamzaPhone Import / Export Server Actions
// Hardened with Immediate Server-Side Permission Verification & Audit Logging

import { createServerClient } from '@/lib/auth/server';
import { requirePermission, requireStaff } from '@/lib/permissions/guards';
import { ImportJobService } from '@/lib/import-export/import-job.service';
import { ColumnMapperService } from '@/lib/import-export/column-mapper.service';
import { ExportService, type ExportProductRecord } from '@/lib/import-export/export.service';
import type {
  FileType,
  ImportMode,
  ColumnMappingConfig,
  CatalogExportFilter,
  SupplierMappingTemplate,
} from '@/lib/import-export/types';
import { adminStore } from '@/lib/admin-store';

/**
 * Step 1: Upload and parse import file, auto-detect mapping, and return dry-run validation preview
 */
export async function uploadAndParseImportAction(params: {
  fileName: string;
  fileType: FileType;
  fileContentBase64: string;
  supplierId?: string | null;
  supplierName?: string | null;
  importMode?: ImportMode;
  customMapping?: ColumnMappingConfig;
}) {
  const supabase = createServerClient();
  const authContext = await requirePermission(supabase, 'imports.create');

  const buffer = Buffer.from(params.fileContentBase64, 'base64');
  const fileContent = params.fileType === 'CSV' ? buffer.toString('utf-8') : buffer;

  const result = await ImportJobService.createAndValidateJob(
    {
      fileName: params.fileName,
      fileType: params.fileType,
      fileContent,
      supplierId: params.supplierId,
      supplierName: params.supplierName,
      importMode: params.importMode || 'UPSERT',
      customMapping: params.customMapping,
      actorEmail: authContext.email,
      actorUserId: authContext.userId,
    },
    supabase
  );

  return result;
}

/**
 * Step 2: Revalidate staged job with customized column mapping or modified import mode
 */
export async function updateJobMappingAction(params: {
  jobId: string;
  mapping: ColumnMappingConfig;
  mode: ImportMode;
}) {
  const supabase = createServerClient();
  await requirePermission(supabase, 'imports.create');

  const preview = await ImportJobService.updateJobMappingAndRevalidate(
    params.jobId,
    params.mapping,
    params.mode,
    supabase
  );

  return preview;
}

/**
 * Step 3: Fetch paginated & filtered preview rows for deep inspection
 */
export async function getJobPreviewRowsAction(params: {
  jobId: string;
  filter?: 'ALL' | 'NEW' | 'UPDATED' | 'UNCHANGED' | 'WARNINGS' | 'ERRORS' | 'CONFLICTS';
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  const supabase = createServerClient();
  await requirePermission(supabase, 'imports.read');

  return ImportJobService.getJobPreviewRows(
    params.jobId,
    params.filter || 'ALL',
    params.page || 1,
    params.pageSize || 50,
    params.search || ''
  );
}

/**
 * Step 4: Apply Confirmed Import Job (Transactional execution & stock ledger)
 */
export async function applyImportJobAction(params: { jobId: string }) {
  const supabase = createServerClient();
  const authContext = await requirePermission(supabase, 'imports.apply');

  const result = await ImportJobService.applyJob(params.jobId, authContext, supabase);
  return result;
}

/**
 * Cancel unapplied import job
 */
export async function cancelImportJobAction(params: { jobId: string }) {
  const supabase = createServerClient();
  const authContext = await requirePermission(supabase, 'imports.cancel');

  ImportJobService.cancelJob(params.jobId, authContext);
  return { success: true };
}

/**
 * Generate and download CSV Error & Change Report
 */
export async function downloadJobReportAction(params: { jobId: string }) {
  const supabase = createServerClient();
  await requirePermission(supabase, 'imports.read');

  const csv = ImportJobService.generateJobReportCsv(params.jobId);
  return {
    fileName: `HamzaPhone_Rapport_Import_${params.jobId}.csv`,
    csvContent: csv,
  };
}

/**
 * List Import Job History
 */
export async function getImportJobsHistoryAction() {
  const supabase = createServerClient();
  await requirePermission(supabase, 'imports.read');

  return ImportJobService.listRecentJobs();
}

/**
 * Export Catalog with Multi-Criteria Filters & Permission-Based Cost Price Shielding
 */
export async function exportCatalogDataAction(filter: CatalogExportFilter) {
  const supabase = createServerClient();
  const authContext = await requirePermission(supabase, 'products.export');

  // Determine if user has permission to see and export confidential cost prices
  const canViewCostPrice = authContext.permissions.has('all') || authContext.permissions.has('pricing.read');
  const enrichedFilter: CatalogExportFilter = {
    ...filter,
    includeCostPrice: canViewCostPrice,
  };

  // Load products from admin store or database
  const catalog = adminStore.getProducts({ pageSize: 10000 });
  const exportRecords: ExportProductRecord[] = catalog.items.map((p) => ({
    sku: p.sku,
    name: p.name,
    brand_name: p.brandName,
    category_name: p.categoryName,
    barcode: p.barcode,
    product_type: p.productType,
    cost_price_dzd: p.costPriceDzd,
    b2c_price_dzd: p.b2cPriceDzd,
    b2b_price_dzd: p.b2bPriceDzd,
    stock_quantity: p.stockQuantity,
    reserved_stock: p.reservedStock,
    available_stock: p.availableStock,
    low_stock_threshold: p.lowStockThreshold || 5,
    is_active: p.status === 'ACTIVE',
    supplier_name: p.supplierName,
  }));

  const result = await ExportService.exportCatalog(enrichedFilter, exportRecords);

  // Record Audit Log
  await (supabase.from('audit_logs') as any).insert({
    actor_email: authContext.email,
    actor_role: authContext.role,
    action: 'EXPORT_GENERATED',
    entity_type: 'CATALOG_EXPORT',
    entity_id: result.fileName,
    new_values: {
      format: filter.format,
      rowCount: result.rowCount,
      includeCostPrice: canViewCostPrice,
      filter,
    },
  });

  return result;
}

/**
 * Retrieve Supplier Mapping Templates
 */
export async function getSupplierMappingTemplatesAction() {
  const supabase = createServerClient();
  await requirePermission(supabase, 'suppliers.read');

  return ColumnMapperService.listSupplierTemplates();
}

/**
 * Save Supplier Mapping Template
 */
export async function saveSupplierMappingTemplateAction(template: Omit<SupplierMappingTemplate, 'id' | 'createdAt' | 'updatedAt'>) {
  const supabase = createServerClient();
  const authContext = await requirePermission(supabase, 'suppliers.update');

  const saved = ColumnMapperService.saveSupplierTemplate(template);

  await (supabase.from('audit_logs') as any).insert({
    actor_email: authContext.email,
    actor_role: authContext.role,
    action: 'SUPPLIER_TEMPLATE_SAVED',
    entity_type: 'SUPPLIER_TEMPLATE',
    entity_id: saved.id,
    new_values: saved,
  });

  return saved;
}
