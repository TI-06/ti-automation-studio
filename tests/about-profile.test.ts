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

  it('トップで本業経験と個別開発の両方が伝わる', () => {
    expect(homeSource).toContain('本業');
    expect(homeSource).toContain('個別開発');
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

  it('経歴の流れを説明する', () => {
    expect(aboutSource).toContain('経験の広がり');
    expect(aboutSource).toContain('Excel・VBA');
    expect(aboutSource).toContain('GAS');
    expect(aboutSource).toContain('Python・Web・API');
  });

  it('よく扱う業務課題を具体化する', () => {
    expect(aboutSource).toContain('よく扱う業務課題');
    expect(aboutSource).toContain('転記・集計');
    expect(aboutSource).toContain('帳票');
    expect(aboutSource).toContain('複数人運用');
    expect(aboutSource).toContain('既存Excelの改修');
  });

  it('制作者の強みを説明する', () => {
    expect(aboutSource).toContain('強み');
    expect(aboutSource).toContain('どこを自動化し、どこを人に残すか');
  });

  it('向いている相談を具体例で示す', () => {
    expect(aboutSource).toContain('こういう相談に向いています');
    expect(aboutSource).toContain('Excelが限界');
    expect(aboutSource).toContain('毎月同じ作業');
    expect(aboutSource).toContain('仕様が固まっていない');
  });

  it('仕事の進め方を説明する', () => {
    expect(aboutSource).toContain('仕事の進め方');
    expect(aboutSource).toContain('小さく確認');
    expect(aboutSource).toContain('保守性');
    expect(aboutSource).toContain('処理状態');
  });

  it('Person構造化データを持つ', () => {
    expect(aboutSource).toContain("'@type': 'Person'");
    expect(aboutSource).toContain("name: 'TI AUTOMATION STUDIO 制作者'");
  });
});
