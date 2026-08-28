import { describe, expect, it } from 'vitest';
import {
  buildInitialDashboardWidgets,
  chooseDateGrain,
} from '../src/lib/tools/dashboard-builder/auto-layout';
import type { DashboardColumn, DashboardDataset } from '../src/lib/tools/dashboard-builder/types';

const dataset: DashboardDataset = {
  sheetName: '売上',
  columns: [
    { id: 'date', name: '売上日', index: 0 },
    { id: 'store', name: '店舗', index: 1 },
    { id: 'category', name: 'カテゴリ', index: 2 },
    { id: 'code', name: '商品コード', index: 3 },
    { id: 'sales', name: '売上額', index: 4 },
    { id: 'quantity', name: '数量', index: 5 },
  ],
  rows: [
    ['2026-07-01', '東京店', '食品', 'A001', 12000, 3],
    ['2026-07-15', '大阪店', '雑貨', 'A002', 18000, 5],
    ['2026-08-01', '東京店', '食品', 'A003', 15000, 4],
    ['2026-08-15', '名古屋店', '衣料', 'A004', 9000, 2],
    ['2026-09-01', '大阪店', '雑貨', 'A005', 22000, 6],
    ['2026-09-10', '東京店', '衣料', 'A006', 14000, 3],
  ],
};

const columns: DashboardColumn[] = [
  { id: 'date', name: '売上日', index: 0, role: 'date', confidence: 1, sampleValues: ['2026-07-01'] },
  { id: 'store', name: '店舗', index: 1, role: 'category', confidence: 1, sampleValues: ['東京店'] },
  { id: 'category', name: 'カテゴリ', index: 2, role: 'category', confidence: 1, sampleValues: ['食品'] },
  { id: 'code', name: '商品コード', index: 3, role: 'id', confidence: 1, sampleValues: ['A001'] },
  { id: 'sales', name: '売上額', index: 4, role: 'number', confidence: 1, sampleValues: ['12000'] },
  { id: 'quantity', name: '数量', index: 5, role: 'number', confidence: 1, sampleValues: ['3'] },
];

describe('ダッシュボード初期構成', () => {
  it('売上データからKPI・時系列・分類別・ランキングを作る', () => {
    const widgets = buildInitialDashboardWidgets(dataset, columns);

    expect(widgets.some((widget) => widget.kind === 'kpi' && widget.aggregate === 'sum' && widget.valueColumnId === 'sales')).toBe(true);
    expect(widgets.some((widget) => widget.kind === 'kpi' && widget.aggregate === 'count')).toBe(true);
    expect(widgets.some((widget) => widget.kind === 'line' && widget.dateColumnId === 'date')).toBe(true);
    expect(widgets.some((widget) => ['bar', 'horizontal-bar'].includes(widget.kind) && widget.groupColumnId === 'store')).toBe(true);
    expect(widgets.some((widget) => widget.kind === 'ranking')).toBe(true);
    expect(widgets.length).toBeLessThanOrEqual(8);
  });

  it('ID列をKPI値にせず、タイトルへ実際の列名を含める', () => {
    const widgets = buildInitialDashboardWidgets(dataset, columns);

    expect(widgets.some((widget) => widget.valueColumnId === 'code')).toBe(false);
    expect(widgets.every((widget) => widget.title.length > 0)).toBe(true);
    expect(widgets.some((widget) => widget.title.includes('売上額'))).toBe(true);
    expect(widgets.some((widget) => widget.title.includes('店舗'))).toBe(true);
  });

  it('カテゴリ数が多い列へドーナツを自動生成しない', () => {
    const manyRows = Array.from({ length: 20 }, (_, index) => [
      `2026-08-${String(index + 1).padStart(2, '0')}`,
      `顧客${index + 1}`,
      index + 100,
    ]);
    const highCardinality: DashboardDataset = {
      sheetName: '明細',
      columns: [
        { id: 'date', name: '日付', index: 0 },
        { id: 'customer', name: '顧客', index: 1 },
        { id: 'amount', name: '金額', index: 2 },
      ],
      rows: manyRows,
    };
    const highColumns: DashboardColumn[] = [
      { id: 'date', name: '日付', index: 0, role: 'date', confidence: 1, sampleValues: [] },
      { id: 'customer', name: '顧客', index: 1, role: 'category', confidence: 1, sampleValues: [] },
      { id: 'amount', name: '金額', index: 2, role: 'number', confidence: 1, sampleValues: [] },
    ];

    const widgets = buildInitialDashboardWidgets(highCardinality, highColumns);
    expect(widgets.some((widget) => widget.kind === 'donut' && widget.groupColumnId === 'customer')).toBe(false);
  });

  it('データ期間に応じて日・月・年月の粒度を選ぶ', () => {
    expect(chooseDateGrain(['2026-08-01', '2026-08-05'])).toBe('day');
    expect(chooseDateGrain(['2026-01-01', '2026-12-31'])).toBe('year-month');
    expect(chooseDateGrain(['2025-01-01', '2027-12-31'])).toBe('year-month');
  });
});
