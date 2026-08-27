import * as XLSX from 'xlsx';
import type { CellPrimitive, NormalizedSheet, NormalizedWorkbook } from './types';

export const MAX_EXCEL_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_EXCEL_ROWS = 100_000;
export const LARGE_EXCEL_ROWS = 50_000;

export type ExcelFileValidation =
  | { valid: true }
  | { valid: false; message: string };

export function validateExcelFile(file: Pick<File, 'name' | 'size'>): ExcelFileValidation {
  const extension = file.name.toLowerCase().split('.').pop();
  if (!extension || !['xlsx', 'xls'].includes(extension)) {
    return { valid: false, message: '対応している形式は .xlsx と .xls です。' };
  }

  if (file.size > MAX_EXCEL_FILE_BYTES) {
    return {
      valid: false,
      message: 'ファイルサイズが20MBを超えています。20MB以下のExcelファイルを選択してください。',
    };
  }

  return { valid: true };
}

function normalizeCellValue(value: unknown): CellPrimitive {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  return String(value);
}

function normalizeSheet(name: string, worksheet: XLSX.WorkSheet): NormalizedSheet {
  const ref = worksheet['!ref'];
  if (!ref) {
    return {
      name,
      rowCount: 0,
      columnCount: 0,
      headers: [],
      rows: [],
      cells: {},
      formulas: {},
    };
  }

  const range = XLSX.utils.decode_range(ref);
  const rowCount = range.e.r + 1;
  const columnCount = range.e.c + 1;

  if (rowCount > MAX_EXCEL_ROWS) {
    throw new Error('このシートは100,000行を超えているため比較できません。');
  }

  const rows: CellPrimitive[][] = Array.from({ length: rowCount }, () =>
    Array<CellPrimitive>(columnCount).fill(null),
  );
  const cells: Record<string, { value: CellPrimitive; formula?: string }> = {};
  const formulas: Record<string, string> = {};

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
      const cell = worksheet[address] as XLSX.CellObject | undefined;
      if (!cell) continue;

      const value = normalizeCellValue(cell.v);
      const formula = typeof cell.f === 'string' ? cell.f : undefined;
      rows[rowIndex][columnIndex] = value;
      cells[address] = formula ? { value, formula } : { value };
      if (formula) formulas[address] = formula;
    }
  }

  const headers = (rows[0] ?? []).map((value, index) => {
    const label = value == null ? '' : String(value).trim();
    return label || `列${index + 1}`;
  });

  return {
    name,
    rowCount,
    columnCount,
    headers,
    rows,
    cells,
    formulas,
  };
}

export function parseWorkbook(buffer: ArrayBuffer, fileName: string): NormalizedWorkbook {
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellFormula: true,
    cellDates: true,
  });

  const sheets = workbook.SheetNames.map((name) => normalizeSheet(name, workbook.Sheets[name]));

  return {
    fileName,
    sheetNames: [...workbook.SheetNames],
    sheets,
  };
}
