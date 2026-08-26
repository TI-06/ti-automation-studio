# TI AUTOMATION STUDIO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 日本語中心・匿名性重視・高級感のある業務改善/自動化開発の営業サイトをAstroで構築し、Cloudflare Workersへ公開可能な状態にする。

**Architecture:** Astroの静的コンテンツ中心構成を採用し、実績と公開ツールはTypeScriptデータモジュールで管理する。問い合わせだけをサーバー処理として分離し、Cloudflare Turnstile検証とGAS通知先を環境変数経由で呼び出す。

**Tech Stack:** Astro / TypeScript / CSS Variables / Vitest / Playwright / Cloudflare Workers / Wrangler / Cloudflare Turnstile

**Spec:** `docs/superpowers/specs/2026-08-26-ti-automation-studio-design.md`

## Global Constraints

- サイト本文、見出し、実績説明、問い合わせフォームは原則日本語。
- ブランド名は `TI AUTOMATION STUDIO`。
- メインコピーは `面倒な業務を、使える仕組みに変える。`。
- 本名、顔写真、自宅住所、電話番号、本業勤務先、家族情報を公開しない。
- 顧客名、顧客住所、現場名、担当者名、顧客データ、顧客固有画面を公開しない。
- 背景は Warm Black `#0B0C0E`、Surface `#111317`、Main Text `#F2F0EA`、Sub Text `#A8A8A2`、Accent `#C8A96B` を基準にする。
- 派手なグラデーション、強い光彩、常時動く背景アニメーションは使用しない。
- `prefers-reduced-motion` を尊重する。
- 問い合わせ送信時は送信中・完了・エラー状態を必ず表示する。
- GAS URL、共有シークレット、Turnstile secretはフロントエンドへ埋め込まない。

---

## File Structure

```text
/
├─ astro.config.mjs
├─ package.json
├─ tsconfig.json
├─ wrangler.jsonc
├─ public/
│  ├─ favicon.svg
│  ├─ robots.txt
│  └─ og-default.svg
├─ src/
│  ├─ components/
│  │  ├─ SiteHeader.astro
│  │  ├─ SiteFooter.astro
│  │  ├─ SectionHeading.astro
│  │  ├─ Hero.astro
│  │  ├─ Metrics.astro
│  │  ├─ ServiceGrid.astro
│  │  ├─ WorkCard.astro
│  │  ├─ ToolCard.astro
│  │  ├─ ProcessSteps.astro
│  │  ├─ ContactCta.astro
│  │  └─ ContactForm.astro
│  ├─ data/
│  │  ├─ works.ts
│  │  └─ tools.ts
│  ├─ layouts/
│  │  └─ BaseLayout.astro
│  ├─ pages/
│  │  ├─ index.astro
│  │  ├─ works/index.astro
│  │  ├─ works/[slug].astro
│  │  ├─ tools/index.astro
│  │  ├─ tools/[slug].astro
│  │  ├─ contact.astro
│  │  ├─ privacy.astro
│  │  └─ api/contact.ts
│  ├─ styles/
│  │  ├─ tokens.css
│  │  └─ global.css
│  └─ utils/
│     ├─ contact.ts
│     └─ seo.ts
├─ tests/
│  ├─ contact.test.ts
│  └─ content.test.ts
└─ e2e/
   └─ smoke.spec.ts
```

### Task 1: Astro / Cloudflare 基盤と品質チェック

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `wrangler.jsonc`
- Create: `.gitignore`
- Create: `src/pages/index.astro`

**Interfaces:**
- Produces: `npm run dev`, `npm run build`, `npm run test`, `npm run test:e2e` の実行基盤。

- [ ] **Step 1: Astro + TypeScript + Cloudflare adapterの依存関係を定義する**

```json
{
  "name": "ti-automation-studio",
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@astrojs/cloudflare": "latest",
    "astro": "latest"
  },
  "devDependencies": {
    "@astrojs/check": "latest",
    "@playwright/test": "latest",
    "typescript": "latest",
    "vitest": "latest",
    "wrangler": "latest"
  }
}
```

- [ ] **Step 2: Cloudflare向けAstro設定を作成する**

```js
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  site: 'https://example.com'
});
```

`site` は独自ドメイン確定までは仮値とし、公開時に実値へ差し替える。

- [ ] **Step 3: 初期ページを作成してビルドする**

