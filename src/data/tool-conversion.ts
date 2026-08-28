export type ToolSource =
  | 'excel-diff'
  | 'data-cleaner'
  | 'dashboard-builder'
  | 'automation-diagnosis';

export interface ToolConversionConfig {
  source: ToolSource;
  contextLabel: string;
  category: string;
  resultTitle: string;
  resultDescription: string;
  serviceHref: string;
  serviceLabel: string;
  contactLabel: string;
}

export const TOOL_CONVERSION_CONFIG: Record<ToolSource, ToolConversionConfig> = {
  'excel-diff': {
    source: 'excel-diff',
    contextLabel: 'Excel差分比較ツールからのご相談',
    category: 'Excel・スプレッドシート自動化',
    resultTitle: '毎回この比較作業をしていますか？',
    resultDescription: '複数ファイルの一括比較、定期実行、差分結果の自動保存や通知まで専用化できます。',
    serviceHref: '/services/excel-automation',
    serviceLabel: 'Excel自動化を見る',
    contactLabel: 'この比較作業を相談する',
  },
  'data-cleaner': {
    source: 'data-cleaner',
    contextLabel: 'CSV・Excelデータ整理ツールからのご相談',
    category: 'Python・データ処理',
    resultTitle: '毎回同じデータ整理をしていますか？',
    resultDescription: '定期CSVの整形、重複除去、複数ファイル統合、別システム用フォーマット変換を一括処理できます。',
    serviceHref: '/services/python-data-processing',
    serviceLabel: 'データ処理自動化を見る',
    contactLabel: 'このデータ整理を相談する',
  },
  'dashboard-builder': {
    source: 'dashboard-builder',
    contextLabel: 'Excel・CSVダッシュボード作成ツールからのご相談',
    category: 'Excel・スプレッドシート自動化',
    resultTitle: '毎月この集計・グラフ更新をしていますか？',
    resultDescription: 'ファイルを置くだけで更新する仕組みや、複数人で共有する常設ダッシュボードへ発展できます。',
    serviceHref: '/services/excel-automation',
    serviceLabel: 'Excel自動化を見る',
    contactLabel: 'この集計業務を相談する',
  },
  'automation-diagnosis': {
    source: 'automation-diagnosis',
    contextLabel: '業務自動化診断ツールからのご相談',
    category: 'その他・まだ分からない',
    resultTitle: '診断した業務を、実際の改善設計まで整理できます。',
    resultDescription: '全自動にする部分と、人の判断を残す部分を分けて、既存環境に合う構成を検討できます。',
    serviceHref: '/services',
    serviceLabel: '業務自動化サービスを見る',
    contactLabel: '診断した業務を相談する',
  },
};

export function parseToolSource(value: string | null | undefined): ToolSource | null {
  if (!value) return null;
  return Object.prototype.hasOwnProperty.call(TOOL_CONVERSION_CONFIG, value)
    ? value as ToolSource
    : null;
}

export function toolContactHref(source: ToolSource): string {
  return `/contact?source=${source}`;
}
