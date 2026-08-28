import { aggregateWidgets } from '../lib/tools/dashboard-builder/aggregate';
import { buildInitialDashboardWidgets } from '../lib/tools/dashboard-builder/auto-layout';
import { buildFilterCandidates } from '../lib/tools/dashboard-builder/filters';
import { inferDashboardColumns } from '../lib/tools/dashboard-builder/inference';
import type {
  DashboardColumn,
  DashboardDataset,
  DashboardFilter,
  DashboardFilterCandidate,
  DashboardWidget,
  DashboardWidgetResult,
} from '../lib/tools/dashboard-builder/types';

export const DASHBOARD_ANALYZE_STAGES = [
  'ファイルを読み込んでいます',
  '列の種類を確認しています',
  '集計候補を作っています',
  'ダッシュボードを作成しています',
] as const;

export type DashboardWorkerRequest =
  | { type: 'analyze'; dataset: DashboardDataset }
  | {
      type: 'aggregate';
      dataset: DashboardDataset;
      columns: DashboardColumn[];
      widgets: DashboardWidget[];
      filters: DashboardFilter[];
    };

export type DashboardWorkerResponse =
  | { type: 'progress'; stage: number; label: string }
  | {
      type: 'analyzed';
      columns: DashboardColumn[];
      widgets: DashboardWidget[];
      filterCandidates: DashboardFilterCandidate[];
    }
  | {
      type: 'aggregated';
      results: DashboardWidgetResult[];
      filteredRowIndexes: number[];
    }
  | { type: 'error'; title: string; message: string };

type WorkerScope = {
  postMessage(message: DashboardWorkerResponse): void;
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent<DashboardWorkerRequest>) => void,
  ): void;
};

const worker = self as unknown as WorkerScope;

function send(message: DashboardWorkerResponse): void {
  worker.postMessage(message);
}

function progress(stage: number, label?: string): void {
  send({
    type: 'progress',
    stage,
    label: label ?? DASHBOARD_ANALYZE_STAGES[stage - 1] ?? '処理しています',
  });
}

function analyze(dataset: DashboardDataset): void {
  progress(1);
  progress(2);
  const columns = inferDashboardColumns(dataset);
  progress(3);
  const filterCandidates = buildFilterCandidates(dataset, columns);
  progress(4);
  const widgets = buildInitialDashboardWidgets(dataset, columns);
  send({ type: 'analyzed', columns, widgets, filterCandidates });
}

function aggregate(
  dataset: DashboardDataset,
  columns: DashboardColumn[],
  widgets: DashboardWidget[],
  filters: DashboardFilter[],
): void {
  progress(1, '絞り込み条件で再集計しています');
  const result = aggregateWidgets(dataset, columns, widgets, filters);
  send({
    type: 'aggregated',
    results: result.results,
    filteredRowIndexes: result.filteredRowIndexes,
  });
}

worker.addEventListener('message', (event) => {
  try {
    if (event.data.type === 'analyze') {
      analyze(event.data.dataset);
      return;
    }
    aggregate(event.data.dataset, event.data.columns, event.data.widgets, event.data.filters);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    send({
      type: 'error',
      title: 'ダッシュボードを作成できませんでした',
      message: message || 'データ内容を確認して、もう一度お試しください。',
    });
  }
});
