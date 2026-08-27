import { describe, expect, it } from 'vitest';
import { compareWorkbooks, validateKeyColumns } from '../src/lib/tools/excel-diff/compare';
import type { CellPrimitive, NormalizedWorkbook } from '../src/lib/tools/excel-diff/types';

function makeWorkbook(
  sheetName: string,
  rows: CellPrimitive[][],
  formulas: Record<string, string> = {},
): NormalizedWorkbook {
  const headers = (rows[0] ?? []).map(String);
  const cells: Record<string, { value: CellPrimitive; formula?: string }> = {};

  rows.forEach((row, rowIndex) => row.forEach((value, columnIndex) => {
    const address = `${String.fromCharCode(65 + columnIndex)}${rowIndex + 1}`;
    const formula = formulas[address];
    cells[address] = formula ? { value, formula } : { value };
  }));

  return {
    fileName: 'fixture.xlsx',
    sheetNames: [sheetName],
    sheets: [{
      name: sheetName,
      rowCount: rows.length,
      columnCount: headers.length,
      headers,
      rows,
      cells,
      formulas,
    }],
  };
}

describe('Excel差分比較', () => {
  it('値変更と数式変更を別カテゴリで返す', () => {
    const before = makeWorkbook(
      'Sheet1',
      [['コード', '数量', '合計'], ['A001', 2, 200]],
      { C2: 'B2*100' },
    );
    const after = makeWorkbook(
      'Sheet1',
      [['コード', '数量', '合計'], ['A001', 3, 300]],
      { C2: 'B2*120' },
    );

    const result = compareWorkbooks(before, after, {
      mode: 'row-number',
      sheetName: 'Sheet1',
      keyColumns: [],
    });

    expect(result.summary.changed).toBe(1);
    expect(result.summary.formulaChanged).toBe(1);
    expect(result.diffs.some((item) => item.kind === 'value' && item.address === 'B2')).toBe(true);
    expect(result.diffs.some((item) => item.kind === 'formula' && item.address === 'C2')).toBe(true);
  });

  it('途中行追加をキー列で正しく追加扱いする', () => {
    const before = makeWorkbook('売上', [
      ['商品コード', '商品名', '価格'],
      ['A001', '商品A', 100],
      ['A002', '商品B', 200],
    ]);
    const after = makeWorkbook('売上', [
      ['商品コード', '商品名', '価格'],
      ['A001', '商品A', 100],
      ['A999', '商品X', 150],
      ['A002', '商品B', 200],
    ]);

    const result = compareWorkbooks(before, after, {
      mode: 'key-columns',
      sheetName: '売上',
      keyColumns: ['商品コード'],
    });

    expect(result.summary.added).toBe(1);
    expect(result.summary.changed).toBe(0);
    expect(result.diffs.some((item) => item.kind === 'row-added' && item.rowKey === 'A999')).toBe(true);
  });

  it('追加列を構造変更として返す', () => {
    const before = makeWorkbook('売上', [['コード', '金額'], ['A001', 100]]);
    const after = makeWorkbook('売上', [['コード', '金額', '備考'], ['A001', 100, '確認済']]);

    const result = compareWorkbooks(before, after, {
      mode: 'row-number',
      sheetName: '売上',
      keyColumns: [],
    });

    expect(result.structuralDiffs.some(
      (item) => item.kind === 'column-added' && item.columnName === '備考',
    )).toBe(true);
  });

  it('行を特定する列の重複を比較前に拒否する', () => {
    const workbook = makeWorkbook('売上', [
      ['商品コード', '金額'],
      ['A001', 100],
      ['A001', 120],
    ]);

    const validation = validateKeyColumns(workbook.sheets[0], ['商品コード']);
    expect(validation.valid).toBe(false);
    if (!validation.valid) expect(validation.message).toContain('重複');
  });

  it('行を特定する列の空欄を比較前に拒否する', () => {
    const workbook = makeWorkbook('売上', [
      ['商品コード', '金額'],
      [null, 100],
    ]);

    const validation = validateKeyColumns(workbook.sheets[0], ['商品コード']);
    expect(validation.valid).toBe(false);
    if (!validation.valid) expect(validation.message).toContain('空欄');
  });
});
