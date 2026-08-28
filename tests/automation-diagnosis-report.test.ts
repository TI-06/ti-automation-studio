import { describe, expect, it } from 'vitest';
import { buildAutomationDiagnosisReport } from '../src/lib/tools/automation-diagnosis/report';
import { createAutomationDiagnosisSample } from '../src/lib/tools/automation-diagnosis/sample';

describe('業務自動化診断レポート', () => {
  it('サンプルは15分・月20回・3人のExcel系業務を返す', () => {
    const sample = createAutomationDiagnosisSample();
    expect(sample.minutesPerRun).toBe(15);
    expect(sample.frequency).toBe('custom');
    expect(sample.customFrequencyCount).toBe(20);
    expect(sample.customFrequencyPeriod).toBe('month');
    expect(sample.people).toBe(3);
    expect(sample.tasks).toEqual(expect.arrayContaining(['file-transfer', 'aggregation', 'pdf-report']));
    expect(sample.environments).toContain('excel');
  });

  it('入力から工数・判定・候補・削減試算を1つの結果へ統合する', () => {
    const result = buildAutomationDiagnosisReport(createAutomationDiagnosisSample(), 60);
    expect(result.workload.annualHours).toBe(180);
    expect(result.scoring.suitability).toBeTruthy();
    expect(result.scoring.positiveFactors.length).toBeGreaterThan(0);
    expect(result.recommendations.automatable.length).toBeGreaterThan(0);
    expect(result.recommendations.humanLed.length).toBeGreaterThan(0);
    expect(result.recommendations.technologies.length).toBeGreaterThan(0);
    expect(result.savings.savedHours).toBe(108);
    expect(result.savings.remainingHours).toBe(72);
    expect(result.input.reportTitle).toBeTruthy();
    expect(new Date(result.generatedAt).toString()).not.toBe('Invalid Date');
  });

  it('人件費なしでも削減コストを返さず診断できる', () => {
    const sample = createAutomationDiagnosisSample();
    delete sample.hourlyCost;
    const result = buildAutomationDiagnosisReport(sample, 40);
    expect(result.workload.annualCost).toBeUndefined();
    expect(result.savings.savedCost).toBeUndefined();
  });
});
