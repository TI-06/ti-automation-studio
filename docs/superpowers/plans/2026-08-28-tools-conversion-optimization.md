# 公開ツール導線・SEO横断改善 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 4本の公開ツールで、結果生成後だけ自然な相談CTAを表示し、`/tools` の目的別入口、問い合わせsource引き継ぎ、FAQ構造化データ、関連ツール内部リンクを横断的に整える。

**Architecture:** `src/data/tool-conversion.ts` を唯一のsource/CTA設定として使い、`ToolResultCTA.astro` はその設定を描画するだけにする。各ツールの既存コントローラーは成功時にCTAを表示し、結果をクリアする操作では非表示へ戻す。問い合わせページは `Astro.url.searchParams` を固定ホワイトリストで解釈し、ツール入力値や結果値は一切引き継がない。

**Tech Stack:** Astro 6 / TypeScript 6 / Vitest / Cloudflare Workers / 既存CSSデザイントークン

**Spec:** `docs/superpowers/specs/2026-08-28-tools-conversion-optimization-design.md`

## Global Constraints

- CTAはツール利用前・入力中・処理中には表示しない。
- CTAは結果正常生成後だけ表示する。
- 問い合わせへ引き継ぐ情報は `source` の4固定値だけ。
- ファイル名、セル内容、差分、集計値、診断入力、人件費、工数、スコア、フィルター条件をURL・フォーム・hidden inputへ入れない。
- 行動トラッキング、外部解析SDK、Cookie、localStorage、sessionStorageを追加しない。
- 問い合わせAPI `/api/contact` のpayload仕様を変更しない。
- ダッシュボードの結果CTAは `data-dashboard-export-area` の外に置く。
- 自動化診断の結果CTAは `data-print-ignore` を付けてPDF印刷対象外にする。
- 既存のページ下部CTAは残す。
- 既存4ツールの処理ロジック・ファイル処理・出力仕様は変更しない。
- 完了判定は `npm test` と `npm run build` の両方が成功した場合のみ。

---

## File Structure

### 新規

- `src/data/tool-conversion.ts` — 4つのsourceホワイトリスト、問い合わせ表示名、初期カテゴリ、結果CTA文言、関連サービスURLを一元管理。
- `src/components/tools/ToolResultCTA.astro` — 初期 `hidden` の共通結果CTA。source別設定を描画。
- `src/scripts/tools/result-cta.ts` — DOM要素のshow/hideだけを担当する小さなブラウザ用ヘルパー。
- `tests/tool-conversion.test.ts` — source whitelist、contact href、CTA設定の純粋関数テスト。
- `tests/tool-result-cta.test.ts` — 共通コンポーネント契約と4ツールの表示連動契約。
- `tests/tools-seo-links.test.ts` — FAQPageと関連ツール内部リンクの横断契約。

### 変更

- `src/pages/tools/excel-diff.astro`
- `src/pages/tools/data-cleaner.astro`
- `src/pages/tools/dashboard-builder.astro`
- `src/pages/tools/automation-diagnosis.astro`
- `src/scripts/tools/excel-diff.ts`
- `src/scripts/tools/data-cleaner.ts`
- `src/scripts/tools/dashboard-builder/controller.ts`
- `src/scripts/tools/automation-diagnosis/controller.ts`
- `src/pages/contact.astro`
- `src/pages/tools/index.astro`
- `tests/contact.test.ts`
- `tests/tools-index.test.ts`

---

### Task 1: source設定と共通結果CTA

**Files:**
- Create: `src/data/tool-conversion.ts`
- Create: `src/components/tools/ToolResultCTA.astro`
- Create: `src/scripts/tools/result-cta.ts`
- Create: `tests/tool-conversion.test.ts`
- Create: `tests/tool-result-cta.test.ts`

**Interfaces:**
- Produces: `ToolSource`
- Produces: `TOOL_CONVERSION_CONFIG`
- Produces: `parseToolSource(value: string | null | undefined): ToolSource | null`
- Produces: `toolContactHref(source: ToolSource): string`
- Produces: `bindToolResultCta(source: ToolSource): { show(): void; hide(): void }`
- Produces: `<ToolResultCTA source="..." printIgnore? />`

- [ ] **Step 1: source whitelistの失敗テストを書く**

