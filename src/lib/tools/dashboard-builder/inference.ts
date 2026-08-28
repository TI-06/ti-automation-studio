import { parseDateCandidate, parseNumericCandidate } from '../data-cleaner/diagnostics';
import type {
  DashboardCellValue,
  DashboardColumn,
  DashboardColumnRole,
  DashboardDataset,
} from './types';

const ID_NAME_PATTERN = /(^|[_\s-])(id|code|no)([_\s-]|$)|コード|番号|sku|商品id|社員id/i;

function isBlank(value: DashboardCellValue): boolean {
  return value == null || (typeof value === 'string' && value.trim() === '');
}

function displayValue(value: DashboardCellValue): string {
  if (value == null) return '';
  return String(value);
}

function hasIdNameHint(name: string): boolean {
  return ID_NAME_PATTERN.test(name.trim());
}

function hasLeadingZeroCode(values: DashboardCellValue[]): boolean {
  return values.some((value) => typeof value === 'string' && /^\s*0\d+\s*$/.test(value));
}

function confidenceFor(role: DashboardColumnRole, ratio = 1): number {
  const base: Record<DashboardColumnRole, number> = {
    date: 0.92,
    number: 0.9,
    category: 0.84,
    text: 0.68,
    id: 0.96,
  };
  return Math.max(0, Math.min(1, base[role] * Math.max(0.7, Math.min(1, ratio))));
}

function inferRole(name: string, values: DashboardCellValue[]): { role: DashboardColumnRole; confidence: number } {
  const nonBlank = values.filter((value) => !isBlank(value));
  if (nonBlank.length === 0) return { role: 'text', confidence: 0.5 };

  const idHint = hasIdNameHint(name);
  const leadingZero = hasLeadingZeroCode(nonBlank);
  if (idHint || leadingZero) {
    return { role: 'id', confidence: idHint && leadingZero ? 0.99 : 0.94 };
  }

  const dateCount = nonBlank.filter((value) => parseDateCandidate(value)).length;
  const dateRatio = dateCount / nonBlank.length;
  if (dateRatio >= 0.9) return { role: 'date', confidence: confidenceFor('date', dateRatio) };

  const numericCount = nonBlank.filter((value) => parseNumericCandidate(value)).length;
  const numericRatio = numericCount / nonBlank.length;
  if (numericRatio >= 0.9) return { role: 'number', confidence: confidenceFor('number', numericRatio) };

  const distinct = new Set(nonBlank.map((value) => displayValue(value).trim())).size;
  const categoryThreshold = Math.max(2, Math.min(50, Math.ceil(nonBlank.length * 0.2)));
  if (distinct <= categoryThreshold) {
    const ratio = 1 - (distinct / Math.max(nonBlank.length, 1)) * 0.4;
    return { role: 'category', confidence: confidenceFor('category', ratio) };
  }

  return { role: 'text', confidence: confidenceFor('text') };
}

export function inferDashboardColumns(dataset: DashboardDataset): DashboardColumn[] {
  return dataset.columns.map((column) => {
    const values = dataset.rows.map((row) => row[column.index] ?? null);
    const inferred = inferRole(column.name, values);
    const sampleValues = [...new Set(values
      .filter((value) => !isBlank(value))
      .map((value) => displayValue(value).trim())
      .filter(Boolean))]
      .slice(0, 5);

    return {
      ...column,
      role: inferred.role,
      confidence: inferred.confidence,
      sampleValues,
    };
  });
}

export function overrideDashboardColumnRole(
  columns: DashboardColumn[],
  columnId: string,
  role: DashboardColumnRole,
): DashboardColumn[] {
  return columns.map((column) => column.id === columnId ? { ...column, role, confidence: 1 } : { ...column });
}
