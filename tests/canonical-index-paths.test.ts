import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { canonicalCorePaths, canonicalizeCorePath } from '../src/lib/canonical-core';
import { GET } from '../src/pages/sitemap.xml';

const SITE = 'https://ti-automation-studio.utiltoools.workers.dev';
const layout = readFileSync(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8');

describe('Sitemap and canonical URL consistency', () => {
  it('Google indexed /solutions/ is the only guide index URL advertised by sitemap', async () => {
    const xml = await (await GET({ site: new URL(SITE) } as never)).text();
    expect(xml).toContain(`<loc>${SITE}/solutions/</loc>`);
    expect(xml).not.toContain(`<loc>${SITE}/solutions</loc>`);
    expect(canonicalCorePaths).toContain('/solutions/');
    expect(canonicalCorePaths).not.toContain('/solutions');
  });

  it('Index-page slash aliases all resolve to a single canonical', () => {
    const pages = ['/services','/works','/price','/tools','/about'];
    expect(canonicalizeCorePath('/')).toBe('/');
    expect(canonicalizeCorePath('/solutions')).toBe('/solutions/');
    expect(canonicalizeCorePath('/solutions/')).toBe('/solutions/');
    for(const path of pages){
      expect(canonicalizeCorePath(path)).toBe(path);
      expect(canonicalizeCorePath(path+'/')).toBe(path);
    }
  });

  it('Service and guide detail paths retain their existing explicit canonical', () => {
    for(const path of ['/solutions/excel-transfer-automation/','/services/excel-automation/','/works/workflow-report-system']){
      expect(canonicalizeCorePath(path)).toBe(path);
    }
    expect(layout).toContain('canonicalizeCorePath(Astro.url.pathname)');
    expect(layout).toContain('const canonicalUrl = canonical ??');
  });
});
