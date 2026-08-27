export type CleanerCellValue = string | number | boolean | null;

export interface CleanerColumn {
  id: string;
  name: string;
  index: number;
}

export interface CleanerDataset {
  sheetName: string;
  columns: CleanerColumn[];
  rows: CleanerCellValue[][];
}

export interface CleanerFileMeta {
  fileName: string;
  format: 'csv' | 'xlsx' | 'xls';
  encoding?: 'utf-8' | 'shift_jis' | 'unknown';
  sheetNames: string[];
  selectedSheet: string;
  rowCount: number;
  columnCount: number;
  large: boolean;
}

export type DiagnosticCategory =
  | 'duplicate'
  | 'trim-space'
  | 'blank'
  | 'width-mixed'
  | 'date-mixed'
  | 'number-mixed'
  | 'line-break'
  | 'notation-variant';

export interface DiagnosticExample {
  before: string;
  after?: string;
}

export interface DiagnosticIssue {
  id: string;
  category: DiagnosticCategory;
  columnId?: string;
  rowIndexes: number[];
  count: number;
  examples: DiagnosticExample[];
  message: string;
}

export type CleanerDataKind = 'text' | 'number' | 'date' | 'mixed' | 'blank';

export interface ColumnDiagnostic {
  columnId: string;
  columnName: string;
  dataCount: number;
  blankCount: number;
  duplicateCount: number;
  issueCount: number;
  inferredKind: CleanerDataKind;
}

export interface DiagnosticResult {
  issues: DiagnosticIssue[];
  columns: ColumnDiagnostic[];
}

export interface CleanerChange {
  id: string;
  rowIndex: number;
  columnId: string;
  before: CleanerCellValue;
  after: CleanerCellValue;
  reason: string;
  excluded: boolean;
}

export interface CleanerHistoryEntry {
  id: string;
  label: string;
  changes: CleanerChange[];
  beforeDataset: CleanerDataset;
  deletedRows?: number[];
}

export interface DuplicateGroup {
  id: string;
  keyValues: CleanerCellValue[];
  rowIndexes: number[];
}

export type CleanerCsvEncoding = 'utf-8' | 'shift_jis';

export interface CleaningSummary {
  originalRows: number;
  cleanedRows: number;
  changedCells: number;
  deletedRows: number;
}
