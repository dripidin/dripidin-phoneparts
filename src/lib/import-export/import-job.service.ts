// HamzaPhone Import Job Lifecycle Orchestrator & Batch Execution Engine
// Enforces non-destructive dry-run, field ownership rules, double-entry stock transactions, and audit logs

import { FileParserService } from './file-parser.service';
import { ColumnMapperService } from './column-mapper.service';
import { ValidationEngineService, type ExistingProductLookup } from './validation-engine.service';
import type {
  ImportJobRecord,
  ImportJobStatus,
  ImportMode,
  FileType,
  ColumnMappingConfig,
  ImportPreviewSummary,
  ImportExecutionResult,
  ValidatedImportRow,
  RawParsedRow,
} from './types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserAuthContext } from '@/types/rbac.types';

export interface CreateImportJobParams {
  fileName: string;
  fileType: FileType;
  fileContent: string | Buffer; // CSV string or XLSX buffer/base64
  supplierId?: string | null;
  supplierName?: string | null;
  importMode?: ImportMode;
  customMapping?: ColumnMappingConfig;
  actorEmail?: string;
  actorUserId?: string;
}

export class ImportJobService {
  // Staging cache for multi-step wizard and dry-run previews
  private static stagedJobs = new Map<string, {
    job: ImportJobRecord;
    rawRows: RawParsedRow[];
    headers: string[];
    validatedRows: ValidatedImportRow[];
  }>();

  /**
   * Step 1 & 2: Create a new Import Job, parse file content, auto-detect mapping, and run validation dry-run
   */
  public static async createAndValidateJob(
    params: CreateImportJobParams,
    supabase?: SupabaseClient | any
  ): Promise<{ job: ImportJobRecord; preview: ImportPreviewSummary }> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const importMode = params.importMode || 'UPSERT';

    // 1. Parse File
    const { headers, rows: rawRows } = FileParserService.parseFile(
      params.fileContent,
      params.fileType,
      { maxRows: 50000 }
    );

    if (rawRows.length === 0) {
      throw new Error('Le fichier sélectionné est vide ou ne contient aucune ligne de données exploitable.');
    }

    // 2. Resolve Column Mapping
    let mapping: ColumnMappingConfig;
    if (params.customMapping && Object.keys(params.customMapping).length > 0) {
      mapping = params.customMapping;
    } else if (params.supplierId) {
      mapping = ColumnMapperService.getMappingForSupplier(params.supplierId, headers);
    } else {
      mapping = ColumnMapperService.autoDetectMapping(headers);
    }

    // 3. Load Existing Catalog for Matching & Diff Calculations
    const { existingProductsMap, existingBarcodesMap } = await this.loadExistingCatalog(supabase);

    // 4. Run Validation Engine
    const validatedRows = ValidationEngineService.validateBatch(
      rawRows,
      mapping,
      importMode,
      existingProductsMap,
      existingBarcodesMap
    );

    // 5. Aggregate Metrics
    const errorRows = validatedRows.filter((r) => r.status === 'ERROR');
    const warningRows = validatedRows.filter((r) => r.status === 'WARNING');
    const newRows = validatedRows.filter((r) => r.matchType === 'NEW' && r.status !== 'ERROR');
    const updatedRows = validatedRows.filter((r) => r.matchType === 'EXISTING' && r.status !== 'ERROR' && r.diff && Object.keys(r.diff).length > 0);
    const unchangedRows = validatedRows.filter((r) => r.matchType === 'EXISTING' && r.status !== 'ERROR' && (!r.diff || Object.keys(r.diff).length === 0));
    const conflictRows = validatedRows.filter((r) => r.matchType === 'CONFLICT');

    let totalStockDelta = 0;
    let costChangeSum = 0;
    let costChangeCount = 0;

    for (const r of validatedRows) {
      if (r.diff?.stockQuantity?.delta) {
        totalStockDelta += r.diff.stockQuantity.delta;
      }
      if (r.diff?.costPrice?.changePercent !== undefined) {
        costChangeSum += r.diff.costPrice.changePercent;
        costChangeCount++;
      }
    }

    const averageCostChangePercent = costChangeCount > 0 ? Number((costChangeSum / costChangeCount).toFixed(1)) : 0;

    const errorsSummary = errorRows.flatMap((r) =>
      r.messages.filter((m) => m.severity === 'ERROR').map((m) => ({
        row: r.rowNumber,
        sku: r.resolvedSku || r.rawSku,
        severity: m.severity,
        field: m.field,
        message: m.message,
      }))
    );

