import * as XLSX from 'xlsx';
import {
  CLEANER_LARGE_ROWS,
  CLEANER_MAX_FILE_BYTES,
  CLEANER_MAX_ROWS,
  detectCsvEncoding,
  validateCleanerFile,
  type DetectedCsvEncoding,
} from '../data-cleaner/import';
import type { DashboardCellValue, DashboardDataset } from './types';

export const DASHBOARD_MAX_FILE_BYTES = CLEANER_MAX_FILE_BYTES;
export const DASHBOARD_MAX_ROWS = CLEANER_MAX_ROWS;
export const DASHBOARD_LARGE_ROWS = CLEANER_LARGE_ROWS;
export { detectCsvEncoding };
export type { DetectedCsvEncoding };

export interface DashboardFileLike {
  name: string;
  size: number;
}

export interface DashboardFileValidation {
  valid: boolean;
  message: string;
}

export function validateDashboardFile(file: DashboardFileLike): DashboardFileValidation {
  return validateCleanerFile(file);
}

function normalizeHeader(value: unknown, index: number): string {
  const text = value == null ? '' : String(value).trim();
  return text || `列${index + 1}`;
}

function formatDateCell(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeCell(value: unknown): DashboardCellValue {
  if (value == null) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return formatDateCell(value);
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  return String(value);
}

function datasetFromRows(rows: unknown[][], sheetName: string): DashboardDataset {
  if (rows.length === 0) return { sheetName, columns: [], rows: [] };
  const [headerRow = [], ...dataRows] = rows;
  if (dataRows.length > DASHBOARD_MAX_ROWS) {
    throw new Error('100,000行を超えるデータは処理できません。行数を減らしてからもう一度お試しください。');
  }

  const width = Math.max(headerRow.length, ...dataRows.map((row) => row.length), 0);
  const columns = Array.from({ length: width }, (_, index) => ({
    id: `column-${index + 1}`,
    name: normalizeHeader(headerRow[index], index),
    index,
  }));

  return {
    sheetName,
    columns,
    rows: dataRows.map((row) => columns.map((column) => normalizeCell(row[column.index]))),
  };
}

function decodeCsv(bytes: Uint8Array, encoding: Exclude<DetectedCsvEncoding, 'unknown'>): string {
  try {
    return new TextDecoder(encoding, { fatal: true }).decode(bytes);
  } catch {
    throw new Error('CSVの文字コードを読み取れませんでした。UTF-8またはShift_JISを選択し直してください。');
  }
}

export function parseDashboardCsv(
  bytes: Uint8Array,
  encoding: Exclude<DetectedCsvEncoding, 'unknown'>,
): DashboardDataset {
  const text = decodeCsv(bytes, encoding);
  const workbook = XLSX.read(text, { type: 'string', raw: false });
  const sheetName = workbook.SheetNames[0] ?? 'CSV';
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return { sheetName: 'CSV', columns: [], rows: [] };

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false,
    defval: null,
    blankrows: false,
  });
  return datasetFromRows(rows, 'CSV');
}

export function parseDashboardExcel(
  buffer: ArrayBuffer | Uint8Array,
  fileName: string,
  sheetName?: string,
): { dataset: DashboardDataset; sheetNames: string[] } {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, dense: false });
  const sheetNames = [...workbook.SheetNames];
  const selectedSheet = sheetName && sheetNames.includes(sheetName) ? sheetName : sheetNames[0];

  if (!selectedSheet) {
    return { dataset: { sheetName: '', columns: [], rows: [] }, sheetNames };
  }

  const sheet = workbook.Sheets[selectedSheet];
  if (!sheet) throw new Error(`${fileName} の「${selectedSheet}」シートを読み込めませんでした。`);
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: false,
  });

  return { dataset: datasetFromRows(rows, selectedSheet), sheetNames };
}
