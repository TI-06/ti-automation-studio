import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import {
  exportCleanerCsv,
  exportCleanerWorkbook,
  summarizeCleaning,
} from '../src/lib/tools/data-cleaner/export';
import type { CleanerDataset, CleanerHistoryEntry } from '../src/lib/tools/data-cleaner/types';

const dataset: CleanerDataset = {
  sheetName: '整理済みデータ',
  columns: [
    { id: 'name', name: '会社名', index: 0 },
    { id: 'amount', name: '金額', index: 1 },
  ],
  rows: [
    ['株式会社山田', 1200],
    ['株式会社テスト', 2500],
  ],
};

const history: CleanerHistoryEntry[] = [
  {
    id: 'history-1',
    label: '前後の空白を削除',
    beforeDataset: dataset,
    deletedRows: [],
    changes: [
      {
        id: 'change-1',
        rowIndex: 0,
        columnId: 'name',
        before: '株式会社山田 ',
        after: '株式会社山田',
        reason: '前後の空白',
        excluded: false,
      },
    ],
  },
  {
    id: 'history-2',
    label: '重複を削除',
    beforeDataset: dataset,
    deletedRows: [2],
    changes: [],
  },
];

describe('データ整理ツールの保存', () => {
  it('UTF-8 CSVをBOM付きで日本語を保持して保存する', async () => {
    const blob = exportCleanerCsv(dataset, 'utf-8');
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const text = new TextDecoder('utf-8').decode(bytes);
    expect(text).toContain('会社名,金額');
    expect(text).toContain('株式会社山田,1200');
  });

  it('Shift_JIS CSVを日本語のまま保存する', async () => {
    const blob = exportCleanerCsv(dataset, 'shift_jis');
    const text = new TextDecoder('shift_jis').decode(await blob.arrayBuffer());
    expect(text).toContain('会社名,金額');
    expect(text).toContain('株式会社山田,1200');
  });

  it('Excelへ整理済みデータと変更履歴シートを出力する', async () => {
    const blob = exportCleanerWorkbook(dataset, history, true);
    const workbook = XLSX.read(await blob.arrayBuffer(), { type: 'array' });
    expect(workbook.SheetNames).toContain('整理済みデータ');
    expect(workbook.SheetNames).toContain('変更履歴');
    const historyRows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets['変更履歴'], { header: 1 });
    expect(historyRows[0]).toEqual(['操作', '行', '列', '変更前', '変更後', '理由']);
    expect(historyRows.flat().join(' ')).toContain('前後の空白を削除');
  });

  it('保存前サマリーを正しく集計する', () => {
    expect(summarizeCleaning(3, dataset, history)).toEqual({
      originalRows: 3,
      cleanedRows: 2,
      changedCells: 1,
      deletedRows: 1,
    });
  });
});
