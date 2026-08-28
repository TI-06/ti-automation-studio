import { formatDashboardNumber } from '../../../lib/tools/dashboard-builder/aggregate';
import { buildInitialDashboardWidgets } from '../../../lib/tools/dashboard-builder/auto-layout';
import {
  createDashboardConfig,
  mapConfigToColumns,
  parseDashboardConfig,
} from '../../../lib/tools/dashboard-builder/config';
import { exportDashboardWorkbook } from '../../../lib/tools/dashboard-builder/export';
import { buildFilterCandidates } from '../../../lib/tools/dashboard-builder/filters';
import {
  DASHBOARD_LARGE_ROWS,
  detectCsvEncoding,
  parseDashboardCsv,
  parseDashboardExcel,
  validateDashboardFile,
  type DetectedCsvEncoding,
} from '../../../lib/tools/dashboard-builder/import';
import { overrideDashboardColumnRole } from '../../../lib/tools/dashboard-builder/inference';
import { createDashboardSample } from '../../../lib/tools/dashboard-builder/sample';
import type {
  DashboardCellValue,
  DashboardColumn,
  DashboardColumnRole,
  DashboardConfig,
  DashboardDataset,
  DashboardFilter,
  DashboardFilterCandidate,
  DashboardWidget,
  DashboardWidgetKind,
  DashboardWidgetResult,
} from '../../../lib/tools/dashboard-builder/types';
import type { DashboardWorkerResponse } from '../../../workers/dashboard-builder.worker';
import { bindToolResultCta } from '../result-cta';
import {
  destroyAllDashboardCharts,
  renderDashboardChart,
} from './charts';
import {
  dashboardExportFileName,
  downloadDashboardBlob,
  downloadDashboardText,
  exportDashboardImage,
  printDashboard,
} from './export-client';

export function moveDashboardWidget(
  widgets: DashboardWidget[],
  widgetId: string,
  direction: -1 | 1,
): DashboardWidget[] {
  const index = widgets.findIndex((widget) => widget.id === widgetId);
  if (index < 0) return widgets.map((widget) => ({ ...widget }));
  const target = index + direction;
  if (target < 0 || target >= widgets.length) return widgets.map((widget) => ({ ...widget }));
  const next = widgets.map((widget) => ({ ...widget }));
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

export function filterRowsForDashboardSearch(
  rows: DashboardCellValue[][],
  query: string,
): DashboardCellValue[][] {
  const needle = query.trim().toLocaleLowerCase('ja-JP');
  if (!needle) return rows;
  return rows.filter((row) => row.some((value) => String(value ?? '').toLocaleLowerCase('ja-JP').includes(needle)));
}

type SourceFormat = 'csv' | 'excel' | 'sample' | null;

interface DashboardUiState {
  file: File | null;
  buffer: ArrayBuffer | null;
  format: SourceFormat;
  detectedEncoding: DetectedCsvEncoding;
  dataset: DashboardDataset | null;
  columns: DashboardColumn[];
  widgets: DashboardWidget[];
  results: DashboardWidgetResult[];
  filterCandidates: DashboardFilterCandidate[];
  filters: DashboardFilter[];
  filteredRowIndexes: number[];
  sheetNames: string[];
  pendingConfig: DashboardConfig | null;
  busy: boolean;
  dirty: boolean;
  draggedWidgetId: string;
  pendingSheetName: string;
}

const ROLE_LABELS: Record<DashboardColumnRole, string> = {
  date: '日付',
  number: '数値',
  category: '分類',
  text: '文字列',
  id: 'ID・コード',
};

const KIND_LABELS: Record<DashboardWidgetKind, string> = {
  kpi: 'KPI',
  bar: '棒グラフ',
  'horizontal-bar': '横棒グラフ',
  line: '折れ線グラフ',
  donut: 'ドーナツ',
  table: '集計表',
  ranking: 'ランキング',
};

function extensionOf(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}

function valueText(value: DashboardCellValue): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return String(value);
}

function cloneWidgets(widgets: DashboardWidget[]): DashboardWidget[] {
  return widgets.map((widget) => ({ ...widget }));
}