`tests/tool-conversion.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  TOOL_CONVERSION_CONFIG,
  parseToolSource,
  toolContactHref,
} from '../src/data/tool-conversion';

describe('公開ツール相談導線設定', () => {
  it('許可した4sourceだけを受け付ける', () => {
    expect(parseToolSource('excel-diff')).toBe('excel-diff');
    expect(parseToolSource('data-cleaner')).toBe('data-cleaner');
    expect(parseToolSource('dashboard-builder')).toBe('dashboard-builder');
    expect(parseToolSource('automation-diagnosis')).toBe('automation-diagnosis');
    expect(parseToolSource('<script>alert(1)</script>')).toBeNull();
    expect(parseToolSource('unknown')).toBeNull();
    expect(parseToolSource(null)).toBeNull();
  });

  it('sourceだけを問い合わせURLへ渡す', () => {
    expect(toolContactHref('excel-diff')).toBe('/contact?source=excel-diff');
    expect(toolContactHref('dashboard-builder')).toBe('/contact?source=dashboard-builder');
  });

  it('4ツールそれぞれに相談文脈と既存サービスURLを持つ', () => {
    expect(TOOL_CONVERSION_CONFIG['excel-diff'].serviceHref).toBe('/services/excel-automation');
    expect(TOOL_CONVERSION_CONFIG['data-cleaner'].serviceHref).toBe('/services/python-data-processing');
    expect(TOOL_CONVERSION_CONFIG['dashboard-builder'].serviceHref).toBe('/services/excel-automation');
    expect(TOOL_CONVERSION_CONFIG['automation-diagnosis'].serviceHref).toBe('/services');
  });
});
```

- [ ] **Step 2: テストを実行してREDを確認する**

Run:

```bash
npm test -- tests/tool-conversion.test.ts
```

Expected: `../src/data/tool-conversion` が存在しないためFAIL。

- [ ] **Step 3: source設定を実装する**

`src/data/tool-conversion.ts`:

```ts
export type ToolSource =
  | 'excel-diff'
  | 'data-cleaner'
  | 'dashboard-builder'
  | 'automation-diagnosis';

export interface ToolConversionConfig {
  source: ToolSource;
  contextLabel: string;
  category: string;
  resultTitle: string;
  resultDescription: string;
  serviceHref: string;
  serviceLabel: string;
  contactLabel: string;
}

export const TOOL_CONVERSION_CONFIG: Record<ToolSource, ToolConversionConfig> = {
  'excel-diff': {
    source: 'excel-diff',
    contextLabel: 'Excel差分比較ツールからのご相談',
    category: 'Excel・スプレッドシート自動化',
    resultTitle: '毎回この比較作業をしていますか？',
    resultDescription: '複数ファイルの一括比較、定期実行、差分結果の自動保存や通知まで専用化できます。',
    serviceHref: '/services/excel-automation',
    serviceLabel: 'Excel自動化を見る',
    contactLabel: 'この比較作業を相談する',
  },
  'data-cleaner': {
    source: 'data-cleaner',
    contextLabel: 'CSV・Excelデータ整理ツールからのご相談',
    category: 'Python・データ処理',
    resultTitle: '毎回同じデータ整理をしていますか？',
    resultDescription: '定期CSVの整形、重複除去、複数ファイル統合、別システム用フォーマット変換を一括処理できます。',
    serviceHref: '/services/python-data-processing',
    serviceLabel: 'データ処理自動化を見る',
    contactLabel: 'このデータ整理を相談する',
  },
  'dashboard-builder': {
    source: 'dashboard-builder',
    contextLabel: 'Excel・CSVダッシュボード作成ツールからのご相談',
    category: 'Excel・スプレッドシート自動化',
    resultTitle: '毎月この集計・グラフ更新をしていますか？',
    resultDescription: 'ファイルを置くだけで更新する仕組みや、複数人で共有する常設ダッシュボードへ発展できます。',
    serviceHref: '/services/excel-automation',
    serviceLabel: 'Excel自動化を見る',
    contactLabel: 'この集計業務を相談する',
  },
  'automation-diagnosis': {
    source: 'automation-diagnosis',
    contextLabel: '業務自動化診断ツールからのご相談',
    category: 'その他・まだ分からない',
    resultTitle: '診断した業務を、実際の改善設計まで整理できます。',
    resultDescription: '全自動にする部分と、人の判断を残す部分を分けて、既存環境に合う構成を検討できます。',
    serviceHref: '/services',
    serviceLabel: '業務自動化サービスを見る',
    contactLabel: '診断した業務を相談する',
  },
};

export function parseToolSource(value: string | null | undefined): ToolSource | null {
  if (!value) return null;
  return Object.prototype.hasOwnProperty.call(TOOL_CONVERSION_CONFIG, value)
    ? value as ToolSource
    : null;
}

export function toolContactHref(source: ToolSource): string {
  return `/contact?source=${source}`;
}
```

