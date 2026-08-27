# Excel差分比較・共通ツール基盤 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** TI AUTOMATION STUDIO の公開ツール共通UI基盤を作り、ブラウザ内だけで2つのExcelを比較して値・行・列・シート・数式の差分を確認・絞り込み・保存できる「Excel差分比較・変更箇所チェッカー」を公開する。

**Architecture:** Astro はSEO本文・ツール外枠・説明コンテンツをSSR/HTMLとして出力し、Excel解析・比較・エクスポートはTypeScriptへ分離する。`.xlsx` / `.xls` の読み書きには `xlsx` を利用し、比較処理はWeb Workerで実行してUIスレッドを塞がない。ツールページは `/tools/excel-diff` の専用Astroページとし、既存の汎用 `/tools/[slug]` は他の簡易ツール用として残す。

**Tech Stack:** Astro, TypeScript 6, Vitest, `xlsx`, Web Worker, browser File/Blob APIs, Cloudflare Workers hosting

**Spec:** `docs/superpowers/specs/2026-08-27-excel-diff-tool-design.md`

## Global Constraints

- 完全無料・ログイン不要。
- 画面文言は可能な限り日本語。`CSV`、`Excel`、`PDF`、`XLSX` 等の一般的表記だけ英字を許可。
- ユーザーのExcelファイルは外部サーバーへ送信しない。ブラウザ内だけで処理する。
- 初期対応形式は `.xlsx` と `.xls`。CSV比較は対象外。
- 各ファイル20MBまで、対象シート100,000行まで。50,000行超で注意表示。
- 値変更、行追加、行削除、列追加、列削除、シート追加、シート削除、数式変更を検出する。
- 行照合は「行番号」と「行を特定する列（1列以上）」の2方式。
- 書式全面比較、VBAコード比較、パスワード保護Excelは初期対象外。
- 処理中はスピナーだけでなく、処理段階と可能な範囲で件数を日本語表示する。
- 色だけで差分種別を表現しない。
- 既存の黒 `#0B0C0E`、アイボリー `#F2F0EA`、シャンパンゴールド `#C8A96B` をブランド基調として維持する。
- Playwright E2Eは導入しない。Vitestの純粋ロジックテスト、Astro build、既存content regression testで検証する。

---

## File Structure

### 新規

- `src/components/tools/ToolShell.astro` — 4ツール共通のプロダクト用上部バー・安全表示・状態領域。
- `src/components/tools/ToolProgress.astro` — 処理段階を表示する共通進捗UI。
- `src/styles/tool-app.css` — 公開ツール共通の3ペイン、ファイル選択、状態、サマリー、レスポンシブUI。
- `src/lib/tools/excel-diff/types.ts` — Excel差分ツールの公開型。
- `src/lib/tools/excel-diff/workbook.ts` — `xlsx` から比較用の正規化Workbookへ変換する処理。
- `src/lib/tools/excel-diff/compare.ts` — 行番号/キー列比較、セル・行・列・シート・数式差分の純粋ロジック。
- `src/lib/tools/excel-diff/export.ts` — 差分結果Excel/CSV出力。
- `src/lib/tools/excel-diff/sample.ts` — ブラウザ内でサンプル2ファイルを生成。
- `src/workers/excel-diff.worker.ts` — ファイル解析・比較をWeb Worker内で実行。
- `src/scripts/tools/excel-diff.ts` — DOMイベント、Worker通信、画面状態、絞り込み、保存のコントローラー。
- `src/pages/tools/excel-diff.astro` — Excel差分比較のSEO＋実アプリページ。
- `tests/excel-diff.test.ts` — 比較ロジックのユニットテスト。
- `tests/excel-diff-workbook.test.ts` — Excel解析・出力のテスト。

### 変更

- `package.json` / `package-lock.json` — `xlsx` を追加。
- `src/data/tools.ts` — Excel差分比較を正式な公開ツールとして登録できるデータ形へ拡張。
- `src/pages/tools/index.astro` — 公開ツール一覧に、完成したツールをUIプレビュー付きで表示可能な構造を追加。
- `tests/content.test.ts` — `/tools/excel-diff`、プライバシー表示、SEO/構造化データ、公開状態の回帰テストを追加。

---

