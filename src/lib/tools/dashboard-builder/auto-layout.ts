import type {
  DashboardColumn,
  DashboardDataset,
  DashboardDateGrain,
  DashboardWidget,
} from './types';

const PRIMARY_MEASURE_PATTERN = /売上|金額|売価|利益|粗利|費用|コスト|単価|数量|件数|amount|sales|revenue|profit|cost/i;

function parseIsoDate(text: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function chooseDateGrain(values: string[]): DashboardDateGrain {
  const dates = values.map(parseIsoDate).filter((date): date is Date => date != null);
  if (dates.length < 2) return 'day';
  const times = dates.map((date) => date.getTime());
  const spanDays = (Math.max(...times) - Math.min(...times)) / 86_400_000;
  if (spanDays <= 31) return 'day';
  return 'year-month';
}

function distinctCount(dataset: DashboardDataset, column: DashboardColumn): number {
  return new Set(dataset.rows
    .map((row) => row[column.index])
    .filter((value) => value != null && String(value).trim() !== '')
    .map((value) => String(value).trim())).size;
}

function primaryNumber(columns: DashboardColumn[]): DashboardColumn | null {
  const numeric = columns.filter((column) => column.role === 'number');
  if (numeric.length === 0) return null;
  return numeric.find((column) => PRIMARY_MEASURE_PATTERN.test(column.name)) ?? numeric[0];
}

function widget(
  id: string,
  title: string,
  patch: Omit<DashboardWidget, 'id' | 'title'>,
): DashboardWidget {
  return { id, title, ...patch };
}

function dateValues(dataset: DashboardDataset, column: DashboardColumn): string[] {
  return dataset.rows
    .map((row) => row[column.index])
    .filter((value): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function buildInitialDashboardWidgets(
  dataset: DashboardDataset,
  columns: DashboardColumn[],
): DashboardWidget[] {
  const widgets: DashboardWidget[] = [];
  const measure = primaryNumber(columns);
  const date = columns.find((column) => column.role === 'date') ?? null;
  const categories = columns.filter((column) => column.role === 'category');

  if (measure) {
    widgets.push(widget('auto-kpi-sum', `${measure.name} 合計`, {
      kind: 'kpi', aggregate: 'sum', valueColumnId: measure.id, size: 'small',
    }));
  }

  widgets.push(widget('auto-kpi-count', 'データ件数', {
    kind: 'kpi', aggregate: 'count', size: 'small',
  }));

  if (measure) {
    widgets.push(widget('auto-kpi-average', `${measure.name} 平均`, {
      kind: 'kpi', aggregate: 'average', valueColumnId: measure.id, size: 'small',
    }));
    widgets.push(widget('auto-kpi-max', `${measure.name} 最大`, {
      kind: 'kpi', aggregate: 'max', valueColumnId: measure.id, size: 'small',
    }));
  }

  if (date && measure) {
    const grain = chooseDateGrain(dateValues(dataset, date));
    const prefix = grain === 'day' ? '日別' : grain === 'month' ? '月別' : '月別';
    widgets.push(widget('auto-line-primary', `${prefix} ${measure.name}`, {
      kind: 'line', aggregate: 'sum', valueColumnId: measure.id,
      dateColumnId: date.id, dateGrain: grain, size: 'large',
    }));
  }

  const primaryCategory = categories[0];
  if (primaryCategory && measure) {
    widgets.push(widget('auto-bar-primary', `${primaryCategory.name}別 ${measure.name}`, {
      kind: distinctCount(dataset, primaryCategory) > 8 ? 'horizontal-bar' : 'bar',
      aggregate: 'sum', valueColumnId: measure.id, groupColumnId: primaryCategory.id,
      size: 'medium', limit: 12,
    }));
  }

  const rankingCategory = categories[1] ?? categories[0];
  if (rankingCategory && measure) {
    widgets.push(widget('auto-ranking-primary', `${rankingCategory.name}別 ${measure.name} ランキング`, {
      kind: 'ranking', aggregate: 'sum', valueColumnId: measure.id,
      groupColumnId: rankingCategory.id, size: 'medium', limit: 10,
    }));
  }

  const donutCategory = categories.find((column) => {
    const count = distinctCount(dataset, column);
    return count >= 2 && count <= 8;
  });
  if (donutCategory && measure && widgets.length < 8) {
    widgets.push(widget('auto-donut-primary', `${donutCategory.name}別 ${measure.name} 構成比`, {
      kind: 'donut', aggregate: 'sum', valueColumnId: measure.id,
      groupColumnId: donutCategory.id, size: 'medium', limit: 8,
    }));
  }

  return widgets.slice(0, 8);
}
