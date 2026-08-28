import * as XLSX from 'xlsx';
import type {
  DashboardCellValue,
  DashboardColumn,
  DashboardDataset,
  DashboardWidget,
  DashboardWidgetResult,
} from './types';

const AGGREGATE_LABELS: Record<DashboardWidget['aggregate'], string> = {
  sum: '合計',
  count: '件数',
  average: '平均',
  max: '最大',
  min: '最小',
};

function summaryRows(
  widgets: DashboardWidget[],
  results: DashboardWidgetResult[],
): Array<Record<string, string | number>> {
  return widgets.map((widget) => {
    const result = results.find((item) => item.widgetId === widget.id);
    const value = result?.scalar ?? (result?.values.reduce((sum, current) => sum + current, 0) ?? 0);
    return {
      ウィジェット: widget.title,
      種類: widget.kind,
      集計方法: AGGREGATE_LABELS[widget.aggregate],
      値: value,
    };
  });
}

function sourceRows(
  widgets: DashboardWidget[],
  results: DashboardWidgetResult[],
): Array<Record<string, string | number>> {
  const rows: Array<Record<string, string | number>> = [];
  widgets.forEach((widget) => {
    const result = results.find((item) => item.widgetId === widget.id);
    if (!result) return;
    if (result.scalar != null) {
      rows.push({ ウィジェット: widget.title, 項目: 'KPI', 値: result.scalar });
      return;
    }
    result.labels.forEach((label, index) => {
      rows.push({ ウィジェット: widget.title, 項目: label, 値: result.values[index] ?? 0 });
    });
  });
  return rows;
}

function filteredRowsSheet(
  columns: DashboardColumn[],
  rows: DashboardCellValue[][],
): unknown[][] {
  return [
    columns.map((column) => column.name),
    ...rows.map((row) => columns.map((column) => row[column.index] ?? null)),
  ];
}

export function exportDashboardWorkbook(
  dataset: DashboardDataset,
  columns: DashboardColumn[],
  widgets: DashboardWidget[],
  results: DashboardWidgetResult[],
  filteredRows: DashboardCellValue[][],
): Blob {
  const workbook = XLSX.utils.book_new();
  const summary = XLSX.utils.json_to_sheet(summaryRows(widgets, results));
  const chartSource = XLSX.utils.json_to_sheet(sourceRows(widgets, results));
  const filtered = XLSX.utils.aoa_to_sheet(filteredRowsSheet(columns, filteredRows));

  summary['!cols'] = [{ wch: 32 }, { wch: 16 }, { wch: 12 }, { wch: 16 }];
  chartSource['!cols'] = [{ wch: 32 }, { wch: 24 }, { wch: 16 }];
  filtered['!cols'] = columns.map((column) => ({ wch: Math.max(12, Math.min(28, column.name.length * 2 + 6)) }));

  XLSX.utils.book_append_sheet(workbook, summary, '集計概要');
  XLSX.utils.book_append_sheet(workbook, chartSource, 'グラフ元データ');
  XLSX.utils.book_append_sheet(workbook, filtered, '絞り込み済みデータ');
  workbook.Props = { Title: `${dataset.sheetName || 'データ'} ダッシュボード集計` };

  const output = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return new Blob([output], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
