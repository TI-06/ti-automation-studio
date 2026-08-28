# 業務自動化診断・工数削減シミュレーター Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 登録不要・AIなしで、現在工数、自動化適性、改善候補、人が残すべき部分、削減シミュレーションを説明可能なルールで提示し、A4縦PDFとして保存できる公開ツールを `/tools/automation-diagnosis` に追加する。

**Architecture:** 診断計算・スコアリング・提案生成を `src/lib/tools/automation-diagnosis/` の純粋関数として分離し、UIは6ステップのウィザードを `src/scripts/tools/automation-diagnosis/` で制御する。入力・結果はブラウザ内だけに保持し、サーバー送信・AI API・ログインは使用しない。PDF保存は印刷用CSS + `window.print()` とし、追加PDF依存を持たない。

**Tech Stack:** Astro, TypeScript, Vitest, browser DOM, CSS print media

**Spec:** `docs/superpowers/specs/2026-08-27-automation-diagnosis-tool-design.md`

## Global Constraints

- AI APIを使用しない。診断は100%ルールベース。
- 登録不要・完全無料。
- 入力内容をサーバーへ送信しない。
- ユーザー向け文言は原則日本語。
- 100点満点の点数は主表示しない。内部スコアだけに使用する。
- 自動化できない/人が残すべき部分も明示し、「全部自動化」を推奨しない。
- 削減率は保証値ではなくシミュレーションとして表示する。
- A4縦の印刷/PDFレイアウトを提供する。
- 氏名・会社名・メールアドレスは入力させない。
- Playwright E2Eは追加しない。Vitest + Astro check + Cloudflare buildで検証する。

---

## File Structure

- `src/lib/tools/automation-diagnosis/types.ts`: 入力、頻度、回答、診断結果、提案の型
- `src/lib/tools/automation-diagnosis/calculate.ts`: 年間回数、月間/年間時間、コスト、削減試算
- `src/lib/tools/automation-diagnosis/score.ts`: 自動化適性の内部100点計算と4段階判定
- `src/lib/tools/automation-diagnosis/recommend.ts`: 判定理由、自動化候補、人が残す部分、技術候補
- `src/lib/tools/automation-diagnosis/sample.ts`: 匿名サンプル診断入力
- `src/lib/tools/automation-diagnosis/report.ts`: 画面/PDFで使うレポートモデル生成
- `src/pages/tools/automation-diagnosis.astro`: ツールページ、SEO本文、FAQ、構造化データ
- `src/scripts/tools/automation-diagnosis.ts`: エントリーポイント
- `src/scripts/tools/automation-diagnosis/controller.ts`: 6ステップの状態・検証・結果描画・印刷
- `src/styles/automation-diagnosis.css`: 専用UI、結果画面、A4縦印刷CSS
- `src/data/tools.ts`: 公開ツール登録
- `src/pages/tools/index.astro`: 4本目の専用プレビュー
- `tests/automation-diagnosis-calculate.test.ts`
- `tests/automation-diagnosis-score.test.ts`
- `tests/automation-diagnosis-recommend.test.ts`
- `tests/automation-diagnosis-report.test.ts`
- `tests/automation-diagnosis-page.test.ts`
- `tests/automation-diagnosis-client.test.ts`
- `tests/tools.test.ts`, `tests/tools-index.test.ts`: 公開導線の回帰

---

### Task 1: 公開定義と診断型

**Files:**
- Create: `src/lib/tools/automation-diagnosis/types.ts`
- Modify: `src/data/tools.ts`
- Test: `tests/tools.test.ts`

**Interfaces:**
- Produces `AutomationDiagnosisInput`, `AutomationDiagnosisResult`, `AutomationFrequency`, `AutomationTaskType`, `AutomationEnvironment`, `AutomationSuitability`.

- [ ] **Step 1: Write the failing test**

`tests/tools.test.ts` に `automation-diagnosis` が `published: true`、`href: '/tools/automation-diagnosis'`、`processing: 'ブラウザ内処理'` であることを追加する。

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/tools.test.ts`
Expected: FAIL because `automation-diagnosis` is not defined.

- [ ] **Step 3: Write minimal implementation**

`types.ts` に以下を定義する。

```ts
export type AutomationFrequency =
  | 'daily'
  | 'weekly-multiple'
  | 'weekly'
  | 'monthly-multiple'
  | 'monthly'
  | 'yearly-multiple'
  | 'custom';

