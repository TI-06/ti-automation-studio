import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../src/pages/tools/automation-diagnosis.astro', import.meta.url);
const cssUrl = new URL('../src/styles/automation-diagnosis.css', import.meta.url);

describe('業務自動化診断ページ', () => {
  it('6ステップの日本語ウィザードと結果保存導線を持つ', () => {
    expect(existsSync(pageUrl)).toBe(true);
    const source = existsSync(pageUrl) ? readFileSync(pageUrl, 'utf-8') : '';
    expect(source).toContain('業務自動化診断・工数削減シミュレーター');
    expect(source).toContain('data-diagnosis-app');
    expect(source).toContain('1 / 6');
    expect(source).toContain('前へ');
    expect(source).toContain('次へ');
    expect(source).toContain('例を使って試す');
    expect(source).toContain('自動化適性');
    expect(source).toContain('年間作業時間');
    expect(source).toContain('削減シミュレーション');
    expect(source).toContain('診断結果をPDFで保存');
  });

  it('説明可能なルール診断とプライバシーを明示する', () => {
    const source = existsSync(pageUrl) ? readFileSync(pageUrl, 'utf-8') : '';
    expect(source).toContain('あらかじめ定めた判定ルール');
    expect(source).toContain('入力内容は外部サーバーへ送信されません');
    expect(source).toContain('AI');
    expect(source).toContain('保証');
  });

  it('結果レポートに必要な領域を持つ', () => {
    const source = existsSync(pageUrl) ? readFileSync(pageUrl, 'utf-8') : '';
    expect(source).toContain('data-diagnosis-report');
    expect(source).toContain('data-result-suitability');
    expect(source).toContain('data-result-annual-hours');
    expect(source).toContain('data-result-positive');
    expect(source).toContain('data-result-cautions');
    expect(source).toContain('data-result-automatable');
    expect(source).toContain('data-result-human');
    expect(source).toContain('data-result-technologies');
    expect(source).toContain('data-result-saved-hours');
    expect(source).toContain('data-print-ignore');
  });

  it('結果後の相談CTAを印刷対象外として配置する', () => {
    const source = existsSync(pageUrl) ? readFileSync(pageUrl, 'utf-8') : '';
    expect(source).toContain('<ToolResultCTA source="automation-diagnosis" printIgnore');
  });

  it('SEO説明、FAQ、関連サービス導線を持つ', () => {
    const source = existsSync(pageUrl) ? readFileSync(pageUrl, 'utf-8') : '';
    expect(source).toContain("'@type': 'WebApplication'");
    expect(source).toContain("'@type': 'BreadcrumbList'");
    expect(source).toContain('自動化に向いている業務');
    expect(source).toContain('自動化しにくい業務');
    expect(source).toContain('工数削減シミュレーションの計算方法');
    expect(source).toContain('よくある質問');
    expect(source).toContain('/services');
    expect(source).toContain('/works');
    expect(source).toContain('/contact');
  });

  it('専用CSSでA4縦印刷レイアウトを持つ', () => {
    expect(existsSync(cssUrl)).toBe(true);
    const css = existsSync(cssUrl) ? readFileSync(cssUrl, 'utf-8') : '';
    expect(css).toContain('@media print');
    expect(css).toContain('@page');
    expect(css).toContain('A4 portrait');
    expect(css).toContain('[data-print-ignore]');
  });
});
