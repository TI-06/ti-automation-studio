import { describe, expect, it } from 'vitest';
import { tools } from '../src/data/tools';

describe('公開ツール定義', () => {
  it('Excel差分比較ツールを登録不要の公開ツールとして掲載する', () => {
    const excelDiff = tools.find((tool) => tool.slug === 'excel-diff');

    expect(excelDiff).toBeTruthy();
    expect(excelDiff?.published).toBe(true);
    expect(excelDiff?.href).toBe('/tools/excel-diff');
    expect(excelDiff?.formats).toContain('XLSX');
    expect(excelDiff?.processing).toBe('ブラウザ内処理');
    expect(excelDiff?.features.length).toBeGreaterThanOrEqual(3);
  });
});
