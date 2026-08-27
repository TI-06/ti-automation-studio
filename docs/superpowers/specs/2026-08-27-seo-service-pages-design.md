# SEO Service Pages Design

Date: 2026-08-27

## Goal

Search Console登録後の次段階として、TI AUTOMATION STUDIOを「業務改善・自動化の相談先」として検索エンジンに理解されやすくし、検索流入から実績・問い合わせへ自然に送る。

## Scope

### 1. サービス別SEO着地ページを5本追加

- `/services/excel-automation` — Excel・VBA業務自動化
- `/services/gas-automation` — GAS・Google Workspace業務自動化
- `/services/python-data-processing` — Python・CSV・大量データ処理
- `/services/api-integration` — API・ECサービス連携
- `/services/pdf-document-automation` — PDF・帳票自動生成

各ページは薄い営業LPにせず、検索意図に直接答える実務コンテンツとして構成する。

### 2. 各サービスページの共通構成

1. ファーストビュー
   - 検索意図を含む明確なH1
   - 何を改善できるサービスかを2〜3行で要約
   - 高品質な専用ビジュアル
   - 「関連実績を見る」「相談する」CTA
2. よくある課題
   - 検索ユーザーが自分事化できる具体的な業務例
3. できること
   - 技術名ではなく業務結果ベースで説明
4. 自動化前後の流れ
   - Before → 処理 → Afterを視覚的に整理
5. 具体例
   - 匿名・一般化した実務例
6. 向いているケース / 向いていないケース
   - 誇張せず判断材料を提示
7. 使用技術
8. 関連実績
9. FAQ
10. 問い合わせCTA

## Search Intent / Primary Keywords

### Excel
- 主軸: `Excel 自動化`, `Excel 業務効率化`, `Excel VBA 開発`
- 補助: `Excel 自動化 外注`, `Excel マクロ 業務改善`, `Excel 帳票 自動化`

### GAS
- 主軸: `GAS 業務自動化`, `Google Apps Script 開発`, `スプレッドシート 自動化`
- 補助: `GAS 開発 依頼`, `Google Workspace 業務効率化`, `GAS Webアプリ`

### Python
- 主軸: `Python 業務自動化`, `CSV 一括処理`, `大量データ 処理`
- 補助: `Python データ加工`, `Excel CSV 自動処理`, `ファイル一括処理`

### API
- 主軸: `API連携 開発`, `API 自動化`, `EC API 連携`
- 補助: `外部サービス API連携`, `OAuth API 開発`, `EC 業務 自動化`

### PDF
- 主軸: `PDF 帳票 自動生成`, `Excel PDF 自動化`, `帳票 自動化`
- 補助: `PDF 一括生成`, `GAS PDF 自動作成`, `帳票作成 業務効率化`

キーワードを不自然に詰め込まず、見出し・本文・title・descriptionで検索意図を自然に満たす。

## Visual Design

各ページに1枚ずつ、計5枚の専用ビジュアルを用意する。

### 共通トーン
- TI AUTOMATION STUDIOの既存デザインに合わせる
- warm black / deep navy / champagne gold / ivory
- 実務システムのUI、データフロー、帳票、API接続などを立体感のある高品質なビジュアルで表現
- 汎用ストック風・人物写真・ネオンAI風は避ける
- 画像内に長い日本語説明文は焼き込まない
- 画像だけでもテーマが判別できる構成

### ページ別モチーフ
- Excel: spreadsheet → 集計 → レポート/帳票への自動フロー
- GAS: Google Workspace風の表・メール・Drive・Web画面をつなぐ業務フロー（公式ロゴは使わない）
- Python: CSV/Excelファイル群 → Python処理 → 整理済みデータ
- API: 複数のWebサービス/APIノード → 認証 → データ同期
- PDF: 入力データ → 帳票テンプレート → 複数PDF生成・保存

### Technical image requirements
- 16:9基準
- 原版は高解像度
- サイト掲載用はWebP化・圧縮
- `<img>` に明確な `width` / `height` / `alt`
- OGP用候補としても利用可能な構図
- LCPを悪化させないサイズと読み込み方法を選ぶ

Googleは2026年3月に検索・Discoverのpreferred image guidanceを更新しており、`og:image` とschema.orgの画像情報も候補に使われるため、主要ページごとに関連性の高い画像を明示する。

## Technical SEO

### BaseLayout
- `og:url`
- `og:site_name`
- ページ別 `og:image` 対応
- `twitter:title`
- `twitter:description`
- `twitter:image`
- Google verificationは維持

### Structured data
- サイト共通: `WebSite` + `ProfessionalService`
- サービス詳細: `Service` + `BreadcrumbList`
- 実績一覧: `ItemList`
- 実績詳細: `BreadcrumbList`（既存内容と整合）

構造化データは表示内容と一致する情報だけを記述し、検索結果上の特典を保証する目的では使わない。

## Internal Linking

### Top page
現在の「できること」8項目のうち該当5項目をサービス詳細ページへのリンクに変更。

### Service pages
- 関連する実績ページへ2〜4本
- 他の関連サービスページへ1〜2本
- 問い合わせページへCTA

### Works pages
該当するサービスページへの「この領域で相談する / 対応サービスを見る」導線を追加できる範囲で設定。

リンクテキストは「詳しくはこちら」の乱用を避け、リンク先内容が分かる自然なアンカーテキストにする。

## Content Policy

- 顧客名、会社名、現場名、実データ、契約金額、固有条件を公開しない
- 実績は匿名化・一般化した内容のみ
- 実際に対応可能な技術・業務だけ記載
- 「必ず削減」「絶対に上位表示」等の保証表現は使わない

## Site UX

SEO優先で文章量を増やすが、長文LP化して読みにくくしない。

- ファーストビューで結論
- カード、2カラム、短い箇条書きで視認性を確保
- H2ごとの内容を明確に分割
- 関連実績は既存カードデザインを再利用
- スマホでは1カラム化

## Tests / Verification

- 5サービスページが生成される
- 各ページに固有title / description / H1がある
- canonicalが本番URLになる
- 各サービスにService + BreadcrumbList JSON-LDがある
- トップから5サービスへの内部リンクが存在する
- 各サービスから問い合わせへのリンクがある
- 画像にalt / width / heightがある
- 既存content/contact testsを壊さない
- `npm test`
- `npm run build`

## Out of Scope for this phase

- ブログ / Knowledge機能
- Google Search Console API連携
- 自動順位計測
- 広告運用
- ローカルSEO / Google Business Profile
- llms.txt（Googleは2026年6月にAI最適化ガイドで利用方法を明確化しているが、現段階で優先しない）

## Success Criteria

- 5つの検索意図別着地ページが公開される
- 各ページを見たユーザーが3秒程度で「何を自動化できるページか」を判断できる
- トップ → サービス → 関連実績 → 問い合わせの導線が成立する
- Googleがクロール可能なHTML本文・内部リンク・構造化データを持つ
- 高品質画像を入れながら既存の黒×ゴールドのブランドトーンとページ速度を維持する
