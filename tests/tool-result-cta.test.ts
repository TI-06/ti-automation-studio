import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const component = readFileSync(new URL('../src/components/tools/ToolResultCTA.astro', import.meta.url), 'utf-8');
const helper = readFileSync(new URL('../src/scripts/tools/result-cta.ts', import.meta.url), 'utf-8');

describe('結果後相談CTA', () => {
  it('初期非表示でsourceだけを問い合わせへ渡す', () => {
    expect(component).toContain('data-tool-result-cta');
    expect(component).toContain('hidden');
    expect(component).toContain('toolContactHref');
    expect(component).toContain('config.serviceHref');
  });

  it('show/hideだけを行う共通ヘルパーを持つ', () => {
    expect(helper).toContain('bindToolResultCta');
    expect(helper).toContain('element.hidden = false');
    expect(helper).toContain('element.hidden = true');
    expect(helper).not.toContain('fetch(');
    expect(helper).not.toContain('localStorage');
  });
});
