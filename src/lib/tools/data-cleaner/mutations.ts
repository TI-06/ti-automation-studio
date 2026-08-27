import { parseDateCandidate, parseNumericCandidate } from './diagnostics';
import { normalizeAsciiWidth, trimOuterWhitespace } from './normalize';
import type {
  CleanerCellValue,
  CleanerChange,
  CleanerDataset,
  CleanerHistoryEntry,
} from './types';

export type CleanerMutationAction =
  | { type: 'trim'; columnId: string }
  | { type: 'normalize-width'; columnId: string }
  | { type: 'remove-line-breaks'; columnId: string }
  | { type: 'date-format'; columnId: string; format: 'YYYY/MM/DD' | 'YYYY-MM-DD' | 'YYYY年M月D日' }
  | { type: 'normalize-number'; columnId: string }
  | { type: 'fill-blank'; columnId: string; value: string }
  | { type: 'replace-values'; columnId: string; fromValues: string[]; toValue: string };

function cloneDataset(dataset: CleanerDataset): CleanerDataset {
  return {
    sheetName: dataset.sheetName,
    columns: dataset.columns.map((column) => ({ ...column })),
    rows: dataset.rows.map((row) => [...row]),
  };
}

function columnIndex(dataset: CleanerDataset, columnId: string): number {
  const column = dataset.columns.find((item) => item.id === columnId);
  if (!column) throw new Error(`対象列「${columnId}」が見つかりません。`);
  return column.index;
}

function isBlank(value: CleanerCellValue): boolean {
  return value == null || (typeof value === 'string' && trimOuterWhitespace(value) === '');
}

function formatDate(iso: string, format: Extract<CleanerMutationAction, { type: 'date-format' }>['format']): string {
  const [year, month, day] = iso.split('-');
  if (format === 'YYYY/MM/DD') return `${year}/${month}/${day}`;
  if (format === 'YYYY年M月D日') return `${year}年${Number(month)}月${Number(day)}日`;
  return iso;
}

function createChange(
  rowIndex: number,
  columnId: string,
  before: CleanerCellValue,
  after: CleanerCellValue,
  reason: string,
): CleanerChange {
  return {
    id: `change-${columnId}-${rowIndex}-${reason}`,
    rowIndex,
    columnId,
    before,
    after,
    reason,
    excluded: false,
  };
}

export function buildChanges(dataset: CleanerDataset, action: CleanerMutationAction): CleanerChange[] {
  const index = columnIndex(dataset, action.columnId);
  const changes: CleanerChange[] = [];

  dataset.rows.forEach((row, rowIndex) => {
    const before = row[index] ?? null;
    let after: CleanerCellValue = before;
    let reason = '';

    if (action.type === 'trim') {
      if (typeof before !== 'string') return;
      after = trimOuterWhitespace(before);
      reason = '前後の空白';
    } else if (action.type === 'normalize-width') {
      if (typeof before !== 'string') return;
      after = normalizeAsciiWidth(before);
      reason = '全角英数字を半角へ';
    } else if (action.type === 'remove-line-breaks') {
      if (typeof before !== 'string') return;
      after = before.replace(/[\r\n]+/g, ' ');
      reason = 'セル内の不要な改行';
    } else if (action.type === 'date-format') {
      const parsed = parseDateCandidate(before);
      if (!parsed) return;
      after = formatDate(parsed.iso, action.format);
      reason = `日付形式を${action.format}へ統一`;
    } else if (action.type === 'normalize-number') {
      const parsed = parseNumericCandidate(before);
      if (!parsed) return;
      after = parsed.value;
      reason = '数値形式を統一';
    } else if (action.type === 'fill-blank') {
      if (!isBlank(before)) return;
      after = action.value;
      reason = '空欄を指定文字で補完';
    } else if (action.type === 'replace-values') {
      if (typeof before !== 'string' || !action.fromValues.includes(before)) return;
      after = action.toValue;
      reason = '表記を指定値へ統一';
    }

    if (Object.is(before, after)) return;
    changes.push(createChange(rowIndex, action.columnId, before, after, reason));
  });

  return changes;
}

export function applyChanges(dataset: CleanerDataset, changes: CleanerChange[]): CleanerDataset {
  const next = cloneDataset(dataset);
  changes.filter((change) => !change.excluded).forEach((change) => {
    const index = columnIndex(next, change.columnId);
    if (!next.rows[change.rowIndex]) return;
    next.rows[change.rowIndex][index] = change.after;
  });
  return next;
}

export function applyRowDeletes(dataset: CleanerDataset, rowIndexes: number[]): CleanerDataset {
  const deleteSet = new Set(rowIndexes.filter((index) => Number.isInteger(index) && index >= 0));
  return {
    sheetName: dataset.sheetName,
    columns: dataset.columns.map((column) => ({ ...column })),
    rows: dataset.rows.filter((_, index) => !deleteSet.has(index)).map((row) => [...row]),
  };
}

export function createHistoryEntry(
  label: string,
  beforeDataset: CleanerDataset,
  changes: CleanerChange[],
  deletedRows: number[] = [],
): CleanerHistoryEntry {
  return {
    id: `history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label,
    changes: changes.map((change) => ({ ...change })),
    beforeDataset: cloneDataset(beforeDataset),
    deletedRows: [...deletedRows],
  };
}

export function undoHistory(entry: CleanerHistoryEntry): CleanerDataset {
  return cloneDataset(entry.beforeDataset);
}
