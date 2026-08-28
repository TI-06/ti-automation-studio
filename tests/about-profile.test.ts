import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const homeSource = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf-8');
const baseLayoutSource = readFileSync(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf-8');
const aboutUrl = new URL('../src/pages/about.astro', import.meta.url);
const aboutSource = existsSync(aboutUrl) ? readFileSync(aboutUrl, 'utf-8') : '';

describe('制作者プロフィール導線', () => {
  it('トップ上部から制作者ページへ移動できる', () => {
    expect(homeSource).toContain('制作者について');
    expect(homeSource).toContain('href="/about"');
    expect(homeSource).toContain('現役SE');
    expect(homeSource).toContain('約10年');
    expect(homeSource).toContain('約100件');
  });

  it('メインナビから制作者ページへ移動できる', () => {
    expect(baseLayoutSource).toContain('<a href="/about">制作者</a>');
  });
});

describe('制作者についてページ', () => {
  it('aboutページを配置し、専門性と対応方針を説明する', () => {
    expect(existsSync(aboutUrl)).toBe(true);
    expect(aboutSource).toContain('現役SE');
    expect(aboutSource).toContain('システム開発 約10年');
    expect(aboutSource).toContain('Excel');
    expect(aboutSource).toContain('Google Apps Script');
    expect(aboutSource).toContain('Python');
    expect(aboutSource).toContain('API連携');
    expect(aboutSource).toContain('開発で大切にしていること');
    expect(aboutSource).toContain('対応できること');
  });

  it('匿名性を維持しつつPerson構造化データを持つ', () => {
    expect(aboutSource).toContain("'@type': 'Person'");
    expect(aboutSource).toContain("name: 'TI AUTOMATION STUDIO 制作者'");
    expect(aboutSource).toContain('本名・勤務先などの個人情報は公開していません');
  });
});
