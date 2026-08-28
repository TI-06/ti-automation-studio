# Excel・CSV ダッシュボード自動作成ツール Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Excel / CSVをブラウザ内で解析し、列型推定・KPI・グラフ・ランキング・フィルター・元データ確認・画像/PDF/Excel/JSON保存まで行える無料ダッシュボード作成ツールを構築する。

**Architecture:** ファイル読込、列型推定、フィルター、集計、自動ウィジェット生成、設定保存を `src/lib/tools/dashboard-builder/` の純粋関数へ分離する。重い解析・再集計はWeb Workerで実行し、画面側は状態管理とDOM/Chart.js描画へ限定する。既存データ整理ツールの20MB/100,000行制限とCSV文字コード判定方針は再利用するが、Excel日付セルを正しく扱うためダッシュボード専用インポーターを持つ。

**Tech Stack:** Astro, TypeScript, Vitest, SheetJS `xlsx`, Chart.js, html-to-image, Web Worker, browser `TextDecoder`, native drag-and-drop / print CSS

**Spec:** `docs/superpowers/specs/2026-08-27-dashboard-builder-tool-design.md`

## Global Constraints

- URLは `/tools/dashboard-builder`。
- 対応形式は `.csv`, `.xlsx`, `.xls`。
- ファイルは外部サーバーへ送信せずブラウザ内で処理する。
- AIは使用しない。列型とデータ内容を基にしたルールベース生成とする。
- 複数シートExcelは分析対象を1シートずつ選ぶ。
- 列型は `日付 / 数値 / 分類 / 文字列 / ID・コード` の5種とし、ユーザーが変更できる。
- 郵便番号、商品コード、社員番号などを数値KPIへ自動採用しない。
- 集計方法は `合計 / 件数 / 平均 / 最大 / 最小`。
- グラフ種類は `棒 / 横棒 / 折れ線 / 円・ドーナツ / 集計表 / ランキング / KPI`。
- 円・ドーナツはカテゴリ数が多い列には自動生成しない。
- ウィジェットはドラッグ並べ替えと上下移動に対応し、サイズは `小 / 中 / 大` のプリセット制。
- フィルター変更時はKPI・グラフ・表を連動再集計する。
- 初期上限は20MB / 100,000行、50,000行超で注意を表示する。
- 1画面のウィジェット上限は12個。
- 初期版では複数ファイル結合、DB/API接続、クラウド保存、共同編集、自動更新を行わない。
- PDFはブラウザ印刷を利用し、A4横を基本にした専用印刷CSSを適用する。
- 画像はダッシュボード領域をPNGとしてブラウザ内生成する。
- JSON設定ファイルにはユーザーデータ本体を含めない。
- Playwright E2Eは導入しない。純粋関数のVitest、ページ契約テスト、Astro check、Cloudflare buildで検証する。

---

## File Map

### Create
- `src/lib/tools/dashboard-builder/types.ts` — データ、列型、フィルター、ウィジェット、設定の型
- `src/lib/tools/dashboard-builder/import.ts` — CSV/Excel読込、日付セル正規化、上限制御
- `src/lib/tools/dashboard-builder/inference.ts` — 列型推定
- `src/lib/tools/dashboard-builder/filters.ts` — フィルター候補生成と行絞り込み
- `src/lib/tools/dashboard-builder/aggregate.ts` — KPI/時系列/分類別集計
- `src/lib/tools/dashboard-builder/auto-layout.ts` — 初期ウィジェット自動生成
- `src/lib/tools/dashboard-builder/config.ts` — JSON設定の保存・検証・列名マッピング
- `src/lib/tools/dashboard-builder/export.ts` — Excel集計出力
- `src/lib/tools/dashboard-builder/sample.ts` — 匿名売上サンプル
- `src/workers/dashboard-builder.worker.ts` — 解析・再集計Worker
- `src/scripts/tools/dashboard-builder.ts` — エントリポイント
- `src/scripts/tools/dashboard-builder/controller.ts` — 状態・イベント・DOM更新
- `src/scripts/tools/dashboard-builder/charts.ts` — Chart.js生成・更新・破棄
- `src/scripts/tools/dashboard-builder/export-client.ts` — PNG/印刷/Blobダウンロード
- `src/pages/tools/dashboard-builder.astro` — 本体UI・SEO・構造化データ
- `src/styles/dashboard-builder.css` — 専用UI・印刷CSS
- `tests/dashboard-import.test.ts`
- `tests/dashboard-inference.test.ts`
- `tests/dashboard-aggregate.test.ts`
- `tests/dashboard-auto-layout.test.ts`
- `tests/dashboard-config.test.ts`
- `tests/dashboard-export.test.ts`
- `tests/dashboard-page.test.ts`

