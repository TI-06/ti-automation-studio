import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readIfExists = (relativePath: string) => {
  const url = new URL(relativePath, import.meta.url);
  return existsSync(url) ? readFileSync(url, 'utf-8') : '';
};

const homeSource = readIfExists('../src/pages/index.astro');
const vbaRepairSource = readIfExists('../src/pages/services/vba-repair.astro');
const gasRepairSource = readIfExists('../src/pages/services/gas-repair.astro');
const priceSource = readIfExists('../src/pages/price.astro');
const solutionDataSource = readIfExists('../src/data/solutions.ts');
const solutionIndexSource = readIfExists('../src/pages/solutions/index.astro');
const solutionDetailSource = readIfExists('../src/pages/solutions/[slug].astro');

describe('SEO Phase 1', () => {
  it('トップページが業務自動化の検索意図をtitleとH1で明示する', () => {
    expect(homeSource).toContain('title="業務自動化・Excel/GAS/Python開発"');
    expect(homeSource).toContain('Excel・GAS・Pythonで');
    expect(homeSource).toContain('業務自動化。');
    expect(homeSource).toContain('手作業を、現場で使える仕組みに変える');
  });

  it('既存ツールの修正ニーズ向けにVBAとGASの専用サービスを持つ', () => {
    expect(existsSync(new URL('../src/pages/services/vba-repair.astro', import.meta.url))).toBe(true);
    expect(existsSync(new URL('../src/pages/services/gas-repair.astro', import.meta.url))).toBe(true);
    expect(vbaRepairSource).toContain('VBA修正');
    expect(vbaRepairSource).toContain('Excelマクロ');
    expect(gasRepairSource).toContain('GAS修正');
    expect(gasRepairSource).toContain('Google Apps Script');
  });

  it('料金ページで費用目安と見積判断材料を提示する', () => {
    expect(existsSync(new URL('../src/pages/price.astro', import.meta.url))).toBe(true);
    expect(priceSource).toContain('料金・費用の目安');
    expect(priceSource).toContain('小規模な修正');
    expect(priceSource).toContain('業務ツール開発');
    expect(priceSource).toContain("'@type': 'BreadcrumbList'");
  });

  it('最初の5つの課題解決ページを検索意図別に用意する', () => {
    expect(existsSync(new URL('../src/data/solutions.ts', import.meta.url))).toBe(true);
    expect(existsSync(new URL('../src/pages/solutions/index.astro', import.meta.url))).toBe(true);
    expect(existsSync(new URL('../src/pages/solutions/[slug].astro', import.meta.url))).toBe(true);

    for (const slug of [
      'excel-transfer-automation',
      'excel-multiple-files-aggregation',
      'vba-repair-outsourcing',
      'gas-development-outsourcing',
      'gas-pdf-automation',
    ]) {
      expect(solutionDataSource).toContain(`slug: '${slug}'`);
    }
  });

  it('課題解決ページがサービス・実績・相談へつながる', () => {
    expect(solutionDetailSource).toContain("'@type': 'Article'");
    expect(solutionDetailSource).toContain("'@type': 'BreadcrumbList'");
    expect(solutionDetailSource).toContain('relatedServiceSlug');
    expect(solutionDetailSource).toContain('href={`/services/${solution.relatedServiceSlug}`}');
    expect(solutionDetailSource).toContain('href="/contact"');
    expect(solutionIndexSource).toContain('業務自動化のヒント');
  });
});
