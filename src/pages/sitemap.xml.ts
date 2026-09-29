import type { APIRoute } from 'astro';
import { services } from '../data/services';
import { works } from '../data/works';
import { solutions } from '../data/solutions';
import { publishedTools } from '../data/tools';

const FALLBACK_SITE = new URL('https://ti-automation-studio.utiltoools.workers.dev');

// Search Console向けにWorker実行ではなく、ビルド時に静的XMLとして生成する。
export const prerender = true;

const corePaths = [
  '/',
  '/services',
  '/works',
  '/price',
  '/solutions',
  '/tools',
  '/about',
  '/contact',
];

const standaloneServicePaths = [
  '/services/gas-repair',
  '/services/vba-repair',
];

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const collectPaths = () => {
  const paths = new Set<string>([
    ...corePaths,
    ...standaloneServicePaths,
    ...services.map((service) => `/services/${service.slug}`),
    ...works.map((work) => `/works/${work.slug}`),
    ...solutions.map((solution) => `/solutions/${solution.slug}`),
    ...publishedTools.map((tool) => tool.href),
  ]);

  return [...paths];
};

export const GET: APIRoute = ({ site }) => {
  const base = site ?? FALLBACK_SITE;
  const urls = collectPaths();

  const body = urls
    .map((path) => {
      const loc = escapeXml(new URL(path, base).toString());
      return `  <url>\n    <loc>${loc}</loc>\n  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