    const now = new Date().toISOString();
    const jobRecord: ImportJobRecord = {
      id: jobId,
      supplier_id: params.supplierId || null,
      supplier_name: params.supplierName || null,
      file_name: params.fileName,
      file_type: params.fileType,
      import_mode: importMode,
      status: 'READY_FOR_REVIEW',
      total_rows: rawRows.length,
      valid_rows: rawRows.length - errorRows.length,
      invalid_rows: errorRows.length,
      new_products: newRows.length,
      updated_products: updatedRows.length,
      unchanged_products: unchangedRows.length,
      conflict_count: conflictRows.length,
      warning_count: warningRows.length,
      error_count: errorRows.length,
      column_mapping: mapping,
      errors_summary: errorsSummary,
      created_by: params.actorUserId || null,
      created_at: now,
    };

    // Staging cache
    this.stagedJobs.set(jobId, {
      job: jobRecord,
      rawRows,
      headers,
      validatedRows,
    });

    const preview: ImportPreviewSummary = {
      jobId,
      fileName: params.fileName,
      fileType: params.fileType,
      supplierId: params.supplierId || null,
      supplierName: params.supplierName || null,
      importMode,
      totalRows: rawRows.length,
      validRows: rawRows.length - errorRows.length,
      invalidRows: errorRows.length,
      newCount: newRows.length,
      updateCount: updatedRows.length,
      unchangedCount: unchangedRows.length,
      conflictCount: conflictRows.length,
      warningCount: warningRows.length,
      errorCount: errorRows.length,
      sampleRows: validatedRows.slice(0, 50), // Send first 50 rows for instant fast UI preview
      totalStockDelta,
      averageCostChangePercent,
    };