### Modify
- `package.json` — Chart.js / html-to-image追加
- `src/data/tools.ts` — 公開ツール登録
- `src/pages/tools/index.astro` — 3本目専用プレビュー
- `tests/tools.test.ts`
- `tests/tools-index.test.ts`

---

### Task 1: 公開定義・依存・型を固定する

**Files:**
- Create: `src/lib/tools/dashboard-builder/types.ts`
- Modify: `src/data/tools.ts`
- Modify: `package.json`
- Test: `tests/tools.test.ts`

**Interfaces:**
- Produces: `DashboardDataset`, `DashboardColumn`, `DashboardColumnRole`, `DashboardFilter`, `DashboardWidget`, `DashboardConfig`, `DashboardWidgetResult`。
- Produces: `/tools/dashboard-builder` の公開Tool定義。

- [ ] **Step 1: 公開定義の失敗テストを書く**

```ts
it('ダッシュボード作成ツールを公開する', () => {
  const tool = tools.find((item) => item.slug === 'dashboard-builder');
  expect(tool).toBeTruthy();
  expect(tool?.published).toBe(true);
  expect(tool?.href).toBe('/tools/dashboard-builder');
  expect(tool?.formats).toEqual(expect.arrayContaining(['CSV', 'XLSX', 'XLS']));
  expect(tool?.processing).toBe('ブラウザ内処理');
});
```

- [ ] **Step 2: REDを確認する**

Run: `npm test -- tests/tools.test.ts`
Expected: `dashboard-builder` が存在しないためFAIL。

- [ ] **Step 3: 型を実装する**

```ts
export type DashboardCellValue = string | number | boolean | null;
export type DashboardColumnRole = 'date' | 'number' | 'category' | 'text' | 'id';
export type DashboardAggregate = 'sum' | 'count' | 'average' | 'max' | 'min';
export type DashboardWidgetKind = 'kpi' | 'bar' | 'horizontal-bar' | 'line' | 'donut' | 'table' | 'ranking';
export type DashboardWidgetSize = 'small' | 'medium' | 'large';
export type DashboardDateGrain = 'day' | 'month' | 'year-month';

export interface DashboardColumn {
  id: string;
  name: string;
  index: number;
  role: DashboardColumnRole;
  confidence: number;
  sampleValues: string[];
}

export interface DashboardDataset {
  sheetName: string;
  columns: Array<{ id: string; name: string; index: number }>;
  rows: DashboardCellValue[][];
}

export interface DashboardFilter {
  id: string;
  columnId: string;
  type: 'category' | 'date-range';
  values?: string[];
  start?: string;
  end?: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  kind: DashboardWidgetKind;
  aggregate: DashboardAggregate;
  valueColumnId?: string;
  groupColumnId?: string;
  dateColumnId?: string;
  dateGrain?: DashboardDateGrain;
  size: DashboardWidgetSize;
  limit?: number;
}

export interface DashboardWidgetResult {
  widgetId: string;
  labels: string[];
  values: number[];
  scalar?: number;
  rows?: Array<{ label: string; value: number }>;
}

export interface DashboardConfig {
  schemaVersion: 1;
  sourceColumns: Array<{ name: string; role: DashboardColumnRole }>;
  widgets: DashboardWidget[];
  filters: Array<Pick<DashboardFilter, 'columnId' | 'type'>>;
}
```

- [ ] **Step 4: Tool定義と依存を追加する**

`package.json` dependenciesへ `chart.js` と `html-to-image` を追加する。Tool定義は以下を基準にする。

