import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../src/pages/tools/excel-diff.astro', import.meta.url);
const controllerUrl = new URL('../src/scripts/tools/excel-diff.ts', import.meta.url);

describe('Excel差分比較ページ', () => {
  it('その場で使えるSEOランディングページを持つ', () => {
    expect(existsSync(pageUrl)).toBe(true);
    const source = existsSync(pageUrl) ? readFileSync(pageUrl, 'utf-8') : '';

    expect(source).toContain('2つのExcelファイルを比較します');
    expect(source).toContain('ファイルは外部サーバーへ送信されません');
    expect(source).toContain('data-file-before');
    expect(source).toContain('data-file-after');
    expect(source).toContain('data-diff-table');
    expect(source).toContain('data-diff-inspector');
    expect(source).toContain('差分結果をExcelで保存');
    expect(source).toContain("'@type': 'WebApplication'");
    expect(source).toContain("'@type': 'BreadcrumbList'");
    expect(source).toContain('20MB');
    expect(source).toContain('100,000行');
    expect(source).toContain('50,000行');
  });

  it('比較・絞り込み・詳細・保存をブラウザ内で制御する', () => {
    expect(existsSync(controllerUrl)).toBe(true);
    const source = existsSync(controllerUrl) ? readFileSync(controllerUrl, 'utf-8') : '';

    expect(source).toContain("new Worker(new URL('../../workers/excel-diff.worker.ts', import.meta.url)");
    expect(source).toContain('validateExcelFile');
    expect(source).toContain('createSampleFiles');
    expect(source).toContain('exportDiffWorkbook');
    expect(source).toContain('exportDiffCsv');
    expect(source).toContain('URL.createObjectURL');
    expect(source).toContain('data-inspector-card');
  });
});
