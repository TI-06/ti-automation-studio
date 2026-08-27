# Excel差分比較・共通ツール基盤 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** TI AUTOMATION STUDIO の公開ツール共通UI基盤を作り、ブラウザ内だけで2つのExcelを比較して値・行・列・シート・数式の差分を確認・絞り込み・保存できる「Excel差分比較・変更箇所チェッカー」を公開する。

**Architecture:** Astro はSEO本文・ツール外枠・説明コンテンツをHTMLとして出力し、Excel解析・比較・エクスポートはTypeScriptへ分離する。`.xlsx` / `.xls` の読み書きには `xlsx` を利用し、重い比較処理はWeb Workerで実行してUIスレッドを塞がない。`/tools/excel-diff` を専用ページとし、既存 `/tools/[slug]` は他の簡易ツール用として残す。

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
- ブランド色は `#0B0C0E` / `#F2F0EA` / `#C8A96B` を維持する。
- Playwright E2Eは導入しない。Vitest、Astro check/build、既存content regression testで検証する。

---

## File Structure

### Create

- `src/components/tools/ToolShell.astro` — 公開ツール共通のプロダクトヘッダー・利用条件表示。
- `src/components/tools/ToolProgress.astro` — 日本語の処理進捗表示。
- `src/styles/tool-app.css` — 公開ツール共通の高密度業務UI。
- `src/lib/tools/excel-diff/types.ts` — Excel差分用の共有型。
- `src/lib/tools/excel-diff/workbook.ts` — Excelの検証・正規化。
- `src/lib/tools/excel-diff/compare.ts` — 差分エンジン。
- `src/lib/tools/excel-diff/export.ts` — Excel/CSV出力。
- `src/lib/tools/excel-diff/sample.ts` — サンプル2ファイル生成。
- `src/workers/excel-diff.worker.ts` — ファイル解析・比較Worker。
- `src/scripts/tools/excel-diff.ts` — DOM状態・Worker通信・結果描画。
- `src/pages/tools/excel-diff.astro` — SEO＋実アプリページ。
- `tests/excel-diff.test.ts` — 比較ロジック。
- `tests/excel-diff-workbook.test.ts` — 読込・出力。

### Modify

- `package.json`, `package-lock.json` — `xlsx` 追加。
- `src/data/tools.ts` — 公開ツール用メタデータ拡張。
- `src/pages/tools/index.astro` — 公開プロダクト一覧へ再設計。
- `tests/content.test.ts` — SEO/UI/公開状態の回帰テスト。

---

### Task 1: `xlsx` 依存と公開ツールデータ契約

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/data/tools.ts`
- Test: `tests/content.test.ts`

**Interfaces:**
- Produces `Tool.href: string`
- Produces `Tool.shortLabel: string`
- Produces `Tool.formats: string[]`
- Produces `Tool.processing: 'ブラウザ内処理' | 'サーバー処理'`
- Produces `Tool.features: string[]`

- [ ] **Step 1: 失敗テストを書く**

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

- [ ] **Step 2: RED確認**

```bash
npm test -- --run tests/content.test.ts
```

Expected: `excel-diff` 不存在または新規プロパティ不存在でFAIL。

- [ ] **Step 3: 依存追加**

```bash
npm install xlsx
```

- [ ] **Step 4: `Tool` 型を拡張**

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

Excel差分比較データ:

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

既存の未公開2件にも新しい必須プロパティを追加する。

- [ ] **Step 5: GREEN確認**

```bash
npm test -- --run tests/content.test.ts
npm run build
```

- [ ] **Step 6: Commit**

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
- Produces `NormalizedCell`, `NormalizedSheet`, `NormalizedWorkbook`
- Produces `validateExcelFile(file: Pick<File, 'name' | 'size'>)`
- Produces `parseWorkbook(buffer: ArrayBuffer, fileName: string): NormalizedWorkbook`

- [ ] **Step 1: 失敗テストを書く**

```ts
import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';
import { parseWorkbook, validateExcelFile } from '../src/lib/tools/excel-diff/workbook';