- [ ] **Step 4: 共通CTAコンポーネント契約の失敗テストを書く**

`tests/tool-result-cta.test.ts` の冒頭:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const component = readFileSync(new URL('../src/components/tools/ToolResultCTA.astro', import.meta.url), 'utf-8');
const helper = readFileSync(new URL('../src/scripts/tools/result-cta.ts', import.meta.url), 'utf-8');

describe('結果後相談CTA', () => {
  it('初期非表示でsourceだけを問い合わせへ渡す', () => {
    expect(component).toContain('data-tool-result-cta');
    expect(component).toContain('hidden');
    expect(component).toContain('toolContactHref');
    expect(component).toContain('config.serviceHref');
  });

  it('show/hideだけを行う共通ヘルパーを持つ', () => {
    expect(helper).toContain('bindToolResultCta');
    expect(helper).toContain('element.hidden = false');
    expect(helper).toContain('element.hidden = true');
    expect(helper).not.toContain('fetch(');
    expect(helper).not.toContain('localStorage');
  });
});
```

- [ ] **Step 5: CTAコンポーネントとshow/hideヘルパーを実装する**

`src/scripts/tools/result-cta.ts`:

```ts
import type { ToolSource } from '../../data/tool-conversion';

export interface ToolResultCtaBinding {
  show(): void;
  hide(): void;
}

export function bindToolResultCta(source: ToolSource): ToolResultCtaBinding {
  const element = document.querySelector<HTMLElement>(`[data-tool-result-cta="${source}"]`);
  if (!element) throw new Error(`結果CTAが見つかりません: ${source}`);
  return {
    show() { element.hidden = false; },
    hide() { element.hidden = true; },
  };
}
```

`src/components/tools/ToolResultCTA.astro` は `source: ToolSource` と `printIgnore?: boolean` を受け、`TOOL_CONVERSION_CONFIG[source]` を使って以下を描画する。

```astro
<aside
  class="tool-result-cta"
  data-tool-result-cta={source}
  data-print-ignore={printIgnore ? '' : undefined}
  hidden
>
  <div>
    <p class="tool-result-cta-eyebrow">NEXT STEP</p>
    <h2>{config.resultTitle}</h2>
    <p>{config.resultDescription}</p>
  </div>
  <div class="tool-result-cta-actions">
    <a class="btn" href={config.serviceHref}>{config.serviceLabel}</a>
    <a class="btn btn-primary" href={toolContactHref(source)}>{config.contactLabel}</a>
  </div>
</aside>
```

同コンポーネント内の scoped `<style>` で既存 `--border`, `--accent`, `--muted` を使い、広告カードではなく結果レポートの延長に見える横長レイアウトを作る。`@media (max-width: 760px)` で1列化する。

- [ ] **Step 6: Task 1テストをGREENにする**

Run:

```bash
npm test -- tests/tool-conversion.test.ts tests/tool-result-cta.test.ts
```

Expected: PASS。

- [ ] **Step 7: Commit**

```bash
git add src/data/tool-conversion.ts src/components/tools/ToolResultCTA.astro src/scripts/tools/result-cta.ts tests/tool-conversion.test.ts tests/tool-result-cta.test.ts
git commit -m "feat: add shared result conversion CTA"
```

---

### Task 2: Excel差分比較の結果連動

**Files:**
- Modify: `src/pages/tools/excel-diff.astro`
- Modify: `src/scripts/tools/excel-diff.ts`
- Modify: `tests/tool-result-cta.test.ts`

**Interfaces:**
- Consumes: `<ToolResultCTA source="excel-diff" />`
- Consumes: `bindToolResultCta('excel-diff')`

- [ ] **Step 1: Excel差分の失敗テストを追加する**

```ts
const excelPage = readFileSync(new URL('../src/pages/tools/excel-diff.astro', import.meta.url), 'utf-8');
const excelClient = readFileSync(new URL('../src/scripts/tools/excel-diff.ts', import.meta.url), 'utf-8');