### Task 1: `xlsx` 依存と公開ツールデータ契約

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/data/tools.ts`
- Test: `tests/content.test.ts`

**Interfaces:**
- Produces: `Tool` に `href`, `shortLabel`, `formats`, `processing`, `features` を追加。
- Produces: `excel-diff` が `published: true` で `/tools/excel-diff` を指す。

- [ ] **Step 1: 公開ツールデータの失敗テストを書く**

`tests/content.test.ts` に以下を追加する。

```ts
it('Excel差分比較ツールを登録不要の公開ツールとして掲載する', () => {
  const excelDiff = tools.find((tool) => tool.slug === 'excel-diff');
  expect(excelDiff).toBeTruthy();
  expect(excelDiff?.published).toBe(true);
  expect(excelDiff?.href).toBe('/tools/excel-diff');
  expect(excelDiff?.formats).toContain('XLSX');
  expect(excelDiff?.processing).toBe('ブラウザ内処理');
  expect(excelDiff?.features.length).toBeGreaterThanOrEqual(3);
});
```

- [ ] **Step 2: テストを実行してREDを確認する**

Run:

```bash
npm test -- --run tests/content.test.ts
```

Expected: `excel-diff` が存在しない、または新規プロパティが存在しないためFAIL。

- [ ] **Step 3: `xlsx` を追加する**

Run:

```bash
npm install xlsx
```

`package.json` の dependencies に `xlsx` が入り、lockfileも更新されることを確認する。

- [ ] **Step 4: `Tool` 型とExcel差分比較データを実装する**

`src/data/tools.ts` の型を以下へ拡張する。

```ts
export interface Tool {
  slug: string;
  title: string;
  shortLabel: string;
  description: string;
  technologies: string[];
  formats: string[];
  processing: 'ブラウザ内処理' | 'サーバー処理';
  features: string[];
  href: string;
  demoUrl?: string;
  githubUrl?: string;
  published: boolean;
  featured: boolean;
}
```

Excel差分比較は以下の内容で追加する。

```ts
{
  slug: 'excel-diff',
  title: 'Excel差分比較・変更箇所チェッカー',
  shortLabel: 'Excel差分比較',
  description: '2つのExcelを比較して、値・行・列・シート・数式の変更箇所を確認できます。',
  technologies: ['Excel', 'TypeScript', 'Web Worker'],
  formats: ['XLSX', 'XLS'],
  processing: 'ブラウザ内処理',
  features: ['変更・追加・削除を検出', '行を特定する列で照合', '差分結果をExcelで保存'],
  href: '/tools/excel-diff',
  published: true,
  featured: true,
}
```

既存未公開サンプルにも新しい必須プロパティを与え、型エラーを残さない。

- [ ] **Step 5: テストとビルドを実行する**

```bash
npm test -- --run tests/content.test.ts
npm run build
```

Expected: PASS。Astro checkでも`Tool`型エラーなし。

- [ ] **Step 6: コミットする**

```bash
git add package.json package-lock.json src/data/tools.ts tests/content.test.ts
git commit -m "feat: define Excel diff public tool"
```

---

### Task 2: Excel正規化モデルとファイル制限

**Files:**
- Create: `src/lib/tools/excel-diff/types.ts`
- Create: `src/lib/tools/excel-diff/workbook.ts`
- Create: `tests/excel-diff-workbook.test.ts`

**Interfaces:**
- Produces: `NormalizedWorkbook`, `NormalizedSheet`, `NormalizedCell`, `WorkbookSummary`。
- Produces: `parseWorkbook(buffer: ArrayBuffer, fileName: string): NormalizedWorkbook`。
- Produces: `validateExcelFile(file: Pick<File, 'name' | 'size'>): { valid: true } | { valid: false; message: string }`。

- [ ] **Step 1: 型と解析の失敗テストを書く**

`tests/excel-diff-workbook.test.ts`:

```ts
import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';
import { parseWorkbook, validateExcelFile } from '../src/lib/tools/excel-diff/workbook';

describe('Excel読込', () => {
  it('20MB超のファイルを処理前に拒否する', () => {
    expect(validateExcelFile({ name: 'big.xlsx', size: 20 * 1024 * 1024 + 1 })).toEqual({
      valid: false,
      message: 'ファイルサイズが20MBを超えています。20MB以下のExcelファイルを選択してください。',
    });
  });

  it('値と数式を別に保持して正規化する', () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['商品コード', '数量', '合計'],
      ['A001', 2, { f: 'B2*100', v: 200 }],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, '売上');
    const bytes = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const parsed = parseWorkbook(bytes, 'before.xlsx');
    expect(parsed.sheets[0].name).toBe('売上');
    expect(parsed.sheets[0].cells['C2'].formula).toBe('B2*100');
    expect(parsed.sheets[0].cells['C2'].value).toBe(200);
  });
});
```

- [ ] **Step 2: REDを確認する**

```bash
npm test -- --run tests/excel-diff-workbook.test.ts
```

Expected: module not found / function not definedでFAIL。

- [ ] **Step 3: 型を実装する**

`src/lib/tools/excel-diff/types.ts`:

```ts
export type CellPrimitive = string | number | boolean | null;

