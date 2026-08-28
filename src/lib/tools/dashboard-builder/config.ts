import type {
  DashboardColumn,
  DashboardColumnRole,
  DashboardConfig,
  DashboardConfigMapping,
  DashboardFilter,
  DashboardWidget,
} from './types';

const COLUMN_ROLES = new Set<DashboardColumnRole>(['date', 'number', 'category', 'text', 'id']);
const WIDGET_KINDS = new Set(['kpi', 'bar', 'horizontal-bar', 'line', 'donut', 'table', 'ranking']);
const AGGREGATES = new Set(['sum', 'count', 'average', 'max', 'min']);
const SIZES = new Set(['small', 'medium', 'large']);

export function createDashboardConfig(
  columns: DashboardColumn[],
  widgets: DashboardWidget[],
  filters: DashboardFilter[],
): DashboardConfig {
  return {
    schemaVersion: 1,
    sourceColumns: columns.map((column) => ({ id: column.id, name: column.name, role: column.role })),
    widgets: widgets.map((widget) => ({ ...widget })),
    filters: filters.map((filter) => ({ columnId: filter.columnId, type: filter.type })),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}

function isColumn(value: unknown): value is DashboardConfig['sourceColumns'][number] {
  if (!isObject(value)) return false;
  return typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.role === 'string'
    && COLUMN_ROLES.has(value.role as DashboardColumnRole);
}

function isWidget(value: unknown): value is DashboardWidget {
  if (!isObject(value)) return false;
  return typeof value.id === 'string'
    && typeof value.title === 'string'
    && typeof value.kind === 'string'
    && WIDGET_KINDS.has(value.kind)
    && typeof value.aggregate === 'string'
    && AGGREGATES.has(value.aggregate)
    && typeof value.size === 'string'
    && SIZES.has(value.size);
}

function isFilter(value: unknown): value is DashboardConfig['filters'][number] {
  if (!isObject(value)) return false;
  return typeof value.columnId === 'string'
    && (value.type === 'category' || value.type === 'date-range');
}

export function parseDashboardConfig(text: string): DashboardConfig {
  try {
    const parsed: unknown = JSON.parse(text);
    if (!isObject(parsed)
      || parsed.schemaVersion !== 1
      || !Array.isArray(parsed.sourceColumns)
      || !parsed.sourceColumns.every(isColumn)
      || !Array.isArray(parsed.widgets)
      || !parsed.widgets.every(isWidget)
      || !Array.isArray(parsed.filters)
      || !parsed.filters.every(isFilter)) {
      throw new Error('invalid');
    }
    return parsed as unknown as DashboardConfig;
  } catch {
    throw new Error('設定ファイルを読み込めませんでした。TI AUTOMATION STUDIOで保存したJSON設定を選択してください。');
  }
}

function referencedColumnIds(widget: DashboardWidget): string[] {
  return [widget.valueColumnId, widget.groupColumnId, widget.dateColumnId].filter((id): id is string => Boolean(id));
}

export function mapConfigToColumns(
  config: DashboardConfig,
  currentColumns: DashboardColumn[],
): DashboardConfigMapping {
  const sourceNameById = new Map(config.sourceColumns.map((column) => [column.id, column.name]));
  const sourceRoleById = new Map(config.sourceColumns.map((column) => [column.id, column.role]));
  const currentByName = new Map(currentColumns.map((column) => [column.name, column]));
  const missing = new Set<string>();

  const mapId = (sourceId: string): string | null => {
    const name = sourceNameById.get(sourceId);
    if (!name) return null;
    const current = currentByName.get(name);
    if (!current) {
      missing.add(name);
      return null;
    }
    return current.id;
  };

  const mappedColumns = currentColumns.map((column) => {
    const source = config.sourceColumns.find((item) => item.name === column.name);
    return source ? { ...column, role: source.role, confidence: 1 } : { ...column };
  });

  const mappedWidgets: DashboardWidget[] = [];
  config.widgets.forEach((widget) => {
    const refs = referencedColumnIds(widget);
    const refMap = new Map<string, string>();
    let valid = true;
    refs.forEach((sourceId) => {
      const mapped = mapId(sourceId);
      if (!mapped) valid = false;
      else refMap.set(sourceId, mapped);
    });
    if (!valid) return;
    mappedWidgets.push({
      ...widget,
      valueColumnId: widget.valueColumnId ? refMap.get(widget.valueColumnId) : undefined,
      groupColumnId: widget.groupColumnId ? refMap.get(widget.groupColumnId) : undefined,
      dateColumnId: widget.dateColumnId ? refMap.get(widget.dateColumnId) : undefined,
    });
  });

  const mappedFilters: DashboardFilter[] = [];
  config.filters.forEach((filter, index) => {
    const mapped = mapId(filter.columnId);
    if (!mapped) return;
    mappedFilters.push({ id: `config-filter-${index + 1}`, columnId: mapped, type: filter.type });
  });

  config.sourceColumns.forEach((source) => {
    if (!currentByName.has(source.name)) missing.add(source.name);
  });

  return {
    config,
    columns: mappedColumns,
    widgets: mappedWidgets,
    filters: mappedFilters,
    missingColumnNames: [...missing],
  };
}
