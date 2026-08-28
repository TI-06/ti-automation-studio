import { describe, expect, it } from 'vitest';
import {
  createDashboardConfig,
  mapConfigToColumns,
  parseDashboardConfig,
} from '../src/lib/tools/dashboard-builder/config';
import type { DashboardColumn, DashboardFilter, DashboardWidget } from '../src/lib/tools/dashboard-builder/types';

const columns: DashboardColumn[] = [
  { id: 'date', name: '売上日', index: 0, role: 'date', confidence: 1, sampleValues: ['2026-08-01'] },
  { id: 'store', name: '店舗', index: 1, role: 'category', confidence: 1, sampleValues: ['東京店'] },
  { id: 'sales', name: '売上額', index: 2, role: 'number', confidence: 1, sampleValues: ['12000'] },
];
const widgets: DashboardWidget[] = [{
  id: 'sales-kpi', title: '売上額 合計', kind: 'kpi', aggregate: 'sum', valueColumnId: 'sales', size: 'small',
}, {
  id: 'store-bar', title: '店舗別 売上額', kind: 'bar', aggregate: 'sum', valueColumnId: 'sales', groupColumnId: 'store', size: 'medium',
}];
const filters: DashboardFilter[] = [{ id: 'filter-store', columnId: 'store', type: 'category', values: ['東京店'] }];

describe('ダッシュボード設定JSON', () => {
  it('列設定・ウィジェット・フィルター構成だけを保存する', () => {
    const config = createDashboardConfig(columns, widgets, filters);
    const json = JSON.stringify(config);

    expect(config.schemaVersion).toBe(1);
    expect(config.sourceColumns.map((column) => column.name)).toEqual(['売上日', '店舗', '売上額']);
    expect(config.widgets).toHaveLength(2);
    expect(json).not.toContain('12000');
    expect(json).not.toContain('東京店');
  });

  it('JSON文字列を検証し、不正な設定は拒否する', () => {
    const config = createDashboardConfig(columns, widgets, filters);
    expect(parseDashboardConfig(JSON.stringify(config)).schemaVersion).toBe(1);
    expect(() => parseDashboardConfig('{"schemaVersion":2}')).toThrow('設定ファイル');
    expect(() => parseDashboardConfig('not-json')).toThrow('設定ファイル');
  });

  it('同じ列名の新しいファイルへ設定を割り当て直す', () => {
    const config = createDashboardConfig(columns, widgets, filters);
    const nextColumns: DashboardColumn[] = [
      { id: 'column-1', name: '売上日', index: 0, role: 'text', confidence: .5, sampleValues: [] },
      { id: 'column-2', name: '店舗', index: 1, role: 'text', confidence: .5, sampleValues: [] },
      { id: 'column-3', name: '売上額', index: 2, role: 'text', confidence: .5, sampleValues: [] },
    ];
    const mapped = mapConfigToColumns(config, nextColumns);

    expect(mapped.missingColumnNames).toEqual([]);
    expect(mapped.widgets.find((item) => item.id === 'sales-kpi')?.valueColumnId).toBe('column-3');
    expect(mapped.widgets.find((item) => item.id === 'store-bar')?.groupColumnId).toBe('column-2');
    expect(mapped.filters[0].columnId).toBe('column-2');
  });

  it('不足列があっても全体を失敗させず該当列名を返す', () => {
    const config = createDashboardConfig(columns, widgets, filters);
    const nextColumns = columns.filter((column) => column.name !== '店舗');
    const mapped = mapConfigToColumns(config, nextColumns);

    expect(mapped.missingColumnNames).toEqual(['店舗']);
    expect(mapped.widgets.some((item) => item.id === 'sales-kpi')).toBe(true);
    expect(mapped.widgets.some((item) => item.id === 'store-bar')).toBe(false);
  });
});
