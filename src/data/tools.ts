export interface Tool {
  slug: string;
  title: string;
  shortLabel: string;
  description: string;
  technologies: string[];
  formats: string[];
  processing: 'ブラウザ内処理' | 'サーバー処理';
  features: string[];
  href: string;
  demoUrl?: string;
  githubUrl?: string;
  published: boolean;
  featured: boolean;
}

// 既存リポジトリは秘密情報・顧客情報・ライセンス・UI品質の確認後に published: true へ変更する。
export const tools: Tool[] = [
  {
    slug: 'excel-diff',
    title: 'Excel差分比較・変更箇所チェッカー',
    shortLabel: 'Excel差分比較',
    description: '2つのExcelを比較して、値・行・列・シート・数式の変更箇所を確認できます。',
    technologies: ['Excel', 'TypeScript', 'Web Worker'],
    formats: ['XLSX', 'XLS'],
    processing: 'ブラウザ内処理',
    features: ['変更・追加・削除を検出', '行を特定する列で照合', '差分結果をExcelで保存'],
    href: '/tools/excel-diff',
    published: true,
    featured: true,
  },
  {
    slug: 'data-cleaner',
    title: 'CSV・Excel データ整理・クレンジングツール',
    shortLabel: 'データ整理',
    description: '重複、余分な空白、全角半角、日付形式、表記の違いなどを見つけ、必要な修正だけ確認して適用できます。',
    technologies: ['CSV', 'Excel', 'TypeScript', 'Web Worker'],
    formats: ['CSV', 'XLSX', 'XLS'],
    processing: 'ブラウザ内処理',
    features: ['8種類のデータ健康診断', '修正前プレビューと元に戻す', 'CSV・Excelで整理済みデータを保存'],
    href: '/tools/data-cleaner',
    published: true,
    featured: true,
  },
  {
    slug: 'dashboard-builder',
    title: 'Excel・CSV ダッシュボード自動作成ツール',
    shortLabel: 'ダッシュボード作成',
    description: 'Excel・CSVを読み込み、KPI・推移・分類別集計・ランキングを自動で見える化します。',
    technologies: ['CSV', 'Excel', 'Chart.js', 'Web Worker'],
    formats: ['CSV', 'XLSX', 'XLS'],
    processing: 'ブラウザ内処理',
    features: ['列の種類を自動判定', 'KPI・グラフ・ランキングを自動生成', '画像・PDF・Excel・設定JSONで保存'],
    href: '/tools/dashboard-builder',
    published: true,
    featured: true,
  },
  {
    slug: 'automation-diagnosis',
    title: '業務自動化診断・工数削減シミュレーター',
    shortLabel: '業務自動化診断',
    description: '作業時間・頻度・人数・作業内容から、現在工数、自動化適性、改善候補、削減シミュレーションを確認できます。',
    technologies: ['TypeScript', 'Rule Engine', 'Browser'],
    formats: [],
    processing: 'ブラウザ内処理',
    features: ['現在工数と年間コストを試算', '説明可能なルールで自動化適性を判定', '改善候補と削減シミュレーションをPDF保存'],
    href: '/tools/automation-diagnosis',
    published: true,
    featured: true,
  },
  {
    slug: 'automation-sample',
    title: '業務自動化サンプル',
    shortLabel: '業務自動化サンプル',
    description: '入力・処理・結果確認までの流れを体験できる小型デモ。公開版を準備中です。',
    technologies: ['Web', 'Automation'],
    formats: [],
    processing: 'ブラウザ内処理',
    features: ['入力から処理までの流れを確認', '結果表示のUIを体験', '公開前の安全確認中'],
    href: '/tools/automation-sample',
    published: false,
    featured: true,
  },
  {
    slug: 'data-processing-sample',
    title: 'データ処理サンプル',
    shortLabel: 'データ処理サンプル',
    description: 'CSV・Excelを想定したデータ検証と一括処理のデモ。公開前の安全確認を進めています。',
    technologies: ['Python', 'CSV', 'Excel'],
    formats: ['CSV', 'XLSX'],
    processing: 'ブラウザ内処理',
    features: ['データ検証', '一括処理', '公開前の安全確認中'],
    href: '/tools/data-processing-sample',
    published: false,
    featured: true,
  },
];

export const publishedTools = tools.filter((tool) => tool.published);
