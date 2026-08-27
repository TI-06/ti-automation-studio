import type {
  CellPrimitive,
  CompareOptions,
  DiffEntry,
  DiffResult,
  NormalizedCell,
  NormalizedSheet,
  NormalizedWorkbook,
} from './types';

const KEY_SEPARATOR = '\u001F';

export type KeyColumnValidation =
  | { valid: true }
  | { valid: false; message: string };

function columnLetters(index: number): string {
  let value = index + 1;
  let result = '';
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
}

function cellAddress(columnIndex: number, rowIndex: number): string {
  return `${columnLetters(columnIndex)}${rowIndex + 1}`;
}

function getSheet(workbook: NormalizedWorkbook, sheetName: string): NormalizedSheet | undefined {
  return workbook.sheets.find((sheet) => sheet.name === sheetName);
}

function getCell(sheet: NormalizedSheet, rowIndex: number, columnIndex: number): NormalizedCell {
  const address = cellAddress(columnIndex, rowIndex);
  return sheet.cells[address] ?? { value: sheet.rows[rowIndex]?.[columnIndex] ?? null };
}

function rowHasData(sheet: NormalizedSheet, rowIndex: number): boolean {
  const row = sheet.rows[rowIndex] ?? [];
  if (row.some((value) => value !== null && value !== '')) return true;
  for (let columnIndex = 0; columnIndex < sheet.columnCount; columnIndex += 1) {
    if (sheet.cells[cellAddress(columnIndex, rowIndex)]?.formula) return true;
  }
  return false;
}

function normalizeKeyPart(value: CellPrimitive): string {
  return value == null ? '' : String(value).trim();
}

function keyColumnIndexes(sheet: NormalizedSheet, keyColumns: string[]): number[] {
  return keyColumns.map((column) => sheet.headers.indexOf(column));
}

function internalKey(row: CellPrimitive[], indexes: number[]): string {
  return indexes.map((index) => normalizeKeyPart(row[index] ?? null)).join(KEY_SEPARATOR);
}

function displayKey(row: CellPrimitive[], indexes: number[]): string {
  return indexes.map((index) => normalizeKeyPart(row[index] ?? null)).join(' / ');
}

export function validateKeyColumns(
  sheet: NormalizedSheet,
  keyColumns: string[],
): KeyColumnValidation {
  if (keyColumns.length === 0) {
    return { valid: false, message: '行を特定する列を1つ以上選択してください。' };
  }

  const indexes = keyColumnIndexes(sheet, keyColumns);
  const missing = indexes.findIndex((index) => index < 0);
  if (missing >= 0) {
    return {
      valid: false,
      message: `「${keyColumns[missing]}」列が見つかりません。比較する列を確認してください。`,
    };
  }

  const seen = new Map<string, number>();
  for (let rowIndex = 1; rowIndex < sheet.rowCount; rowIndex += 1) {
    if (!rowHasData(sheet, rowIndex)) continue;
    const row = sheet.rows[rowIndex] ?? [];
    const parts = indexes.map((index) => normalizeKeyPart(row[index] ?? null));
    if (parts.some((part) => part === '')) {
      return {
        valid: false,
        message: `行を特定する列に空欄があります。${rowIndex + 1}行目の値を確認してください。`,
      };
    }

    const key = parts.join(KEY_SEPARATOR);
    const firstRow = seen.get(key);
    if (firstRow !== undefined) {
      return {
        valid: false,
        message: `行を特定する列に重複があります。${firstRow + 1}行目と${rowIndex + 1}行目を確認してください。`,
      };
    }
    seen.set(key, rowIndex);
  }

  return { valid: true };
}

