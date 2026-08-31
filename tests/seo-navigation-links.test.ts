import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const readSource = (relativePath: string) => readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), 'utf-8');

const layoutSource = readSource('src/layouts/BaseLayout.astro');
const homeSource = readSource('src/pages/index.astro');
const servicesIndexSource = readSource('src/pages/services/index.astro');
const worksIndexSource = readSource('src/pages/works/index.astro');
const toolsIndexSource = readSource('src/pages/tools/index.astro');

describe('SEO navigation links', () => {
  test('solutions hub is reachable from the homepage and global header/footer', () => {
    expect(homeSource).toContain('href="/solutions"');
    expect(layoutSource.match(/href="\/solutions"/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  test('price page is reachable from global footer', () => {
    expect(layoutSource).toContain('href="/price"');
  });

  test('services index links to solutions and price', () => {
    expect(servicesIndexSource).toContain('href="/solutions"');
    expect(servicesIndexSource).toContain('href="/price"');
  });

  test('works index links back to the solutions hub', () => {
    expect(worksIndexSource).toContain('href="/solutions"');
  });

  test('tools index links back to the solutions hub', () => {
    expect(toolsIndexSource).toContain('href="/solutions"');
  });
});
