import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { works } from '../src/data/works';
import { publishedTools } from '../src/data/tools';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf-8');
const worksIndex = read('src/pages/works/index.astro');
const workDetail = read('src/pages/works/[slug].astro');
const home = read('src/pages/index.astro');
const portfolioCss = read('src/styles/portfolio.css');

describe('visual portfolio', () => {
  it('開発実績は8件以上あり、すべて画面イメージを持つ', () => {
    expect(works.length).toBeGreaterThanOrEqual(8);
    expect(new Set(works.map((work) => work.slug)).size).toBe(works.length);
    for (const work of works) {
      expect(work.visual).toMatch(/^\/portfolio\/.+\.svg$/);
      expect(work.visualAlt.length).toBeGreaterThan(10);
      expect(work.visualCaption).toContain('再構成');
      expect(existsSync(new URL(`../public${work.visual}`, import.meta.url)), work.visual).toBe(true);
    }
  });

  it('公開ツールにもポートフォリオ画像を用意する', () => {
    expect(publishedTools.length).toBeGreaterThanOrEqual(4);
    for (const tool of publishedTools) {
      expect(tool.visual).toMatch(/^\/portfolio\/.+\.svg$/);
      expect(tool.visualAlt?.length ?? 0).toBeGreaterThan(8);
      expect(existsSync(new URL(`../public${tool.visual}`, import.meta.url)), tool.visual).toBe(true);
    }
  });

  it('一覧は代表事例・その他実績・自作ツールを分けて見せる', () => {
    expect(worksIndex).toContain("featuredSlugs = ['workflow-report-system', 'construction-site-operations', 'learner-progress-management']");
    expect(worksIndex).toContain('id="case-studies"');
    expect(worksIndex).toContain('id="built-tools"');
    expect(worksIndex).toContain('画面構成イメージ');
    expect(worksIndex).toContain('掲載画像について');
    expect(worksIndex).toContain('publishedTools.map');
  });

  it('詳細ページは大きなビジュアルと注記を表示しOG画像にも使う', () => {
    expect(workDetail).toContain('ogImage={work.visual}');
    expect(workDetail).toContain('class="case-visual-frame"');
    expect(workDetail).toContain('src={work.visual}');
    expect(workDetail).toContain('{work.visualCaption}');
  });

  it('トップページの代表実績にも画像を表示する', () => {
    expect(home).toContain("featuredWorkSlugs = ['workflow-report-system', 'construction-site-operations', 'learner-progress-management', 'ec-api-integration']");
    expect(home).toContain('class="home-work-visual"');
    expect(home).toContain('src={work.visual}');
  });

  it('一覧では画像より説明領域を広くし、画像ギャラリー化を防ぐ', () => {
    expect(portfolioCss).toContain('grid-template-columns: minmax(300px, .78fr) minmax(0, 1.22fr)');
    expect(portfolioCss).toContain('aspect-ratio: 16 / 6.6');
    expect(portfolioCss).toContain('grid-template-columns: minmax(190px,.7fr) minmax(0,1.3fr)');
    expect(portfolioCss).toContain('aspect-ratio: 16 / 7');
  });

  it('ポートフォリオはPC・タブレット・スマホのレスポンシブ定義を持つ', () => {
    expect(portfolioCss).toContain('grid-template-columns: repeat(2, minmax(0,1fr))');
    expect(portfolioCss).toContain('@media (max-width: 1100px)');
    expect(portfolioCss).toContain('@media (max-width: 860px)');
    expect(portfolioCss).toContain('@media (max-width: 560px)');
    expect(portfolioCss).toContain('.portfolio-featured-card:first-child');
    expect(portfolioCss).toContain('.case-visual-frame img');
  });

  it('生成したSVGは固定比率・アクセシブルなtitle/descを持つ', () => {
    const paths = [
      ...works.map((work) => work.visual),
      ...publishedTools.map((tool) => tool.visual!).filter(Boolean),
    ];
    for (const path of paths) {
      const svg = read(`public${path}`);
      expect(svg).toContain('width="1440"');
      expect(svg).toContain('height="900"');
      expect(svg).toContain('<title id="t">');
      expect(svg).toContain('<desc id="d">');
    }
  });
});