describe('Excel読込', () => {
  it('20MB超を処理前に拒否する', () => {
    expect(validateExcelFile({ name: 'big.xlsx', size: 20 * 1024 * 1024 + 1 })).toEqual({
      valid: false,
      message: 'ファイルサイズが20MBを超えています。20MB以下のExcelファイルを選択してください。',
    });
  });

  it('値と数式を別に保持する', () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['商品コード', '数量', '合計'],
      ['A001', 2, 200],
    ]);
    ws.C2 = { t: 'n', v: 200, f: 'B2*100' };
    XLSX.utils.book_append_sheet(wb, ws, '売上');
    const bytes = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    const parsed = parseWorkbook(bytes, 'before.xlsx');
    expect(parsed.sheets[0].cells.C2.formula).toBe('B2*100');
    expect(parsed.sheets[0].cells.C2.value).toBe(200);
  });
});
```

- [ ] **Step 2: RED確認**

```bash
npm test -- --run tests/excel-diff-workbook.test.ts
```

- [ ] **Step 3: 型を実装**

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
  rows: CellPrimitive[][];
  cells: Record<string, NormalizedCell>;
  formulas: Record<string, string>;
}

export interface NormalizedWorkbook {
  fileName: string;
  sheetNames: string[];
  sheets: NormalizedSheet[];
}
```

- [ ] **Step 4: ファイル検証を実装**

```ts
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
```

- [ ] **Step 5: 正規化を実装**

```ts
export function parseWorkbook(buffer: ArrayBuffer, fileName: string): NormalizedWorkbook {
  const workbook = XLSX.read(buffer, { type: 'array', cellFormula: true, cellDates: true });
  const sheets = workbook.SheetNames.map((name) => normalizeSheet(name, workbook.Sheets[name]));
  return { fileName, sheetNames: workbook.SheetNames, sheets };
}
```

`normalizeSheet()` は `XLSX.utils.decode_range()` で範囲を取得し、100,000行超なら `このシートは100,000行を超えているため比較できません。` を投げる。日付はISO文字列へ正規化する。

- [ ] **Step 6: GREEN確認**

```bash
npm test -- --run tests/excel-diff-workbook.test.ts
```

- [ ] **Step 7: Commit**

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
- Produces `CompareOptions`, `DiffKind`, `DiffEntry`, `DiffResult`
- Produces `validateKeyColumns(sheet, keyColumns)`
- Produces `compareWorkbooks(before, after, options, onProgress?)`

- [ ] **Step 1: テストfixture helperを定義**

`tests/excel-diff.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { compareWorkbooks } from '../src/lib/tools/excel-diff/compare';
import type { CellPrimitive, NormalizedWorkbook } from '../src/lib/tools/excel-diff/types';

function makeWorkbook(
  sheetName: string,
  rows: CellPrimitive[][],
  formulas: Record<string, string> = {},
): NormalizedWorkbook {
  const headers = rows[0].map(String);
  const cells: Record<string, { value: CellPrimitive; formula?: string }> = {};
  rows.forEach((row, r) => row.forEach((value, c) => {
    const address = `${String.fromCharCode(65 + c)}${r + 1}`;
    cells[address] = { value, formula: formulas[address] };
  }));
  return {
    fileName: 'fixture.xlsx',
    sheetNames: [sheetName],
    sheets: [{ name: sheetName, rowCount: rows.length, columnCount: headers.length, headers, rows, cells, formulas }],
  };
}
```

- [ ] **Step 2: 値変更・数式変更の失敗テストを書く**

```ts
it('値変更と数式変更を別カテゴリで返す', () => {
  const before = makeWorkbook('Sheet1', [['コード', '数量', '合計'], ['A001', 2, 200]], { C2: 'B2*100' });
  const after = makeWorkbook('Sheet1', [['コード', '数量', '合計'], ['A001', 3, 300]], { C2: 'B2*120' });
  const result = compareWorkbooks(before, after, { mode: 'row-number', sheetName: 'Sheet1', keyColumns: [] });
  expect(result.summary.changed).toBe(1);
  expect(result.summary.formulaChanged).toBe(1);
  expect(result.diffs.some((x) => x.kind === 'value' && x.address === 'B2')).toBe(true);
  expect(result.diffs.some((x) => x.kind === 'formula' && x.address === 'C2')).toBe(true);
});
```

