export interface ContactInput {
  name?: string;
  email: string;
  category?: string;
  problem: string;
  request?: string;
  budget?: string;
  timing?: string;
  consent: boolean;
  turnstileToken: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: Record<string, string>;
}

const limits: Record<string, number> = {
  name: 100,
  email: 254,
  category: 100,
  problem: 3000,
  request: 3000,
  budget: 100,
  timing: 100,
  turnstileToken: 2048,
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContactInput(input: ContactInput): ValidationResult {
  const errors: Record<string, string> = {};
  const email = input.email?.trim() ?? '';
  const problem = input.problem?.trim() ?? '';
  const turnstileToken = input.turnstileToken?.trim() ?? '';

  if (!email) errors.email = 'メールアドレスを入力してください。';
  else if (email.length > limits.email || !emailPattern.test(email)) errors.email = 'メールアドレスの形式を確認してください。';

  if (!problem) errors.problem = '現在困っていることを入力してください。';
  else if (problem.length > limits.problem) errors.problem = `${limits.problem}文字以内で入力してください。`;

  if (!input.consent) errors.consent = '個人情報の取扱いへの同意が必要です。';
  if (!turnstileToken) errors.turnstileToken = 'Bot確認を完了してください。';
  else if (turnstileToken.length > limits.turnstileToken) errors.turnstileToken = 'Bot確認の値が不正です。';

  for (const field of ['name', 'category', 'request', 'budget', 'timing'] as const) {
    const value = input[field]?.trim();
    if (value && value.length > limits[field]) errors[field] = `${limits[field]}文字以内で入力してください。`;
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

export function normalizeContactInput(input: ContactInput): ContactInput {
  return {
    name: input.name?.trim() || undefined,
    email: input.email.trim(),
    category: input.category?.trim() || undefined,
    problem: input.problem.trim(),
    request: input.request?.trim() || undefined,
    budget: input.budget?.trim() || undefined,
    timing: input.timing?.trim() || undefined,
    consent: input.consent,
    turnstileToken: input.turnstileToken.trim(),
  };
}
