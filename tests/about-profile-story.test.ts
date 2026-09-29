import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const aboutSource = readFileSync(new URL('../src/pages/about.astro', import.meta.url), 'utf-8');

describe('制作者ページの人物像と仕事観', () => {
  it('現役SEとしての経験を具体的に伝える', () => {
    expect(aboutSource).toContain('30代の現役SE');
    expect(aboutSource).toContain('業務システムの開発・改修に約10年');
    expect(aboutSource).toContain('個人でも');
  });

  it('相談内容に合わせて技術を選ぶ方針を説明する', () => {
    expect(aboutSource).toContain('最初から「GASで作る」「Webシステムにする」と決めることはあまりありません');
    expect(aboutSource).toContain('現在のファイルや作業手順');
    expect(aboutSource).toContain('Excelを残す');
  });

  it('小規模修正とWeb化を使い分ける考え方を示す', () => {
    expect(aboutSource).toContain('小さな修正で済むなら');
    expect(aboutSource).toContain('複数人利用');
    expect(aboutSource).toContain('Web化を提案');
  });

  it('得意領域を具体的に示す', () => {
    expect(aboutSource).toContain('Excel・VBA');
    expect(aboutSource).toContain('Google Apps Script');
    expect(aboutSource).toContain('Python・データ処理');
    expect(aboutSource).toContain('社内Webツール');
    expect(aboutSource).toContain('API・外部サービス連携');
  });

  it('納品後の保守と追加改修に対応する', () => {
    expect(aboutSource).toContain('保守・追加改修');
    expect(aboutSource).toContain('実際に使い始めてから');
    expect(aboutSource).toContain('使いながら追加');
  });

  it('個人的な一面も公開する', () => {
    expect(aboutSource).toContain('スポーツ観戦');
    expect(aboutSource).toContain('お酒');
  });

  it('不要な個人情報・案件情報の注意書きを表示しない', () => {
    expect(aboutSource).not.toContain('依頼者や案件を特定できる顧客名・固有データ・秘密情報');
    expect(aboutSource).not.toContain('about-privacy-note');
  });

  it('最後にサイトとココナラの2つの相談導線を用意する', () => {
    expect(aboutSource).toContain('サイトから相談する');
    expect(aboutSource).toContain('ココナラから相談する');
    expect(aboutSource).toContain('https://coconala.com/users/5379632');
  });
});
