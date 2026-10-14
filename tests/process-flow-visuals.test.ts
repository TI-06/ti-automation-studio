import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const home = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf-8');

describe('開発フローのレスポンシブ・アクセシビリティ', () => {
  it('画像を縮小表示せず、PC3列とスマホ1列のHTML工程カードを表示する', () => {
    expect(home).toContain('class="process-phase-grid"');
    expect(home).toContain('class="process-phase-card"');
    expect(home).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))');
    expect(home).toContain('.process-phase-grid { grid-template-columns: 1fr; gap: 12px; }');
    expect(home).not.toContain('src="/images/process-flow-desktop.svg"');
  });

  it('フローの工程名・説明文を画像に埋め込まず、実際のテキストで表示する', () => {
    expect(home).toContain('class="process-phase-steps"');
    expect(home).toContain('phase.steps.map');
    expect(home).toContain('<h4>{title}</h4>');
    expect(home).toContain('<p>{copy}</p>');
    expect(home).toContain('aria-label="ご相談から納品までの6工程"');
  });

  it('01から06までの全工程と仕様未確定者向けの案内を保つ', () => {
    expect(home).toContain("['01', '相談'");
    expect(home).toContain("['06', '納品・追加改修'");
    expect(home).toContain('steps: process.slice(0, 2)');
    expect(home).toContain('steps: process.slice(2, 4)');
    expect(home).toContain('steps: process.slice(4, 6)');
    expect(home).toContain('仕様が決まっていなくても相談できます。');
    expect(home).toContain('class="process-reassurance"');
  });
});
