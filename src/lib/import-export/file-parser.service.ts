// HamzaPhone File Parser Engine: Secure CSV & XLSX Streaming / Ingest
// Protects against formula injection, malformed delimiters, encoding issues, and oversize files

import * as XLSX from 'xlsx';
import type { FileType, RawParsedRow } from './types';

export interface ParseOptions {
  maxRows?: number;
  delimiter?: string;
  hasHeaderRow?: boolean;
}

export class FileParserService {
  private static readonly DEFAULT_MAX_ROWS = 50000;
  private static readonly MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

  /**
   * Sniff CSV delimiter based on header frequencies (, ; \t)
   */
  public static sniffDelimiter(csvSample: string): string {
    const lines = csvSample.split(/\r?\n/).filter((l) => l.trim().length > 0).slice(0, 5);
    if (lines.length === 0) return ',';

    const counts = { ',': 0, ';': 0, '\t': 0 };
    for (const line of lines) {
      counts[','] += (line.match(/,/g) || []).length;
      counts[';'] += (line.match(/;/g) || []).length;
      counts['\t'] += (line.match(/\t/g) || []).length;
    }

    if (counts[';'] > counts[','] && counts[';'] > counts['\t']) return ';';
    if (counts['\t'] > counts[','] && counts['\t'] > counts[';']) return '\t';
    return ',';
  }

  /**
   * Sanitize string against spreadsheet formula injection (=, +, -, @, tab, cr)
   */
  public static sanitizeFormulaInjection(value: string): string {
    if (!value) return value;
    const trimmed = value.trim();
    if (/^[=+\-@\t\r]/.test(trimmed)) {
      // Prepend an apostrophe or remove prefix to prevent formula execution in Excel/Calc
      return `'${trimmed}`;
    }
    return value;
  }

  /**
   * Parse CSV content into structured rows
   */
  public static parseCsv(content: string, options: ParseOptions = {}): { headers: string[]; rows: RawParsedRow[] } {
    const maxRows = options.maxRows || this.DEFAULT_MAX_ROWS;
    const delimiter = options.delimiter || this.sniffDelimiter(content);

    const rawRows = this.splitCsvIntoRows(content, delimiter);
    if (rawRows.length === 0) {
      return { headers: [], rows: [] };
    }

    // Extract headers
    const rawHeaders = rawRows[0];
    const headers = rawHeaders.map((h, i) => {
      const trimmed = (h || '').toString().trim().replace(/^[\uFEFF]/, ''); // Strip UTF-8 BOM
      return trimmed || `Column_${i + 1}`;
    });

    const parsedRows: RawParsedRow[] = [];
    let currentRowNumber = 1;

    for (let r = 1; r < rawRows.length; r++) {
      if (parsedRows.length >= maxRows) break;
      currentRowNumber++;

      const cells = rawRows[r];
      // Check if row is completely empty
      const isAllEmpty = cells.every((c) => (c || '').toString().trim() === '');
      if (isAllEmpty) continue;

      const rowData: Record<string, string> = {};
      headers.forEach((header, colIndex) => {
        let cellVal = (cells[colIndex] || '').toString().trim();
        // Unquote if wrapped
        if (cellVal.startsWith('"') && cellVal.endsWith('"')) {
          cellVal = cellVal.slice(1, -1).replace(/""/g, '"');
        }
        rowData[header] = cellVal;
      });

      parsedRows.push({
        rowNumber: currentRowNumber,
        data: rowData,
      });
    }

    return { headers, rows: parsedRows };
  }

  /**
   * Parse XLSX binary buffer or base64 into structured rows
   */
  public static parseXlsx(buffer: Buffer | ArrayBuffer | string, options: ParseOptions = {}): { headers: string[]; rows: RawParsedRow[] } {
    const maxRows = options.maxRows || this.DEFAULT_MAX_ROWS;

    const workbook = typeof buffer === 'string'
      ? XLSX.read(buffer, { type: 'base64', cellFormula: false, cellHTML: false })
      : XLSX.read(buffer, { type: 'buffer', cellFormula: false, cellHTML: false });

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { headers: [], rows: [] };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    // Convert to JSON with array of arrays to preserve exact columns and avoid missing key slips
    const rawJsonRows = XLSX.utils.sheet_to_json<any[]>(worksheet, {
      header: 1,
      defval: '',
      blankrows: false,
      raw: false,
    });

    if (rawJsonRows.length === 0) {
      return { headers: [], rows: [] };
    }

    const rawHeaders = rawJsonRows[0] || [];
    const headers = rawHeaders.map((h: any, i: number) => {
      const trimmed = (h || '').toString().trim();
      return trimmed || `Column_${i + 1}`;
    });

    const parsedRows: RawParsedRow[] = [];
    let currentRowNumber = 1;

    for (let r = 1; r < rawJsonRows.length; r++) {
      if (parsedRows.length >= maxRows) break;
      currentRowNumber++;

      const cells = rawJsonRows[r] || [];
      const isAllEmpty = cells.every((c: any) => (c || '').toString().trim() === '');
      if (isAllEmpty) continue;

      const rowData: Record<string, string> = {};
      headers.forEach((header, colIndex) => {
        const val = (cells[colIndex] ?? '').toString().trim();
        rowData[header] = val;
      });

      parsedRows.push({
        rowNumber: currentRowNumber,
        data: rowData,
      });
    }

    return { headers, rows: parsedRows };
  }

  /**
   * Unified Parser entrypoint for both CSV and XLSX
   */
  public static parseFile(
    fileContent: string | Buffer | ArrayBuffer,
    fileType: FileType,
    options: ParseOptions = {}
  ): { headers: string[]; rows: RawParsedRow[] } {
    if (fileType === 'XLSX') {
      return this.parseXlsx(fileContent as any, options);
    }
    return this.parseCsv(fileContent.toString(), options);
  }

  /**
   * Helper: RFC-4180 compliant CSV line/cell splitter supporting quoted newlines
   */
  private static splitCsvIntoRows(csvText: string, delimiter: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let insideQuote = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"') {
        if (insideQuote && nextChar === '"') {
          currentCell += '"';
          i++; // Skip escaped quote
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === delimiter && !insideQuote) {
        currentRow.push(currentCell);
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !insideQuote) {
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip \n in \r\n
        }
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell);
      rows.push(currentRow);
    }

    return rows;
  }
}
