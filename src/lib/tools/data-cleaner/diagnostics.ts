import { normalizeAsciiWidth, safeVariantKey, trimOuterWhitespace } from './normalize';
import type {
  CleanerCellValue,
  CleanerDataKind,
  CleanerDataset,
  ColumnDiagnostic,
  DiagnosticIssue,
  DiagnosticResult,
} from './types';

export interface ParsedDateCandidate {
  iso: string;
  style: 'slash' | 'hyphen' | 'japanese';
}

export interface ParsedNumericCandidate {
  value: number;
  style: 'number' | 'plain-string' | 'comma' | 'fullwidth';
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function validDateParts(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export function parseDateCandidate(value: CleanerCellValue): ParsedDateCandidate | null {
  if (typeof value !== 'string') return null;
  const text = trimOuterWhitespace(normalizeAsciiWidth(value));
  let match = text.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  let style: ParsedDateCandidate['style'] | null = match ? 'slash' : null;
  if (!match) {
    match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    style = match ? 'hyphen' : null;
  }
  if (!match) {
    match = text.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
    style = match ? 'japanese' : null;
  }
  if (!match || !style) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!validDateParts(year, month, day)) return null;
  return { iso: `${year}-${pad2(month)}-${pad2(day)}`, style };
}

export function parseNumericCandidate(value: CleanerCellValue): ParsedNumericCandidate | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return { value, style: 'number' };
  }
  if (typeof value !== 'string') return null;
  const raw = trimOuterWhitespace(value);
  if (!raw) return null;
  const widthNormalized = normalizeAsciiWidth(raw);
  const usedFullwidth = widthNormalized !== raw && /[０-９．＋－]/.test(raw);
  const hasComma = widthNormalized.includes(',');
  const compact = widthNormalized.replace(/,/g, '');
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(compact)) return null;
  const numeric = Number(compact);
  if (!Number.isFinite(numeric)) return null;
  return {
    value: numeric,
    style: usedFullwidth ? 'fullwidth' : hasComma ? 'comma' : 'plain-string',
  };
}

function displayValue(value: CleanerCellValue): string {
  if (value == null) return '';
  return String(value);
}

function isBlank(value: CleanerCellValue): boolean {
  return value == null || (typeof value === 'string' && trimOuterWhitespace(value) === '');
}

function exactDuplicateRowIndexes(dataset: CleanerDataset): number[] {
  const map = new Map<string, number[]>();
  dataset.rows.forEach((row, index) => {
    const key = JSON.stringify(row);
    const list = map.get(key) ?? [];
    list.push(index);
    map.set(key, list);
  });
  return [...map.values()].filter((indexes) => indexes.length > 1).flat();
}

function duplicateCountForColumn(dataset: CleanerDataset, columnIndex: number): number {
  const groups = new Map<string, number>();
  dataset.rows.forEach((row) => {
    const value = row[columnIndex];
    if (isBlank(value)) return;
    const key = JSON.stringify(value);
    groups.set(key, (groups.get(key) ?? 0) + 1);
  });
  let count = 0;
  groups.forEach((value) => {
    if (value > 1) count += value;
  });
  return count;
}

function inferKind(values: CleanerCellValue[]): CleanerDataKind {
  const nonBlank = values.filter((value) => !isBlank(value));
  if (nonBlank.length === 0) return 'blank';
  const dateCount = nonBlank.filter((value) => parseDateCandidate(value)).length;
  const numericCount = nonBlank.filter((value) => parseNumericCandidate(value)).length;
  if (dateCount === nonBlank.length) return 'date';
  if (numericCount === nonBlank.length) return 'number';
  const stringCount = nonBlank.filter((value) => typeof value === 'string').length;
  if (stringCount === nonBlank.length) return 'text';
  return 'mixed';
}

function addColumnIssue(
  issues: DiagnosticIssue[],
  category: DiagnosticIssue['category'],
  columnId: string,
  rowIndexes: number[],
  examples: Array<{ before: string; after?: string }>,
  message: string,
): void {
  if (rowIndexes.length === 0) return;
  issues.push({
    id: `${category}-${columnId}-${issues.length + 1}`,
    category,
    columnId,
    rowIndexes,
    count: rowIndexes.length,
    examples: examples.slice(0, 5),
    message,
  });
}

