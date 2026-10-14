import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { works } from '../src/data/works';

const read = (path: string): string => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const home = read('src/pages/index.astro');
const portfolio = read('src/pages/works/index.astro');
const css = read('src/styles/portfolio.css');
const logic = read('src/scripts/portfolio-filter.ts');

describe('サイト導線と事例の絞り込み', () => {
  it('トップの主CTAを相談にし、実績閲覧も残す', () => {
    expect(home).toContain('class="btn btn-primary" href="/contact">まずは無料相談');
    expect(home).toContain('class="btn" href="/works">開発実績を見る');
  });

  it('実績のカテゴリに全8件を重複なく分類する', () => {
    const categories: Record<string, string[]> = {
      business: ['workflow-report-system','construction-site-operations','learner-progress-management','inventory-product-tool'],
      data: ['excel-business-application','bulk-data-processing'],
      api: ['ec-api-integration'],
      document: ['pdf-document-automation'],
    };
    const slugs = Object.values(categories).flat();
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(slugs)).toEqual(new Set(works.map((work) => work.slug)));
    for (const category of Object.keys(categories)) {
      expect(portfolio).toContain(`data-work-filter="${category}"`);
    }
  });

  it('実績フィルタで選択状態と表示件数を更新する', () => {
    expect(portfolio).toContain('data-portfolio-filters');
    expect(portfolio).toContain('data-work-section');
    expect(portfolio).toContain('data-work-category={workCategory(work.slug)}');
    expect(portfolio).toContain('aria-live="polite"');
    expect(logic).toContain("button.setAttribute('aria-pressed'");
    expect(logic).toContain('card.hidden = !matches');
    expect(logic).toContain("count.textContent");
    expect(css).toContain('.portfolio-featured-card[hidden]');
    expect(css).toContain('.portfolio-case-card[hidden]');
  });
  it('スマホでも絞り込みをタップできる', () => {
    expect(css).toContain('.portfolio-filter-options button');
    expect(css).toContain('min-height: 44px');
    expect(css).toContain('@media (max-width: 560px)');
  });
});
