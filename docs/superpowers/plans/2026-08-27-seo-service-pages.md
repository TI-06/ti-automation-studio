# SEO Service Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 5つの検索意図別サービスページ、高品質なブランドビジュアル、構造化データ、内部リンク、ページ別OGPを追加し、TI AUTOMATION STUDIOの検索流入導線を強化する。

**Architecture:** サービス情報を `src/data/services.ts` に集約し、`src/pages/services/[slug].astro` が静的生成する。`BaseLayout.astro` はページ別OGP画像と追加JSON-LDを受け取り、共通のWebSite/ProfessionalServiceと併せて出力する。各サービスのビジュアルは軽量なブランドSVGとして `public/service-visuals/` に配置し、トップ・サービス詳細・実績間を内部リンクする。

**Tech Stack:** Astro 6, TypeScript, Vitest, Cloudflare Workers, SVG

**Spec:** `docs/superpowers/specs/2026-08-27-seo-service-pages-design.md`

## Global Constraints

- 本番URLは `https://ti-automation-studio.utiltoools.workers.dev`。
- 顧客名・会社名・現場名・実データ・契約金額・固有条件は公開しない。
- キーワードを不自然に詰め込まない。
- 画像は warm black / deep navy / champagne gold / ivory のブランドトーン。
- 人物写真、公式ロゴ、既存サービスの著作権UIを使わない。
- 構造化データは画面表示内容と一致させる。
- 既存問い合わせ、実績、Cloudflare Workersビルドを壊さない。

---

### Task 1: SEO回帰テスト

**Files:**
- Modify: `tests/content.test.ts`

**Interfaces:**
- Consumes: 既存のVitestテスト構成
- Produces: サービスページ・OGP・JSON-LD・内部リンク要件を検証するテスト

- [ ] **Step 1: 失敗するテストを追加**

`services` データの5件、固有title/description、トップの `/services/...` リンク、BaseLayoutの `og:url` / `og:site_name` / `twitter:*` / 追加structured data、サービス詳細の `Service` / `BreadcrumbList` / `/contact` / `width="1600"` / `height="900"` を検証する。

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npm test`
Expected: 新しいサービス/SEO要件テストがFAIL。

### Task 2: サービスデータとブランドSVG

**Files:**
- Create: `src/data/services.ts`
- Create: `public/service-visuals/excel-automation.svg`
- Create: `public/service-visuals/gas-automation.svg`
- Create: `public/service-visuals/python-data-processing.svg`
- Create: `public/service-visuals/api-integration.svg`
- Create: `public/service-visuals/pdf-document-automation.svg`

**Interfaces:**
- Produces: `services`, `getServiceBySlug(slug)` と5ページ分の表示コンテンツ

- [ ] **Step 1: 型と5サービスのコンテンツを実装**

各サービスは `slug`, `title`, `seoTitle`, `description`, `eyebrow`, `hero`, `visual`, `visualAlt`, `problems`, `capabilities`, `flow`, `examples`, `fit`, `notFit`, `technologies`, `relatedWorkSlugs`, `relatedServiceSlugs`, `faq` を持つ。

- [ ] **Step 2: 5枚のSVGを作成**

1600x900、グラデーション・グラスパネル・データフロー・ドキュメント/表/ノードを組み合わせ、テーマごとにモチーフを変える。

### Task 3: BaseLayoutの技術SEO強化

**Files:**
- Modify: `src/layouts/BaseLayout.astro`

**Interfaces:**
- Consumes: `ogImage?: string`, `structuredData?: Record<string, unknown> | Record<string, unknown>[]`
- Produces: canonicalと整合するOGP/Twitter、WebSite + ProfessionalService + ページ固有JSON-LD

- [ ] **Step 1: Propsを拡張**

`ogImage` と `structuredData` を追加し、絶対URLへ正規化する。

- [ ] **Step 2: metadataを追加**

`og:url`, `og:site_name`, `twitter:title`, `twitter:description`, `twitter:image` を出力する。

- [ ] **Step 3: JSON-LDを配列出力**

共通 `WebSite`, `ProfessionalService` とページ固有structured dataを個別scriptで出力する。

### Task 4: サービス詳細ページと一覧

**Files:**
- Create: `src/pages/services/index.astro`
- Create: `src/pages/services/[slug].astro`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: `services`, `works`
- Produces: `/services` と5つの静的SEOサービスURL

- [ ] **Step 1: サービス一覧を実装**

5サービスを検索意図が分かるカードで一覧化し、各詳細へリンクする。

- [ ] **Step 2: 詳細ページを静的生成**

`getStaticPaths()` で5ページを生成。Hero、課題、できること、Before/Afterフロー、具体例、向き不向き、関連実績、FAQ、問い合わせCTAを表示する。

- [ ] **Step 3: Service + BreadcrumbListを追加**

画面内容と一致するJSON-LDをBaseLayoutへ渡す。

- [ ] **Step 4: レスポンシブCSSを実装**

PCでは2カラム/カード、スマホでは1カラム。SVGは`aspect-ratio:16/9`で表示する。

### Task 5: トップ・実績への内部リンク

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/pages/works/index.astro`
- Modify: `src/pages/works/[slug].astro`

**Interfaces:**
- Produces: トップ → サービス → 実績 → 問い合わせのクロール可能な導線

- [ ] **Step 1: トップの対応5サービスをリンク化**

サービス配列にslugを持たせ、該当カードを `/services/<slug>` へリンクする。サービス一覧への導線も追加する。

- [ ] **Step 2: 実績一覧にItemList JSON-LDを追加**

実際の実績URLとタイトルを列挙する。

- [ ] **Step 3: 実績詳細にBreadcrumbListを追加**

ホーム → 開発実績 → 個別実績のパンくず構造化データを追加する。

### Task 6: 最終検証とマージ

**Files:**
- Verify all changed files

- [ ] **Step 1: テスト**

Run: `npm test`
Expected: 全テストPASS。

- [ ] **Step 2: Cloudflare向けビルド**

Run: `npm run build`
Expected: Astro check/buildがexit 0。

- [ ] **Step 3: PR作成**

`feature/seo-service-pages` → `main`。

- [ ] **Step 4: PR差分とCI確認**

変更ファイル、主要SEO要件、GitHub Actionsのtest/build成功を確認する。

- [ ] **Step 5: Squash merge**

CI成功後に `main` へマージし、main側CIも成功を確認する。
