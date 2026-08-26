import { describe, expect, it } from 'vitest';
import { works } from '../src/data/works';
import { tools } from '../src/data/tools';

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
