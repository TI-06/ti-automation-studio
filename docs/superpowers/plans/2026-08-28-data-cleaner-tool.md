# CSV・Excel データ整理・クレンジングツール Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CSV / Excelをブラウザ内で診断し、重複・空白・全角半角・日付・数値・不要改行・安全な表記ゆれ候補を確認してから修正し、元に戻してCSV / Excelとして保存できる無料ツールを構築する。

**Architecture:** 既存の `ToolShell.astro` と `tool-app.css` をUI基盤として再利用する。ファイル解析・診断は `src/lib/tools/data-cleaner/` に純粋関数として分離し、重い診断はWeb Workerで実行する。画面コントローラーは状態管理とDOM描画に限定し、データ変更は操作単位のスナップショットを履歴として保持して1段階ずつ元に戻せるようにする。

**Tech Stack:** Astro, TypeScript, Vitest, SheetJS `xlsx`, Web Worker, browser `TextDecoder`, `encoding-japanese`（Shift_JIS出力）

**Spec:** `docs/superpowers/specs/2026-08-27-data-cleaner-tool-design.md`

## Global Constraints

- URLは `/tools/data-cleaner`。
- 対応形式は `.csv`, `.xlsx`, `.xls`。
- ファイルは外部サーバーへ送信せずブラウザ内で処理する。
- CSVはUTF-8 / Shift_JISを主要対象とし、読込時に自動判定し、曖昧時のみ選択を求める。
- 解析だけではデータを書き換えず、ユーザーが修正を選び、プレビュー確認後にのみ適用する。
- 初期上限は20MB / 100,000行、50,000行超で注意表示。
- Excelは一度に1シートだけを編集対象にする。
- 日付として確実に解釈できない値は自動変換しない。
- 郵便番号・商品コード・社員番号等を列型推測だけで数値化しない。
- 表記ゆれは安全な正規化で同一候補になる値だけを候補提示し、低類似値を勝手に同一扱いしない。
- UI文言は可能な限り日本語にする。
- 処理中は「ファイルを読み込んでいます → 列の内容を確認しています → 重複や表記の違いを探しています → 診断結果をまとめています」を表示する。

---

## File Map

### Create
- `src/lib/tools/data-cleaner/types.ts`
- `src/lib/tools/data-cleaner/import.ts`
- `src/lib/tools/data-cleaner/normalize.ts`
- `src/lib/tools/data-cleaner/diagnostics.ts`
- `src/lib/tools/data-cleaner/duplicates.ts`
- `src/lib/tools/data-cleaner/mutations.ts`
- `src/lib/tools/data-cleaner/export.ts`
- `src/lib/tools/data-cleaner/sample.ts`
- `src/workers/data-cleaner.worker.ts`
- `src/pages/tools/data-cleaner.astro`
- `src/scripts/tools/data-cleaner.ts`
- `tests/data-cleaner-import.test.ts`
- `tests/data-cleaner-diagnostics.test.ts`
- `tests/data-cleaner-mutations.test.ts`
- `tests/data-cleaner-export.test.ts`
- `tests/data-cleaner-page.test.ts`

### Modify
- `package.json`
- `src/data/tools.ts`
- `src/pages/tools/index.astro`
- `src/styles/tool-app.css`
- `tests/tools.test.ts`
- `tests/tools-index.test.ts`

---

### Task 1: 公開定義とデータモデル

**Files:**
- Create: `src/lib/tools/data-cleaner/types.ts`
- Modify: `src/data/tools.ts`
- Test: `tests/tools.test.ts`

**Interfaces:**
- Produces: `CleanerDataset`, `CleanerColumn`, `DiagnosticCategory`, `DiagnosticIssue`, `CleanerChange`, `CleanerHistoryEntry`。
- Produces: `/tools/data-cleaner` の公開Tool定義。

- [ ] **Step 1: 失敗テストを追加する**

```ts
it('データ整理ツールを登録不要の公開ツールとして掲載する', () => {
  const cleaner = tools.find((tool) => tool.slug === 'data-cleaner');
  expect(cleaner).toBeTruthy();
  expect(cleaner?.published).toBe(true);
  expect(cleaner?.href).toBe('/tools/data-cleaner');
  expect(cleaner?.formats).toEqual(expect.arrayContaining(['CSV', 'XLSX', 'XLS']));
  expect(cleaner?.processing).toBe('ブラウザ内処理');
});
```

