export interface Work {
  slug: string;
  title: string;
  summary: string;
  problem: string;
  solution: string[];
  impact: string[];
  technologies: string[];
  featured: boolean;
}

export const works: Work[] = [
  {
    slug: 'workflow-report-system',
    title: '業務工程・帳票管理システム',
    summary: '複数のExcel・手入力・帳票作成に分かれていた業務を、Web画面から一つの流れで扱える仕組みに再設計。',
    problem: '日々の入力、進捗確認、帳票作成が別々のファイルや手作業に分かれ、転記や確認に時間がかかる状態でした。',
    solution: [
      'ブラウザから入力・確認できる業務画面を構築',
      'Googleスプレッドシートをデータ基盤として整理',
      '入力済みデータから帳票・PDFを自動生成',
      '利用者が処理状態を把握できるUIへ改善',
    ],
    impact: [
      '入力から帳票出力までの流れを一元化',
      '転記作業と入力漏れの発生ポイントを削減',
      '既存のGoogle Workspaceを活かして導入負荷を抑制',
    ],
    technologies: ['Google Apps Script', 'Spreadsheet', 'HTML/CSS', 'PDF'],
    featured: true,
  },
  {
    slug: 'inventory-product-tool',
    title: '在庫・商品管理ツール',
    summary: '画像、商品情報、Excel入出力をまとめて扱える管理画面を構築し、更新作業をシンプルに。',
    problem: '商品画像と管理データが別々に存在し、更新や確認のたびに複数のファイルを行き来する必要がありました。',
    solution: [
      '商品情報を一覧で確認できるWeb管理画面を設計',
      '画像アップロードと商品データを関連付け',
      'Excelのダウンロード・アップロードによる一括編集に対応',
      '大量データでも迷いにくい操作導線を整理',
    ],
    impact: [
      '画像と商品データを一つの画面から確認可能',
      'Excelを利用した既存運用を残しつつ作業を効率化',
      '将来の外部サービス連携を見据えた構成へ整理',
    ],
    technologies: ['Web App', 'Google Apps Script', 'Spreadsheet', 'Drive', 'Excel'],
    featured: true,
  },
  {
    slug: 'ec-api-integration',
    title: 'EC商品登録・API連携',
    summary: '外部ECサービスのAPI認証から商品データ連携までを自動化し、手作業の登録工程を削減。',
    problem: '商品データを複数サービスへ手動登録する必要があり、件数が増えるほど作業時間と入力ミスが増える状態でした。',
    solution: [
      'OAuthを含むAPI認証フローを構築',
      '管理データをAPI送信用データへ変換',
      '登録結果とエラー内容を確認できる仕組みを実装',
      '将来的な一括処理を考慮して処理を分離',
    ],
    impact: [
      '繰り返しの登録作業を自動化できる基盤を構築',
      '登録エラーの確認と再処理を行いやすく改善',
      'データ管理と外部サービス連携の責務を整理',
    ],
    technologies: ['REST API', 'OAuth', 'Google Apps Script', 'JSON'],
    featured: true,
  },
  {
    slug: 'excel-business-application',
    title: 'Excel業務アプリケーション',
    summary: '複雑なExcel操作や計算処理を専用画面にまとめ、業務担当者が迷わず使える形へ。',
    problem: '多数のシート、関数、手順を理解していないと操作できず、担当者ごとの作業品質に差が出やすい状態でした。',
    solution: [
      '業務フローに合わせた入力・編集画面を設計',
      '既存Excelの計算ロジックとデータを活用',
      '更新・再計算・出力処理をボタン操作へ集約',
      '操作ミスを防ぐ入力チェックを追加',
    ],
    impact: [
      'Excelの内部構造を意識せず業務を実行可能',
      '操作手順の属人化を軽減',
      '既存資産を捨てずに段階的な改善が可能',
    ],
    technologies: ['Excel', 'VBA', 'Python', 'Web'],
    featured: false,
  },
  {
    slug: 'pdf-document-automation',
    title: 'PDF・帳票自動生成',
    summary: '入力データから定型帳票を自動生成し、印刷・保存まで含めた日常業務を効率化。',
    problem: '同じ内容を複数箇所へ転記しながら帳票を作成しており、作成時間と確認工数が積み重なっていました。',
    solution: [
      'マスタと入力データから帳票内容を自動構成',
      '複数ページ・印刷レイアウトを自動調整',
      'PDF保存とファイル命名を自動化',
      '再出力しやすいデータ構造へ整理',
    ],
    impact: [
      '帳票作成の繰り返し作業を削減',
      '記載内容のばらつきを抑制',
      '保存ルールを統一し、後から探しやすく改善',
    ],
    technologies: ['Google Apps Script', 'Spreadsheet', 'PDF', 'Excel'],
    featured: false,
  },
  {
    slug: 'bulk-data-processing',
    title: '業務用データ変換・一括処理',
    summary: 'CSV・Excelの大量データを検証・変換・出力する処理を自動化し、定型作業を短縮。',
    problem: '大量のデータを人手で整形・確認しており、データ量が増えると処理時間と見落としのリスクが高まっていました。',
    solution: [
      '入力データの形式チェックを自動化',
      '業務ルールに沿った変換・集計処理を実装',
      'エラー行を分離して再確認できる形に整理',
      '再利用しやすい一括処理フローを構築',
    ],
    impact: [
      '定型的なデータ整形時間を削減',
      '入力不備を処理前に検出',
      '件数増加に対応しやすい処理へ移行',
    ],
    technologies: ['Python', 'Excel', 'CSV', 'Database'],
    featured: false,
  },
];
