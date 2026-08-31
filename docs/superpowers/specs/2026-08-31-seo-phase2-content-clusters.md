# SEO Phase 2 Content Cluster Spec

## Goal
Phase 1で作成した検索入口を、20本の課題解決コンテンツ・開発実績・サービスページで相互接続し、検索流入から問い合わせまでの導線を強化する。

## Scope
1. `/solutions/` を5本から20本へ拡張する。
2. 検索意図を5クラスター（Excel/VBA、GAS、Python/データ処理、API、業務自動化）に整理する。
3. 各solutionに関連solutionを持たせ、記事同士をクラスター内で相互リンクする。
4. サービス詳細から関連solutionへリンクする。
5. 実績詳細から関連solutionへリンクする。
6. 実績詳細のtitle/descriptionを検索意図に合わせて最適化する。
7. 既存のService/Article/Breadcrumb構造化データ、canonical、OGPを維持する。

## New solution pages
- `excel-monthly-aggregation`
- `excel-pdf-automation`
- `vba-development-cost`
- `excel-macro-performance`
- `spreadsheet-automation`
- `gas-mail-automation`
- `gas-performance`
- `gas-web-app-development`
- `python-excel-automation`
- `csv-bulk-processing`
- `excel-large-data-processing`
- `api-integration-cost`
- `api-business-automation`
- `manual-work-automation`
- `business-automation-outsourcing`

## Content requirements
Each solution must include:
- unique `seoTitle` and `description`
- immediate answer to the search query
- automation suitability / decision criteria
- at least 3 approaches or comparison points
- implementation steps
- cost guidance without claiming a fixed quote
- pitfalls
- at least 3 FAQs
- related service, works, tools, and related solutions

## Cluster mapping
- `excel`: Excel/VBA/マクロ/スプレッドシート
- `gas`: Google Apps Script / Google Workspace
- `python`: Python / CSV / 大量Excel処理
- `api`: API連携 / 外部サービス連携
- `automation`: 手作業・定型業務・業務自動化全般

## Internal-link requirements
- `/solutions/` groups entries by cluster.
- Each solution detail shows related guides from `relatedSolutionSlugs`.
- Service detail pages show solutions whose `relatedServiceSlug` matches the service.
- Work detail pages show solutions whose `relatedWorkSlugs` includes the work slug.
- Solution detail continues to link to service, related works, related tools, price, and contact.

## Work SEO requirements
Each work must gain:
- `seoTitle`
- `seoDescription`

`src/pages/works/[slug].astro` must use these fields in `BaseLayout` while keeping the visible H1/title unchanged.

## Quality constraints
- Do not fabricate client names, confidential data, exact monetary results, or exact time reductions.
- Do not create multiple pages with effectively identical search intent.
- Keep current visual language and existing responsive styles.
- No new runtime dependency.
- All existing tests must remain green and new Phase 2 tests must pass.