export interface NormalizedCell {
  value: CellPrimitive;
  formula?: string;
}

export interface NormalizedSheet {
  name: string;
  rowCount: number;
  columnCount: number;
  headers: string[];
  cells: Record<string, NormalizedCell>;
  rows: CellPrimitive[][];
  formulas: Record<string, string>;
}

export interface NormalizedWorkbook {
  fileName: string;
  sheetNames: string[];
  sheets: NormalizedSheet[];
}
```

- [ ] **Step 4: ファイル検証と正規化を実装する**

`src/lib/tools/excel-diff/workbook.ts` の主要API:

```ts
import * as XLSX from 'xlsx';
import type { CellPrimitive, NormalizedSheet, NormalizedWorkbook } from './types';

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_ROWS = 100_000;

export function validateExcelFile(file: Pick<File, 'name' | 'size'>) {
  const extension = file.name.toLowerCase().split('.').pop();
  if (!extension || !['xlsx', 'xls'].includes(extension)) {
    return { valid: false as const, message: '対応している形式は .xlsx と .xls です。' };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { valid: false as const, message: 'ファイルサイズが20MBを超えています。20MB以下のExcelファイルを選択してください。' };
  }
  return { valid: true as const };
}

export function parseWorkbook(buffer: ArrayBuffer, fileName: string): NormalizedWorkbook {
  const workbook = XLSX.read(buffer, { type: 'array', cellFormula: true, cellDates: true });
  const sheets = workbook.SheetNames.map((name) => normalizeSheet(name, workbook.Sheets[name]));
  return { fileName, sheetNames: workbook.SheetNames, sheets };
}
```

`normalizeSheet()` では `XLSX.utils.decode_range()` から行列範囲を得て、100,000行超なら日本語例外を投げる。日付は比較を安定させるためISO文字列へ正規化する。

- [ ] **Step 5: テストをGREENにする**

```bash
npm test -- --run tests/excel-diff-workbook.test.ts
```

Expected: PASS。

- [ ] **Step 6: コミットする**

```bash
git add src/lib/tools/excel-diff/types.ts src/lib/tools/excel-diff/workbook.ts tests/excel-diff-workbook.test.ts
git commit -m "feat: normalize Excel workbooks for comparison"
```

---

### Task 3: 差分比較エンジン

**Files:**
- Modify: `src/lib/tools/excel-diff/types.ts`
- Create: `src/lib/tools/excel-diff/compare.ts`
- Create: `tests/excel-diff.test.ts`

**Interfaces:**
- Consumes: `NormalizedWorkbook`, `NormalizedSheet`。
- Produces: `CompareOptions`, `DiffResult`, `CellDiff`, `StructuralDiff`。
- Produces: `compareWorkbooks(before, after, options, onProgress?): DiffResult`。

- [ ] **Step 1: 行番号比較と数式変更の失敗テストを書く**

```ts
import { describe, expect, it } from 'vitest';
import { compareWorkbooks } from '../src/lib/tools/excel-diff/compare';
import type { NormalizedWorkbook } from '../src/lib/tools/excel-diff/types';

it('値変更と数式変更を別カテゴリで返す', () => {
  const before = makeWorkbook('Sheet1', [
    ['コード', '数量', '合計'],
    ['A001', 2, 200],
  ], { C2: 'B2*100' });
  const after = makeWorkbook('Sheet1', [
    ['コード', '数量', '合計'],
    ['A001', 3, 300],
  ], { C2: 'B2*120' });
  const result = compareWorkbooks(before, after, { mode: 'row-number', sheetName: 'Sheet1', keyColumns: [] });
  expect(result.summary.changed).toBe(1);
  expect(result.summary.formulaChanged).toBe(1);
  expect(result.diffs.some((diff) => diff.kind === 'value' && diff.address === 'B2')).toBe(true);
  expect(result.diffs.some((diff) => diff.kind === 'formula' && diff.address === 'C2')).toBe(true);
});
```

- [ ] **Step 2: キー列比較の失敗テストを書く**

```ts
it('途中に行が追加されてもキー列で既存行を誤変更扱いしない', () => {
  const before = makeWorkbook('売上', [
    ['商品コード', '商品名', '価格'],
    ['A001', '商品A', 100],
    ['A002', '商品B', 200],
  ]);
  const after = makeWorkbook('売上', [
    ['商品コード', '商品名', '価格'],
    ['A001', '商品A', 100],
    ['A999', '商品X', 150],
    ['A002', '商品B', 200],
  ]);
  const result = compareWorkbooks(before, after, { mode: 'key-columns', sheetName: '売上', keyColumns: ['商品コード'] });
  expect(result.summary.added).toBe(1);
  expect(result.summary.changed).toBe(0);
});
```

- [ ] **Step 3: REDを確認する**

```bash
npm test -- --run tests/excel-diff.test.ts
```

Expected: comparison module不存在でFAIL。

- [ ] **Step 4: 差分型を追加する**

`types.ts`:

```ts
export type DiffKind = 'value' | 'formula' | 'row-added' | 'row-removed' | 'column-added' | 'column-removed' | 'sheet-added' | 'sheet-removed';

