import { describe, expect, it } from 'vitest';
import { validateContactInput } from '../src/utils/contact';

describe('validateContactInput', () => {
  it('メールアドレスと相談内容を必須にする', () => {
    const result = validateContactInput({ email: '', problem: '', consent: false, turnstileToken: '' });
    expect(result.ok).toBe(false);
    expect(result.errors.email).toBeTruthy();
    expect(result.errors.problem).toBeTruthy();
  });

  it('不正なメール形式を拒否する', () => {
    const result = validateContactInput({ email: 'not-an-email', problem: '相談内容です', consent: true, turnstileToken: 'token' });
    expect(result.ok).toBe(false);
    expect(result.errors.email).toBeTruthy();
  });

  it('個人情報取扱いへの同意を必須にする', () => {
    const result = validateContactInput({ email: 'test@example.com', problem: '相談内容です', consent: false, turnstileToken: 'token' });
    expect(result.ok).toBe(false);
    expect(result.errors.consent).toBeTruthy();
  });

  it('正常な入力を受け付ける', () => {
    const result = validateContactInput({ email: 'test@example.com', problem: '既存のExcel業務を自動化したいです。', consent: true, turnstileToken: 'token' });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual({});
  });
});
