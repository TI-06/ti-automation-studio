import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateContactInput } from '../src/utils/contact';

const contactApiSource = readFileSync(new URL('../src/pages/api/contact.ts', import.meta.url), 'utf-8');
const contactPageSource = readFileSync(new URL('../src/pages/contact.astro', import.meta.url), 'utf-8');

describe('validateContactInput', () => {
  it('メールアドレスと相談内容を必須にする', () => {
    const result = validateContactInput({ email: '', problem: '', consent: false, website: '' });
    expect(result.ok).toBe(false);
    expect(result.errors.email).toBeTruthy();
    expect(result.errors.problem).toBeTruthy();
  });

  it('不正なメール形式を拒否する', () => {
    const result = validateContactInput({ email: 'not-an-email', problem: '相談内容です', consent: true, website: '' });
    expect(result.ok).toBe(false);
    expect(result.errors.email).toBeTruthy();
  });

  it('個人情報取扱いへの同意を必須にする', () => {
    const result = validateContactInput({ email: 'test@example.com', problem: '相談内容です', consent: false, website: '' });
    expect(result.ok).toBe(false);
    expect(result.errors.consent).toBeTruthy();
  });

  it('正常な入力を受け付ける', () => {
    const result = validateContactInput({ email: 'test@example.com', problem: '既存のExcel業務を自動化したいです。', consent: true, website: '' });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('honeypotに値が入っている送信を拒否する', () => {
    const result = validateContactInput({
      email: 'bot@example.com',
      problem: 'spam',
      consent: true,
      website: 'https://spam.example.com',
    });
    expect(result.ok).toBe(false);
    expect(result.errors.website).toBeTruthy();
  });
});

describe('問い合わせAPIのGAS転送', () => {
  it('GAS共有シークレットをHTTPヘッダーではなくJSON本文に含める', () => {
    expect(contactApiSource).toContain('_secret: sharedSecret');
    expect(contactApiSource).not.toContain("'x-portfolio-secret'");
  });

  it('GASのJSON結果が失敗なら送信成功にしない', () => {
    expect(contactApiSource).toContain('gasResult.ok');
  });

  it('Turnstile APIやSecretに依存しない', () => {
    expect(contactApiSource).not.toContain('TURNSTILE_SECRET_KEY');
    expect(contactApiSource).not.toContain('challenges.cloudflare.com/turnstile');
    expect(contactPageSource).not.toContain('cf-turnstile');
    expect(contactPageSource).not.toContain('TURNSTILE_SITE_KEY');
  });

  it('フォームにhoneypotを持たせる', () => {
    expect(contactPageSource).toContain('name="website"');
    expect(contactPageSource).toContain('aria-hidden="true"');
  });
});
