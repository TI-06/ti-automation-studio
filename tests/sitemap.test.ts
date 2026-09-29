import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { services } from '../src/data/services';
import { solutions } from '../src/data/solutions';
import { publishedTools } from '../src/data/tools';
import { works } from '../src/data/works';
import { GET } from '../src/pages/sitemap.xml';

const SITE = 'https://ti-automation-studio.utiltoools.workers.dev';
const robots = readFileSync(new URL('../public/robots.txt', import.meta.url), 'utf-8');
const layout = readFileSync(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf-8');
const astroConfig = readFileSync(new URL('../astro.config.mjs', import.meta.url), 'utf-8');

const expectedPaths = [
  '/',
  '/services',
  '/works',
  '/price',
  '/solutions',
  '/tools',
  '/about',
  '/contact',
  '/services/gas-repair',
  '/services/vba-repair',
  ...services.map((service) => `/services/${service.slug}`),
  ...works.map((work) => `/works/${work.slug}`),
  ...solutions.map((solution) => `/solutions/${solution.slug}`),
  ...publishedTools.map((tool) => tool.href),
];

const getSitemap = async () => {
  const response = await GET({ site: new URL(SITE) } as never);
  return {
    response,
    xml: await response.text(),
  };
};

describe('Google Search Console向けサイトマップ', () => {
  it('sitemap.xml 1本で主要なcanonical URLを返す', async () => {
    const { response, xml } = await getSitemap();

    expect(response.headers.get('Content-Type')).toBe('application/xml; charset=utf-8');
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

    for (const path of expectedPaths) {
      expect(xml).toContain(`<loc>${new URL(path, SITE).toString()}</loc>`);
    }
  });

  it('実績・サービス・ガイド・公開ツールをデータから漏れなく含める', async () => {
    const { xml } = await getSitemap();
    const locations = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
    const expectedLocations = [...new Set(expectedPaths.map((path) => new URL(path, SITE).toString()))];

    expect(new Set(locations).size).toBe(locations.length);
    expect(locations.length).toBe(expectedLocations.length);
    expect(new Set(locations)).toEqual(new Set(expectedLocations));
  });

  it('検索結果に出す必要が薄いAPI・未公開ツール・プライバシーは含めない', async () => {
    const { xml } = await getSitemap();

    expect(xml).not.toContain('/api/');
    expect(xml).not.toContain('/tools/automation-sample');
    expect(xml).not.toContain('/tools/data-processing-sample');
    expect(xml).not.toContain('/privacy');
  });

  it('Googleが利用しないpriority/changefreqを出力しない', async () => {
    const { xml } = await getSitemap();

    expect(xml).not.toContain('<priority>');
    expect(xml).not.toContain('<changefreq>');
  });

  it('robots.txtとheadの両方からsitemap.xmlを案内する', () => {
    expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`);
    expect(robots).not.toContain('sitemap-index.xml');
    expect(layout).toContain('rel="sitemap"');
    expect(layout).toContain('href="/sitemap.xml"');
  });

  it('Astro標準のsitemap-index生成と二重管理しない', () => {
    expect(astroConfig).not.toContain("import sitemap from '@astrojs/sitemap'");
    expect(astroConfig).not.toContain('sitemap()');
  });
});
