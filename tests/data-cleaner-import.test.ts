import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import {
  detectCsvEncoding,
  parseCsvBytes,
  parseExcelBuffer,
  validateCleanerFile,
} from '../src/lib/tools/data-cleaner/import';

function workbookBuffer(): ArrayBuffer {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
    ['商品コード', '商品名', '金額'],
    ['A001', '商品A', 1200],
  ]), '商品一覧');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
    ['担当者', '件数'],
    ['山田', 3],
  ]), '集計');
  const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return bytes;
}

describe('データ整理ツールのファイル読込', () => {
  it('対応形式と20MB上限を検証する', () => {
    expect(validateCleanerFile({ name: 'sample.csv', size: 100 }).valid).toBe(true);
    expect(validateCleanerFile({ name: 'sample.xlsx', size: 100 }).valid).toBe(true);
    expect(validateCleanerFile({ name: 'sample.xls', size: 100 }).valid).toBe(true);
    expect(validateCleanerFile({ name: 'sample.exe', size: 100 }).valid).toBe(false);
    expect(validateCleanerFile({ name: 'huge.xlsx', size: 20 * 1024 * 1024 + 1 }).valid).toBe(false);
  });

  it('UTF-8 BOMと通常のUTF-8を判定する', () => {
    expect(detectCsvEncoding(new Uint8Array([0xef, 0xbb, 0xbf, 0x41]))).toBe('utf-8');
    const utf8 = new TextEncoder().encode('名前,金額\n山田,1200\n');
    expect(detectCsvEncoding(utf8)).toBe('utf-8');
  });

  it('Shift_JISの日本語CSVを判定して読み込む', () => {
    const shiftJis = new Uint8Array([
      0x96, 0xbc, 0x91, 0x4f, 0x2c, 0x8b, 0xe0, 0x8a, 0x7a, 0x0a,
      0x8e, 0x52, 0x93, 0x63, 0x2c, 0x31, 0x32, 0x30, 0x30, 0x0a,
    ]);
    expect(detectCsvEncoding(shiftJis)).toBe('shift_jis');
    const dataset = parseCsvBytes(shiftJis, 'shift_jis');
    expect(dataset.columns.map((column) => column.name)).toEqual(['名前', '金額']);
    expect(dataset.rows[0]).toEqual(['山田', '1200']);
  });

  it('Excelのシート一覧を取得し指定シートだけ読み込む', () => {
    const parsed = parseExcelBuffer(workbookBuffer(), 'sample.xlsx', '集計');
    expect(parsed.sheetNames).toEqual(['商品一覧', '集計']);
    expect(parsed.dataset.sheetName).toBe('集計');
    expect(parsed.dataset.columns.map((column) => column.name)).toEqual(['担当者', '件数']);
    expect(parsed.dataset.rows[0]).toEqual(['山田', 3]);
  });

  it('100,000行を超えるCSVは停止する', () => {
    const rows = ['id', ...Array.from({ length: 100001 }, (_, index) => String(index + 1))].join('\n');
    const bytes = new TextEncoder().encode(rows);
    expect(() => parseCsvBytes(bytes, 'utf-8')).toThrow('100,000行');
  });
});
