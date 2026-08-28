import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import {
  parseDashboardCsv,
  parseDashboardExcel,
  validateDashboardFile,
} from '../src/lib/tools/dashboard-builder/import';

describe('ダッシュボード用ファイル読込', () => {
  it('CSV / Excelだけを20MB以下で受け付ける', () => {
    expect(validateDashboardFile({ name: 'sales.csv', size: 1024 }).valid).toBe(true);
    expect(validateDashboardFile({ name: 'sales.xlsx', size: 1024 }).valid).toBe(true);
    expect(validateDashboardFile({ name: 'sales.xls', size: 1024 }).valid).toBe(true);
    expect(validateDashboardFile({ name: 'sales.pdf', size: 1024 }).valid).toBe(false);
    expect(validateDashboardFile({ name: 'sales.csv', size: 20 * 1024 * 1024 + 1 }).valid).toBe(false);
  });

  it('UTF-8 CSVを列と行へ変換する', () => {
    const bytes = new TextEncoder().encode('売上日,店舗,売上額\n2026-08-01,東京店,12000\n2026-08-02,大阪店,18000');
    const dataset = parseDashboardCsv(bytes, 'utf-8');

    expect(dataset.columns.map((column) => column.name)).toEqual(['売上日', '店舗', '売上額']);
    expect(dataset.rows).toHaveLength(2);
    expect(dataset.rows[0]).toEqual(['2026-08-01', '東京店', '12000']);
  });

  it('Excel日付セルをISO日付へ正規化し、シートを選べる', () => {
    const workbook = XLSX.utils.book_new();
    const sales = XLSX.utils.aoa_to_sheet([
      ['売上日', '売上額'],
      [new Date(2026, 7, 1), 12000],
    ], { cellDates: true });
    const archive = XLSX.utils.aoa_to_sheet([
      ['売上日', '売上額'],
      [new Date(2026, 6, 1), 9000],
    ], { cellDates: true });
    XLSX.utils.book_append_sheet(workbook, sales, '売上');
    XLSX.utils.book_append_sheet(workbook, archive, '過去');
    const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

    const first = parseDashboardExcel(bytes, 'sales.xlsx');
    expect(first.sheetNames).toEqual(['売上', '過去']);
    expect(first.dataset.sheetName).toBe('売上');
    expect(first.dataset.rows[0][0]).toBe('2026-08-01');

    const second = parseDashboardExcel(bytes, 'sales.xlsx', '過去');
    expect(second.dataset.sheetName).toBe('過去');
    expect(second.dataset.rows[0][0]).toBe('2026-07-01');
  });

  it('100,000行を超えるCSVは停止する', () => {
    const lines = ['id', ...Array.from({ length: 100_001 }, (_, index) => String(index + 1))];
    const bytes = new TextEncoder().encode(lines.join('\n'));
    expect(() => parseDashboardCsv(bytes, 'utf-8')).toThrow('100,000行');
  });
});
