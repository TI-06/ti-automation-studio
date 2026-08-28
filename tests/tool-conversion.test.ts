import { describe, expect, it } from 'vitest';
import {
  TOOL_CONVERSION_CONFIG,
  parseToolSource,
  toolContactHref,
} from '../src/data/tool-conversion';

describe('公開ツール相談導線設定', () => {
  it('許可した4sourceだけを受け付ける', () => {
    expect(parseToolSource('excel-diff')).toBe('excel-diff');
    expect(parseToolSource('data-cleaner')).toBe('data-cleaner');
    expect(parseToolSource('dashboard-builder')).toBe('dashboard-builder');
    expect(parseToolSource('automation-diagnosis')).toBe('automation-diagnosis');
    expect(parseToolSource('<script>alert(1)</script>')).toBeNull();
    expect(parseToolSource('unknown')).toBeNull();
    expect(parseToolSource(null)).toBeNull();
  });

  it('sourceだけを問い合わせURLへ渡す', () => {
    expect(toolContactHref('excel-diff')).toBe('/contact?source=excel-diff');
    expect(toolContactHref('dashboard-builder')).toBe('/contact?source=dashboard-builder');
  });

  it('4ツールそれぞれに相談文脈と既存サービスURLを持つ', () => {
    expect(TOOL_CONVERSION_CONFIG['excel-diff'].serviceHref).toBe('/services/excel-automation');
    expect(TOOL_CONVERSION_CONFIG['data-cleaner'].serviceHref).toBe('/services/python-data-processing');
    expect(TOOL_CONVERSION_CONFIG['dashboard-builder'].serviceHref).toBe('/services/excel-automation');
    expect(TOOL_CONVERSION_CONFIG['automation-diagnosis'].serviceHref).toBe('/services');
  });
});
