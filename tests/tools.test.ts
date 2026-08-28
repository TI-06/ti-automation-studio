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

  it('データ整理ツールを登録不要の公開ツールとして掲載する', () => {
    const cleaner = tools.find((tool) => tool.slug === 'data-cleaner');

    expect(cleaner).toBeTruthy();
    expect(cleaner?.published).toBe(true);
    expect(cleaner?.href).toBe('/tools/data-cleaner');
    expect(cleaner?.formats).toEqual(expect.arrayContaining(['CSV', 'XLSX', 'XLS']));
    expect(cleaner?.processing).toBe('ブラウザ内処理');
    expect(cleaner?.features.length).toBeGreaterThanOrEqual(3);
  });

  it('ダッシュボード作成ツールを公開する', () => {
    const tool = tools.find((item) => item.slug === 'dashboard-builder');

    expect(tool).toBeTruthy();
    expect(tool?.published).toBe(true);
    expect(tool?.href).toBe('/tools/dashboard-builder');
    expect(tool?.formats).toEqual(expect.arrayContaining(['CSV', 'XLSX', 'XLS']));
    expect(tool?.processing).toBe('ブラウザ内処理');
    expect(tool?.features.length).toBeGreaterThanOrEqual(3);
  });

  it('業務自動化診断を登録不要の公開ツールとして掲載する', () => {
    const tool = tools.find((item) => item.slug === 'automation-diagnosis');

    expect(tool).toBeTruthy();
    expect(tool?.published).toBe(true);
    expect(tool?.href).toBe('/tools/automation-diagnosis');
    expect(tool?.formats).toEqual([]);
    expect(tool?.processing).toBe('ブラウザ内処理');
    expect(tool?.features.length).toBeGreaterThanOrEqual(3);
  });
});
