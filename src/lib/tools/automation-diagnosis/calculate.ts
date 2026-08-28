import type {
  AutomationDiagnosisInput,
  AutomationSavings,
  AutomationWorkload,
} from './types';

const FIXED_ANNUAL_RUNS = {
  daily: 240,
  'weekly-multiple': 104,
  weekly: 52,
  'monthly-multiple': 24,
  monthly: 12,
  'yearly-multiple': 4,
} as const;

function assertPositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label}は0より大きい数値を入力してください。`);
  }
}

export function annualRuns(input: Pick<AutomationDiagnosisInput, 'frequency' | 'customFrequencyCount' | 'customFrequencyPeriod'>): number {
  if (input.frequency !== 'custom') return FIXED_ANNUAL_RUNS[input.frequency];

  const count = input.customFrequencyCount ?? 0;
  assertPositive(count, '実施回数');
  if (!input.customFrequencyPeriod) throw new Error('回数の期間を選択してください。');

  const multiplier = input.customFrequencyPeriod === 'week'
    ? 52
    : input.customFrequencyPeriod === 'month'
      ? 12
      : 1;
  return count * multiplier;
}

export function calculateWorkload(input: AutomationDiagnosisInput): AutomationWorkload {
  assertPositive(input.minutesPerRun, '1回あたりの作業時間');
  assertPositive(input.people, '作業人数');
  if (input.hourlyCost != null && (!Number.isFinite(input.hourlyCost) || input.hourlyCost < 0)) {
    throw new Error('1時間あたりの人件費は0以上で入力してください。');
  }

  const runs = annualRuns(input);
  const annualHours = (input.minutesPerRun / 60) * runs * input.people;
  const monthlyHours = annualHours / 12;
  const annualCost = input.hourlyCost == null ? undefined : annualHours * input.hourlyCost;

  return {
    annualRuns: runs,
    monthlyHours,
    annualHours,
    annualCost,
  };
}

export function calculateSavings(
  annualHours: number,
  reductionRate: number,
  hourlyCost?: number,
): AutomationSavings {
  if (!Number.isFinite(annualHours) || annualHours < 0) throw new Error('年間作業時間を確認してください。');
  if (!Number.isFinite(reductionRate) || reductionRate < 0 || reductionRate > 100) {
    throw new Error('削減率は0〜100%で指定してください。');
  }
  if (hourlyCost != null && (!Number.isFinite(hourlyCost) || hourlyCost < 0)) {
    throw new Error('1時間あたりの人件費は0以上で入力してください。');
  }

  const savedHours = annualHours * (reductionRate / 100);
  const remainingHours = annualHours - savedHours;

  return {
    reductionRate,
    savedHours,
    remainingHours,
    savedCost: hourlyCost == null ? undefined : savedHours * hourlyCost,
  };
}
