/**
 * Stable canonical forms for top-level index pages.
 *
 * Google has indexed /solutions/ while the sitemap historically linked /solutions.
 * Choose one URL for the sitemap and both slash variants of every index page.
 * Service/guide detail pages preserve their existing explicit canonicals.
 */
export const coreCanonicalPaths = [
  '/',
  '/services',
  '/works',
  '/price',
  '/solutions/',
  '/tools',
  '/about',
] as const;

const canonicalVariants: Record<string, string> = {
  '/solutions': '/solutions/',
  '/solutions/': '/solutions/',
  '/services/': '/services',
  '/works/': '/works',
  '/price/': '/price',
  '/tools/': '/tools',
  '/about/': '/about',
};

export function canonicalizeCorePath(pathname: string): string {
  return canonicalVariants[pathname] ?? pathname;
}
