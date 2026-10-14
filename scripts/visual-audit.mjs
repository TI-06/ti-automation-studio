import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4321';
const OUTPUT = path.resolve('visual-audit-results');
const WIDTHS = [320, 375, 390, 768, 1024, 1440, 1920];
const PATHS = [
  ['home', '/'],
  ['works', '/works'],
  ['work-detail', '/works/workflow-report-system'],
  ['services', '/services'],
  ['service-detail', '/services/excel-automation/'],
  ['price', '/price'],
  ['about', '/about'],
  ['guide', '/solutions/excel-transfer-automation/'],
  ['guide-vba', '/solutions/vba-repair-outsourcing/'],
  ['guide-pdf', '/solutions/gas-pdf-automation/'],
  ['guide-performance', '/solutions/gas-performance/'],
  ['guide-sheets', '/solutions/spreadsheet-automation/'],
  ['guide-webapp', '/solutions/gas-web-app-development/'],
  ['tools', '/tools'],
  ['excel-diff', '/tools/excel-diff'],
  ['data-cleaner', '/tools/data-cleaner'],
  ['dashboard', '/tools/dashboard-builder'],
  ['diagnosis', '/tools/automation-diagnosis'],
  ['contact', '/contact'],
];
const issues = [];
const report = [];

await fs.mkdir(OUTPUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  for (const width of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width, height: 860 },
      deviceScaleFactor: 1,
      isMobile: width <= 390,
      hasTouch: width <= 390,
    });
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));

    for (const [name, route] of PATHS) {
      runtimeErrors.length = 0;
      let response;
      try {
        response = await page.goto(new URL(route, BASE).toString(), {
          waitUntil: 'domcontentloaded', timeout: 20000,
        });
        await page.waitForTimeout(320);
      } catch (e) {
        issues.push(`${name}@${width}: navigation failed: ${e.message}`);
        continue;
      }
      const status = response?.status() ?? 0;
      const dimensions = await page.evaluate(() => {
        const doc = document.documentElement;
        const offenders = [...document.querySelectorAll('body *')]
          .filter(el => {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) return false;
            const style = window.getComputedStyle(el);
            if (style.visibility === 'hidden' || style.display === 'none' || style.position === 'fixed') return false;
            // Horizontally scrollable tables are expected, but whole-page overflow is not.
            let parent = el.parentElement;
            while (parent) {
              if (/(auto|scroll|hidden|clip)/.test(window.getComputedStyle(parent).overflowX)) return false;
              parent = parent.parentElement;
            }
            return r.right > window.innerWidth + 3 || r.left < -3;
          })
          .slice(0, 8)
          .map(el => ({
            tag: el.tagName.toLowerCase(),
            cls: typeof el.className === 'string' ? el.className.slice(0,70) : '',
            right: Math.round(el.getBoundingClientRect().right),
          }));
        return {
          viewport: window.innerWidth,
          documentWidth: doc.scrollWidth,
          overflow: Math.round(doc.scrollWidth - window.innerWidth),
          offenders,
        };
      });
      if (status !== 200) issues.push(`${name}@${width}: HTTP ${status}`);
      if (dimensions.overflow > 3) issues.push(`${name}@${width}: document overflow ${dimensions.overflow}px; ${JSON.stringify(dimensions.offenders)}`);

      if (name === 'home') {
        try {
          const phases = await page.locator('.process-phase-card').count();
          const steps = await page.locator('.process-phase-steps li').count();
          if (phases !== 3 || steps !== 6) issues.push(`home@${width}: process phases ${phases}, steps ${steps}`);
          const clipped = await page.locator('.process-phase-card').evaluateAll(cards =>
            cards.some(card => {
              const r = card.getBoundingClientRect();
              return r.width < 240 || r.right > window.innerWidth + 3;
            })
          );
          if (clipped) issues.push(`home@${width}: process card outside readable width`);
        } catch(e) { issues.push(`home@${width}: process layout ${e.message}`); }
      }
      if (name === 'services') {
        const count = await page.locator('.service-index-card').count();
        if (count !== 5) issues.push(`services@${width}: expected 5 services, got ${count}`);
      }
      if (name === 'about') {
        const cardCount = await page.locator('.about-capability').count();
        if (cardCount !== 6) issues.push(`about@${width}: expected 6 capabilities, got ${cardCount}`);
      }
      if (name.startsWith('guide')) {
        try {
          const toc = page.locator('.solution-toc');
          if (!(await toc.isVisible())) issues.push(`${name}@${width}: guide table of contents not visible`);
          const sections = await page.locator('.solution-practical-section').count();
          if (sections !== 2) issues.push(`${name}@${width}: expected 2 practical sections, got ${sections}`);
          const practicalLinks = await toc.locator('a[href^="#guide-practical-"]').count();
          if (practicalLinks !== 2) issues.push(`${name}@${width}: expected 2 deep links, got ${practicalLinks}`);
          if (width <= 390) {
            const hiddenHeader = await page.locator('.solution-practical-example thead').first().evaluate(el => {
              return window.getComputedStyle(el).position === 'absolute';
            }).catch(() => null);
            if (hiddenHeader === false) issues.push(`${name}@${width}: mobile example should be stacked`);
          }
        } catch (e) { issues.push(`${name}@${width}: guide readability ${e.message}`); }
      }
      if (width <= 768) {
        try {
          const menu = page.locator('[data-mobile-menu]');
          await menu.locator('summary').click();
          if (!(await menu.evaluate(el => el.open))) issues.push(`${name}@${width}: menu did not open`);
          await page.keyboard.press('Escape');
          if (await menu.evaluate(el => el.open)) issues.push(`${name}@${width}: Escape did not close menu`);
        } catch(e) {
          issues.push(`${name}@${width}: mobile menu interaction: ${e.message}`);
        }
      }

      if (width <= 768 && (name === 'excel-diff' || name === 'data-cleaner')) {
        const root = page.locator(name === 'excel-diff' ? '[data-excel-diff-app]' : '[data-cleaner-app]');
        try {
          const nav = root.locator('[data-tool-mobile-nav]');
          if (!(await nav.isVisible())) issues.push(`${name}@${width}: tool tabs hidden`);
          for (const target of ['result','detail','setup']) {
            await nav.locator(`[data-mobile-view="${target}"]`).click();
            const active = await root.getAttribute('data-mobile-active');
            if (active !== target) issues.push(`${name}@${width}: expected tab ${target}, got ${active}`);
            if (!(await root.locator(`[data-mobile-panel="${target}"]`).isVisible())) issues.push(`${name}@${width}: ${target} panel invisible`);
          }
        } catch(e) {issues.push(`${name}@${width}: tab interaction: ${e.message}`);}
      }

      if (name === 'works') {
        try {
          const filter = page.locator('[data-work-filter="api"]');
          await filter.click();
          const shown = await page.locator('[data-work-category]:visible').count();
          if (shown !== 1) issues.push(`works@${width}: api filter expected 1 case, got ${shown}`);
          await page.locator('[data-work-filter="all"]').click();
          const all = await page.locator('[data-work-category]:visible').count();
          if (all !== 8) issues.push(`works@${width}: all filter expected 8 cases, got ${all}`);
        } catch(e) {issues.push(`works@${width}: case filtering: ${e.message}`);}
      }

      if (name === 'dashboard' && width <= 768) {
        try {
          const menu = page.locator('[data-dashboard-export-menu]');
          if (await menu.evaluate(el => el.open)) issues.push(`dashboard@${width}: export should start collapsed`);
          await menu.locator('summary').click();
          if (!(await menu.evaluate(el => el.open))) issues.push(`dashboard@${width}: export did not open`);
        } catch(e) {issues.push(`dashboard@${width}: export menu: ${e.message}`);}
      }
      if (runtimeErrors.length) issues.push(`${name}@${width}: JS errors ${runtimeErrors.join(' | ').slice(0,400)}`);

      await page.screenshot({ path: path.join(OUTPUT,`${name}-${width}.png`), animations: 'disabled', fullPage: false });
      report.push({ page: name, width, httpStatus: status, ...dimensions, runtimeErrors: [...runtimeErrors] });
    }
    await context.close();
  }
  await fs.writeFile(path.join(OUTPUT, 'audit-report.json'), JSON.stringify({ report, issues }, null, 2));
  process.stdout.write(`Responsive audit: ${report.length} viewports tested; ${issues.length} issues.\n`);
  for (const issue of issues) process.stdout.write(`ISSUE: ${issue}\n`);
  if (issues.length) process.exitCode = 1;
} finally {
  await browser.close();
}