- [ ] **Step 3: キー列比較の失敗テストを書く**

```ts
it('途中行追加をキー列で正しく追加扱いする', () => {
  const before = makeWorkbook('売上', [['商品コード', '商品名', '価格'], ['A001', '商品A', 100], ['A002', '商品B', 200]]);
  const after = makeWorkbook('売上', [['商品コード', '商品名', '価格'], ['A001', '商品A', 100], ['A999', '商品X', 150], ['A002', '商品B', 200]]);
  const result = compareWorkbooks(before, after, { mode: 'key-columns', sheetName: '売上', keyColumns: ['商品コード'] });
  expect(result.summary.added).toBe(1);
  expect(result.summary.changed).toBe(0);
});
```

- [ ] **Step 4: RED確認**

```bash
npm test -- --run tests/excel-diff.test.ts
```

- [ ] **Step 5: 差分型を実装**

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
  summary: { changed: number; added: number; removed: number; formulaChanged: number; structuralChanged: number };
}
```

- [ ] **Step 6: 比較APIを実装**

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
  return buildDiffResult(diffs, structuralDiffs);
}
```

キー列は複数列値を `\u001F` で連結した内部キーにする。空欄キー・重複キーは `validateKeyColumns()` で比較前に拒否する。

- [ ] **Step 7: 構造差分テストを追加**

```ts
it('追加列を構造変更として返す', () => {
  const before = makeWorkbook('売上', [['コード', '金額'], ['A001', 100]]);
  const after = makeWorkbook('売上', [['コード', '金額', '備考'], ['A001', 100, '確認済']]);
  const result = compareWorkbooks(before, after, { mode: 'row-number', sheetName: '売上', keyColumns: [] });
  expect(result.structuralDiffs.some((x) => x.kind === 'column-added' && x.columnName === '備考')).toBe(true);
});
```

- [ ] **Step 8: GREEN確認**

```bash
npm test -- --run tests/excel-diff.test.ts
```

- [ ] **Step 9: Commit**

```bash
git add src/lib/tools/excel-diff/types.ts src/lib/tools/excel-diff/compare.ts tests/excel-diff.test.ts
git commit -m "feat: compare Excel values rows formulas and structure"
```

---

### Task 4: サンプル生成と結果エクスポート

**Files:**
- Create: `src/lib/tools/excel-diff/sample.ts`
- Create: `src/lib/tools/excel-diff/export.ts`
- Modify: `tests/excel-diff-workbook.test.ts`

**Interfaces:**
- Produces `createSampleFiles(): { before: File; after: File }`
- Produces `exportDiffWorkbook(result, metadata): Blob`
- Produces `exportDiffCsv(diffs): Blob`

- [ ] **Step 1: 具体fixtureを使った失敗テストを書く**

```ts
import { exportDiffWorkbook } from '../src/lib/tools/excel-diff/export';
import type { DiffResult } from '../src/lib/tools/excel-diff/types';

it('差分結果Excelに比較概要と変更一覧を作る', async () => {
  const result: DiffResult = {
    diffs: [{ id: '1', kind: 'value', sheetName: '売上', address: 'B2', columnName: '金額', beforeValue: 100, afterValue: 120 }],
    structuralDiffs: [],
    summary: { changed: 1, added: 0, removed: 0, formulaChanged: 0, structuralChanged: 0 },
  };
  const blob = exportDiffWorkbook(result, {
    beforeFileName: 'before.xlsx',
    afterFileName: 'after.xlsx',
    comparedAt: '2026-08-27T22:00:00+09:00',
    modeLabel: '行番号で比較',
    keyColumns: [],
  });
  const wb = XLSX.read(await blob.arrayBuffer(), { type: 'array' });
  expect(wb.SheetNames).toContain('比較概要');
  expect(wb.SheetNames).toContain('変更一覧');
});
```