export type AutomationTaskType =
  | 'excel-input'
  | 'file-transfer'
  | 'aggregation'
  | 'verification'
  | 'email'
  | 'pdf-report'
  | 'web-input'
  | 'file-management'
  | 'approval'
  | 'external-registration'
  | 'other';

export type AutomationEnvironment =
  | 'excel'
  | 'google-sheets'
  | 'google-workspace'
  | 'internal-web'
  | 'external-web'
  | 'pdf-paper'
  | 'other';

export type AutomationSuitability = 'high' | 'fairly-high' | 'partial' | 'human-led';

export interface AutomationDiagnosisInput {
  minutesPerRun: number;
  frequency: AutomationFrequency;
  customFrequencyCount?: number;
  customFrequencyPeriod?: 'week' | 'month' | 'year';
  people: number;
  hourlyCost?: number;
  tasks: AutomationTaskType[];
  otherTaskNote?: string;
  routineLevel: 'same' | 'partial' | 'different';
  judgmentLevel: 'low' | 'some' | 'high';
  dataConsistency: 'same' | 'partial' | 'different';
  exceptionLevel: 'low' | 'some' | 'high';
  environments: AutomationEnvironment[];
  reportTitle?: string;
}
```

`src/data/tools.ts` に4本目を公開状態で追加する。

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/tools.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `feat: register automation diagnosis tool`

---

### Task 2: 工数・コスト・頻度計算

**Files:**
- Create: `src/lib/tools/automation-diagnosis/calculate.ts`
- Test: `tests/automation-diagnosis-calculate.test.ts`

**Interfaces:**
- `annualRuns(input): number`
- `calculateWorkload(input): { annualRuns; monthlyHours; annualHours; annualCost?: number }`
- `calculateSavings(annualHours, reductionRate, hourlyCost?): { savedHours; remainingHours; savedCost?: number }`

- [ ] **Step 1: Write failing tests**

固定換算を以下にする。

```ts
expect(annualRuns({ frequency: 'daily' })).toBe(240);
expect(annualRuns({ frequency: 'weekly-multiple' })).toBe(104);
expect(annualRuns({ frequency: 'weekly' })).toBe(52);
expect(annualRuns({ frequency: 'monthly-multiple' })).toBe(24);
expect(annualRuns({ frequency: 'monthly' })).toBe(12);
expect(annualRuns({ frequency: 'yearly-multiple' })).toBe(4);
```

サンプル「15分 × 月20回 × 3人」が年180時間になること、60%削減で108時間削減・72時間残存になることを検証する。

- [ ] **Step 2: Run test and confirm RED**

Run: `npm test -- tests/automation-diagnosis-calculate.test.ts`
Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement pure calculations**

カスタム頻度は `week × 52`, `month × 12`, `year × 1`。月間時間は年間/12。負数・NaNは計算前に例外にする。

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- tests/automation-diagnosis-calculate.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `feat: add automation workload calculations`

---

### Task 3: 説明可能な自動化適性スコア

**Files:**
- Create: `src/lib/tools/automation-diagnosis/score.ts`
- Test: `tests/automation-diagnosis-score.test.ts`

**Interfaces:**
- `scoreAutomationSuitability(input, workload): { score: number; suitability: AutomationSuitability; positiveFactors: string[]; cautionFactors: string[] }`

- [ ] **Step 1: Write failing tests**

内部100点は以下の配点で固定する。

- 定型度: same +20 / partial +10 / different -15
- 判断: low +20 / some +5 / high -20
- データ形式: same +15 / partial +7 / different -12
- 例外: low +15 / some +5 / high -15
- 年間回数: >=120 +10 / >=52 +7 / >=12 +3
- 年間工数: >=200h +10 / >=80h +7 / >=24h +3
- 人数: >=5 +5 / >=2 +3
- 自動化向き作業（転記、集計、メール、帳票、ファイル整理、外部登録）を1つ以上含む +5

初期50点から加減し、0〜100へclampする。

判定:
- 75以上: `high`
- 60〜74: `fairly-high`
- 40〜59: `partial`
- 39以下: `human-led`

上限制約:
- `judgmentLevel === 'high'` の場合は `high` にしない（最大 `fairly-high`）
- `routineLevel === 'different'` かつ `exceptionLevel === 'high'` の場合は最大 `partial`

テストでは「大量作業だが判断が多いケース」が `high` にならないことを必須にする。

- [ ] **Step 2: Confirm RED**

Run: `npm test -- tests/automation-diagnosis-score.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement score and reason generation**