```ts
{
  slug: 'dashboard-builder',
  title: 'Excel・CSV ダッシュボード自動作成ツール',
  shortLabel: 'ダッシュボード作成',
  description: 'Excel・CSVを読み込み、KPI・推移・分類別集計・ランキングを自動で見える化します。',
  technologies: ['CSV', 'Excel', 'Chart.js', 'Web Worker'],
  formats: ['CSV', 'XLSX', 'XLS'],
  processing: 'ブラウザ内処理',
  features: ['列の種類を自動判定', 'KPI・グラフ・ランキングを自動生成', '画像・PDF・Excel・設定JSONで保存'],
  href: '/tools/dashboard-builder',
  published: true,
  featured: true,
}
```

- [ ] **Step 5: GREENを確認する**

Run: `npm test -- tests/tools.test.ts`
Expected: PASS。

- [ ] **Step 6: Commit**

```bash
git add package.json src/data/tools.ts src/lib/tools/dashboard-builder/types.ts tests/tools.test.ts
git commit -m "feat: define dashboard builder tool"
```

---

### Task 2: CSV / Excel読込と列型推定を作る

**Files:**
- Create: `src/lib/tools/dashboard-builder/import.ts`
- Create: `src/lib/tools/dashboard-builder/inference.ts`
- Test: `tests/dashboard-import.test.ts`
- Test: `tests/dashboard-inference.test.ts`

**Interfaces:**
- Consumes: `DashboardDataset`, `DashboardColumn`。
- Reuses: `CLEANER_MAX_FILE_BYTES`, `CLEANER_MAX_ROWS`, `CLEANER_LARGE_ROWS`, `detectCsvEncoding` from `src/lib/tools/data-cleaner/import.ts`。
- Produces: `validateDashboardFile`, `parseDashboardCsv`, `parseDashboardExcel`, `inferDashboardColumns`。

- [ ] **Step 1: 読込テストを書く**

```ts
it('Excel日付セルをISO日付へ正規化する', () => {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    ['売上日', '売上額'],
    [new Date('2026-08-01T00:00:00Z'), 12000],
  ], { cellDates: true });
  XLSX.utils.book_append_sheet(workbook, sheet, '売上');
  const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx', cellDates: true });
  const parsed = parseDashboardExcel(bytes, 'sales.xlsx');
  expect(parsed.dataset.rows[0][0]).toBe('2026-08-01');
});
```

CSVはUTF-8/Shift_JIS、20MB超、100,000行超、複数シート選択を検証する。

- [ ] **Step 2: 列型推定テストを書く**

```ts
it('日付・数値・分類・ID・文字列を判定する', () => {
  const columns = inferDashboardColumns(sampleDataset);
  expect(columns.find((c) => c.name === '売上日')?.role).toBe('date');
  expect(columns.find((c) => c.name === '売上額')?.role).toBe('number');
  expect(columns.find((c) => c.name === '店舗')?.role).toBe('category');
  expect(columns.find((c) => c.name === '商品コード')?.role).toBe('id');
});
```

数字のみの商品コード `00123 / 00124 / 00125` を `number` にしないことも検証する。

- [ ] **Step 3: REDを確認する**

Run: `npm test -- tests/dashboard-import.test.ts tests/dashboard-inference.test.ts`
Expected: module未作成でFAIL。

- [ ] **Step 4: 専用インポーターを実装する**

Excelは `XLSX.read(buffer, { type: 'array', cellDates: true })` を使い、Date値を `YYYY-MM-DD` へ正規化する。CSVは既存の文字コード判定を利用する。ヘッダー空欄は `列1` 形式で補完し、データ行が100,000行を超えたら停止する。

- [ ] **Step 5: 列型推定を実装する**

判定優先順位:

1. 列名が `id / code / コード / 番号 / no / sku` 系ならID候補
2. 非空値の90%以上が明示日付形式なら日付
3. 数値率90%以上でも、先頭ゼロを持つ文字列、高ユニーク率のコード列、列名ID候補はID
4. distinct数が `min(50, 行数 * 0.2)` 以下なら分類
5. 残りは文字列

