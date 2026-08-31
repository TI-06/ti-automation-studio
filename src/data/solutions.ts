export interface SolutionFaq {
  question: string;
  answer: string;
}

export interface SolutionDefinition {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  eyebrow: string;
  lead: string;
  answer: string;
  reasons: string[];
  approaches: { title: string; description: string; fit: string }[];
  steps: string[];
  costGuide: string;
  pitfalls: string[];
  faq: SolutionFaq[];
  relatedServiceSlug: string;
  relatedWorkSlugs: string[];
  relatedToolSlugs: string[];
  publishedAt: string;
}

export const solutions: SolutionDefinition[] = [
  {
    slug: 'excel-transfer-automation',
    title: 'Excelの転記作業を自動化する方法',
    seoTitle: 'Excelの転記を自動化する方法｜VBA・GAS・Pythonの選び方',
    description: 'ExcelからExcel、CSVからExcel、スプレッドシート間の転記を自動化する方法を、関数・VBA・GAS・Pythonの使い分けとともに解説します。',
    eyebrow: 'EXCEL TRANSFER AUTOMATION',
    lead: '毎日同じ表から同じ列をコピーして別ファイルへ貼り付けているなら、自動化できる可能性が高い作業です。ただし、転記元の形式が毎回変わるのか、複数人で使うのかによって適した方法は変わります。',
    answer: '転記ルールが固定されているなら、まず「入力元・出力先・変換ルール」を整理します。Excel内だけで完結する小規模処理はVBA、Google Workspace中心ならGAS、大量ファイルや複雑な加工がある場合はPythonが向いています。',
    reasons: [
      'コピー先の列やセルが決まっており、判断ルールを文章にできる',
      '転記前後に日付変換、文字置換、重複チェックなど同じ加工を繰り返している',
      '月次・週次・日次など一定頻度で同じ作業を行っている',
      '転記ミスや貼り付け先のずれを人の目で確認している',
    ],
    approaches: [
      { title: 'Excel関数・Power Query', description: '参照元が固定され、更新操作だけで済むならコードを書かずに対応できる場合があります。', fit: '構造が安定した集計・参照' },
      { title: 'VBA', description: '既存Excelをそのまま使い、ボタン一つで転記・整形・保存まで行いたいケースに向きます。', fit: 'Excel中心の社内運用' },
      { title: 'GAS', description: 'Googleスプレッドシート、Gmail、Driveと転記後の通知や保存までつなげたい場合に向きます。', fit: 'Google Workspace中心' },
      { title: 'Python', description: '大量ファイル、数万行以上、複雑な変換や検証を含む場合に処理を分離しやすい方法です。', fit: '大量・複雑なデータ処理' },
    ],
    steps: [
      '転記元と転記先のサンプルを用意する',
      'どの列をどこへ移すか、加工ルールを一覧にする',
      '空欄・重複・形式違いなど例外ケースを決める',
      '少量データで結果を比較し、本番件数で速度を確認する',
      '失敗時に元データを壊さない保存・ログ方法を決める',
    ],
    costGuide: '単純な転記だけなら小規模修正・単機能自動化の範囲に収まることが多い一方、複数ファイル、複雑な照合、帳票生成まで含むと業務ツールとして設計した方が安全です。料金目安ページでは規模ごとの考え方を公開しています。',
    pitfalls: [
      '画面操作をそのまま自動クリックするだけにして、データ構造を見ない',
      '列追加やファイル名変更だけで止まる固定位置依存の処理にする',
      'エラー行を無視して処理済みにしてしまう',
      '元ファイルを直接上書きし、失敗時に戻せなくする',
    ],
    faq: [
      { question: 'マクロを使わずに転記を自動化できますか？', answer: 'Power Queryや関数で十分な場合があります。ファイル操作や複数ステップが必要ならVBA、GAS、Pythonも候補になります。' },
      { question: '毎回列の位置が変わるExcelでも対応できますか？', answer: '見出し名で列を特定するなど、位置ではなく項目名を基準にすれば対応しやすくなります。' },
      { question: '既存ファイルを変更せずに自動化できますか？', answer: '可能です。元ファイルは読み取り専用にし、別ファイルへ出力する構成も選べます。' },
    ],
    relatedServiceSlug: 'excel-automation',
    relatedWorkSlugs: ['excel-business-application', 'bulk-data-processing'],
    relatedToolSlugs: ['data-cleaner', 'automation-diagnosis'],
    publishedAt: '2026-08-31',
  },
  {
    slug: 'excel-multiple-files-aggregation',
    title: '複数のExcelファイルを自動集計する方法',
    seoTitle: '複数Excelを自動集計する方法｜フォルダ内ファイルを一括処理',
    description: '複数のExcelファイルを開いてコピーする作業をなくすために、Power Query・VBA・Pythonでフォルダ内データを一括集計する考え方を解説します。',
    eyebrow: 'MULTIPLE EXCEL AGGREGATION',
    lead: '部署別・店舗別・月別に分かれたExcelを毎回開いて集計している場合、ファイル形式がある程度揃っていれば一括処理に置き換えられます。重要なのはファイルを開く操作ではなく、どのデータを同じ項目として扱うかを決めることです。',
    answer: '同じフォーマットのファイルをまとめるだけならPower Queryが第一候補です。出力帳票や細かな業務ルールまでExcel内で完結させるならVBA、ファイル数・行数が多く検証処理も必要ならPythonを検討します。',
    reasons: [
      '担当者ごとに同じフォーマットのExcelを提出している',
      '月末にフォルダ内のファイルを一つずつ開いて合計している',
      'ファイル名やシート名に年月・部署など集計キーが含まれている',
      '提出漏れ・重複・列形式の違いを毎回確認している',
    ],
    approaches: [
      { title: 'Power Query', description: 'フォルダから複数ファイルを取り込み、同一構造の表を結合する用途に強い方法です。', fit: '形式が揃った定期集計' },
      { title: 'VBA', description: '集計後に既存の報告シートへ反映したり、ボタン操作で一連の処理を完了したい場合に向きます。', fit: '既存Excelを中心に運用継続' },
      { title: 'Python', description: '大量ファイル、複数形式、データ検証、エラー一覧出力をまとめて処理したい場合に向きます。', fit: 'ファイル・行数が多い業務' },
    ],
    steps: [
      '対象フォルダに入るファイルの種類を洗い出す',
      '必須列とデータ型を決める',
      '提出漏れ・重複ファイル・空ファイルの扱いを決める',
      '集計結果と確認対象を分けて出力する',
      '翌月も同じ手順で再実行できる形にする',
    ],
    costGuide: '同じ形式のExcel結合だけなら比較的小さく実装できます。ファイルごとの形式差、エラー判定、集計表・グラフ・PDF出力まで含む場合は、単なる結合ではなくデータ処理ツールとして見積する方が現実的です。',
    pitfalls: [
      '一部ファイルだけ列名が違う状態を見落とす',
      '空白行や小計行までデータとして結合する',
      '同じファイルを二重に取り込んでも気付けない',
      '集計結果だけを出して、除外されたデータの理由を残さない',
    ],
    faq: [
      { question: 'ファイル数が毎月変わっても大丈夫ですか？', answer: 'フォルダ内の対象ファイルを自動取得する方式なら、件数が変わっても対応できます。' },
      { question: 'シート名がファイルごとに違う場合も集計できますか？', answer: '判定ルールを決められれば可能です。見出しや特定セルから対象シートを探す方法もあります。' },
      { question: '数万行以上でもExcelで処理できますか？', answer: '処理内容によります。重くなる場合はPythonで集計し、結果だけExcelへ戻す構成も有効です。' },
    ],
    relatedServiceSlug: 'python-data-processing',
    relatedWorkSlugs: ['bulk-data-processing', 'excel-business-application'],
    relatedToolSlugs: ['data-cleaner', 'dashboard-builder'],
    publishedAt: '2026-08-31',
  },
  {
    slug: 'vba-repair-outsourcing',
    title: 'VBAの修正を外注するときのポイント',
    seoTitle: 'VBA修正を外注する前に確認すること｜Excelマクロ改修の依頼方法',
    description: '動かないExcelマクロや引き継げないVBAを外注するときに、修正範囲、必要資料、費用が増えやすい条件、作り直し判断のポイントを解説します。',
    eyebrow: 'VBA REPAIR OUTSOURCING',
    lead: 'VBA修正では「エラー1個を直す」だけに見えても、外部ファイル、参照設定、Officeバージョン、既存の業務ルールが原因に絡むことがあります。依頼前にすべて整理する必要はありませんが、再現条件が分かると調査を早く始められます。',
    answer: '最低限、対象Excel、エラーが出る操作、期待する結果の3点があれば調査を開始できます。コードだけを切り出すより、実際の入力例と出力例も共有できる方が修正後の確認精度が上がります。',
    reasons: [
      '作成者が退職・異動してコードの意図が分からない',
      'Office更新やPC変更後から動かなくなった',
      '現在は動くが処理時間が長く、業務に支障が出ている',
      '既存機能を残したまま追加改修したい',
    ],
    approaches: [
      { title: '部分修正', description: '原因が限定され、既存構造が保守可能なら影響範囲を絞って修正します。', fit: 'エラー原因が比較的明確' },
      { title: '段階的な整理・改修', description: '動作を維持しながら、重複処理や固定値など今後の障害要因を必要な範囲で整理します。', fit: '今後も継続利用する重要ファイル' },
      { title: '部分的な作り直し', description: '巨大な1本のマクロ、外部依存が多い構成など、修正を積み重ねる方が危険な場合に選びます。', fit: '修正コストが継続的に増えている' },
    ],
    steps: [
      '対象ファイルとバックアップを分ける',
      'エラーが起きる操作を再現できるようにする',
      '正常時に期待する結果をサンプルで示す',
      '絶対に変えてはいけない計算式・帳票・操作を伝える',
      '修正後に確認する業務パターンを決める',
    ],
    costGuide: '小さなエラー修正は1〜5万円程度の範囲から検討できますが、原因調査、複数ブック連携、32/64bit対応、速度改善、仕様追加が重なると工数は増えます。見積時には「修正作業」と「調査作業」を分けて考えると比較しやすくなります。',
    pitfalls: [
      '本番ファイルだけを渡し、バックアップを残さない',
      'エラー画面だけ共有して入力データや操作手順を伝えない',
      '動いたかどうかだけ確認し、計算結果や出力内容を比較しない',
      '修正を繰り返し、全体構造が限界でも作り直し判断を先送りする',
    ],
    faq: [
      { question: 'VBAのコードが読めなくても依頼できますか？', answer: '可能です。利用者側でコードを説明できる必要はありません。操作手順と期待結果の方が重要です。' },
      { question: 'パスワード保護されたVBAは修正できますか？', answer: '正規に開発・利用権限があり、編集に必要なパスワードを提供できる場合に限り対応できます。' },
      { question: '修正と作り直しの判断も相談できますか？', answer: '可能です。影響範囲、今後の利用期間、追加改修予定を見て、どちらが妥当か整理します。' },
    ],
    relatedServiceSlug: 'vba-repair',
    relatedWorkSlugs: ['excel-business-application'],
    relatedToolSlugs: ['excel-diff', 'automation-diagnosis'],
    publishedAt: '2026-08-31',
  },
  {
    slug: 'gas-development-outsourcing',
    title: 'GAS開発を外注するときの費用と依頼方法',
    seoTitle: 'GAS開発を外注する費用・依頼方法｜Google Apps Scriptの見積ポイント',
    description: 'GAS開発を外注するときの費用目安、必要な情報、実行時間制限や権限を含む見積ポイント、既存スプレッドシートを使う場合の注意点を解説します。',
    eyebrow: 'GAS OUTSOURCING',
    lead: 'GASは小さな自動化からWebアプリまで作れるため、「GAS開発」という言葉だけでは見積幅が大きくなります。入力、処理、出力、利用人数、実行頻度を分けると必要な構成が見えやすくなります。',
    answer: '単純な通知や転記だけなら小規模に始められます。複数シート連携、PDF、Drive、Gmail、Web画面、外部APIまで含む場合は、一連の業務フローとして仕様を整理してから見積する方が追加費用を抑えやすくなります。',
    reasons: [
      'スプレッドシート入力後のメールやDrive保存を自動化したい',
      '複数人で同じシートを使い、入力ミスや更新漏れが増えている',
      '既存GASが遅い・止まる・担当者しか直せない',
      'ブラウザから操作できる簡易業務システムへ広げたい',
    ],
    approaches: [
      { title: '小規模スクリプト', description: '転記・通知・定期実行など一つの目的に絞って実装します。', fit: 'まず一作業を自動化したい' },
      { title: 'Google Workspace連携', description: 'Spreadsheet、Drive、Gmail、Calendarなどを一つの流れとして接続します。', fit: 'Google環境で業務が完結している' },
      { title: 'GAS Webアプリ', description: 'シートを直接触らず、入力・一覧・検索などをWeb画面から操作できるようにします。', fit: '複数利用者・操作制限が必要' },
    ],
    steps: [
      '現在のスプレッドシートと作業手順を共有する',
      '誰が・いつ・何件くらい処理するかを整理する',
      '自動化したい工程と人が確認する工程を分ける',
      '権限、トリガー、外部APIの有無を確認する',
      '例外時の通知・再実行方法まで決めてテストする',
    ],
    costGuide: '単機能であれば3〜10万円程度から検討しやすく、複数機能をまとめた業務ツールは10〜30万円程度が一つの目安です。API認証や複雑な権限制御、既存コード調査がある場合は個別に工数を確認します。',
    pitfalls: [
      'GASの実行時間・サービス割当を確認せず大量処理を一括実行する',
      '個人アカウントの権限に依存したまま業務運用する',
      'シートの列番号を固定し、列追加だけで処理が壊れる',
      '失敗ログや再実行方法を設けず、止まったことに気付けない',
    ],
    faq: [
      { question: '仕様書がなくてもGAS開発を依頼できますか？', answer: '可能です。現在のシートと作業手順から、必要な処理を整理する進め方ができます。' },
      { question: 'Google Workspaceの契約が必要ですか？', answer: '用途によります。個人Googleアカウントでも使える機能はありますが、組織運用ではWorkspaceの管理・権限設計も確認します。' },
      { question: '既存GASの改修だけでも依頼できますか？', answer: '可能です。エラー、速度、権限、機能追加など既存コードの調査から対応できます。' },
    ],
    relatedServiceSlug: 'gas-automation',
    relatedWorkSlugs: ['workflow-report-system', 'construction-site-operations'],
    relatedToolSlugs: ['automation-diagnosis'],
    publishedAt: '2026-08-31',
  },
  {
    slug: 'gas-pdf-automation',
    title: 'GASでPDFを自動作成する方法',
    seoTitle: 'GASでPDFを自動作成する方法｜スプレッドシートから帳票生成・Drive保存',
    description: 'Google Apps ScriptでスプレッドシートのデータからPDFを生成し、ファイル名付与、Drive保存、メール通知まで自動化する設計のポイントを解説します。',
    eyebrow: 'GAS PDF AUTOMATION',
    lead: '見積書、日報、報告書など、スプレッドシートの入力内容を毎回PDF化して名前を付けて保存しているなら、GASで一連の処理をまとめられます。帳票レイアウトと保存ルールを先に固定することが安定運用のポイントです。',
    answer: '基本構成は「対象データを取得 → 帳票テンプレートへ反映 → PDF生成 → ファイル名作成 → Drive保存」です。必要なら生成後にGmailで通知したり、処理結果を管理シートへ記録できます。',
    reasons: [
      'スプレッドシートから同じ形式のPDFを繰り返し作っている',
      '案件名・日付を手作業でファイル名へ付けている',
      '作成したPDFを担当者ごとのフォルダへ移動している',
      'PDF作成後にメール送信やステータス更新も行っている',
    ],
    approaches: [
      { title: 'スプレッドシートをそのままPDF化', description: '既存シートの印刷範囲・余白を整え、対象シートをPDFとして出力します。', fit: '現在の帳票レイアウトを活かしたい' },
      { title: '帳票テンプレートへ転記してPDF化', description: 'データシートと帳票シートを分け、対象レコードをテンプレートへ反映して出力します。', fit: '複数案件を同じ様式で出力' },
      { title: 'HTMLからPDF用データを生成', description: 'レイアウト自由度が必要な場合は、用途に応じてHTMLや別方式を検討します。', fit: 'シート印刷では表現しにくい帳票' },
    ],
    steps: [
      '元データと完成PDFのサンプルを用意する',
      '1ページあたりの行数、印刷範囲、改ページ条件を決める',
      'ファイル名と保存フォルダの規則を決める',
      '同名ファイル・再発行時の扱いを決める',
      '複数件を連続生成した場合の実行時間を確認する',
    ],
    costGuide: '既存帳票を一種類PDF化するだけなら単機能自動化として進めやすい案件です。複数帳票、行数によるページ分割、承認フロー、メール送信、フォルダ自動作成まで含むと業務ツールとして設計する方が保守しやすくなります。',
    pitfalls: [
      '印刷範囲を固定したまま行数が増え、PDFが途中で切れる',
      '同名ファイルを上書きして過去版が分からなくなる',
      '大量PDFを一度に作り、GASの実行時間制限へ到達する',
      '生成成功だけを見て、PDFのページ数・内容を検証しない',
    ],
    faq: [
      { question: '複数のPDFを一括で作れますか？', answer: '可能です。対象件数が多い場合は実行時間を考慮し、分割処理や再開できる設計にします。' },
      { question: 'PDFを案件ごとのDriveフォルダへ保存できますか？', answer: '可能です。案件コードや年月などから保存先を検索・作成する処理を組み込めます。' },
      { question: 'PDF作成後に自動メール送信できますか？', answer: '可能です。宛先・件名・本文のルールを決め、生成したPDFを添付またはリンクで通知できます。' },
    ],
    relatedServiceSlug: 'pdf-document-automation',
    relatedWorkSlugs: ['pdf-document-automation', 'construction-site-operations'],
    relatedToolSlugs: ['automation-diagnosis'],
    publishedAt: '2026-08-31',
  },
];

export const getSolutionBySlug = (slug: string) => solutions.find((solution) => solution.slug === slug);
