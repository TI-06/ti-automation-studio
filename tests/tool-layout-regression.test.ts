import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf-8');

const sharedCss = read('src/styles/tool-app.css');
const diagnosisCss = read('src/styles/automation-diagnosis.css');
const cleanerCss = read('src/styles/data-cleaner.css');
const dashboardCss = read('src/styles/dashboard-builder.css');
const toolsIndex = read('src/pages/tools/index.astro');

describe('無料ツールのレイアウト回帰', () => {
  it('ツール本体は通常ページより広い作業領域を確保する', () => {
    expect(sharedCss).toContain('.tool-page > .container');
    expect(sharedCss).toContain('1380px');
    expect(sharedCss).toContain('grid-template-columns: 240px minmax(0, 1fr) 280px');
  });

  it('中間幅では右詳細を下へ移し、960px以下では1カラムにする', () => {
    expect(sharedCss).toContain('@media (max-width: 1240px)');
    expect(sharedCss).toContain('grid-template-columns: 220px minmax(0, 1fr)');
    expect(sharedCss).toContain('.tool-inspector { grid-column: 1 / -1');
    expect(sharedCss).toContain('@media (max-width: 960px)');
    expect(sharedCss).toContain('.tool-app-grid { grid-template-columns: 1fr; min-height: 0; }');
  });

  it('checkboxとradioを固定サイズにして巨大化を防ぐ', () => {
    expect(sharedCss).toContain('.tool-choice input[type="checkbox"]');
    expect(sharedCss).toContain('.tool-choice input[type="radio"]');
    expect(sharedCss).toContain('flex: 0 0 16px');
    expect(sharedCss).toContain('width: 16px');
    expect(sharedCss).toContain('height: 16px');
    expect(diagnosisCss).toContain('.diagnosis-choice input[type="checkbox"]');
    expect(diagnosisCss).toContain('.diagnosis-choice input[type="radio"]');
  });

  it('長いファイル名・セル文字・ボタン文言がレイアウトを押し広げない', () => {
    expect(sharedCss).toContain('text-overflow: ellipsis');
    expect(sharedCss).toContain('overflow-wrap: anywhere');
    expect(sharedCss).toContain('white-space: pre-wrap');
    expect(sharedCss).toContain('.tool-button');
    expect(sharedCss).toContain('white-space: normal');
  });

  it('スマホ入力欄は16pxで意図しないズームと極小表示を避ける', () => {
    expect(sharedCss).toContain('.tool-file-zone input[type="file"] { font-size: 16px; }');
    expect(diagnosisCss).toContain('.diagnosis-question select { font-size: 16px; }');
    expect(dashboardCss).toContain('.dashboard-source-settings select { font-size: 16px; }');
  });

  it('Excel差分の5集計カードは中間幅3列・狭幅2列へ切り替える', () => {
    expect(sharedCss).toContain('grid-template-columns: repeat(5, minmax(110px, 1fr))');
    expect(sharedCss).toContain('grid-template-columns: repeat(3, minmax(110px, 1fr))');
    expect(sharedCss).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))');
  });

  it('業務自動化診断の選択カードをコンパクトにし段階的に列数を落とす', () => {
    expect(diagnosisCss).toContain('min-height: 56px');
    expect(diagnosisCss).toContain('padding: 10px 11px');
    expect(diagnosisCss).toContain('@media (max-width: 1180px)');
    expect(diagnosisCss).toContain('.diagnosis-choice-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }');
    expect(diagnosisCss).toContain('@media (max-width: 700px)');
  });

  it('データ整理は左右ペインを縮め、中間幅で詳細を下へ送る', () => {
    expect(cleanerCss).toContain('grid-template-columns: 240px minmax(0, 1fr) 280px');
    expect(cleanerCss).toContain('@media (max-width: 1240px)');
    expect(cleanerCss).toContain('.tool-cleaner-grid { grid-template-columns: 220px minmax(0, 1fr); }');
    expect(cleanerCss).toContain('@media (max-width: 960px)');
    expect(cleanerCss).toContain('.tool-cleaner-grid { grid-template-columns: 1fr; }');
  });

  it('ダッシュボードは1180pxでツールバーとフィルターを縮退する', () => {
    expect(dashboardCss).toContain('@media (max-width: 1180px)');
    expect(dashboardCss).toContain('.dashboard-filter-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }');
    expect(dashboardCss).toContain('.dashboard-toolbar { position: static');
    expect(dashboardCss).toContain('@media (max-width: 820px)');
    expect(dashboardCss).toContain('.dashboard-filter-grid { grid-template-columns: 1fr; }');
  });

  it('無料ツール一覧のプレビューに8〜9px相当の極小文字を残さない', () => {
    expect(toolsIndex).not.toMatch(/font-size:\s*\.5\drem/);
    expect(toolsIndex).toContain('.preview-metrics span');
    expect(toolsIndex).toContain('font-size: .64rem');
  });
});
