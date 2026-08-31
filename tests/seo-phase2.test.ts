import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { solutions } from '../src/data/solutions';
import { services } from '../src/data/services';
import { tools } from '../src/data/tools';
import { works } from '../src/data/works';

const solutionIndexSource = readFileSync(new URL('../src/pages/solutions/index.astro', import.meta.url), 'utf-8');
const solutionDetailSource = readFileSync(new URL('../src/pages/solutions/[slug].astro', import.meta.url), 'utf-8');
const serviceDetailSource = readFileSync(new URL('../src/pages/services/[slug].astro', import.meta.url), 'utf-8');
const workDetailSource = readFileSync(new URL('../src/pages/works/[slug].astro', import.meta.url), 'utf-8');
const repairServiceSource = readFileSync(new URL('../src/components/RepairServicePage.astro', import.meta.url), 'utf-8');

const phase2Slugs = [
  'excel-monthly-aggregation',
  'excel-pdf-automation',
  'vba-development-cost',
  'excel-macro-performance',
  'spreadsheet-automation',
  'gas-mail-automation',
  'gas-performance',
  'gas-web-app-development',
  'python-excel-automation',
  'csv-bulk-processing',
  'excel-large-data-processing',
  'api-integration-cost',
  'api-business-automation',
  'manual-work-automation',
  'business-automation-outsourcing',
];

describe('SEO Phase 2 content clusters', () => {
  it('20本の検索意図別ガイドを公開する', () => {
    expect(solutions).toHaveLength(20);
    const slugs = solutions.map((solution) => solution.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of phase2Slugs) expect(slugs).toContain(slug);
  });

  it('全ガイドがクラスター・検索意図・関連記事を持つ', () => {
    const validClusters = ['excel', 'gas', 'python', 'api', 'automation'];
    const validIntents = ['informational', 'commercial'];
    for (const solution of solutions) {
      expect(validClusters).toContain(solution.cluster);
      expect(validIntents).toContain(solution.searchIntent);
      expect(solution.relatedSolutionSlugs.length).toBeGreaterThanOrEqual(2);
      expect(solution.approaches.length).toBeGreaterThanOrEqual(3);
      expect(solution.steps.length).toBeGreaterThanOrEqual(3);
      expect(solution.pitfalls.length).toBeGreaterThanOrEqual(3);
      expect(solution.faq.length).toBeGreaterThanOrEqual(3);
      expect(solution.seoTitle.length).toBeGreaterThan(15);
      expect(solution.description.length).toBeGreaterThan(35);
    }
  });

  it('関連記事・実績・ツール・サービスのslugがすべて解決できる', () => {
    const solutionSlugs = new Set(solutions.map((solution) => solution.slug));
    const workSlugs = new Set(works.map((work) => work.slug));
    const toolSlugs = new Set(tools.filter((tool) => tool.published).map((tool) => tool.slug));
    const serviceSlugs = new Set([...services.map((service) => service.slug), 'vba-repair', 'gas-repair']);

    for (const solution of solutions) {
      for (const slug of solution.relatedSolutionSlugs) {
        expect(slug).not.toBe(solution.slug);
        expect(solutionSlugs.has(slug), `${solution.slug} -> solution:${slug}`).toBe(true);
      }
      for (const slug of solution.relatedWorkSlugs) expect(workSlugs.has(slug), `${solution.slug} -> work:${slug}`).toBe(true);
      for (const slug of solution.relatedToolSlugs) expect(toolSlugs.has(slug), `${solution.slug} -> tool:${slug}`).toBe(true);
      expect(serviceSlugs.has(solution.relatedServiceSlug), `${solution.slug} -> service:${solution.relatedServiceSlug}`).toBe(true);
    }
  });

  it('solution一覧を5クラスターで整理する', () => {
    expect(solutionIndexSource).toContain('solutionClusters');
    expect(solutionIndexSource).toContain('Excel・VBA・スプレッドシート');
    expect(solutionIndexSource).toContain('GAS・Google Workspace');
    expect(solutionIndexSource).toContain('Python・CSV・大量データ');
    expect(solutionIndexSource).toContain('API・外部サービス連携');
    expect(solutionIndexSource).toContain('業務自動化・外注');
  });

  it('solution詳細から同じテーマの関連ガイドへ遷移できる', () => {
    expect(solutionDetailSource).toContain('relatedSolutionSlugs');
    expect(solutionDetailSource).toContain('relatedSolutions');
    expect(solutionDetailSource).toContain('関連する業務自動化ガイド');
    expect(solutionDetailSource).toContain('href={`/solutions/${item.slug}`}');
  });

  it('サービスと実績から関連ガイドへ内部リンクする', () => {
    expect(serviceDetailSource).toContain("import { solutions } from '../../data/solutions'");
    expect(serviceDetailSource).toContain('relatedServiceSlug === service.slug');
    expect(serviceDetailSource).toContain('関連する業務自動化ガイド');
    expect(workDetailSource).toContain("import { solutions } from '../../data/solutions'");
    expect(workDetailSource).toContain('relatedWorkSlugs.includes(work.slug)');
    expect(workDetailSource).toContain('関連する業務自動化ガイド');
    expect(repairServiceSource).toContain('relatedGuideSlugs');
    expect(repairServiceSource).toContain('PRACTICAL GUIDES');
  });

  it('実績ページに検索結果向けtitleとdescriptionを持たせる', () => {
    for (const work of works) {
      expect(work.seoTitle.length).toBeGreaterThan(10);
      expect(work.seoDescription.length).toBeGreaterThan(30);
    }
    expect(workDetailSource).toContain('title={work.seoTitle}');
    expect(workDetailSource).toContain('description={work.seoDescription}');
    expect(workDetailSource).toContain('<h1>{work.title}</h1>');
  });
});