```astro
---
---
<html lang="ja">
  <head><meta charset="utf-8" /><title>TI AUTOMATION STUDIO</title></head>
  <body><main><h1>TI AUTOMATION STUDIO</h1></main></body>
</html>
```

Run: `npm install && npm run build`
Expected: Astro checkとbuildが成功する。

- [ ] **Step 4: 初期コミット**

```bash
git add .
git commit -m "chore: scaffold Astro Cloudflare project"
```

### Task 2: デザイントークンと共通レイアウト

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/SiteHeader.astro`
- Create: `src/components/SiteFooter.astro`
- Create: `src/components/SectionHeading.astro`

**Interfaces:**
- Produces: 全ページ共通の日本語SEO、ヘッダー、フッター、カラー/余白/タイポグラフィ定義。

- [ ] **Step 1: デザイントークンを定義する**

```css
:root {
  --color-bg: #0b0c0e;
  --color-surface: #111317;
  --color-text: #f2f0ea;
  --color-muted: #a8a8a2;
  --color-accent: #c8a96b;
  --color-border: rgba(242, 240, 234, 0.12);
  --container: 1180px;
  --radius-sm: 6px;
  --space-section: clamp(5rem, 10vw, 9rem);
}
```

- [ ] **Step 2: グローバルスタイルを作成する**

```css
* { box-sizing: border-box; }
html { background: var(--color-bg); color: var(--color-text); scroll-behavior: smooth; }
body { margin: 0; font-family: Inter, "Noto Sans JP", system-ui, sans-serif; background: var(--color-bg); }
a { color: inherit; }
:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 4px; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 3: BaseLayoutに日本語メタ情報を実装する**

Props:

```ts
interface Props {
  title: string;
  description: string;
  canonical?: string;
}
```

- [ ] **Step 4: Header/Footerを実装して全ページから再利用できるようにする**

Header nav:

```ts
[
  ['できること', '/#services'],
  ['実績', '/works'],
  ['公開ツール', '/tools'],
  ['開発の流れ', '/#process'],
  ['問い合わせ', '/contact']
]
```

- [ ] **Step 5: ビルドとキーボード操作を確認してコミットする**

```bash
npm run build
git add src/styles src/layouts src/components
git commit -m "feat: add premium Japanese site foundation"
```

### Task 3: 実績データモデルと実績ページ

**Files:**
- Create: `src/data/works.ts`
- Create: `src/components/WorkCard.astro`
- Create: `src/pages/works/index.astro`
- Create: `src/pages/works/[slug].astro`
- Create: `tests/content.test.ts`

**Interfaces:**
- Produces: `Work` 型、`works` 配列、実績一覧/詳細ルート。

- [ ] **Step 1: 匿名化を担保する型と初期6件を定義する**

```ts
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
```

初期タイトル:

```ts
[
  '業務工程・帳票管理システム',
  '在庫・商品管理ツール',
  'EC商品登録・API連携',
  'Excel業務アプリケーション',
  'PDF・帳票自動生成',
  '業務用データ変換・一括処理'
]
```

- [ ] **Step 2: 機密語を検知するテストを先に作る**

```ts
import { describe, expect, it } from 'vitest';
import { works } from '../src/data/works';

describe('公開実績', () => {
  it('顧客固有情報を含まない', () => {
    const text = JSON.stringify(works);
    for (const forbidden of ['住所', '担当者名', 'API_KEY', 'TOKEN']) {
      expect(text).not.toContain(forbidden);
    }
  });
});
```

- [ ] **Step 3: 一覧と詳細ページを実装する**

詳細ページには「課題」「開発内容」「改善できたこと」「使用技術」「機密保持」の5ブロックを必須表示する。

- [ ] **Step 4: テストとビルドを実行する**

Run: `npm run test && npm run build`
Expected: PASS。

- [ ] **Step 5: コミットする**

```bash
git add src/data src/components/WorkCard.astro src/pages/works tests/content.test.ts
git commit -m "feat: add anonymized work portfolio"
```

### Task 4: 公開ツールデータモデルとツールページ

**Files:**
- Create: `src/data/tools.ts`
- Create: `src/components/ToolCard.astro`
- Create: `src/pages/tools/index.astro`
- Create: `src/pages/tools/[slug].astro`

**Interfaces:**
- Produces: `Tool` 型、公開ツール一覧/詳細ルート。

- [ ] **Step 1: 安全な公開状態を管理できる型を定義する**

```ts
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
```

- [ ] **Step 2: 初期状態では未監査の既存リポジトリを掲載しない**

