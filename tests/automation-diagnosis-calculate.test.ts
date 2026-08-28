import { describe, expect, it } from 'vitest';
import { annualRuns, calculateSavings, calculateWorkload } from '../src/lib/tools/automation-diagnosis/calculate';
import type { AutomationDiagnosisInput, AutomationFrequency } from '../src/lib/tools/automation-diagnosis/types';

const baseInput = (patch: Partial<AutomationDiagnosisInput> = {}): AutomationDiagnosisInput => ({
  minutesPerRun: 15,
  frequency: 'monthly',
  people: 3,
  tasks: ['file-transfer', 'aggregation', 'pdf-report'],
  routineLevel: 'same',
  judgmentLevel: 'low',
  dataConsistency: 'same',
  exceptionLevel: 'some',
  environments: ['excel'],
  ...patch,
});

describe('業務自動化診断の工数計算', () => {
  it.each<[AutomationFrequency, number]>([
    ['daily', 240],
    ['weekly-multiple', 104],
    ['weekly', 52],
    ['monthly-multiple', 24],
    ['monthly', 12],
    ['yearly-multiple', 4],
  ])('%s を年間回数へ換算する', (frequency, expected) => {
    expect(annualRuns(baseInput({ frequency }))).toBe(expected);
  });

  it('カスタム頻度を週・月・年から年間回数へ換算する', () => {
    expect(annualRuns(baseInput({ frequency: 'custom', customFrequencyCount: 2, customFrequencyPeriod: 'week' }))).toBe(104);
    expect(annualRuns(baseInput({ frequency: 'custom', customFrequencyCount: 20, customFrequencyPeriod: 'month' }))).toBe(240);
    expect(annualRuns(baseInput({ frequency: 'custom', customFrequencyCount: 8, customFrequencyPeriod: 'year' }))).toBe(8);
  });

  it('15分 × 月20回 × 3人を年間180時間として計算する', () => {
    const result = calculateWorkload(baseInput({
      frequency: 'custom',
      customFrequencyCount: 20,
      customFrequencyPeriod: 'month',
    }));

    expect(result.annualRuns).toBe(240);
    expect(result.annualHours).toBe(180);
    expect(result.monthlyHours).toBe(15);
  });

  it('人件費を入力した場合だけ年間コストを返す', () => {
    const result = calculateWorkload(baseInput({
      frequency: 'custom',
      customFrequencyCount: 20,
      customFrequencyPeriod: 'month',
      hourlyCost: 3000,
    }));

    expect(result.annualCost).toBe(540000);
    expect(calculateWorkload(baseInput()).annualCost).toBeUndefined();
  });

  it('180時間を60%削減した場合は108時間削減・72時間残存になる', () => {
    expect(calculateSavings(180, 60, 3000)).toEqual({
      reductionRate: 60,
      savedHours: 108,
      remainingHours: 72,
      savedCost: 324000,
    });
  });

  it('負数・0分・0人・不正な削減率を拒否する', () => {
    expect(() => calculateWorkload(baseInput({ minutesPerRun: 0 }))).toThrow();
    expect(() => calculateWorkload(baseInput({ people: 0 }))).toThrow();
    expect(() => calculateWorkload(baseInput({ hourlyCost: -1 }))).toThrow();
    expect(() => calculateSavings(10, 101)).toThrow();
  });
});
