import { describe, expect, it } from 'vitest';
import {
  duplicateRowsToDelete,
  findDuplicateGroups,
} from '../src/lib/tools/data-cleaner/duplicates';
import {
  applyChanges,
  applyRowDeletes,
  buildChanges,
  createHistoryEntry,
  undoHistory,
} from '../src/lib/tools/data-cleaner/mutations';
import type { CleanerDataset } from '../src/lib/tools/data-cleaner/types';

const dataset: CleanerDataset = {
  sheetName: '顧客一覧',
  columns: [
    { id: 'company', name: '会社名', index: 0 },
    { id: 'phone', name: '電話番号', index: 1 },
    { id: 'date', name: '登録日', index: 2 },
    { id: 'memo', name: 'メモ', index: 3 },
  ],
  rows: [
    [' ABC株式会社 ', '090-1111-2222', '2026/08/27', '1行目\n2行目'],
    ['ABC株式会社', '090-1111-2222', '2026-08-27', null],
    ['ＡＢＣ株式会社', '03-1234-5678', '2026年8月29日', '通常'],
    ['別会社', '03-1234-5678', '確認中', '通常'],
  ],
};

describe('重複判定', () => {
  it('1列または複数列を使って重複グループを作れる', () => {
    const phoneGroups = findDuplicateGroups(dataset, ['phone']);
    expect(phoneGroups).toHaveLength(2);
    expect(phoneGroups[0].rowIndexes).toEqual([0, 1]);

    const compound = findDuplicateGroups(dataset, ['company', 'phone']);
    expect(compound).toHaveLength(0);
  });

  it('先頭または最後の行を残す削除候補を返す', () => {
    const group = findDuplicateGroups(dataset, ['phone'])[0];
    expect(duplicateRowsToDelete(group, 'first')).toEqual([1]);
    expect(duplicateRowsToDelete(group, 'last')).toEqual([0]);
    expect(duplicateRowsToDelete(group, 1)).toEqual([0]);
  });
});

describe('変更プレビューと適用', () => {
  it('前後空白の変更予定を作って適用できる', () => {
    const changes = buildChanges(dataset, { type: 'trim', columnId: 'company' });
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ rowIndex: 0, before: ' ABC株式会社 ', after: 'ABC株式会社' });

    const next = applyChanges(dataset, changes);
    expect(next.rows[0][0]).toBe('ABC株式会社');
    expect(dataset.rows[0][0]).toBe(' ABC株式会社 ');
  });

  it('全角英数字・セル内改行・日付形式・空欄補完の変更予定を作れる', () => {
    expect(buildChanges(dataset, { type: 'normalize-width', columnId: 'company' })[0]).toMatchObject({
      rowIndex: 2,
      after: 'ABC株式会社',
    });
    expect(buildChanges(dataset, { type: 'remove-line-breaks', columnId: 'memo' })[0].after).toBe('1行目 2行目');
    const dates = buildChanges(dataset, { type: 'date-format', columnId: 'date', format: 'YYYY-MM-DD' });
    expect(dates.map((change) => change.after)).toEqual(['2026-08-27', '2026-08-29']);
    const blanks = buildChanges(dataset, { type: 'fill-blank', columnId: 'memo', value: '未入力' });
    expect(blanks[0]).toMatchObject({ rowIndex: 1, after: '未入力' });
  });

  it('個別に除外した変更は適用しない', () => {
    const changes = buildChanges(dataset, { type: 'date-format', columnId: 'date', format: 'YYYY-MM-DD' });
    changes[0].excluded = true;
    const next = applyChanges(dataset, changes);
    expect(next.rows[0][2]).toBe('2026/08/27');
    expect(next.rows[2][2]).toBe('2026-08-29');
  });

  it('行削除を安全に実行し、履歴から操作前へ戻せる', () => {
    const before = dataset;
    const deleted = applyRowDeletes(before, [1, 3]);
    expect(deleted.rows).toHaveLength(2);
    expect(deleted.rows[0]).toEqual(before.rows[0]);
    expect(deleted.rows[1]).toEqual(before.rows[2]);

    const changes = buildChanges(before, { type: 'trim', columnId: 'company' });
    const entry = createHistoryEntry('前後の空白を削除', before, changes, [1]);
    const restored = undoHistory(entry);
    expect(restored).toEqual(before);
    expect(restored).not.toBe(before);
  });
});
