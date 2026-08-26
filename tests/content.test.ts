import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { works } from '../src/data/works';
import { tools } from '../src/data/tools';

const homeSource = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf-8');
const globalCss = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf-8');

describe('公開コンテンツ', () => {
  it('実績slugが重複しない', () => {
    const slugs = works.map((work) => work.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('実績に秘密情報らしいキー名を含めない', () => {
    const text = JSON.stringify(works);
    for (const forbidden of ['API_KEY', 'ACCESS_TOKEN', 'SECRET_KEY', 'PRIVATE_KEY']) {
      expect(text).not.toContain(forbidden);
    }
  });

  it('公開ツールはURLがある場合httpsのみ許可する', () => {
    for (const tool of tools.filter((item) => item.published)) {
      for (const url of [tool.demoUrl, tool.githubUrl].filter(Boolean)) {
        expect(url).toMatch(/^https:\/\//);
      }
    }
  });
});

describe('トップページのヒーローレイアウト', () => {
  it('見出しを意図した3行に固定する', () => {
    expect(homeSource).toContain('<span class="hero-line">面倒な業務を、</span>');
    expect(homeSource).toContain('<span class="hero-line accent">使える仕組み</span>');
    expect(homeSource).toContain('<span class="hero-line">に変える。</span>');
  });

  it('PCとスマホで見出しサイズを抑え、中間幅では1カラムにする', () => {
    expect(globalCss).toContain('font-size: clamp(2.7rem, 6.1vw, 5.8rem);');
    expect(globalCss).toContain('@media (max-width: 1100px)');
    expect(globalCss).toContain('font-size: clamp(2.35rem, 12vw, 3.7rem);');
  });
});