- [ ] **Step 2: RED確認**

```bash
npm test -- --run tests/excel-diff-workbook.test.ts
```

- [ ] **Step 3: Excel/CSV出力を実装**

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

CSVはUTF-8 BOM付きで出力する。

- [ ] **Step 4: サンプル2ファイルを実装**

```ts
export function createSampleFiles() {
  return {
    before: buildSampleFile('変更前サンプル.xlsx', beforeRows, beforeFormulas),
    after: buildSampleFile('変更後サンプル.xlsx', afterRows, afterFormulas),
  };
}
```

サンプルは値変更・行追加・行削除・数式変更を必ず含める。

- [ ] **Step 5: GREEN確認**

```bash
npm test -- --run tests/excel-diff-workbook.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/tools/excel-diff/sample.ts src/lib/tools/excel-diff/export.ts tests/excel-diff-workbook.test.ts
git commit -m "feat: export Excel diff results and sample files"
```

---

### Task 5: Web Workerと日本語進捗

**Files:**
- Create: `src/workers/excel-diff.worker.ts`
- Modify: `src/lib/tools/excel-diff/types.ts`
- Modify: `tests/excel-diff.test.ts`

**Interfaces:**
- Request `{ type: 'compare'; before: ArrayBuffer; after: ArrayBuffer; beforeName: string; afterName: string; options: CompareOptions }`
- Response union `progress | complete | error`

- [ ] **Step 1: 失敗テストを書く**

```ts
import { EXCEL_DIFF_STAGES } from '../src/lib/tools/excel-diff/types';

it('進捗段階を日本語で固定する', () => {
  expect(EXCEL_DIFF_STAGES).toEqual([
    'ファイルを読み込んでいます',
    'シート構成を確認しています',
    '行を照合しています',
    '変更箇所をまとめています',
  ]);
});
```

- [ ] **Step 2: RED確認**

```bash
npm test -- --run tests/excel-diff.test.ts
```

- [ ] **Step 3: Worker通信型を追加**

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

- [ ] **Step 4: Workerを実装**

```ts
self.onmessage = (event: MessageEvent<ExcelDiffWorkerRequest>) => {
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

- [ ] **Step 5: GREEN確認**

```bash
npm test -- --run tests/excel-diff.test.ts
npm run build
```

- [ ] **Step 6: Commit**

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
- Produces `<ToolShell title subtitle processingLabel>`
- Produces `data-tool-progress`, `data-progress-label`, `data-progress-count`, `data-progress-bar`

- [ ] **Step 1: 失敗テストを書く**

```ts
const toolCssUrl = new URL('../src/styles/tool-app.css', import.meta.url);
const toolShellUrl = new URL('../src/components/tools/ToolShell.astro', import.meta.url);

it('公開ツール共通UIに3ペインとスマホレイアウトを持つ', () => {
  expect(existsSync(toolCssUrl)).toBe(true);
  expect(existsSync(toolShellUrl)).toBe(true);
  const css = existsSync(toolCssUrl) ? readFileSync(toolCssUrl, 'utf-8') : '';
  expect(css).toContain('.tool-app-grid');
  expect(css).toContain('.tool-summary-grid');
  expect(css).toContain('@media (max-width: 860px)');
});
```

- [ ] **Step 2: RED確認**

```bash
npm test -- --run tests/content.test.ts
```

- [ ] **Step 3: `ToolShell.astro` を実装**

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

- [ ] **Step 4: `ToolProgress.astro` を実装**

```astro
<div class="tool-progress" data-tool-progress hidden aria-live="polite">
  <div class="tool-progress-track"><span data-progress-bar></span></div>
  <strong data-progress-label>処理を準備しています</strong>
  <span data-progress-count></span>
