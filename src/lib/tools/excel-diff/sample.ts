import * as XLSX from 'xlsx';

function buildSampleFile(
  fileName: string,
  rows: (string | number)[][],
  formulas: Record<string, { formula: string; value: number }>,
): File {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  for (const [address, formula] of Object.entries(formulas)) {
    worksheet[address] = { t: 'n', v: formula.value, f: formula.formula };
  }

  worksheet['!cols'] = [
    { wch: 14 }, { wch: 22 }, { wch: 10 }, { wch: 12 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, '売上');
  const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return new File([bytes], fileName, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function createSampleFiles(): { before: File; after: File } {
  const before = buildSampleFile(
    '変更前サンプル.xlsx',
    [
      ['商品コード', '商品名', '数量', '単価', '合計'],
      ['A001', 'オフィスチェア', 2, 12000, 24000],
      ['A002', 'デスクライト', 3, 4800, 14400],
      ['A003', '収納ボックス', 5, 2100, 10500],
    ],
    {
      E2: { formula: 'C2*D2', value: 24000 },
      E3: { formula: 'C3*D3', value: 14400 },
      E4: { formula: 'C4*D4', value: 10500 },
    },
  );

  const after = buildSampleFile(
    '変更後サンプル.xlsx',
    [
      ['商品コード', '商品名', '数量', '単価', '合計'],
      ['A001', 'オフィスチェア', 3, 12000, 39600],
      ['A002', 'デスクライト', 3, 4800, 14400],
      ['A004', 'モニター台', 2, 5600, 11200],
    ],
    {
      E2: { formula: 'C2*D2*1.1', value: 39600 },
      E3: { formula: 'C3*D3', value: 14400 },
      E4: { formula: 'C4*D4', value: 11200 },
    },
  );

  return { before, after };
}