it('Excel差分は比較成功後だけCTAを表示し結果クリアで隠す', () => {
  expect(excelPage).toContain('<ToolResultCTA source="excel-diff"');
  expect(excelClient).toContain("bindToolResultCta('excel-diff')");
  expect(excelClient).toContain('resultCta.show()');
  expect(excelClient).toContain('resultCta.hide()');
});
```

- [ ] **Step 2: REDを確認する**

Run:

```bash
npm test -- tests/tool-result-cta.test.ts
```

Expected: CTA未配置・未連動でFAIL。

- [ ] **Step 3: ページへCTAを追加する**

`ToolShell` 内で `data-excel-diff-app` の直後に配置する。

```astro
<ToolResultCTA source="excel-diff" />
```

- [ ] **Step 4: controllerを成功/クリアへ接続する**

`src/scripts/tools/excel-diff.ts` で `bindToolResultCta` をimportし、root初期化直後に:

```ts
const resultCta = bindToolResultCta('excel-diff');
```

`renderResults()` の末尾で:

```ts
resultCta.show();
```

`clearResults()` の末尾で:

```ts
resultCta.hide();
```

エラー経路では `renderResults()` を呼ばないため表示されない。ファイル変更・resetは既存 `clearResults()` を通るので非表示へ戻る。

- [ ] **Step 5: GREENを確認する**

```bash
npm test -- tests/tool-result-cta.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/tools/excel-diff.astro src/scripts/tools/excel-diff.ts tests/tool-result-cta.test.ts
git commit -m "feat: show Excel diff CTA after comparison"
```

---

### Task 3: データ整理の診断完了連動

**Files:**
- Modify: `src/pages/tools/data-cleaner.astro`
- Modify: `src/scripts/tools/data-cleaner.ts`
- Modify: `tests/tool-result-cta.test.ts`

**Interfaces:**
- Consumes: `<ToolResultCTA source="data-cleaner" />`
- Consumes: `bindToolResultCta('data-cleaner')`

- [ ] **Step 1: データ整理の失敗テストを追加する**

```ts
const cleanerPage = readFileSync(new URL('../src/pages/tools/data-cleaner.astro', import.meta.url), 'utf-8');
const cleanerClient = readFileSync(new URL('../src/scripts/tools/data-cleaner.ts', import.meta.url), 'utf-8');

it('データ整理は健康診断完了後だけCTAを表示する', () => {
  expect(cleanerPage).toContain('<ToolResultCTA source="data-cleaner"');
  expect(cleanerClient).toContain("bindToolResultCta('data-cleaner')");
  expect(cleanerClient).toContain('resultCta.show()');
  expect(cleanerClient).toContain('resultCta.hide()');
});
```

- [ ] **Step 2: REDを確認する**

```bash
npm test -- tests/tool-result-cta.test.ts
```

- [ ] **Step 3: CTAをページへ追加する**

`data-cleaner-app` グリッドの直後、dialogより前に:

```astro
<ToolResultCTA source="data-cleaner" />
```

- [ ] **Step 4: 診断Worker状態へ接続する**

`bindToolResultCta('data-cleaner')` を生成する。

以下で `resultCta.hide()`:
- `adoptDataset()` の診断開始前
- Worker `message.type === 'error'`
- `resetAll()`

Worker `complete` で `state.diagnostics = message.diagnostics` を設定し、`renderAll()` した後に:

```ts
resultCta.show();
```

整理候補0件でも正常診断なら表示する。

- [ ] **Step 5: GREENを確認する**

```bash
npm test -- tests/tool-result-cta.test.ts tests/data-cleaner-diagnostics.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/tools/data-cleaner.astro src/scripts/tools/data-cleaner.ts tests/tool-result-cta.test.ts
git commit -m "feat: show data cleaner CTA after diagnosis"
```

---

### Task 4: ダッシュボード生成完了連動

**Files:**
- Modify: `src/pages/tools/dashboard-builder.astro`
- Modify: `src/scripts/tools/dashboard-builder/controller.ts`
- Modify: `tests/tool-result-cta.test.ts`

**Interfaces:**
- Consumes: `<ToolResultCTA source="dashboard-builder" />`
- Consumes: `bindToolResultCta('dashboard-builder')`

- [ ] **Step 1: ダッシュボードの失敗テストを追加する**

```ts
const dashboardPage = readFileSync(new URL('../src/pages/tools/dashboard-builder.astro', import.meta.url), 'utf-8');
const dashboardClient = readFileSync(new URL('../src/scripts/tools/dashboard-builder/controller.ts', import.meta.url), 'utf-8');