export function diagnoseDataset(dataset: CleanerDataset): DiagnosticResult {
  const issues: DiagnosticIssue[] = [];

  const duplicateRows = exactDuplicateRowIndexes(dataset);
  if (duplicateRows.length > 0) {
    issues.push({
      id: 'duplicate-full-row',
      category: 'duplicate',
      rowIndexes: duplicateRows,
      count: duplicateRows.length,
      examples: duplicateRows.slice(0, 3).map((rowIndex) => ({
        before: dataset.rows[rowIndex].map(displayValue).join(' / '),
      })),
      message: `${duplicateRows.length}行が完全に重複しています。`,
    });
  }

  dataset.columns.forEach((column) => {
    const values = dataset.rows.map((row) => row[column.index] ?? null);

    const blankRows = values.flatMap((value, rowIndex) => isBlank(value) ? [rowIndex] : []);
    addColumnIssue(
      issues,
      'blank',
      column.id,
      blankRows,
      blankRows.map(() => ({ before: '空欄' })),
      `「${column.name}」に${blankRows.length}件の空欄があります。`,
    );

    const trimRows: number[] = [];
    const trimExamples: Array<{ before: string; after: string }> = [];
    values.forEach((value, rowIndex) => {
      if (typeof value !== 'string') return;
      const after = trimOuterWhitespace(value);
      if (after === value) return;
      trimRows.push(rowIndex);
      trimExamples.push({ before: value, after });
    });
    addColumnIssue(
      issues,
      'trim-space',
      column.id,
      trimRows,
      trimExamples,
      `「${column.name}」に前後の余分な空白があります。`,
    );

    const widthRows: number[] = [];
    const widthExamples: Array<{ before: string; after: string }> = [];
    values.forEach((value, rowIndex) => {
      if (typeof value !== 'string' || !/[\u3000\uff01-\uff5e]/.test(value)) return;
      const after = normalizeAsciiWidth(value);
      if (after === value) return;
      widthRows.push(rowIndex);
      widthExamples.push({ before: value, after });
    });
    addColumnIssue(
      issues,
      'width-mixed',
      column.id,
      widthRows,
      widthExamples,
      `「${column.name}」に全角・半角の混在候補があります。`,
    );

    const lineBreakRows: number[] = [];
    const lineBreakExamples: Array<{ before: string; after: string }> = [];
    values.forEach((value, rowIndex) => {
      if (typeof value !== 'string' || !/[\r\n]/.test(value)) return;
      lineBreakRows.push(rowIndex);
      lineBreakExamples.push({ before: value, after: value.replace(/[\r\n]+/g, ' ') });
    });
    addColumnIssue(
      issues,
      'line-break',
      column.id,
      lineBreakRows,
      lineBreakExamples,
      `「${column.name}」にセル内改行があります。`,
    );

    const dateCandidates = values.flatMap((value, rowIndex) => {
      const parsed = parseDateCandidate(value);
      return parsed ? [{ rowIndex, value, parsed }] : [];
    });
    const dateStyles = new Set(dateCandidates.map((item) => item.parsed.style));
    if (dateCandidates.length >= 2 && dateStyles.size >= 2) {
      addColumnIssue(
        issues,
        'date-mixed',
        column.id,
        dateCandidates.map((item) => item.rowIndex),
        dateCandidates.map((item) => ({ before: displayValue(item.value), after: item.parsed.iso })),
        `「${column.name}」で複数の日付形式が使われています。`,
      );
    }

    const numericCandidates = values.flatMap((value, rowIndex) => {
      const parsed = parseNumericCandidate(value);
      return parsed ? [{ rowIndex, value, parsed }] : [];
    });
    const numericStyles = new Set(numericCandidates.map((item) => item.parsed.style));
    if (numericCandidates.length >= 2 && numericStyles.size >= 2) {
      addColumnIssue(
        issues,
        'number-mixed',
        column.id,
        numericCandidates.map((item) => item.rowIndex),
        numericCandidates.map((item) => ({ before: displayValue(item.value), after: String(item.parsed.value) })),
        `「${column.name}」で複数の数値表記が使われています。`,
      );
    }

    const variants = new Map<string, Array<{ rowIndex: number; raw: string }>>();
    values.forEach((value, rowIndex) => {
      if (typeof value !== 'string' || !trimOuterWhitespace(value)) return;
      const key = safeVariantKey(value);
      const list = variants.get(key) ?? [];
      list.push({ rowIndex, raw: value });
      variants.set(key, list);
    });
    variants.forEach((group, key) => {
      const distinct = [...new Set(group.map((item) => item.raw))];
      if (!key || distinct.length < 2) return;
      addColumnIssue(
        issues,
        'notation-variant',
        column.id,
        group.map((item) => item.rowIndex),
        distinct.map((raw) => ({ before: raw, after: distinct[0] })),
        `「${column.name}」に同じ内容と判断できる表記の違いがあります。`,
      );
    });
  });

  const columns: ColumnDiagnostic[] = dataset.columns.map((column) => {
    const values = dataset.rows.map((row) => row[column.index] ?? null);
    const columnIssues = issues.filter((issue) => issue.columnId === column.id);
    return {
      columnId: column.id,
      columnName: column.name,
      dataCount: values.filter((value) => !isBlank(value)).length,
      blankCount: values.filter(isBlank).length,
      duplicateCount: duplicateCountForColumn(dataset, column.index),
      issueCount: columnIssues.reduce((sum, issue) => sum + issue.count, 0),
      inferredKind: inferKind(values),
    };
  });

  return { issues, columns };
}
