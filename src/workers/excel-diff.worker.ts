/// <reference lib="webworker" />

import { compareWorkbooks } from '../lib/tools/excel-diff/compare';
import {
  EXCEL_DIFF_STAGES,
  type ExcelDiffWorkerRequest,
  type ExcelDiffWorkerResponse,
  type NormalizedWorkbook,
  type WorkbookInspection,
} from '../lib/tools/excel-diff/types';
import { LARGE_EXCEL_ROWS, parseWorkbook } from '../lib/tools/excel-diff/workbook';

const worker = self as unknown as DedicatedWorkerGlobalScope;

function send(message: ExcelDiffWorkerResponse): void {
  worker.postMessage(message);
}

function progress(stage: number, current?: number, total?: number): void {
  send({
    type: 'progress',
    stage,
    label: EXCEL_DIFF_STAGES[stage - 1] ?? '処理しています',
    current,
    total,
  });
}

function inspect(workbook: NormalizedWorkbook): WorkbookInspection {
  return {
    fileName: workbook.fileName,
    sheetNames: [...workbook.sheetNames],
    sheets: workbook.sheets.map((sheet) => ({
      name: sheet.name,
      rowCount: sheet.rowCount,
      columnCount: sheet.columnCount,
      headers: [...sheet.headers],
      large: sheet.rowCount > LARGE_EXCEL_ROWS,
    })),
  };
}

function japaneseError(error: unknown): ExcelDiffWorkerResponse {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  if (lower.includes('password') || lower.includes('encrypt')) {
    return {
      type: 'error',
      title: 'このExcelは比較できません',
      message: 'パスワード保護されたExcelはこのツールでは比較できません。保護を解除したコピーでお試しください。',
    };
  }

  if (/空欄|重複|100,000行|見つかりません/.test(raw)) {
    return { type: 'error', title: '比較条件を確認してください', message: raw };
  }

  return {
    type: 'error',
    title: 'Excelを処理できませんでした',
    message: 'ファイルが破損しているか、対応していない内容が含まれている可能性があります。別のExcelファイルでお試しください。',
  };
}

worker.addEventListener('message', (event: MessageEvent<ExcelDiffWorkerRequest>) => {
  try {
    const request = event.data;

    if (request.type === 'inspect') {
      progress(1);
      const workbook = parseWorkbook(request.buffer, request.fileName);
      progress(2);
      send({ type: 'inspected', target: request.target, inspection: inspect(workbook) });
      return;
    }

    progress(1);
    const before = parseWorkbook(request.before, request.beforeName);
    const after = parseWorkbook(request.after, request.afterName);
    progress(2);

    const result = compareWorkbooks(before, after, request.options, (current, total) => {
      progress(3, current, total);
    });

    progress(4);
    send({ type: 'complete', result });
  } catch (error) {
    send(japaneseError(error));
  }
});
