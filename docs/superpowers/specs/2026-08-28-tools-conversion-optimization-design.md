# 公開ツール導線・SEO横断改善 設計書

作成日: 2026-08-28
対象: TI AUTOMATION STUDIO
ベース: `main` (`01be93618a4126ab27bb7bc69270bebd33534ffb`)
作業ブランチ: `feature/tools-conversion-optimization`

## 1. 目的

4本の公開ツールを「便利な無料ツール」で終わらせず、利用者が実際に結果を得た後だけ、自然に専用開発・業務改善相談へ進める導線を整える。

優先順位は以下。

1. 無料ツールとしての信頼感と使いやすさを損なわない
2. 結果を得たユーザーだけに、文脈に合った相談導線を提示する
3. `/tools` で目的別にツールを選びやすくする
4. 4ツールのSEO・内部リンク・構造化データを統一する
5. ツール利用データや業務データを問い合わせへ自動転送しない

## 2. 対象ページ

- `/tools`
- `/tools/excel-diff`
- `/tools/data-cleaner`
- `/tools/dashboard-builder`
- `/tools/automation-diagnosis`
- `/contact`

関連する共通コンポーネント、スタイル、テストも対象。

## 3. 採用方針

「B: 結果連動型の自然なCTA」を採用する。

ツール利用前・入力中・処理中には営業CTAを強調しない。結果が正常に生成された後だけ、結果内容に対応する軽い相談CTAを表示する。

ページ下部に既存の詳細CTAは残し、役割を分ける。

- 結果直後CTA: 次の一歩を短く提示
- ページ下部CTA: サービス・実績・問い合わせを詳しく案内

追従CTA、ポップアップ営業、メール取得ゲート、ログイン必須化は行わない。

## 4. 共通結果CTA

### 4.1 共通コンポーネント

新規共通コンポーネント例:

`src/components/tools/ToolResultCTA.astro`

想定Props:

- `source`: ツール識別子
- `eyebrow`: 小見出し
- `title`: 結果後の主見出し
- `description`: 具体的な発展例
- `serviceHref`: 関連サービスURL
- `serviceLabel`: 関連サービス文言
- `contactLabel`: 相談ボタン文言
- `hiddenByDefault`: 初期非表示かどうか

共通UIはサイト既存の黒・濃紺、アイボリー、シャンパンゴールドのデザイン体系に合わせる。カード広告風にはせず、結果レポートの続きとして見えるようにする。

### 4.2 表示タイミング

#### Excel差分比較

表示条件: 差分比較処理が正常終了し、結果モデルが生成された後。

文言:

- 見出し: `毎回この比較作業をしていますか？`
- 説明: `複数ファイルの一括比較、定期実行、差分結果の自動保存や通知まで専用化できます。`
- 関連サービス: `/services/excel-automation`
- 問い合わせ: `/contact?source=excel-diff`

0件差分でも比較自体が正常終了していれば表示する。

#### CSV・Excelデータ整理

表示条件: ファイル診断が正常終了し、健康診断結果が生成された後。

文言:

- 見出し: `毎回同じデータ整理をしていますか？`
- 説明: `定期CSVの整形、重複除去、複数ファイル統合、別システム用フォーマット変換を一括処理できます。`
- 関連サービス: `/services/python-data-processing`
- 問い合わせ: `/contact?source=data-cleaner`

修正を1件も適用していなくても、診断が完了していれば表示する。

#### Excel・CSVダッシュボード自動作成

表示条件: 自動ダッシュボードが正常に生成され、最低1ウィジェットが表示された後。

文言:

- 見出し: `毎月この集計・グラフ更新をしていますか？`
- 説明: `ファイルを置くだけで更新する仕組みや、複数人で共有する常設ダッシュボードへ発展できます。`
- 関連サービス: `/services/excel-automation` または `/services/python-data-processing`
- 問い合わせ: `/contact?source=dashboard-builder`

#### 業務自動化診断

表示条件: 6ステップの診断結果が正常に生成された後。

文言:

- 見出し: `診断した業務を、実際の改善設計まで整理できます。`
- 説明: `全自動にする部分と、人の判断を残す部分を分けて、既存環境に合う構成を検討できます。`
- 関連サービス: `/services`
- 問い合わせ: `/contact?source=automation-diagnosis`

