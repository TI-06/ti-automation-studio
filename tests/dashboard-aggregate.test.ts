import { describe, expect, it } from 'vitest';
import {
  aggregateWidget,
  aggregateWidgets,
  formatDashboardNumber,
} from '../src/lib/tools/dashboard-builder/aggregate';
import {
  applyDashboardFilters,
  buildFilterCandidates,
  dashboardFilteredRowIndexes,
} from '../src/lib/tools/dashboard-builder/filters';
import type {
  DashboardColumn,
  DashboardDataset,
  DashboardFilter,
  DashboardWidget,
} from '../src/lib/tools/dashboard-builder/types';

const dataset: DashboardDataset = {
  sheetName: '売上',
  columns: [
    { id: 'date', name: '売上日', index: 0 },
    { id: 'store', name: '店舗', index: 1 },
    { id: 'staff', name: '担当者', index: 2 },
    { id: 'sales', name: '売上額', index: 3 },
  ],
  rows: [
    ['2026-07-30', '東京店', '佐藤', 5000],
    ['2026-08-01', '東京店', '佐藤', 12000],
    ['2026-08-02', '大阪店', '鈴木', 18000],
    ['2026-08-15', '東京店', '田中', 15000],
    ['2026-09-01', '大阪店', '鈴木', 10000],
    ['2026-09-02', '東京店', '佐藤', null],
  ],
};

const columns: DashboardColumn[] = [
  { id: 'date', name: '売上日', index: 0, role: 'date', confidence: 1, sampleValues: ['2026-08-01'] },
  { id: 'store', name: '店舗', index: 1, role: 'category', confidence: 1, sampleValues: ['東京店', '大阪店'] },
  { id: 'staff', name: '担当者', index: 2, role: 'category', confidence: 1, sampleValues: ['佐藤', '鈴木', '田中'] },
  { id: 'sales', name: '売上額', index: 3, role: 'number', confidence: 1, sampleValues: ['12000'] },
];

const widget = (patch: Partial<DashboardWidget>): DashboardWidget => ({
  id: 'widget',
  title: '売上',
  kind: 'kpi',
  aggregate: 'sum',
  valueColumnId: 'sales',
  size: 'small',
  ...patch,
});

describe('ダッシュボードフィルター', () => {
  it('店舗フィルターで全ウィジェット対象行を絞り込む', () => {
    const filters: DashboardFilter[] = [{
      id: 'store-filter',
      columnId: 'store',
      type: 'category',
      values: ['東京店'],
    }];
    const rows = applyDashboardFilters(dataset, columns, filters);

    expect(rows).toHaveLength(4);
    expect(rows.every((row) => row[1] === '東京店')).toBe(true);
    expect(dashboardFilteredRowIndexes(dataset, columns, filters)).toEqual([0, 1, 3, 5]);
  });

  it('複数カテゴリと日付範囲をAND条件で適用する', () => {
    const rows = applyDashboardFilters(dataset, columns, [
      { id: 'store', columnId: 'store', type: 'category', values: ['東京店', '大阪店'] },
      { id: 'period', columnId: 'date', type: 'date-range', start: '2026-08-01', end: '2026-08-31' },
    ]);

    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row[0])).toEqual(['2026-08-01', '2026-08-02', '2026-08-15']);
  });

  it('空のフィルターでは全行を返し、分類と日付の候補を生成する', () => {
    expect(applyDashboardFilters(dataset, columns, [])).toHaveLength(dataset.rows.length);
    const candidates = buildFilterCandidates(dataset, columns);
    expect(candidates.find((candidate) => candidate.columnId === 'store')?.values).toEqual(['大阪店', '東京店']);
    expect(candidates.find((candidate) => candidate.columnId === 'date')).toMatchObject({
      type: 'date-range', min: '2026-07-30', max: '2026-09-02',
    });
    expect(candidates.some((candidate) => candidate.columnId === 'sales')).toBe(false);
  });
});

describe('ダッシュボード集計', () => {
  it('合計・件数・平均・最大・最小を集計する', () => {
    expect(aggregateWidget(dataset, columns, widget({ aggregate: 'sum' })).scalar).toBe(60000);
    expect(aggregateWidget(dataset, columns, widget({ aggregate: 'count' })).scalar).toBe(5);
    expect(aggregateWidget(dataset, columns, widget({ aggregate: 'average' })).scalar).toBe(12000);
    expect(aggregateWidget(dataset, columns, widget({ aggregate: 'max' })).scalar).toBe(18000);
    expect(aggregateWidget(dataset, columns, widget({ aggregate: 'min' })).scalar).toBe(5000);
  });

  it('値列のない件数KPIは行数を数える', () => {
    const result = aggregateWidget(dataset, columns, widget({ aggregate: 'count', valueColumnId: undefined }));
    expect(result.scalar).toBe(6);
  });

  it('月別時系列を日付昇順で集計する', () => {
    const result = aggregateWidget(dataset, columns, widget({
      kind: 'line',
      dateColumnId: 'date',
      dateGrain: 'year-month',
    }));

    expect(result.labels).toEqual(['2026-07', '2026-08', '2026-09']);
    expect(result.values).toEqual([5000, 45000, 10000]);
  });

  it('分類別ランキングを値降順・Top Nで返す', () => {
    const result = aggregateWidget(dataset, columns, widget({
      kind: 'ranking',
      groupColumnId: 'store',
      limit: 2,
    }));

    expect(result.rows).toEqual([
      { label: '東京店', value: 32000 },
      { label: '大阪店', value: 28000 },
    ]);
    expect(result.labels).toEqual(['東京店', '大阪店']);
    expect(result.values).toEqual([32000, 28000]);
  });

  it('同じフィルターを全ウィジェットへ適用して再集計する', () => {
    const widgets = [
      widget({ id: 'sum', title: '売上合計' }),
      widget({ id: 'count', title: '件数', aggregate: 'count', valueColumnId: undefined }),
      widget({ id: 'store', title: '店舗別', kind: 'bar', groupColumnId: 'store' }),
    ];
    const result = aggregateWidgets(dataset, columns, widgets, [
      { id: 'period', columnId: 'date', type: 'date-range', start: '2026-08-01', end: '2026-08-31' },
    ]);

    expect(result.filteredRowIndexes).toEqual([1, 2, 3]);
    expect(result.results.find((item) => item.widgetId === 'sum')?.scalar).toBe(45000);
    expect(result.results.find((item) => item.widgetId === 'count')?.scalar).toBe(3);
  });

  it('日本語向け桁区切りで数値を表示する', () => {
    expect(formatDashboardNumber(12450000)).toBe('12,450,000');
    expect(formatDashboardNumber(1234.5)).toBe('1,234.5');
  });
});
