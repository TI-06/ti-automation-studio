import { describe, expect, it } from 'vitest';
import type { DashboardWidget, DashboardWidgetResult } from '../src/lib/tools/dashboard-builder/types';
import { buildDashboardChartSpec } from '../src/scripts/tools/dashboard-builder/charts';
import { dashboardExportFileName } from '../src/scripts/tools/dashboard-builder/export-client';
import { filterRowsForDashboardSearch, moveDashboardWidget } from '../src/scripts/tools/dashboard-builder/controller';

const widget = (patch: Partial<DashboardWidget>): DashboardWidget => ({
  id: 'w1',
  title: '店舗別売上',
  kind: 'bar',
  aggregate: 'sum',
  valueColumnId: 'sales',
  groupColumnId: 'store',
  size: 'medium',
  ...patch,
});

const result: DashboardWidgetResult = {
  widgetId: 'w1',
  labels: ['東京店', '大阪店'],
  values: [32000, 28000],
};

describe('ダッシュボードのクライアント操作', () => {
  it('Chart.js用の棒・折れ線・ドーナツ設定を生成する', () => {
    expect(buildDashboardChartSpec(widget({ kind: 'bar' }), result).type).toBe('bar');
    expect(buildDashboardChartSpec(widget({ kind: 'horizontal-bar' }), result).options.indexAxis).toBe('y');
    expect(buildDashboardChartSpec(widget({ kind: 'line' }), result).type).toBe('line');
    expect(buildDashboardChartSpec(widget({ kind: 'donut' }), result).type).toBe('doughnut');
  });

  it('ウィジェットを上下へ移動し、端では順序を変えない', () => {
    const items = [widget({ id: 'a' }), widget({ id: 'b' }), widget({ id: 'c' })];
    expect(moveDashboardWidget(items, 'b', -1).map((item) => item.id)).toEqual(['b', 'a', 'c']);
    expect(moveDashboardWidget(items, 'b', 1).map((item) => item.id)).toEqual(['a', 'c', 'b']);
    expect(moveDashboardWidget(items, 'a', -1).map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });

  it('元データ検索は全列を対象に大文字小文字を区別せず絞り込む', () => {
    const rows = [
      ['2026-08-01', '東京店', '佐藤', 12000],
      ['2026-08-02', '大阪店', 'SUZUKI', 18000],
      ['2026-08-15', '東京店', '田中', 15000],
    ];
    expect(filterRowsForDashboardSearch(rows, 'suzuki')).toEqual([rows[1]]);
    expect(filterRowsForDashboardSearch(rows, '東京')).toEqual([rows[0], rows[2]]);
    expect(filterRowsForDashboardSearch(rows, '')).toEqual(rows);
  });

  it('保存ファイル名からOSで扱いづらい文字を除去する', () => {
    expect(dashboardExportFileName('月次 売上/東京', 'xlsx')).toBe('月次_売上_東京_ダッシュボード.xlsx');
    expect(dashboardExportFileName('', 'json')).toBe('dashboard_ダッシュボード.json');
  });
});