export interface CompareOptions {
  mode: 'row-number' | 'key-columns';
  sheetName: string;
  keyColumns: string[];
}

export interface DiffEntry {
  id: string;
  kind: DiffKind;
  sheetName: string;
  address?: string;
  rowKey?: string;
  columnName?: string;
  beforeValue?: CellPrimitive;
  afterValue?: CellPrimitive;
  beforeFormula?: string;
  afterFormula?: string;
}

export interface DiffResult {
  diffs: DiffEntry[];
  structuralDiffs: DiffEntry[];
  summary: {
    changed: number;
    added: number;
    removed: number;
    formulaChanged: number;
    structuralChanged: number;
  };
}
```

- [ ] **Step 5: 比較エンジンを最小実装する**

`compare.ts` は以下の順序で比較する。

```ts
export function compareWorkbooks(
  before: NormalizedWorkbook,
  after: NormalizedWorkbook,
  options: CompareOptions,
  onProgress?: (current: number, total: number) => void,
): DiffResult {
  const structuralDiffs = compareWorkbookStructure(before, after);
  const beforeSheet = getSheet(before, options.sheetName);
  const afterSheet = getSheet(after, options.sheetName);
  const diffs = options.mode === 'key-columns'
    ? compareRowsByKeys(beforeSheet, afterSheet, options.keyColumns, onProgress)
    : compareRowsByNumber(beforeSheet, afterSheet, onProgress);
  return summarize([...diffs, ...structuralDiffs], diffs, structuralDiffs);
}
```

キー列ではヘッダー名から列indexを解決し、複数列値を `\u001F` で連結した内部キーを生成する。空欄または重複キーは比較開始前検証APIで返す。

- [ ] **Step 6: 列・シート追加削除テストを追加してGREENにする**

```ts
it('シートと列の追加削除を構造変更として返す', () => {
  const result = compareWorkbooks(beforeWithOldColumn, afterWithNewSheetAndColumn, options);
  expect(result.structuralDiffs.some((x) => x.kind === 'sheet-added')).toBe(true);
  expect(result.structuralDiffs.some((x) => x.kind === 'column-added')).toBe(true);
});
```

Run:

```bash
npm test -- --run tests/excel-diff.test.ts
```

Expected: PASS。

- [ ] **Step 7: コミットする**

```bash
git add src/lib/tools/excel-diff/types.ts src/lib/tools/excel-diff/compare.ts tests/excel-diff.test.ts
git commit -m "feat: compare Excel values rows formulas and structure"
```

---

### Task 4: サンプル生成と差分結果エクスポート

**Files:**
- Create: `src/lib/tools/excel-diff/sample.ts`
- Create: `src/lib/tools/excel-diff/export.ts`
- Modify: `tests/excel-diff-workbook.test.ts`

**Interfaces:**
- Produces: `createSampleFiles(): { before: File; after: File }`。
- Produces: `exportDiffWorkbook(result, metadata): Blob`。
- Produces: `exportDiffCsv(diffs): Blob`。

- [ ] **Step 1: 出力Excelの失敗テストを書く**

```ts
it('差分結果Excelに比較概要と変更一覧を作る', async () => {
  const blob = exportDiffWorkbook(resultFixture, {
    beforeFileName: 'before.xlsx',
    afterFileName: 'after.xlsx',
    comparedAt: '2026-08-27T22:00:00+09:00',
    modeLabel: '行を特定する列で比較',
    keyColumns: ['商品コード'],
  });
  const wb = XLSX.read(await blob.arrayBuffer(), { type: 'array' });
  expect(wb.SheetNames).toContain('比較概要');
  expect(wb.SheetNames).toContain('変更一覧');
  expect(wb.SheetNames).toContain('追加一覧');
});
```

- [ ] **Step 2: REDを確認する**

```bash
npm test -- --run tests/excel-diff-workbook.test.ts
```

Expected: export module not foundでFAIL。

- [ ] **Step 3: Excel / CSV出力を実装する**

`export.ts`:

```ts
export function exportDiffWorkbook(result: DiffResult, metadata: ExportMetadata): Blob {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(buildSummaryRows(result, metadata)), '比較概要');
  appendDiffSheet(workbook, '変更一覧', result.diffs.filter((x) => x.kind === 'value'));
  appendDiffSheet(workbook, '追加一覧', result.diffs.filter((x) => x.kind === 'row-added'));
  appendDiffSheet(workbook, '削除一覧', result.diffs.filter((x) => x.kind === 'row-removed'));
  appendDiffSheet(workbook, '数式変更一覧', result.diffs.filter((x) => x.kind === 'formula'));
  appendDiffSheet(workbook, '構造変更一覧', result.structuralDiffs);
  const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
