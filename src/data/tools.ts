export interface Tool {
  slug: string;
  title: string;
  description: string;
  technologies: string[];
  demoUrl?: string;
  githubUrl?: string;
  published: boolean;
  featured: boolean;
}

// 既存リポジトリは秘密情報・顧客情報・ライセンス・UI品質の確認後に published: true へ変更する。
export const tools: Tool[] = [
  {
    slug: 'automation-sample',
    title: '業務自動化サンプル',
    description: '入力・処理・結果確認までの流れを体験できる小型デモ。公開版を準備中です。',
    technologies: ['Web', 'Automation'],
    published: false,
    featured: true,
  },
  {
    slug: 'data-processing-sample',
    title: 'データ処理サンプル',
    description: 'CSV・Excelを想定したデータ検証と一括処理のデモ。公開前の安全確認を進めています。',
    technologies: ['Python', 'CSV', 'Excel'],
    published: false,
    featured: true,
  },
];

export const publishedTools = tools.filter((tool) => tool.published);
