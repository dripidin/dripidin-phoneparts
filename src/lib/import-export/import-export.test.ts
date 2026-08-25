// HamzaPhone Import / Export & Bulk Catalog Management Test Suite
// Rigorous verification of CSV/XLSX parsing, column mapping, validation, duplicate detection,
// dry-run diff calculation, double-entry inventory ledger, export permissions, and 4,000+ row scaling.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FileParserService } from './file-parser.service';
import { ColumnMapperService } from './column-mapper.service';
import { ValidationEngineService, type ExistingProductLookup } from './validation-engine.service';
import { ImportJobService } from './import-job.service';
import { ExportService, type ExportProductRecord } from './export.service';
import type { ColumnMappingConfig, ValidatedImportRow } from './types';
import type { UserAuthContext } from '@/types/rbac.types';
import * as XLSX from 'xlsx';

// Mock Supabase Database Client for Import/Export Testing
function createMockImportSupabase() {
  const products: any[] = [
    {
      id: 'prod-001',
      sku: 'HP-SCR-SAM-S21',
      barcode: '613000000001',
      name: 'Écran Samsung Galaxy S21 OLED Original',
      cost_price_dzd: 14000,
      b2c_price_dzd: 18500,
      b2b_price_dzd: 16000,
      stock_quantity: 15,
      reserved_stock: 2,
      available_stock: 13,
      product_type: 'OEM_ORIGINAL',
      is_active: true,
      primary_supplier_id: 'sup-01',
    },
    {
      id: 'prod-002',
      sku: 'HP-BAT-IPH-13',
      barcode: '613000000002',
      name: 'Batterie iPhone 13 Originale 3227mAh',
      cost_price_dzd: 3500,
      b2c_price_dzd: 5200,
      b2b_price_dzd: 4200,
      stock_quantity: 40,
      reserved_stock: 5,
      available_stock: 35,
      product_type: 'SERVICE_PACK',
      is_active: true,
      primary_supplier_id: 'sup-01',
    },
  ];

  const inventoryTransactions: any[] = [];
  const auditLogs: any[] = [];
  const importJobs: any[] = [];

  const mockClient: any = {
    _products: products,
    _inventoryTransactions: inventoryTransactions,
    _auditLogs: auditLogs,
    _importJobs: importJobs,
    from: (table: string) => {
      let dataset: any[] = [];
      if (table === 'products') dataset = products;
      else if (table === 'inventory_transactions') dataset = inventoryTransactions;
      else if (table === 'audit_logs') dataset = auditLogs;
      else if (table === 'import_jobs') dataset = importJobs;

      return {
        select: (cols: string = '*') => {
          return {
            order: () => Promise.resolve({ data: dataset, error: null }),
            then: (resolve: any) => resolve({ data: dataset, error: null }),
          };
        },
        insert: async (data: any) => {
          const arr = Array.isArray(data) ? data : [data];
          for (const item of arr) {
            const row = { id: `id-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, ...item };
            dataset.push(row);
          }
          return { data: arr, error: null };
        },
        update: (updates: any) => {
          return {
            eq: async (field: string, val: any) => {
              const target = dataset.find((r) => r[field] === val);
              if (target) Object.assign(target, updates);
              return { data: updates, error: null };
            },
          };
        },
      };
    },
  };

  return mockClient;
}

const mockStaffContext: UserAuthContext = {
  userId: 'user-staff-01',
  email: 'admin@hamzaphone.dz',
  userType: 'STAFF',
  role: 'ADMINISTRATOR',
  permissions: new Set(['all', 'imports.create', 'imports.apply', 'imports.export', 'pricing.read', 'products.export']),
  isActive: true,
};

describe('HamzaPhone Supplier Import / Export & Bulk Catalog Management Engine', () => {
  // --------------------------------------------------------------------------
  // 1. CSV & XLSX File Parsing & Security Sanitization
  // --------------------------------------------------------------------------
  describe('1. File Parser Service (CSV, XLSX, Delimiters & Formula Sanitization)', () => {
    it('should sniff comma, semicolon and tab delimiters correctly', () => {
      const csvComma = 'SKU,Name,Price\nHP-01,Screen,5000\nHP-02,Battery,3000';
      const csvSemi = 'SKU;Designation;Prix\nHP-01;Écran;5000\nHP-02;Batterie;3000';
      const csvTab = 'SKU\tName\tPrice\nHP-01\tScreen\t5000';

      assert.strictEqual(FileParserService.sniffDelimiter(csvComma), ',');
      assert.strictEqual(FileParserService.sniffDelimiter(csvSemi), ';');
      assert.strictEqual(FileParserService.sniffDelimiter(csvTab), '\t');
    });

    it('should sanitize formula injection strings (=, +, -, @) safely', () => {
      assert.strictEqual(FileParserService.sanitizeFormulaInjection('=SUM(A1:A10)'), "'=SUM(A1:A10)");
      assert.strictEqual(FileParserService.sanitizeFormulaInjection('+123456789'), "'+123456789");
      assert.strictEqual(FileParserService.sanitizeFormulaInjection('-CMD|calc'), "'-CMD|calc");
      assert.strictEqual(FileParserService.sanitizeFormulaInjection('@macro()'), "'@macro()");
      assert.strictEqual(FileParserService.sanitizeFormulaInjection('Safe Product Name'), 'Safe Product Name');
    });

    it('should parse CSV with quoted multiline strings, escaped quotes and empty lines', () => {
      const csv = `SKU,Name,Cost_DZD,Stock
"HP-SCR-01","Screen OLED ""Super"", High Brightness",12000,20

"HP-BAT-01","Battery 3000mAh",3500,50
`;
      const { headers, rows } = FileParserService.parseCsv(csv);
      assert.strictEqual(headers.length, 4);
      assert.strictEqual(headers[0], 'SKU');
      assert.strictEqual(rows.length, 2);
      assert.strictEqual(rows[0].data['SKU'], 'HP-SCR-01');
      assert.strictEqual(rows[0].data['Name'], 'Screen OLED "Super", High Brightness');
      assert.strictEqual(rows[0].data['Stock'], '20');
      assert.strictEqual(rows[1].data['SKU'], 'HP-BAT-01');
    });

    it('should parse XLSX binary workbook into structured rows', () => {
      const wsData = [
        ['Code Article', 'Designation', 'Prix Achat', 'Quantite'],
        ['HP-XLSX-01', 'Connecteur de charge Type-C', '450', '100'],
        ['HP-XLSX-02', 'Vitre Arriere Verre Trempé', '1200', '35'],
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const { headers, rows } = FileParserService.parseXlsx(buffer);
      assert.strictEqual(headers.length, 4);
      assert.strictEqual(headers[0], 'Code Article');
      assert.strictEqual(rows.length, 2);
      assert.strictEqual(rows[0].data['Code Article'], 'HP-XLSX-01');
      assert.strictEqual(rows[1].data['Designation'], 'Vitre Arriere Verre Trempé');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Intelligent Column Mapping & Supplier Templates
  // --------------------------------------------------------------------------
  describe('2. Column Mapper Service (Auto-Detection & Templates)', () => {
    it('should auto-detect standard English and French column variations', () => {
      const headers = ['Ref_Fournisseur', 'Designation_Article', 'Prix_Achat_DZD', 'Qte_Stock', 'Code_Barre'];
      const mapping = ColumnMapperService.autoDetectMapping(headers);

      assert.strictEqual(mapping['Ref_Fournisseur'], 'supplier_sku');
      assert.strictEqual(mapping['Designation_Article'], 'name');
      assert.strictEqual(mapping['Prix_Achat_DZD'], 'cost_price_dzd');
      assert.strictEqual(mapping['Qte_Stock'], 'stock_quantity');
      assert.strictEqual(mapping['Code_Barre'], 'barcode');
    });

    it('should save and recall custom supplier mapping template', () => {
      const template = ColumnMapperService.saveSupplierTemplate({
        supplierId: 'sup-shenzhen-99',
        supplierName: 'Shenzhen Global Parts Ltd',
        templateName: 'Shenzhen Master Template',
        mapping: {
          'Item_No': 'sku',
          'Item_Description': 'name',
          'Unit_Price_RMB': 'cost_price_dzd',
          'Inventory_Units': 'stock_quantity',
        },
        hasHeaderRow: true,
      });

      assert.ok(template.id);
      assert.strictEqual(template.supplierId, 'sup-shenzhen-99');

      const headers = ['Item_No', 'Item_Description', 'Unit_Price_RMB', 'Inventory_Units', 'Extra_Col'];
      const resolved = ColumnMapperService.getMappingForSupplier('sup-shenzhen-99', headers);

      assert.strictEqual(resolved['Item_No'], 'sku');
      assert.strictEqual(resolved['Unit_Price_RMB'], 'cost_price_dzd');
      assert.strictEqual(resolved['Extra_Col'], 'IGNORE');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Validation Engine & Conflict Detection
  // --------------------------------------------------------------------------
  describe('3. Validation Engine (Schema, Bounds, In-File Duplicates & DB Conflicts)', () => {
    const existingProductsMap = new Map<string, ExistingProductLookup>([
      [
        'HP-SCR-SAM-S21',
        {
          id: 'prod-001',
          sku: 'HP-SCR-SAM-S21',
          barcode: '613000000001',
          name: 'Écran Samsung Galaxy S21 OLED Original',
          costPriceDzd: 14000,
          b2cPriceDzd: 18500,
          b2bPriceDzd: 16000,
          stockQuantity: 15,
          availableStock: 13,
        },
      ],
    ]);

    const existingBarcodesMap = new Map<string, ExistingProductLookup>([
      ['613000000001', existingProductsMap.get('HP-SCR-SAM-S21')!],
    ]);

    it('should detect in-file duplicate SKUs and flag subsequent lines with ERROR', () => {
      const rawRows = [
        { rowNumber: 2, data: { SKU: 'HP-CAM-IPH12', Name: 'Caméra iPhone 12', Cost: '4500' } },
        { rowNumber: 3, data: { SKU: 'HP-CAM-IPH12', Name: 'Caméra iPhone 12 bis', Cost: '4600' } },
      ];
      const mapping: ColumnMappingConfig = { SKU: 'sku', Name: 'name', Cost: 'cost_price_dzd' };

      const validated = ValidationEngineService.validateBatch(rawRows, mapping, 'UPSERT', existingProductsMap, existingBarcodesMap);

      assert.strictEqual(validated[0].status, 'VALID');
      assert.strictEqual(validated[1].status, 'ERROR');
      assert.ok(validated[1].messages.some((m) => m.message.includes('SKU dupliqué dans le fichier')));
    });

    it('should detect barcode conflict against existing database product with different SKU', () => {
      const rawRows = [
        { rowNumber: 2, data: { SKU: 'HP-NEW-PART-99', Name: 'Pièce Inconnue', Barcode: '613000000001', Cost: '1000' } },
      ];
      const mapping: ColumnMappingConfig = { SKU: 'sku', Name: 'name', Barcode: 'barcode', Cost: 'cost_price_dzd' };

      const validated = ValidationEngineService.validateBatch(rawRows, mapping, 'UPSERT', existingProductsMap, existingBarcodesMap);

      assert.strictEqual(validated[0].matchType, 'CONFLICT');
      assert.strictEqual(validated[0].status, 'ERROR');
      assert.ok(validated[0].messages.some((m) => m.message.includes('Conflit code-barres')));
    });

    it('should calculate price diffs, percentage changes, and warn on negative margin / selling below cost', () => {
      const rawRows = [
        {
          rowNumber: 2,
          data: {
            SKU: 'HP-SCR-SAM-S21',
            Cost: '16000', // Increased from 14000 (+14.3%)
            B2C: '15000',  // Selling below cost!
          },
        },
      ];
      const mapping: ColumnMappingConfig = { SKU: 'sku', Cost: 'cost_price_dzd', B2C: 'b2c_price_dzd' };

      const validated = ValidationEngineService.validateBatch(rawRows, mapping, 'PRICE_ONLY', existingProductsMap, existingBarcodesMap);

      assert.strictEqual(validated[0].status, 'WARNING');
      assert.strictEqual(validated[0].diff?.costPrice?.old, 14000);
      assert.strictEqual(validated[0].diff?.costPrice?.new, 16000);
      assert.strictEqual(validated[0].diff?.costPrice?.changePercent, 14.3);
      assert.ok(validated[0].messages.some((m) => m.message.includes('Vente à perte')));
    });
  });

  // --------------------------------------------------------------------------
  // 4. Import Job Lifecycle & Modes Execution (UPSERT, PRICE_ONLY, STOCK_ONLY)
  // --------------------------------------------------------------------------
  describe('4. Import Job Service Lifecycle & Modes', () => {
    it('should create and validate import job in dry-run mode without mutating DB', async () => {
      const mockDb = createMockImportSupabase();
      const csv = `SKU,Name,Cost,Stock
HP-SCR-SAM-S21,Écran Samsung Galaxy S21 OLED Original,14500,25
HP-NEW-PIECE-01,Connecteur FPC Carte Mère S21,850,50
`;
      const { job, preview } = await ImportJobService.createAndValidateJob(
        {
          fileName: 'fournisseur_sample.csv',
          fileType: 'CSV',
          fileContent: csv,
          importMode: 'UPSERT',
          customMapping: { SKU: 'sku', Name: 'name', Cost: 'cost_price_dzd', Stock: 'stock_quantity' },
        },
        mockDb
      );

      assert.strictEqual(preview.totalRows, 2);
      assert.strictEqual(preview.newCount, 1);
      assert.strictEqual(preview.updateCount, 1);
      assert.strictEqual(preview.invalidRows, 0);
      assert.strictEqual(job.status, 'READY_FOR_REVIEW');

      // Verify no DB mutations occurred during preview
      assert.strictEqual(mockDb._products.length, 2);
      assert.strictEqual(mockDb._inventoryTransactions.length, 0);
    });

    it('should apply confirmed job, update existing, insert new, and record double-entry stock ledger', async () => {
      const mockDb = createMockImportSupabase();
      const csv = `SKU,Name,Cost,Stock
HP-SCR-SAM-S21,Écran Samsung Galaxy S21 OLED Original,15000,30
HP-NEW-OLED-A52,Écran Samsung A52 Service Pack,9500,20
`;
      const { job } = await ImportJobService.createAndValidateJob(
        {
          fileName: 'arrivee_stock.csv',
          fileType: 'CSV',
          fileContent: csv,
          importMode: 'UPSERT',
          customMapping: { SKU: 'sku', Name: 'name', Cost: 'cost_price_dzd', Stock: 'stock_quantity' },
        },
        mockDb
      );

      const result = await ImportJobService.applyJob(job.id, mockStaffContext, mockDb);

      assert.strictEqual(result.status, 'COMPLETED');
      assert.strictEqual(result.createdCount, 1);
      assert.strictEqual(result.updatedCount, 1);
      assert.strictEqual(result.failedCount, 0);

      // Verify double-entry stock ledger entries were inserted
      assert.ok(result.inventoryTransactionsRecorded >= 2);
      assert.ok(mockDb._inventoryTransactions.some((t: any) => t.transaction_type === 'RECEIVING'));

      // Verify audit log
      assert.ok(mockDb._auditLogs.some((l: any) => l.action === 'IMPORT_APPLIED'));
    });

    it('should generate downloadable CSV report detailing all lines, diffs and errors', async () => {
      const mockDb = createMockImportSupabase();
      const csv = `SKU,Name,Cost,Stock
HP-SCR-SAM-S21,Écran S21,14200,18
HP-INVALID-NO-NAME,,1000,10
`;
      const { job } = await ImportJobService.createAndValidateJob(
        {
          fileName: 'test_report.csv',
          fileType: 'CSV',
          fileContent: csv,
          importMode: 'CREATE_ONLY',
          customMapping: { SKU: 'sku', Name: 'name', Cost: 'cost_price_dzd', Stock: 'stock_quantity' },
        },
        mockDb
      );

      const reportCsv = ImportJobService.generateJobReportCsv(job.id);
      assert.ok(reportCsv.includes('Ligne,SKU,Statut,Correspondance'));
      assert.ok(reportCsv.includes('HP-SCR-SAM-S21'));
      assert.ok(reportCsv.includes('HP-INVALID-NO-NAME'));
    });
  });

  // --------------------------------------------------------------------------
  // 5. Large Dataset Scaling (4000+ rows)
  // --------------------------------------------------------------------------
  describe('5. High-Scale Catalog Processing (4,000+ Rows)', () => {
    it('should parse and validate 4,000 rows in less than 500ms', async () => {
      const rows: string[] = ['SKU,Name,Cost_DZD,B2C_Price_DZD,Stock'];
      for (let i = 1; i <= 4000; i++) {
        rows.push(`HP-ITEM-${i},"Smartphone Replacement Component Ref ${i}",${1000 + (i % 50) * 100},${1500 + (i % 50) * 150},${i % 20}`);
      }
      const largeCsv = rows.join('\n');

      const startTime = Date.now();
      const { headers, rows: parsedRows } = FileParserService.parseCsv(largeCsv);
      const parseTime = Date.now() - startTime;

      assert.strictEqual(parsedRows.length, 4000);
      assert.ok(parseTime < 500, `Parse time ${parseTime}ms should be under 500ms`);

      const mapping: ColumnMappingConfig = {
        SKU: 'sku',
        Name: 'name',
        Cost_DZD: 'cost_price_dzd',
        B2C_Price_DZD: 'b2c_price_dzd',
        Stock: 'stock_quantity',
      };

      const validateStartTime = Date.now();
      const validated = ValidationEngineService.validateBatch(parsedRows, mapping, 'UPSERT', new Map());
      const validateTime = Date.now() - validateStartTime;

      assert.strictEqual(validated.length, 4000);
      assert.ok(validateTime < 1000, `Validation time ${validateTime}ms should be under 1000ms`);
      assert.strictEqual(validated.filter((r) => r.status === 'VALID').length, 4000);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Catalog Export & Role-Based Cost Price Shielding
  // --------------------------------------------------------------------------
  describe('6. Export Service & Role-Based Column Protection', () => {
    const products: ExportProductRecord[] = [
      {
        sku: 'HP-OLED-01',
        name: 'Écran OLED Samsung',
        brand_name: 'Samsung',
        category_name: 'Écrans',
        cost_price_dzd: 12000,
        b2c_price_dzd: 16000,
        b2b_price_dzd: 14000,
        stock_quantity: 20,
        reserved_stock: 0,
        available_stock: 20,
        low_stock_threshold: 5,
        is_active: true,
      },
      {
        sku: 'HP-BAT-02',
        name: 'Batterie iPhone',
        brand_name: 'Apple',
        category_name: 'Batteries',
        cost_price_dzd: 3000,
        b2c_price_dzd: 4500,
        b2b_price_dzd: 3800,
        stock_quantity: 0,
        reserved_stock: 0,
        available_stock: 0,
        low_stock_threshold: 5,
        is_active: true,
      },
    ];

    it('should include cost_price_dzd in export ONLY when includeCostPrice is true', async () => {
      const authorizedExport = await ExportService.exportCatalog(
        { format: 'CSV', includeCostPrice: true },
        products
      );
      const csvAuthorized = Buffer.from(authorizedExport.dataBase64!, 'base64').toString('utf-8');
      assert.ok(csvAuthorized.includes('Prix_Achat_DZD'));
      assert.ok(csvAuthorized.includes('12000'));

      const publicExport = await ExportService.exportCatalog(
        { format: 'CSV', includeCostPrice: false },
        products
      );
      const csvPublic = Buffer.from(publicExport.dataBase64!, 'base64').toString('utf-8');
      assert.ok(!csvPublic.includes('Prix_Achat_DZD'));
      assert.ok(!csvPublic.includes('12000'));
    });

    it('should filter export by stock status (e.g. IN_STOCK)', async () => {
      const result = await ExportService.exportCatalog(
        { format: 'CSV', stockStatus: 'IN_STOCK' },
        products
      );
      assert.strictEqual(result.rowCount, 1);
      const csv = Buffer.from(result.dataBase64!, 'base64').toString('utf-8');
      assert.ok(csv.includes('HP-OLED-01'));
      assert.ok(!csv.includes('HP-BAT-02'));
    });

    it('should generate valid XLSX workbook binary export', async () => {
      const result = await ExportService.exportCatalog(
        { format: 'XLSX', includeCostPrice: false },
        products
      );
      assert.strictEqual(result.mimeType, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      assert.ok(result.dataBase64 && result.dataBase64.length > 100);

      // Verify that SheetJS can read back the generated XLSX base64
      const wb = XLSX.read(result.dataBase64, { type: 'base64' });
      assert.strictEqual(wb.SheetNames[0], 'Catalogue_HamzaPhone');
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      assert.strictEqual(rows.length, 2);
    });
  });
});
