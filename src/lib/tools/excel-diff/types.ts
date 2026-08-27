export type CellPrimitive = string | number | boolean | null;

export interface NormalizedCell {
  value: CellPrimitive;
  formula?: string;
}

export interface NormalizedSheet {
  name: string;
  rowCount: number;
  columnCount: number;
  headers: string[];
  rows: CellPrimitive[][];
  cells: Record<string, NormalizedCell>;
  formulas: Record<string, string>;
}

export interface NormalizedWorkbook {
  fileName: string;
  sheetNames: string[];
  sheets: NormalizedSheet[];
}

export type DiffKind =
  | 'value'
  | 'formula'
  | 'row-added'
  | 'row-removed'
  | 'column-added'
  | 'column-removed'
  | 'sheet-added'
  | 'sheet-removed';

export interface CompareOptions {
  mode: 'row-number' | 'key-columns';
  sheetName: string;
  keyColumns: string[];
}

export interface DiffEntry {
  id: string;
  kind: DiffKind;
  sheetName: string;
  address?: string;
  rowKey?: string;
  columnName?: string;
  beforeValue?: CellPrimitive;
  afterValue?: CellPrimitive;
  beforeFormula?: string;
  afterFormula?: string;
}

export interface DiffResult {
  diffs: DiffEntry[];
  structuralDiffs: DiffEntry[];
  summary: {
    changed: number;
    added: number;
    removed: number;
    formulaChanged: number;
    structuralChanged: number;
  };
}
