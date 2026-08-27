import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('../src/pages/tools/index.astro', import.meta.url), 'utf-8');

describe('公開ツール一覧', () => {
  it('利用条件と代表機能を日本語で伝える', () => {
    expect(source).toContain('仕事で使える、');
    expect(source).toContain('無料の業務ツール。');
    expect(source).toContain('登録不要');
    expect(source).toContain('tool-product-card');
    expect(source).toContain('このツールを使う');
    expect(source).toContain('tool.processing');
    expect(source).toContain('tool.features');
    expect(source).toContain('tool.href');
  });

  it('Excel差分比較の内容がひと目で分かるプレビューを持つ', () => {
    expect(source).toContain('変更');
    expect(source).toContain('追加');
    expect(source).toContain('削除');
    expect(source).toContain('差分プレビュー');
  });

  it('データ整理ツールの健康診断と修正確認がひと目で分かるプレビューを持つ', () => {
    expect(source).toContain("tool.slug === 'data-cleaner'");
    expect(source).toContain('データ健康診断');
    expect(source).toContain('重複');
    expect(source).toContain('前後空白');
    expect(source).toContain('表記の違い');
    expect(source).toContain('変更内容を確認してから適用');
  });
});