`tools` は安全確認済みの項目だけ `published: true` にする。0件の場合も「公開準備中」と上品に表示し、空白や壊れたカードを出さない。

- [ ] **Step 3: 一覧/詳細ページを実装する**

外部リンクは `target="_blank" rel="noopener noreferrer"` を付与する。

- [ ] **Step 4: ビルド確認してコミットする**

```bash
npm run build
git add src/data/tools.ts src/components/ToolCard.astro src/pages/tools
git commit -m "feat: add curated public tools section"
```

### Task 5: 営業トップページを完成させる

**Files:**
- Create: `src/components/Hero.astro`
- Create: `src/components/Metrics.astro`
- Create: `src/components/ServiceGrid.astro`
- Create: `src/components/ProcessSteps.astro`
- Create: `src/components/ContactCta.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `works`, `tools`。
- Produces: 営業メールから直接送っても成立するトップページ。

- [ ] **Step 1: Heroを実装する**

表示内容:

```text
業務改善・自動化開発
面倒な業務を、使える仕組みに変える。
Excel・Google Apps Script・Python・Web・API・AIを組み合わせ、手作業で続いている業務を、現場で使える小さなシステムへ変えていきます。
```

CTAは「実績を見る」「開発について相談する」の2つ。

- [ ] **Step 2: Metricsを実装する**

```text
約10年 / エンジニア経験
約100件 / 開発・業務改善
Excel・GAS・Python・Web・API / 対応領域
```

- [ ] **Step 3: ServiceGridを8項目で実装する**

設計書 `## 8. できること` の8項目をそのまま採用する。

- [ ] **Step 4: Featured Works / Tools / Process / About / CTAをトップへ統合する**

Process:

```text
01 相談
02 現在の業務を確認
03 改善案・仕様整理
04 開発
05 テスト
06 納品・改善
```

- [ ] **Step 5: 375px / 768px / 1440pxで崩れないCSSを実装する**

- [ ] **Step 6: ビルドしてコミットする**

```bash
npm run build
git add src/components src/pages/index.astro
git commit -m "feat: build Japanese conversion-focused home page"
```

### Task 6: 問い合わせフォームとサーバー検証

**Files:**
- Create: `src/components/ContactForm.astro`
- Create: `src/pages/contact.astro`
- Create: `src/pages/api/contact.ts`
- Create: `src/utils/contact.ts`
- Create: `tests/contact.test.ts`

**Interfaces:**
- Produces: `validateContactInput(input)`、`POST /api/contact`。

- [ ] **Step 1: 入力型と検証関数の失敗テストを書く**

```ts
export interface ContactInput {
  name?: string;
  email: string;
  category?: string;
  problem: string;
  request?: string;
  budget?: string;
  timing?: string;
  turnstileToken: string;
}
```

テスト:

```ts
it('メールと相談内容が必須', () => {
  expect(validateContactInput({ email: '', problem: '', turnstileToken: '' }).ok).toBe(false);
});
```

- [ ] **Step 2: 長さ・メール形式・必須同意を含む検証を実装する**

上限:

```text
name 100
email 254
problem 3000
request 3000
category/budget/timing 100
```

- [ ] **Step 3: `/api/contact` でTurnstileをサーバー検証する**

利用環境変数:

```text
TURNSTILE_SECRET_KEY
CONTACT_GAS_URL
CONTACT_SHARED_SECRET
```

- [ ] **Step 4: Turnstile成功後だけGASへPOSTする**

送信ヘッダー:

```text
Content-Type: application/json
X-Portfolio-Secret: <CONTACT_SHARED_SECRET>
```

- [ ] **Step 5: フォームUIの状態遷移を実装する**

```ts
'idle' | 'submitting' | 'success' | 'validation-error' | 'network-error'
```

送信中はボタンをdisabledにし、「送信しています…」を表示する。

- [ ] **Step 6: APIテストとビルドを実行する**

Run: `npm run test && npm run build`
Expected: PASS。

- [ ] **Step 7: コミットする**

```bash
git add src/components/ContactForm.astro src/pages/contact.astro src/pages/api/contact.ts src/utils/contact.ts tests/contact.test.ts
git commit -m "feat: add secure contact workflow"
```

### Task 7: プライバシー・SEO・OGP

