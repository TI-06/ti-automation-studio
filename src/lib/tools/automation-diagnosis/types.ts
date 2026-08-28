export type AutomationFrequency =
  | 'daily'
  | 'weekly-multiple'
  | 'weekly'
  | 'monthly-multiple'
  | 'monthly'
  | 'yearly-multiple'
  | 'custom';

export type CustomFrequencyPeriod = 'week' | 'month' | 'year';

export type AutomationTaskType =
  | 'excel-input'
  | 'file-transfer'
  | 'aggregation'
  | 'verification'
  | 'email'
  | 'pdf-report'
  | 'web-input'
  | 'file-management'
  | 'approval'
  | 'external-registration'
  | 'other';

export type AutomationEnvironment =
  | 'excel'
  | 'google-sheets'
  | 'google-workspace'
  | 'internal-web'
  | 'external-web'
  | 'pdf-paper'
  | 'other';

export type RoutineLevel = 'same' | 'partial' | 'different';
export type JudgmentLevel = 'low' | 'some' | 'high';
export type DataConsistency = 'same' | 'partial' | 'different';
export type ExceptionLevel = 'low' | 'some' | 'high';
export type AutomationSuitability = 'high' | 'fairly-high' | 'partial' | 'human-led';

export interface AutomationDiagnosisInput {
  minutesPerRun: number;
  frequency: AutomationFrequency;
  customFrequencyCount?: number;
  customFrequencyPeriod?: CustomFrequencyPeriod;
  people: number;
  hourlyCost?: number;
  tasks: AutomationTaskType[];
  otherTaskNote?: string;
  routineLevel: RoutineLevel;
  judgmentLevel: JudgmentLevel;
  dataConsistency: DataConsistency;
  exceptionLevel: ExceptionLevel;
  environments: AutomationEnvironment[];
  reportTitle?: string;
}

export interface AutomationWorkload {
  annualRuns: number;
  monthlyHours: number;
  annualHours: number;
  annualCost?: number;
}

export interface AutomationSavings {
  reductionRate: number;
  savedHours: number;
  remainingHours: number;
  savedCost?: number;
}

export interface AutomationScoreResult {
  score: number;
  suitability: AutomationSuitability;
  positiveFactors: string[];
  cautionFactors: string[];
}

export interface AutomationRecommendations {
  automatable: string[];
  humanLed: string[];
  technologies: string[];
}

export interface AutomationDiagnosisResult {
  generatedAt: string;
  input: AutomationDiagnosisInput;
  workload: AutomationWorkload;
  scoring: AutomationScoreResult;
  recommendations: AutomationRecommendations;
  savings: AutomationSavings;
}
