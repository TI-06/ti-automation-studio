import * as XLSX from 'xlsx';
import type { DiffEntry, DiffResult } from './types';

export interface ExportMetadata {
  beforeFileName: string;
  afterFileName: string;
  comparedAt: string;
  modeLabel: string;
  keyColumns: string[];
}

const KIND_LABELS: Record<DiffEntry['kind'], string> = {
  value: '値の変更',
  formula: '数式変更',
  'row-added': '行の追加',
  'row-removed': '行の削除',
  'column-added': '列の追加',
  'column-removed': '列の削除',
  'sheet-added': 'シートの追加',
  'sheet-removed': 'シートの削除',
};

function displayValue(value: DiffEntry['beforeValue'] | DiffEntry['afterValue']): string | number | boolean {
  return value == null ? '' : value;
}

function diffRows(diffs: DiffEntry[]): (string | number | boolean)[][] {
  return [
    ['種類', 'シート', '行・キー', 'セル', '項目', '変更前', '変更後', '変更前の数式', '変更後の数式'],
    ...diffs.map((diff) => [
      KIND_LABELS[diff.kind],
      diff.sheetName,
      diff.rowKey ?? '',
      diff.address ?? '',
      diff.columnName ?? '',
      displayValue(diff.beforeValue),
      displayValue(diff.afterValue),
      diff.beforeFormula ?? '',
      diff.afterFormula ?? '',
    ]),
  ];
}

function appendDiffSheet(workbook: XLSX.WorkBook, name: string, diffs: DiffEntry[]): void {
  const sheet = XLSX.utils.aoa_to_sheet(diffRows(diffs));
  sheet['!cols'] = [
    { wch: 14 }, { wch: 18 }, { wch: 22 }, { wch: 12 }, { wch: 20 },
    { wch: 24 }, { wch: 24 }, { wch: 30 }, { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(workbook, sheet, name);
}

function summaryRows(result: DiffResult, metadata: ExportMetadata): (string | number)[][] {
  return [
    ['Excel差分比較・変更箇所チェッカー'],
    [],
    ['変更前ファイル', metadata.beforeFileName],
    ['変更後ファイル', metadata.afterFileName],
    ['比較日時', metadata.comparedAt],
    ['比較方法', metadata.modeLabel],
    ['行を特定する列', metadata.keyColumns.length > 0 ? metadata.keyColumns.join(' / ') : '使用しない'],
    [],
    ['値の変更', result.summary.changed],
    ['追加された行', result.summary.added],
    ['削除された行', result.summary.removed],
    ['数式変更', result.summary.formulaChanged],
    ['構造変更', result.summary.structuralChanged],
  ];
}

export function exportDiffWorkbook(result: DiffResult, metadata: ExportMetadata): Blob {
  const workbook = XLSX.utils.book_new();
  const summary = XLSX.utils.aoa_to_sheet(summaryRows(result, metadata));
  summary['!cols'] = [{ wch: 22 }, { wch: 44 }];
  XLSX.utils.book_append_sheet(workbook, summary, '比較概要');
  appendDiffSheet(workbook, '変更一覧', result.diffs.filter((diff) => diff.kind === 'value'));
  appendDiffSheet(workbook, '追加一覧', result.diffs.filter((diff) => diff.kind === 'row-added'));
  appendDiffSheet(workbook, '削除一覧', result.diffs.filter((diff) => diff.kind === 'row-removed'));
  appendDiffSheet(workbook, '数式変更一覧', result.diffs.filter((diff) => diff.kind === 'formula'));
  appendDiffSheet(workbook, '構造変更一覧', result.structuralDiffs);

  const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

function csvField(value: unknown): string {
  const text = value == null ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function exportDiffCsv(diffs: DiffEntry[]): Blob {
  const rows = diffRows(diffs);
  const csv = rows.map((row) => row.map(csvField).join(',')).join('\r\n');
  return new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
}
