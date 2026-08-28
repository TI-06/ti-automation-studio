import { duplicateRowsToDelete, findDuplicateGroups } from '../../lib/tools/data-cleaner/duplicates';
import { exportCleanerCsv, exportCleanerWorkbook, summarizeCleaning } from '../../lib/tools/data-cleaner/export';
import {
  CLEANER_LARGE_ROWS,
  detectCsvEncoding,
  parseCsvBytes,
  parseExcelBuffer,
  validateCleanerFile,
  type DetectedCsvEncoding,
} from '../../lib/tools/data-cleaner/import';
import {
  applyChanges,
  applyRowDeletes,
  blankRowIndexes,
  buildChanges,
  createHistoryEntry,
  undoHistory,
  type CleanerMutationAction,
} from '../../lib/tools/data-cleaner/mutations';
import { createCleanerSample } from '../../lib/tools/data-cleaner/sample';
import type {
  CleanerChange,
  CleanerCsvEncoding,
  CleanerDataset,
  CleanerHistoryEntry,
  ColumnDiagnostic,
  DiagnosticCategory,
  DiagnosticIssue,
  DiagnosticResult,
} from '../../lib/tools/data-cleaner/types';
import { bindToolResultCta } from './result-cta';

const root = document.querySelector<HTMLElement>('[data-cleaner-app]');