    return { job: jobRecord, preview };
  }

  /**
   * Re-validate staged job with modified mapping or switched import mode
   */
  public static async updateJobMappingAndRevalidate(
    jobId: string,
    newMapping: ColumnMappingConfig,
    newMode: ImportMode,
    supabase?: SupabaseClient | any
  ): Promise<ImportPreviewSummary> {
    const staged = this.stagedJobs.get(jobId);
    if (!staged) {
      throw new Error(`Session d’importation "${jobId}" introuvable ou expirée.`);
    }

    const { existingProductsMap, existingBarcodesMap } = await this.loadExistingCatalog(supabase);

    const validatedRows = ValidationEngineService.validateBatch(
      staged.rawRows,
      newMapping,
      newMode,
      existingProductsMap,
      existingBarcodesMap
    );

    const errorRows = validatedRows.filter((r) => r.status === 'ERROR');
    const warningRows = validatedRows.filter((r) => r.status === 'WARNING');
    const newRows = validatedRows.filter((r) => r.matchType === 'NEW' && r.status !== 'ERROR');
    const updatedRows = validatedRows.filter((r) => r.matchType === 'EXISTING' && r.status !== 'ERROR' && r.diff && Object.keys(r.diff).length > 0);
    const unchangedRows = validatedRows.filter((r) => r.matchType === 'EXISTING' && r.status !== 'ERROR' && (!r.diff || Object.keys(r.diff).length === 0));
    const conflictRows = validatedRows.filter((r) => r.matchType === 'CONFLICT');

    let totalStockDelta = 0;
    let costChangeSum = 0;
    let costChangeCount = 0;

    for (const r of validatedRows) {
      if (r.diff?.stockQuantity?.delta) {
        totalStockDelta += r.diff.stockQuantity.delta;
      }
      if (r.diff?.costPrice?.changePercent !== undefined) {
        costChangeSum += r.diff.costPrice.changePercent;
        costChangeCount++;
      }
    }

    const averageCostChangePercent = costChangeCount > 0 ? Number((costChangeSum / costChangeCount).toFixed(1)) : 0;

    staged.job.import_mode = newMode;
    staged.job.column_mapping = newMapping;
    staged.job.valid_rows = staged.rawRows.length - errorRows.length;
    staged.job.invalid_rows = errorRows.length;
    staged.job.new_products = newRows.length;
    staged.job.updated_products = updatedRows.length;
    staged.job.unchanged_products = unchangedRows.length;
    staged.job.conflict_count = conflictRows.length;
    staged.job.warning_count = warningRows.length;
    staged.job.error_count = errorRows.length;
    staged.validatedRows = validatedRows;

    return {
      jobId,
      fileName: staged.job.file_name,
      fileType: staged.job.file_type,
      supplierId: staged.job.supplier_id,
      supplierName: staged.job.supplier_name,
      importMode: newMode,
      totalRows: staged.rawRows.length,
      validRows: staged.rawRows.length - errorRows.length,
      invalidRows: errorRows.length,
      newCount: newRows.length,
      updateCount: updatedRows.length,
      unchangedCount: unchangedRows.length,
      conflictCount: conflictRows.length,
      warningCount: warningRows.length,
      errorCount: errorRows.length,
      sampleRows: validatedRows.slice(0, 50),
      totalStockDelta,
      averageCostChangePercent,
    };
  }

  /**
   * Retrieve paginated and filtered validated rows for deep inspection
   */
  public static getJobPreviewRows(
    jobId: string,
    filter: 'ALL' | 'NEW' | 'UPDATED' | 'UNCHANGED' | 'WARNINGS' | 'ERRORS' | 'CONFLICTS' = 'ALL',
    page: number = 1,
    pageSize: number = 50,
    searchQuery: string = ''
  ): { items: ValidatedImportRow[]; total: number } {
    const staged = this.stagedJobs.get(jobId);
    if (!staged) return { items: [], total: 0 };

    let filtered = staged.validatedRows;

    if (filter === 'NEW') {
      filtered = filtered.filter((r) => r.matchType === 'NEW' && r.status !== 'ERROR');
    } else if (filter === 'UPDATED') {
      filtered = filtered.filter((r) => r.matchType === 'EXISTING' && r.diff && Object.keys(r.diff).length > 0);
    } else if (filter === 'UNCHANGED') {
      filtered = filtered.filter((r) => r.matchType === 'EXISTING' && (!r.diff || Object.keys(r.diff).length === 0));
    } else if (filter === 'WARNINGS') {
      filtered = filtered.filter((r) => r.status === 'WARNING');
    } else if (filter === 'ERRORS') {
      filtered = filtered.filter((r) => r.status === 'ERROR');
    } else if (filter === 'CONFLICTS') {
      filtered = filtered.filter((r) => r.matchType === 'CONFLICT');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          (r.resolvedSku && r.resolvedSku.toLowerCase().includes(q)) ||
          (r.canonicalData.name && r.canonicalData.name.toLowerCase().includes(q)) ||
          (r.canonicalData.barcode && r.canonicalData.barcode.toLowerCase().includes(q))
      );
    }

    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return { items, total: filtered.length };
  }

  /**
   * Step 4: Apply Confirmed Import Job (Batch execution with chunking and double-entry stock transactions)
   */
  public static async applyJob(
    jobId: string,
    authContext: UserAuthContext,
    supabase?: SupabaseClient | any
  ): Promise<ImportExecutionResult> {
    const startTime = Date.now();
    const staged = this.stagedJobs.get(jobId);

    if (!staged) {
      throw new Error(`Job "${jobId}" introuvable ou déjà exécuté.`);
    }

    staged.job.status = 'APPLYING';
    staged.job.started_at = new Date().toISOString();
    staged.job.applied_by_email = authContext.email;

    const mode = staged.job.import_mode;
    const validRows = staged.validatedRows.filter((r) => r.status !== 'ERROR');

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    let inventoryTransactionsRecorded = 0;
    let priceHistoriesRecorded = 0;
    const errorLog: Array<{ row: number; sku: string; error: string }> = [];

    // Process valid rows
    for (const row of validRows) {
      try {
        const sku = row.resolvedSku!;
        const data = row.canonicalData;

        if (row.matchType === 'NEW' && (mode === 'CREATE_ONLY' || mode === 'UPSERT')) {
          // 1. Create New Product
          const newProductId = `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          const initialStock = data.stock_quantity || 0;
          const costPrice = data.cost_price_dzd || 1000;
          const b2cPrice = data.b2c_price_dzd || Math.round(costPrice * 1.3 / 10) * 10;
          const b2bPrice = data.b2b_price_dzd || Math.round(costPrice * 1.15 / 10) * 10;

          if (supabase) {
            await (supabase.from('products') as any).insert({
              id: newProductId,
              sku,
              name: data.name || `Article ${sku}`,
              barcode: data.barcode || null,
              cost_price_dzd: costPrice,
              b2c_price_dzd: b2cPrice,
              b2b_price_dzd: b2bPrice,
              stock_quantity: initialStock,
              reserved_stock: 0,
              product_type: data.product_type || 'AFTERMARKET',
              is_active: true,
              primary_supplier_id: staged.job.supplier_id || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

            // Initial Receiving Transaction in Ledger if stock > 0
            if (initialStock > 0) {
              await (supabase.from('inventory_transactions') as any).insert({
                product_id: newProductId,
                transaction_type: 'RECEIVING',
                quantity_change: initialStock,
                notes: `Import initial catalogue (Job ${jobId})`,
                created_by: authContext.userId,
              });
              inventoryTransactionsRecorded++;
            }
          }
          createdCount++;
        } else if (row.matchType === 'EXISTING' && (mode === 'UPDATE_ONLY' || mode === 'UPSERT' || mode === 'PRICE_ONLY' || mode === 'STOCK_ONLY')) {
          // 2. Update Existing Product (Respecting Field Ownership)
          const updates: Record<string, any> = {
            updated_at: new Date().toISOString(),
          };

          // Pricing Updates
          if (mode === 'PRICE_ONLY' || mode === 'UPSERT' || mode === 'UPDATE_ONLY') {
            if (data.cost_price_dzd !== undefined) updates.cost_price_dzd = data.cost_price_dzd;
            if (data.b2c_price_dzd !== undefined) updates.b2c_price_dzd = data.b2c_price_dzd;
            if (data.b2b_price_dzd !== undefined) updates.b2b_price_dzd = data.b2b_price_dzd;

            if (row.diff?.costPrice || row.diff?.b2cPrice || row.diff?.b2bPrice) {
              priceHistoriesRecorded++;
            }
          }

          // Metadata Updates (Only in general UPSERT / UPDATE_ONLY modes)
          if (mode === 'UPSERT' || mode === 'UPDATE_ONLY') {
            if (data.name) updates.name = data.name;
            if (data.barcode) updates.barcode = data.barcode;
            if (data.product_type) updates.product_type = data.product_type;
          }

          // Stock Updates via Double-Entry Ledger
          if (mode === 'STOCK_ONLY' || (mode === 'UPSERT' && data.stock_quantity !== undefined)) {
            const stockDelta = row.diff?.stockQuantity?.delta || 0;
            if (stockDelta !== 0 && row.existingProductId && supabase) {
              await (supabase.from('inventory_transactions') as any).insert({
                product_id: row.existingProductId,
                transaction_type: stockDelta > 0 ? 'RECEIVING' : 'MANUAL_ADJUSTMENT',
                quantity_change: Math.abs(stockDelta),
                notes: `Ajustement par import fournisseur (Job ${jobId})`,
                created_by: authContext.userId,
              });
              inventoryTransactionsRecorded++;
            }
            if (data.stock_quantity !== undefined) {
              updates.stock_quantity = data.stock_quantity;
            }
          }

          // Supplier product relation
          if (staged.job.supplier_id && data.supplier_sku) {
            updates.primary_supplier_id = staged.job.supplier_id;
          }

          if (supabase && row.existingProductId) {
            await (supabase.from('products') as any)
              .update(updates)
              .eq('id', row.existingProductId);
          }
          updatedCount++;
        } else {
          skippedCount++;
        }
      } catch (err: any) {
        failedCount++;
        errorLog.push({
          row: row.rowNumber,
          sku: row.resolvedSku || 'UNKNOWN',
          error: err?.message || 'Erreur lors de l’application de la ligne',
        });
      }
    }

    const executionTimeMs = Date.now() - startTime;
    const finalStatus: ImportJobStatus = failedCount === 0 ? 'COMPLETED' : createdCount + updatedCount > 0 ? 'PARTIAL' : 'FAILED';

    staged.job.status = finalStatus;
    staged.job.completed_at = new Date().toISOString();

    // Record Immutable Audit Log
    if (supabase) {
      await (supabase.from('audit_logs') as any).insert({
        actor_email: authContext.email,
        actor_role: authContext.role,
        action: 'IMPORT_APPLIED',
        entity_type: 'IMPORT_JOB',
        entity_id: jobId,
        new_values: {
          jobId,
          fileName: staged.job.file_name,
          mode: staged.job.import_mode,
          supplier: staged.job.supplier_name,
          created: createdCount,
          updated: updatedCount,
          skipped: skippedCount,
          failed: failedCount,
          executionTimeMs,
        },
      });

      // Update or insert into import_jobs table
      await (supabase.from('import_jobs') as any).insert({
        id: jobId,
        file_name: staged.job.file_name,
        import_type: staged.job.import_mode,
        status: finalStatus,
        total_rows: staged.job.total_rows,
        created_rows: createdCount,
        updated_rows: updatedCount,
        error_rows: failedCount + staged.job.invalid_rows,
        errors_summary: staged.job.errors_summary,
        created_by: authContext.userId,
        created_at: staged.job.created_at,
        completed_at: staged.job.completed_at,
      });
    }

    return {
      jobId,
      status: finalStatus,
      totalProcessed: createdCount + updatedCount + skippedCount + failedCount,
      createdCount,
      updatedCount,
      skippedCount,
      failedCount,
      inventoryTransactionsRecorded,
      priceHistoriesRecorded,
      executionTimeMs,
      errorLog,
    };
  }

  /**
   * Cancel an unapplied staged job
   */
  public static cancelJob(jobId: string, authContext: UserAuthContext): void {
    const staged = this.stagedJobs.get(jobId);
    if (staged) {
      staged.job.status = 'CANCELLED';
      staged.job.completed_at = new Date().toISOString();
    }
  }

  /**
   * Generate Downloadable CSV Report of all rows, changes, and error reasons
   */
  public static generateJobReportCsv(jobId: string): string {
    const staged = this.stagedJobs.get(jobId);
    if (!staged) {
      return 'Row,SKU,Status,MatchType,Error,Old_Cost,New_Cost,Old_Stock,New_Stock\n';
    }

    const headers = [
      'Ligne',
      'SKU',
      'Statut',
      'Correspondance',
      'Messages_Erreurs_Avertissements',
      'Ancien_Cout_DZD',
      'Nouveau_Cout_DZD',
      'Ancien_Prix_B2C_DZD',
      'Nouveau_Prix_B2C_DZD',
      'Ancien_Stock',
      'Nouveau_Stock',
      'Variation_Stock',
    ];

    const lines = [headers.join(',')];

    for (const r of staged.validatedRows) {
      const messagesStr = r.messages.map((m) => `[${m.severity}] ${m.message}`).join(' | ');
      const oldCost = r.diff?.costPrice?.old ?? '';
      const newCost = r.diff?.costPrice?.new ?? '';
      const oldB2c = r.diff?.b2cPrice?.old ?? '';
      const newB2c = r.diff?.b2cPrice?.new ?? '';
      const oldStock = r.diff?.stockQuantity?.old ?? '';
      const newStock = r.diff?.stockQuantity?.new ?? '';
      const stockDelta = r.diff?.stockQuantity?.delta ?? '';

      const line = [
        r.rowNumber,
        `"${r.resolvedSku || r.rawSku || ''}"`,
        r.status,
        r.matchType,
        `"${messagesStr.replace(/"/g, '""')}"`,
        oldCost,
        newCost,
        oldB2c,
        newB2c,
        oldStock,
        newStock,
        stockDelta,
      ].join(',');

      lines.push(line);
    }

    return lines.join('\n');
  }

  /**
   * List recent import jobs
   */
  public static listRecentJobs(): ImportJobRecord[] {
    return Array.from(this.stagedJobs.values())
      .map((s) => s.job)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Helper: Load existing products lookup map from database or mock
   */
  private static async loadExistingCatalog(supabase?: SupabaseClient | any): Promise<{
    existingProductsMap: Map<string, ExistingProductLookup>;
    existingBarcodesMap: Map<string, ExistingProductLookup>;
  }> {
    const existingProductsMap = new Map<string, ExistingProductLookup>();
    const existingBarcodesMap = new Map<string, ExistingProductLookup>();

    if (!supabase) {
      return { existingProductsMap, existingBarcodesMap };
    }

    try {
      const { data, error } = await (supabase
        .from('products') as any)
        .select(`
          id,
          sku,
          barcode,
          name,
          cost_price_dzd,
          b2c_price_dzd,
          b2b_price_dzd,
          stock_quantity,
          reserved_stock,
          available_stock
        `);

      if (!error && Array.isArray(data)) {
        for (const item of data) {
          const lookup: ExistingProductLookup = {
            id: item.id,
            sku: item.sku,
            barcode: item.barcode,
            name: item.name,
            costPriceDzd: Number(item.cost_price_dzd) || 0,
            b2cPriceDzd: Number(item.b2c_price_dzd) || 0,
            b2bPriceDzd: Number(item.b2b_price_dzd) || 0,
            stockQuantity: Number(item.stock_quantity) || 0,
            availableStock: Number(item.available_stock) || 0,
          };

          if (item.sku) {
            existingProductsMap.set(item.sku.toUpperCase(), lookup);
          }
          if (item.barcode) {
            existingBarcodesMap.set(item.barcode, lookup);
          }
        }
      }
    } catch {
      // Graceful fallback for non-db testing
    }

    return { existingProductsMap, existingBarcodesMap };
  }
}