function compareWorkbookStructure(before: NormalizedWorkbook, after: NormalizedWorkbook): DiffEntry[] {
  const diffs: DiffEntry[] = [];
  const beforeNames = new Set(before.sheetNames);
  const afterNames = new Set(after.sheetNames);

  for (const sheetName of after.sheetNames) {
    if (!beforeNames.has(sheetName)) {
      diffs.push({ id: `sheet-added:${sheetName}`, kind: 'sheet-added', sheetName });
    }
  }
  for (const sheetName of before.sheetNames) {
    if (!afterNames.has(sheetName)) {
      diffs.push({ id: `sheet-removed:${sheetName}`, kind: 'sheet-removed', sheetName });
    }
  }

  for (const sheetName of before.sheetNames) {
    if (!afterNames.has(sheetName)) continue;
    const beforeSheet = getSheet(before, sheetName);
    const afterSheet = getSheet(after, sheetName);
    if (!beforeSheet || !afterSheet) continue;
    const beforeHeaders = new Set(beforeSheet.headers);
    const afterHeaders = new Set(afterSheet.headers);

    for (const header of afterSheet.headers) {
      if (!beforeHeaders.has(header)) {
        diffs.push({
          id: `column-added:${sheetName}:${header}`,
          kind: 'column-added',
          sheetName,
          columnName: header,
        });
      }
    }
    for (const header of beforeSheet.headers) {
      if (!afterHeaders.has(header)) {
        diffs.push({
          id: `column-removed:${sheetName}:${header}`,
          kind: 'column-removed',
          sheetName,
          columnName: header,
        });
      }
    }
  }
  return diffs;
}

function commonColumns(beforeSheet: NormalizedSheet, afterSheet: NormalizedSheet) {
  return beforeSheet.headers
    .map((columnName, beforeColumnIndex) => ({
      columnName,
      beforeColumnIndex,
      afterColumnIndex: afterSheet.headers.indexOf(columnName),
    }))
    .filter((column) => column.afterColumnIndex >= 0);
}

function compareCellPair(params: {
  beforeSheet: NormalizedSheet;
  afterSheet: NormalizedSheet;
  beforeRowIndex: number;
  afterRowIndex: number;
  beforeColumnIndex: number;
  afterColumnIndex: number;
  columnName: string;
  rowKey?: string;
}): DiffEntry | null {
  const beforeCell = getCell(params.beforeSheet, params.beforeRowIndex, params.beforeColumnIndex);
  const afterCell = getCell(params.afterSheet, params.afterRowIndex, params.afterColumnIndex);
  const beforeFormula = beforeCell.formula;
  const afterFormula = afterCell.formula;
  const address = cellAddress(params.afterColumnIndex, params.afterRowIndex);

  if (beforeFormula !== undefined || afterFormula !== undefined) {
    if (beforeFormula === afterFormula) return null;
    return {
      id: `formula:${params.afterSheet.name}:${params.rowKey ?? params.afterRowIndex}:${params.columnName}`,
      kind: 'formula',
      sheetName: params.afterSheet.name,
      address,
      rowKey: params.rowKey,
      columnName: params.columnName,
      beforeValue: beforeCell.value,
      afterValue: afterCell.value,
      beforeFormula,
      afterFormula,
    };
  }

  if (Object.is(beforeCell.value, afterCell.value)) return null;
  return {
    id: `value:${params.afterSheet.name}:${params.rowKey ?? params.afterRowIndex}:${params.columnName}`,
    kind: 'value',
    sheetName: params.afterSheet.name,
    address,
    rowKey: params.rowKey,
    columnName: params.columnName,
    beforeValue: beforeCell.value,
    afterValue: afterCell.value,
  };
}

function compareRowsByNumber(
  beforeSheet: NormalizedSheet,
  afterSheet: NormalizedSheet,
  onProgress?: (current: number, total: number) => void,
): DiffEntry[] {
  const diffs: DiffEntry[] = [];
  const columns = commonColumns(beforeSheet, afterSheet);
  const total = Math.max(0, Math.max(beforeSheet.rowCount, afterSheet.rowCount) - 1);

  for (let offset = 0; offset < total; offset += 1) {
    const rowIndex = offset + 1;
    const beforeExists = rowIndex < beforeSheet.rowCount && rowHasData(beforeSheet, rowIndex);
    const afterExists = rowIndex < afterSheet.rowCount && rowHasData(afterSheet, rowIndex);

    if (!beforeExists && afterExists) {
      diffs.push({
        id: `row-added:${afterSheet.name}:${rowIndex}`,
        kind: 'row-added',
        sheetName: afterSheet.name,
        rowKey: `${rowIndex + 1}行目`,
      });
    } else if (beforeExists && !afterExists) {
      diffs.push({
        id: `row-removed:${beforeSheet.name}:${rowIndex}`,
        kind: 'row-removed',
        sheetName: beforeSheet.name,
        rowKey: `${rowIndex + 1}行目`,
      });
    } else if (beforeExists && afterExists) {
      for (const column of columns) {
        const diff = compareCellPair({
          beforeSheet,
          afterSheet,
          beforeRowIndex: rowIndex,
          afterRowIndex: rowIndex,
          beforeColumnIndex: column.beforeColumnIndex,
          afterColumnIndex: column.afterColumnIndex,
          columnName: column.columnName,
        });
        if (diff) diffs.push(diff);
      }
    }
    onProgress?.(offset + 1, total);
  }
  return diffs;
}