```

CSVは表示中差分をUTF-8 BOM付きで出力する。

- [ ] **Step 4: サンプル2ファイルを生成する**

`sample.ts` では値変更・行追加・行削除・数式変更を含む2つのWorkbookを作り、`File` に変換する。

```ts
export function createSampleFiles() {
  return {
    before: buildSampleFile('変更前サンプル.xlsx', beforeRows, beforeFormulas),
    after: buildSampleFile('変更後サンプル.xlsx', afterRows, afterFormulas),
  };
}
```

- [ ] **Step 5: テストをGREENにする**

```bash
npm test -- --run tests/excel-diff-workbook.test.ts
```

Expected: PASS。

- [ ] **Step 6: コミットする**

```bash
git add src/lib/tools/excel-diff/sample.ts src/lib/tools/excel-diff/export.ts tests/excel-diff-workbook.test.ts
git commit -m "feat: export Excel diff results and sample files"
```

---

### Task 5: Web Workerと進捗通信

**Files:**
- Create: `src/workers/excel-diff.worker.ts`
- Modify: `src/lib/tools/excel-diff/types.ts`
- Modify: `tests/excel-diff.test.ts`

**Interfaces:**
- Consumes: `parseWorkbook`, `compareWorkbooks`。
- Produces Worker request: `{ type: 'compare'; before: ArrayBuffer; after: ArrayBuffer; beforeName: string; afterName: string; options: CompareOptions }`。
- Produces Worker responses: `progress`, `complete`, `error`。

- [ ] **Step 1: Workerメッセージ型の失敗テストを書く**

```ts
it('Worker進捗段階は日本語表示用の固定段階を持つ', () => {
  expect(EXCEL_DIFF_STAGES).toEqual([
    'ファイルを読み込んでいます',
    'シート構成を確認しています',
    '行を照合しています',
    '変更箇所をまとめています',
  ]);
});
```

- [ ] **Step 2: REDを確認する**

```bash
npm test -- --run tests/excel-diff.test.ts
```

Expected: `EXCEL_DIFF_STAGES` 不存在でFAIL。

- [ ] **Step 3: Worker通信型と固定段階を定義する**

```ts
export const EXCEL_DIFF_STAGES = [
  'ファイルを読み込んでいます',
  'シート構成を確認しています',
  '行を照合しています',
  '変更箇所をまとめています',
] as const;

export type ExcelDiffWorkerResponse =
  | { type: 'progress'; stage: number; label: string; current?: number; total?: number }
  | { type: 'complete'; result: DiffResult; before: NormalizedWorkbook; after: NormalizedWorkbook }
  | { type: 'error'; title: string; message: string };
```

- [ ] **Step 4: Workerを実装する**

```ts
self.onmessage = async (event: MessageEvent<ExcelDiffWorkerRequest>) => {
  try {
    postProgress(1);
    const before = parseWorkbook(event.data.before, event.data.beforeName);
    const after = parseWorkbook(event.data.after, event.data.afterName);
    postProgress(2);
    const result = compareWorkbooks(before, after, event.data.options, (current, total) => {
      postMessage({ type: 'progress', stage: 3, label: EXCEL_DIFF_STAGES[2], current, total });
    });
    postProgress(4);
    postMessage({ type: 'complete', result, before, after });
  } catch (error) {
    postMessage(toJapaneseWorkerError(error));
  }
};
```

- [ ] **Step 5: 型テストをGREENにする**

```bash
npm test -- --run tests/excel-diff.test.ts
npm run build
```

Expected: PASS。Vite/AstroがWorker importを解決できる。

- [ ] **Step 6: コミットする**

```bash
git add src/workers/excel-diff.worker.ts src/lib/tools/excel-diff/types.ts tests/excel-diff.test.ts
git commit -m "feat: run Excel comparisons in a Web Worker"
```

---

### Task 6: 共通ツールUI基盤

**Files:**
- Create: `src/components/tools/ToolShell.astro`
- Create: `src/components/tools/ToolProgress.astro`
- Create: `src/styles/tool-app.css`
- Modify: `tests/content.test.ts`

**Interfaces:**
- Produces: `<ToolShell title subtitle processingLabel>` slot-based wrapper。
- Produces: `<ToolProgress />` markup contract with `data-tool-progress`, `data-progress-label`, `data-progress-count`。

- [ ] **Step 1: 共通UIの失敗テストを書く**

```ts
const toolCssUrl = new URL('../src/styles/tool-app.css', import.meta.url);
const toolShellUrl = new URL('../src/components/tools/ToolShell.astro', import.meta.url);

