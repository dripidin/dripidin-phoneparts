// HamzaPhone Catalog Export Service: Multi-Criteria Filtering & Role-Based Column Protection
// Exports formatted CSV and XLSX sheets while strictly protecting confidential cost prices and sensitive tokens

import * as XLSX from 'xlsx';
import type { CatalogExportFilter, ExportResult } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { FileParserService } from './file-parser.service';

export interface ExportProductRecord {
  sku: string;
  name: string;
  brand_name?: string | null;
  category_name?: string | null;
  barcode?: string | null;
  product_type?: string | null;
  cost_price_dzd?: number;
  b2c_price_dzd: number;
  b2b_price_dzd: number;
  stock_quantity: number;
  reserved_stock: number;
  available_stock: number;
  low_stock_threshold: number;
  is_active: boolean;
  supplier_name?: string | null;
}

export class ExportService {
  /**
   * Export catalog based on multi-criteria filter and target format (CSV / XLSX)
   */
  public static async exportCatalog(
    filter: CatalogExportFilter,
    productsData: ExportProductRecord[]
  ): Promise<ExportResult> {
    const filteredProducts = this.applyFilters(productsData, filter);
    const rows = this.formatRowsForExport(filteredProducts, filter.includeCostPrice ?? false);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    if (filter.format === 'XLSX') {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Catalogue_HamzaPhone');

      const xlsxBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      const base64Data = Buffer.from(xlsxBuffer).toString('base64');

      return {
        fileName: `HamzaPhone_Export_Catalogue_${timestamp}.xlsx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dataBase64: base64Data,
        rowCount: rows.length,
        exportedAt: new Date().toISOString(),
      };
    }

    // Default: CSV format with UTF-8 BOM
    const csvContent = this.generateCsvContent(rows);
    const base64Data = Buffer.from('\uFEFF' + csvContent, 'utf-8').toString('base64');

    return {
      fileName: `HamzaPhone_Export_Catalogue_${timestamp}.csv`,
      mimeType: 'text/csv;charset=utf-8;',
      dataBase64: base64Data,
      rowCount: rows.length,
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Apply server-side filters
   */
  private static applyFilters(products: ExportProductRecord[], filter: CatalogExportFilter): ExportProductRecord[] {
    return products.filter((p) => {
      const availStock = p.available_stock !== undefined ? p.available_stock : (p as any).availableStock ?? 0;
      const lowStockThresh = p.low_stock_threshold !== undefined ? p.low_stock_threshold : (p as any).lowStockThreshold ?? 5;

      // Stock Status filter
      if (filter.stockStatus === 'IN_STOCK' && availStock <= 0) return false;
      if (filter.stockStatus === 'LOW_STOCK' && (availStock <= 0 || availStock > lowStockThresh)) return false;
      if (filter.stockStatus === 'OUT_OF_STOCK' && availStock > 0) return false;

      // Product Status
      if (filter.productStatus === 'ACTIVE' && !p.is_active) return false;

      // Price Range
      if (filter.priceMinDzd !== undefined && p.b2c_price_dzd < filter.priceMinDzd) return false;
      if (filter.priceMaxDzd !== undefined && p.b2c_price_dzd > filter.priceMaxDzd) return false;

      // Search Query
      if (filter.searchQuery && filter.searchQuery.trim()) {
        const q = filter.searchQuery.toLowerCase().trim();
        const matchesSku = p.sku.toLowerCase().includes(q);
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBrand = (p.brand_name || '').toLowerCase().includes(q);
        if (!matchesSku && !matchesName && !matchesBrand) return false;
      }

      return true;
    });
  }

  /**
   * Format objects with role-based column protection (shielding cost_price_dzd if not permitted)
   */
  private static formatRowsForExport(products: ExportProductRecord[], includeCostPrice: boolean): Record<string, any>[] {
    return products.map((p) => {
      const row: Record<string, any> = {
        'Code_Article_SKU': FileParserService.sanitizeFormulaInjection(p.sku),
        'Designation': FileParserService.sanitizeFormulaInjection(p.name),
        'Marque': FileParserService.sanitizeFormulaInjection(p.brand_name || ''),
        'Categorie': FileParserService.sanitizeFormulaInjection(p.category_name || ''),
        'Code_Barres': FileParserService.sanitizeFormulaInjection(p.barcode || ''),
        'Qualite_Grade': p.product_type || '',
      };

      // Cost Price Column (Only for authorized roles)
      if (includeCostPrice) {
        row['Prix_Achat_DZD'] = p.cost_price_dzd ?? 0;
      }

      row['Prix_Public_B2C_DZD'] = p.b2c_price_dzd;
      row['Prix_Grossiste_B2B_DZD'] = p.b2b_price_dzd;
      row['Stock_Physique'] = p.stock_quantity;
      row['Stock_Reserve'] = p.reserved_stock;
      row['Stock_Disponible'] = p.available_stock;
      row['Statut'] = p.is_active ? 'Actif' : 'Inactif';

      return row;
    });
  }

  /**
   * Build RFC4180 CSV string
   */
  private static generateCsvContent(rows: Record<string, any>[]): string {
    if (rows.length === 0) return '';

    const headers = Object.keys(rows[0]);
    const headerLine = headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(',');

    const dataLines = rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? '';
          return typeof val === 'number' ? val : `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    return [headerLine, ...dataLines].join('\n');
  }
}
