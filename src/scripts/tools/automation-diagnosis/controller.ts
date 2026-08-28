import { buildAutomationDiagnosisReport } from '../../../lib/tools/automation-diagnosis/report';
import { createAutomationDiagnosisSample } from '../../../lib/tools/automation-diagnosis/sample';
import type {
  AutomationDiagnosisInput,
  AutomationDiagnosisResult,
  AutomationEnvironment,
  AutomationFrequency,
  AutomationSuitability,
  AutomationTaskType,
  CustomFrequencyPeriod,
  DataConsistency,
  ExceptionLevel,
  JudgmentLevel,
  RoutineLevel,
} from '../../../lib/tools/automation-diagnosis/types';

export interface AutomationDiagnosisValidation {
  valid: boolean;
  messages: string[];
  warnings: string[];
}

export function getNextAutomationDiagnosisStep(current: number, direction: -1 | 1): number {
  return Math.max(1, Math.min(6, current + direction));
}

export function validateAutomationDiagnosisInput(input: AutomationDiagnosisInput): AutomationDiagnosisValidation {
  const messages: string[] = [];
  const warnings: string[] = [];

  if (!Number.isFinite(input.minutesPerRun) || input.minutesPerRun <= 0) {
    messages.push('1回あたりの作業時間は0より大きい数値を入力してください。');
  } else if (input.minutesPerRun > 1440) {
    warnings.push('1回あたりの作業時間が24時間を超えています。複数日分をまとめた入力であれば、そのまま診断できます。');
  }

  if (!Number.isInteger(input.people) || input.people <= 0) {
    messages.push('作業人数は1人以上の整数で入力してください。');
  }

  if (input.frequency === 'custom') {
    if (!Number.isFinite(input.customFrequencyCount) || (input.customFrequencyCount ?? 0) <= 0) {
      messages.push('実施回数を0より大きい数値で入力してください。');
    }
    if (!input.customFrequencyPeriod) messages.push('実施回数の期間を選択してください。');
  }

  if (input.tasks.length === 0) messages.push('主な作業内容を1つ以上選択してください。');
  if (input.environments.length === 0) messages.push('使用している環境を1つ以上選択してください。');

  if (input.hourlyCost != null && (!Number.isFinite(input.hourlyCost) || input.hourlyCost < 0)) {
    messages.push('1時間あたりの人件費は0以上で入力してください。');
  }

  return { valid: messages.length === 0, messages, warnings };
}

const SUITABILITY_LABELS: Record<AutomationSuitability, string> = {
  high: '自動化適性が高い',
  'fairly-high': '比較的自動化しやすい',
  partial: '一部の自動化に向いている',
  'human-led': '人の判断を残す方がよい',
};

const FREQUENCY_LABELS: Record<AutomationFrequency, string> = {
  daily: '毎日',
  'weekly-multiple': '週に数回',
  weekly: '週1回',
  'monthly-multiple': '月に数回',
  monthly: '月1回',
  'yearly-multiple': '年に数回',
  custom: '回数を直接入力',
};

const TASK_LABELS: Record<AutomationTaskType, string> = {
  'excel-input': 'Excelへの入力',
  'file-transfer': '別ファイルへの転記',
  aggregation: 'データ集計',
  verification: 'データの確認・照合',
  email: 'メール送信',
  'pdf-report': 'PDF・帳票作成',
  'web-input': 'Webサイトへの入力',
  'file-management': 'ファイル整理・保存',
  approval: '承認・確認作業',
  'external-registration': '外部サービスへの登録',
  other: 'その他',
};

const ENVIRONMENT_LABELS: Record<AutomationEnvironment, string> = {
  excel: 'Excel',
  'google-sheets': 'Googleスプレッドシート',
  'google-workspace': 'Gmail / Google Drive',
  'internal-web': '社内Webシステム',
  'external-web': '外部Webサービス',
  'pdf-paper': 'PDF / 紙帳票',
  other: 'その他',
};