- [ ] **Step 2: REDを確認する**
Run: `npm test -- tests/tools.test.ts`
Expected: `data-cleaner` が存在しないためFAIL。

- [ ] **Step 3: 型とTool定義を追加する**

```ts
export type CleanerCellValue = string | number | boolean | null;
export interface CleanerColumn { id: string; name: string; index: number; }
export interface CleanerDataset { sheetName: string; columns: CleanerColumn[]; rows: CleanerCellValue[][]; }
export type DiagnosticCategory = 'duplicate' | 'trim-space' | 'blank' | 'width-mixed' | 'date-mixed' | 'number-mixed' | 'line-break' | 'notation-variant';
export interface DiagnosticIssue { id: string; category: DiagnosticCategory; columnId?: string; rowIndexes: number[]; count: number; examples: Array<{ before: string; after?: string }>; message: string; }
export interface CleanerChange { id: string; rowIndex: number; columnId: string; before: CleanerCellValue; after: CleanerCellValue; reason: string; excluded: boolean; }
export interface CleanerHistoryEntry { id: string; label: string; changes: CleanerChange[]; beforeDataset: CleanerDataset; }
```

- [ ] **Step 4: GREENを確認する**
Run: `npm test -- tests/tools.test.ts`
Expected: PASS。

- [ ] **Step 5: Commit**
```bash
git add src/lib/tools/data-cleaner/types.ts src/data/tools.ts tests/tools.test.ts
git commit -m "feat: define data cleaner tool"
```

---

### Task 2: CSV / Excel読込と文字コード判定