it('ダッシュボードは1ウィジェット以上の集計結果生成後にCTAを表示する', () => {
  expect(dashboardPage).toContain('<ToolResultCTA source="dashboard-builder"');
  expect(dashboardPage.indexOf('<ToolResultCTA source="dashboard-builder"')).toBeGreaterThan(dashboardPage.indexOf('data-dashboard-export-area'));
  expect(dashboardClient).toContain("bindToolResultCta('dashboard-builder')");
  expect(dashboardClient).toContain('resultCta.show()');
  expect(dashboardClient).toContain('resultCta.hide()');
});
```

- [ ] **Step 2: REDを確認する**

```bash
npm test -- tests/tool-result-cta.test.ts
```

- [ ] **Step 3: export対象外の場所へCTAを追加する**

`dashboard-app` 内で `data-dashboard-export-area` を含むダッシュボード表示の後、ただし `ToolShell` 内に:

```astro
<ToolResultCTA source="dashboard-builder" />
```

CTAを `data-dashboard-export-area` の子要素にしない。

- [ ] **Step 4: 集計完了・リセットへ接続する**

`renderAllResults()` の最後で:

```ts
if (state.dataset && state.widgets.length > 0) resultCta.show();
else resultCta.hide();
```

`resetDashboard()` では `resultCta.hide()`。

`renderWidgets()` の空状態分岐でも、最後のウィジェットを削除した場合に対応して:

```ts
if (!state.dataset || state.widgets.length === 0) {
  resultCta.hide();
  // existing empty rendering
}
```

分析開始時は古い結果を見せないため、`setDataset()` または `requestAnalysis()` の新データ解析開始時に `resultCta.hide()` を呼ぶ。

- [ ] **Step 5: GREENを確認する**

```bash
npm test -- tests/tool-result-cta.test.ts tests/dashboard-client.test.ts tests/dashboard-aggregate.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/tools/dashboard-builder.astro src/scripts/tools/dashboard-builder/controller.ts tests/tool-result-cta.test.ts
git commit -m "feat: show dashboard CTA after aggregation"
```

---

### Task 5: 自動化診断の結果連動と印刷除外

**Files:**
- Modify: `src/pages/tools/automation-diagnosis.astro`
- Modify: `src/scripts/tools/automation-diagnosis/controller.ts`
- Modify: `tests/tool-result-cta.test.ts`
- Modify: `tests/automation-diagnosis-page.test.ts`

**Interfaces:**
- Consumes: `<ToolResultCTA source="automation-diagnosis" printIgnore />`
- Consumes: `bindToolResultCta('automation-diagnosis')`

- [ ] **Step 1: 診断CTAの失敗テストを追加する**

```ts
it('自動化診断は結果表示後にCTAを出しPDF印刷から除外する', () => {
  expect(diagnosisPage).toContain('<ToolResultCTA source="automation-diagnosis" printIgnore');
  expect(diagnosisClient).toContain("bindToolResultCta('automation-diagnosis')");
  expect(diagnosisClient).toContain('resultCta.show()');
  expect(diagnosisClient).toContain('resultCta.hide()');
});
```

- [ ] **Step 2: REDを確認する**

```bash
npm test -- tests/tool-result-cta.test.ts tests/automation-diagnosis-page.test.ts
```

- [ ] **Step 3: STEP 6の結果直後へCTAを配置する**

結果レポートと結果アクションの後に:

```astro
<ToolResultCTA source="automation-diagnosis" printIgnore />
```

- [ ] **Step 4: `calculateAndRender()` の成功時だけ表示する**

```ts
function calculateAndRender(): boolean {
  const input = readInput();
  const validation = validateAutomationDiagnosisInput(input);
  showMessages(validation.messages, validation.warnings);
  if (!validation.valid) {
    resultCta.hide();
    return false;
  }
  renderResult(buildAutomationDiagnosisReport(input, reductionRate));
  resultCta.show();
  return true;
}
```

`reset()` で `resultCta.hide()`。

`restartButton` のイベントも結果を離れるので:

```ts
restartButton.addEventListener('click', () => {
  resultCta.hide();
  renderStep(1);
});
```

削減率変更は結果の再計算なのでCTAは表示したままにする。

- [ ] **Step 5: GREENを確認する**

```bash
npm test -- tests/tool-result-cta.test.ts tests/automation-diagnosis-page.test.ts tests/automation-diagnosis-client.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/tools/automation-diagnosis.astro src/scripts/tools/automation-diagnosis/controller.ts tests/tool-result-cta.test.ts tests/automation-diagnosis-page.test.ts
git commit -m "feat: show automation CTA after diagnosis"
```

---

### Task 6: 問い合わせsource引き継ぎ

**Files:**
- Modify: `src/pages/contact.astro`
- Modify: `tests/contact.test.ts`
- Reuse: `src/data/tool-conversion.ts`

**Interfaces:**
- Consumes: `parseToolSource(Astro.url.searchParams.get('source'))`
- Consumes: `TOOL_CONVERSION_CONFIG[source]`
- Does not modify: `/api/contact` payload contract

- [ ] **Step 1: source whitelistとフォーム表示の失敗テストを書く**

`tests/contact.test.ts` へ:

```ts
import { parseToolSource, TOOL_CONVERSION_CONFIG } from '../src/data/tool-conversion';

