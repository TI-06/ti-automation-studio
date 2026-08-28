function sanitizeBaseName(value: string): string {
  const normalized = value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || 'dashboard';
}

export function dashboardExportFileName(
  sheetName: string,
  extension: 'png' | 'xlsx' | 'json',
): string {
  return `${sanitizeBaseName(sheetName)}_ダッシュボード.${extension}`;
}

export function downloadDashboardBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadDashboardText(text: string, fileName: string): void {
  downloadDashboardBlob(new Blob([text], { type: 'application/json;charset=utf-8' }), fileName);
}

export async function exportDashboardImage(element: HTMLElement, fileName: string): Promise<void> {
  const { toBlob } = await import('html-to-image');
  const blob = await toBlob(element, {
    cacheBust: true,
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    backgroundColor: '#0b0d10',
    filter: (node) => !(node instanceof HTMLElement && node.hasAttribute('data-export-ignore')),
  });
  if (!blob) throw new Error('画像を生成できませんでした。ブラウザを更新して、もう一度お試しください。');
  downloadDashboardBlob(blob, fileName);
}

export function printDashboard(): void {
  window.print();
}