各列へ `confidence` と最大5件の `sampleValues` を入れる。

- [ ] **Step 6: GREENを確認する**

Run: `npm test -- tests/dashboard-import.test.ts tests/dashboard-inference.test.ts`
Expected: PASS。

- [ ] **Step 7: Commit**

```bash
git add src/lib/tools/dashboard-builder/import.ts src/lib/tools/dashboard-builder/inference.ts tests/dashboard-import.test.ts tests/dashboard-inference.test.ts
git commit -m "feat: import and infer dashboard data"
```

---

### Task 3: フィルターと集計エンジンを作る

**Files:**
- Create: `src/lib/tools/dashboard-builder/filters.ts`
- Create: `src/lib/tools/dashboard-builder/aggregate.ts`
- Test: `tests/dashboard-aggregate.test.ts`

**Interfaces:**
- Produces: `buildFilterCandidates`, `applyDashboardFilters`, `aggregateWidget`, `aggregateWidgets`, `formatDashboardNumber`。

- [ ] **Step 1: フィルター連動の失敗テストを書く**

```ts
it('店舗フィルターで全ウィジェット対象行を絞り込む', () => {
  const rows = applyDashboardFilters(dataset, columns, [{
    id: 'store-filter', columnId: 'store', type: 'category', values: ['東京店'],
  }]);
  expect(rows).toHaveLength(2);
  expect(rows.every((row) => row[1] === '東京店')).toBe(true);
});
```

日付範囲、複数カテゴリ、すべて解除相当の空filtersも検証する。

- [ ] **Step 2: 集計テストを書く**

```ts
it('合計・件数・平均・最大・最小を集計する', () => {
  expect(aggregateWidget(dataset, columns, sumWidget).scalar).toBe(45000);
  expect(aggregateWidget(dataset, columns, countWidget).scalar).toBe(3);
  expect(aggregateWidget(dataset, columns, averageWidget).scalar).toBe(15000);
});
```

月別時系列、分類別ランキング、Top N、null/空欄除外、数値化不能値の無視も検証する。

- [ ] **Step 3: REDを確認する**

Run: `npm test -- tests/dashboard-aggregate.test.ts`
Expected: module未作成でFAIL。

- [ ] **Step 4: フィルターを実装する**

カテゴリは文字列比較、日付はISO `YYYY-MM-DD` 比較に統一する。filter candidateは分類列と日付列だけから生成する。カテゴリ候補が100種類を超える列は初期フィルター候補から除外する。

- [ ] **Step 5: 集計を実装する**

KPIは `scalar`、グラフは `labels/values`、ランキング・表は `rows` を返す。日付groupは `day / month / year-month` のキーを生成し、昇順に並べる。ランキングは値降順、`limit` 既定10。

- [ ] **Step 6: GREENを確認する**

Run: `npm test -- tests/dashboard-aggregate.test.ts`
Expected: PASS。

- [ ] **Step 7: Commit**

```bash
git add src/lib/tools/dashboard-builder/filters.ts src/lib/tools/dashboard-builder/aggregate.ts tests/dashboard-aggregate.test.ts
git commit -m "feat: aggregate filtered dashboard data"
```

---

### Task 4: 初期ダッシュボード自動生成ルールを作る

**Files:**
- Create: `src/lib/tools/dashboard-builder/auto-layout.ts`
- Test: `tests/dashboard-auto-layout.test.ts`

**Interfaces:**
- Consumes: inferred `DashboardColumn[]`。
- Produces: `chooseDateGrain`, `buildInitialDashboardWidgets`。

- [ ] **Step 1: 売上データ向け失敗テストを書く**

```ts
it('売上データからKPI・時系列・店舗別・ランキングを作る', () => {
  const widgets = buildInitialDashboardWidgets(dataset, columns);
  expect(widgets.some((w) => w.kind === 'kpi' && w.aggregate === 'sum')).toBe(true);
  expect(widgets.some((w) => w.kind === 'line')).toBe(true);
  expect(widgets.some((w) => w.kind === 'bar' || w.kind === 'horizontal-bar')).toBe(true);
  expect(widgets.some((w) => w.kind === 'ranking')).toBe(true);
  expect(widgets.length).toBeLessThanOrEqual(8);
});
```

