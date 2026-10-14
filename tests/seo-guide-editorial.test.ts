import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { solutions } from '../src/data/solutions';
import { solutionDeepDives } from '../src/data/solution-deep-dives';

const source = readFileSync(new URL('../src/pages/solutions/[slug].astro', import.meta.url), 'utf8');
const priority = [
  'excel-transfer-automation',
  'vba-repair-outsourcing',
  'gas-pdf-automation',
  'gas-performance',
  'spreadsheet-automation',
  'gas-web-app-development',
];

describe('SEO Phase 2: editorial depth and visitor readability', () => {
  it('既存20URLを保ったまま検索意図の明確な6記事を詳しくする', () => {
    expect(solutions).toHaveLength(20);
    expect(Object.keys(solutionDeepDives).sort()).toEqual([...priority].sort());
    const all = new Set(solutions.map((s) => s.slug));
    for (const slug of priority) expect(all.has(slug)).toBe(true);
  });
  it('内容が薄いテンプレを量産せず記事ごとに具体的な手順を記述する', () => {
    const headings: string[] = [];
    for (const [slug, guide] of Object.entries(solutionDeepDives)) {
      expect(guide.intro.length, slug).toBeGreaterThan(55);
      expect(guide.sections, slug).toHaveLength(2);
      for (const section of guide.sections) {
        headings.push(section.heading);
        expect(section.heading.length).toBeGreaterThan(8);
        expect(section.lead.length).toBeGreaterThan(38);
        expect(section.tasks.length).toBeGreaterThanOrEqual(3);
        expect(section.checkpoint.length).toBeGreaterThan(34);
        for (const task of section.tasks) {
          expect(task.title.length).toBeGreaterThan(5);
          expect(task.detail.length).toBeGreaterThan(40);
        }
        if (section.example) {
          expect(section.example.rows.length).toBeGreaterThanOrEqual(3);
          expect(section.example.columns).toHaveLength(3);
          for (const row of section.example.rows) expect(row).toHaveLength(3);
        }
      }
    }
    expect(new Set(headings).size).toBe(headings.length);
  });
  it('説明用の架空データを成果数値として扱わない', () => {
    for (const guide of Object.values(solutionDeepDives)) {
      for (const section of guide.sections) {
        if (section.example) expect(section.example.title).toMatch(/架空|例|説明用/);
      }
    }
  });
  it('すべてのガイドに直接ジャンプできる目次と見出しを設ける', () => {
    expect(source).toContain('class="solution-toc"');
    expect(source).toContain('aria-label="この記事の目次"');
    for (const anchor of ['guide-fit','guide-compare','guide-steps','guide-cost','guide-risks','guide-faq']) {
      expect(source).toContain(`id="${anchor}"`);
      expect(source).toContain(`href="#${anchor}"`);
    }
    expect(source).toContain('id={`guide-practical-${index + 1}`}');
    expect(source).toContain('deepDive?.sections.map');
    expect(source).toContain('dateModified: deepDive ?');
  });
  it('具体例をデスクトップは表、スマホはラベル付きで縦積みにする', () => {
    expect(source).toContain('class="solution-practical-example"');
    expect(source).toContain('<table>');
    expect(source).toContain('scope="col"');
    expect(source).toContain('data-label={section.example!.columns[columnIndex]}');
    expect(source).toContain('.solution-practical-example td::before');
    expect(source).toContain('@media (max-width: 640px)');
    expect(source).toContain('.solution-toc ol { grid-template-columns: 1fr;');
  });
  it('公式資料への任意リンクを設け、関連実績・無料ツールも維持する', () => {
    for (const guide of Object.values(solutionDeepDives)) {
      for (const ref of guide.sources) {
        expect(ref.url).toMatch(/^https:\/\/developers\.google\.com\/apps-script\//);
      }
    }
    expect(source).toContain('rel="noopener noreferrer"');
    expect(source).toContain('relatedWorks.length > 0');
    expect(source).toContain('relatedTools.length > 0');
  });
});
