import { parseNumericCandidate } from '../data-cleaner/diagnostics';
import { applyDashboardFilters, dashboardFilteredRowIndexes } from './filters';
import type {
  DashboardAggregate,
  DashboardCellValue,
  DashboardColumn,
  DashboardDataset,
  DashboardFilter,
  DashboardWidget,
  DashboardWidgetResult,
  DashboardAggregateResult,
} from './types';

function findColumn(columns: DashboardColumn[], columnId?: string): DashboardColumn | null {
  if (!columnId) return null;
  return columns.find((column) => column.id === columnId) ?? null;
}

function numericValue(value: DashboardCellValue): number | null {
  const parsed = parseNumericCandidate(value);
  return parsed?.value ?? null;
}

function aggregateNumbers(values: number[], aggregate: DashboardAggregate, rowCount: number): number {
  if (aggregate === 'count') return values.length;
  if (values.length === 0) return 0;
  if (aggregate === 'sum') return values.reduce((sum, value) => sum + value, 0);
  if (aggregate === 'average') return values.reduce((sum, value) => sum + value, 0) / values.length;
  if (aggregate === 'max') return Math.max(...values);
  if (aggregate === 'min') return Math.min(...values);
  return rowCount;
}

function scalarForRows(
  rows: DashboardCellValue[][],
  valueColumn: DashboardColumn | null,
  aggregate: DashboardAggregate,
): number {
  if (aggregate === 'count' && !valueColumn) return rows.length;
  if (!valueColumn) return 0;
  const values = rows
    .map((row) => numericValue(row[valueColumn.index] ?? null))
    .filter((value): value is number => value != null);
  return aggregateNumbers(values, aggregate, rows.length);
}

function dateGroupKey(value: DashboardCellValue, grain: DashboardWidget['dateGrain']): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  if (grain === 'day') return text;
  if (grain === 'month') return `${Number(match[2])}月`;
  return `${match[1]}-${match[2]}`;
}

function categoryGroupKey(value: DashboardCellValue): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
}

function groupRows(
  rows: DashboardCellValue[][],
  groupColumn: DashboardColumn,
  isDate: boolean,
  grain: DashboardWidget['dateGrain'],
): Map<string, DashboardCellValue[][]> {
  const grouped = new Map<string, DashboardCellValue[][]>();
  rows.forEach((row) => {
    const raw = row[groupColumn.index] ?? null;
    const key = isDate ? dateGroupKey(raw, grain ?? 'year-month') : categoryGroupKey(raw);
    if (!key) return;
    const list = grouped.get(key) ?? [];
    list.push(row);
    grouped.set(key, list);
  });
  return grouped;
}

function sortGroupedEntries(
  entries: Array<{ label: string; value: number }>,
  widget: DashboardWidget,
  dateGrouping: boolean,
): Array<{ label: string; value: number }> {
  if (dateGrouping) return [...entries].sort((a, b) => a.label.localeCompare(b.label, 'ja'));
  if (widget.kind === 'ranking') return [...entries].sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'ja'));
  return [...entries].sort((a, b) => a.label.localeCompare(b.label, 'ja'));
}

export function aggregateWidget(
  dataset: DashboardDataset,
  columns: DashboardColumn[],
  widget: DashboardWidget,
  rows: DashboardCellValue[][] = dataset.rows,
): DashboardWidgetResult {
  const valueColumn = findColumn(columns, widget.valueColumnId);
  const dateColumn = findColumn(columns, widget.dateColumnId);
  const groupColumn = dateColumn ?? findColumn(columns, widget.groupColumnId);

  if (widget.kind === 'kpi' || !groupColumn) {
    return {
      widgetId: widget.id,
      labels: [],
      values: [],
      scalar: scalarForRows(rows, valueColumn, widget.aggregate),
    };
  }

  const dateGrouping = Boolean(dateColumn);
  const grouped = groupRows(rows, groupColumn, dateGrouping, widget.dateGrain);
  let entries = [...grouped.entries()].map(([label, group]) => ({
    label,
    value: scalarForRows(group, valueColumn, widget.aggregate),
  }));
  entries = sortGroupedEntries(entries, widget, dateGrouping);
  if (widget.limit && widget.limit > 0) entries = entries.slice(0, widget.limit);

  return {
    widgetId: widget.id,
    labels: entries.map((entry) => entry.label),
    values: entries.map((entry) => entry.value),
    rows: entries,
  };
}

export function aggregateWidgets(
  dataset: DashboardDataset,
  columns: DashboardColumn[],
  widgets: DashboardWidget[],
  filters: DashboardFilter[],
): DashboardAggregateResult {
  const filteredRows = applyDashboardFilters(dataset, columns, filters);
  return {
    results: widgets.map((widget) => aggregateWidget(dataset, columns, widget, filteredRows)),
    filteredRowIndexes: dashboardFilteredRowIndexes(dataset, columns, filters),
  };
}

export function formatDashboardNumber(value: number): string {
  return new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 2 }).format(value);
}