### 4.3 CTAの状態管理

- 初期状態は `hidden`
- 各ツールの既存コントローラーから、結果生成成功時だけ表示
- リセット時は再び非表示
- エラー時は表示しない
- 入力値変更だけでは表示条件を解除しない。ただし結果自体をクリアする既存操作ではCTAも隠す

新たなサーバー状態、Cookie、localStorage、sessionStorageは使わない。

## 5. 問い合わせ引き継ぎ

### 5.1 URL仕様

許可するsource値は以下の4つだけ。

- `excel-diff`
- `data-cleaner`
- `dashboard-builder`
- `automation-diagnosis`

URL例:

`/contact?source=excel-diff`

### 5.2 引き継ぐ情報

引き継ぐのは `source` だけ。

以下は絶対にURL、フォーム、hidden input、サーバー送信へ自動転送しない。

- ファイル名
- Excel / CSVセル内容
- 差分結果
- ダッシュボード集計値
- 診断入力値
- 人件費
- 年間工数
- 診断スコア
- 検索・フィルター条件
- その他ユーザーがツールへ入力した業務データ

### 5.3 問い合わせページ表示

有効なsourceがある場合、フォーム上部に小さなコンテキストバーを表示する。

例:

`Excel差分比較ツールからのご相談`

補足:

`ツールに読み込んだファイルや結果は、この問い合わせ画面には引き継がれていません。必要な範囲だけご記入ください。`

### 5.4 初期カテゴリ

sourceごとの初期選択:

- `excel-diff` → `Excel・スプレッドシート自動化`
- `data-cleaner` → `Python・データ処理`
- `dashboard-builder` → `Excel・スプレッドシート自動化`
- `automation-diagnosis` → `その他・まだ分からない`

ユーザーは自由に変更できる。

不明なsource値は無視し、通常の問い合わせ画面として表示する。

### 5.5 問い合わせAPI

既存 `/api/contact` のpayload仕様は変更しない。sourceを問い合わせ本文へ自動挿入する必要もない。

今回の目的はフォーム到達時のコンテキスト改善であり、バックエンド契約を増やさない。

## 6. `/tools` の目的別入口

ツールカード一覧の前に「目的から選ぶ」セクションを追加する。

4項目:

- `比較する` → `/tools/excel-diff`
- `整える` → `/tools/data-cleaner`
- `見える化する` → `/tools/dashboard-builder`
- `自動化できるか調べる` → `/tools/automation-diagnosis`

### UI方針

- 大きな別カード群を追加して縦長にしない
- 横並びのショートカット、または2×2のコンパクトグリッド
- 各項目に1行説明を付ける
- 既存ツールカードのプレビューを主役として残す
- モバイルでは2列または1列へ自然に折り返す

## 7. SEO統一

### 7.1 構造化データ

4ツールすべてで以下を確認・統一する。

- `WebApplication`
- `BreadcrumbList`
- FAQ本文が存在するページは `FAQPage`

既にFAQ本文があるExcel差分、データ整理、ダッシュボードについて、FAQPageを追加する。

構造化データの回答文は画面本文と意味を一致させ、検索向けだけの別内容を作らない。

### 7.2 内部リンク

各ツール下部に関連ツール導線を追加する。ただし全4本を機械的に並べず、利用文脈で2〜3本に絞る。

想定:

- Excel差分 → データ整理 / 自動化診断
- データ整理 → Excel差分 / ダッシュボード / 自動化診断
- ダッシュボード → データ整理 / 自動化診断
- 自動化診断 → Excel差分 / データ整理 / ダッシュボード

アンカーテキストはツール名または目的が伝わる日本語にする。

### 7.3 検索意図の分離

各ページの主軸は以下で固定する。

- Excel差分: Excel比較・変更箇所確認
- データ整理: CSV/Excelクレンジング・重複・空白・表記整理
- ダッシュボード: Excel/CSV集計・グラフ・可視化
- 自動化診断: 業務自動化の適性・工数削減試算

本文を増やすためだけの重複説明は追加しない。

## 8. 結果CTAとPDF/画像保存

CTAは保存物へ混入させない。

