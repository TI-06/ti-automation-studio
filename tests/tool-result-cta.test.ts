import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const component = readFileSync(new URL('../src/components/tools/ToolResultCTA.astro', import.meta.url), 'utf-8');
const helper = readFileSync(new URL('../src/scripts/tools/result-cta.ts', import.meta.url), 'utf-8');
const excelPage = readFileSync(new URL('../src/pages/tools/excel-diff.astro', import.meta.url), 'utf-8');
const excelClient = readFileSync(new URL('../src/scripts/tools/excel-diff.ts', import.meta.url), 'utf-8');
const cleanerPage = readFileSync(new URL('../src/pages/tools/data-cleaner.astro', import.meta.url), 'utf-8');
const cleanerClient = readFileSync(new URL('../src/scripts/tools/data-cleaner.ts', import.meta.url), 'utf-8');
const dashboardPage = readFileSync(new URL('../src/pages/tools/dashboard-builder.astro', import.meta.url), 'utf-8');
const dashboardClient = readFileSync(new URL('../src/scripts/tools/dashboard-builder/controller.ts', import.meta.url), 'utf-8');
const diagnosisPage = readFileSync(new URL('../src/pages/tools/automation-diagnosis.astro', import.meta.url), 'utf-8');
const diagnosisClient = readFileSync(new URL('../src/scripts/tools/automation-diagnosis/controller.ts', import.meta.url), 'utf-8');

describe('結果後相談CTA', () => {
  it('初期非表示でsourceだけを問い合わせへ渡す', () => {
    expect(component).toContain('data-tool-result-cta');
    expect(component).toContain('hidden');
    expect(component).toContain('toolContactHref');
    expect(component).toContain('config.serviceHref');
  });

  it('show/hideだけを行う共通ヘルパーを持つ', () => {
    expect(helper).toContain('bindToolResultCta');
    expect(helper).toContain('element.hidden = false');
    expect(helper).toContain('element.hidden = true');
    expect(helper).not.toContain('fetch(');
    expect(helper).not.toContain('localStorage');
  });

  it('Excel差分は比較成功後だけCTAを表示し結果クリアで隠す', () => {
    expect(excelPage).toContain('<ToolResultCTA source="excel-diff"');
    expect(excelClient).toContain("bindToolResultCta('excel-diff')");
    expect(excelClient).toContain('resultCta.show()');
    expect(excelClient).toContain('resultCta.hide()');
  });

  it('データ整理は健康診断完了後だけCTAを表示する', () => {
    expect(cleanerPage).toContain('<ToolResultCTA source="data-cleaner"');
    expect(cleanerClient).toContain("bindToolResultCta('data-cleaner')");
    expect(cleanerClient).toContain('resultCta.show()');
    expect(cleanerClient).toContain('resultCta.hide()');
  });

  it('ダッシュボードは1ウィジェット以上の集計結果生成後にCTAを表示する', () => {
    expect(dashboardPage).toContain('<ToolResultCTA source="dashboard-builder"');
    expect(dashboardPage.indexOf('<ToolResultCTA source="dashboard-builder"')).toBeGreaterThan(dashboardPage.indexOf('data-dashboard-export-area'));
    expect(dashboardClient).toContain("bindToolResultCta('dashboard-builder')");
    expect(dashboardClient).toContain('resultCta.show()');
    expect(dashboardClient).toContain('resultCta.hide()');
  });

  it('自動化診断は結果表示後にCTAを出しPDF印刷から除外する', () => {
    expect(diagnosisPage).toContain('<ToolResultCTA source="automation-diagnosis" printIgnore');
    expect(diagnosisClient).toContain("bindToolResultCta('automation-diagnosis')");
    expect(diagnosisClient).toContain('resultCta.show()');
    expect(diagnosisClient).toContain('resultCta.hide()');
  });

  it('結果CTA連携は入力データ送信やブラウザ永続化を追加しない', () => {
    [excelClient, cleanerClient, dashboardClient, diagnosisClient].forEach((source) => {
      expect(source).not.toContain('localStorage');
      expect(source).not.toContain('sessionStorage');
      expect(source).not.toContain('fetch(');
    });
    expect(component).not.toContain('fileName');
    expect(component).not.toContain('annualHours');
    expect(component).not.toContain('savedCost');
  });
});
