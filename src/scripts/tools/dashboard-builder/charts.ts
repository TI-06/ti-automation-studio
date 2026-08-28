import {
  Chart,
  registerables,
  type ChartConfiguration,
  type ChartType,
} from 'chart.js';
import type { DashboardWidget, DashboardWidgetResult } from '../../../lib/tools/dashboard-builder/types';

Chart.register(...registerables);

const chartInstances = new Map<string, Chart>();
const ACCENT = '#c8a96b';
const TEXT = '#d7d4cc';
const MUTED = '#8f918f';
const GRID = 'rgba(242,240,234,.09)';
const PALETTE = ['#c8a96b', '#8ea6b8', '#b89888', '#9baa91', '#a79abc', '#c0b17c', '#7fa4a2', '#b18e9c'];

function chartType(kind: DashboardWidget['kind']): ChartType {
  if (kind === 'line') return 'line';
  if (kind === 'donut') return 'doughnut';
  return 'bar';
}

export function buildDashboardChartSpec(
  widget: DashboardWidget,
  result: DashboardWidgetResult,
): ChartConfiguration {
  const type = chartType(widget.kind);
  const horizontal = widget.kind === 'horizontal-bar';
  const doughnut = widget.kind === 'donut';

  const dataset = doughnut
    ? {
        label: widget.title,
        data: result.values,
        backgroundColor: result.values.map((_, index) => PALETTE[index % PALETTE.length]),
        borderColor: '#111317',
        borderWidth: 2,
      }
    : {
        label: widget.title,
        data: result.values,
        borderColor: ACCENT,
        backgroundColor: type === 'line' ? 'rgba(200,169,107,.14)' : 'rgba(200,169,107,.72)',
        pointBackgroundColor: ACCENT,
        pointBorderColor: '#111317',
        pointRadius: type === 'line' ? 3 : 0,
        tension: type === 'line' ? 0.28 : 0,
        fill: type === 'line',
        borderWidth: type === 'line' ? 2 : 1,
      };

  return {
    type,
    data: {
      labels: result.labels,
      datasets: [dataset],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 240 },
      indexAxis: horizontal ? 'y' : 'x',
      plugins: {
        legend: {
          display: doughnut,
          position: 'bottom',
          labels: {
            color: TEXT,
            boxWidth: 10,
            boxHeight: 10,
            padding: 14,
            font: { size: 10 },
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = typeof context.raw === 'number' ? context.raw : Number(context.raw ?? 0);
              return `${context.dataset.label ? `${context.dataset.label}: ` : ''}${value.toLocaleString('ja-JP')}`;
            },
          },
        },
      },
      scales: doughnut ? undefined : {
        x: {
          grid: { color: horizontal ? GRID : 'transparent' },
          ticks: { color: MUTED, maxRotation: 45, minRotation: 0, font: { size: 10 } },
          border: { color: GRID },
        },
        y: {
          beginAtZero: true,
          grid: { color: GRID },
          ticks: {
            color: MUTED,
            font: { size: 10 },
            callback: (value) => typeof value === 'number' ? value.toLocaleString('ja-JP') : String(value),
          },
          border: { color: GRID },
        },
      },
    },
  };
}

export function renderDashboardChart(
  canvas: HTMLCanvasElement,
  widget: DashboardWidget,
  result: DashboardWidgetResult,
): void {
  chartInstances.get(widget.id)?.destroy();
  const chart = new Chart(canvas, buildDashboardChartSpec(widget, result));
  chartInstances.set(widget.id, chart);
}

export function destroyDashboardChart(widgetId: string): void {
  chartInstances.get(widgetId)?.destroy();
  chartInstances.delete(widgetId);
}

export function destroyAllDashboardCharts(): void {
  chartInstances.forEach((chart) => chart.destroy());
  chartInstances.clear();
}