</div>
```

- [ ] **Step 5: 共通CSSを実装**

```css
.tool-app-grid { display:grid; grid-template-columns:280px minmax(0,1fr) 320px; min-height:680px; border:1px solid var(--border); }
.tool-summary-grid { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); border:1px solid var(--border); }
.tool-file-zone { border:1px dashed rgba(200,169,107,.45); background:rgba(255,255,255,.012); }
@media (max-width:1100px) { .tool-app-grid { grid-template-columns:240px minmax(0,1fr); } .tool-inspector { grid-column:1 / -1; } }
@media (max-width:860px) { .tool-app-grid { grid-template-columns:1fr; } .tool-summary-grid { grid-template-columns:repeat(2,1fr); } }
```

- [ ] **Step 6: GREEN確認**

```bash
npm test -- --run tests/content.test.ts
npm run build
```

- [ ] **Step 7: Commit**

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
- DOM selectors: `data-file-before`, `data-file-after`, `data-sheet-select`, `data-compare-mode`, `data-key-columns`, `data-run-compare`, `data-diff-table`, `data-diff-inspector`, `data-export-xlsx`, `data-export-csv`

- [ ] **Step 1: 失敗テストを書く**

```ts
const excelDiffPageUrl = new URL('../src/pages/tools/excel-diff.astro', import.meta.url);