- Excel差分: DOM保存ではないため通常通り
- データ整理: CSV/Excel出力へCTA情報を入れない
- ダッシュボード: `data-dashboard-export-area` の外側へCTAを置く
- 自動化診断: CTAへ `data-print-ignore` を付け、PDF印刷対象外にする

## 9. アクセシビリティ

- 結果CTAの表示時に強制フォーカスしない
- `hidden` の切替でスクリーンリーダーに自然に反映
- CTAリンクは意味が分かる文言にする
- 色だけで状態を区別しない
- `/tools` の目的別入口はキーボード操作可能な通常リンク
- 問い合わせコンテキストバーは通常テキストとして読み上げ可能にする

## 10. プライバシー・セキュリティ

今回の横断改善で以下を追加しない。

- 行動トラッキング
- 外部解析SDK
- Cookie
- localStorage / sessionStorage
- ツール入力内容のサーバー送信
- ツール結果の問い合わせ自動添付
- URLへの入力値埋め込み

`source` は固定ホワイトリストで解釈する。任意文字列をHTMLとして出力しない。

## 11. エラー時の挙動

- ツール処理失敗時: 結果CTAを表示しない
- 問い合わせsource不正時: 無視して通常表示
- sourceありでもフォーム送信APIが失敗した場合: 現在の既存エラーハンドリングを維持
- 関連サービスURLは既存実在ルートのみ使用

## 12. 想定ファイル構成

新規候補:

- `src/components/tools/ToolResultCTA.astro`
- `src/data/tool-conversion.ts`
- `src/styles/tool-conversion.css` または既存 `tool-app.css` への最小追加
- `tests/tool-result-cta.test.ts`
- `tests/contact-source.test.ts`
- `tests/tools-conversion.test.ts`

変更候補:

- `src/pages/tools/index.astro`
- `src/pages/tools/excel-diff.astro`
- `src/pages/tools/data-cleaner.astro`
- `src/pages/tools/dashboard-builder.astro`
- `src/pages/tools/automation-diagnosis.astro`
- 4ツールの各クライアントコントローラー
- `src/pages/contact.astro`
- SEO構造化データ関連テスト

不要な共通化で既存ツールロジックを大きく組み替えない。

## 13. テスト方針

TDDで以下を固定する。

### 共通CTA

- 初期HTMLに4ツールの結果CTAが存在する
- 初期状態は非表示
- source付きcontact URLを持つ
- ツール処理成功時のコントローラーコードから表示される
- reset / clear時に非表示へ戻る

### 問い合わせ

- 4つの許可sourceだけ認識
- sourceごとに表示名と初期カテゴリが一致
- 不正sourceは無視
- source以外のツールデータを受け取る契約を持たない

### `/tools`

- 目的別4入口が存在
- 各hrefが正しい
- 既存4ツールカードが維持される

### SEO

- 4ツールにWebApplication / BreadcrumbList
- FAQ本文がある4ツールにFAQPage
- 関連ツール内部リンクが存在

### 回帰

- 既存全Vitest
- `astro check`
- Cloudflare Workers向けbuild
- 問い合わせ既存テスト
- 4ツール既存ロジックテスト

Playwright等のE2Eがないため、実施していない場合はE2E確認済みとは表現しない。

## 14. 完了条件

以下をすべて満たした時だけ完成扱いとする。

1. 4ツールとも結果前には営業CTAを強調表示しない
2. 正常な結果生成後だけ専用CTAが出る
3. 問い合わせへ渡るのはsource識別子だけ
4. `/tools` に目的別入口がある
5. 4ツールの構造化データが統一される
6. 関連ツール内部リンクが追加される
7. 保存PDF/画像/Excel/CSVにCTA情報が混入しない
8. 既存問い合わせpayloadを壊さない
9. 全テストが成功する
10. Astro型チェックが成功する
11. Cloudflare Workers向けbuildが成功する
12. mainとの差分レビューで既存ツール機能の不要な改変がない

## 15. 今回対象外

- Google Analytics等の新規導入
- コンバージョンイベント計測
- Cookie同意UI
- ログイン
- ユーザーアカウント
- メール取得を条件にしたツール利用
- 結果のクラウド保存
- 問い合わせへのツール結果自動添付
- 追従営業ボタン
- チャットボット

これらは、無料ツールの利用状況が十分に集まった後に別施策として検討する。
