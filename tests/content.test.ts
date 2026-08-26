import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { works } from '../src/data/works';
import { tools } from '../src/data/tools';

const homeSource = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf-8');
const worksIndexSource = readFileSync(new URL('../src/pages/works/index.astro', import.meta.url), 'utf-8');
const workDetailSource = readFileSync(new URL('../src/pages/works/[slug].astro', import.meta.url), 'utf-8');
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

describe('実績のケーススタディ表示', () => {
  it('全実績に一覧と詳細で使う説明情報を持たせる', () => {
    for (const work of works) {
      expect(work.category).toBeTruthy();
      expect(work.overview.length).toBeGreaterThan(50);
      expect(work.features.length).toBeGreaterThanOrEqual(3);
      expect(work.suitableFor.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('実績一覧で課題と改善ポイントを先に比較できる', () => {
    expect(worksIndexSource).toContain('class="work-card-insights"');
    expect(worksIndexSource).toContain('課題');
    expect(worksIndexSource).toContain('改善');
    expect(worksIndexSource).toContain('詳細を見る');
  });

  it('実績詳細で概要を先に把握してから詳細を読める', () => {
    expect(workDetailSource).toContain('class="case-overview-grid"');
    expect(workDetailSource).toContain('この実績について');
    expect(workDetailSource).toContain('主な機能');
    expect(workDetailSource).toContain('こんな相談に向いています');
    expect(globalCss).toContain('.case-overview-grid');
  });

  it('建設業界向けの工程・安全帳票ケーススタディを掲載する', () => {
    const construction = works.find((work) => work.slug === 'construction-site-operations');
    expect(construction).toBeTruthy();
    expect(construction?.category).toContain('建設');
    expect(construction?.title).toContain('工程');
    expect(construction?.title).toContain('安全帳票');
    expect(construction?.features.length).toBeGreaterThanOrEqual(6);
    expect(construction?.technologies).toContain('Google Apps Script');
  });
});