it('問い合わせsourceは固定4値以外を無視する', () => {
  expect(parseToolSource('excel-diff')).toBe('excel-diff');
  expect(parseToolSource('javascript:alert(1)')).toBeNull();
});

it('問い合わせ画面はsource文脈を表示するがツール結果を引き継がない', () => {
  expect(contactPageSource).toContain("Astro.url.searchParams.get('source')");
  expect(contactPageSource).toContain('ツールに読み込んだファイルや結果は、この問い合わせ画面には引き継がれていません');
  expect(contactPageSource).toContain('sourceConfig?.category');
  expect(contactPageSource).not.toContain('fileName');
  expect(contactPageSource).not.toContain('annualHours');
  expect(contactPageSource).not.toContain('diagnosisScore');
  expect(TOOL_CONVERSION_CONFIG['data-cleaner'].category).toBe('Python・データ処理');
});
```

- [ ] **Step 2: REDを確認する**

```bash
npm test -- tests/contact.test.ts
```

- [ ] **Step 3: Astro frontmatterでsourceを安全に解釈する**

`src/pages/contact.astro`:

```ts
import { parseToolSource, TOOL_CONVERSION_CONFIG } from '../data/tool-conversion';

const toolSource = parseToolSource(Astro.url.searchParams.get('source'));
const sourceConfig = toolSource ? TOOL_CONVERSION_CONFIG[toolSource] : null;
```

フォーム直前に:

```astro
{sourceConfig && (
  <div class="contact-source-context">
    <span>TOOL RESULT</span>
    <strong>{sourceConfig.contextLabel}</strong>
    <p>ツールに読み込んだファイルや結果は、この問い合わせ画面には引き継がれていません。必要な範囲だけご記入ください。</p>
  </div>
)}
```

既存カテゴリoptionへ明示valueを付け、sourceConfigに合う項目だけ `selected` にする。例:

```astro
<option value="Excel・スプレッドシート自動化" selected={sourceConfig?.category === 'Excel・スプレッドシート自動化'}>Excel・スプレッドシート自動化</option>
```

フォーム送信JSのpayloadは一切変更しない。

- [ ] **Step 4: 問い合わせコンテキストを既存デザインへ合わせる**

`contact.astro` の scoped style または既存ページstyle領域へ `.contact-source-context` を追加し、細いborder、accentの小見出し、アイボリー本文のみで構成する。モーダル・強制スクロール・追従表示は使わない。

- [ ] **Step 5: GREENを確認する**

```bash
npm test -- tests/contact.test.ts tests/tool-conversion.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/contact.astro tests/contact.test.ts
git commit -m "feat: preserve tool context on contact page"
```

---

### Task 7: `/tools` の「目的から選ぶ」入口

**Files:**
- Modify: `src/pages/tools/index.astro`
- Modify: `tests/tools-index.test.ts`

**Interfaces:**
- Produces normal links only; no JavaScript state.

- [ ] **Step 1: 目的別入口の失敗テストを書く**

```ts
it('目的から4ツールを選べるコンパクトな入口を持つ', () => {
  expect(source).toContain('目的から選ぶ');
  expect(source).toContain('比較する');
  expect(source).toContain('整える');
  expect(source).toContain('見える化する');
  expect(source).toContain('自動化できるか調べる');
  expect(source).toContain('href="/tools/excel-diff"');
  expect(source).toContain('href="/tools/data-cleaner"');
  expect(source).toContain('href="/tools/dashboard-builder"');
  expect(source).toContain('href="/tools/automation-diagnosis"');
});
```

- [ ] **Step 2: REDを確認する**

```bash
npm test -- tests/tools-index.test.ts
```

- [ ] **Step 3: ヒーローとカード一覧の間へ目的別ショートカットを追加する**

構造:

```astro
<nav class="tools-purpose-nav" aria-label="目的から公開ツールを選ぶ">
  <p class="eyebrow">目的から選ぶ</p>
  <div class="tools-purpose-grid">
    <a href="/tools/excel-diff"><span>比較する</span><small>2つのExcelの変更箇所を確認</small></a>
    <a href="/tools/data-cleaner"><span>整える</span><small>CSV・Excelの重複や表記を整理</small></a>
    <a href="/tools/dashboard-builder"><span>見える化する</span><small>表データからKPI・グラフを作成</small></a>
    <a href="/tools/automation-diagnosis"><span>自動化できるか調べる</span><small>工数と自動化適性を診断</small></a>
  </div>
