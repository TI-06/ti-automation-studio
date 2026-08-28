import { calculateSavings, calculateWorkload } from './calculate';
import { buildAutomationRecommendations } from './recommend';
import { scoreAutomationSuitability } from './score';
import type { AutomationDiagnosisInput, AutomationDiagnosisResult } from './types';

export function buildAutomationDiagnosisReport(
  input: AutomationDiagnosisInput,
  reductionRate = 60,
): AutomationDiagnosisResult {
  const workload = calculateWorkload(input);
  const scoring = scoreAutomationSuitability(input, workload);
  const recommendations = buildAutomationRecommendations(input);
  const savings = calculateSavings(workload.annualHours, reductionRate, input.hourlyCost);

  return {
    generatedAt: new Date().toISOString(),
    input: { ...input, tasks: [...input.tasks], environments: [...input.environments] },
    workload,
    scoring,
    recommendations,
    savings,
  };
}