it('公開ツール共通UIに日本語進捗とPC/スマホレイアウトを持つ', () => {
  expect(existsSync(toolCssUrl)).toBe(true);
  expect(existsSync(toolShellUrl)).toBe(true);
  const css = existsSync(toolCssUrl) ? readFileSync(toolCssUrl, 'utf-8') : '';
  expect(css).toContain('.tool-app-grid');
  expect(css).toContain('.tool-summary-grid');
  expect(css).toContain('@media (max-width: 860px)');
});
```

- [ ] **Step 2: REDを確認する**

```bash
npm test -- --run tests/content.test.ts
```

Expected: file不存在でFAIL。

- [ ] **Step 3: ToolShellを実装する**

`ToolShell.astro` は上部にツール名、`無料 / 登録不要 / ブラウザ内処理`、安全表示、`最初からやり直す`領域を持つ。英語の`FREE`を主表示にせず「無料」とする。

```astro
<div class="tool-app-shell">
  <header class="tool-app-bar">
    <div>
      <p class="tool-app-kicker">公開ツール</p>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
    <div class="tool-app-badges" aria-label="利用条件">
      <span>無料</span><span>登録不要</span><span>{processingLabel}</span>
    </div>
  </header>
  <slot />
</div>
```

- [ ] **Step 4: ToolProgressを実装する**

```astro
<div class="tool-progress" data-tool-progress hidden aria-live="polite">
  <div class="tool-progress-track"><span data-progress-bar></span></div>
  <strong data-progress-label>処理を準備しています</strong>
  <span data-progress-count></span>
</div>
```

- [ ] **Step 5: 共通CSSを実装する**

最低限以下を定義する。

```css
.tool-app-grid { display: grid; grid-template-columns: 280px minmax(0,1fr) 320px; min-height: 680px; border: 1px solid var(--border); }
.tool-summary-grid { display: grid; grid-template-columns: repeat(5,minmax(0,1fr)); border: 1px solid var(--border); }
.tool-file-zone { border: 1px dashed rgba(200,169,107,.45); background: rgba(255,255,255,.012); }
.tool-diff-badge[data-kind="changed"] { border-color: rgba(200,169,107,.55); }
@media (max-width: 1100px) { .tool-app-grid { grid-template-columns: 240px minmax(0,1fr); } .tool-inspector { grid-column: 1 / -1; } }
@media (max-width: 860px) { .tool-app-grid { grid-template-columns: 1fr; } .tool-summary-grid { grid-template-columns: repeat(2,1fr); } }
```

- [ ] **Step 6: テストとビルドをGREENにする**

```bash
npm test -- --run tests/content.test.ts
npm run build
```

- [ ] **Step 7: コミットする**

```bash
git add src/components/tools/ToolShell.astro src/components/tools/ToolProgress.astro src/styles/tool-app.css tests/content.test.ts
git commit -m "feat: add shared public tool application UI"
```

---

### Task 7: Excel差分比較ページとクライアントコントローラー

**Files:**
- Create: `src/pages/tools/excel-diff.astro`
- Create: `src/scripts/tools/excel-diff.ts`
- Modify: `tests/content.test.ts`

**Interfaces:**
- Consumes: `ToolShell`, `ToolProgress`, sample/export APIs, Worker。
- Produces DOM selectors: `data-file-before`, `data-file-after`, `data-sheet-select`, `data-compare-mode`, `data-key-columns`, `data-run-compare`, `data-diff-table`, `data-diff-inspector`, `data-export-xlsx`, `data-export-csv`。

- [ ] **Step 1: ページ構造の失敗テストを書く**

```ts
const excelDiffPageUrl = new URL('../src/pages/tools/excel-diff.astro', import.meta.url);

