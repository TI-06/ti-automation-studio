import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const cssUrl = new URL('../src/styles/tool-app.css', import.meta.url);
const shellUrl = new URL('../src/components/tools/ToolShell.astro', import.meta.url);
const progressUrl = new URL('../src/components/tools/ToolProgress.astro', import.meta.url);

describe('公開ツール共通UI', () => {
  it('業務アプリ向け3ペインとスマホ専用レイアウトを持つ', () => {
    expect(existsSync(cssUrl)).toBe(true);
    const css = existsSync(cssUrl) ? readFileSync(cssUrl, 'utf-8') : '';
    expect(css).toContain('.tool-app-grid');
    expect(css).toContain('.tool-summary-grid');
    expect(css).toContain('.tool-file-zone');
    expect(css).toContain('@media (max-width: 860px)');
  });

  it('無料・登録不要・処理方式を日本語で表示する', () => {
    expect(existsSync(shellUrl)).toBe(true);
    const source = existsSync(shellUrl) ? readFileSync(shellUrl, 'utf-8') : '';
    expect(source).toContain('無料');
    expect(source).toContain('登録不要');
    expect(source).toContain('processingLabel');
  });

  it('進捗をスクリーンリーダーにも伝える', () => {
    expect(existsSync(progressUrl)).toBe(true);
    const source = existsSync(progressUrl) ? readFileSync(progressUrl, 'utf-8') : '';
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('data-progress-label');
    expect(source).toContain('data-progress-count');
    expect(source).toContain('data-progress-bar');
  });
});
