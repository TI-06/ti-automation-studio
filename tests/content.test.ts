import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { works } from '../src/data/works';
import { tools } from '../src/data/tools';

const homeSource = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf-8');
const worksIndexSource = readFileSync(new URL('../src/pages/works/index.astro', import.meta.url), 'utf-8');
const workDetailSource = readFileSync(new URL('../src/pages/works/[slug].astro', import.meta.url), 'utf-8');
const globalCss = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf-8');
const baseLayoutSource = readFileSync(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf-8');
const astroConfigSource = readFileSync(new URL('../astro.config.mjs', import.meta.url), 'utf-8');
const robotsSource = readFileSync(new URL('../public/robots.txt', import.meta.url), 'utf-8');
const serviceDataUrl = new URL('../src/data/services.ts', import.meta.url);
const serviceIndexUrl = new URL('../src/pages/services/index.astro', import.meta.url);
const serviceDetailUrl = new URL('../src/pages/services/[slug].astro', import.meta.url);
const serviceDataSource = existsSync(serviceDataUrl) ? readFileSync(serviceDataUrl, 'utf-8') : '';
const serviceIndexSource = existsSync(serviceIndexUrl) ? readFileSync(serviceIndexUrl, 'utf-8') : '';
const serviceDetailSource = existsSync(serviceDetailUrl) ? readFileSync(serviceDetailUrl, 'utf-8') : '';
const gasReceiverUrl = new URL('../gas/contact-receiver/Code.gs', import.meta.url);
const gasReceiverReadmeUrl = new URL('../gas/contact-receiver/README.md', import.meta.url);
const gasReceiverSource = existsSync(gasReceiverUrl) ? readFileSync(gasReceiverUrl, 'utf-8') : '';
const gasReceiverReadme = existsSync(gasReceiverReadmeUrl) ? readFileSync(gasReceiverReadmeUrl, 'utf-8') : '';

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

describe('SEO設定', () => {
  it('本番URLをcanonicalとsitemapの基準にする', () => {
    expect(astroConfigSource).toContain("site: 'https://ti-automation-studio.utiltoools.workers.dev'");
    expect(robotsSource).toContain('https://ti-automation-studio.utiltoools.workers.dev/sitemap-index.xml');
  });

  it('Google Search Consoleの所有権確認メタタグを出力する', () => {
    expect(baseLayoutSource).toContain('<meta name="google-site-verification" content="R2F-nSTc4w9KY3PCBI2bGG6TvsgPLMwXYng-q31bG3g" />');
  });

  it('OGPとTwitter metadataをページURL・画像と揃えられる', () => {
    expect(baseLayoutSource).toContain('ogImage?: string');
    expect(baseLayoutSource).toContain('structuredData?:');
    expect(baseLayoutSource).toContain('property="og:url"');
    expect(baseLayoutSource).toContain('property="og:site_name"');
    expect(baseLayoutSource).toContain('name="twitter:title"');
    expect(baseLayoutSource).toContain('name="twitter:description"');
    expect(baseLayoutSource).toContain('name="twitter:image"');
    expect(baseLayoutSource).toContain("'@type': 'WebSite'");
  });
});

describe('検索意図別サービスページ', () => {
  it('5つのサービスデータと一覧・詳細ページを配置する', () => {
    expect(existsSync(serviceDataUrl)).toBe(true);
    expect(existsSync(serviceIndexUrl)).toBe(true);
    expect(existsSync(serviceDetailUrl)).toBe(true);
    for (const slug of [
      'excel-automation',
      'gas-automation',
      'python-data-processing',
      'api-integration',
      'pdf-document-automation',
    ]) {
      expect(serviceDataSource).toContain(`slug: '${slug}'`);
    }
  });

  it('各サービスがSEO文章・専用画像・FAQ・関連導線を持つ', () => {
    expect(serviceDataSource).toContain('seoTitle:');
    expect(serviceDataSource).toContain('description:');
    expect(serviceDataSource).toContain('visual:');
    expect(serviceDataSource).toContain('visualAlt:');
    expect(serviceDataSource).toContain('problems:');
    expect(serviceDataSource).toContain('capabilities:');
    expect(serviceDataSource).toContain('faq:');
    expect(serviceDetailSource).toContain("'@type': 'Service'");
    expect(serviceDetailSource).toContain("'@type': 'BreadcrumbList'");
    expect(serviceDetailSource).toContain('href="/contact"');
    expect(serviceDetailSource).toContain('width="1600"');
    expect(serviceDetailSource).toContain('height="900"');
    expect(serviceDetailSource).toContain('関連する開発実績');
  });

  it('トップから主要5サービスへ内部リンクする', () => {
    for (const slug of [
      'excel-automation',
      'gas-automation',
      'python-data-processing',
      'api-integration',
      'pdf-document-automation',
    ]) {
      expect(homeSource).toContain(`/services/${slug}`);
    }
    expect(homeSource).toContain('href="/services"');
  });

  it('サービスページ向けの視認性とレスポンシブCSSを持つ', () => {
    expect(globalCss).toContain('.service-hero-grid');
    expect(globalCss).toContain('.service-visual');
    expect(globalCss).toContain('.service-flow');
    expect(globalCss).toContain('.service-faq');
  });
});

describe('トップページのヒーローレイアウト', () => {
  it('見出しを意図した3行に固定する', () => {
    expect(homeSource).toContain('<span class="hero-line">面倒な業務を、</span>');
    expect(homeSource).toContain('<span class="hero-line accent">使える仕組み</span>');
    expect(homeSource).toContain('<span class="hero-line">に変える。</span>');
  });

  it('PCとスマホで見出しサイズを抑え、中間幅では1カラムにする', () => {
    expect(globalCss).toContain('font-size: clamp(2.7rem, 6.1vw, 5.8rem);');
    expect(globalCss).toContain('@media (max-width: 1100px)');
    expect(globalCss).toContain('font-size: clamp(2.35rem, 12vw, 3.7rem);');
  });
});

describe('実績のケーススタディ表示', () => {
  it('全実績に一覧と詳細で使う説明情報を持たせる', () => {
    for (const work of works) {
      expect(work.category).toBeTruthy();
      expect(work.overview.length).toBeGreaterThan(50);
      expect(work.features.length).toBeGreaterThanOrEqual(3);
      expect(work.suitableFor.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('実績一覧で課題と改善ポイントを先に比較できる', () => {
    expect(worksIndexSource).toContain('class="work-card-insights"');
    expect(worksIndexSource).toContain('課題');
    expect(worksIndexSource).toContain('改善');
    expect(worksIndexSource).toContain('詳細を見る');
  });

  it('実績詳細で概要を先に把握してから詳細を読める', () => {
    expect(workDetailSource).toContain('class="case-overview-grid"');
    expect(workDetailSource).toContain('この実績について');
    expect(workDetailSource).toContain('主な機能');
    expect(workDetailSource).toContain('こんな相談に向いています');
    expect(globalCss).toContain('.case-overview-grid');
  });

  it('実績一覧と詳細に検索エンジン向けの構造化データを追加する', () => {
    expect(worksIndexSource).toContain("'@type': 'ItemList'");
    expect(workDetailSource).toContain("'@type': 'BreadcrumbList'");
  });

  it('建設業界向けの工程・安全帳票ケーススタディを掲載する', () => {
    const construction = works.find((work) => work.slug === 'construction-site-operations');
    expect(construction).toBeTruthy();
    expect(construction?.category).toContain('建設');
    expect(construction?.title).toContain('工程');
    expect(construction?.title).toContain('安全帳票');
    expect(construction?.features.length).toBeGreaterThanOrEqual(6);
    expect(construction?.technologies).toContain('Google Apps Script');
  });
});

describe('GAS問い合わせ受信', () => {
  it('GAS受信コードとセットアップ手順を配置する', () => {
    expect(existsSync(gasReceiverUrl)).toBe(true);
    expect(existsSync(gasReceiverReadmeUrl)).toBe(true);
  });

  it('GAS受信側が本文シークレットをScript Propertiesと照合する', () => {
    expect(gasReceiverSource).toContain("getProperty('CONTACT_SHARED_SECRET')");
    expect(gasReceiverSource).toContain('payload._secret');
  });

  it('標準ではメールだけ通知し、シート保存は設定で任意に有効化できる', () => {
    expect(gasReceiverSource).toContain("getProperty('CONTACT_NOTIFY_EMAIL')");
    expect(gasReceiverSource).toContain("getProperty('CONTACT_SAVE_TO_SHEET')");
    expect(gasReceiverSource).toContain("getProperty('CONTACT_SPREADSHEET_ID')");
    expect(gasReceiverSource).toContain('if (config.saveToSheet)');
    expect(gasReceiverSource).toContain('appendRow');
    expect(gasReceiverSource).toContain('MailApp.sendEmail');
    expect(gasReceiverSource).toContain('replyTo');
  });

  it('GASセットアップ手順でメール通知だけならスプレッドシート不要と明記する', () => {
    expect(gasReceiverReadme).toContain('CONTACT_SHARED_SECRET');
    expect(gasReceiverReadme).toContain('CONTACT_NOTIFY_EMAIL');
    expect(gasReceiverReadme).toContain('CONTACT_SAVE_TO_SHEET');
    expect(gasReceiverReadme).toContain('スプレッドシートは不要');
    expect(gasReceiverReadme).toContain('Webアプリ');
  });
});