it('Excel差分比較ページはその場でファイル比較できるSEOランディングページである', () => {
  expect(existsSync(excelDiffPageUrl)).toBe(true);
  const source = existsSync(excelDiffPageUrl) ? readFileSync(excelDiffPageUrl, 'utf-8') : '';
  expect(source).toContain('2つのExcelファイルを比較します');
  expect(source).toContain('ファイルは外部サーバーへ送信されません');
  expect(source).toContain('data-file-before');
  expect(source).toContain('data-file-after');
  expect(source).toContain('data-diff-table');
  expect(source).toContain('差分結果をExcelで保存');
  expect(source).toContain("'@type': 'WebApplication'");
  expect(source).toContain("'@type': 'BreadcrumbList'");
});
```

- [ ] **Step 2: REDを確認する**

```bash
npm test -- --run tests/content.test.ts
```

Expected: page不存在でFAIL。

- [ ] **Step 3: Astroページの入力・条件・結果領域を実装する**

ページ上部はSEO用Heroではなく、そのままアプリを開始できるToolShellとする。初期入力領域は以下のラベルを必須とする。

```astro
<h2>2つのExcelファイルを比較します</h2>
<p>変更前と変更後のファイルを選択してください。</p>
<label>変更前のファイル<input type="file" accept=".xlsx,.xls" data-file-before /></label>
<label>変更後のファイル<input type="file" accept=".xlsx,.xls" data-file-after /></label>
<button type="button" data-sample>サンプルデータで試す</button>
<p class="tool-privacy-note">ファイルは外部サーバーへ送信されません。このブラウザ内で比較します。</p>
```

比較条件には「比較するシート」「行番号で比較」「行を特定する列で比較」「列を追加」を日本語で置く。

結果領域には5つのサマリー、差分一覧、右詳細パネル、絞り込み、保存ボタンを持たせる。

- [ ] **Step 4: SEO説明・FAQ・構造化データを実装する**

`BaseLayout` に固有title/descriptionを渡し、ページ固有構造化データとして以下を追加する。

```ts
const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Excel差分比較・変更箇所チェッカー',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: new URL('/', Astro.site).toString() },
      { '@type': 'ListItem', position: 2, name: '公開ツール', item: new URL('/tools', Astro.site).toString() },
      { '@type': 'ListItem', position: 3, name: 'Excel差分比較', item: new URL('/tools/excel-diff', Astro.site).toString() },
    ],
  },
];
```

本文には「できること」「行番号比較と行を特定する列の違い」「数式変更」「安全性」「よくある質問」「関連サービス/実績」を静的HTMLで置く。

- [ ] **Step 5: クライアントコントローラーを実装する**

`src/scripts/tools/excel-diff.ts` はDOM状態を以下へ限定する。

```ts
interface ExcelDiffUiState {
  beforeFile: File | null;
  afterFile: File | null;
  selectedSheet: string;
  mode: 'row-number' | 'key-columns';
  keyColumns: string[];
  result: DiffResult | null;
  selectedDiffId: string | null;
  filters: { kinds: DiffKind[]; column: string; query: string };
}
```

ファイル選択時は `validateExcelFile()` を即時実行し、50,000行超は解析後に注意表示する。比較ボタンではWorkerへArrayBufferをTransferableとして渡す。

```ts
worker.postMessage({ type: 'compare', before, after, beforeName, afterName, options }, [before, after]);
```

Workerの`progress`でToolProgressを更新し、`complete`でサマリー・一覧・詳細を描画する。

- [ ] **Step 6: 差分絞り込み・詳細表示・保存を接続する**

サマリーカード押下で種別filterを更新する。差分行クリックで右詳細を更新する。保存ではブラウザBlob URLを使用する。

```ts
function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 7: 日本語エラーを接続する**

最低限、以下を画面上で具体表示する。

```ts
const errorMessages = {
  unsupported: '対応している形式は .xlsx と .xls です。',
  tooLarge: 'ファイルサイズが20MBを超えています。20MB以下のExcelファイルを選択してください。',
  duplicateKey: '行を特定する列に重複があります。別の列を追加するか、重複データを確認してください。',
  protected: 'パスワード保護されたExcelはこのツールでは比較できません。保護を解除したコピーでお試しください。',
};
```

- [ ] **Step 8: ページテストとビルドをGREENにする**

```bash
npm test -- --run tests/content.test.ts tests/excel-diff.test.ts tests/excel-diff-workbook.test.ts
npm run build
```

Expected: PASS。

- [ ] **Step 9: コミットする**

```bash
git add src/pages/tools/excel-diff.astro src/scripts/tools/excel-diff.ts tests/content.test.ts
git commit -m "feat: build Excel diff comparison interface"
```

---

### Task 8: 公開ツール一覧をプロダクト入口へ更新

**Files:**
- Modify: `src/pages/tools/index.astro`
- Modify: `src/styles/tool-app.css`
- Modify: `tests/content.test.ts`

