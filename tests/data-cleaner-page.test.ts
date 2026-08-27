import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../src/pages/tools/data-cleaner.astro', import.meta.url);
const controllerUrl = new URL('../src/scripts/tools/data-cleaner.ts', import.meta.url);

describe('CSV・Excelデータ整理ページ', () => {
  it('診断から保存までその場で使える日本語ページを持つ', () => {
    expect(existsSync(pageUrl)).toBe(true);
    const source = existsSync(pageUrl) ? readFileSync(pageUrl, 'utf-8') : '';

    expect(source).toContain('CSV・Excelのデータを整理します');
    expect(source).toContain('ファイルは外部サーバーへ送信されません');
    expect(source).toContain('データ健康診断');
    expect(source).toContain('変更内容を確認');
    expect(source).toContain('変更履歴');
    expect(source).toContain('整理済みファイルを保存');
    expect(source).toContain('data-cleaner-app');
    expect(source).toContain('20MB');
    expect(source).toContain('100,000行');
    expect(source).toContain('50,000行');
    expect(source).toContain("'@type': 'WebApplication'");
    expect(source).toContain("'@type': 'BreadcrumbList'");
  });

  it('重複の残し方と空欄行の扱いをユーザーが選べる', () => {
    const source = existsSync(pageUrl) ? readFileSync(pageUrl, 'utf-8') : '';
    expect(source).toContain('data-duplicate-keep');
    expect(source).toContain('先頭の行を残す');
    expect(source).toContain('最後の行を残す');
    expect(source).toContain('data-blank-only');
    expect(source).toContain('空欄行だけ表示');
    expect(source).toContain('data-blank-delete');
    expect(source).toContain('空欄がある行を削除候補にする');
  });

  it('未保存変更があるシート切替は専用ダイアログで確認する', () => {
    const pageSource = existsSync(pageUrl) ? readFileSync(pageUrl, 'utf-8') : '';
    const controllerSource = existsSync(controllerUrl) ? readFileSync(controllerUrl, 'utf-8') : '';
    expect(pageSource).toContain('data-sheet-change-dialog');
    expect(pageSource).toContain('変更中のシートを切り替えますか？');
    expect(controllerSource).toContain('confirmSheetChange');
    expect(controllerSource).toContain('showModal()');
    expect(controllerSource).not.toContain('window.confirm');
  });

  it('Worker・修正プレビュー・履歴・保存をブラウザ内で制御する', () => {
    expect(existsSync(controllerUrl)).toBe(true);
    const source = existsSync(controllerUrl) ? readFileSync(controllerUrl, 'utf-8') : '';

    expect(source).toContain("new Worker(new URL('../../workers/data-cleaner.worker.ts', import.meta.url)");
    expect(source).toContain('validateCleanerFile');
    expect(source).toContain('createCleanerSample');
    expect(source).toContain('buildChanges');
    expect(source).toContain('blankRowIndexes');
    expect(source).toContain('findDuplicateGroups');
    expect(source).toContain('undoHistory');
    expect(source).toContain('exportCleanerCsv');
    expect(source).toContain('exportCleanerWorkbook');
    expect(source).toContain('URL.createObjectURL');
    expect(source).not.toContain('fetch(');
    expect(source).not.toContain('XMLHttpRequest');
    expect(source).not.toContain('sendBeacon');
  });
});