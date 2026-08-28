import type { AutomationDiagnosisInput, AutomationRecommendations } from './types';

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function buildAutomationRecommendations(input: AutomationDiagnosisInput): AutomationRecommendations {
  const automatable: string[] = [];
  const humanLed: string[] = [];
  const technologies: string[] = [];

  const hasTask = (...tasks: AutomationDiagnosisInput['tasks'][number][]) => tasks.some((task) => input.tasks.includes(task));
  const hasEnvironment = (...items: AutomationDiagnosisInput['environments'][number][]) => items.some((item) => input.environments.includes(item));

  if (hasTask('excel-input', 'file-transfer', 'aggregation') || hasEnvironment('excel')) {
    if (hasTask('excel-input')) automatable.push('入力の自動反映');
    if (hasTask('file-transfer')) automatable.push('ファイル間転記');
    if (hasTask('aggregation')) automatable.push('定型集計');
    automatable.push('一括処理');
    technologies.push('Excel / VBA', 'Python');
  }

  if (hasTask('verification')) {
    automatable.push('定型ルールによる照合', '差分確認の支援');
    technologies.push('Excel / VBA', 'Python');
  }

  if (hasTask('email')) {
    automatable.push('定型メール送信', '送信対象の自動抽出');
  }

  if (hasTask('pdf-report')) {
    automatable.push('PDF・帳票の自動作成', '定型レポート出力');
    technologies.push('Excel / VBA', 'Python');
  }

  if (hasTask('web-input')) {
    automatable.push('入力データの整形', 'Web入力前のチェック');
    technologies.push('Webツール');
  }

  if (hasTask('file-management')) {
    automatable.push('ファイル名の自動整理', 'フォルダへの自動保存');
  }

  if (hasTask('external-registration') || hasEnvironment('external-web')) {
    automatable.push('データ変換', 'API連携', '登録結果管理');
    technologies.push('API連携');
  }

  if (hasEnvironment('google-sheets', 'google-workspace')) {
    automatable.push('スプレッドシート連携', 'Gmail定型通知', 'Drive保存', '定期処理');
    technologies.push('Google Apps Script');
  }

  if (hasEnvironment('internal-web') || input.people >= 2) {
    automatable.push('入力画面', '一覧・検索', '状態管理');
    technologies.push('Webツール');
  }

  if (input.judgmentLevel === 'high') humanLed.push('内容の最終判断');
  else if (input.judgmentLevel === 'some') humanLed.push('判断が必要な箇所の確認');

  if (input.exceptionLevel === 'high') humanLed.push('例外時の判断');
  else if (input.exceptionLevel === 'some') humanLed.push('例外発生時の確認');

  if (hasTask('approval')) humanLed.push('承認そのもの');
  if (input.dataConsistency === 'different') humanLed.push('形式が異なるデータの確認');
  if (input.routineLevel === 'different') humanLed.push('毎回変わる手順の判断');

  if (humanLed.length === 0) humanLed.push('処理結果の最終確認');
  if (automatable.length === 0) automatable.push('定型部分だけを切り出した部分自動化');
  if (technologies.length === 0) technologies.push('Webツール');

  return {
    automatable: unique(automatable),
    humanLed: unique(humanLed),
    technologies: unique(technologies),
  };
}