const FEATURE_LABELS = {
  routineLevel: { same: 'ほぼ毎回同じ', partial: '一部だけ変わる', different: '毎回かなり違う' },
  judgmentLevel: { low: 'ほとんど不要', some: '一部必要', high: '判断が多い' },
  dataConsistency: { same: 'ほぼ同じ', partial: '一部変わる', different: '毎回違う' },
  exceptionLevel: { low: 'ほとんどない', some: '時々ある', high: '多い' },
} as const;

function numberValue(input: HTMLInputElement): number | undefined {
  if (input.value.trim() === '') return undefined;
  const value = Number(input.value);
  return Number.isFinite(value) ? value : undefined;
}

function formatHours(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded.toLocaleString('ja-JP', { maximumFractionDigits: 1 })}時間`;
}

function formatMoney(value?: number): string {
  if (value == null) return '人件費未入力';
  return `${Math.round(value).toLocaleString('ja-JP')}円`;
}

function formatGeneratedAt(value: string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function setList(container: HTMLElement, values: string[], emptyText: string): void {
  container.replaceChildren();
  if (values.length === 0) {
    const item = document.createElement('li');
    item.textContent = emptyText;
    container.appendChild(item);
    return;
  }
  values.forEach((value) => {
    const item = document.createElement('li');
    item.textContent = value;
    container.appendChild(item);
  });
}

export function initAutomationDiagnosis(appRoot: HTMLElement): void {
  let currentStep = 1;
  let reductionRate = 60;

  const query = <T>(selector: string): T => {
    const element = appRoot.querySelector(selector);
    if (!element) throw new Error(`必要な画面要素が見つかりません: ${selector}`);
    return element as T;
  };

  const all = <T>(selector: string): T[] => [...appRoot.querySelectorAll(selector)] as T[];

  const steps = all<HTMLElement>('[data-diagnosis-step]');
  const progress = query<HTMLElement>('[data-diagnosis-progress]');
  const progressBar = query<HTMLElement>('[data-diagnosis-progress-bar]');
  const prevButton = query<HTMLButtonElement>('[data-diagnosis-prev]');
  const nextButton = query<HTMLButtonElement>('[data-diagnosis-next]');
  const sampleButton = query<HTMLButtonElement>('[data-diagnosis-sample]');
  const resetButton = query<HTMLButtonElement>('[data-diagnosis-reset]');
  const errorBox = query<HTMLElement>('[data-diagnosis-error]');
  const warningBox = query<HTMLElement>('[data-diagnosis-warning]');
  const customFrequency = query<HTMLElement>('[data-custom-frequency]');
  const otherTask = query<HTMLElement>('[data-other-task]');
  const review = query<HTMLElement>('[data-diagnosis-review]');

  const minutes = query<HTMLInputElement>('[data-minutes]');
  const frequency = query<HTMLSelectElement>('[data-frequency]');
  const customCount = query<HTMLInputElement>('[data-custom-count]');
  const customPeriod = query<HTMLSelectElement>('[data-custom-period]');
  const people = query<HTMLInputElement>('[data-people]');
  const otherTaskNote = query<HTMLInputElement>('[data-other-task-note]');
  const hourlyCost = query<HTMLInputElement>('[data-hourly-cost]');
  const reportTitle = query<HTMLInputElement>('[data-report-title]');

  const resultSuitability = query<HTMLElement>('[data-result-suitability]');
  const resultAnnualHours = query<HTMLElement>('[data-result-annual-hours]');
  const resultMonthlyHours = query<HTMLElement>('[data-result-monthly-hours]');
  const resultAnnualRuns = query<HTMLElement>('[data-result-annual-runs]');
  const resultAnnualCost = query<HTMLElement>('[data-result-annual-cost]');
  const resultGeneratedAt = query<HTMLElement>('[data-result-generated-at]');
  const resultReportTitle = query<HTMLElement>('[data-result-report-title]');
  const resultPositive = query<HTMLElement>('[data-result-positive]');
  const resultCautions = query<HTMLElement>('[data-result-cautions]');
  const resultAutomatable = query<HTMLElement>('[data-result-automatable]');
  const resultHuman = query<HTMLElement>('[data-result-human]');
  const resultTechnologies = query<HTMLElement>('[data-result-technologies]');
  const resultSavedHours = query<HTMLElement>('[data-result-saved-hours]');
  const resultRemainingHours = query<HTMLElement>('[data-result-remaining-hours]');
  const resultSavedCost = query<HTMLElement>('[data-result-saved-cost]');
  const reductionRange = query<HTMLInputElement>('[data-reduction-range]');
  const reductionValue = query<HTMLElement>('[data-reduction-value]');
  const printButton = query<HTMLButtonElement>('[data-diagnosis-print]');
  const restartButton = query<HTMLButtonElement>('[data-diagnosis-restart]');

  function checkedValues<T extends string>(name: string): T[] {
    return all<HTMLInputElement>(`input[name="${name}"]:checked`).map((input) => input.value as T);
  }

  function radioValue<T extends string>(name: string): T {
    return query<HTMLInputElement>(`input[name="${name}"]:checked`).value as T;
  }

  function readInput(): AutomationDiagnosisInput {
    return {
      minutesPerRun: Number(minutes.value),
      frequency: frequency.value as AutomationFrequency,
      customFrequencyCount: numberValue(customCount),
      customFrequencyPeriod: customPeriod.value ? customPeriod.value as CustomFrequencyPeriod : undefined,
      people: Number(people.value),
      hourlyCost: numberValue(hourlyCost),
      tasks: checkedValues<AutomationTaskType>('diagnosis-task'),
      otherTaskNote: otherTaskNote.value.trim() || undefined,
      routineLevel: radioValue<RoutineLevel>('routine-level'),
      judgmentLevel: radioValue<JudgmentLevel>('judgment-level'),
      dataConsistency: radioValue<DataConsistency>('data-consistency'),
      exceptionLevel: radioValue<ExceptionLevel>('exception-level'),
      environments: checkedValues<AutomationEnvironment>('diagnosis-environment'),
      reportTitle: reportTitle.value.trim() || undefined,
    };
  }

  function clearMessages(): void {
    errorBox.hidden = true;
    errorBox.textContent = '';
    warningBox.hidden = true;
    warningBox.textContent = '';
  }

  function showMessages(messages: string[], warnings: string[] = []): void {
    errorBox.textContent = messages.join(' ');
    errorBox.hidden = messages.length === 0;
    warningBox.textContent = warnings.join(' ');
    warningBox.hidden = warnings.length === 0;
  }

  function validateStep(step: number): boolean {
    clearMessages();
    const input = readInput();
    const messages: string[] = [];
    const warnings: string[] = [];

    if (step === 1) {
      if (!Number.isFinite(input.minutesPerRun) || input.minutesPerRun <= 0) messages.push('1回あたりの作業時間を入力してください。');
      if (!Number.isInteger(input.people) || input.people <= 0) messages.push('作業人数は1人以上で入力してください。');
      if (input.frequency === 'custom') {
        if (!Number.isFinite(input.customFrequencyCount) || (input.customFrequencyCount ?? 0) <= 0) messages.push('実施回数を入力してください。');
        if (!input.customFrequencyPeriod) messages.push('実施回数の期間を選択してください。');
      }
      if (input.minutesPerRun > 1440) warnings.push('1回あたりの作業時間が24時間を超えています。入力内容をご確認ください。');
    }
    if (step === 2 && input.tasks.length === 0) messages.push('主な作業内容を1つ以上選択してください。');
    if (step === 4) {
      if (input.environments.length === 0) messages.push('使用している環境を1つ以上選択してください。');
      if (input.hourlyCost != null && input.hourlyCost < 0) messages.push('1時間あたりの人件費は0以上で入力してください。');
    }

    showMessages(messages, warnings);
    return messages.length === 0;
  }

  function reviewRow(label: string, value: string): HTMLElement {
    const row = document.createElement('div');
    row.className = 'diagnosis-review-row';
    const term = document.createElement('span');
    term.textContent = label;
    const detail = document.createElement('strong');
    detail.textContent = value;
    row.appendChild(term);
    row.appendChild(detail);
    return row;
  }

  function renderReview(): void {
    const input = readInput();
    review.replaceChildren();
    review.appendChild(reviewRow('1回の作業時間', `${input.minutesPerRun.toLocaleString('ja-JP')}分`));
    review.appendChild(reviewRow('頻度', input.frequency === 'custom'
      ? `${input.customFrequencyCount ?? 0}回 / ${input.customFrequencyPeriod === 'week' ? '週' : input.customFrequencyPeriod === 'month' ? '月' : '年'}`
      : FREQUENCY_LABELS[input.frequency]));
    review.appendChild(reviewRow('作業人数', `${input.people.toLocaleString('ja-JP')}人`));
    review.appendChild(reviewRow('主な作業', input.tasks.map((task) => TASK_LABELS[task]).join('、')));
    review.appendChild(reviewRow('手順', FEATURE_LABELS.routineLevel[input.routineLevel]));
    review.appendChild(reviewRow('人による判断', FEATURE_LABELS.judgmentLevel[input.judgmentLevel]));
    review.appendChild(reviewRow('データ形式', FEATURE_LABELS.dataConsistency[input.dataConsistency]));
    review.appendChild(reviewRow('例外処理', FEATURE_LABELS.exceptionLevel[input.exceptionLevel]));
    review.appendChild(reviewRow('利用環境', input.environments.map((item) => ENVIRONMENT_LABELS[item]).join('、')));
    review.appendChild(reviewRow('人件費', input.hourlyCost == null ? '未入力' : `1時間 ${input.hourlyCost.toLocaleString('ja-JP')}円`));
  }

  function renderResult(result: AutomationDiagnosisResult): void {
    resultSuitability.textContent = SUITABILITY_LABELS[result.scoring.suitability];
    resultSuitability.dataset.level = result.scoring.suitability;
    resultAnnualHours.textContent = formatHours(result.workload.annualHours);
    resultMonthlyHours.textContent = formatHours(result.workload.monthlyHours);
    resultAnnualRuns.textContent = `${Math.round(result.workload.annualRuns).toLocaleString('ja-JP')}回`;
    resultAnnualCost.textContent = formatMoney(result.workload.annualCost);
    resultGeneratedAt.textContent = formatGeneratedAt(result.generatedAt);
    resultReportTitle.textContent = result.input.reportTitle || '業務自動化診断レポート';
    setList(resultPositive, result.scoring.positiveFactors, '大きな加点要素はありません。');
    setList(resultCautions, result.scoring.cautionFactors, '大きな注意点はありません。');
    setList(resultAutomatable, result.recommendations.automatable, '定型部分の切り出しから検討します。');
    setList(resultHuman, result.recommendations.humanLed, '処理結果の最終確認を人が担当します。');
    setList(resultTechnologies, result.recommendations.technologies, '業務内容に合わせて実現方法を選びます。');
    resultSavedHours.textContent = formatHours(result.savings.savedHours);
    resultRemainingHours.textContent = formatHours(result.savings.remainingHours);
    resultSavedCost.textContent = result.savings.savedCost == null ? '人件費未入力' : `${Math.round(result.savings.savedCost).toLocaleString('ja-JP')}円`;
    reductionValue.textContent = `${result.savings.reductionRate}%`;
    reductionRange.value = String(result.savings.reductionRate);
    all<HTMLButtonElement>('[data-reduction-rate]').forEach((button) => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.reductionRate) === result.savings.reductionRate));
    });
  }

  function calculateAndRender(): boolean {
    const input = readInput();
    const validation = validateAutomationDiagnosisInput(input);
    showMessages(validation.messages, validation.warnings);
    if (!validation.valid) return false;
    renderResult(buildAutomationDiagnosisReport(input, reductionRate));
    return true;
  }

  function renderStep(step: number): void {
    currentStep = Math.max(1, Math.min(6, step));
    steps.forEach((element) => {
      element.hidden = Number(element.dataset.diagnosisStep) !== currentStep;
    });
    progress.textContent = `${currentStep} / 6 ${steps.find((element) => Number(element.dataset.diagnosisStep) === currentStep)?.dataset.stepLabel ?? ''}`;
    progressBar.style.width = `${(currentStep / 6) * 100}%`;
    prevButton.disabled = currentStep === 1 || currentStep === 6;
    prevButton.hidden = currentStep === 6;
    nextButton.hidden = currentStep === 6;
    nextButton.textContent = currentStep === 5 ? '診断結果を見る' : '次へ';
    clearMessages();
    if (currentStep === 5) renderReview();
    if (currentStep === 6) calculateAndRender();
    appRoot.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setCheckboxValues(name: string, values: string[]): void {
    const selected = new Set(values);
    all<HTMLInputElement>(`input[name="${name}"]`).forEach((checkbox) => {
      checkbox.checked = selected.has(checkbox.value);
    });
  }

  function setRadio(name: string, value: string): void {
    const target = all<HTMLInputElement>(`input[name="${name}"]`).find((radio) => radio.value === value);
    if (target) target.checked = true;
  }

  function fillInput(input: AutomationDiagnosisInput): void {
    minutes.value = String(input.minutesPerRun);
    frequency.value = input.frequency;
    customCount.value = input.customFrequencyCount == null ? '' : String(input.customFrequencyCount);
    customPeriod.value = input.customFrequencyPeriod ?? '';
    people.value = String(input.people);
    hourlyCost.value = input.hourlyCost == null ? '' : String(input.hourlyCost);
    reportTitle.value = input.reportTitle ?? '';
    otherTaskNote.value = input.otherTaskNote ?? '';
    setCheckboxValues('diagnosis-task', input.tasks);
    setCheckboxValues('diagnosis-environment', input.environments);
    setRadio('routine-level', input.routineLevel);
    setRadio('judgment-level', input.judgmentLevel);
    setRadio('data-consistency', input.dataConsistency);
    setRadio('exception-level', input.exceptionLevel);
    updateConditionalFields();
  }

  function updateConditionalFields(): void {
    customFrequency.hidden = frequency.value !== 'custom';
    otherTask.hidden = !all<HTMLInputElement>('input[name="diagnosis-task"]')
      .some((input) => input.value === 'other' && input.checked);
  }

  function reset(): void {
    fillInput({
      minutesPerRun: 30,
      frequency: 'weekly',
      people: 1,
      tasks: [],
      routineLevel: 'same',
      judgmentLevel: 'low',
      dataConsistency: 'same',
      exceptionLevel: 'low',
      environments: [],
    });
    reductionRate = 60;
    renderStep(1);
  }

  frequency.addEventListener('change', updateConditionalFields);
  all<HTMLInputElement>('input[name="diagnosis-task"]').forEach((input) => input.addEventListener('change', updateConditionalFields));

  prevButton.addEventListener('click', () => renderStep(getNextAutomationDiagnosisStep(currentStep, -1)));
  nextButton.addEventListener('click', () => {
    if (!validateStep(currentStep)) return;
    renderStep(getNextAutomationDiagnosisStep(currentStep, 1));
  });

  sampleButton.addEventListener('click', () => {
    fillInput(createAutomationDiagnosisSample());
    reductionRate = 60;
    renderStep(6);
  });

  resetButton.addEventListener('click', reset);
  restartButton.addEventListener('click', () => renderStep(1));

  all<HTMLButtonElement>('[data-reduction-rate]').forEach((button) => {
    button.addEventListener('click', () => {
      reductionRate = Number(button.dataset.reductionRate ?? 60);
      calculateAndRender();
    });
  });

  reductionRange.addEventListener('input', () => {
    const value = Number(reductionRange.value);
    reductionRate = [20, 40, 60, 80].reduce((closest, candidate) =>
      Math.abs(candidate - value) < Math.abs(closest - value) ? candidate : closest, 20);
    calculateAndRender();
  });

  printButton.addEventListener('click', () => window.print());

  reset();
}
