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
