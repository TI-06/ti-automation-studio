import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { exportDashboardWorkbook } from '../src/lib/tools/dashboard-builder/export';
import { createDashboardSample } from '../src/lib/tools/dashboard-builder/sample';
import type { DashboardColumn, DashboardWidget, DashboardWidgetResult } from '../src/lib/tools/dashboard-builder/types';

const columns: DashboardColumn[] = [
  { id: 'date', name: '売上日', index: 0, role: 'date', confidence: 1, sampleValues: [] },
  { id: 'store', name: '店舗', index: 1, role: 'category', confidence: 1, sampleValues: [] },
  { id: 'sales', name: '売上額', index: 2, role: 'number', confidence: 1, sampleValues: [] },
];
const widgets: DashboardWidget[] = [
  { id: 'sum', title: '売上額 合計', kind: 'kpi', aggregate: 'sum', valueColumnId: 'sales', size: 'small' },
  { id: 'store', title: '店舗別 売上額', kind: 'bar', aggregate: 'sum', valueColumnId: 'sales', groupColumnId: 'store', size: 'medium' },
];
const results: DashboardWidgetResult[] = [
  { widgetId: 'sum', labels: [], values: [], scalar: 30000 },
  { widgetId: 'store', labels: ['東京店', '大阪店'], values: [12000, 18000], rows: [{ label: '東京店', value: 12000 }, { label: '大阪店', value: 18000 }] },
];

describe('ダッシュボード保存', () => {
  it('集計概要・グラフ元データ・絞り込み済みデータをExcelへ出力する', async () => {
    const dataset = {
      sheetName: '売上',
      columns: columns.map(({ id, name, index }) => ({ id, name, index })),
      rows: [['2026-08-01', '東京店', 12000], ['2026-08-02', '大阪店', 18000]],
    };
    const blob = exportDashboardWorkbook(dataset, columns, widgets, results, dataset.rows);
    expect(blob.type).toContain('spreadsheetml');

    const workbook = XLSX.read(await blob.arrayBuffer(), { type: 'array' });
    expect(workbook.SheetNames).toEqual(['集計概要', 'グラフ元データ', '絞り込み済みデータ']);
    const summary = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets['集計概要']);
    expect(summary[0]).toMatchObject({ ウィジェット: '売上額 合計', 集計方法: '合計', 値: 30000 });
    const source = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets['グラフ元データ']);
    expect(source.some((row) => row.項目 === '東京店' && row.値 === 12000)).toBe(true);
  });

  it('匿名の売上サンプルに複数月・複数店舗・主要列を含める', () => {
    const sample = createDashboardSample();
    expect(sample.rows.length).toBeGreaterThanOrEqual(30);
    expect(sample.columns.map((column) => column.name)).toEqual(expect.arrayContaining([
      '日付', '店舗', '担当者', 'カテゴリ', '商品コード', '数量', '売上額',
    ]));
    expect(new Set(sample.rows.map((row) => String(row[1]))).size).toBeGreaterThanOrEqual(3);
    expect(new Set(sample.rows.map((row) => String(row[0]).slice(0, 7))).size).toBeGreaterThanOrEqual(3);
  });
});
