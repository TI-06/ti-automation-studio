import { describe, expect, it } from 'vitest';
import {
  diagnoseDataset,
  parseDateCandidate,
  parseNumericCandidate,
} from '../src/lib/tools/data-cleaner/diagnostics';
import {
  normalizeAsciiWidth,
  normalizePhoneCandidate,
  safeVariantKey,
  trimOuterWhitespace,
} from '../src/lib/tools/data-cleaner/normalize';
import type { CleanerDataset, DiagnosticCategory } from '../src/lib/tools/data-cleaner/types';

const dataset: CleanerDataset = {
  sheetName: '顧客一覧',
  columns: [
    { id: 'column-1', name: '会社名', index: 0 },
    { id: 'column-2', name: '電話番号', index: 1 },
    { id: 'column-3', name: '売上日', index: 2 },
    { id: 'column-4', name: '金額', index: 3 },
    { id: 'column-5', name: 'メモ', index: 4 },
  ],
  rows: [
    ['株式会社ABC ', '090-1234-5678', '2026/08/27', '1,200', '通常'],
    ['株式会社ＡＢＣ', '09012345678', '2026-08-28', '１２００', '改行\nあり'],
    ['株式会社ABC', null, '2026年8月29日', 1200, '通常'],
    ['株式会社ABD', '03-1234-5678', '確認中', '商品001', '通常'],
    ['株式会社ABD', '03-1234-5678', '確認中', '商品001', '通常'],
  ],
};

function categories(result: ReturnType<typeof diagnoseDataset>): DiagnosticCategory[] {
  return result.issues.map((issue) => issue.category);
}

describe('データ整理の安全な正規化', () => {
  it('前後空白と全角ASCIIだけを安全に正規化する', () => {
    expect(trimOuterWhitespace('  ABC　')).toBe('ABC');
    expect(normalizeAsciiWidth('ＡＢＣ１２３')).toBe('ABC123');
    expect(normalizeAsciiWidth('ｶﾀｶﾅ')).toBe('ｶﾀｶﾅ');
  });

  it('電話番号候補だけハイフン等を除いた比較キーにする', () => {
    expect(normalizePhoneCandidate('090-1234-5678')).toBe('09012345678');
    expect(normalizePhoneCandidate('株式会社ABC')).toBe('株式会社ABC');
    expect(safeVariantKey('株式会社ＡＢＣ ')).toBe(safeVariantKey('株式会社ABC'));
    expect(safeVariantKey('株式会社ABD')).not.toBe(safeVariantKey('株式会社ABC'));
  });
});

describe('データ健康診断', () => {
  it('8カテゴリのうち該当する問題候補を安全に検出する', () => {
    const result = diagnoseDataset(dataset);
    const found = categories(result);

    expect(found).toContain('duplicate');
    expect(found).toContain('trim-space');
    expect(found).toContain('blank');
    expect(found).toContain('width-mixed');
    expect(found).toContain('date-mixed');
    expect(found).toContain('number-mixed');
    expect(found).toContain('line-break');
    expect(found).toContain('notation-variant');
  });

  it('会社名ABCとABDを同一の表記ゆれ候補にまとめない', () => {
    const result = diagnoseDataset(dataset);
    const variants = result.issues.filter((issue) => issue.category === 'notation-variant');
    const examples = variants.flatMap((issue) => issue.examples.map((example) => example.before));

    expect(examples).toContain('株式会社ＡＢＣ');
    expect(examples).not.toEqual(expect.arrayContaining(['株式会社ABC', '株式会社ABD']));
    expect(variants.some((issue) => issue.rowIndexes.includes(3) && issue.rowIndexes.includes(0))).toBe(false);
  });

  it('列統計で空欄・重複・修正候補件数を確認できる', () => {
    const result = diagnoseDataset(dataset);
    const phone = result.columns.find((column) => column.columnName === '電話番号');
    expect(phone?.dataCount).toBe(4);
    expect(phone?.blankCount).toBe(1);
    expect(phone?.duplicateCount).toBeGreaterThanOrEqual(2);
    expect(phone?.issueCount).toBeGreaterThan(0);
  });

  it('明示3形式の日付だけを解釈し、不確かな文字列は残す', () => {
    expect(parseDateCandidate('2026/08/27')?.iso).toBe('2026-08-27');
    expect(parseDateCandidate('2026-08-27')?.style).toBe('hyphen');
    expect(parseDateCandidate('2026年8月27日')?.style).toBe('japanese');
    expect(parseDateCandidate('確認中')).toBeNull();
    expect(parseDateCandidate('2026/13/40')).toBeNull();
  });

  it('数値候補は通常・桁区切り・全角を区別しコード文字列は除外する', () => {
    expect(parseNumericCandidate(1200)?.style).toBe('number');
    expect(parseNumericCandidate('1,200')?.value).toBe(1200);
    expect(parseNumericCandidate('１２００')?.style).toBe('fullwidth');
    expect(parseNumericCandidate('商品001')).toBeNull();
  });
});
