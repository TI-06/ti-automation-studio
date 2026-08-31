import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const homeSource = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf-8');

describe('開発フローのビジュアル表示', () => {
  it('PCとスマホで専用のフロー画像を出し分ける', () => {
    expect(homeSource).toContain('<picture class="process-visual"');
    expect(homeSource).toContain('srcset="/images/process-flow-mobile.png"');
    expect(homeSource).toContain('media="(max-width: 640px)"');
    expect(homeSource).toContain('src="/images/process-flow-desktop.png"');
  });

  it('フロー画像に代替テキストと遅延読み込みを設定する', () => {
    expect(homeSource).toContain('alt="相談から納品・改善までの開発フロー"');
    expect(homeSource).toContain('loading="lazy"');
    expect(homeSource).toContain('decoding="async"');
  });

  it('01から06までのフロー本文をアクセシブルなテキストとして残す', () => {
    expect(homeSource).toContain('class="process-accessible"');
    expect(homeSource).toContain("['01', '相談'");
    expect(homeSource).toContain("['06', '納品・改善'");
  });
});
