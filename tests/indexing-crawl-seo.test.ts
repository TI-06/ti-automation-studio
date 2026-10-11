import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf-8');

const layout = read('src/layouts/BaseLayout.astro');
const contact = read('src/pages/contact.astro');
const privacy = read('src/pages/privacy.astro');
const home = read('src/pages/index.astro');
const serviceIndex = read('src/pages/services/index.astro');
const serviceDetail = read('src/pages/services/[slug].astro');
const solutionIndex = read('src/pages/solutions/index.astro');
const solutionDetail = read('src/pages/solutions/[slug].astro');
const workDetail = read('src/pages/works/[slug].astro');
const repairService = read('src/components/RepairServicePage.astro');
const excelTool = read('src/pages/tools/excel-diff.astro');
const cleanerTool = read('src/pages/tools/data-cleaner.astro');
const dashboardTool = read('src/pages/tools/dashboard-builder.astro');
const price = read('src/pages/price.astro');

describe('インデックス・クロール改善', () => {
  it('問い合わせとプライバシーは検索対象から外しリンク追跡は許可する', () => {
    expect(layout).toContain("noindex?: boolean");
    expect(layout).toContain("'noindex,follow'");
    expect(contact).toContain('noindex');
    expect(privacy).toContain('noindex');
  });

  it('prerender詳細ページは最終canonical URLへ直接リンクする', () => {
    expect(serviceIndex).toContain('href={`/services/${service.slug}/`}');
    expect(serviceDetail).toContain('new URL(`/services/${service.slug}/`');
    expect(serviceDetail).toContain('canonical={serviceUrl}');
    expect(serviceDetail).toContain('href={`/solutions/${guide.slug}/`}');
    expect(serviceDetail).toContain('href={`/services/${item.slug}/`}');

    expect(solutionIndex).toContain('href={`/solutions/${solution.slug}/`}');
    expect(solutionDetail).toContain('new URL(`/solutions/${solution.slug}/`');
    expect(solutionDetail).toContain('canonical={pageUrl}');
    expect(solutionDetail).toContain('href={`/solutions/${item.slug}/`}');
    expect(solutionDetail).toContain('href={`/services/${solution.relatedServiceSlug}/`}');
    expect(workDetail).toContain('href={`/solutions/${guide.slug}/`}');
    expect(repairService).toContain('href={`/solutions/${guide.slug}/`}');
    expect(excelTool).toContain('href="/services/excel-automation/"');
    expect(cleanerTool).toContain('href="/services/python-data-processing/"');
    expect(dashboardTool).toContain('href="/services/excel-automation/"');
    expect(dashboardTool).toContain('href="/services/python-data-processing/"');
  });

  it('ガイドArticle構造化データに画像と組織ロゴを付ける', () => {
    expect(solutionDetail).toContain('image: articleImageUrl');
    expect(solutionDetail).toContain('logo: logoUrl');
    expect(layout).toContain("logo: resolveAssetUrl('/favicon.svg')");
  });

  it('トップから5テーマのガイドへ直接リンクする', () => {
    for (const cluster of ['excel', 'gas', 'python', 'api', 'automation']) {
      expect(home).toContain(`'${cluster}'`);
    }
    expect(home).toContain('href={`/solutions/${solution.slug}/`}');
  });

  it('サービス一覧に技術選定の説明を追加してハブページを強化する', () => {
    expect(serviceIndex).toContain('技術名ではなく、今の作業と利用人数から決めます。');
    expect(serviceIndex).toContain('現在のファイル、作業手順、利用人数、データ件数');
  });

  it('料金ページに具体的な見積パターンを追加する', () => {
    expect(price).toContain('既存VBA・GASの修正');
    expect(price).toContain('毎月の転記・集計を自動化');
    expect(price).toContain('入力・承認・PDFまでの業務ツール');
    expect(price).toContain('API・外部サービス連携');
  });
});
