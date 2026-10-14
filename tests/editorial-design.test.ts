import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (p: string): string => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const home = read('src/pages/index.astro');
const global = read('src/styles/global.css');
const services = read('src/styles/services.css');
const portfolio = read('src/styles/portfolio.css');
const about = read('src/styles/about-rework.css');
const price = read('src/pages/price.astro');
const workDetail = read('src/pages/works/[slug].astro');
const tools = read('src/pages/tools/index.astro');
const visualAudit = read('scripts/visual-audit.mjs');

describe('desktop editorial design refinement', () => {
  it('6工程をSVG画像ではなく、読みやすい3フェーズのHTMLリストとして表示する', () => {
    expect(home).toContain('const processPhases = [');
    expect(home).toContain('steps: process.slice(0, 2)');
    expect(home).toContain('steps: process.slice(2, 4)');
    expect(home).toContain('steps: process.slice(4, 6)');
    expect(home).toContain('class="process-phase-grid"');
    expect(home).toContain('class="process-phase-card"');
    expect(home).toContain('class="process-phase-steps"');
    expect(home).toContain('仕様が決まっていなくても相談できます。');
    expect(home).not.toContain('/images/process-flow-desktop.svg');
    expect(home).not.toContain('class="process-accessible"');
  });
  it('幅860以下は縦レイアウトへ切り替え、視認性と操作を確保する', () => {
    expect(home).toContain('.process-phase-grid { grid-template-columns: 1fr;');
    expect(home).toContain('.process-reassurance');
    expect(home).toContain('@media (max-width: 860px)');
    expect(global).toContain('prefers-reduced-motion: reduce');
  });
  it('共通デザインの枠線・角丸・コントラストを一元化する', () => {
    expect(global).toContain('--radius-card: 14px');
    expect(global).toContain('--radius-control: 9px');
    expect(global).toContain('--muted-strong: #cac8c0');
    expect(global).toContain('--soft: #9a9c96');
    expect(global).toContain('--line: var(--border)');
    expect(price).not.toContain('var(--line)');
    expect(workDetail).not.toContain('var(--line)');
  });
  it('サービス5件は大型1件とコンパクト4件に分ける', () => {
    expect(services).toContain('.service-index-card:first-child');
    expect(services).toContain('grid-column: 1 / -1');
    expect(services).toContain('grid-template-columns: repeat(2, minmax(0,1fr))');
    expect(services).toContain('@media (max-width: 640px)');
  });
  it('実績一覧は代表1件の視覚的優先順位を高める', () => {
    expect(portfolio).toContain('.portfolio-featured-card:not(:first-child)');
    expect(portfolio).toContain('.portfolio-featured-card:first-child');
  });
  it('Aboutの現在のHTMLクラスが明示的にスタイル化されている', () => {
    for (const className of ['.about-profile-grid','.about-profile-summary','.about-capability-grid','.about-principle-grid']) {
      expect(about).toContain(className);
    }
  });
  it('料金とトップの見出しを読みやすくし、無料ツールプレビュー文字も改善する', () => {
    expect(home).toContain('料金の目安を公開しています。');
    expect(home).toContain('こうした手作業、減らせます。');
    expect(home).toContain('.request-grid { grid-template-columns: repeat(3, minmax(0,1fr)); }');
    expect(price).toContain('border-radius: var(--radius-card)');
    expect(tools).toContain('font-size: .71rem;');
  });
  it('7画面幅と重要ページをChromiumで点検する', () => {
    expect(visualAudit).toContain('[320, 375, 390, 768, 1024, 1440, 1920]');
    for (const name of ['home','works','work-detail','services','service-detail','price','about','guide','tools','excel-diff','data-cleaner','dashboard','diagnosis','contact']) {
      expect(visualAudit).toContain(`['${name}',`);
    }
    expect(visualAudit).toContain('process phases');
  });
});
