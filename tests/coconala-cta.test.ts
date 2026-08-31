import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const homeSource = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf-8');
const contactSource = readFileSync(new URL('../src/pages/contact.astro', import.meta.url), 'utf-8');

const coconalaUrl = 'https://coconala.com/users/5379632';

describe('ココナラ依頼導線', () => {
  it('トップページの最終CTAにココナラ依頼ボタンを表示する', () => {
    expect(homeSource).toContain(`href="${coconalaUrl}"`);
    expect(homeSource).toContain('ココナラから依頼する');
  });

  it('問い合わせページでサイトフォーム以外にココナラを選べる', () => {
    expect(contactSource).toContain(`href="${coconalaUrl}"`);
    expect(contactSource).toContain('ココナラから依頼する');
    expect(contactSource).toContain('ココナラでの取引を希望する方');
  });

  it('外部リンクとして安全な属性を付ける', () => {
    expect(homeSource).toContain('target="_blank"');
    expect(homeSource).toContain('rel="noopener noreferrer"');
    expect(contactSource).toContain('target="_blank"');
    expect(contactSource).toContain('rel="noopener noreferrer"');
  });
});
