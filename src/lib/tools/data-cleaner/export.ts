import Encoding from 'encoding-japanese';
import * as XLSX from 'xlsx';
import type {
  CleanerCellValue,
  CleanerCsvEncoding,
  CleanerDataset,
  CleanerHistoryEntry,
  CleaningSummary,
} from './types';

function csvCell(value: CleanerCellValue): string {
  if (value == null) return '';
  const text = String(value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function csvText(dataset: CleanerDataset): string {
  const lines = [
    dataset.columns.map((column) => csvCell(column.name)).join(','),
    ...dataset.rows.map((row) => dataset.columns.map((column) => csvCell(row[column.index] ?? null)).join(',')),
  ];
  return `${lines.join('\r\n')}\r\n`;
}

export function exportCleanerCsv(dataset: CleanerDataset, encoding: CleanerCsvEncoding): Blob {
  const text = csvText(dataset);
  if (encoding === 'utf-8') {
    return new Blob([`\uFEFF${text}`], { type: 'text/csv;charset=utf-8' });
  }

  const unicode = Encoding.stringToCode(text);
  const sjis = Encoding.convert(unicode, {
    to: 'SJIS',
    from: 'UNICODE',
    type: 'array',
    fallback: 'error',
  });
  return new Blob([new Uint8Array(sjis)], { type: 'text/csv;charset=shift_jis' });
}

function historyRows(dataset: CleanerDataset, history: CleanerHistoryEntry[]): unknown[][] {
  const rows: unknown[][] = [['操作', '行', '列', '変更前', '変更後', '理由']];
  history.forEach((entry) => {
    entry.changes
      .filter((change) => !change.excluded)
      .forEach((change) => {
        const column = dataset.columns.find((item) => item.id === change.columnId);
        rows.push([
          entry.label,
          change.rowIndex + 2,
          column?.name ?? change.columnId,
          change.before ?? '',
          change.after ?? '',
          change.reason,
        ]);
      });

    (entry.deletedRows ?? []).forEach((rowIndex) => {
      const beforeRow = entry.beforeDataset.rows[rowIndex] ?? [];
      rows.push([
        entry.label,
        rowIndex + 2,
        '行全体',
        beforeRow.map((value) => value ?? '').join(' / '),
        '削除',
        '重複または指定行の削除',
      ]);
    });
  });
  return rows;
}

export function exportCleanerWorkbook(
  dataset: CleanerDataset,
  history: CleanerHistoryEntry[],
  includeHistory: boolean,
): Blob {
  const workbook = XLSX.utils.book_new();
  const dataRows: unknown[][] = [
    dataset.columns.map((column) => column.name),
    ...dataset.rows.map((row) => dataset.columns.map((column) => row[column.index] ?? null)),
  ];
  const dataSheet = XLSX.utils.aoa_to_sheet(dataRows);
  XLSX.utils.book_append_sheet(workbook, dataSheet, dataset.sheetName || '整理済みデータ');

  if (includeHistory) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(historyRows(dataset, history)), '変更履歴');
  }

  const output = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return new Blob([output], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function summarizeCleaning(
  originalRows: number,
  dataset: CleanerDataset,
  history: CleanerHistoryEntry[],
): CleaningSummary {
  return {
    originalRows,
    cleanedRows: dataset.rows.length,
    changedCells: history.reduce(
      (sum, entry) => sum + entry.changes.filter((change) => !change.excluded).length,
      0,
    ),
    deletedRows: history.reduce((sum, entry) => sum + (entry.deletedRows?.length ?? 0), 0),
  };
}
