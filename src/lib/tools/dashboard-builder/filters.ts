import type {
  DashboardCellValue,
  DashboardColumn,
  DashboardDataset,
  DashboardFilter,
  DashboardFilterCandidate,
} from './types';

function columnIndex(columns: DashboardColumn[], columnId: string): number | null {
  const column = columns.find((item) => item.id === columnId);
  return column?.index ?? null;
}

function display(value: DashboardCellValue): string {
  return value == null ? '' : String(value).trim();
}

function matchesCategory(value: DashboardCellValue, filter: DashboardFilter): boolean {
  const selected = filter.values ?? [];
  if (selected.length === 0) return true;
  return selected.includes(display(value));
}

function matchesDate(value: DashboardCellValue, filter: DashboardFilter): boolean {
  const text = display(value);
  if (!text) return false;
  if (filter.start && text < filter.start) return false;
  if (filter.end && text > filter.end) return false;
  return true;
}

function rowMatches(
  row: DashboardCellValue[],
  columns: DashboardColumn[],
  filters: DashboardFilter[],
): boolean {
  return filters.every((filter) => {
    const index = columnIndex(columns, filter.columnId);
    if (index == null) return true;
    const value = row[index] ?? null;
    return filter.type === 'category'
      ? matchesCategory(value, filter)
      : matchesDate(value, filter);
  });
}

export function dashboardFilteredRowIndexes(
  dataset: DashboardDataset,
  columns: DashboardColumn[],
  filters: DashboardFilter[],
): number[] {
  return dataset.rows.flatMap((row, index) => rowMatches(row, columns, filters) ? [index] : []);
}

export function applyDashboardFilters(
  dataset: DashboardDataset,
  columns: DashboardColumn[],
  filters: DashboardFilter[],
): DashboardCellValue[][] {
  return dashboardFilteredRowIndexes(dataset, columns, filters).map((index) => dataset.rows[index]);
}

export function buildFilterCandidates(
  dataset: DashboardDataset,
  columns: DashboardColumn[],
): DashboardFilterCandidate[] {
  const candidates: DashboardFilterCandidate[] = [];

  columns.forEach((column) => {
    const values = dataset.rows.map((row) => row[column.index] ?? null);
    if (column.role === 'category') {
      const distinct = [...new Set(values.map(display).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ja'));
      if (distinct.length === 0 || distinct.length > 100) return;
      candidates.push({
        id: `filter-${column.id}`,
        columnId: column.id,
        columnName: column.name,
        type: 'category',
        values: distinct,
      });
      return;
    }

    if (column.role === 'date') {
      const dates = values.map(display).filter(Boolean).sort();
      if (dates.length === 0) return;
      candidates.push({
        id: `filter-${column.id}`,
        columnId: column.id,
        columnName: column.name,
        type: 'date-range',
        min: dates[0],
        max: dates[dates.length - 1],
      });
    }
  });

  return candidates;
}