**Files:**
- Create: `src/pages/privacy.astro`
- Create: `src/utils/seo.ts`
- Create: `public/robots.txt`
- Create: `public/og-default.svg`
- Create: `public/favicon.svg`
- Modify: `src/layouts/BaseLayout.astro`

**Interfaces:**
- Produces: 各ページのtitle/description/canonical/OGPと最低限のプライバシー表示。

- [ ] **Step 1: 日本語プライバシーポリシーを実装する**

必須項目: 取得情報、利用目的、保存、第三者提供、問い合わせ、改定。

- [ ] **Step 2: SEO helperを実装する**

```ts
export const siteName = 'TI AUTOMATION STUDIO';
export const defaultDescription = 'Excel・GAS・Python・Web・API・AIを活用した業務改善・自動化開発。';
```

- [ ] **Step 3: OGP / canonical / robots / faviconを反映する**

- [ ] **Step 4: JSON-LDを追加する**

個人名を出さず `ProfessionalService` 相当の構造で、公開可能な情報だけを記載する。

- [ ] **Step 5: ビルドしてコミットする**

```bash
npm run build
git add src/pages/privacy.astro src/utils/seo.ts src/layouts/BaseLayout.astro public
git commit -m "feat: add privacy and Japanese SEO metadata"
```

### Task 8: E2E・アクセシビリティ・レスポンシブ確認

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/smoke.spec.ts`

**Interfaces:**
- Produces: 主要導線を壊さない自動スモークテスト。

- [ ] **Step 1: トップ→実績→問い合わせのテストを書く**

```ts
import { test, expect } from '@playwright/test';

test('主要営業導線が表示できる', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /面倒な業務を/ })).toBeVisible();
  await page.getByRole('link', { name: '実績を見る' }).click();
  await expect(page).toHaveURL(/works/);
});
```

- [ ] **Step 2: 375pxスマホ表示をテストする**

- [ ] **Step 3: ナビゲーションのキーボードfocusを確認する**

- [ ] **Step 4: 全テスト・全ビルドを実行する**

```bash
npm run test
npm run build
npm run test:e2e
```

Expected: 全てPASS。

- [ ] **Step 5: コミットする**

```bash
git add playwright.config.ts e2e
git commit -m "test: add portfolio smoke coverage"
```

### Task 9: Cloudflare Workers公開設定と運用ドキュメント

**Files:**
- Modify: `wrangler.jsonc`
- Modify: `README.md`
- Create: `.dev.vars.example`

**Interfaces:**
- Produces: Cloudflareへ安全にデプロイするための設定と手順。

- [ ] **Step 1: `.dev.vars.example` を作る**

```text
TURNSTILE_SECRET_KEY=
CONTACT_GAS_URL=
CONTACT_SHARED_SECRET=
```

`.dev.vars` 自体はgitignoreする。

- [ ] **Step 2: READMEへCloudflare接続手順を追記する**

記載事項:

```text
1. GitHubリポジトリをCloudflareへ接続
2. Build command: npm run build
3. SecretsをCloudflare側に登録
4. Turnstile Site Keyを公開環境設定へ登録
5. カスタムドメイン設定
6. main push後の公開確認
```

- [ ] **Step 3: ローカル秘密情報がコミットされていないことを確認する**

Run:

```bash
git grep -n -E "(SECRET|API_KEY|TOKEN|CONTACT_GAS_URL)" -- ':!docs/**' ':!.dev.vars.example'
```

Expected: 実値の秘密情報なし。

- [ ] **Step 4: 最終ビルドとコミット**

```bash
npm run test && npm run build && npm run test:e2e
git add README.md wrangler.jsonc .dev.vars.example .gitignore
git commit -m "docs: add Cloudflare deployment guide"
```

## Final Verification

- [ ] 日本語中心のトップページになっている。
- [ ] Heroのメインコピーが設計書と一致している。
- [ ] 本名、住所、勤務先、電話番号、家族情報がない。
- [ ] 顧客名、現場名、担当者名、顧客データがない。
- [ ] 実績一覧/詳細が動く。
- [ ] 公開ツール0件でも破綻しない。
- [ ] 問い合わせの送信中/成功/失敗が視認できる。
- [ ] Turnstile secret/GAS URL/共有秘密がクライアントへ露出しない。
- [ ] 375px、768px、1440pxで主要ページが成立する。
- [ ] `npm run test` がPASSする。
- [ ] `npm run build` がPASSする。
- [ ] `npm run test:e2e` がPASSする。
- [ ] Cloudflare Workersへデプロイできる。
