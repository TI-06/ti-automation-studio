import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const layoutSource = readFileSync(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf-8');
const coconalaUrl = 'https://coconala.com/users/5379632';

describe('ヘッダーのココナラ導線', () => {
  it('右上ナビにサイト問い合わせとココナラ問い合わせを並べる', () => {
    expect(layoutSource).toContain('サイトから相談');
    expect(layoutSource).toContain('ココナラから問い合わせ');
    expect(layoutSource).toContain(`href="${coconalaUrl}"`);
  });

  it('ココナラは1クリックの安全な外部リンクにする', () => {
    expect(layoutSource).toContain('target="_blank"');
    expect(layoutSource).toContain('rel="noopener noreferrer"');
  });
});
