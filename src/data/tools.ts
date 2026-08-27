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
