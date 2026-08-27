import * as XLSX from 'xlsx';
import type { CleanerCellValue, CleanerDataset } from './types';

export const CLEANER_MAX_FILE_BYTES = 20 * 1024 * 1024;
export const CLEANER_MAX_ROWS = 100_000;
export const CLEANER_LARGE_ROWS = 50_000;

export type DetectedCsvEncoding = 'utf-8' | 'shift_jis' | 'unknown';

export interface CleanerFileLike {
  name: string;
  size: number;
}

export interface CleanerFileValidation {
  valid: boolean;
  message: string;
}

const SUPPORTED_EXTENSIONS = new Set(['csv', 'xlsx', 'xls']);

function extensionOf(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}

export function validateCleanerFile(file: CleanerFileLike): CleanerFileValidation {
  const extension = extensionOf(file.name);
  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    return {
      valid: false,
      message: '対応していないファイル形式です。.csv、.xlsx、.xls のいずれかを選択してください。',
    };
  }
  if (file.size > CLEANER_MAX_FILE_BYTES) {
    return {
      valid: false,
      message: 'ファイルサイズが20MBを超えています。20MB以下のファイルを選択してください。',
    };
  }
  return { valid: true, message: '' };
}

function canDecode(bytes: Uint8Array, encoding: string): boolean {
  try {
    new TextDecoder(encoding, { fatal: true }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}

export function detectCsvEncoding(bytes: Uint8Array): DetectedCsvEncoding {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return 'utf-8';
  }
  if (canDecode(bytes, 'utf-8')) return 'utf-8';
  if (canDecode(bytes, 'shift_jis')) return 'shift_jis';
  return 'unknown';
}

function normalizeHeader(value: unknown, index: number): string {
  const text = value == null ? '' : String(value).trim();
  return text || `列${index + 1}`;
}

function normalizeCell(value: unknown): CleanerCellValue {
  if (value == null || value === '') return value === '' ? '' : null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function datasetFromRows(rows: unknown[][], sheetName: string): CleanerDataset {
  if (rows.length === 0) {
    return { sheetName, columns: [], rows: [] };
  }

  const [headerRow = [], ...dataRows] = rows;
  if (dataRows.length > CLEANER_MAX_ROWS) {
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

export function parseCsvBytes(bytes: Uint8Array, encoding: 'utf-8' | 'shift_jis'): CleanerDataset {
  let text: string;
  try {
    text = new TextDecoder(encoding, { fatal: true }).decode(bytes);
  } catch {
    throw new Error('CSVの文字コードを読み取れませんでした。UTF-8またはShift_JISを選択し直してください。');
  }

  const workbook = XLSX.read(text, { type: 'string', raw: false, dense: false });
  const firstSheetName = workbook.SheetNames[0] ?? 'CSV';
  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet) return { sheetName: 'CSV', columns: [], rows: [] };
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false,
    defval: null,
    blankrows: false,
  });
  return datasetFromRows(rows, 'CSV');
}

export function parseExcelBuffer(
  buffer: ArrayBuffer | Uint8Array,
  fileName: string,
  sheetName?: string,
): { dataset: CleanerDataset; sheetNames: string[] } {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false, dense: false });
  const sheetNames = [...workbook.SheetNames];
  const selectedSheet = sheetName && sheetNames.includes(sheetName) ? sheetName : sheetNames[0];

  if (!selectedSheet) {
    return {
      dataset: { sheetName: '', columns: [], rows: [] },
      sheetNames,
    };
  }

  const sheet = workbook.Sheets[selectedSheet];
  if (!sheet) throw new Error(`${fileName} の「${selectedSheet}」シートを読み込めませんでした。`);

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: false,
  });

  return {
    dataset: datasetFromRows(rows, selectedSheet),
    sheetNames,
  };
}
