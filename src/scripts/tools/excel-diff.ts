import { exportDiffCsv, exportDiffWorkbook } from '../../lib/tools/excel-diff/export';
import { createSampleFiles } from '../../lib/tools/excel-diff/sample';
import type {
  CompareOptions,
  DiffEntry,
  DiffKind,
  DiffResult,
  ExcelDiffWorkerResponse,
  WorkbookInspection,
} from '../../lib/tools/excel-diff/types';
import { validateExcelFile } from '../../lib/tools/excel-diff/workbook';
import { bindToolResultCta } from './result-cta';

const root = document.querySelector<HTMLElement>('[data-excel-diff-app]');

if (root) {
  const resultCta = bindToolResultCta('excel-diff');
  type FileTarget = 'before' | 'after';
  type KindFilter = DiffKind | 'all' | 'structural';

  interface ExcelDiffUiState {
    beforeFile: File | null;
    afterFile: File | null;
    beforeInspection: WorkbookInspection | null;
    afterInspection: WorkbookInspection | null;
    selectedSheet: string;
    mode: CompareOptions['mode'];
    keyColumns: string[];
    result: DiffResult | null;
    selectedDiffId: string | null;
    kindFilter: KindFilter;
    columnFilter: string;
    query: string;
    pendingInspections: Set<FileTarget>;
    comparing: boolean;
  }

  const state: ExcelDiffUiState = {
    beforeFile: null,
    afterFile: null,
    beforeInspection: null,
    afterInspection: null,
    selectedSheet: '',
    mode: 'row-number',
    keyColumns: [],
    result: null,
    selectedDiffId: null,
    kindFilter: 'all',
    columnFilter: 'all',
    query: '',
    pendingInspections: new Set<FileTarget>(),
    comparing: false,
  };

  const query = <T>(selector: string): T => {
    const element = root.querySelector(selector);
    if (!element) throw new Error(`必要な画面要素が見つかりません: ${selector}`);
    return element as unknown as T;
  };

  const beforeInput = query<HTMLInputElement>('[data-file-before]');
  const afterInput = query<HTMLInputElement>('[data-file-after]');
  const beforeName = query<HTMLElement>('[data-file-before-name]');
  const afterName = query<HTMLElement>('[data-file-after-name]');
  const sampleButton = query<HTMLButtonElement>('[data-sample]');
  const resetButton = query<HTMLButtonElement>('[data-reset]');
  const errorMessage = query<HTMLElement>('[data-tool-error]');
  const sheetSelect = query<HTMLSelectElement>('[data-sheet-select]');
  const modeInputs = [...root.querySelectorAll<HTMLInputElement>('[data-compare-mode]')];
  const keyColumnsWrap = query<HTMLElement>('[data-key-columns-wrap]');
  const keyColumnsContainer = query<HTMLElement>('[data-key-columns]');
  const addKeyColumnButton = query<HTMLButtonElement>('[data-add-key-column]');
  const runButton = query<HTMLButtonElement>('[data-run-compare]');
  const largeWarning = query<HTMLElement>('[data-large-warning]');
  const progressBox = query<HTMLElement>('[data-tool-progress]');
  const progressLabel = query<HTMLElement>('[data-progress-label]');
  const progressCount = query<HTMLElement>('[data-progress-count]');
  const progressBar = query<HTMLElement>('[data-progress-bar]');
  const resultStatus = query<HTMLElement>('[data-result-status]');
  const exportXlsxButton = query<HTMLButtonElement>('[data-export-xlsx]');
  const exportCsvButton = query<HTMLButtonElement>('[data-export-csv]');
  const kindFilter = query<HTMLSelectElement>('[data-kind-filter]');
  const columnFilter = query<HTMLSelectElement>('[data-column-filter]');
  const queryFilter = query<HTMLInputElement>('[data-query-filter]');
  const diffBody = query<HTMLTableSectionElement>('[data-diff-body]');
  const emptyState = query<HTMLElement>('[data-empty-state]');
  const inspectorEmpty = query<HTMLElement>('[data-inspector-empty]');
  const inspectorCard = query<HTMLElement>('[data-inspector-card]');
  const inspectorKind = query<HTMLElement>('[data-inspector-kind]');
  const inspectorLocation = query<HTMLElement>('[data-inspector-location]');
  const inspectorColumn = query<HTMLElement>('[data-inspector-column]');
  const inspectorBefore = query<HTMLElement>('[data-inspector-before]');
  const inspectorAfter = query<HTMLElement>('[data-inspector-after]');
  const formulaDetail = query<HTMLElement>('[data-formula-detail]');
  const inspectorFormula = query<HTMLElement>('[data-inspector-formula]');
  const summaryChanged = query<HTMLElement>('[data-summary-changed]');
  const summaryAdded = query<HTMLElement>('[data-summary-added]');
  const summaryRemoved = query<HTMLElement>('[data-summary-removed]');
  const summaryFormula = query<HTMLElement>('[data-summary-formula]');
  const summaryStructural = query<HTMLElement>('[data-summary-structural]');

  const worker = new Worker(new URL('../../workers/excel-diff.worker.ts', import.meta.url), { type: 'module' });

  const KIND_LABELS: Record<DiffKind, string> = {
    value: '変更',
    formula: '数式変更',
    'row-added': '追加',
    'row-removed': '削除',
    'column-added': '列追加',
    'column-removed': '列削除',
    'sheet-added': 'シート追加',
    'sheet-removed': 'シート削除',
  };

  const STRUCTURAL_KINDS = new Set<DiffKind>([
    'column-added',
    'column-removed',
    'sheet-added',
    'sheet-removed',
  ]);

  function formatBytes(bytes: number): string {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  function formatValue(value: unknown): string {
    if (value == null || value === '') return '空欄';
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    return String(value);
  }

  function showError(message: string): void {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
  }

  function clearError(): void {
    errorMessage.textContent = '';
    errorMessage.hidden = true;
  }

  function setFileName(target: FileTarget, file: File | null): void {
    const element = target === 'before' ? beforeName : afterName;
    element.textContent = file ? `${file.name} / ${formatBytes(file.size)}` : '未選択';
  }

  function showProgress(label: string, percent = 8, count = ''): void {
    progressBox.hidden = false;
    progressLabel.textContent = label;
    progressCount.textContent = count;
    progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  }

  function hideProgress(): void {
    progressBox.hidden = true;
    progressCount.textContent = '';
    progressBar.style.width = '0%';
  }

  function updateProgress(message: Extract<ExcelDiffWorkerResponse, { type: 'progress' }>): void {
    let percent = [10, 30, 70, 96][message.stage - 1] ?? 10;
    let count = '';
    if (message.current != null && message.total != null && message.total > 0) {
      percent = 30 + (message.current / message.total) * 58;
      count = `${message.current.toLocaleString('ja-JP')} / ${message.total.toLocaleString('ja-JP')} 行`;
    }
    showProgress(message.label, percent, count);
  }

  function selectedInspectionSheet(inspection: WorkbookInspection | null) {
    return inspection?.sheets.find((sheet) => sheet.name === state.selectedSheet) ?? null;
  }

  function commonHeaders(): string[] {
    const beforeSheet = selectedInspectionSheet(state.beforeInspection);
    const afterSheet = selectedInspectionSheet(state.afterInspection);
    if (!beforeSheet || !afterSheet) return [];
    const afterHeaders = new Set(afterSheet.headers);
    return beforeSheet.headers.filter((header) => afterHeaders.has(header));
  }

  function setControlBusy(): void {
    const busy = state.comparing || state.pendingInspections.size > 0;
    beforeInput.disabled = busy;
    afterInput.disabled = busy;
    sampleButton.disabled = busy;
    resetButton.disabled = state.comparing;
    sheetSelect.disabled = busy || !state.beforeInspection || !state.afterInspection;
    modeInputs.forEach((input) => { input.disabled = busy; });
    addKeyColumnButton.disabled = busy || commonHeaders().length === 0;

    runButton.disabled = !(
      state.beforeFile
      && state.afterFile
      && state.beforeInspection
      && state.afterInspection
      && state.selectedSheet
      && !busy
    );
  }

  function refreshLargeWarning(): void {
    const beforeSheet = selectedInspectionSheet(state.beforeInspection);
    const afterSheet = selectedInspectionSheet(state.afterInspection);
    largeWarning.hidden = !(beforeSheet?.large || afterSheet?.large);
  }

  function renderKeyColumns(): void {
    const headers = commonHeaders();
    keyColumnsContainer.replaceChildren();

    if (headers.length === 0) {
      const note = document.createElement('p');
      note.className = 'tool-panel-copy';
      note.textContent = '両方のファイルに共通する列がありません。行番号で比較してください。';
      keyColumnsContainer.appendChild(note);
      state.keyColumns = [];
      return;
    }

    if (state.keyColumns.length === 0) state.keyColumns = [headers[0]];
    state.keyColumns = state.keyColumns.map((column) => headers.includes(column) ? column : headers[0]);

    state.keyColumns.forEach((selectedColumn, index) => {
      const row = document.createElement('div');
      row.className = 'tool-key-row';

      const select = document.createElement('select');
      select.setAttribute('aria-label', `行を特定する列 ${index + 1}`);
      select.dataset.keyColumn = String(index);
      headers.forEach((header) => select.add(new Option(header, header)));
      select.value = selectedColumn;
      select.addEventListener('change', () => {
        state.keyColumns[index] = select.value;
        clearError();
      });
      row.appendChild(select);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'tool-button tool-button-secondary';
      remove.textContent = '削除';
      remove.setAttribute('aria-label', `${selectedColumn}を比較キーから削除`);
      remove.disabled = state.keyColumns.length <= 1;
      remove.addEventListener('click', () => {
        state.keyColumns.splice(index, 1);
        renderKeyColumns();
      });
      row.appendChild(remove);
      keyColumnsContainer.appendChild(row);
    });
  }

  function refreshSheetOptions(): void {
    const beforeSheets = state.beforeInspection?.sheetNames ?? [];
    const afterSheets = state.afterInspection?.sheetNames ?? [];
    const union = [...new Set([...beforeSheets, ...afterSheets])];
    const previous = state.selectedSheet;

    sheetSelect.replaceChildren();
    if (union.length === 0) {
      sheetSelect.add(new Option('比較できるシートがありません', ''));
      state.selectedSheet = '';
      renderKeyColumns();
      refreshLargeWarning();
      setControlBusy();
      return;
    }

    union.forEach((name) => sheetSelect.add(new Option(name, name)));
    state.selectedSheet = union.includes(previous) ? previous : union[0];
    sheetSelect.value = state.selectedSheet;
    renderKeyColumns();
    refreshLargeWarning();
    setControlBusy();
  }

  async function inspectFile(target: FileTarget, file: File): Promise<void> {
    const validation = validateExcelFile(file);
    if (!validation.valid) {
      showError(validation.message);
      if (target === 'before') {
        state.beforeFile = null;
        state.beforeInspection = null;
        beforeInput.value = '';
      } else {
        state.afterFile = null;
        state.afterInspection = null;
        afterInput.value = '';
      }
      setFileName(target, null);
      refreshSheetOptions();
      return;
    }

    clearError();
    state.pendingInspections.add(target);
    setControlBusy();
    showProgress('ファイルを読み込んでいます', 10);

    try {
      const buffer = await file.arrayBuffer();
      worker.postMessage({ type: 'inspect', target, buffer, fileName: file.name }, [buffer]);
    } catch {
      state.pendingInspections.delete(target);
      hideProgress();
      setControlBusy();
      showError('ファイルを読み込めませんでした。もう一度選択してください。');
    }
  }

  function setFile(target: FileTarget, file: File | null): void {
    if (target === 'before') {
      state.beforeFile = file;
      state.beforeInspection = null;
    } else {
      state.afterFile = file;
      state.afterInspection = null;
    }
    setFileName(target, file);
    clearResults();
    refreshSheetOptions();
    if (file) void inspectFile(target, file);
  }

  function allDiffs(): DiffEntry[] {
    if (!state.result) return [];
    return [...state.result.diffs, ...state.result.structuralDiffs];
  }

  function matchesKind(diff: DiffEntry): boolean {
    if (state.kindFilter === 'all') return true;
    if (state.kindFilter === 'structural') return STRUCTURAL_KINDS.has(diff.kind);
    return diff.kind === state.kindFilter;
  }

  function filteredDiffs(): DiffEntry[] {
    const needle = state.query.trim().toLocaleLowerCase('ja-JP');
    return allDiffs().filter((diff) => {
      if (!matchesKind(diff)) return false;
      if (state.columnFilter !== 'all' && diff.columnName !== state.columnFilter) return false;
      if (!needle) return true;

      const haystack = [
        diff.sheetName,
        diff.rowKey,
        diff.address,
        diff.columnName,
        diff.beforeValue,
        diff.afterValue,
        diff.beforeFormula,
        diff.afterFormula,
      ].map((value) => value == null ? '' : String(value)).join(' ').toLocaleLowerCase('ja-JP');
      return haystack.includes(needle);
    });
  }

  function updateColumnFilter(): void {
    const previous = state.columnFilter;
    const columns = [...new Set(
      allDiffs().map((diff) => diff.columnName).filter((value): value is string => Boolean(value)),
    )];
    columnFilter.replaceChildren(new Option('すべて', 'all'));
    columns.forEach((column) => columnFilter.add(new Option(column, column)));
    state.columnFilter = columns.includes(previous) ? previous : 'all';
    columnFilter.value = state.columnFilter;
  }

  function updateSummary(): void {
    const summary = state.result?.summary;
    summaryChanged.textContent = String(summary?.changed ?? 0);
    summaryAdded.textContent = String(summary?.added ?? 0);
    summaryRemoved.textContent = String(summary?.removed ?? 0);
    summaryFormula.textContent = String(summary?.formulaChanged ?? 0);
    summaryStructural.textContent = String(summary?.structuralChanged ?? 0);
  }

  function createCell(text: string): HTMLTableCellElement {
    const cell = document.createElement('td');
    cell.textContent = text;
    return cell;
  }

  function selectDiff(id: string): void {
    state.selectedDiffId = id;
    renderDiffTable();
    renderInspector();
  }

  function createDiffRow(diff: DiffEntry): HTMLTableRowElement {
    const row = document.createElement('tr');
    row.dataset.diffId = diff.id;
    row.tabIndex = 0;
    row.setAttribute('aria-selected', String(diff.id === state.selectedDiffId));

    const kindCell = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'tool-diff-kind';
    badge.dataset.kind = diff.kind;
    badge.textContent = KIND_LABELS[diff.kind];
    kindCell.appendChild(badge);
    row.appendChild(kindCell);

    row.appendChild(createCell(diff.sheetName));
    row.appendChild(createCell(diff.rowKey ?? diff.address ?? '—'));
    row.appendChild(createCell(diff.columnName ?? '—'));
    row.appendChild(createCell(formatValue(diff.beforeValue)));
    row.appendChild(createCell(formatValue(diff.afterValue)));

    row.addEventListener('click', () => selectDiff(diff.id));
    row.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      selectDiff(diff.id);
    });
    return row;
  }

  function renderDiffTable(): void {
    const rows = filteredDiffs();
    diffBody.replaceChildren();

    if (!state.result || rows.length === 0) {
      emptyState.hidden = false;
      const strong = emptyState.querySelector('strong');
      const paragraph = emptyState.querySelector('p');
      if (!state.result) {
        if (strong) strong.textContent = 'まだ比較していません';
        if (paragraph) paragraph.textContent = '左側で変更前・変更後のExcelを選び、「差分を比較する」を押してください。';
      } else if (allDiffs().length === 0) {
        if (strong) strong.textContent = '差分は見つかりませんでした';
        if (paragraph) paragraph.textContent = '選択したシートと比較条件では変更箇所を検出しませんでした。';
      } else {
        if (strong) strong.textContent = '条件に一致する差分がありません';
        if (paragraph) paragraph.textContent = '絞り込み条件を変更して確認してください。';
      }
      return;
    }

    emptyState.hidden = true;
    rows.forEach((diff) => diffBody.appendChild(createDiffRow(diff)));
  }

  function renderInspector(): void {
    const diff = allDiffs().find((item) => item.id === state.selectedDiffId) ?? null;
    inspectorEmpty.hidden = Boolean(diff);
    inspectorCard.hidden = !diff;
    if (!diff) return;

    inspectorKind.textContent = KIND_LABELS[diff.kind];
    inspectorLocation.textContent = `${diff.sheetName} / ${diff.rowKey ?? diff.address ?? '構造変更'}`;
    inspectorColumn.textContent = diff.columnName ?? '—';
    inspectorBefore.textContent = formatValue(diff.beforeValue);
    inspectorAfter.textContent = formatValue(diff.afterValue);

    const hasFormula = diff.kind === 'formula';
    formulaDetail.hidden = !hasFormula;
    inspectorFormula.textContent = hasFormula
      ? `変更前: ${diff.beforeFormula ? `=${diff.beforeFormula}` : '数式なし'}\n変更後: ${diff.afterFormula ? `=${diff.afterFormula}` : '数式なし'}`
      : '—';
  }

  function renderResults(): void {
    updateSummary();
    updateColumnFilter();
    renderDiffTable();
    renderInspector();
    const count = allDiffs().length;
    resultStatus.textContent = `比較完了。${count.toLocaleString('ja-JP')}件の差分を確認できます。`;
    exportXlsxButton.disabled = false;
    exportCsvButton.disabled = false;
    resultCta.show();
  }

  function clearResults(): void {
    state.result = null;
    state.selectedDiffId = null;
    state.kindFilter = 'all';
    state.columnFilter = 'all';
    state.query = '';
    kindFilter.value = 'all';
    queryFilter.value = '';
    updateSummary();
    updateColumnFilter();
    renderDiffTable();
    renderInspector();
    resultStatus.textContent = 'ファイルと比較条件を選択してください。';
    exportXlsxButton.disabled = true;
    exportCsvButton.disabled = true;
    resultCta.hide();
  }

  async function runComparison(): Promise<void> {
    clearError();
    if (!state.beforeFile || !state.afterFile || !state.selectedSheet) {
      showError('変更前・変更後のファイルと比較するシートを選択してください。');
      return;
    }

    const keyColumns = state.mode === 'key-columns' ? [...state.keyColumns] : [];
    if (state.mode === 'key-columns') {
      if (keyColumns.length === 0) {
        showError('行を特定する列を1つ以上選択してください。');
        return;
      }
      if (new Set(keyColumns).size !== keyColumns.length) {
        showError('同じ列が複数選択されています。行を特定する列は重複しないように選択してください。');
        return;
      }
    }

    state.comparing = true;
    setControlBusy();
    showProgress('ファイルを読み込んでいます', 8);
    resultStatus.textContent = '比較処理を実行しています。';

    try {
      const [before, after] = await Promise.all([
        state.beforeFile.arrayBuffer(),
        state.afterFile.arrayBuffer(),
      ]);
      worker.postMessage({
        type: 'compare',
        before,
        after,
        beforeName: state.beforeFile.name,
        afterName: state.afterFile.name,
        options: { mode: state.mode, sheetName: state.selectedSheet, keyColumns },
      }, [before, after]);
    } catch {
      state.comparing = false;
      hideProgress();
      setControlBusy();
      showError('Excelファイルを読み込めませんでした。ファイルを選び直してください。');
    }
  }

  function downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function outputTimestamp(): string {
    const parts = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date());
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
    return `${part('year')}${part('month')}${part('day')}-${part('hour')}${part('minute')}`;
  }

  function exportXlsx(): void {
    if (!state.result || !state.beforeFile || !state.afterFile) return;
    const blob = exportDiffWorkbook(state.result, {
      beforeFileName: state.beforeFile.name,
      afterFileName: state.afterFile.name,
      comparedAt: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
      modeLabel: state.mode === 'key-columns' ? '行を特定する列で比較' : '行番号で比較',
      keyColumns: state.mode === 'key-columns' ? state.keyColumns : [],
    });
    downloadBlob(blob, `excel-diff-${outputTimestamp()}.xlsx`);
  }

  function exportCsv(): void {
    if (!state.result) return;
    downloadBlob(exportDiffCsv(filteredDiffs()), `excel-diff-${outputTimestamp()}.csv`);
  }

  function resetAll(): void {
    state.beforeFile = null;
    state.afterFile = null;
    state.beforeInspection = null;
    state.afterInspection = null;
    state.selectedSheet = '';
    state.mode = 'row-number';
    state.keyColumns = [];
    state.pendingInspections.clear();
    state.comparing = false;
    beforeInput.value = '';
    afterInput.value = '';
    setFileName('before', null);
    setFileName('after', null);
    modeInputs.forEach((input) => { input.checked = input.value === 'row-number'; });
    keyColumnsWrap.hidden = true;
    largeWarning.hidden = true;
    clearError();
    hideProgress();
    clearResults();
    refreshSheetOptions();
    setControlBusy();
  }

  worker.addEventListener('message', (event: MessageEvent<ExcelDiffWorkerResponse>) => {
    const message = event.data;

    if (message.type === 'progress') {
      updateProgress(message);
      return;
    }

    if (message.type === 'inspected') {
      state.pendingInspections.delete(message.target);
      const currentFile = message.target === 'before' ? state.beforeFile : state.afterFile;
      if (currentFile?.name === message.inspection.fileName) {
        if (message.target === 'before') state.beforeInspection = message.inspection;
        else state.afterInspection = message.inspection;
      }
      refreshSheetOptions();
      if (state.pendingInspections.size === 0) hideProgress();
      setControlBusy();
      return;
    }

    if (message.type === 'complete') {
      state.comparing = false;
      state.result = message.result;
      state.selectedDiffId = allDiffs()[0]?.id ?? null;
      showProgress('変更箇所をまとめています', 100);
      window.setTimeout(hideProgress, 250);
      setControlBusy();
      renderResults();
      return;
    }

    state.comparing = false;
    state.pendingInspections.clear();
    hideProgress();
    setControlBusy();
    resultStatus.textContent = '比較を完了できませんでした。';
    showError(`${message.title}：${message.message}`);
  });

  beforeInput.addEventListener('change', () => setFile('before', beforeInput.files?.[0] ?? null));
  afterInput.addEventListener('change', () => setFile('after', afterInput.files?.[0] ?? null));

  sampleButton.addEventListener('click', () => {
    const sample = createSampleFiles();
    beforeInput.value = '';
    afterInput.value = '';
    setFile('before', sample.before);
    setFile('after', sample.after);
  });

  resetButton.addEventListener('click', resetAll);

  sheetSelect.addEventListener('change', () => {
    state.selectedSheet = sheetSelect.value;
    state.keyColumns = [];
    clearError();
    renderKeyColumns();
    refreshLargeWarning();
    setControlBusy();
  });

  modeInputs.forEach((input) => input.addEventListener('change', () => {
    if (!input.checked) return;
    state.mode = input.value as CompareOptions['mode'];
    keyColumnsWrap.hidden = state.mode !== 'key-columns';
    if (state.mode === 'key-columns') renderKeyColumns();
    clearError();
  }));

  addKeyColumnButton.addEventListener('click', () => {
    const headers = commonHeaders();
    if (headers.length === 0) return;
    state.keyColumns.push(headers.find((header) => !state.keyColumns.includes(header)) ?? headers[0]);
    renderKeyColumns();
  });

  runButton.addEventListener('click', () => void runComparison());

  kindFilter.addEventListener('change', () => {
    state.kindFilter = kindFilter.value as KindFilter;
    renderDiffTable();
  });
  columnFilter.addEventListener('change', () => {
    state.columnFilter = columnFilter.value;
    renderDiffTable();
  });
  queryFilter.addEventListener('input', () => {
    state.query = queryFilter.value;
    renderDiffTable();
  });

  root.querySelectorAll<HTMLButtonElement>('[data-summary-kind]').forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.dataset.summaryKind as KindFilter | undefined;
      if (!value) return;
      state.kindFilter = value;
      kindFilter.value = value;
      renderDiffTable();
    });
  });

  exportXlsxButton.addEventListener('click', exportXlsx);
  exportCsvButton.addEventListener('click', exportCsv);

  resetAll();
}