if (root) {
  const appRoot = root;
  const resultCta = bindToolResultCta('data-cleaner');

  type WorkerResponse =
    | { type: 'progress'; stage: number; label: string }
    | { type: 'complete'; diagnostics: DiagnosticResult }
    | { type: 'error'; title: string; message: string };

  interface CleanerUiState {
    file: File | null;
    fileBuffer: ArrayBuffer | null;
    fileFormat: 'csv' | 'excel' | 'sample' | null;
    detectedEncoding: DetectedCsvEncoding;
    dataset: CleanerDataset | null;
    originalRows: number;
    diagnostics: DiagnosticResult | null;
    history: CleanerHistoryEntry[];
    selectedColumnId: string;
    selectedVariantIssueId: string;
    categoryFilter: DiagnosticCategory | 'all';
    pendingChanges: CleanerChange[];
    pendingRowDeletes: number[];
    excludedRowDeletes: Set<number>;
    pendingKeepGroups: number[][];
    pendingLabel: string;
    pendingSheetName: string;
    duplicateColumns: string[];
    blankRowsOnly: boolean;
    busy: boolean;
  }

  const state: CleanerUiState = {
    file: null,
    fileBuffer: null,
    fileFormat: null,
    detectedEncoding: 'unknown',
    dataset: null,
    originalRows: 0,
    diagnostics: null,
    history: [],
    selectedColumnId: '',
    selectedVariantIssueId: '',
    categoryFilter: 'all',
    pendingChanges: [],
    pendingRowDeletes: [],
    excludedRowDeletes: new Set<number>(),
    pendingKeepGroups: [],
    pendingLabel: '',
    pendingSheetName: '',
    duplicateColumns: [],
    blankRowsOnly: false,
    busy: false,
  };

  const query = <T>(selector: string): T => {
    const element = appRoot.querySelector(selector);
    if (!element) throw new Error(`必要な画面要素が見つかりません: ${selector}`);
    return element as unknown as T;
  };

  const documentQuery = <T>(selector: string): T => {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`必要な画面要素が見つかりません: ${selector}`);
    return element as unknown as T;
  };

  const fileInput = query<HTMLInputElement>('[data-cleaner-file]');
  const fileName = query<HTMLElement>('[data-cleaner-file-name]');
  const sampleButton = query<HTMLButtonElement>('[data-cleaner-sample]');
  const resetButton = query<HTMLButtonElement>('[data-cleaner-reset]');
  const errorMessage = query<HTMLElement>('[data-cleaner-error]');
  const fileSettings = query<HTMLElement>('[data-file-settings]');
  const sheetField = query<HTMLElement>('[data-sheet-field]');
  const sheetSelect = query<HTMLSelectElement>('[data-cleaner-sheet]');
  const encodingField = query<HTMLElement>('[data-encoding-field]');
  const encodingSelect = query<HTMLSelectElement>('[data-cleaner-encoding]');
  const largeWarning = query<HTMLElement>('[data-cleaner-large-warning]');
  const duplicateColumnSelect = query<HTMLSelectElement>('[data-duplicate-column]');
  const addDuplicateColumnButton = query<HTMLButtonElement>('[data-add-duplicate-column]');
  const duplicateColumnsContainer = query<HTMLElement>('[data-duplicate-columns]');
  const duplicateKeepSelect = query<HTMLSelectElement>('[data-duplicate-keep]');
  const checkDuplicatesButton = query<HTMLButtonElement>('[data-check-duplicates]');
  const progressBox = query<HTMLElement>('[data-tool-progress]');
  const progressLabel = query<HTMLElement>('[data-progress-label]');
  const progressCount = query<HTMLElement>('[data-progress-count]');
  const progressBar = query<HTMLElement>('[data-progress-bar]');
  const statusText = query<HTMLElement>('[data-cleaner-status]');
  const showAllIssuesButton = query<HTMLButtonElement>('[data-show-all-issues]');
  const issueTotal = query<HTMLElement>('[data-issue-total]');
  const issueList = query<HTMLElement>('[data-issue-list]');
  const previewPanel = query<HTMLElement>('[data-preview-panel]');
  const previewCount = query<HTMLElement>('[data-preview-count]');
  const previewDescription = query<HTMLElement>('[data-preview-description]');
  const previewBody = query<HTMLTableSectionElement>('[data-preview-body]');
  const cancelPreviewButton = query<HTMLButtonElement>('[data-cancel-preview]');
  const applyPreviewButton = query<HTMLButtonElement>('[data-apply-preview]');
  const dataCount = query<HTMLElement>('[data-data-count]');
  const dataHead = query<HTMLTableSectionElement>('[data-data-head]');
  const dataBody = query<HTMLTableSectionElement>('[data-data-body]');
  const dataEmpty = query<HTMLElement>('[data-data-empty]');
  const columnEmpty = query<HTMLElement>('[data-column-empty]');
  const columnDetail = query<HTMLElement>('[data-column-detail]');
  const columnName = query<HTMLElement>('[data-column-name]');
  const columnData = query<HTMLElement>('[data-column-data]');
  const columnBlank = query<HTMLElement>('[data-column-blank]');
  const columnDuplicate = query<HTMLElement>('[data-column-duplicate]');
  const columnIssues = query<HTMLElement>('[data-column-issues]');
  const columnKind = query<HTMLElement>('[data-column-kind]');
  const dateFormat = query<HTMLSelectElement>('[data-date-format]');
  const dateActionButton = query<HTMLButtonElement>('[data-date-action]');
  const blankValue = query<HTMLInputElement>('[data-blank-value]');
  const blankActionButton = query<HTMLButtonElement>('[data-blank-action]');
  const blankOnlyButton = query<HTMLButtonElement>('[data-blank-only]');
  const blankDeleteButton = query<HTMLButtonElement>('[data-blank-delete]');
  const variantEditor = query<HTMLElement>('[data-variant-editor]');
  const variantTarget = query<HTMLSelectElement>('[data-variant-target]');
  const variantActionButton = query<HTMLButtonElement>('[data-variant-action]');
  const historyList = query<HTMLElement>('[data-history-list]');
  const saveOriginal = query<HTMLElement>('[data-save-original]');
  const saveCurrent = query<HTMLElement>('[data-save-current]');
  const saveChanged = query<HTMLElement>('[data-save-changed]');
  const saveDeleted = query<HTMLElement>('[data-save-deleted]');
  const exportEncoding = query<HTMLSelectElement>('[data-export-encoding]');
  const includeHistory = query<HTMLInputElement>('[data-include-history]');
  const exportCsvButton = query<HTMLButtonElement>('[data-export-cleaner-csv]');
  const exportXlsxButton = query<HTMLButtonElement>('[data-export-cleaner-xlsx]');
  const sheetChangeDialog = documentQuery<HTMLDialogElement>('[data-sheet-change-dialog]');
  const sheetChangeFrom = documentQuery<HTMLElement>('[data-sheet-change-from]');
  const sheetChangeTo = documentQuery<HTMLElement>('[data-sheet-change-to]');
  const sheetChangeCancel = documentQuery<HTMLButtonElement>('[data-sheet-change-cancel]');
  const sheetChangeConfirm = documentQuery<HTMLButtonElement>('[data-sheet-change-confirm]');

  const healthButtons = [...appRoot.querySelectorAll<HTMLButtonElement>('[data-health-category]')];
  const columnActionButtons = [...appRoot.querySelectorAll<HTMLButtonElement>('[data-column-action]')];

  const CATEGORY_LABELS: Record<DiagnosticCategory, string> = {
    duplicate: '重複',
    'trim-space': '前後の空白',
    blank: '空欄',
    'width-mixed': '全角・半角',
    'date-mixed': '日付形式',
    'number-mixed': '数値形式',
    'line-break': 'セル内改行',
    'notation-variant': '表記の違い',
  };

  const KIND_LABELS: Record<ColumnDiagnostic['inferredKind'], string> = {
    text: '文字',
    number: '数値',
    date: '日付',
    mixed: '複数の種類',
    blank: '空欄のみ',
  };

  const worker = new Worker(new URL('../../workers/data-cleaner.worker.ts', import.meta.url), { type: 'module' });

  function cloneDataset(dataset: CleanerDataset): CleanerDataset {
    return {
      sheetName: dataset.sheetName,
      columns: dataset.columns.map((column) => ({ ...column })),
      rows: dataset.rows.map((row) => [...row]),
    };
  }

  function formatValue(value: unknown): string {
    if (value == null || value === '') return '空欄';
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    return String(value);
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  function showError(message: string): void {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
  }

  function clearError(): void {
    errorMessage.textContent = '';
    errorMessage.hidden = true;
  }

  function showProgress(label: string, stage = 1): void {
    const percentages = [16, 42, 76, 100];
    progressBox.hidden = false;
    progressLabel.textContent = label;
    progressCount.textContent = `${Math.min(4, Math.max(1, stage))} / 4`;
    progressBar.style.width = `${percentages[stage - 1] ?? 16}%`;
  }

  function hideProgress(): void {
    progressBox.hidden = true;
    progressCount.textContent = '';
    progressBar.style.width = '0%';
  }

  function setBusy(busy: boolean): void {
    state.busy = busy;
    fileInput.disabled = busy;
    sampleButton.disabled = busy;
    resetButton.disabled = busy;
    sheetSelect.disabled = busy || state.fileFormat !== 'excel';
    encodingSelect.disabled = busy || state.fileFormat !== 'csv';
    duplicateColumnSelect.disabled = busy || !state.dataset;
    addDuplicateColumnButton.disabled = busy || !state.dataset;
    duplicateKeepSelect.disabled = busy || !state.dataset;
    checkDuplicatesButton.disabled = busy || !state.dataset || state.duplicateColumns.length === 0;
    showAllIssuesButton.disabled = busy || !state.diagnostics;
    columnActionButtons.forEach((button) => { button.disabled = busy || !state.selectedColumnId; });
    dateActionButton.disabled = busy || !state.selectedColumnId;
    blankActionButton.disabled = busy || !state.selectedColumnId;
    blankOnlyButton.disabled = busy || !state.selectedColumnId;
    blankDeleteButton.disabled = busy || !state.selectedColumnId;
    variantActionButton.disabled = busy || !state.selectedVariantIssueId;
  }

  function clearPendingPreview(): void {
    state.pendingChanges = [];
    state.pendingRowDeletes = [];
    state.excludedRowDeletes.clear();
    state.pendingKeepGroups = [];
    state.pendingLabel = '';
    previewPanel.hidden = true;
    previewBody.replaceChildren();
  }

  function currentColumnDiagnostic(): ColumnDiagnostic | null {
    return state.diagnostics?.columns.find((column) => column.columnId === state.selectedColumnId) ?? null;
  }

  function currentVariantIssue(): DiagnosticIssue | null {
    return state.diagnostics?.issues.find((issue) => issue.id === state.selectedVariantIssueId) ?? null;
  }

  function issueCount(category: DiagnosticCategory): number {
    return state.diagnostics?.issues
      .filter((issue) => issue.category === category)
      .reduce((sum, issue) => sum + issue.count, 0) ?? 0;
  }

  function renderHealthSummary(): void {
    (Object.keys(CATEGORY_LABELS) as DiagnosticCategory[]).forEach((category) => {
      const counter = appRoot.querySelector<HTMLElement>(`[data-health-count="${category}"]`);
      if (counter) counter.textContent = issueCount(category).toLocaleString('ja-JP');
    });
    healthButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.healthCategory === state.categoryFilter));
    });
  }

  function selectColumn(columnId: string): void {
    state.selectedColumnId = columnId;
    state.selectedVariantIssueId = '';
    state.blankRowsOnly = false;
    renderDataTable();
    renderColumnDetail();
  }

  function buildIssueAction(issue: DiagnosticIssue): HTMLButtonElement | null {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tool-button tool-button-secondary cleaner-issue-action';

    if (issue.category === 'duplicate') {
      button.textContent = '削除対象を確認';
      button.addEventListener('click', () => prepareExactDuplicatePreview());
      return button;
    }
    if (!issue.columnId) return null;

    if (issue.category === 'blank') {
      button.textContent = '空欄の処理を選択';
      button.addEventListener('click', () => {
        selectColumn(issue.columnId ?? '');
        blankValue.focus();
      });
      return button;
    }
    if (issue.category === 'notation-variant') {
      button.textContent = '統一する表記を選択';
      button.addEventListener('click', () => {
        state.selectedColumnId = issue.columnId ?? '';
        state.selectedVariantIssueId = issue.id;
        state.blankRowsOnly = false;
        renderDataTable();
        renderColumnDetail();
        variantTarget.focus();
      });
      return button;
    }

    const actionMap: Partial<Record<DiagnosticCategory, CleanerMutationAction>> = {
      'trim-space': { type: 'trim', columnId: issue.columnId },
      'width-mixed': { type: 'normalize-width', columnId: issue.columnId },
      'line-break': { type: 'remove-line-breaks', columnId: issue.columnId },
      'date-mixed': { type: 'date-format', columnId: issue.columnId, format: 'YYYY-MM-DD' },
      'number-mixed': { type: 'normalize-number', columnId: issue.columnId },
    };
    const action = actionMap[issue.category];
    if (!action) return null;
    button.textContent = '変更内容を確認';
    button.addEventListener('click', () => {
      selectColumn(issue.columnId ?? '');
      prepareChanges(action, `${CATEGORY_LABELS[issue.category]}を整理`);
    });
    return button;
  }

  function renderIssues(): void {
    issueList.replaceChildren();
    const allIssues = state.diagnostics?.issues ?? [];
    const issues = state.categoryFilter === 'all'
      ? allIssues
      : allIssues.filter((issue) => issue.category === state.categoryFilter);
    issueTotal.textContent = `${issues.length.toLocaleString('ja-JP')}件`;

    if (!state.diagnostics) {
      const empty = document.createElement('div');
      empty.className = 'tool-empty-state cleaner-inline-empty';
      const text = document.createElement('p');
      text.textContent = 'データを読み込むと、整理候補をここに表示します。';
      empty.appendChild(text);
      issueList.appendChild(empty);
      return;
    }

    if (issues.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'cleaner-no-issues';
      const strong = document.createElement('strong');
      strong.textContent = allIssues.length === 0 ? '整理候補は見つかりませんでした' : 'この種類の整理候補はありません';
      const text = document.createElement('p');
      text.textContent = allIssues.length === 0
        ? '現在の診断ルールでは、修正が必要な箇所を検出しませんでした。'
        : '別の診断項目を選択して確認してください。';
      empty.appendChild(strong);
      empty.appendChild(text);
      issueList.appendChild(empty);
      return;
    }

    issues.forEach((issue) => {
      const card = document.createElement('article');
      card.className = 'cleaner-issue-card';
      const head = document.createElement('div');
      head.className = 'cleaner-issue-head';
      const badge = document.createElement('span');
      badge.className = 'cleaner-issue-badge';
      badge.dataset.category = issue.category;
      badge.textContent = CATEGORY_LABELS[issue.category];
      const count = document.createElement('strong');
      count.textContent = `${issue.count.toLocaleString('ja-JP')}件`;
      head.appendChild(badge);
      head.appendChild(count);

      const message = document.createElement('p');
      message.textContent = issue.message;
      const examples = document.createElement('div');
      examples.className = 'cleaner-example-list';
      issue.examples.slice(0, 3).forEach((example) => {
        const line = document.createElement('div');
        const before = document.createElement('span');
        before.textContent = example.before;
        line.appendChild(before);
        if (example.after != null && example.after !== example.before) {
          const arrow = document.createElement('b');
          arrow.textContent = '→';
          const after = document.createElement('span');
          after.textContent = example.after;
          line.appendChild(arrow);
          line.appendChild(after);
        }
        examples.appendChild(line);
      });

      card.appendChild(head);
      card.appendChild(message);
      if (issue.examples.length > 0) card.appendChild(examples);
      const action = buildIssueAction(issue);
      if (action) card.appendChild(action);
      issueList.appendChild(card);
    });
  }

  function renderDataTable(): void {
    dataHead.replaceChildren();
    dataBody.replaceChildren();
    if (!state.dataset || state.dataset.columns.length === 0) {
      dataEmpty.hidden = false;
      dataCount.textContent = '0行';
      return;
    }

    const indexedRows = state.dataset.rows.map((row, rowIndex) => ({ row, rowIndex }));
    let visibleRows = indexedRows;
    if (state.blankRowsOnly && state.selectedColumnId) {
      const blankSet = new Set(blankRowIndexes(state.dataset, state.selectedColumnId));
      visibleRows = indexedRows.filter((item) => blankSet.has(item.rowIndex));
    }

    dataEmpty.hidden = visibleRows.length > 0;
    dataCount.textContent = state.blankRowsOnly
      ? `${visibleRows.length.toLocaleString('ja-JP')}行 / 全${state.dataset.rows.length.toLocaleString('ja-JP')}行`
      : `${state.dataset.rows.length.toLocaleString('ja-JP')}行`;

    const headRow = document.createElement('tr');
    const indexHead = document.createElement('th');
    indexHead.textContent = '行';
    headRow.appendChild(indexHead);
    state.dataset.columns.forEach((column) => {
      const th = document.createElement('th');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cleaner-column-button';
      button.textContent = column.name;
      button.setAttribute('aria-pressed', String(column.id === state.selectedColumnId));
      button.addEventListener('click', () => selectColumn(column.id));
      th.appendChild(button);
      headRow.appendChild(th);
    });
    dataHead.appendChild(headRow);

    visibleRows.slice(0, 100).forEach(({ row, rowIndex }) => {
      const tr = document.createElement('tr');
      const number = document.createElement('td');
      number.className = 'cleaner-row-number';
      number.textContent = String(rowIndex + 2);
      tr.appendChild(number);
      state.dataset?.columns.forEach((column) => {
        const td = document.createElement('td');
        td.textContent = formatValue(row[column.index] ?? null);
        if (column.id === state.selectedColumnId) td.dataset.selectedColumn = 'true';
        tr.appendChild(td);
      });
      dataBody.appendChild(tr);
    });
  }

  function renderColumnDetail(): void {
    const diagnostic = currentColumnDiagnostic();
    const column = state.dataset?.columns.find((item) => item.id === state.selectedColumnId) ?? null;
    columnEmpty.hidden = Boolean(column && diagnostic);
    columnDetail.hidden = !column || !diagnostic;
    variantEditor.hidden = true;
    blankOnlyButton.setAttribute('aria-pressed', String(state.blankRowsOnly));
    blankOnlyButton.textContent = state.blankRowsOnly ? 'すべての行を表示' : '空欄行だけ表示';
    if (!column || !diagnostic) return;

    columnName.textContent = column.name;
    columnData.textContent = diagnostic.dataCount.toLocaleString('ja-JP');
    columnBlank.textContent = diagnostic.blankCount.toLocaleString('ja-JP');
    columnDuplicate.textContent = diagnostic.duplicateCount.toLocaleString('ja-JP');
    columnIssues.textContent = diagnostic.issueCount.toLocaleString('ja-JP');
    columnKind.textContent = KIND_LABELS[diagnostic.inferredKind];

    const variant = currentVariantIssue();
    if (variant?.columnId === column.id) {
      const choices = [...new Set(variant.examples.map((example) => example.before))];
      variantTarget.replaceChildren();
      choices.forEach((choice) => variantTarget.add(new Option(choice, choice)));
      variantEditor.hidden = choices.length < 2;
    }
  }

  function renderDuplicateColumns(): void {
    duplicateColumnsContainer.replaceChildren();
    if (!state.dataset) return;
    if (state.duplicateColumns.length === 0 && state.dataset.columns[0]) {
      state.duplicateColumns = [state.dataset.columns[0].id];
    }
    state.duplicateColumns.forEach((columnId, index) => {
      const column = state.dataset?.columns.find((item) => item.id === columnId);
      if (!column) return;
      const chip = document.createElement('div');
      chip.className = 'tool-key-row cleaner-key-chip';
      const label = document.createElement('span');
      label.textContent = column.name;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'tool-button tool-button-secondary';
      remove.textContent = '削除';
      remove.disabled = state.duplicateColumns.length <= 1;
      remove.addEventListener('click', () => {
        state.duplicateColumns.splice(index, 1);
        renderDuplicateColumns();
        renderDuplicateColumnOptions();
        setBusy(state.busy);
      });
      chip.appendChild(label);
      chip.appendChild(remove);
      duplicateColumnsContainer.appendChild(chip);
    });
  }

  function renderDuplicateColumnOptions(): void {
    duplicateColumnSelect.replaceChildren();
    if (!state.dataset || state.dataset.columns.length === 0) {
      duplicateColumnSelect.add(new Option('データを読み込んでください', ''));
      return;
    }
    state.dataset.columns.forEach((column) => duplicateColumnSelect.add(new Option(column.name, column.id)));
    const unused = state.dataset.columns.find((column) => !state.duplicateColumns.includes(column.id));
    duplicateColumnSelect.value = unused?.id ?? state.dataset.columns[0].id;
  }

  function renderHistory(): void {
    historyList.replaceChildren();
    if (state.history.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'cleaner-muted-line';
      empty.textContent = 'まだ変更はありません。';
      historyList.appendChild(empty);
      return;
    }

    [...state.history].reverse().forEach((entry, reverseIndex) => {
      const actualIndex = state.history.length - 1 - reverseIndex;
      const card = document.createElement('div');
      card.className = 'cleaner-history-item';
      const text = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = entry.label;
      const detail = document.createElement('span');
      const changed = entry.changes.filter((change) => !change.excluded).length;
      const deleted = entry.deletedRows?.length ?? 0;
      detail.textContent = `${changed}セル変更 / ${deleted}行削除`;
      text.appendChild(title);
      text.appendChild(detail);
      const undo = document.createElement('button');
      undo.type = 'button';
      undo.className = 'tool-button tool-button-secondary';
      undo.textContent = actualIndex === state.history.length - 1 ? '元に戻す' : 'ここまで戻す';
      undo.addEventListener('click', () => undoToHistory(actualIndex));
      card.appendChild(text);
      card.appendChild(undo);
      historyList.appendChild(card);
    });
  }

  function renderSaveSummary(): void {
    if (!state.dataset) {
      saveOriginal.textContent = '0行';
      saveCurrent.textContent = '0行';
      saveChanged.textContent = '0件';
      saveDeleted.textContent = '0件';
      exportCsvButton.disabled = true;
      exportXlsxButton.disabled = true;
      return;
    }
    const summary = summarizeCleaning(state.originalRows, state.dataset, state.history);
    saveOriginal.textContent = `${summary.originalRows.toLocaleString('ja-JP')}行`;
    saveCurrent.textContent = `${summary.cleanedRows.toLocaleString('ja-JP')}行`;
    saveChanged.textContent = `${summary.changedCells.toLocaleString('ja-JP')}件`;
    saveDeleted.textContent = `${summary.deletedRows.toLocaleString('ja-JP')}件`;
    exportCsvButton.disabled = state.busy;
    exportXlsxButton.disabled = state.busy;
  }

  function renderAll(): void {
    renderHealthSummary();
    renderIssues();
    renderDataTable();
    renderColumnDetail();
    renderDuplicateColumnOptions();
    renderDuplicateColumns();
    renderHistory();
    renderSaveSummary();
    largeWarning.hidden = !(state.dataset && state.dataset.rows.length > CLEANER_LARGE_ROWS);
    setBusy(state.busy);
  }

  function cell(text: string): HTMLTableCellElement {
    const td = document.createElement('td');
    td.textContent = text;
    return td;
  }

  function updateApplyButton(): void {
    const activeChanges = state.pendingChanges.filter((change) => !change.excluded).length;
    const activeDeletes = state.pendingRowDeletes.filter((rowIndex) => !state.excludedRowDeletes.has(rowIndex)).length;
    applyPreviewButton.disabled = activeChanges + activeDeletes === 0;
  }

  function renderPreview(): void {
    previewBody.replaceChildren();
    const total = state.pendingChanges.length + state.pendingRowDeletes.length;
    previewCount.textContent = `${total.toLocaleString('ja-JP')}件`;
    previewDescription.textContent = state.pendingKeepGroups.length > 0
      ? 'チェックが付いた行を削除します。各重複グループで残したい行はチェックを外してください。残す行は手動で変更できます。'
      : state.pendingRowDeletes.length > 0
        ? 'チェックが付いた行を削除します。残したい行はチェックを外してください。'
        : '変更前と変更後を確認してください。不要な変更はチェックを外せます。';

    state.pendingChanges.forEach((change) => {
      const tr = document.createElement('tr');
      const toggleCell = document.createElement('td');
      const toggle = document.createElement('input');
      toggle.type = 'checkbox';
      toggle.checked = !change.excluded;
      toggle.setAttribute('aria-label', `${change.rowIndex + 2}行目の変更を適用`);
      toggle.addEventListener('change', () => {
        change.excluded = !toggle.checked;
        updateApplyButton();
      });
      toggleCell.appendChild(toggle);
      const column = state.dataset?.columns.find((item) => item.id === change.columnId);
      [toggleCell, cell(String(change.rowIndex + 2)), cell(column?.name ?? change.columnId), cell(formatValue(change.before)), cell(formatValue(change.after)), cell(change.reason)]
        .forEach((item) => tr.appendChild(item));
      previewBody.appendChild(tr);
    });

    state.pendingRowDeletes.forEach((rowIndex) => {
      const tr = document.createElement('tr');
      const toggleCell = document.createElement('td');
      const toggle = document.createElement('input');
      toggle.type = 'checkbox';
      toggle.checked = !state.excludedRowDeletes.has(rowIndex);
      toggle.setAttribute('aria-label', `${rowIndex + 2}行目を削除対象にする`);
      toggle.addEventListener('change', () => {
        if (toggle.checked) state.excludedRowDeletes.delete(rowIndex);
        else state.excludedRowDeletes.add(rowIndex);
        updateApplyButton();
      });
      toggleCell.appendChild(toggle);
      const beforeRow = state.dataset?.rows[rowIndex] ?? [];
      [toggleCell, cell(String(rowIndex + 2)), cell('行全体'), cell(beforeRow.map(formatValue).join(' / ')), cell('削除'), cell(state.pendingKeepGroups.length > 0 ? '重複行の整理' : '空欄行の整理')]
        .forEach((item) => tr.appendChild(item));
      previewBody.appendChild(tr);
    });

    previewPanel.hidden = total === 0;
    updateApplyButton();
    if (!previewPanel.hidden) previewPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function prepareChanges(action: CleanerMutationAction, label: string): void {
    clearError();
    if (!state.dataset) return;
    const changes = buildChanges(state.dataset, action);
    if (changes.length === 0) {
      showError('この条件で変更するデータはありません。別の列または整理方法を選択してください。');
      return;
    }
    state.pendingChanges = changes;
    state.pendingRowDeletes = [];
    state.excludedRowDeletes.clear();
    state.pendingKeepGroups = [];
    state.pendingLabel = label;
    renderPreview();
  }

  function prepareDuplicatePreview(columnIds: string[] = state.duplicateColumns, keep: 'first' | 'last' = 'first'): void {
    clearError();
    if (!state.dataset || columnIds.length === 0) return;
    const groups = findDuplicateGroups(state.dataset, columnIds);
    if (groups.length === 0) {
      showError('選択した列では重複する行が見つかりませんでした。別の列の組み合わせも確認できます。');
      return;
    }

    const allRows = [...new Set(groups.flatMap((group) => group.rowIndexes))].sort((a, b) => a - b);
    const deleteRows = new Set(groups.flatMap((group) => duplicateRowsToDelete(group, keep)));
    state.pendingChanges = [];
    state.pendingRowDeletes = allRows;
    state.excludedRowDeletes = new Set(allRows.filter((rowIndex) => !deleteRows.has(rowIndex)));
    state.pendingKeepGroups = groups.map((group) => [...group.rowIndexes]);
    state.pendingLabel = `重複を整理（${columnIds.map((id) => state.dataset?.columns.find((column) => column.id === id)?.name ?? id).join(' + ')}）`;
    renderPreview();
  }

  function prepareExactDuplicatePreview(): void {
    if (!state.dataset) return;
    const keep = duplicateKeepSelect.value === 'last' ? 'last' : 'first';
    prepareDuplicatePreview(state.dataset.columns.map((column) => column.id), keep);
  }

  function prepareBlankDeletePreview(): void {
    clearError();
    if (!state.dataset || !state.selectedColumnId) return;
    const rows = blankRowIndexes(state.dataset, state.selectedColumnId);
    if (rows.length === 0) {
      showError('この列には空欄行がありません。');
      return;
    }
    const column = state.dataset.columns.find((item) => item.id === state.selectedColumnId);
    state.pendingChanges = [];
    state.pendingRowDeletes = rows;
    state.excludedRowDeletes.clear();
    state.pendingKeepGroups = [];
    state.pendingLabel = `「${column?.name ?? state.selectedColumnId}」の空欄行を削除`;
    renderPreview();
  }

  function applyPending(): void {
    if (!state.dataset) return;
    const actualDeletes = state.pendingRowDeletes.filter((rowIndex) => !state.excludedRowDeletes.has(rowIndex));
    const actualChanges = state.pendingChanges.filter((change) => !change.excluded);
    if (actualChanges.length === 0 && actualDeletes.length === 0) {
      showError('適用する変更が選択されていません。');
      return;
    }

    if (state.pendingKeepGroups.length > 0) {
      const deleteSet = new Set(actualDeletes);
      const wouldDeleteWholeGroup = state.pendingKeepGroups.some((group) => group.every((rowIndex) => deleteSet.has(rowIndex)));
      if (wouldDeleteWholeGroup) {
        showError('重複グループごとに1行以上残してください。残したい行のチェックを外してから適用してください。');
        return;
      }
    }

    const before = cloneDataset(state.dataset);
    let next = applyChanges(state.dataset, state.pendingChanges);
    next = applyRowDeletes(next, actualDeletes);
    state.history.push(createHistoryEntry(state.pendingLabel || 'データを整理', before, state.pendingChanges, actualDeletes));
    state.dataset = next;
    clearPendingPreview();
    state.selectedVariantIssueId = '';
    diagnoseCurrent('変更を反映しました。データを再診断しています。');
  }

  function undoToHistory(index: number): void {
    const entry = state.history[index];
    if (!entry) return;
    state.dataset = undoHistory(entry);
    state.history = state.history.slice(0, index);
    clearPendingPreview();
    state.selectedVariantIssueId = '';
    state.blankRowsOnly = false;
    diagnoseCurrent('変更を元に戻しました。データを再診断しています。');
  }

  function diagnoseCurrent(status = 'データを診断しています。'): void {
    if (!state.dataset) return;
    resultCta.hide();
    clearError();
    state.diagnostics = null;
    state.categoryFilter = 'all';
    state.busy = true;
    statusText.textContent = status;
    showProgress('ファイルを読み込んでいます', 1);
    setBusy(true);
    worker.postMessage({ type: 'diagnose', dataset: state.dataset });
  }

  function adoptDataset(dataset: CleanerDataset): void {
    resultCta.hide();
    state.dataset = cloneDataset(dataset);
    state.originalRows = dataset.rows.length;
    state.diagnostics = null;
    state.history = [];
    state.selectedColumnId = dataset.columns[0]?.id ?? '';
    state.selectedVariantIssueId = '';
    state.duplicateColumns = dataset.columns[0] ? [dataset.columns[0].id] : [];
    state.blankRowsOnly = false;
    clearPendingPreview();
    renderAll();
    diagnoseCurrent();
  }

  async function loadFile(file: File): Promise<void> {
    const validation = validateCleanerFile(file);
    if (!validation.valid) {
      showError(validation.message);
      fileInput.value = '';
      return;
    }

    clearError();
    state.busy = true;
    setBusy(true);
    showProgress('ファイルを読み込んでいます', 1);
    fileName.textContent = `${file.name} / ${formatBytes(file.size)}`;

    try {
      const buffer = await file.arrayBuffer();
      state.file = file;
      state.fileBuffer = buffer;
      const extension = file.name.split('.').pop()?.toLowerCase();
      fileSettings.hidden = false;

      if (extension === 'csv') {
        state.fileFormat = 'csv';
        sheetField.hidden = true;
        encodingField.hidden = false;
        const bytes = new Uint8Array(buffer);
        const selected = encodingSelect.value;
        const detected = selected === 'auto' ? detectCsvEncoding(bytes) : selected as DetectedCsvEncoding;
        state.detectedEncoding = detected;
        if (detected === 'unknown') {
          hideProgress();
          state.busy = false;
          setBusy(false);
          showError('CSVの文字コードを自動判定できませんでした。UTF-8またはShift_JISを選択してください。');
          return;
        }
        adoptDataset(parseCsvBytes(bytes, detected));
      } else {
        state.fileFormat = 'excel';
        encodingField.hidden = true;
        const parsed = parseExcelBuffer(buffer, file.name);
        sheetField.hidden = parsed.sheetNames.length <= 1;
        sheetSelect.replaceChildren();
        parsed.sheetNames.forEach((name) => sheetSelect.add(new Option(name, name)));
        sheetSelect.value = parsed.dataset.sheetName;
        adoptDataset(parsed.dataset);
      }
    } catch (error) {
      state.busy = false;
      hideProgress();
      setBusy(false);
      showError(error instanceof Error ? error.message : 'ファイルを読み込めませんでした。');
    }
  }

  function reloadCsv(): void {
    if (state.fileFormat !== 'csv' || !state.fileBuffer) return;
    try {
      const bytes = new Uint8Array(state.fileBuffer);
      const selected = encodingSelect.value;
      const detected = selected === 'auto' ? detectCsvEncoding(bytes) : selected as DetectedCsvEncoding;
      if (detected === 'unknown') {
        showError('文字コードを自動判定できません。UTF-8またはShift_JISを選択してください。');
        return;
      }
      state.detectedEncoding = detected;
      adoptDataset(parseCsvBytes(bytes, detected));
    } catch (error) {
      showError(error instanceof Error ? error.message : 'CSVを読み直せませんでした。');
    }
  }

  function reloadExcelSheet(): void {
    if (state.fileFormat !== 'excel' || !state.fileBuffer || !state.file) return;
    try {
      const parsed = parseExcelBuffer(state.fileBuffer, state.file.name, sheetSelect.value);
      adoptDataset(parsed.dataset);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'シートを読み込めませんでした。');
    }
  }

  function closeSheetDialog(): void {
    state.pendingSheetName = '';
    if (sheetChangeDialog.open) sheetChangeDialog.close();
  }

  function confirmSheetChange(): void {
    const previousSheet = state.dataset?.sheetName ?? '';
    const nextSheet = sheetSelect.value;
    if (!previousSheet || previousSheet === nextSheet) return;

    const hasChanges = state.history.length > 0 || state.pendingChanges.length > 0 || state.pendingRowDeletes.length > 0;
    if (!hasChanges) {
      reloadExcelSheet();
      return;
    }

    state.pendingSheetName = nextSheet;
    sheetSelect.value = previousSheet;
    sheetChangeFrom.textContent = previousSheet;
    sheetChangeTo.textContent = nextSheet;
    sheetChangeDialog.showModal();
  }

  function applySheetChange(): void {
    const nextSheet = state.pendingSheetName;
    if (!nextSheet) {
      closeSheetDialog();
      return;
    }
    state.pendingSheetName = '';
    if (sheetChangeDialog.open) sheetChangeDialog.close();
    sheetSelect.value = nextSheet;
    reloadExcelSheet();
  }

  function resetAll(): void {
    resultCta.hide();
    state.file = null;
    state.fileBuffer = null;
    state.fileFormat = null;
    state.detectedEncoding = 'unknown';
    state.dataset = null;
    state.originalRows = 0;
    state.diagnostics = null;
    state.history = [];
    state.selectedColumnId = '';
    state.selectedVariantIssueId = '';
    state.categoryFilter = 'all';
    state.duplicateColumns = [];
    state.blankRowsOnly = false;
    state.busy = false;
    state.pendingSheetName = '';
    if (sheetChangeDialog.open) sheetChangeDialog.close();
    fileInput.value = '';
    fileName.textContent = '未選択';
    fileSettings.hidden = true;
    sheetField.hidden = true;
    encodingField.hidden = true;
    encodingSelect.value = 'auto';
    duplicateKeepSelect.value = 'first';
    clearError();
    hideProgress();
    clearPendingPreview();
    statusText.textContent = 'ファイルを選ぶか、サンプルデータで試してください。';
    renderAll();
  }

  function downloadBlob(blob: Blob, fileNameValue: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileNameValue;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function baseOutputName(): string {
    const original = state.file?.name ?? 'sample-data';
    return original.replace(/\.(csv|xlsx|xls)$/i, '') || 'cleaned-data';
  }

  function outputTimestamp(): string {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(now);
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
    return `${part('year')}${part('month')}${part('day')}-${part('hour')}${part('minute')}`;
  }

  function exportCsv(): void {
    if (!state.dataset) return;
    downloadBlob(exportCleanerCsv(state.dataset, exportEncoding.value as CleanerCsvEncoding), `${baseOutputName()}-整理済み-${outputTimestamp()}.csv`);
  }

  function exportXlsx(): void {
    if (!state.dataset) return;
    downloadBlob(exportCleanerWorkbook(state.dataset, state.history, includeHistory.checked), `${baseOutputName()}-整理済み-${outputTimestamp()}.xlsx`);
  }

  worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
    const message = event.data;
    if (message.type === 'progress') {
      showProgress(message.label, message.stage);
      return;
    }
    state.busy = false;
    if (message.type === 'error') {
      resultCta.hide();
      hideProgress();
      setBusy(false);
      statusText.textContent = '診断を完了できませんでした。';
      showError(`${message.title}：${message.message}`);
      return;
    }
    state.diagnostics = message.diagnostics;
    if (!state.selectedColumnId) state.selectedColumnId = state.dataset?.columns[0]?.id ?? '';
    statusText.textContent = message.diagnostics.issues.length === 0
      ? '診断完了。現在のルールでは整理候補は見つかりませんでした。'
      : `診断完了。${message.diagnostics.issues.length.toLocaleString('ja-JP')}件の整理候補を確認できます。`;
    showProgress('診断結果をまとめています', 4);
    window.setTimeout(hideProgress, 250);
    renderAll();
    resultCta.show();
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) void loadFile(file);
  });

  sampleButton.addEventListener('click', () => {
    resetAll();
    state.fileFormat = 'sample';
    fileName.textContent = 'サンプル顧客一覧（ブラウザ内データ）';
    fileSettings.hidden = true;
    adoptDataset(createCleanerSample());
  });

  resetButton.addEventListener('click', resetAll);
  sheetSelect.addEventListener('change', confirmSheetChange);
  encodingSelect.addEventListener('change', reloadCsv);

  addDuplicateColumnButton.addEventListener('click', () => {
    if (!state.dataset) return;
    const columnId = duplicateColumnSelect.value;
    if (!columnId || state.duplicateColumns.includes(columnId)) {
      showError('すでに選択している列です。別の列を選んでください。');
      return;
    }
    clearError();
    state.duplicateColumns.push(columnId);
    renderDuplicateColumnOptions();
    renderDuplicateColumns();
    setBusy(state.busy);
  });

  checkDuplicatesButton.addEventListener('click', () => {
    const keep = duplicateKeepSelect.value === 'last' ? 'last' : 'first';
    prepareDuplicatePreview(state.duplicateColumns, keep);
  });

  healthButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const category = button.dataset.healthCategory as DiagnosticCategory | undefined;
      if (!category || !state.diagnostics) return;
      state.categoryFilter = category;
      renderHealthSummary();
      renderIssues();
    });
  });

  showAllIssuesButton.addEventListener('click', () => {
    state.categoryFilter = 'all';
    renderHealthSummary();
    renderIssues();
  });

  columnActionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (!state.selectedColumnId) return;
      const type = button.dataset.columnAction as CleanerMutationAction['type'] | undefined;
      if (type === 'trim') prepareChanges({ type, columnId: state.selectedColumnId }, '前後の空白を削除');
      else if (type === 'normalize-width') prepareChanges({ type, columnId: state.selectedColumnId }, '全角英数字を半角へ');
      else if (type === 'remove-line-breaks') prepareChanges({ type, columnId: state.selectedColumnId }, 'セル内改行を整理');
      else if (type === 'normalize-number') prepareChanges({ type, columnId: state.selectedColumnId }, '数値形式を統一');
    });
  });

  dateActionButton.addEventListener('click', () => {
    if (!state.selectedColumnId) return;
    prepareChanges({
      type: 'date-format',
      columnId: state.selectedColumnId,
      format: dateFormat.value as 'YYYY/MM/DD' | 'YYYY-MM-DD' | 'YYYY年M月D日',
    }, `日付形式を${dateFormat.value}へ統一`);
  });

  blankActionButton.addEventListener('click', () => {
    if (!state.selectedColumnId) return;
    const value = blankValue.value;
    if (!value) {
      showError('空欄に入れる文字を入力してください。');
      blankValue.focus();
      return;
    }
    prepareChanges({ type: 'fill-blank', columnId: state.selectedColumnId, value }, `空欄を「${value}」で補完`);
  });

  blankOnlyButton.addEventListener('click', () => {
    if (!state.dataset || !state.selectedColumnId) return;
    state.blankRowsOnly = !state.blankRowsOnly;
    renderDataTable();
    renderColumnDetail();
  });

  blankDeleteButton.addEventListener('click', prepareBlankDeletePreview);

  variantActionButton.addEventListener('click', () => {
    const issue = currentVariantIssue();
    if (!issue?.columnId || !variantTarget.value) return;
    const values = [...new Set(issue.examples.map((example) => example.before))];
    prepareChanges({ type: 'replace-values', columnId: issue.columnId, fromValues: values, toValue: variantTarget.value }, `表記を「${variantTarget.value}」へ統一`);
  });

  cancelPreviewButton.addEventListener('click', clearPendingPreview);
  applyPreviewButton.addEventListener('click', applyPending);
  exportCsvButton.addEventListener('click', exportCsv);
  exportXlsxButton.addEventListener('click', exportXlsx);
  sheetChangeCancel.addEventListener('click', closeSheetDialog);
  sheetChangeConfirm.addEventListener('click', applySheetChange);
  sheetChangeDialog.addEventListener('cancel', () => { state.pendingSheetName = ''; });

  resetAll();
}