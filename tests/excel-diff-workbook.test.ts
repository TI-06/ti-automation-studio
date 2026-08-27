import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';
import { exportDiffCsv, exportDiffWorkbook } from '../src/lib/tools/excel-diff/export';
import { createSampleFiles } from '../src/lib/tools/excel-diff/sample';
import type { DiffResult } from '../src/lib/tools/excel-diff/types';
import { parseWorkbook, validateExcelFile } from '../src/lib/tools/excel-diff/workbook';

describe('Excel読込', () => {
  it('20MB超を処理前に拒否する', () => {
    expect(validateExcelFile({ name: 'big.xlsx', size: 20 * 1024 * 1024 + 1 })).toEqual({
      valid: false,
      message: 'ファイルサイズが20MBを超えています。20MB以下のExcelファイルを選択してください。',
    });
  });

  it('値と数式を別に保持する', () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['商品コード', '数量', '合計'],
      ['A001', 2, 200],
    ]);
    worksheet.C2 = { t: 'n', v: 200, f: 'B2*100' };
    XLSX.utils.book_append_sheet(workbook, worksheet, '売上');

    const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    const parsed = parseWorkbook(bytes, 'before.xlsx');

    expect(parsed.sheets[0].cells.C2.formula).toBe('B2*100');
    expect(parsed.sheets[0].cells.C2.value).toBe(200);
  });

  it('対応外の拡張子を日本語で拒否する', () => {
    expect(validateExcelFile({ name: 'data.csv', size: 100 })).toEqual({
      valid: false,
      message: '対応している形式は .xlsx と .xls です。',
    });
  });
});

describe('比較結果の保存', () => {
  const result: DiffResult = {
    diffs: [
      {
        id: 'value:売上:1:金額',
        kind: 'value',
        sheetName: '売上',
        address: 'B2',
        columnName: '金額',
        beforeValue: 100,
        afterValue: 120,
      },
    ],
    structuralDiffs: [],
    summary: { changed: 1, added: 0, removed: 0, formulaChanged: 0, structuralChanged: 0 },
  };

  it('差分結果Excelに比較概要と変更一覧を作る', async () => {
    const blob = exportDiffWorkbook(result, {
      beforeFileName: 'before.xlsx',
      afterFileName: 'after.xlsx',
      comparedAt: '2026-08-27T22:00:00+09:00',
      modeLabel: '行番号で比較',
      keyColumns: [],
    });
    const workbook = XLSX.read(await blob.arrayBuffer(), { type: 'array' });
    expect(workbook.SheetNames).toContain('比較概要');
    expect(workbook.SheetNames).toContain('変更一覧');
    expect(workbook.SheetNames).toContain('構造変更一覧');
  });

  it('CSVをUTF-8 BOM付きで保存する', async () => {
    const blob = exportDiffCsv(result.diffs);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  });
});

describe('サンプルファイル', () => {
  it('変更前と変更後のExcelをブラウザ内で生成する', async () => {
    const { before, after } = createSampleFiles();
    expect(before.name).toBe('変更前サンプル.xlsx');
    expect(after.name).toBe('変更後サンプル.xlsx');
    const beforeWorkbook = parseWorkbook(await before.arrayBuffer(), before.name);
    const afterWorkbook = parseWorkbook(await after.arrayBuffer(), after.name);
    expect(beforeWorkbook.sheetNames).toContain('売上');
    expect(afterWorkbook.sheetNames).toContain('売上');
    expect(afterWorkbook.sheets[0].rowCount).toBeGreaterThan(beforeWorkbook.sheets[0].rowCount - 2);
  });
});
