import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = (name: string) => readFileSync(new URL(`../src/pages/tools/${name}.astro`, import.meta.url), 'utf-8');
const excel = page('excel-diff');
const cleaner = page('data-cleaner');
const dashboard = page('dashboard-builder');
const diagnosis = page('automation-diagnosis');

describe('公開ツールSEO・内部リンク', () => {
  it('FAQ本文を持つ4ページにFAQPageを持たせる', () => {
    [excel, cleaner, dashboard, diagnosis].forEach((source) => expect(source).toContain("'@type': 'FAQPage'"));
  });

  it('Excel差分からデータ整理と自動化診断へ移動できる', () => {
    expect(excel).toContain('href="/tools/data-cleaner"');
    expect(excel).toContain('href="/tools/automation-diagnosis"');
  });

  it('データ整理からExcel差分・ダッシュボード・自動化診断へ移動できる', () => {
    expect(cleaner).toContain('href="/tools/excel-diff"');
    expect(cleaner).toContain('href="/tools/dashboard-builder"');
    expect(cleaner).toContain('href="/tools/automation-diagnosis"');
  });

  it('ダッシュボードからデータ整理と自動化診断へ移動できる', () => {
    expect(dashboard).toContain('href="/tools/data-cleaner"');
    expect(dashboard).toContain('href="/tools/automation-diagnosis"');
  });

  it('自動化診断からExcel差分・データ整理・ダッシュボードへ移動できる', () => {
    expect(diagnosis).toContain('href="/tools/excel-diff"');
    expect(diagnosis).toContain('href="/tools/data-cleaner"');
    expect(diagnosis).toContain('href="/tools/dashboard-builder"');
  });
});
