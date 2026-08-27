import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';
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
