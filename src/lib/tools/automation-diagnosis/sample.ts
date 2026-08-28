import type { AutomationDiagnosisInput } from './types';

export function createAutomationDiagnosisSample(): AutomationDiagnosisInput {
  return {
    minutesPerRun: 15,
    frequency: 'custom',
    customFrequencyCount: 20,
    customFrequencyPeriod: 'month',
    people: 3,
    hourlyCost: 3000,
    tasks: ['file-transfer', 'aggregation', 'pdf-report'],
    routineLevel: 'same',
    judgmentLevel: 'low',
    dataConsistency: 'same',
    exceptionLevel: 'some',
    environments: ['excel'],
    reportTitle: '月次集計・帳票作成業務の自動化診断',
  };
}