- [ ] **Step 2: 安全ルールのテストを書く**

```ts
it('ID列をKPI値にせず、多カテゴリ列へドーナツを作らない', () => {
  const widgets = buildInitialDashboardWidgets(dataset, columns);
  expect(widgets.some((w) => w.valueColumnId === 'product-code')).toBe(false);
  expect(widgets.some((w) => w.kind === 'donut' && w.groupColumnId === 'high-cardinality')).toBe(false);
});
```

- [ ] **Step 3: REDを確認する**

Run: `npm test -- tests/dashboard-auto-layout.test.ts`
Expected: module未作成でFAIL。

- [ ] **Step 4: 自動生成を実装する**

優先順位:

1. 数値列があれば合計KPI
2. 全行件数KPI
3. 数値列があれば平均KPI、必要に応じ最大KPI
4. 日付+数値なら折れ線
5. 分類+数値なら棒/横棒
6. 2つ目の分類列があればランキング
7. distinct 2〜8の分類列のみドーナツ候補

初期は最大8ウィジェット、全体上限12。タイトルは `月別 売上額`、`店舗別 売上額` のように列名を必ず含める。

- [ ] **Step 5: GREENを確認する**

Run: `npm test -- tests/dashboard-auto-layout.test.ts`
Expected: PASS。

- [ ] **Step 6: Commit**

```bash
git add src/lib/tools/dashboard-builder/auto-layout.ts tests/dashboard-auto-layout.test.ts
git commit -m "feat: auto compose dashboard widgets"
```

---

### Task 5: 設定JSON・サンプル・Excel保存を実装する

**Files:**
- Create: `src/lib/tools/dashboard-builder/config.ts`
- Create: `src/lib/tools/dashboard-builder/sample.ts`
- Create: `src/lib/tools/dashboard-builder/export.ts`
- Test: `tests/dashboard-config.test.ts`
- Test: `tests/dashboard-export.test.ts`

**Interfaces:**
- Produces: `createDashboardConfig`, `parseDashboardConfig`, `mapConfigToColumns`, `createDashboardSample`, `exportDashboardWorkbook`。

- [ ] **Step 1: 設定保存の失敗テストを書く**

```ts
it('設定JSONへ行データを含めない', () => {
  const config = createDashboardConfig(columns, widgets, filters);
  const json = JSON.stringify(config);
  expect(config.schemaVersion).toBe(1);
  expect(json).not.toContain('12000');
  expect(json).not.toContain('東京店');
});
```

列名不足時は該当widgetへmissing column情報を返し、全体をthrowしないことも検証する。

- [ ] **Step 2: Excel出力テストを書く**

```ts
it('集計概要・グラフ元データ・絞り込み済みデータを出力する', () => {
  const blob = exportDashboardWorkbook(dataset, columns, widgets, results, filteredRows);
  expect(blob.type).toContain('spreadsheetml');
});
```

実際のArrayBufferをSheetJSで読み戻し、`集計概要 / グラフ元データ / 絞り込み済みデータ` の3シート存在を確認する。

- [ ] **Step 3: REDを確認する**

Run: `npm test -- tests/dashboard-config.test.ts tests/dashboard-export.test.ts`
Expected: module未作成でFAIL。

- [ ] **Step 4: JSON設定を実装する**

`schemaVersion === 1`、widgets配列、sourceColumns配列を厳格確認する。復元は列名完全一致のみ。見つからない列は `missingColumnNames` を返し、該当widgetだけ再設定可能にする。

- [ ] **Step 5: サンプルを実装する**

匿名売上サンプルへ `日付 / 店舗 / 担当者 / カテゴリ / 商品コード / 数量 / 売上額` を30〜40行用意し、複数月・複数店舗が見える値にする。

- [ ] **Step 6: Excel保存を実装する**

`集計概要` はwidgetタイトル・集計方法・値、`グラフ元データ` はwidgetごとのラベル/値、`絞り込み済みデータ` は現在filter後の元行を出力する。

