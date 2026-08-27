import type { CleanerCellValue, CleanerDataset, DuplicateGroup } from './types';

function valueForColumn(dataset: CleanerDataset, rowIndex: number, columnId: string): CleanerCellValue {
  const column = dataset.columns.find((item) => item.id === columnId);
  if (!column) throw new Error(`重複判定に使う列「${columnId}」が見つかりません。`);
  return dataset.rows[rowIndex]?.[column.index] ?? null;
}

function allBlank(values: CleanerCellValue[]): boolean {
  return values.every((value) => value == null || (typeof value === 'string' && value.trim() === ''));
}

export function findDuplicateGroups(dataset: CleanerDataset, columnIds: string[]): DuplicateGroup[] {
  if (columnIds.length === 0) return [];
  const map = new Map<string, { values: CleanerCellValue[]; rows: number[] }>();

  dataset.rows.forEach((_, rowIndex) => {
    const values = columnIds.map((columnId) => valueForColumn(dataset, rowIndex, columnId));
    if (allBlank(values)) return;
    const key = JSON.stringify(values);
    const current = map.get(key) ?? { values, rows: [] };
    current.rows.push(rowIndex);
    map.set(key, current);
  });

  return [...map.values()]
    .filter((group) => group.rows.length > 1)
    .map((group, index) => ({
      id: `duplicate-${index + 1}`,
      keyValues: group.values,
      rowIndexes: group.rows,
    }));
}

export function duplicateRowsToDelete(
  group: DuplicateGroup,
  keep: 'first' | 'last' | number,
): number[] {
  if (group.rowIndexes.length <= 1) return [];
  let keepRow: number;
  if (keep === 'first') keepRow = group.rowIndexes[0];
  else if (keep === 'last') keepRow = group.rowIndexes[group.rowIndexes.length - 1];
  else keepRow = keep;

  if (!group.rowIndexes.includes(keepRow)) {
    throw new Error('残す行が重複グループ内にありません。');
  }
  return group.rowIndexes.filter((rowIndex) => rowIndex !== keepRow);
}