function newWidgetId(): string {
  return `widget-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function initDashboardBuilder(appRoot: HTMLElement): void {
  const state: DashboardUiState = {
    file: null,
    buffer: null,
    format: null,
    detectedEncoding: 'unknown',
    dataset: null,
    columns: [],
    widgets: [],
    results: [],
    filterCandidates: [],
    filters: [],
    filteredRowIndexes: [],
    sheetNames: [],
    pendingConfig: null,
    busy: false,
    dirty: false,
    draggedWidgetId: '',
    pendingSheetName: '',
  };
  const resultCta = bindToolResultCta('dashboard-builder');

  const query = <T extends Element>(selector: string): T => {
    const element = appRoot.querySelector(selector);
    if (!element) throw new Error(`必要な画面要素が見つかりません: ${selector}`);
    return element as T;
  };
  const documentQuery = <T extends Element>(selector: string): T => {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`必要な画面要素が見つかりません: ${selector}`);
    return element as T;
  };

  const fileInput = query<HTMLInputElement>('[data-dashboard-file]');
  const fileName = query<HTMLElement>('[data-dashboard-file-name]');
  const sampleButton = query<HTMLButtonElement>('[data-dashboard-sample]');
  const resetButton = query<HTMLButtonElement>('[data-dashboard-reset]');
  const errorMessage = query<HTMLElement>('[data-dashboard-error]');
  const largeWarning = query<HTMLElement>('[data-dashboard-large-warning]');
  const fileSettings = query<HTMLElement>('[data-dashboard-file-settings]');
  const sheetField = query<HTMLElement>('[data-dashboard-sheet-field]');
  const sheetSelect = query<HTMLSelectElement>('[data-dashboard-sheet]');
  const encodingField = query<HTMLElement>('[data-dashboard-encoding-field]');
  const encodingSelect = query<HTMLSelectElement>('[data-dashboard-encoding]');
  const configInput = query<HTMLInputElement>('[data-config-import]');
  const columnSummary = query<HTMLElement>('[data-dashboard-column-summary]');
  const columnsGrid = query<HTMLElement>('[data-dashboard-columns]');
  const filtersGrid = query<HTMLElement>('[data-dashboard-filters]');
  const filterReset = query<HTMLButtonElement>('[data-filter-reset]');
  const grid = query<HTMLElement>('[data-dashboard-grid]');
  const empty = query<HTMLElement>('[data-dashboard-empty]');
  const status = query<HTMLElement>('[data-dashboard-status]');
  const boardTitle = query<HTMLElement>('[data-dashboard-title]');
  const rowCount = query<HTMLElement>('[data-dashboard-row-count]');
  const widgetCount = query<HTMLElement>('[data-dashboard-widget-count]');
  const exportArea = query<HTMLElement>('[data-dashboard-export-area]');
  const addWidgetButton = query<HTMLButtonElement>('[data-widget-add]');
  const exportImageButton = query<HTMLButtonElement>('[data-export-image]');
  const exportPdfButton = query<HTMLButtonElement>('[data-export-pdf]');
  const exportExcelButton = query<HTMLButtonElement>('[data-export-excel]');
  const exportConfigButton = query<HTMLButtonElement>('[data-export-config]');
  const searchInput = query<HTMLInputElement>('[data-dashboard-search]');
  const dataHead = query<HTMLTableSectionElement>('[data-dashboard-data-head]');
  const dataBody = query<HTMLTableSectionElement>('[data-dashboard-data-body]');
  const dataEmpty = query<HTMLElement>('[data-dashboard-data-empty]');
  const dataNote = query<HTMLElement>('[data-dashboard-data-note]');
  const progressBox = query<HTMLElement>('[data-tool-progress]');
  const progressLabel = query<HTMLElement>('[data-progress-label]');
  const progressCount = query<HTMLElement>('[data-progress-count]');
  const progressBar = query<HTMLElement>('[data-progress-bar]');
  const tabButtons = [...appRoot.querySelectorAll<HTMLButtonElement>('[data-dashboard-tab]')];
  const views = [...appRoot.querySelectorAll<HTMLElement>('[data-dashboard-view]')];

  const widgetDialog = documentQuery<HTMLDialogElement>('[data-widget-dialog]');
  const widgetForm = documentQuery<HTMLFormElement>('[data-widget-form]');
  const widgetDialogTitle = documentQuery<HTMLElement>('[data-widget-dialog-title]');
  const widgetIdInput = documentQuery<HTMLInputElement>('[data-widget-id]');
  const widgetTitleInput = documentQuery<HTMLInputElement>('[data-widget-title]');
  const widgetKind = documentQuery<HTMLSelectElement>('[data-widget-kind]');
  const widgetAggregate = documentQuery<HTMLSelectElement>('[data-widget-aggregate]');
  const widgetValueColumn = documentQuery<HTMLSelectElement>('[data-widget-value-column]');
  const widgetGroupColumn = documentQuery<HTMLSelectElement>('[data-widget-group-column]');
  const widgetDateColumn = documentQuery<HTMLSelectElement>('[data-widget-date-column]');
  const widgetDateGrain = documentQuery<HTMLSelectElement>('[data-widget-date-grain]');
  const widgetSize = documentQuery<HTMLSelectElement>('[data-widget-dialog-size]');
  const widgetError = documentQuery<HTMLElement>('[data-widget-error]');
  const widgetClose = documentQuery<HTMLButtonElement>('[data-widget-dialog-close]');
  const widgetCancel = documentQuery<HTMLButtonElement>('[data-widget-dialog-cancel]');

  const confirmDialog = documentQuery<HTMLDialogElement>('[data-dashboard-confirm-dialog]');
  const confirmCancel = documentQuery<HTMLButtonElement>('[data-dashboard-confirm-cancel]');
  const confirmAccept = documentQuery<HTMLButtonElement>('[data-dashboard-confirm-accept]');

  const worker = new Worker(new URL('../../../workers/dashboard-builder.worker.ts', import.meta.url), { type: 'module' });

  function showError(message: string): void {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
  }

  function clearError(): void {
    errorMessage.textContent = '';
    errorMessage.hidden = true;
  }

  function showProgress(label: string, stage = 1): void {
    const percentages = [18, 44, 72, 100];
    progressBox.hidden = false;
    progressLabel.textContent = label;
    progressCount.textContent = `${Math.max(1, Math.min(4, stage))} / 4`;
    progressBar.style.width = `${percentages[stage - 1] ?? 18}%`;
  }

  function hideProgress(): void {
    progressBox.hidden = true;
    progressCount.textContent = '';
    progressBar.style.width = '0%';
  }

  function setBusy(busy: boolean): void {
    state.busy = busy;
    appRoot.setAttribute('aria-busy', String(busy));
    fileInput.disabled = busy;
    sampleButton.disabled = busy;
    sheetSelect.disabled = busy || state.format !== 'excel';
    encodingSelect.disabled = busy || state.format !== 'csv';
    const noData = !state.dataset;
    addWidgetButton.disabled = busy || noData || state.widgets.length >= 12;
    exportImageButton.disabled = busy || noData || state.widgets.length === 0;
    exportPdfButton.disabled = busy || noData || state.widgets.length === 0;
    exportExcelButton.disabled = busy || noData || state.widgets.length === 0;
    exportConfigButton.disabled = busy || noData;
    filterReset.disabled = busy || state.filters.length === 0;
  }

  function currentFilteredRows(): DashboardCellValue[][] {
    if (!state.dataset) return [];
    return state.filteredRowIndexes.map((index) => state.dataset?.rows[index] ?? []).filter((row) => row.length > 0);
  }

  function renderColumnSummary(): void {
    if (!state.dataset) {
      columnSummary.textContent = 'データ未読込';
      return;
    }
    const counts = state.columns.reduce<Record<DashboardColumnRole, number>>((acc, column) => {
      acc[column.role] += 1;
      return acc;
    }, { date: 0, number: 0, category: 0, text: 0, id: 0 });
    columnSummary.textContent = `日付 ${counts.date} / 数値 ${counts.number} / 分類 ${counts.category} / ID ${counts.id}`;
  }

  function renderColumns(): void {
    columnsGrid.replaceChildren();
    renderColumnSummary();
    if (!state.dataset || state.columns.length === 0) {
      const block = document.createElement('div');
      block.className = 'tool-empty-state dashboard-compact-empty';
      const body = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = '列情報はまだありません';
      const p = document.createElement('p');
      p.textContent = 'ファイルを読み込むと、自動判定した列の種類を表示します。';
      body.append(strong, p);
      block.append(body);
      columnsGrid.append(block);
      return;
    }

    state.columns.forEach((column) => {
      const card = document.createElement('div');
      card.className = 'dashboard-column-card';
      const name = document.createElement('strong');
      name.textContent = column.name;
      const samples = document.createElement('p');
      samples.textContent = column.sampleValues.length > 0 ? `例: ${column.sampleValues.join(' / ')}` : '値なし';
      const select = document.createElement('select');
      select.setAttribute('aria-label', `${column.name} の列種類`);
      (Object.keys(ROLE_LABELS) as DashboardColumnRole[]).forEach((role) => {
        const option = document.createElement('option');
        option.value = role;
        option.textContent = ROLE_LABELS[role];
        option.selected = role === column.role;
        select.append(option);
      });
      select.addEventListener('change', () => {
        if (!state.dataset) return;
        state.columns = overrideDashboardColumnRole(state.columns, column.id, select.value as DashboardColumnRole);
        state.filterCandidates = buildFilterCandidates(state.dataset, state.columns);
        state.filters = [];
        state.widgets = buildInitialDashboardWidgets(state.dataset, state.columns);
        state.dirty = true;
        renderColumns();
        renderFilters();
        requestAggregation();
      });
      card.append(name, samples, select);
      columnsGrid.append(card);
    });
  }

  function activeCategoryValues(columnId: string): string[] {
    return state.filters.find((filter) => filter.columnId === columnId && filter.type === 'category')?.values ?? [];
  }

  function activeDateFilter(columnId: string): DashboardFilter | undefined {
    return state.filters.find((filter) => filter.columnId === columnId && filter.type === 'date-range');
  }

  function setCategoryFilter(candidate: DashboardFilterCandidate, values: string[]): void {
    state.filters = state.filters.filter((filter) => filter.columnId !== candidate.columnId);
    if (values.length > 0) {
      state.filters.push({ id: candidate.id, columnId: candidate.columnId, type: 'category', values });
    }
    state.dirty = true;
    requestAggregation();
  }

  function setDateFilter(candidate: DashboardFilterCandidate, start: string, end: string): void {
    state.filters = state.filters.filter((filter) => filter.columnId !== candidate.columnId);
    if (start || end) {
      state.filters.push({ id: candidate.id, columnId: candidate.columnId, type: 'date-range', start: start || undefined, end: end || undefined });
    }
    state.dirty = true;
    requestAggregation();
  }

  function renderFilters(): void {
    filtersGrid.replaceChildren();
    if (!state.dataset || state.filterCandidates.length === 0) {
      const p = document.createElement('p');
      p.className = 'dashboard-muted';
      p.textContent = state.dataset
        ? '絞り込みに使える分類・日付列がありません。列の種類を変更すると候補を追加できます。'
        : '分類や日付として判定した列がある場合、ここに絞り込み条件を表示します。';
      filtersGrid.append(p);
      setBusy(state.busy);
      return;
    }

    state.filterCandidates.forEach((candidate) => {
      const card = document.createElement('div');
      card.className = 'dashboard-filter-card';
      const label = document.createElement('span');
      label.textContent = candidate.columnName;
      card.append(label);

      if (candidate.type === 'category') {
        const checks = document.createElement('div');
        checks.className = 'dashboard-filter-checks';
        const selected = new Set(activeCategoryValues(candidate.columnId));
        (candidate.values ?? []).forEach((value) => {
          const item = document.createElement('label');
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.checked = selected.has(value);
          checkbox.addEventListener('change', () => {
            const values = [...checks.querySelectorAll<HTMLInputElement>('input:checked')].map((input) => input.value);
            setCategoryFilter(candidate, values);
          });
          checkbox.value = value;
          const text = document.createElement('span');
          text.textContent = value;
          item.append(checkbox, text);
          checks.append(item);
        });
        card.append(checks);
      } else {
        const active = activeDateFilter(candidate.columnId);
        const start = document.createElement('input');
        start.type = 'date';
        start.value = active?.start ?? '';
        start.min = candidate.min ?? '';
        start.max = candidate.max ?? '';
        start.setAttribute('aria-label', `${candidate.columnName} 開始日`);
        const end = document.createElement('input');
        end.type = 'date';
        end.value = active?.end ?? '';
        end.min = candidate.min ?? '';
        end.max = candidate.max ?? '';
        end.setAttribute('aria-label', `${candidate.columnName} 終了日`);
        const onChange = () => setDateFilter(candidate, start.value, end.value);
        start.addEventListener('change', onChange);
        end.addEventListener('change', onChange);
        card.append(start, end);
      }
      filtersGrid.append(card);
    });
    setBusy(state.busy);
  }

  function renderKpi(widget: DashboardWidget, result: DashboardWidgetResult, container: HTMLElement): void {
    const box = document.createElement('div');
    box.className = 'dashboard-widget-kpi';
    const strong = document.createElement('strong');
    strong.textContent = formatDashboardNumber(result.scalar ?? 0);
    const sub = document.createElement('span');
    sub.textContent = widget.aggregate === 'count' ? '件' : '集計値';
    box.append(strong, sub);
    container.append(box);
  }

  function renderRanking(result: DashboardWidgetResult, container: HTMLElement): void {
    const list = document.createElement('div');
    list.className = 'dashboard-ranking';
    (result.rows ?? result.labels.map((label, index) => ({ label, value: result.values[index] ?? 0 }))).forEach((row, index) => {
      const line = document.createElement('div');
      line.className = 'dashboard-ranking-row';
      const label = document.createElement('span');
      label.textContent = `${index + 1}. ${row.label}`;
      const value = document.createElement('strong');
      value.textContent = formatDashboardNumber(row.value);
      line.append(label, value);
      list.append(line);
    });
    container.append(list);
  }

  function renderAggregateTable(result: DashboardWidgetResult, container: HTMLElement): void {
    const table = document.createElement('table');
    table.className = 'dashboard-aggregate-table';
    const thead = document.createElement('thead');
    const header = document.createElement('tr');
    const h1 = document.createElement('th');
    h1.textContent = '項目';
    const h2 = document.createElement('th');
    h2.textContent = '値';
    header.append(h1, h2);
    thead.append(header);
    const tbody = document.createElement('tbody');
    result.labels.slice(0, 50).forEach((label, index) => {
      const tr = document.createElement('tr');
      const td1 = document.createElement('td');
      td1.textContent = label;
      const td2 = document.createElement('td');
      td2.textContent = formatDashboardNumber(result.values[index] ?? 0);
      tr.append(td1, td2);
      tbody.append(tr);
    });
    table.append(thead, tbody);
    container.append(table);
  }

  function reorderByDrop(draggedId: string, targetId: string): void {
    if (!draggedId || draggedId === targetId) return;
    const from = state.widgets.findIndex((widget) => widget.id === draggedId);
    const to = state.widgets.findIndex((widget) => widget.id === targetId);
    if (from < 0 || to < 0) return;
    const next = cloneWidgets(state.widgets);
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    state.widgets = next;
    state.dirty = true;
    renderWidgets();
  }

  function renderWidgets(): void {
    destroyAllDashboardCharts();
    grid.replaceChildren();
    widgetCount.textContent = `${state.widgets.length.toLocaleString('ja-JP')}項目`;
    if (!state.dataset || state.widgets.length === 0) {
      resultCta.hide();
      empty.hidden = false;
      grid.append(empty);
      setBusy(state.busy);
      return;
    }
    empty.hidden = true;

    state.widgets.forEach((widget, index) => {
      const result = state.results.find((item) => item.widgetId === widget.id) ?? { widgetId: widget.id, labels: [], values: [], scalar: 0 };
      const card = document.createElement('article');
      card.className = 'dashboard-widget';
      card.dataset.size = widget.size;
      card.dataset.widgetId = widget.id;
      card.draggable = true;
      card.addEventListener('dragstart', () => {
        state.draggedWidgetId = widget.id;
        card.dataset.dragging = 'true';
      });
      card.addEventListener('dragend', () => {
        state.draggedWidgetId = '';
        delete card.dataset.dragging;
      });
      card.addEventListener('dragover', (event) => event.preventDefault());
      card.addEventListener('drop', (event) => {
        event.preventDefault();
        reorderByDrop(state.draggedWidgetId, widget.id);
      });

      const head = document.createElement('div');
      head.className = 'dashboard-widget-head';
      const title = document.createElement('h3');
      title.className = 'dashboard-widget-title';
      title.textContent = widget.title;
      const tools = document.createElement('div');
      tools.className = 'dashboard-widget-tools';
      tools.setAttribute('data-export-ignore', '');

      const actionButton = (label: string, ariaLabel: string, onClick: () => void): HTMLButtonElement => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.setAttribute('aria-label', ariaLabel);
        button.addEventListener('click', onClick);
        return button;
      };
      tools.append(
        actionButton('↑', `${widget.title}を前へ移動`, () => {
          state.widgets = moveDashboardWidget(state.widgets, widget.id, -1);
          state.dirty = true;
          renderWidgets();
        }),
        actionButton('↓', `${widget.title}を後ろへ移動`, () => {
          state.widgets = moveDashboardWidget(state.widgets, widget.id, 1);
          state.dirty = true;
          renderWidgets();
        }),
        actionButton('編集', `${widget.title}を編集`, () => openWidgetDialog(widget)),
        actionButton('×', `${widget.title}を削除`, () => {
          state.widgets = state.widgets.filter((item) => item.id !== widget.id);
          state.dirty = true;
          renderWidgets();
          setBusy(state.busy);
        }),
      );
      head.append(title, tools);
      card.append(head);

      if (widget.kind === 'kpi') {
        renderKpi(widget, result, card);
      } else if (widget.kind === 'ranking') {
        renderRanking(result, card);
      } else if (widget.kind === 'table') {
        renderAggregateTable(result, card);
      } else {
        const chartWrap = document.createElement('div');
        chartWrap.className = 'dashboard-chart-wrap';
        const canvas = document.createElement('canvas');
        canvas.setAttribute('aria-label', widget.title);
        canvas.setAttribute('role', 'img');
        chartWrap.append(canvas);
        card.append(chartWrap);
        window.requestAnimationFrame(() => renderDashboardChart(canvas, widget, result));
      }
      grid.append(card);

      if (index === 0 && document.activeElement === grid) card.focus?.();
    });
    setBusy(state.busy);
  }

  function renderDataTable(): void {
    dataHead.replaceChildren();
    dataBody.replaceChildren();
    if (!state.dataset || state.columns.length === 0) {
      dataEmpty.hidden = false;
      dataNote.textContent = '先頭500行まで表示します。';
      return;
    }

    const header = document.createElement('tr');
    state.columns.forEach((column) => {
      const th = document.createElement('th');
      th.textContent = column.name;
      header.append(th);
    });
    dataHead.append(header);

    const filtered = currentFilteredRows();
    const searched = filterRowsForDashboardSearch(filtered, searchInput.value);
    const visible = searched.slice(0, 500);
    visible.forEach((row) => {
      const tr = document.createElement('tr');
      state.columns.forEach((column) => {
        const td = document.createElement('td');
        td.textContent = valueText(row[column.index] ?? null);
        tr.append(td);
      });
      dataBody.append(tr);
    });
    dataEmpty.hidden = visible.length > 0;
    dataNote.textContent = `${searched.length.toLocaleString('ja-JP')}行中 ${visible.length.toLocaleString('ja-JP')}行を表示${searched.length > 500 ? '（先頭500行まで）' : ''}`;
  }

  function renderSummary(): void {
    const filteredCount = state.filteredRowIndexes.length;
    rowCount.textContent = `${filteredCount.toLocaleString('ja-JP')}行`;
    widgetCount.textContent = `${state.widgets.length.toLocaleString('ja-JP')}項目`;
    boardTitle.textContent = state.dataset?.sheetName ? `${state.dataset.sheetName} ダッシュボード` : '集計結果';
    status.textContent = state.dataset
      ? `${state.dataset.rows.length.toLocaleString('ja-JP')}行のデータから、現在 ${filteredCount.toLocaleString('ja-JP')}行を集計しています。`
      : 'ファイルを選ぶか、サンプルデータでお試しください。';
  }

  function renderAllResults(): void {
    renderSummary();
    renderWidgets();
    renderDataTable();
    if (state.dataset && state.widgets.length > 0) resultCta.show();
    else resultCta.hide();
    setBusy(false);
    hideProgress();
  }

  function requestAnalysis(): void {
    if (!state.dataset) return;
    resultCta.hide();
    clearError();
    setBusy(true);
    showProgress('列の種類を確認しています', 1);
    worker.postMessage({ type: 'analyze', dataset: state.dataset });
  }

  function requestAggregation(): void {
    if (!state.dataset) return;
    clearError();
    setBusy(true);
    showProgress('絞り込み条件で再集計しています', 1);
    worker.postMessage({
      type: 'aggregate',
      dataset: state.dataset,
      columns: state.columns,
      widgets: state.widgets,
      filters: state.filters,
    });
  }

  function applyPendingConfig(baseColumns: DashboardColumn[], defaultWidgets: DashboardWidget[]): void {
    if (!state.dataset || !state.pendingConfig) {
      state.columns = baseColumns;
      state.widgets = defaultWidgets;
      return;
    }
    const mapping = mapConfigToColumns(state.pendingConfig, baseColumns);
    state.columns = mapping.columns;
    state.widgets = mapping.widgets.length > 0 ? mapping.widgets.slice(0, 12) : buildInitialDashboardWidgets(state.dataset, mapping.columns);
    state.pendingConfig = null;
    state.dirty = true;
    if (mapping.missingColumnNames.length > 0) {
      showError(`設定内の一部の列が見つからなかったため、利用できる項目だけ反映しました: ${mapping.missingColumnNames.join('、')}`);
    }
  }

  worker.addEventListener('message', (event: MessageEvent<DashboardWorkerResponse>) => {
    const message = event.data;
    if (message.type === 'progress') {
      showProgress(message.label, message.stage);
      return;
    }
    if (message.type === 'error') {
      showError(`${message.title} ${message.message}`);
      setBusy(false);
      hideProgress();
      return;
    }
    if (message.type === 'analyzed') {
      applyPendingConfig(message.columns, message.widgets);
      state.filterCandidates = state.dataset ? buildFilterCandidates(state.dataset, state.columns) : message.filterCandidates;
      state.filters = [];
      renderColumns();
      renderFilters();
      requestAggregation();
      return;
    }
    state.results = message.results;
    state.filteredRowIndexes = message.filteredRowIndexes;
    renderAllResults();
  });

  function populateSheetSelect(sheetNames: string[], selected: string): void {
    sheetSelect.replaceChildren();
    sheetNames.forEach((sheetName) => {
      const option = document.createElement('option');
      option.value = sheetName;
      option.textContent = sheetName;
      option.selected = sheetName === selected;
      sheetSelect.append(option);
    });
  }

  function updateSourceSettings(): void {
    const hasFile = state.format === 'csv' || state.format === 'excel';
    fileSettings.hidden = !hasFile;
    sheetField.hidden = state.format !== 'excel' || state.sheetNames.length <= 1;
    encodingField.hidden = state.format !== 'csv';
    largeWarning.hidden = !state.dataset || state.dataset.rows.length <= DASHBOARD_LARGE_ROWS;
    setBusy(state.busy);
  }

  function setDataset(dataset: DashboardDataset): void {
    state.dataset = dataset;
    state.results = [];
    state.filters = [];
    state.filteredRowIndexes = dataset.rows.map((_, index) => index);
    state.dirty = false;
    searchInput.value = '';
    updateSourceSettings();
    requestAnalysis();
  }

  function parseCurrentCsv(encodingValue = encodingSelect.value): void {
    if (!state.buffer) return;
    const bytes = new Uint8Array(state.buffer);
    const encoding = encodingValue === 'auto' ? detectCsvEncoding(bytes) : encodingValue as DetectedCsvEncoding;
    state.detectedEncoding = encoding;
    if (encoding === 'unknown') {
      showError('CSVの文字コードを自動判定できませんでした。UTF-8またはShift_JISを選択してください。');
      setBusy(false);
      return;
    }
    encodingSelect.value = encodingValue === 'auto' ? 'auto' : encoding;
    setDataset(parseDashboardCsv(bytes, encoding));
  }

  function parseCurrentExcel(sheetName?: string): void {
    if (!state.buffer || !state.file) return;
    const parsed = parseDashboardExcel(state.buffer, state.file.name, sheetName);
    state.sheetNames = parsed.sheetNames;
    populateSheetSelect(parsed.sheetNames, parsed.dataset.sheetName);
    setDataset(parsed.dataset);
  }

  async function loadFile(file: File): Promise<void> {
    clearError();
    const validation = validateDashboardFile(file);
    if (!validation.valid) {
      showError(validation.message);
      fileInput.value = '';
      return;
    }
    setBusy(true);
    showProgress('ファイルを読み込んでいます', 1);
    try {
      state.file = file;
      state.buffer = await file.arrayBuffer();
      fileName.textContent = file.name;
      const extension = extensionOf(file.name);
      if (extension === 'csv') {
        state.format = 'csv';
        state.sheetNames = [];
        parseCurrentCsv('auto');
      } else {
        state.format = 'excel';
        state.detectedEncoding = 'unknown';
        parseCurrentExcel();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'ファイルを読み込めませんでした。');
      setBusy(false);
      hideProgress();
    }
  }

  function resetDashboard(): void {
    resultCta.hide();
    state.file = null;
    state.buffer = null;
    state.format = null;
    state.detectedEncoding = 'unknown';
    state.dataset = null;
    state.columns = [];
    state.widgets = [];
    state.results = [];
    state.filterCandidates = [];
    state.filters = [];
    state.filteredRowIndexes = [];
    state.sheetNames = [];
    state.pendingConfig = null;
    state.dirty = false;
    state.draggedWidgetId = '';
    state.pendingSheetName = '';
    destroyAllDashboardCharts();
    fileInput.value = '';
    configInput.value = '';
    fileName.textContent = '未選択';
    sheetSelect.replaceChildren();
    encodingSelect.value = 'auto';
    searchInput.value = '';
    clearError();
    hideProgress();
    updateSourceSettings();
    renderColumns();
    renderFilters();
    state.filteredRowIndexes = [];
    renderSummary();
    renderWidgets();
    renderDataTable();
    setBusy(false);
  }

  function option(select: HTMLSelectElement, value: string, label: string): void {
    const item = document.createElement('option');
    item.value = value;
    item.textContent = label;
    select.append(item);
  }

  function populateWidgetColumnOptions(): void {
    const numeric = state.columns.filter((column) => column.role === 'number');
    const groups = state.columns.filter((column) => column.role === 'category' || column.role === 'text' || column.role === 'id');
    const dates = state.columns.filter((column) => column.role === 'date');

    widgetValueColumn.replaceChildren();
    option(widgetValueColumn, '', '選択なし（件数など）');
    numeric.forEach((column) => option(widgetValueColumn, column.id, column.name));
    widgetGroupColumn.replaceChildren();
    option(widgetGroupColumn, '', '選択なし');
    groups.forEach((column) => option(widgetGroupColumn, column.id, column.name));
    widgetDateColumn.replaceChildren();
    option(widgetDateColumn, '', '選択なし');
    dates.forEach((column) => option(widgetDateColumn, column.id, column.name));
  }

  function openWidgetDialog(widget?: DashboardWidget): void {
    if (!state.dataset) return;
    populateWidgetColumnOptions();
    widgetError.hidden = true;
    widgetError.textContent = '';
    widgetDialogTitle.textContent = widget ? 'グラフを編集' : 'グラフを追加';
    widgetIdInput.value = widget?.id ?? '';
    widgetTitleInput.value = widget?.title ?? '';
    widgetKind.value = widget?.kind ?? 'bar';
    widgetAggregate.value = widget?.aggregate ?? 'sum';
    widgetValueColumn.value = widget?.valueColumnId ?? state.columns.find((column) => column.role === 'number')?.id ?? '';
    widgetGroupColumn.value = widget?.groupColumnId ?? state.columns.find((column) => column.role === 'category')?.id ?? '';
    widgetDateColumn.value = widget?.dateColumnId ?? state.columns.find((column) => column.role === 'date')?.id ?? '';
    widgetDateGrain.value = widget?.dateGrain ?? 'year-month';
    widgetSize.value = widget?.size ?? 'medium';
    widgetDialog.showModal();
    window.setTimeout(() => widgetTitleInput.focus(), 0);
  }

  function submitWidget(): void {
    const id = widgetIdInput.value || newWidgetId();
    const kind = widgetKind.value as DashboardWidgetKind;
    const aggregate = widgetAggregate.value as DashboardWidget['aggregate'];
    const valueColumnId = widgetValueColumn.value || undefined;
    const groupColumnId = widgetGroupColumn.value || undefined;
    const dateColumnId = widgetDateColumn.value || undefined;
    const editing = Boolean(widgetIdInput.value);

    if (!widgetTitleInput.value.trim()) {
      widgetError.textContent = 'タイトルを入力してください。';
      widgetError.hidden = false;
      return;
    }
    if (!editing && state.widgets.length >= 12) {
      widgetError.textContent = 'グラフは最大12項目までです。不要な項目を削除してから追加してください。';
      widgetError.hidden = false;
      return;
    }
    if (aggregate !== 'count' && !valueColumnId) {
      widgetError.textContent = '件数以外の集計では、集計する数値列を選択してください。';
      widgetError.hidden = false;
      return;
    }
    if (kind === 'line' && !dateColumnId) {
      widgetError.textContent = '折れ線グラフでは日付列を選択してください。';
      widgetError.hidden = false;
      return;
    }
    if (['bar', 'horizontal-bar', 'donut', 'ranking', 'table'].includes(kind) && !groupColumnId) {
      widgetError.textContent = 'この表示形式では、分類する列を選択してください。';
      widgetError.hidden = false;
      return;
    }

    const next: DashboardWidget = {
      id,
      title: widgetTitleInput.value.trim(),
      kind,
      aggregate,
      valueColumnId,
      groupColumnId,
      dateColumnId,
      dateGrain: kind === 'line' ? widgetDateGrain.value as DashboardWidget['dateGrain'] : undefined,
      size: widgetSize.value as DashboardWidget['size'],
      limit: kind === 'ranking' ? 10 : ['bar', 'horizontal-bar', 'donut', 'table'].includes(kind) ? 12 : undefined,
    };
    state.widgets = editing
      ? state.widgets.map((widget) => widget.id === id ? next : widget)
      : [...state.widgets, next];
    state.dirty = true;
    widgetDialog.close();
    requestAggregation();
  }

  function applyConfig(config: DashboardConfig): void {
    state.pendingConfig = config;
    if (!state.dataset) {
      status.textContent = '設定ファイルを読み込みました。対応するExcel・CSVを選択すると自動で反映します。';
      return;
    }
    const mapping = mapConfigToColumns(config, state.columns);
    state.columns = mapping.columns;
    state.widgets = mapping.widgets.length > 0 ? mapping.widgets.slice(0, 12) : buildInitialDashboardWidgets(state.dataset, mapping.columns);
    state.filterCandidates = buildFilterCandidates(state.dataset, state.columns);
    state.filters = [];
    state.pendingConfig = null;
    state.dirty = true;
    renderColumns();
    renderFilters();
    if (mapping.missingColumnNames.length > 0) {
      showError(`設定内の一部の列が見つかりませんでした: ${mapping.missingColumnNames.join('、')}`);
    }
    requestAggregation();
  }

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) void loadFile(file);
  });

  sampleButton.addEventListener('click', () => {
    clearError();
    state.file = null;
    state.buffer = null;
    state.format = 'sample';
    state.sheetNames = [];
    state.detectedEncoding = 'unknown';
    fileInput.value = '';
    fileName.textContent = 'サンプル売上データ';
    setDataset(createDashboardSample());
  });

  resetButton.addEventListener('click', resetDashboard);

  encodingSelect.addEventListener('change', () => {
    if (state.format !== 'csv') return;
    try {
      parseCurrentCsv(encodingSelect.value);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'CSVを読み直せませんでした。');
      setBusy(false);
      hideProgress();
    }
  });

  sheetSelect.addEventListener('change', () => {
    if (state.format !== 'excel' || !state.dataset) return;
    const next = sheetSelect.value;
    if (next === state.dataset.sheetName) return;
    if (state.dirty) {
      state.pendingSheetName = next;
      sheetSelect.value = state.dataset.sheetName;
      confirmDialog.showModal();
      return;
    }
    try {
      parseCurrentExcel(next);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'シートを読み込めませんでした。');
    }
  });

  confirmCancel.addEventListener('click', () => {
    state.pendingSheetName = '';
    confirmDialog.close();
  });
  confirmAccept.addEventListener('click', () => {
    const next = state.pendingSheetName;
    state.pendingSheetName = '';
    state.dirty = false;
    confirmDialog.close();
    if (!next) return;
    try {
      parseCurrentExcel(next);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'シートを読み込めませんでした。');
    }
  });

  configInput.addEventListener('change', async () => {
    const file = configInput.files?.[0];
    if (!file) return;
    try {
      clearError();
      applyConfig(parseDashboardConfig(await file.text()));
    } catch (error) {
      showError(error instanceof Error ? error.message : '設定ファイルを読み込めませんでした。');
    } finally {
      configInput.value = '';
    }
  });

  filterReset.addEventListener('click', () => {
    state.filters = [];
    state.dirty = true;
    renderFilters();
    requestAggregation();
  });

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const tab = button.dataset.dashboardTab;
      tabButtons.forEach((item) => item.setAttribute('aria-selected', String(item === button)));
      views.forEach((view) => { view.hidden = view.dataset.dashboardView !== tab; });
      if (tab === 'data') renderDataTable();
    });
  });

  searchInput.addEventListener('input', renderDataTable);
  addWidgetButton.addEventListener('click', () => openWidgetDialog());
  widgetClose.addEventListener('click', () => widgetDialog.close());
  widgetCancel.addEventListener('click', () => widgetDialog.close());
  widgetForm.addEventListener('submit', (event) => {
    event.preventDefault();
    submitWidget();
  });

  exportImageButton.addEventListener('click', async () => {
    if (!state.dataset) return;
    try {
      setBusy(true);
      showProgress('ダッシュボード画像を作成しています', 4);
      await exportDashboardImage(exportArea, dashboardExportFileName(state.dataset.sheetName, 'png'));
    } catch (error) {
      showError(error instanceof Error ? error.message : '画像を保存できませんでした。');
    } finally {
      setBusy(false);
      hideProgress();
    }
  });

  exportPdfButton.addEventListener('click', () => {
    if (!state.dataset) return;
    printDashboard();
  });

  exportExcelButton.addEventListener('click', () => {
    if (!state.dataset) return;
    try {
      const blob = exportDashboardWorkbook(
        state.dataset,
        state.columns,
        state.widgets,
        state.results,
        currentFilteredRows(),
      );
      downloadDashboardBlob(blob, dashboardExportFileName(state.dataset.sheetName, 'xlsx'));
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Excelを保存できませんでした。');
    }
  });

  exportConfigButton.addEventListener('click', () => {
    if (!state.dataset) return;
    const filterDefinitions: DashboardFilter[] = state.filterCandidates.map((candidate) => ({
      id: candidate.id,
      columnId: candidate.columnId,
      type: candidate.type,
    }));
    const config = createDashboardConfig(state.columns, state.widgets, filterDefinitions);
    downloadDashboardText(
      JSON.stringify(config, null, 2),
      dashboardExportFileName(state.dataset.sheetName, 'json'),
    );
  });

  resetDashboard();
}
