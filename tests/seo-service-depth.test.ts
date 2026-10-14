import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { services } from '../src/data/services';
import { solutions } from '../src/data/solutions';
import { works } from '../src/data/works';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const index = read('src/pages/services/index.astro');
const detail = read('src/pages/services/[slug].astro');
const css = read('src/styles/services.css');
const sitemap = read('src/pages/sitemap.xml.ts');

const expectedSlugs = [
  'excel-automation',
  'gas-automation',
  'python-data-processing',
  'api-integration',
  'pdf-document-automation',
];

describe('SEO Service Phase 1: unique helpful content', () => {
  it('5サービスのURLを変えず、検索意図に沿った独自の説明を用意する', () => {
    expect(services.map(s => s.slug)).toEqual(expectedSlugs);
    expect(new Set(services.map(s => s.seoTitle)).size).toBe(5);
    expect(new Set(services.map(s => s.decisionLead)).size).toBe(5);
    for (const service of services) {
      expect(service.seoTitle.length).toBeGreaterThan(18);
      expect(service.description.length).toBeGreaterThan(65);
      expect(service.decisionLead.length).toBeGreaterThan(60);
      expect(service.decisionPoints).toHaveLength(3);
      expect(service.deliveryChecks).toHaveLength(3);
      expect(service.preparation).toHaveLength(3);
      for (const point of [...service.decisionPoints, ...service.deliveryChecks]) {
        expect(point.title.length).toBeGreaterThan(5);
        expect(point.detail.length).toBeGreaterThan(42);
      }
    }
    expect(sitemap).toContain('services.map((service) => `/services/${service.slug}/`)');
  });

  it('実績・ガイドリンクは実在するページだけを参照する', () => {
    const guideSlugs = new Set(solutions.map(s => s.slug));
    const workSlugs = new Set(works.map(w => w.slug));
    for (const service of services) {
      expect(service.priorityGuideSlugs).toHaveLength(3);
      for (const slug of service.priorityGuideSlugs) expect(guideSlugs.has(slug), slug).toBe(true);
      for (const slug of service.relatedWorkSlugs) expect(workSlugs.has(slug), slug).toBe(true);
    }
  });

  it('実際の検索質問からサービスページへ案内する', () => {
    expect(index).toContain('業務の悩みから探す');
    expect(index).toContain('class="service-choice-list"');
    expect(index).toContain('class="service-choice-row"');
    expect(index).toContain('href={`/services/${item.slug}/`}');
    for (const slug of expectedSlugs) expect(index).toContain(`slug: '${slug}'`);
    expect(index).toContain('href="/contact"');
  });

  it('詳細ページは実装判断・運用上の注意・相談準備をHTMLで表示する', () => {
    for (const s of [
      'service.decisionLead',
      'service.decisionPoints.map',
      'service.deliveryChecks.map',
      'service.preparation.map',
      'service.priorityGuideSlugs',
      'class="service-decision-card"',
      'class="service-implementation-checks"',
      'class="container service-preparation"',
      'href="/price"',
      'href="/contact"',
      "'@type': 'Service'",
      "'@type': 'BreadcrumbList'",
    ]) expect(detail).toContain(s);
    expect(detail).toContain('const relatedGuides = [...new Set(recommendedGuideSlugs)]');
  });

  it('すべての新しいエリアにモバイル用のレイアウトを持つ', () => {
    expect(css).toContain('.service-decision-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr))');
    expect(css).toContain('.service-preparation {');
    expect(css).toContain('@media (max-width: 1000px)');
    expect(css).toContain('@media (max-width: 680px)');
    expect(css).toContain('.service-choice-row { align-items: flex-start; flex-direction: column;');
    expect(css).toContain('prefers-reduced-motion: reduce');
  });
});
