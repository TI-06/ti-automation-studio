import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { solutions } from '../src/data/solutions';
import { works } from '../src/data/works';

const solutionIndexSource = readFileSync(new URL('../src/pages/solutions/index.astro', import.meta.url), 'utf-8');
const solutionDetailSource = readFileSync(new URL('../src/pages/solutions/[slug].astro', import.meta.url), 'utf-8');
const serviceDetailSource = readFileSync(new URL('../src/pages/services/[slug].astro', import.meta.url), 'utf-8');
const workDetailSource = readFileSync(new URL('../src/pages/works/[slug].astro', import.meta.url), 'utf-8');

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
    for (const slug of phase2Slugs) expect(slugs).toContain(slug);
  });

  it('全ガイドがクラスター・検索意図・関連記事を持つ', () => {
    const validClusters = ['excel', 'gas', 'python', 'api', 'automation'];
    const validIntents = ['informational', 'commercial'];
    for (const solution of solutions as Array<Record<string, unknown>>) {
      expect(validClusters).toContain(solution.cluster);
      expect(validIntents).toContain(solution.searchIntent);
      expect(Array.isArray(solution.relatedSolutionSlugs)).toBe(true);
      expect((solution.relatedSolutionSlugs as string[]).length).toBeGreaterThanOrEqual(2);
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
  });

  it('実績ページに検索結果向けtitleとdescriptionを持たせる', () => {
    for (const work of works as Array<Record<string, unknown>>) {
      expect(typeof work.seoTitle).toBe('string');
      expect(String(work.seoTitle).length).toBeGreaterThan(10);
      expect(typeof work.seoDescription).toBe('string');
      expect(String(work.seoDescription).length).toBeGreaterThan(30);
    }
    expect(workDetailSource).toContain('title={work.seoTitle}');
    expect(workDetailSource).toContain('description={work.seoDescription}');
    expect(workDetailSource).toContain('<h1>{work.title}</h1>');
  });
});
