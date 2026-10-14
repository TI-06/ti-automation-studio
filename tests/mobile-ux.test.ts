import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string): string => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const layout = read('src/layouts/BaseLayout.astro');
const globalCss = read('src/styles/global.css');
const toolCss = read('src/styles/tool-app.css');
const diff = read('src/pages/tools/excel-diff.astro');
const cleaner = read('src/pages/tools/data-cleaner.astro');
const diagnosis = read('src/styles/automation-diagnosis.css');
const dashboard = read('src/pages/tools/dashboard-builder.astro');
const dashboardCss = read('src/styles/dashboard-builder.css');
const mobileScript = read('src/scripts/tools/mobile-view.ts');
const excelLogic = read('src/scripts/tools/excel-diff.ts');
const cleanerLogic = read('src/scripts/tools/data-cleaner.ts');
const dashboardLogic = read('src/scripts/tools/mobile-dashboard-export.ts');

describe('スマホのサイトナビゲーション', () => {
  it('スマホメニューに全ての主要導線と相談を表示する', () => {
    expect(layout).toContain('<details class="mobile-menu"');
    expect(layout).toContain('aria-label="スマホ用メニュー"');
    for (const url of ['/services','/works','/price','/tools','/solutions','/about','/contact']) {
      expect(layout).toContain(`href="${url}"`);
    }
    expect(layout).toContain('class="brand-compact"');
    expect(layout).toContain('@media (max-width: 860px)');
  });
  it('タップ範囲・キーボード・画面サイズの対応を持つ', () => {
    expect(layout).toContain('min-height: 44px');
    expect(layout).toContain('min-height: 48px');
    expect(layout).toContain("event.key === 'Escape'");
    expect(layout).toContain("!mobileMenu.contains(event.target)");
    expect(layout).toContain("min-width: 861px");
    expect(globalCss).toContain('.field input, .field select, .field textarea { font-size: 16px; }');
  });
});

describe('Excel・データ整理ツールのスマホUI', () => {
  it('設定・結果・詳細はPCで維持しスマホだけ切り替える', () => {
    for (const source of [diff, cleaner]) {
      expect(source).toContain('data-tool-mobile-nav');
      expect(source).toContain('data-mobile-panel="setup"');
      expect(source).toContain('data-mobile-panel="result"');
      expect(source).toContain('data-mobile-panel="detail"');
    }
    expect(toolCss).toContain('.tool-mobile-view-nav { display: none; }');
    expect(toolCss).toContain('@media (max-width: 960px)');
    expect(toolCss).toContain('[data-mobile-active="setup"]');
    expect(toolCss).toContain('[data-mobile-active="result"]');
    expect(toolCss).toContain('[data-mobile-active="detail"]');
    expect(mobileScript).toContain('aria-pressed');
  });
  it('結果完成時は結果画面、リセット時は設定へ戻す', () => {
    for (const logic of [excelLogic, cleanerLogic]) {
      expect(logic).toContain("new Event('tool:show-results')");
      expect(logic).toContain("new Event('tool:reset-view')");
    }
    expect(mobileScript).toContain("root.addEventListener('tool:show-results'");
    expect(mobileScript).toContain("root.addEventListener('tool:reset-view'");
    expect(mobileScript).toContain('scrollIntoView');
  });
  it('結果の行・列の選択で詳細を開ける', () => {
    expect(mobileScript).toContain('[data-diff-body] tr');
    expect(mobileScript).toContain('[data-data-head] button');
  });
});

describe('ダッシュボードと診断のモバイル操作', () => {
  it('ダッシュボードではグラフ追加と保存・出力を分ける', () => {
    expect(dashboard).toContain('data-dashboard-export-menu');
    expect(dashboard).toContain('<summary>保存・出力');
    for (const op of ['data-widget-add','data-export-image','data-export-pdf','data-export-excel','data-export-config']) {
      expect(dashboard).toContain(op);
    }
    expect(dashboardCss).toContain('.dashboard-export-actions');
    expect(dashboardLogic).toContain("max-width: 820px");
    expect(dashboardLogic).toContain('dashboardExport.open = !narrow.matches');
  });
  it('小型画面で文字や選択肢が小さすぎない', () => {
    expect(diagnosis).toContain('.diagnosis-choice { min-height: 52px');
    expect(diagnosis).toContain('font-size: .875rem');
    expect(toolCss).toContain('.tool-button { min-height: 44px; font-size: .875rem; }');
  });
});