- [ ] **Step 7: GREENを確認する**

Run: `npm test -- tests/dashboard-config.test.ts tests/dashboard-export.test.ts`
Expected: PASS。

- [ ] **Step 8: Commit**

```bash
git add src/lib/tools/dashboard-builder/config.ts src/lib/tools/dashboard-builder/sample.ts src/lib/tools/dashboard-builder/export.ts tests/dashboard-config.test.ts tests/dashboard-export.test.ts
git commit -m "feat: save dashboard data and settings"
```

---

### Task 6: Web Workerで解析・再集計を分離する

**Files:**
- Create: `src/workers/dashboard-builder.worker.ts`
- Modify tests: `tests/dashboard-aggregate.test.ts`

**Interfaces:**
- Worker request:
  - `{ type: 'analyze'; dataset: DashboardDataset }`
  - `{ type: 'aggregate'; dataset: DashboardDataset; columns: DashboardColumn[]; widgets: DashboardWidget[]; filters: DashboardFilter[] }`
- Worker response:
  - progress 1〜4
  - analyze result `{ columns, widgets, filterCandidates }`
  - aggregate result `{ results, filteredRowIndexes }`
  - structured error `{ title, message }`

- [ ] **Step 1: Worker contractの失敗テストを追加する**

Worker moduleが `inferDashboardColumns`, `buildInitialDashboardWidgets`, `aggregateWidgets`, `applyDashboardFilters` を利用することをソース契約で確認する。

- [ ] **Step 2: REDを確認する**

Run: `npm test -- tests/dashboard-aggregate.test.ts`
Expected: worker未作成でFAIL。

- [ ] **Step 3: Workerを実装する**

進捗文言は以下を固定する。

1. `ファイルを読み込んでいます`
2. `列の種類を確認しています`
3. `集計候補を作っています`
4. `ダッシュボードを作成しています`

再集計中は `絞り込み条件で再集計しています` を返す。

- [ ] **Step 4: GREENを確認する**