</nav>
```

CSSは現在の同ページ `<style>` 内へ追加。デスクトップ4列、860px以下2列、520px以下1列。既存カードプレビューの高さやレイアウトは変更しない。

- [ ] **Step 4: GREENを確認する**

```bash
npm test -- tests/tools-index.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/tools/index.astro tests/tools-index.test.ts
git commit -m "feat: add purpose shortcuts to tools hub"
```

---

### Task 8: FAQ構造化データと関連ツール内部リンク

**Files:**
- Modify: `src/pages/tools/excel-diff.astro`
- Modify: `src/pages/tools/data-cleaner.astro`
- Modify: `src/pages/tools/dashboard-builder.astro`
- Modify: `src/pages/tools/automation-diagnosis.astro`
- Create: `tests/tools-seo-links.test.ts`

**Interfaces:**
- No runtime state.
- Structured data must match visible FAQ meaning.

- [ ] **Step 1: SEO横断契約の失敗テストを書く**

`tests/tools-seo-links.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = (name: string) => readFileSync(new URL(`../src/pages/tools/${name}.astro`, import.meta.url), 'utf-8');
const excel = page('excel-diff');
const cleaner = page('data-cleaner');
const dashboard = page('dashboard-builder');
const diagnosis = page('automation-diagnosis');

describe('公開ツールSEO・内部リンク', () => {
  it('FAQ本文を持つ4ページにFAQPageを持たせる', () => {
    [excel, cleaner, dashboard, diagnosis].forEach((source) => expect(source).toContain("'@type': 'FAQPage'"));
  });

  it('各ツールから文脈に合う関連ツールへ内部リンクする', () => {
    expect(excel).toContain('href="/tools/data-cleaner"');
    expect(excel).toContain('href="/tools/automation-diagnosis"');
    expect(cleaner).toContain('href="/tools/excel-diff"');
    expect(cleaner).toContain('href="/tools/dashboard-builder"');
    expect(cleaner).toContain('href="/tools/automation-diagnosis"');
    expect(dashboard).toContain('href="/tools/data-cleaner"');
    expect(dashboard).toContain('href="/tools/automation-diagnosis"');
    expect(diagnosis).toContain('href="/tools/excel-diff"');
    expect(diagnosis).toContain('href="/tools/data-cleaner"');
    expect(diagnosis).toContain('href="/tools/dashboard-builder"');
  });
});
```

- [ ] **Step 2: REDを確認する**

```bash
npm test -- tests/tools-seo-links.test.ts
```

Expected: Excel差分・データ整理・ダッシュボードのFAQPageと関連ツールリンク不足でFAIL。

- [ ] **Step 3: FAQPageを追加する**

各ページの既存 `structuredData` 配列へFAQPageを追加し、画面上のFAQから3〜4問を同じ意味で記述する。

Excel差分例:

```ts
{
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Excelファイルはサーバーへ送信されますか？',
      acceptedAnswer: { '@type': 'Answer', text: 'いいえ。比較処理はブラウザ内で行い、選択したExcelファイルを外部サーバーへ送信しません。' },
    },
  ],
}
```

データ整理・ダッシュボードも同様に、実際に画面に存在するFAQの意味だけを使用する。診断は既存FAQPageを維持し重複追加しない。

- [ ] **Step 4: 各ページ末尾CTAの前に関連ツールリンクを追加する**

既存SEO本文の末尾近くに `関連ツール` セクションを1つ追加する。アンカーはツール名または目的が分かる文言にする。

例 Excel差分:

```astro
<section class="tool-seo-section">
  <p class="eyebrow">関連ツール</p>
  <h2>比較の前後に使える無料ツール</h2>
  <div class="hero-actions">
    <a class="btn" href="/tools/data-cleaner">CSV・Excelデータを整理する</a>
    <a class="btn" href="/tools/automation-diagnosis">この作業を自動化できるか診断する</a>
  </div>
