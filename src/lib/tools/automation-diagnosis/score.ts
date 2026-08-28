import type {
  AutomationDiagnosisInput,
  AutomationScoreResult,
  AutomationSuitability,
  AutomationWorkload,
} from './types';

const AUTOMATION_FRIENDLY_TASKS = new Set([
  'file-transfer',
  'aggregation',
  'email',
  'pdf-report',
  'file-management',
  'external-registration',
]);

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function baseSuitability(score: number): AutomationSuitability {
  if (score >= 75) return 'high';
  if (score >= 60) return 'fairly-high';
  if (score >= 40) return 'partial';
  return 'human-led';
}

function applySuitabilityCaps(input: AutomationDiagnosisInput, suitability: AutomationSuitability): AutomationSuitability {
  let result = suitability;
  if (input.judgmentLevel === 'high' && result === 'high') result = 'fairly-high';
  if (input.routineLevel === 'different' && input.exceptionLevel === 'high') {
    if (result === 'high' || result === 'fairly-high') result = 'partial';
  }
  return result;
}

export function scoreAutomationSuitability(
  input: AutomationDiagnosisInput,
  workload: AutomationWorkload,
): AutomationScoreResult {
  let score = 50;
  const positiveFactors: string[] = [];
  const cautionFactors: string[] = [];

  if (input.routineLevel === 'same') {
    score += 20;
    positiveFactors.push('毎回ほぼ同じ手順で実施しています');
  } else if (input.routineLevel === 'partial') {
    score += 10;
    positiveFactors.push('基本手順は共通しており、一部だけ変化します');
  } else {
    score -= 15;
    cautionFactors.push('手順が毎回かなり変わります');
  }

  if (input.judgmentLevel === 'low') {
    score += 20;
    positiveFactors.push('人による判断がほとんど不要です');
  } else if (input.judgmentLevel === 'some') {
    score += 5;
    cautionFactors.push('一部で人による判断が必要です');
  } else {
    score -= 20;
    cautionFactors.push('人による判断が多く、自動処理だけでは完結しにくい業務です');
  }

  if (input.dataConsistency === 'same') {
    score += 15;
    positiveFactors.push('入力データの形式がほぼ一定です');
  } else if (input.dataConsistency === 'partial') {
    score += 7;
    positiveFactors.push('入力形式は一部変わりますが、基本形があります');
  } else {
    score -= 12;
    cautionFactors.push('入力データの形式が毎回異なります');
  }

  if (input.exceptionLevel === 'low') {
    score += 15;
    positiveFactors.push('例外処理がほとんどありません');
  } else if (input.exceptionLevel === 'some') {
    score += 5;
    cautionFactors.push('例外処理が時々発生します');
  } else {
    score -= 15;
    cautionFactors.push('例外処理が多く、個別対応を残す必要があります');
  }

  if (workload.annualRuns >= 120) {
    score += 10;
    positiveFactors.push('年間120回以上繰り返す作業です');
  } else if (workload.annualRuns >= 52) {
    score += 7;
    positiveFactors.push('週1回以上の頻度で繰り返しています');
  } else if (workload.annualRuns >= 12) {
    score += 3;
    positiveFactors.push('毎月継続して発生する作業です');
  }

  if (workload.annualHours >= 200) {
    score += 10;
    positiveFactors.push('年間200時間以上を使っている作業です');
  } else if (workload.annualHours >= 80) {
    score += 7;
    positiveFactors.push('年間80時間以上を使っている作業です');
  } else if (workload.annualHours >= 24) {
    score += 3;
    positiveFactors.push('年間24時間以上を使っている作業です');
  }

  if (input.people >= 5) {
    score += 5;
    positiveFactors.push('複数人で同じ作業を行っています');
  } else if (input.people >= 2) {
    score += 3;
    positiveFactors.push('2人以上が同じ作業に関わっています');
  }

  if (input.tasks.some((task) => AUTOMATION_FRIENDLY_TASKS.has(task))) {
    score += 5;
    positiveFactors.push('転記・集計・定型処理など自動化しやすい作業を含みます');
  }

  const normalizedScore = clamp(score);
  const suitability = applySuitabilityCaps(input, baseSuitability(normalizedScore));

  return {
    score: normalizedScore,
    suitability,
    positiveFactors,
    cautionFactors,
  };
}
