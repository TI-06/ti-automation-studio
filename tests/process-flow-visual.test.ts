import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const homeSource = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf-8');
const desktopAsset = new URL('../public/images/process-flow-desktop.svg', import.meta.url);
const mobileAsset = new URL('../public/images/process-flow-mobile.svg', import.meta.url);

const orderedSteps = [
  ['01', '相談'],
  ['02', '現在の業務を確認'],
  ['03', '改善案・仕様整理'],
  ['04', '開発'],
  ['05', 'テスト'],
  ['06', '納品・改善'],
] as const;

describe('開発フローのレスポンシブ画像', () => {
  it('PC用とスマホ用のフロー画像を切り替えて表示する', () => {
    expect(homeSource).toContain('process-flow-desktop.svg');
    expect(homeSource).toContain('process-flow-mobile.svg');
    expect(homeSource).toContain('media="(max-width: 640px)"');
    expect(homeSource).toContain('alt="相談から納品・改善までの開発フロー"');
    expect(homeSource).toContain('loading="lazy"');
  });

  it('画像アセットをリポジトリに含める', () => {
    expect(existsSync(desktopAsset)).toBe(true);
    expect(existsSync(mobileAsset)).toBe(true);
  });

  it('SEO・アクセシビリティ用の工程テキストを正しい順番で残す', () => {
    expect(homeSource).toContain('class="process-accessible"');

    let previousIndex = -1;
    for (const [no, title] of orderedSteps) {
      const noIndex = homeSource.indexOf(`['${no}', '${title}'`);
      expect(noIndex).toBeGreaterThan(previousIndex);
      previousIndex = noIndex;
    }
  });
});