**Files:**
- Create: `src/lib/tools/data-cleaner/import.ts`
- Test: `tests/data-cleaner-import.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `validateCleanerFile(file): { valid: boolean; message: string }`
- Produces: `detectCsvEncoding(bytes): 'utf-8' | 'shift_jis' | 'unknown'`
- Produces: `parseCsvBytes(bytes, encoding): CleanerDataset`
- Produces: `parseExcelBuffer(buffer, fileName, sheetName?): { dataset: CleanerDataset; sheetNames: string[] }`

- [ ] **Step 1: 失敗テストを書く**
`.csv/.xlsx/.xls`、20MB超過、UTF-8 BOM、日本語UTF-8、Shift_JIS、複数シートExcel、100,000行超を検証する。

- [ ] **Step 2: REDを確認する**
Run: `npm test -- tests/data-cleaner-import.test.ts`
Expected: module未作成でFAIL。

- [ ] **Step 3: 最小実装を作る**
文字コード判定は BOM → UTF-8 fatal decode → Shift_JIS fatal decode → unknown の順。CSVはSheetJSで正規化し、100,000行超を停止。Shift_JIS出力用に `encoding-japanese` をdependenciesへ追加する。

- [ ] **Step 4: GREENを確認する**
Run: `npm test -- tests/data-cleaner-import.test.ts`
Expected: PASS。

- [ ] **Step 5: Commit**
```bash
git add package.json package-lock.json src/lib/tools/data-cleaner/import.ts tests/data-cleaner-import.test.ts
git commit -m "feat: import CSV and Excel for data cleaner"
```

---

### Task 3: 安全な正規化と8カテゴリ診断

**Files:**
- Create: `src/lib/tools/data-cleaner/normalize.ts`
- Create: `src/lib/tools/data-cleaner/diagnostics.ts`
- Test: `tests/data-cleaner-diagnostics.test.ts`

**Interfaces:**
- Produces: `trimOuterWhitespace`, `collapseSpaces`, `normalizeAsciiWidth`, `normalizePhoneCandidate`, `safeVariantKey`, `diagnoseDataset`。

- [ ] **Step 1: 失敗テストを書く**
前後空白、全角英数字、空欄、日付3形式、数値3形式、不要改行、安全な電話番号表記ゆれを含むfixtureを用意し、`株式会社ABC` と `株式会社ABD` を同一候補にしないことも検証する。

- [ ] **Step 2: REDを確認する**
Run: `npm test -- tests/data-cleaner-diagnostics.test.ts`
Expected: module未作成でFAIL。

- [ ] **Step 3: 正規化関数を実装する**
`safeVariantKey` は `trim → NFKC → ASCII英字の小文字化 → 電話番号形式なら数字のみ` に限定する。

- [ ] **Step 4: 診断を実装する**
日付は明示3形式のみ、数値はNFKC＋カンマ除去後の厳密な数値正規表現のみを候補とする。

- [ ] **Step 5: GREENを確認する**
Run: `npm test -- tests/data-cleaner-diagnostics.test.ts`
Expected: PASS。

- [ ] **Step 6: Commit**
```bash
git add src/lib/tools/data-cleaner/normalize.ts src/lib/tools/data-cleaner/diagnostics.ts tests/data-cleaner-diagnostics.test.ts
git commit -m "feat: diagnose data cleaning issues"
```

---

### Task 4: 重複判定・修正プレビュー・適用・元に戻す

**Files:**
- Create: `src/lib/tools/data-cleaner/duplicates.ts`
- Create: `src/lib/tools/data-cleaner/mutations.ts`
- Test: `tests/data-cleaner-mutations.test.ts`

**Interfaces:**
- Produces: `findDuplicateGroups`, `buildChanges`, `applyChanges`, `applyRowDeletes`, `createHistoryEntry`, `undoHistory`。

- [ ] **Step 1: 失敗テストを書く**
1列/複数列重複、先頭/最後を残す、trim、全角数字→半角、不要改行、日付統一、空欄補完、個別除外、undoを検証する。

- [ ] **Step 2: REDを確認する**
Run: `npm test -- tests/data-cleaner-mutations.test.ts`
Expected: module未作成でFAIL。

- [ ] **Step 3: 実装する**
データを直接破壊せず新しい `CleanerDataset` を返す。行削除は元行番号を降順処理する。

- [ ] **Step 4: GREENを確認する**
Run: `npm test -- tests/data-cleaner-mutations.test.ts`
Expected: PASS。

- [ ] **Step 5: Commit**
```bash
git add src/lib/tools/data-cleaner/duplicates.ts src/lib/tools/data-cleaner/mutations.ts tests/data-cleaner-mutations.test.ts
git commit -m "feat: preview and apply cleaning changes"
```

---

### Task 5: CSV / Excel保存と変更履歴シート

**Files:**
- Create: `src/lib/tools/data-cleaner/export.ts`
- Test: `tests/data-cleaner-export.test.ts`

**Interfaces:**
- Produces: `exportCleanerCsv`, `exportCleanerWorkbook`, `summarizeCleaning`。

- [ ] **Step 1: 失敗テストを書く**
UTF-8 BOM、Shift_JIS、日本語保持、整理済みExcel、変更履歴シート、元/整理後/修正セル/削除行サマリーを検証する。

- [ ] **Step 2: REDを確認する**
Run: `npm test -- tests/data-cleaner-export.test.ts`
Expected: module未作成でFAIL。

- [ ] **Step 3: 保存処理を実装する**
CSVは引用符をRFC4180相当でエスケープ。Shift_JISは `encoding-japanese` を使用。Excel履歴列は `操作 / 行 / 列 / 変更前 / 変更後 / 理由`。

- [ ] **Step 4: GREENを確認する**
Run: `npm test -- tests/data-cleaner-export.test.ts`
Expected: PASS。

- [ ] **Step 5: Commit**
```bash
git add src/lib/tools/data-cleaner/export.ts tests/data-cleaner-export.test.ts
git commit -m "feat: export cleaned CSV and Excel files"
```

---

### Task 6: サンプルデータとWeb Worker

**Files:**
- Create: `src/lib/tools/data-cleaner/sample.ts`
- Create: `src/workers/data-cleaner.worker.ts`
- Test: `tests/data-cleaner-diagnostics.test.ts`

- [ ] **Step 1: サンプル条件の失敗テストを追加する**
前後空白、全角数字、重複、空欄、日付混在、電話番号表記違いが含まれることを検証する。

- [ ] **Step 2: REDを確認する**
Run: `npm test -- tests/data-cleaner-diagnostics.test.ts`
Expected: sample module未作成でFAIL。

- [ ] **Step 3: サンプルとWorkerを実装する**
Worker進捗は `ファイルを読み込んでいます / 列の内容を確認しています / 重複や表記の違いを探しています / 診断結果をまとめています` の4段階。

- [ ] **Step 4: GREENを確認する**
Run: `npm test -- tests/data-cleaner-diagnostics.test.ts`
Expected: PASS。

- [ ] **Step 5: Commit**
```bash
git add src/lib/tools/data-cleaner/sample.ts src/workers/data-cleaner.worker.ts tests/data-cleaner-diagnostics.test.ts
git commit -m "feat: add data cleaner sample and worker"
```

---

### Task 7: 公開ページと日本語業務アプリUI

**Files:**
- Create: `src/pages/tools/data-cleaner.astro`
- Create: `src/scripts/tools/data-cleaner.ts`
- Modify: `src/styles/tool-app.css`
- Test: `tests/data-cleaner-page.test.ts`

- [ ] **Step 1: ページ契約の失敗テストを書く**
`CSV・Excelのデータを整理します`、`ファイルは外部サーバーへ送信されません`、`データ健康診断`、`変更内容を確認`、`変更履歴`、`整理済みファイルを保存`、`data-cleaner-app`、`WebApplication`、`BreadcrumbList` を検証する。コントローラー側はWorker、export、undo、`URL.createObjectURL` を検証する。

- [ ] **Step 2: REDを確認する**
Run: `npm test -- tests/data-cleaner-page.test.ts`
Expected: ページ未作成でFAIL。

- [ ] **Step 3: 画面を実装する**
左=ファイル/シート/文字コード/診断カテゴリ/重複判定列、中央=健康診断/候補/変更プレビュー/データ表、右=列統計/列操作/変更履歴。修正は必ず候補→プレビュー→明示適用。

- [ ] **Step 4: 保存とundoを接続する**
保存前に元データ/整理後/修正セル/削除行を表示。CSVはUTF-8/Shift_JIS選択。履歴ごとに「元に戻す」。

- [ ] **Step 5: GREENを確認する**
Run: `npm test -- tests/data-cleaner-page.test.ts`
Run: `npm run build`
Expected: tests PASS, Astro check 0 errors, Cloudflare build success。

- [ ] **Step 6: Commit**
```bash
git add src/pages/tools/data-cleaner.astro src/scripts/tools/data-cleaner.ts src/styles/tool-app.css tests/data-cleaner-page.test.ts
git commit -m "feat: build data cleaner workspace"
```

---

### Task 8: `/tools` 一覧へ2本目を統合

**Files:**
- Modify: `tests/tools-index.test.ts`
- Modify only if needed: `src/pages/tools/index.astro`

- [ ] **Step 1: テストを追加する**
Excel差分比較とデータ整理の両方が `published: true` で、一覧が `publishedTools.map` を使用することを検証する。

- [ ] **Step 2: テストを実行する**
Run: `npm test -- tests/tools-index.test.ts tests/tools.test.ts`
Expected: PASS。必要な場合のみ一覧カードを調整する。

- [ ] **Step 3: Commit**
```bash
git add tests/tools-index.test.ts src/pages/tools/index.astro
git commit -m "feat: publish data cleaner in tools hub"
```

---

### Task 9: 最終回帰・安全性・アクセシビリティ

- [ ] **Step 1: 全テスト**
Run: `npm test`
Expected: 0 failures。

- [ ] **Step 2: 本番ビルド**
Run: `npm run build`
Expected: Astro check 0 errors / build success / sitemap generation success。

- [ ] **Step 3: 外部送信なしを確認**
`data-cleaner` 関連コードに `fetch(`, `XMLHttpRequest`, `sendBeacon` がないこと。

- [ ] **Step 4: 誤修正防止を確認**
読込直後は書換なし、候補→プレビュー→適用、個別除外、undo、低類似の自動統合なし、解釈不能日付の変更なし。

- [ ] **Step 5: アクセシビリティを確認**
label、色以外の日本語ラベル、キーボード操作、`aria-live`、具体的な日本語エラー。

- [ ] **Step 6: mainとの差分を確認**
`/services`, `/works`, `/contact` の既存処理を変更していないこと。