it('Excel差分比較ページをその場で使えるSEOランディングページにする', () => {
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

- [ ] **Step 2: RED確認**

```bash
npm test -- --run tests/content.test.ts
```

- [ ] **Step 3: 入力・条件・結果領域を実装**

```astro
<h2>2つのExcelファイルを比較します</h2>
<p>変更前と変更後のファイルを選択してください。</p>
<label>変更前のファイル<input type="file" accept=".xlsx,.xls" data-file-before /></label>
<label>変更後のファイル<input type="file" accept=".xlsx,.xls" data-file-after /></label>
<button type="button" data-sample>サンプルデータで試す</button>
<p class="tool-privacy-note">ファイルは外部サーバーへ送信されません。このブラウザ内で比較します。</p>
```

比較条件に「比較するシート」「行番号で比較」「行を特定する列で比較」「列を追加」を置く。結果領域に5サマリー、差分一覧、詳細、絞り込み、Excel/CSV保存を置く。

- [ ] **Step 4: SEO本文・構造化データを実装**

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

静的HTML本文に「できること」「行番号比較と行を特定する列の違い」「数式変更」「安全性」「よくある質問」「関連サービス/実績」を置く。

- [ ] **Step 5: UI状態を実装**

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

比較時はArrayBufferをTransferableでWorkerへ渡す。

```ts
worker.postMessage({ type: 'compare', before, after, beforeName, afterName, options }, [before, after]);
```

- [ ] **Step 6: 絞り込み・詳細・保存を実装**

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

サマリー押下で種別絞り込み、差分行押下で詳細更新、Excel/CSV保存で`downloadBlob()`を呼ぶ。

- [ ] **Step 7: 日本語エラーを実装**

```ts
const errorMessages = {
  unsupported: '対応している形式は .xlsx と .xls です。',
  tooLarge: 'ファイルサイズが20MBを超えています。20MB以下のExcelファイルを選択してください。',
  duplicateKey: '行を特定する列に重複があります。別の列を追加するか、重複データを確認してください。',
  protected: 'パスワード保護されたExcelはこのツールでは比較できません。保護を解除したコピーでお試しください。',
};
```

- [ ] **Step 8: GREEN確認**

```bash
npm test -- --run tests/content.test.ts tests/excel-diff.test.ts tests/excel-diff-workbook.test.ts
npm run build
```

- [ ] **Step 9: Commit**

```bash
git add src/pages/tools/excel-diff.astro src/scripts/tools/excel-diff.ts tests/content.test.ts
git commit -m "feat: build Excel diff comparison interface"
```

---

### Task 8: `/tools` を公開プロダクト入口へ更新

**Files:**
- Modify: `src/pages/tools/index.astro`
- Modify: `src/styles/tool-app.css`
- Modify: `tests/content.test.ts`

**Interfaces:**
- Consumes `publishedTools` の `href`, `formats`, `processing`, `features`

- [ ] **Step 1: テストsourceの読込を追加して失敗テストを書く**

```ts
const toolsIndexSource = readFileSync(new URL('../src/pages/tools/index.astro', import.meta.url), 'utf-8');

it('公開ツール一覧は利用条件と代表機能を日本語で伝える', () => {
  expect(toolsIndexSource).toContain('仕事で使える、無料の業務ツール。');
  expect(toolsIndexSource).toContain('登録不要');
  expect(toolsIndexSource).toContain('tool-product-card');
  expect(toolsIndexSource).toContain('このツールを使う');
});
```

- [ ] **Step 2: RED確認**

```bash
npm test -- --run tests/content.test.ts
```

- [ ] **Step 3: ヒーローとカードを更新**

```astro
<h1>仕事で使える、<br />無料の業務ツール。</h1>
<p>登録不要。必要なときに、そのまま使えます。</p>
```

カード:

```astro
<a class="tool-product-card" href={tool.href}>
  <div class="tool-product-meta"><span>無料</span><span>登録不要</span><span>{tool.processing}</span></div>
  <div class="tags">{tool.formats.map((format) => <span class="tag">{format}</span>)}</div>
  <ul>{tool.features.map((feature) => <li>{feature}</li>)}</ul>
  <span class="tool-product-link">このツールを使う →</span>
</a>
```

Excel差分カードにはCSSだけで差分グリッドを模したUIプレビューを入れ、`変更 31 / 追加 12 / 削除 4` が一覧で分かるようにする。

- [ ] **Step 4: レスポンシブCSS**

```css
.tool-product-card { display:grid; grid-template-columns:minmax(0,1.05fr) minmax(320px,.95fr); }
@media (max-width:860px) { .tool-product-card { grid-template-columns:1fr; } }
```

- [ ] **Step 5: GREEN確認**

```bash
npm test -- --run tests/content.test.ts
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/tools/index.astro src/styles/tool-app.css tests/content.test.ts
git commit -m "feat: redesign public tools landing page"
```

---

### Task 9: 最終回帰・アクセシビリティ・PR準備

**Files:**
- Modify only if verification finds a defect.

**Interfaces:**
- No new interface.

- [ ] **Step 1: 全テスト**

```bash
npm test
```

Expected: 全PASS。

- [ ] **Step 2: Cloudflare Workers向けbuild**

```bash
npm run build
```

Expected: `wrangler types`, `astro check`, `astro build` 全成功。

- [ ] **Step 3: アクセシビリティ確認**

```text
file inputに日本語labelがある
進捗領域にaria-liveがある
差分種別は色に加えて「変更 / 追加 / 削除 / 数式」ラベルを持つ
input/selectにlabelがある
「最初からやり直す」はbutton
50,000行超の注意はテキスト表示
```

不備があれば修正して `npm test && npm run build` を再実行する。

- [ ] **Step 4: 仕様回帰検索**

```bash
rg "外部サーバーへ送信されません|20MB|100,000|50,000|行を特定する列|数式変更|差分結果をExcelで保存" src tests
```

- [ ] **Step 5: 最終差分レビュー**

```bash
git diff main...HEAD --stat
git diff main...HEAD -- src/pages/tools src/lib/tools src/components/tools src/scripts/tools src/workers tests package.json
```

確認:

```text
顧客情報・秘密情報なし
Excelファイル送信APIなし
不必要な英語UIなし
/services /works /contactを壊していない
比較・UI・出力ロジックが適切に分離されている
```

- [ ] **Step 6: 必要な修正のみコミット**

```bash
git add -A
git commit -m "fix: polish Excel diff public tool"
```

変更がなければコミットしない。

- [ ] **Step 7: PR前の最終検証**

```bash
npm test
npm run build
```

Expected: 両方成功。この結果をPR/マージ判断の根拠にする。
