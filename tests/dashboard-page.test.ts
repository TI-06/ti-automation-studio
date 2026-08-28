import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../src/pages/tools/dashboard-builder.astro', import.meta.url);
const cssUrl = new URL('../src/styles/dashboard-builder.css', import.meta.url);

describe('Excel・CSVダッシュボード作成ページ', () => {
  it('ファイルから結果作成・保存まで日本語で完結する画面を持つ', () => {
    expect(existsSync(pageUrl)).toBe(true);
    const source = existsSync(pageUrl) ? readFileSync(pageUrl, 'utf-8') : '';

    expect(source).toContain('Excel・CSVからダッシュボードを作成します');
    expect(source).toContain('ファイルは外部サーバーへ送信されません');
    expect(source).toContain('data-dashboard-app');
    expect(source).toContain('サンプルデータで試す');
    expect(source).toContain('グラフを追加');
    expect(source).toContain('すべて解除');
    expect(source).toContain('ダッシュボード');
    expect(source).toContain('元データ');
    expect(source).toContain('画像で保存');
    expect(source).toContain('PDFで保存');
    expect(source).toContain('Excelで保存');
    expect(source).toContain('設定を保存');
    expect(source).toContain('20MB');
    expect(source).toContain('100,000行');
    expect(source).toContain('50,000行');
  });

  it('列型変更・フィルター・ウィジェット編集・設定読込のUI契約を持つ', () => {
    const source = existsSync(pageUrl) ? readFileSync(pageUrl, 'utf-8') : '';
    expect(source).toContain('data-dashboard-columns');
    expect(source).toContain('data-dashboard-filters');
    expect(source).toContain('data-filter-reset');
    expect(source).toContain('data-widget-add');
    expect(source).toContain('data-widget-dialog');
    expect(source).toContain('data-dashboard-grid');
    expect(source).toContain('data-config-import');
    expect(source).toContain('data-dashboard-data-table');
  });

  it('WebApplicationとパンくずの構造化データ、検索向け説明を持つ', () => {
    const source = existsSync(pageUrl) ? readFileSync(pageUrl, 'utf-8') : '';
    expect(source).toContain("'@type': 'WebApplication'");
    expect(source).toContain("'@type': 'BreadcrumbList'");
    expect(source).toContain('向いているデータ');
    expect(source).toContain('自動生成の考え方');
    expect(source).toContain('列の種類');
    expect(source).toContain('設定ファイル');
    expect(source).toContain('安全性');
    expect(source).toContain('よくある質問');
  });

  it('専用CSSで12列レイアウト・3サイズ・印刷レイアウトを定義する', () => {
    expect(existsSync(cssUrl)).toBe(true);
    const css = existsSync(cssUrl) ? readFileSync(cssUrl, 'utf-8') : '';
    expect(css).toContain('grid-template-columns: repeat(12');
    expect(css).toContain('[data-size="small"]');
    expect(css).toContain('[data-size="medium"]');
    expect(css).toContain('[data-size="large"]');
    expect(css).toContain('@media print');
    expect(css).toContain('landscape');
  });
});
