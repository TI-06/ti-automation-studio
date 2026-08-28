import { describe, expect, it } from 'vitest';
import { inferDashboardColumns } from '../src/lib/tools/dashboard-builder/inference';
import type { DashboardDataset } from '../src/lib/tools/dashboard-builder/types';

const dataset: DashboardDataset = {
  sheetName: '売上',
  columns: [
    { id: 'date', name: '売上日', index: 0 },
    { id: 'store', name: '店舗', index: 1 },
    { id: 'sales', name: '売上額', index: 2 },
    { id: 'code', name: '商品コード', index: 3 },
    { id: 'memo', name: 'メモ', index: 4 },
  ],
  rows: [
    ['2026-08-01', '東京店', 12000, '00123', '新規顧客'],
    ['2026-08-02', '大阪店', 18000, '00124', '電話注文'],
    ['2026-08-03', '東京店', 15000, '00125', '紹介'],
    ['2026-08-04', '大阪店', 9000, '00126', '再注文'],
    ['2026-08-05', '東京店', 22000, '00127', '展示会'],
  ],
};

describe('ダッシュボード列型推定', () => {
  it('日付・数値・分類・ID・文字列を判定する', () => {
    const columns = inferDashboardColumns(dataset);
    const role = (name: string) => columns.find((column) => column.name === name)?.role;

    expect(role('売上日')).toBe('date');
    expect(role('店舗')).toBe('category');
    expect(role('売上額')).toBe('number');
    expect(role('商品コード')).toBe('id');
    expect(role('メモ')).toBe('text');
  });

  it('数字だけの商品コードを数値KPI候補にしない', () => {
    const columns = inferDashboardColumns(dataset);
    const code = columns.find((column) => column.name === '商品コード');

    expect(code?.role).toBe('id');
    expect(code?.confidence).toBeGreaterThan(0.8);
  });

  it('各列へサンプル値と0〜1の信頼度を持たせる', () => {
    const columns = inferDashboardColumns(dataset);
    for (const column of columns) {
      expect(column.confidence).toBeGreaterThanOrEqual(0);
      expect(column.confidence).toBeLessThanOrEqual(1);
      expect(column.sampleValues.length).toBeGreaterThan(0);
      expect(column.sampleValues.length).toBeLessThanOrEqual(5);
    }
  });
});
