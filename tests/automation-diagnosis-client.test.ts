import { describe, expect, it } from 'vitest';
import {
  getNextAutomationDiagnosisStep,
  validateAutomationDiagnosisInput,
} from '../src/scripts/tools/automation-diagnosis/controller';
import type { AutomationDiagnosisInput } from '../src/lib/tools/automation-diagnosis/types';

const input = (patch: Partial<AutomationDiagnosisInput> = {}): AutomationDiagnosisInput => ({
  minutesPerRun: 30,
  frequency: 'weekly',
  people: 2,
  tasks: ['aggregation'],
  routineLevel: 'same',
  judgmentLevel: 'low',
  dataConsistency: 'same',
  exceptionLevel: 'low',
  environments: ['excel'],
  ...patch,
});

describe('業務自動化診断クライアント', () => {
  it('6ステップを範囲外へ移動しない', () => {
    expect(getNextAutomationDiagnosisStep(1, -1)).toBe(1);
    expect(getNextAutomationDiagnosisStep(1, 1)).toBe(2);
    expect(getNextAutomationDiagnosisStep(5, 1)).toBe(6);
    expect(getNextAutomationDiagnosisStep(6, 1)).toBe(6);
  });

  it('0分・0人・作業未選択・環境未選択を拒否する', () => {
    expect(validateAutomationDiagnosisInput(input({ minutesPerRun: 0 })).valid).toBe(false);
    expect(validateAutomationDiagnosisInput(input({ people: 0 })).valid).toBe(false);
    expect(validateAutomationDiagnosisInput(input({ tasks: [] })).valid).toBe(false);
    expect(validateAutomationDiagnosisInput(input({ environments: [] })).valid).toBe(false);
  });

  it('24時間超はエラーではなく確認警告にする', () => {
    const result = validateAutomationDiagnosisInput(input({ minutesPerRun: 1500 }));
    expect(result.valid).toBe(true);
    expect(result.warnings.some((message) => message.includes('24時間'))).toBe(true);
  });

  it('カスタム頻度では回数と期間を要求する', () => {
    const invalid = validateAutomationDiagnosisInput(input({ frequency: 'custom' }));
    expect(invalid.valid).toBe(false);
    const valid = validateAutomationDiagnosisInput(input({ frequency: 'custom', customFrequencyCount: 20, customFrequencyPeriod: 'month' }));
    expect(valid.valid).toBe(true);
  });

  it('負の人件費を拒否する', () => {
    expect(validateAutomationDiagnosisInput(input({ hourlyCost: -100 })).valid).toBe(false);
  });
});