</section>
```

- [ ] **Step 5: GREENを確認する**

```bash
npm test -- tests/tools-seo-links.test.ts tests/tools-index.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/tools/excel-diff.astro src/pages/tools/data-cleaner.astro src/pages/tools/dashboard-builder.astro src/pages/tools/automation-diagnosis.astro tests/tools-seo-links.test.ts
git commit -m "feat: strengthen tool SEO and internal links"
```

---

### Task 9: 最終回帰・プライバシー・Cloudflare build

**Files:**
- Modify if needed: tests only for confirmed gaps
- Verify all files changed in Tasks 1-8

**Interfaces:**
- Final integration gate only.

- [ ] **Step 1: プライバシー回帰テストを追加する**

`tests/tool-result-cta.test.ts` に4controllerをまとめて確認するテストを追加:

```ts
it('結果CTA連携は入力データ送信やブラウザ永続化を追加しない', () => {
  [excelClient, cleanerClient, dashboardClient, diagnosisClient].forEach((source) => {
    expect(source).not.toContain('localStorage');
    expect(source).not.toContain('sessionStorage');
  });
  expect(component).not.toContain('fileName');
  expect(component).not.toContain('annualHours');
  expect(component).not.toContain('savedCost');
});
```

既存controllerに元々 `fetch(` がないことも検索またはsource assertionで確認する。問い合わせページの既存 `/api/contact` fetchは対象外。

- [ ] **Step 2: 全テストを実行する**

```bash
npm test
```

Expected: 0 failures。

- [ ] **Step 3: Cloudflare向け完全buildを実行する**

```bash
npm run build
```

Expected:
- `wrangler types` success
- `astro check` 0 errors
- `astro build` success

- [ ] **Step 4: 差分レビューを行う**

確認項目:

```text
- /api/contact payloadにsourceや結果値を追加していない
- ToolResultCTAは4ページすべて初期hidden
- Excel差分: renderResults成功でshow / clearResultsでhide
- データ整理: Worker completeでshow / 診断開始・error・resetでhide
- ダッシュボード: widgets>0の集計完了でshow / 新解析・0widgets・resetでhide
- 自動化診断: calculateAndRender成功でshow / validation失敗・reset・restartでhide
- ダッシュボードCTAがdata-dashboard-export-area外
- 診断CTAがdata-print-ignore
- sourceは4固定値のみ
- /tools目的別入口が通常リンク
- FAQPageの回答が画面本文と意味一致
- 既存ページ下部CTAを削除していない
```

- [ ] **Step 5: mainとの差分状態を確認する**

```bash
git fetch origin
git rev-list --left-right --count origin/main...HEAD
```

Expected: behind `0`。mainが進んでいた場合はマージ前に同期し、再度 `npm test` と `npm run build` を行う。

- [ ] **Step 6: 最終Commit**

テスト追加だけが残った場合:

```bash
git add tests/tool-result-cta.test.ts
git commit -m "test: verify tool conversion privacy boundaries"
```

変更がなければ新規コミットは作らない。

- [ ] **Step 7: PR作成前の完成判定**

以下がすべて成立した場合だけPRへ進む。

```text
npm test: PASS
npm run build: PASS
branch behind main: 0
source whitelist: 4 values only
no tool payload forwarding
```
