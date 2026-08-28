export type DashboardCellValue = string | number | boolean | null;

export type DashboardColumnRole = 'date' | 'number' | 'category' | 'text' | 'id';
export type DashboardAggregate = 'sum' | 'count' | 'average' | 'max' | 'min';
export type DashboardWidgetKind = 'kpi' | 'bar' | 'horizontal-bar' | 'line' | 'donut' | 'table' | 'ranking';
export type DashboardWidgetSize = 'small' | 'medium' | 'large';
export type DashboardDateGrain = 'day' | 'month' | 'year-month';

export interface DashboardSourceColumn {
  id: string;
  name: string;
  index: number;
}

export interface DashboardColumn extends DashboardSourceColumn {
  role: DashboardColumnRole;
  confidence: number;
  sampleValues: string[];
}

export interface DashboardDataset {
  sheetName: string;
  columns: DashboardSourceColumn[];
  rows: DashboardCellValue[][];
}

export interface DashboardFilter {
  id: string;
  columnId: string;
  type: 'category' | 'date-range';
  values?: string[];
  start?: string;
  end?: string;
}

export interface DashboardFilterCandidate {
  id: string;
  columnId: string;
  columnName: string;
  type: DashboardFilter['type'];
  values?: string[];
  min?: string;
  max?: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  kind: DashboardWidgetKind;
  aggregate: DashboardAggregate;
  valueColumnId?: string;
  groupColumnId?: string;
  dateColumnId?: string;
  dateGrain?: DashboardDateGrain;
  size: DashboardWidgetSize;
  limit?: number;
}

export interface DashboardWidgetResult {
  widgetId: string;
  labels: string[];
  values: number[];
  scalar?: number;
  rows?: Array<{ label: string; value: number }>;
}

export interface DashboardConfig {
  schemaVersion: 1;
  sourceColumns: Array<{ name: string; role: DashboardColumnRole }>;
  widgets: DashboardWidget[];
  filters: Array<Pick<DashboardFilter, 'columnId' | 'type'>>;
}

export interface DashboardConfigMapping {
  config: DashboardConfig;
  widgets: DashboardWidget[];
  filters: DashboardFilter[];
  missingColumnNames: string[];
}

export interface DashboardAnalyzeResult {
  columns: DashboardColumn[];
  widgets: DashboardWidget[];
  filterCandidates: DashboardFilterCandidate[];
}

export interface DashboardAggregateResult {
  results: DashboardWidgetResult[];
  filteredRowIndexes: number[];
}