Run: `npm test -- tests/dashboard-aggregate.test.ts`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/workers/dashboard-builder.worker.ts tests/dashboard-aggregate.test.ts
git commit -m "feat: add dashboard aggregation worker"
```

---

### Task 7: Astro画面・SEO・専用デザインを作る

**Files:**
- Create: `src/pages/tools/dashboard-builder.astro`
- Create: `src/styles/dashboard-builder.css`
- Test: `tests/dashboard-page.test.ts`

**Interfaces:**
- Produces UI selectors consumed by controller:
  - `[data-dashboard-app]`
  - file/sheet/encoding/sample/reset controls
  - column role editor
  - filter bar
  - widget grid
  - widget add/edit dialog
  - dashboard/data tabs
  - export buttons
  - config import/export
  - progress/error areas

- [ ] **Step 1: ページ契約の失敗テストを書く**

```ts
expect(source).toContain('Excel・CSVからダッシュボードを作成します');
expect(source).toContain('ファイルは外部サーバーへ送信されません');
expect(source).toContain('data-dashboard-app');
expect(source).toContain('サンプルデータで試す');
expect(source).toContain('グラフを追加');
expect(source).toContain('すべて解除');
expect(source).toContain('元データ');
expect(source).toContain('画像で保存');
expect(source).toContain('PDFで保存');
expect(source).toContain('Excelで保存');
expect(source).toContain('設定を保存');
expect(source).toContain("'@type': 'WebApplication'");
```

- [ ] **Step 2: REDを確認する**

Run: `npm test -- tests/dashboard-page.test.ts`
Expected: page未作成でFAIL。

- [ ] **Step 3: Astro画面を作る**

レイアウト:

- 上部: ファイル・シート・設定読込 / 状態
- 解析後上段: 列型確認（必要時だけ開ける）
- ダッシュボード上部: 現在のフィルター + すべて解除 + グラフ追加
- 本体: 12列相当のwidget grid
- 各widget: タイトル / 集計条件 / 編集 / サイズ / 上下移動 / 削除
- タブ: `ダッシュボード / 元データ`
- 右上または下部: `画像 / PDF / Excel / 設定JSON`

SEO下部には `向いているデータ / 自動生成の考え方 / 列型判定 / 設定保存 / 安全性 / FAQ / 関連サービス` を置く。

- [ ] **Step 4: 専用CSSを作る**

TI AUTOMATION STUDIOの暗色・アイボリー・シャンパンゴールド基調を維持。KPIは数字を主役にし、グラフカードは薄い罫線中心。サイズpreset:

```css
.dashboard-widget[data-size="small"] { grid-column: span 3; }
.dashboard-widget[data-size="medium"] { grid-column: span 6; }
.dashboard-widget[data-size="large"] { grid-column: span 12; }
```

狭幅ではすべて1列へ落とす。`@media print` ではナビ、編集ボタン、入力UIを非表示にしA4横向け余白へ調整する。

- [ ] **Step 5: GREENを確認する**

Run: `npm test -- tests/dashboard-page.test.ts`
Expected: PASS。

- [ ] **Step 6: Commit**

```bash
git add src/pages/tools/dashboard-builder.astro src/styles/dashboard-builder.css tests/dashboard-page.test.ts
git commit -m "feat: build dashboard builder interface"
```

---

### Task 8: Chart.js描画・操作・PNG/PDF保存を接続する

**Files:**
- Create: `src/scripts/tools/dashboard-builder.ts`
- Create: `src/scripts/tools/dashboard-builder/controller.ts`
- Create: `src/scripts/tools/dashboard-builder/charts.ts`
- Create: `src/scripts/tools/dashboard-builder/export-client.ts`
- Modify: `tests/dashboard-page.test.ts`

**Interfaces:**
- `mountDashboardBuilder(root: HTMLElement): void`
- `renderDashboardChart(canvas, widget, result): Chart`
- `destroyDashboardChart(id): void`
- `exportDashboardPng(element, fileName): Promise<void>`
- `printDashboard(): void`
- `downloadJson(value, fileName): void`

- [ ] **Step 1: ブラウザ制御契約の失敗テストを書く**

```ts
expect(controller).toContain("new Worker(new URL('../../../workers/dashboard-builder.worker.ts', import.meta.url)");
expect(controller).toContain('data-widget-edit');
expect(controller).toContain('data-widget-move-up');
expect(controller).toContain('data-widget-move-down');
expect(controller).toContain('data-widget-size');
expect(controller).toContain('data-filter-reset');
expect(controller).toContain('data-config-import');
expect(controller).not.toContain('fetch(');
expect(controller).not.toContain('sendBeacon');
```

- [ ] **Step 2: REDを確認する**

Run: `npm test -- tests/dashboard-page.test.ts`
Expected: scripts未作成でFAIL。

- [ ] **Step 3: Chart.js描画モジュールを実装する**

Chart.jsを必要componentだけregisterする。棒/横棒/折れ線/ドーナツを描画し、色だけでなくtooltip・legend・canvas `aria-label` を設定する。ブランド色はCSS変数値を `getComputedStyle(document.documentElement)` から取得する。

- [ ] **Step 4: controllerを実装する**

状態:

```ts
{
  file, fileBuffer, fileFormat, sheetNames, dataset, columns,
  widgets, filters, results, filteredRowIndexes,
  selectedTab, searchQuery, sortColumnId, sortDirection,
  busy, pendingConfig
}
```

機能:

- file/sample読込
- sheet切替（設定変更中なら専用確認dialog）
- 列型変更 → widget候補再評価
- Worker analyze/aggregate
- filter追加・変更・すべて解除
- widget追加/編集/削除
- native drag-and-drop並べ替え + 上下移動ボタン
- size small/medium/large
- 最大12 widget
- 元データ検索・列sort・filter後表示
- JSON設定保存/読込
- Excel保存
- エラー/進捗表示

- [ ] **Step 5: PNG/PDF client exportを実装する**

PNGは `html-to-image` の `toPng` を使い、ダッシュボード領域だけを `pixelRatio: 2` で保存する。PDFボタンは `document.body.dataset.dashboardPrint = 'true'` を付与して `window.print()`、`afterprint` で解除する。

- [ ] **Step 6: GREENを確認する**

Run: `npm test -- tests/dashboard-page.test.ts`
Expected: PASS。

- [ ] **Step 7: Commit**

```bash
git add src/scripts/tools/dashboard-builder.ts src/scripts/tools/dashboard-builder/controller.ts src/scripts/tools/dashboard-builder/charts.ts src/scripts/tools/dashboard-builder/export-client.ts tests/dashboard-page.test.ts
git commit -m "feat: make dashboard builder interactive"
```

---

### Task 9: `/tools` 一覧プレビューと全体検証

**Files:**
- Modify: `src/pages/tools/index.astro`
- Modify: `tests/tools-index.test.ts`

**Interfaces:**
- `/tools` 上で3本目が汎用プレースホルダーではなく専用ダッシュボードプレビューを持つ。

- [ ] **Step 1: 一覧プレビューの失敗テストを書く**

```ts
it('ダッシュボード作成ツールのKPIとグラフが見えるプレビューを持つ', () => {
  expect(source).toContain('dashboard-builder-preview');
  expect(source).toContain('売上合計');
  expect(source).toContain('月別推移');
  expect(source).toContain('店舗別');
});
```

- [ ] **Step 2: REDを確認する**

Run: `npm test -- tests/tools-index.test.ts`
Expected: 専用プレビュー未実装でFAIL。

- [ ] **Step 3: 専用プレビューを実装する**

KPI 3枚、折れ線風SVG、横棒3本を小さな静的表示として作る。実データを使わず「表示イメージ」と明記する。

- [ ] **Step 4: GREENを確認する**

Run: `npm test -- tests/tools-index.test.ts`
Expected: PASS。

- [ ] **Step 5: 全テストを実行する**

Run: `npm test`
Expected: 全テストPASS。

- [ ] **Step 6: Cloudflareビルドを実行する**

Run: `npm run build`
Expected: `astro check` 0 errors、Cloudflare server build成功。

- [ ] **Step 7: セキュリティ・送信経路を確認する**

```bash
grep -R "fetch(\|XMLHttpRequest\|sendBeacon" src/scripts/tools/dashboard-builder* src/lib/tools/dashboard-builder src/workers/dashboard-builder.worker.ts
```

Expected: 外部送信コードなし。

- [ ] **Step 8: mainとの差分をレビューする**

既存の `excel-diff`、`data-cleaner`、サービス、実績、問い合わせ機能を意図せず変更していないことを確認する。

- [ ] **Step 9: Commit**

```bash
git add src/pages/tools/index.astro tests/tools-index.test.ts
git commit -m "feat: feature dashboard builder on tools index"
```

---

## Self-Review

### Spec coverage

- CSV/XLSX/XLS、複数シート: Task 2/8
- 列型5種と手動変更: Task 2/7/8
- AIなしルールベース: Task 4
- KPI/時系列/分類/構成比: Task 3/4/8
- グラフ追加、日本語設定: Task 7/8
- 合計/件数/平均/最大/最小: Task 3
- 並べ替え、サイズpreset、モバイル上下移動: Task 7/8
- 連動filter、すべて解除: Task 3/8
- 元データ検索・sort: Task 8
- 画像/PDF/Excel/JSON: Task 5/8
- 設定再読込と不足列の部分エラー: Task 5/8
- サンプル: Task 5
- 20MB/100,000行/50,000行注意: Task 2/7
- Web Worker進捗: Task 6/8
- SEO/構造化データ: Task 7
- `/tools` 専用プレビュー: Task 9

### Type consistency

`DashboardWidget`、`DashboardFilter`、`DashboardWidgetResult`、`DashboardConfig` はTask 1で定義し、Task 3〜8で同じ型を利用する。列参照は内部では `columnId`、設定JSONの復元境界だけ列名完全一致を使う。

### Scope decision

画像/PDF保存はブラウザ内完結を維持するためサーバーPDF生成を採用しない。PDFは印刷ダイアログ経由の保存とし、A4横専用CSSを品質担保の対象にする。自由リサイズ、複数ファイル結合、DB/API接続、クラウド保存、共同編集は初期版へ入れない。
