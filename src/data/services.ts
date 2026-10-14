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
  /** 実務上の判断材料。成果値の断定や架空の顧客情報は含めない。 */
  decisionLead: string;
  decisionPoints: { title: string; detail: string }[];
  deliveryChecks: { title: string; detail: string }[];
  preparation: string[];
  priorityGuideSlugs: string[];
}

export const services: ServiceDefinition[] = [
  {
    slug: 'excel-automation',
    title: 'Excel・VBA業務自動化',
    seoTitle: 'Excel自動化・VBA開発｜転記・集計・マクロ改修',
    description: 'Excelの転記・月次集計・VBAマクロ修正・PDF帳票出力に対応。既存ブックの関数や操作を活かし、業務に合った自動化の方法と費用を整理します。',
    eyebrow: 'Excel・VBA',
    hero: '転記・集計・帳票作成など、Excelで繰り返している作業を減らします。',
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
    decisionLead: 'Excelを使い続けるのか、PythonやGASへ処理を分けるのかは、ファイル数だけでは決まりません。更新頻度、利用人数、入力形式の揺れ、処理後の確認方法まで含めて判断します。',
    decisionPoints: [
      { title: 'Excel・Power Queryが合う', detail: '同じ形式のファイルを定期的に集計し、利用者が更新操作を行える場合。複雑な入力UIや例外処理が不要なら、マクロを増やさない方法を先に検討します。' },
      { title: 'VBAが合う', detail: '既存ブックの計算式や帳票レイアウトを残し、Excel内のボタンから転記・検証・保存まで実行する場合。既存マクロの改修では、どの処理から呼ばれているかも確認します。' },
      { title: 'Python・GASが合う', detail: '大量ファイルの一括変換、外部サービスとの連携、共有運用など、Excelだけに処理を集めると保守しにくい場合。元のExcelは入力・確認用として残す構成も選べます。' },
    ],
    deliveryChecks: [
      { title: '列や帳票の変更に備える', detail: '列番号を固定で決め打ちせず、見出し名・設定・テンプレートを使い分けます。追加列や順番変更が起きる業務は、エラー時の扱いも仕様にします。' },
      { title: '再実行しても結果が壊れないようにする', detail: '途中で止まった際に上書き対象や重複取込を確認できるよう、処理単位・バックアップ・エラーログを決めます。' },
      { title: '入力ミスを早めに見つける', detail: '日付・数値・必須項目・マスタとの一致を先に検証し、問題のある行を表示します。最終結果だけでなく確認すべき箇所を残す設計です。' },
    ],
    preparation: [
      '現在使っているExcelファイル（個人情報は伏せたサンプルで可）',
      '手作業で行う順序と、希望する出力結果',
      '月あたりのファイル数・処理件数、利用するPCやExcelの環境',
    ],
    priorityGuideSlugs: ['excel-transfer-automation', 'excel-multiple-files-aggregation', 'vba-development-cost'],

  },
  {
    slug: 'gas-automation',
    title: 'GAS・Google Workspace業務自動化',
    seoTitle: 'GAS開発・スプレッドシート自動化｜社内Webアプリ',
    description: 'Google Apps Script（GAS）でスプレッドシート・Drive・Gmailを連携。申請・承認、通知、PDF生成、社内Webアプリの設計・改修まで対応します。',
    eyebrow: 'GAS・Google Workspace',
    hero: 'スプレッドシート、Drive、Gmailなどをつないで一連の作業にします。',
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
    decisionLead: 'GASはGoogle Workspaceの中で完結する業務に向きます。一方で、利用者の権限、同時編集、実行時間、送信量によっては画面やデータ保存方法を分ける必要があります。',
    decisionPoints: [
      { title: 'シートのまま自動化する', detail: '少人数で管理する定型集計やファイル整理なら、既存シートへメニューや自動処理を追加する方法が手軽です。入力ルールと実行権限を決めて運用します。' },
      { title: 'GAS Webアプリにする', detail: '複数の利用者が入力・承認する場合は、閲覧権限や画面操作を分けられるWebアプリを検討します。マスタ・履歴・承認状態をどう保存するかが重要です。' },
      { title: '別基盤と連携する', detail: 'データ量、外部API、実行時間の制約が厳しい業務では、GASにすべてを載せず、バックエンドやデータベースに一部の処理を切り出す構成も比較します。' },
    ],
    deliveryChecks: [
      { title: '権限と公開範囲を整理する', detail: '編集者・承認者・管理者の操作範囲を分け、誰の権限でGASを実行するか、Drive内のファイルを誰が見られるかを確認します。' },
      { title: '同時操作を想定する', detail: '同時更新時の衝突を防ぐため、ロックや更新前チェックの要否を決めます。送信ボタンの連打による二重処理も考慮します。' },
      { title: '制限・例外への対応を入れる', detail: 'GASの実行時間やサービス側の割当制限を踏まえ、分割実行、再試行、エラー記録を設計します。運用担当者が原因を確認できる形を目指します。' },
    ],
    preparation: [
      '利用中のスプレッドシート・Drive構成とアクセス権限',
      '何人が入力・確認・承認するか、各ユーザーの役割',
      '通知先、出力したい帳票、定期処理の実行タイミング',
    ],
    priorityGuideSlugs: ['spreadsheet-automation', 'gas-web-app-development', 'gas-performance'],

  },
  {
    slug: 'python-data-processing',
    title: 'Python・CSV・大量データ処理',
    seoTitle: 'PythonでCSV・Excel一括処理｜データ変換と集計',
    description: 'Pythonで大量のCSV・Excelを検証・整形・結合・一括集計。文字コード、列形式、重複、欠損値を扱い、エラー行を確認できる業務処理を設計します。',
    eyebrow: 'Python・データ処理',
    hero: 'CSVやExcelの大量データをまとめて検証・変換・集計します。',
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
    decisionLead: '大量データの処理では「何件処理できたか」だけでなく「どの行を取り込めなかったか」が重要です。入力ファイルの種類、出力仕様、エラーの扱いを先に決めます。',
    decisionPoints: [
      { title: '複数ファイルを同じ形に揃える', detail: '部署別・月別のCSVやExcelを共通フォーマットへ変換してから集計する方法です。ファイル名・日付・項目の対応表も合わせて整理します。' },
      { title: '検証しながら取り込む', detail: '文字コード、日付形式、必須列、重複キーなどを確認し、問題のある行だけを別出力します。全件を止めるか正常行を継続するかを業務に合わせて決めます。' },
      { title: '定期バッチにする', detail: '決まったフォルダ・周期で処理する場合は、前回実行との重複判定や実行ログ、失敗時のやり直し方法まで含めて運用を設計します。' },
    ],
    deliveryChecks: [
      { title: '元データを破壊しない', detail: '入力ファイルは原則保持し、変換後データとエラー一覧を分けます。処理前後の件数や合計値の突合も確認項目です。' },
      { title: '表記ゆれとキーの扱いを決める', detail: '「001」と「1」、全角半角、空欄、同姓同名などの一致条件を仕様化します。安易な自動補完による誤結合を防ぐためです。' },
      { title: '必要な環境で動かす', detail: 'WindowsのローカルPC、サーバー、クラウドなど実行場所を確認し、Pythonの配布方法・スケジュール実行・保守手順を決めます。' },
    ],
    preparation: [
      '入力CSV・Excelのサンプルと期待する出力サンプル',
      'ファイル数・おおよその行数、列名変更や欠損の有無',
      '重複・エラー行を削除するか、確認後に修正するかの運用ルール',
    ],
    priorityGuideSlugs: ['csv-bulk-processing', 'excel-large-data-processing', 'python-excel-automation'],

  },
  {
    slug: 'api-integration',
    title: 'API・ECサービス連携',
    seoTitle: 'API連携開発｜OAuth認証・商品登録・データ同期',
    description: 'REST APIやOAuthを使った外部サービス連携に対応。ECの商品登録、在庫・注文データ同期、取得・更新、エラーの再処理を業務に合わせて設計します。',
    eyebrow: 'API・外部連携',
    hero: '外部サービス間の登録・取得をAPIでつなぎ、二重入力を減らします。',
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
    decisionLead: 'API連携は接続できることだけでは完成しません。登録済みデータの判定、認証期限、取得件数の制限、送信失敗後の再処理が実運用では重要になります。',
    decisionPoints: [
      { title: '一方向の自動登録', detail: 'CSVや社内台帳から商品・顧客情報を登録する場合。必須項目の変換、送信前チェック、APIのレスポンス保存を組み込みます。' },
      { title: '双方向の同期', detail: '複数サービスで情報を更新する場合は、更新元の優先順位、差分取得の方法、同時更新時の競合ルールを最初に決めます。' },
      { title: 'Webhooksや定期取得を使う', detail: 'サービスがWebhookに対応していればイベント通知を使い、使えない場合は定期取得を検討します。取りこぼし検知と再実行方法を併せて設計します。' },
    ],
    deliveryChecks: [
      { title: 'OAuthトークンを安全に扱う', detail: 'アクセストークンの期限と更新処理、保管場所、権限スコープを確認します。認証情報を画面やログにそのまま出さない構成にします。' },
      { title: '送信制限と再試行を考える', detail: 'HTTP 429や一時的な5xxエラーを想定し、間隔を空けた再試行や処理待ちキューを検討します。永続的な400系エラーは内容を確認できるように分けます。' },
      { title: '重複登録と不一致を防ぐ', detail: '商品IDや外部管理番号で既存レコードを照合し、二重送信・部分成功・更新漏れを検知します。' },
    ],
    preparation: [
      '連携先サービス名と利用可能なAPI仕様書・権限',
      '取得・登録・更新したい項目の対応表',
      '処理件数・実行頻度・失敗時に許容できる停止時間',
    ],
    priorityGuideSlugs: ['api-business-automation', 'api-integration-cost', 'business-automation-outsourcing'],

  },
  {
    slug: 'pdf-document-automation',
    title: 'PDF・帳票自動生成',
    seoTitle: 'PDF自動生成｜請求書・報告書・帳票出力',
    description: 'Excel・スプレッドシートから請求書、見積書、報告書、安全日誌などのPDFを自動作成。帳票レイアウト、改ページ、ファイル名、保存先まで設計します。',
    eyebrow: 'PDF・帳票',
    hero: '入力済みデータから帳票やPDFを作成し、保存まで自動化します。',
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
    decisionLead: '帳票の自動生成ではデータの計算と見た目の両方が重要です。PDF化するだけでなく、印刷サイズ、金額の端数処理、明細行数、承認済みデータの扱いまで確認します。',
    decisionPoints: [
      { title: 'Excelテンプレートを使う', detail: '既存の帳票様式を活かしたい場合。印刷範囲・余白・ページ区切りの制御を確認し、手入力する項目を減らします。' },
      { title: 'GASでPDFを生成する', detail: 'スプレッドシートやWebフォームの申請データから帳票を作る場合。テンプレート複製、PDF化、Drive保存、アクセス権限を一連の処理にします。' },
      { title: '複雑なレイアウトを組む', detail: '明細の可変行数や複数様式、押印欄などがある場合は、HTML/CSSからPDFへ変換する方法も候補です。画面プレビューと印刷結果を両方確認します。' },
    ],
    deliveryChecks: [
      { title: '計算値と表示値を一致させる', detail: '税込・税抜、端数処理、集計単位を先に統一し、帳票に印字する値が一覧画面の金額と一致するよう検証します。' },
      { title: '用紙と改ページを確認する', detail: 'A4・A3、縦横、余白、複数ページの罫線やタイトル位置を確認します。利用者のPCやPDFビューアによる違いにも注意します。' },
      { title: 'ファイル管理を決める', detail: 'ファイル名、保存先、同名更新、再発行、確定後の修正可否を決めて、誤った帳票を共有しない運用にします。' },
    ],
    preparation: [
      '現在の帳票PDF・Excel、または必要な記載欄の見本',
      '明細の最大行数、用紙サイズ、計算・端数ルール',
      'ファイル命名規則、保存先、閲覧・承認の担当者',
    ],
    priorityGuideSlugs: ['gas-pdf-automation', 'excel-pdf-automation', 'vba-development-cost'],

  },
];

export const getServiceBySlug = (slug: string) => services.find((service) => service.slug === slug);