スコアと同時に、入力回答と矛盾しない日本語理由を返す。

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- tests/automation-diagnosis-score.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `feat: add explainable automation scoring`

---

### Task 4: 自動化候補・人が残す部分・技術候補

**Files:**
- Create: `src/lib/tools/automation-diagnosis/recommend.ts`
- Test: `tests/automation-diagnosis-recommend.test.ts`

**Interfaces:**
- `buildAutomationRecommendations(input): { automatable: string[]; humanLed: string[]; technologies: string[] }`

- [ ] **Step 1: Write failing tests**

代表ルールを固定する。

```ts
// Excel入力/転記/集計
// => 入力の自動反映, ファイル間転記, 定型集計, 一括処理
// => Excel / VBA, Python

// Google Workspace
// => スプレッドシート連携, Gmail定型通知, Drive保存, 定期処理
// => Google Apps Script

// internal-web または複数人
// => 入力画面, 一覧・検索, 状態管理
// => Webツール

// external-registration / external-web
// => データ変換, API連携, 登録結果管理
// => API連携
```

`judgmentLevel: high` なら「内容の最終判断」、`exceptionLevel: high` なら「例外時の判断」、`approval` があれば「承認そのもの」を `humanLed` に含める。

- [ ] **Step 2: Confirm RED**

Run: `npm test -- tests/automation-diagnosis-recommend.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement deterministic recommendation maps**

重複を除去し、UIで読める順序を維持する。技術名は「実現方法の一例」として返す。

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- tests/automation-diagnosis-recommend.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `feat: add automation recommendation rules`

---

### Task 5: サンプルとレポートモデル

**Files:**
- Create: `src/lib/tools/automation-diagnosis/sample.ts`
- Create: `src/lib/tools/automation-diagnosis/report.ts`
- Test: `tests/automation-diagnosis-report.test.ts`

**Interfaces:**
- `createAutomationDiagnosisSample(): AutomationDiagnosisInput`
- `buildAutomationDiagnosisReport(input, reductionRate): AutomationDiagnosisResult`

- [ ] **Step 1: Write failing tests**

サンプルは15分、月20回相当、3人、Excel転記・集計・PDF、定型度高、判断少、例外一部を返す。レポート結果が現在工数、判定、理由、候補、人が残す部分、技術候補、削減試算を1オブジェクトへ統合することを検証する。

- [ ] **Step 2: Confirm RED**

Run: `npm test -- tests/automation-diagnosis-report.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement report model**

UIは計算ロジックを再実装せず、このレポートモデルだけを描画する。

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- tests/automation-diagnosis-report.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `feat: add automation diagnosis report model`

---

### Task 6: 6ステップウィザードと入力検証

**Files:**
- Create: `src/pages/tools/automation-diagnosis.astro`
- Create: `src/scripts/tools/automation-diagnosis.ts`
- Create: `src/scripts/tools/automation-diagnosis/controller.ts`
- Test: `tests/automation-diagnosis-page.test.ts`
- Test: `tests/automation-diagnosis-client.test.ts`

**Interfaces:**
- `validateAutomationDiagnosisInput(input): { valid: boolean; messages: string[]; warnings: string[] }`
- `getNextAutomationDiagnosisStep(current, direction): number`

- [ ] **Step 1: Write failing page/client tests**

ページに以下があることを固定する。