**Interfaces:**
- Consumes: `publishedTools` の新メタデータ。
- Produces: `/tools` の完成ツールカードに「無料」「登録不要」「処理方式」「対応形式」「代表機能」「使う」導線。

- [ ] **Step 1: 一覧の失敗テストを書く**

```ts
it('公開ツール一覧は利用条件と代表機能を日本語で先に伝える', () => {
  expect(toolsIndexSource).toContain('仕事で使える、無料の業務ツール。');
  expect(toolsIndexSource).toContain('登録不要');
  expect(toolsIndexSource).toContain('tool-product-card');
  expect(toolsIndexSource).toContain('このツールを使う');
});
```

- [ ] **Step 2: REDを確認する**

```bash
npm test -- --run tests/content.test.ts
```

- [ ] **Step 3: `/tools` のヒーローとカードを更新する**

ヒーロー:

```astro
<h1>仕事で使える、<br />無料の業務ツール。</h1>
<p>登録不要。必要なときに、そのまま使えます。</p>
```

カードは `tool.href` へ直接リンクし、以下を表示する。

```astro
<div class="tool-product-meta">
  <span>無料</span><span>登録不要</span><span>{tool.processing}</span>
</div>
<div class="tags">{tool.formats.map((format) => <span class="tag">{format}</span>)}</div>
<ul>{tool.features.map((feature) => <li>{feature}</li>)}</ul>
<span class="tool-product-link">このツールを使う →</span>
```

Excel差分カードにはCSSで差分グリッドを模したUIプレビューを入れる。画像1枚だけの装飾ではなく、`変更 31 / 追加 12 / 削除 4` と比較表の抽象UIが見える構成にする。

- [ ] **Step 4: レスポンシブCSSを追加する**

PCはプレビュー＋説明の2カラム、860px以下は縦積みにする。

```css
.tool-product-card { display: grid; grid-template-columns: minmax(0,1.05fr) minmax(320px,.95fr); }
@media (max-width: 860px) { .tool-product-card { grid-template-columns: 1fr; } }
```

- [ ] **Step 5: テストとビルドをGREENにする**

```bash
npm test -- --run tests/content.test.ts
npm run build
```

- [ ] **Step 6: コミットする**

```bash
git add src/pages/tools/index.astro src/styles/tool-app.css tests/content.test.ts
git commit -m "feat: redesign public tools landing page"
```

---

### Task 9: 最終回帰・アクセシビリティ・本番マージ準備

**Files:**
- Modify only if failures require it: files touched in Tasks 1-8

**Interfaces:**
- No new interface. This task verifies the complete first public tool slice.

- [ ] **Step 1: 全Vitestを実行する**

```bash
npm test
```

Expected: 全テストPASS。

- [ ] **Step 2: Cloudflare Workers向けビルドを実行する**

```bash
npm run build
```

Expected: `wrangler types`, `astro check`, `astro build` 全成功。

- [ ] **Step 3: ソースベースのアクセシビリティ確認を行う**

確認項目:

```text
- file inputに日本語labelがある
- 進捗領域にaria-liveがある
- 差分種別は色だけでなく「変更 / 追加 / 削除 / 数式」ラベルを持つ
- 絞り込みinput/selectにlabelがある
- 「最初からやり直す」がbuttonである
- 50,000行超の注意がテキスト表示される
```

問題があれば該当ファイルを修正して `npm test && npm run build` を再実行する。

- [ ] **Step 4: 仕様回帰を確認する**

以下をコード検索で確認する。

```bash
rg "外部サーバーへ送信されません|20MB|100,000|50,000|行を特定する列|数式変更|差分結果をExcelで保存" src tests
```

Expected: 仕様に必要なUI/テスト双方に存在する。

- [ ] **Step 5: 最終差分をレビューする**

```bash
git diff main...HEAD --stat
git diff main...HEAD -- src/pages/tools src/lib/tools src/components/tools src/scripts/tools src/workers tests package.json
```

確認観点:

```text
- 顧客情報・秘密情報を含まない
- ファイル送信APIを追加していない
- Cloudflare WorkerへExcelをPOSTしていない
- 英語UI文言が不必要に残っていない
- 既存 /services /works /contact を壊していない
- 1ファイルへ比較・UI・出力ロジックを混在させていない
```

- [ ] **Step 6: 必要な最終修正があればコミットする**

```bash
git add -A
git commit -m "fix: polish Excel diff public tool"
```

変更がなければコミットは作らない。

- [ ] **Step 7: PR前の最終検証を再実行する**

```bash
npm test
npm run build
```

Expected: 両方成功。これをPR/マージ判断の根拠とする。