interface KeyedRow {
  rowIndex: number;
  displayKey: string;
}

function buildKeyedRows(sheet: NormalizedSheet, keyColumns: string[]): Map<string, KeyedRow> {
  const indexes = keyColumnIndexes(sheet, keyColumns);
  const rows = new Map<string, KeyedRow>();
  for (let rowIndex = 1; rowIndex < sheet.rowCount; rowIndex += 1) {
    if (!rowHasData(sheet, rowIndex)) continue;
    const row = sheet.rows[rowIndex] ?? [];
    rows.set(internalKey(row, indexes), { rowIndex, displayKey: displayKey(row, indexes) });
  }
  return rows;
}

function compareRowsByKeys(
  beforeSheet: NormalizedSheet,
  afterSheet: NormalizedSheet,
  keyColumns: string[],
  onProgress?: (current: number, total: number) => void,
): DiffEntry[] {
  const beforeValidation = validateKeyColumns(beforeSheet, keyColumns);
  if (!beforeValidation.valid) throw new Error(beforeValidation.message);
  const afterValidation = validateKeyColumns(afterSheet, keyColumns);
  if (!afterValidation.valid) throw new Error(afterValidation.message);

  const beforeRows = buildKeyedRows(beforeSheet, keyColumns);
  const afterRows = buildKeyedRows(afterSheet, keyColumns);
  const keys = [...new Set([...beforeRows.keys(), ...afterRows.keys()])];
  const columns = commonColumns(beforeSheet, afterSheet)
    .filter((column) => !keyColumns.includes(column.columnName));
  const diffs: DiffEntry[] = [];

  keys.forEach((key, index) => {
    const beforeRow = beforeRows.get(key);
    const afterRow = afterRows.get(key);
    const rowKey = afterRow?.displayKey ?? beforeRow?.displayKey ?? '';

    if (!beforeRow && afterRow) {
      diffs.push({ id: `row-added:${afterSheet.name}:${key}`, kind: 'row-added', sheetName: afterSheet.name, rowKey });
    } else if (beforeRow && !afterRow) {
      diffs.push({ id: `row-removed:${beforeSheet.name}:${key}`, kind: 'row-removed', sheetName: beforeSheet.name, rowKey });
    } else if (beforeRow && afterRow) {
      for (const column of columns) {
        const diff = compareCellPair({
          beforeSheet,
          afterSheet,
          beforeRowIndex: beforeRow.rowIndex,
          afterRowIndex: afterRow.rowIndex,
          beforeColumnIndex: column.beforeColumnIndex,
          afterColumnIndex: column.afterColumnIndex,
          columnName: column.columnName,
          rowKey,
        });
        if (diff) diffs.push(diff);
      }
    }
    onProgress?.(index + 1, keys.length);
  });
  return diffs;
}

function buildDiffResult(diffs: DiffEntry[], structuralDiffs: DiffEntry[]): DiffResult {
  return {
    diffs,
    structuralDiffs,
    summary: {
      changed: diffs.filter((diff) => diff.kind === 'value').length,
      added: diffs.filter((diff) => diff.kind === 'row-added').length,
      removed: diffs.filter((diff) => diff.kind === 'row-removed').length,
      formulaChanged: diffs.filter((diff) => diff.kind === 'formula').length,
      structuralChanged: structuralDiffs.length,
    },
  };
}

export function compareWorkbooks(
  before: NormalizedWorkbook,
  after: NormalizedWorkbook,
  options: CompareOptions,
  onProgress?: (current: number, total: number) => void,
): DiffResult {
  const structuralDiffs = compareWorkbookStructure(before, after);
  const beforeSheet = getSheet(before, options.sheetName);
  const afterSheet = getSheet(after, options.sheetName);
  if (!beforeSheet || !afterSheet) return buildDiffResult([], structuralDiffs);

  const diffs = options.mode === 'key-columns'
    ? compareRowsByKeys(beforeSheet, afterSheet, options.keyColumns, onProgress)
    : compareRowsByNumber(beforeSheet, afterSheet, onProgress);
  return buildDiffResult(diffs, structuralDiffs);
}
