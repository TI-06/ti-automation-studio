import { describe, expect, it } from 'vitest';
import { calculateWorkload } from '../src/lib/tools/automation-diagnosis/calculate';
import { scoreAutomationSuitability } from '../src/lib/tools/automation-diagnosis/score';
import type { AutomationDiagnosisInput } from '../src/lib/tools/automation-diagnosis/types';

const input = (patch: Partial<AutomationDiagnosisInput> = {}): AutomationDiagnosisInput => ({
  minutesPerRun: 30,
  frequency: 'daily',
  people: 3,
  tasks: ['file-transfer', 'aggregation'],
  routineLevel: 'same',
  judgmentLevel: 'low',
  dataConsistency: 'same',
  exceptionLevel: 'low',
  environments: ['excel'],
  ...patch,
});

function diagnose(patch: Partial<AutomationDiagnosisInput> = {}) {
  const value = input(patch);
  return scoreAutomationSuitability(value, calculateWorkload(value));
}

describe('自動化適性スコア', () => {
  it('定型・判断少・形式一定・例外少の反復業務は高判定になる', () => {
    const result = diagnose();
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.suitability).toBe('high');
    expect(result.positiveFactors.length).toBeGreaterThan(0);
  });

  it('作業量が大きくても判断が多い業務はhighにしない', () => {
    const result = diagnose({ minutesPerRun: 180, people: 10, judgmentLevel: 'high' });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.suitability).not.toBe('high');
    expect(result.cautionFactors.some((item) => item.includes('判断'))).toBe(true);
  });

  it('手順が毎回違い、例外が多い場合は最大でもpartialにする', () => {
    const result = diagnose({
      routineLevel: 'different',
      exceptionLevel: 'high',
      judgmentLevel: 'some',
      dataConsistency: 'different',
    });
    expect(['partial', 'human-led']).toContain(result.suitability);
  });

  it('低頻度・短時間・1人・判断多・例外多は人の判断を残す判定になる', () => {
    const result = diagnose({
      minutesPerRun: 5,
      frequency: 'monthly',
      people: 1,
      tasks: ['approval'],
      routineLevel: 'different',
      judgmentLevel: 'high',
      dataConsistency: 'different',
      exceptionLevel: 'high',
    });
    expect(result.suitability).toBe('human-led');
    expect(result.cautionFactors.length).toBeGreaterThanOrEqual(3);
  });

  it('スコアを0〜100に収める', () => {
    expect(diagnose().score).toBeLessThanOrEqual(100);
    expect(diagnose({
      minutesPerRun: 1,
      frequency: 'monthly',
      people: 1,
      tasks: ['approval'],
      routineLevel: 'different',
      judgmentLevel: 'high',
      dataConsistency: 'different',
      exceptionLevel: 'high',
    }).score).toBeGreaterThanOrEqual(0);
  });
});
