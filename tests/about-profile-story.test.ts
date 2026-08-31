import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const aboutSource = readFileSync(new URL('../src/pages/about.astro', import.meta.url), 'utf-8');

describe('制作者ページの人物像と仕事観', () => {
  it('システム開発への興味と自動化の原点を説明する', () => {
    expect(aboutSource).toContain('システム開発そのものに興味');
    expect(aboutSource).toContain('手作業だったものが仕組みで自動化');
  });

  it('使いづらい多機能ツールを避ける開発姿勢を説明する', () => {
    expect(aboutSource).toContain('機能が多いことより、ちゃんと使えること');
    expect(aboutSource).toContain('何を一番改善したいか');
  });

  it('曖昧な仕様から柔軟に整理できることを伝える', () => {
    expect(aboutSource).toContain('仕様が決まっていなくても大丈夫');
    expect(aboutSource).toContain('一緒に整理');
  });

  it('得意領域と不得意領域を明確にする', () => {
    expect(aboutSource).toContain('Pythonを使った業務自動化');
    expect(aboutSource).toContain('Google Apps Scriptを使った業務自動化');
    expect(aboutSource).toContain('小規模なWebシステム');
    expect(aboutSource).toContain('デザインだけ');
  });

  it('納品後の保守と長期的な関係を重視する', () => {
    expect(aboutSource).toContain('納品して終わりではなく');
    expect(aboutSource).toContain('保守・改善');
    expect(aboutSource).toContain('お互いにメリットのある関係');
  });

  it('30代現役SEとして個人的な一面も公開する', () => {
    expect(aboutSource).toContain('30代の現役SE');
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
