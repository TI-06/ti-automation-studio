export interface ServiceFaq {
  question: string;
  answer: string;
}

export interface ServiceDefinition {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  eyebrow: string;
  hero: string;
  visual: string;
  visualAlt: string;
  problems: string[];
  capabilities: { title: string; description: string }[];
  flow: { before: string; process: string; after: string };
  examples: string[];
  fit: string[];
  notFit: string[];
  technologies: string[];
  relatedWorkSlugs: string[];
  relatedServiceSlugs: string[];
  faq: ServiceFaq[];
}

export const services: ServiceDefinition[] = [
  {
    slug: 'excel-automation',
    title: 'Excel・VBA業務自動化',
    seoTitle: 'Excel自動化・VBA開発｜繰り返し作業を業務改善',
    description: 'Excelの転記・集計・帳票作成・ファイル処理を自動化。既存のExcelを活かしながら、VBAやPythonも組み合わせて日々の定型業務を効率化します。',
    eyebrow: 'EXCEL AUTOMATION',
    hero: '毎日開くExcelを、毎日頑張って操作しなくていい仕組みへ。',
    visual: '/service-visuals/excel-automation.svg',
    visualAlt: '複数のExcel表からデータを集約し、集計・レポート・帳票へ自動変換する業務フローのイメージ',
    problems: [
      '毎日・毎月、同じセルや別ファイルへ転記している',
      '複数ブックを開いて集計し、最後に報告用の表を作っている',
      '担当者しか分からないマクロや複雑なシート構成になっている',
      'ExcelからPDFやCSVを出す作業を何度も繰り返している',
    ],
    capabilities: [
      { title: '転記・集計の自動化', description: '複数シートや複数ファイルから必要なデータを集め、指定形式へまとめます。' },
      { title: '入力画面・操作の整理', description: '複雑なセル操作を減らし、必要な項目とボタンに絞った運用へ整えます。' },
      { title: '帳票・ファイル出力', description: '入力済みデータからPDF、CSV、別Excelなどを一定ルールで生成します。' },
      { title: '既存Excelの改修', description: '使い慣れたファイルを捨てず、処理速度・保守性・操作性を段階的に改善します。' },
    ],
    flow: {
      before: '複数ファイルを開く → コピー → 集計 → 確認 → 保存',
      process: '入力・集計ルールを整理し、VBA / Python / 関数を適材適所で自動化',
      after: '必要な入力だけ行い、集計・検証・出力はボタンや一括処理へ',
    },
    examples: [
      '月次実績を複数Excelから集計し、決まったフォーマットへ反映',
      '商品・顧客データを一括更新し、エラー行だけ確認できるようにする',
      '入力値をもとに見積書・報告書・PDFを自動生成',
      '複雑な既存ブックの操作を専用画面やボタンへまとめる',
    ],
    fit: ['今のExcel運用を大きく変えず改善したい', '繰り返しの転記や集計が多い', '既存VBAの改修・引き継ぎも含めて相談したい'],
    notFit: ['多数ユーザーが同時編集する基幹システム用途', 'Excelを使わない方が明らかに運用しやすい大規模ワークフロー'],
    technologies: ['Excel', 'VBA', 'Python', 'CSV', 'PDF'],
    relatedWorkSlugs: ['excel-business-application', 'bulk-data-processing', 'pdf-document-automation'],
    relatedServiceSlugs: ['python-data-processing', 'pdf-document-automation'],
    faq: [
      { question: '今使っているExcelをそのまま改善できますか？', answer: '可能です。既存の入力方法や計算式を残し、負担の大きい部分だけを自動化する進め方もできます。' },
      { question: 'VBA以外の方法になることもありますか？', answer: 'あります。データ量や処理内容によってはPythonやGAS、Web化の方が保守しやすい場合があるため、業務に合わせて提案します。' },
      { question: '仕様書がなくても相談できますか？', answer: '現在のファイルと作業手順、困っている点が分かれば整理できます。最初から完成した仕様書は不要です。' },
    ],
  },
  {
    slug: 'gas-automation',
    title: 'GAS・Google Workspace業務自動化',
    seoTitle: 'GAS業務自動化・Google Apps Script開発',
    description: 'Google Apps Script（GAS）でスプレッドシート、Drive、Gmailなどの業務を連携。入力・通知・ファイル生成・Webアプリ化までGoogle Workspaceを活用して自動化します。',
    eyebrow: 'GAS AUTOMATION',
    hero: 'スプレッドシートの先にある作業まで、ひとつの流れにつなげる。',
    visual: '/service-visuals/gas-automation.svg',
    visualAlt: '表計算、メール、ファイル保管、Web画面をGASでつなぎ業務を自動化するイメージ',
    problems: [
      'スプレッドシート入力後にメール送信やファイル作成を手動で行っている',
      '複数人で使う表が増え、どこを更新すればいいか分かりにくい',
      'Google Drive内のファイル作成・整理・命名を毎回手作業で行っている',
      '専用システムほど大げさではないが、ブラウザで使える業務画面がほしい',
    ],
    capabilities: [
      { title: 'スプレッドシート連携', description: '入力・検索・更新・集計をGASでまとめ、手作業の転記を減らします。' },
      { title: '通知・定期処理', description: '条件に応じたメール通知や時間主導の定期処理を組み込みます。' },
      { title: 'Drive・帳票連携', description: 'フォルダ作成、テンプレート複製、PDF生成、保存まで一連で処理します。' },
      { title: 'GAS Webアプリ', description: 'スプレッドシートを直接触らず、ブラウザの入力・管理画面から操作できる形にします。' },
    ],
    flow: {
      before: '表へ入力 → 別シートへ転記 → メール → Drive保存 → 状況確認',
      process: 'GASでデータ・通知・ファイル・画面をひとつの業務フローへ接続',
      after: '入力を起点に必要な処理が連動し、利用者は結果だけを確認',
    },
    examples: [
      '申請内容を一覧化し、担当者へ自動通知してステータスを管理',
      '入力データから帳票PDFを生成し、案件別フォルダへ保存',
      '工程・日報・安全帳票など複数業務をWeb画面から管理',
      'Google Workspace内の定型ファイル・メール処理を定期実行',
    ],
    fit: ['Google Workspaceをすでに業務で使っている', '小〜中規模の社内ツールを早く作りたい', 'スプレッドシートをデータ基盤として活用したい'],
    notFit: ['非常に高負荷なリアルタイム処理', '大規模DBや厳格なトランザクションが中心の基幹システム'],
    technologies: ['Google Apps Script', 'Spreadsheet', 'Drive', 'Gmail', 'HTML/CSS'],
    relatedWorkSlugs: ['workflow-report-system', 'construction-site-operations', 'inventory-product-tool'],
    relatedServiceSlugs: ['pdf-document-automation', 'api-integration'],
    faq: [
      { question: 'GASでどこまでシステム化できますか？', answer: '入力画面、一覧、検索、通知、PDF生成、Drive連携、外部API連携など、小〜中規模の業務システムであれば幅広く対応できます。' },
      { question: '既存のスプレッドシートを使えますか？', answer: '可能です。現在の列や運用を確認し、そのまま活かす部分と整理する部分を分けて設計します。' },
      { question: 'GASの実行時間制限が心配です。', answer: 'データ量や処理内容を確認し、分割処理・キャッシュ・別技術への切り分けも含めて設計します。' },
    ],
  },
  {
    slug: 'python-data-processing',
    title: 'Python・CSV・大量データ処理',
    seoTitle: 'Python業務自動化・CSV/Excel大量データ処理',
    description: 'PythonでCSV・Excel・大量ファイルの検証、整形、変換、集計を一括処理。人が目視・コピーしているデータ加工を再現性のある処理へ置き換えます。',
    eyebrow: 'DATA PROCESSING',
    hero: '大量のファイルを、人が一つずつ確認しなくていい処理へ。',
    visual: '/service-visuals/python-data-processing.svg',
    visualAlt: '大量のCSVやExcelファイルが処理エンジンを通り、整理済みデータと分析結果へ変換されるイメージ',
    problems: ['CSVやExcelを毎回同じルールで加工している', 'ファイル数が多く、開いて確認するだけで時間がかかる', 'データ形式の違いや入力ミスを目視で探している', '数万〜数十万行の処理でExcelが重くなる'],
    capabilities: [
      { title: '一括変換', description: '複数ファイルをまとめて読み込み、列追加・置換・結合・分割・形式変換を実行します。' },
      { title: 'データ検証', description: '必須値、形式、重複、整合性などの条件を自動判定し、確認対象を絞ります。' },
      { title: '大量データ集計', description: 'Excelでは重くなりやすいデータも、Pythonで効率よく集計・出力します。' },
      { title: '定期・再実行できる処理', description: '担当者の手順ではなくプログラムとしてルールを残し、同じ結果を再現できる形にします。' },
    ],
    flow: { before: '大量ファイルを開く → 手で整形 → エラー確認 → 保存', process: 'Pythonで読込・検証・変換・集計ルールをパイプライン化', after: 'フォルダ単位で一括処理し、正常データと確認対象を自動出力' },
    examples: ['数百CSVのフォーマット統一と結合', '商品データの必須項目・重複・形式チェック', 'Excel台帳から登録用CSVを一括生成', '複数年度・複数部署データの集計とレポート用データ作成'],
    fit: ['ファイル数・行数が多い', '同じ加工ルールを繰り返している', 'エラー箇所だけ人が確認する形にしたい'],
    notFit: ['数件だけを年に一度処理する単純作業', 'リアルタイムの共同編集画面が主目的の業務'],
    technologies: ['Python', 'pandas', 'CSV', 'Excel', 'JSON'],
    relatedWorkSlugs: ['bulk-data-processing', 'inventory-product-tool', 'excel-business-application'],
    relatedServiceSlugs: ['excel-automation', 'api-integration'],
    faq: [
      { question: '何万行くらいまで処理できますか？', answer: '処理内容と実行環境によりますが、Excelで重くなる規模でもPythonなら扱いやすいケースが多いです。実データ量を確認して方式を決めます。' },
      { question: '実行するたびにPythonを操作する必要がありますか？', answer: '用途に応じてダブルクリック実行、Web画面、定期処理など、利用者がコードを触らない形にもできます。' },
      { question: 'エラーのあるデータだけ分けられますか？', answer: '可能です。正常データと確認が必要な行を分け、理由も一緒に出力する設計ができます。' },
    ],
  },
  {
    slug: 'api-integration',
    title: 'API・ECサービス連携',
    seoTitle: 'API連携開発・EC業務自動化｜OAuth対応',
    description: '外部サービスのAPI・OAuth認証を使い、商品登録、データ取得、更新、同期を自動化。複数サービス間の手入力を減らし、エラー確認まで含めた連携を構築します。',
    eyebrow: 'API INTEGRATION',
    hero: '別々のサービスを、コピー&ペーストではなくデータでつなぐ。',
    visual: '/service-visuals/api-integration.svg',
    visualAlt: '複数のEC・Webサービスが認証されたAPI連携ハブを通じて安全にデータ同期するイメージ',
    problems: ['同じ商品・顧客情報を複数サービスへ入力している', 'CSV出力と取込を人が繰り返している', 'APIを使いたいがOAuth認証やトークン管理が分からない', '自動登録に失敗したとき、原因や対象データを追えない'],
    capabilities: [
      { title: 'API認証', description: 'APIキー、OAuth、アクセストークン更新など、サービス仕様に合わせた認証フローを構築します。' },
      { title: '登録・更新・取得', description: '管理データを外部API向けに変換し、商品登録や情報更新、データ取得を自動化します。' },
      { title: '同期・差分処理', description: 'すべてを毎回送らず、更新対象だけを判定して連携する設計にも対応します。' },
      { title: 'ログ・再処理', description: '成功・失敗を記録し、エラー内容を確認して対象だけ再実行しやすくします。' },
    ],
    flow: { before: '管理画面Aからコピー → サービスBへ入力 → サービスCも更新', process: '認証・データ変換・API通信・結果記録を連携処理として実装', after: '元データを更新すると必要なサービスへ同期し、結果を一覧で確認' },
    examples: ['商品マスタからECサービスへ商品情報を登録', '注文・在庫情報を取得して社内管理データへ反映', 'OAuth認証が必要な外部サービスとGAS/Webシステムを連携', 'APIエラーをログ化し、失敗データだけ再処理'],
    fit: ['複数サービスへ同じ情報を入力している', 'API仕様書はあるが実装方法が分からない', '認証からエラー処理までまとめて構築したい'],
    notFit: ['提供元がAPIや連携手段を公開していないサービス', '利用規約で自動化が禁止されている操作'],
    technologies: ['REST API', 'OAuth', 'JSON', 'Google Apps Script', 'Python'],
    relatedWorkSlugs: ['ec-api-integration', 'inventory-product-tool'],
    relatedServiceSlugs: ['gas-automation', 'python-data-processing'],
    faq: [
      { question: 'APIキーの取得から相談できますか？', answer: '可能です。サービス側の開発者登録、認証方式、必要権限を整理し、取得後の実装まで案内できます。' },
      { question: 'OAuthのトークン更新にも対応できますか？', answer: '対応できます。リフレッシュトークンなどサービス仕様に合わせ、継続運用できる認証処理を組み込みます。' },
      { question: 'API連携できるか分からないサービスも相談できますか？', answer: 'まず公式APIや提供機能を確認し、実現可能な範囲と代替案を整理します。' },
    ],
  },
  {
    slug: 'pdf-document-automation',
    title: 'PDF・帳票自動生成',
    seoTitle: 'PDF帳票自動生成｜Excel・GASの帳票作成を自動化',
    description: 'Excelやスプレッドシートの入力データから見積書・報告書・日報などの定型帳票を自動生成。PDF化、ファイル名付与、保存まで一括で効率化します。',
    eyebrow: 'DOCUMENT AUTOMATION',
    hero: '入力した情報を、もう一度帳票へ打ち直さない。',
    visual: '/service-visuals/pdf-document-automation.svg',
    visualAlt: '入力データから複数種類の帳票やPDFを自動生成し、保存・送信する業務フローのイメージ',
    problems: ['同じ内容を複数の帳票へ何度も転記している', '毎日・毎週、同じ形式のPDFを手作業で作っている', '印刷範囲や改ページの調整に時間がかかる', 'ファイル名や保存フォルダのルールが人によって違う'],
    capabilities: [
      { title: 'テンプレートから自動生成', description: '入力済みデータを指定位置へ反映し、決まった書式の帳票を作ります。' },
      { title: '複数帳票を一括作成', description: '対象者・案件・日付などの条件で複数PDFをまとめて生成できます。' },
      { title: '印刷レイアウト調整', description: '行数やページ数を考慮し、A4縦横・余白・改ページなどを運用に合わせます。' },
      { title: '命名・保存まで自動化', description: '案件名や日付を使ったファイル名を付け、指定フォルダへ自動保存します。' },
    ],
    flow: { before: '元データを見る → 帳票へ転記 → レイアウト確認 → PDF化 → 名前を付けて保存', process: 'テンプレート・出力条件・保存ルールを自動生成処理へ集約', after: '元データを選ぶだけで、必要な帳票PDFが規則どおりに完成' },
    examples: ['日報・安全帳票・作業報告書を入力データから生成', '見積・請求・集計帳票を案件単位で一括PDF化', '複数シートを決まった順番でPDFへまとめる', 'PDF生成後に指定フォルダへ保存し、必要に応じて通知'],
    fit: ['定型帳票を繰り返し作っている', '入力元データがExcelやスプレッドシートにある', '作成だけでなく命名・保存まで揃えたい'],
    notFit: ['毎回デザインが大きく変わるクリエイティブ制作', '紙の原本しかなく元データが構造化されていない業務'],
    technologies: ['PDF', 'Excel', 'Google Apps Script', 'Spreadsheet', 'HTML/CSS'],
    relatedWorkSlugs: ['pdf-document-automation', 'workflow-report-system', 'construction-site-operations'],
    relatedServiceSlugs: ['gas-automation', 'excel-automation'],
    faq: [
      { question: '今使っている帳票の見た目を保てますか？', answer: '元のExcelやテンプレートを確認し、可能な範囲で現在のレイアウトを活かして自動化します。' },
      { question: '一度に複数のPDFを作れますか？', answer: '可能です。対象データを条件で抽出し、案件別・日付別などの単位で一括生成できます。' },
      { question: '保存先も自動で分けられますか？', answer: '可能です。案件名や年月などを使ってフォルダを選択・作成し、規則的に保存できます。' },
    ],
  },
];

export const getServiceBySlug = (slug: string) => services.find((service) => service.slug === slug);