- H1「業務自動化診断・工数削減シミュレーター」
- `1 / 6` 形式の進捗
- 前へ / 次へ
- 「例を使って試す」
- 0分/0人を拒否するUI契約
- 24時間超はエラーではなく確認警告
- 自動化適性・年間作業時間・削減シミュレーションの結果領域
- 「診断結果をPDFで保存」
- 「この診断は…あらかじめ定めた判定ルール」の透明性表示

- [ ] **Step 2: Confirm RED**

Run: `npm test -- tests/automation-diagnosis-page.test.ts tests/automation-diagnosis-client.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement page and controller**

6ステップ:
1. 作業量
2. 作業内容
3. 作業の特徴
4. 使用環境・人件費
5. 入力内容の確認
6. 診断結果

フォーム状態はJSメモリだけに保持する。結果画面では削減率を20/40/60/80の4段階ボタン + rangeで変更できるようにし、変更時はレポートモデルを再計算する。

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- tests/automation-diagnosis-page.test.ts tests/automation-diagnosis-client.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `feat: build automation diagnosis wizard`

---

### Task 7: プレミアム業務アプリUIとA4縦PDF

**Files:**
- Create: `src/styles/automation-diagnosis.css`
- Modify: `src/pages/tools/automation-diagnosis.astro`
- Test: `tests/automation-diagnosis-page.test.ts`

- [ ] **Step 1: Add failing UI contract tests**

ページに専用クラス、印刷対象 `[data-diagnosis-report]`、印刷除外 `[data-print-ignore]`、結果サマリー、判定理由、自動化候補、人が残す部分、技術候補を持つことを検証する。

- [ ] **Step 2: Confirm RED**

Run: `npm test -- tests/automation-diagnosis-page.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement CSS**

黒/濃紺・アイボリー・シャンパンゴールドを継承。入力はカード乱立ではなく縦の質問フロー、結果は業務改善レポート風の2カラム。スマホは1カラム。`@page { size: A4 portrait; margin: 12mm; }` とし、印刷時にヘッダー、フッター、操作ボタン、SEO本文を除外する。

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- tests/automation-diagnosis-page.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `style: polish automation diagnosis experience`

---

### Task 8: `/tools`一覧の4本目専用プレビュー

**Files:**
- Modify: `src/pages/tools/index.astro`
- Modify: `tests/tools-index.test.ts`

- [ ] **Step 1: Write failing test**

`automation-diagnosis` の専用プレビューが「年間工数」「自動化適性」「削減シミュレーション」の3要素を視覚的に含み、汎用プレースホルダーではないことを検証する。

- [ ] **Step 2: Confirm RED**

Run: `npm test -- tests/tools-index.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement preview**

架空数値には「表示イメージ」を明記し、実績や保証値と誤認させない。4本が並んだ時にExcel差分・データ整理・ダッシュボード・診断でそれぞれ異なるUIプレビューになるようにする。

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- tests/tools-index.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `feat: showcase automation diagnosis on tools hub`

---

### Task 9: 最終回帰・安全性・統合

**Files:**
- Review all files above
- No new production behavior unless a failing verification requires a fix

- [ ] **Step 1: Run full tests**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 2: Run Cloudflare production build**

Run: `npm run build`
Expected: `wrangler types`, `astro check`, `astro build` all exit 0.

- [ ] **Step 3: Privacy review**

検索対象:
- `fetch(`
- `/api/`
- `localStorage`
- `sessionStorage`

診断ツールの入力/計算コードから外部送信や永続保存がないことを確認する。

- [ ] **Step 4: Requirements review**

設計書の22節を確認し、以下を必須確認する。
- AIなし
- 6ステップ
- 工数計算
- 4段階適性
- 判定理由
- 自動化候補
- 人が残す部分
- 技術候補
- 20/40/60/80削減シミュレーション
- A4縦PDF
- サンプル
- SEO/FAQ/関連サービス
- 相談前でも結果保存可能

- [ ] **Step 5: Compare with main**

`feature/automation-diagnosis-tool` が `main` behind 0であることを確認する。

- [ ] **Step 6: PR and merge gate**

PR側CIで `npm test` と Cloudflare buildが成功した場合だけsquash mergeする。merge後にmain側CIも成功することを確認する。
