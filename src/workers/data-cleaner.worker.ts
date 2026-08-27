/// <reference lib="webworker" />

import { diagnoseDataset } from '../lib/tools/data-cleaner/diagnostics';
import type { CleanerDataset, DiagnosticResult } from '../lib/tools/data-cleaner/types';

export const DATA_CLEANER_STAGES = [
  'ファイルを読み込んでいます',
  '列の内容を確認しています',
  '重複や表記の違いを探しています',
  '診断結果をまとめています',
] as const;

export type DataCleanerWorkerRequest = {
  type: 'diagnose';
  dataset: CleanerDataset;
};

export type DataCleanerWorkerResponse =
  | { type: 'progress'; stage: number; label: string }
  | { type: 'complete'; diagnostics: DiagnosticResult }
  | { type: 'error'; title: string; message: string };

const worker = self as unknown as DedicatedWorkerGlobalScope;

function send(message: DataCleanerWorkerResponse): void {
  worker.postMessage(message);
}

function progress(stage: number): void {
  send({
    type: 'progress',
    stage,
    label: DATA_CLEANER_STAGES[stage - 1] ?? '処理しています',
  });
}

worker.addEventListener('message', (event: MessageEvent<DataCleanerWorkerRequest>) => {
  try {
    if (event.data.type !== 'diagnose') return;
    progress(1);
    progress(2);
    progress(3);
    const diagnostics = diagnoseDataset(event.data.dataset);
    progress(4);
    send({ type: 'complete', diagnostics });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    send({
      type: 'error',
      title: 'データを診断できませんでした',
      message: message || 'ファイルの内容を確認して、もう一度お試しください。',
    });
  }
});
