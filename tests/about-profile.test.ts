import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const homeSource = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf-8');
const baseLayoutSource = readFileSync(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf-8');
const aboutUrl = new URL('../src/pages/about.astro', import.meta.url);
const aboutSource = existsSync(aboutUrl) ? readFileSync(aboutUrl, 'utf-8') : '';

describe('制作者プロフィール導線', () => {
  it('トップから制作者ページへ移動できる', () => {
    expect(homeSource).toContain('制作者について');
    expect(homeSource).toContain('href="/about"');
    expect(homeSource).toContain('現役SE');
    expect(homeSource).toContain('約10年');
    expect(homeSource).toContain('約100件');
  });

  it('トップで本業経験と個別開発の両方が伝わる', () => {
    expect(homeSource).toContain('本業');
    expect(homeSource).toContain('個人でも');
  });

  it('メインナビから制作者ページへ移動できる', () => {
    expect(baseLayoutSource).toContain('<a href="/about">制作者</a>');
  });
});

describe('制作者についてページ', () => {
  it('経験と対応領域を具体的に説明する', () => {
    expect(existsSync(aboutUrl)).toBe(true);
    expect(aboutSource).toContain('30代の現役SE');
    expect(aboutSource).toContain('システム開発 約10年');
    expect(aboutSource).toContain('Excel・VBA');
    expect(aboutSource).toContain('Google Apps Script');
    expect(aboutSource).toContain('Python・データ処理');
    expect(aboutSource).toContain('API・外部サービス連携');
    expect(aboutSource).toContain('得意なこと');
  });

  it('実際に受けている業務を説明する', () => {
    expect(aboutSource).toContain('このサイトで受けている仕事');
    expect(aboutSource).toContain('転記や集計');
    expect(aboutSource).toContain('PDF');
    expect(aboutSource).toContain('複数人');
    expect(aboutSource).toContain('Excel');
  });

  it('技術を先に決めず現状から判断する方針を説明する', () => {
    expect(aboutSource).toContain('現在のファイルや作業手順');
    expect(aboutSource).toContain('Excelを残す');
    expect(aboutSource).toContain('GAS');
    expect(aboutSource).toContain('Web化');
  });

  it('開発時に気を付けていることを具体化する', () => {
    expect(aboutSource).toContain('仕事で気を付けていること');
    expect(aboutSource).toContain('今の業務を先に確認する');
    expect(aboutSource).toContain('既存のものを無理に捨てない');
    expect(aboutSource).toContain('利用者が迷わない画面');
    expect(aboutSource).toContain('後から直せる作り');
  });

  it('納品後の追加改修について説明する', () => {
    expect(aboutSource).toContain('保守・追加改修');
    expect(aboutSource).toContain('納品後の修正や機能追加');
    expect(aboutSource).toContain('運用開始後');
  });

  it('Person構造化データを持つ', () => {
    expect(aboutSource).toContain("'@type': 'Person'");
    expect(aboutSource).toContain("name: 'TI AUTOMATION STUDIO 制作者'");
  });
});
