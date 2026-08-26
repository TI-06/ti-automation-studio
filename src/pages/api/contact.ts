import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { normalizeContactInput, validateContactInput, type ContactInput } from '../../utils/contact';

export const prerender = false;

type RuntimeEnv = {
  TURNSTILE_SECRET_KEY?: string;
  CONTACT_GAS_URL?: string;
  CONTACT_SHARED_SECRET?: string;
};

type TurnstileResponse = {
  success: boolean;
  'error-codes'?: string[];
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let input: ContactInput;
  try {
    input = (await request.json()) as ContactInput;
  } catch {
    return json({ ok: false, message: '送信内容を確認してください。' }, 400);
  }

  const validation = validateContactInput(input);
  if (!validation.ok) return json({ ok: false, message: '入力内容を確認してください。', errors: validation.errors }, 400);

  const runtimeEnv = env as unknown as RuntimeEnv;
  const secret = runtimeEnv.TURNSTILE_SECRET_KEY;
  const gasUrl = runtimeEnv.CONTACT_GAS_URL;
  const sharedSecret = runtimeEnv.CONTACT_SHARED_SECRET;

  if (!secret || !gasUrl || !sharedSecret) {
    console.error('Contact environment variables are not configured.');
    return json({ ok: false, message: '問い合わせ機能は現在設定中です。時間をおいてお試しください。' }, 503);
  }

  const remoteip = request.headers.get('CF-Connecting-IP') ?? undefined;
  const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ secret, response: input.turnstileToken, remoteip }),
  });

  if (!verifyResponse.ok) return json({ ok: false, message: 'Bot確認に失敗しました。もう一度お試しください。' }, 502);

  const turnstile = (await verifyResponse.json()) as TurnstileResponse;
  if (!turnstile.success) {
    console.warn('Turnstile validation failed', turnstile['error-codes']);
    return json({ ok: false, message: 'Bot確認を完了してから送信してください。' }, 400);
  }

  const normalized = normalizeContactInput(input);
  const payload = {
    source: 'ti-automation-studio',
    receivedAt: new Date().toISOString(),
    name: normalized.name ?? '',
    email: normalized.email,
    category: normalized.category ?? '',
    problem: normalized.problem,
    request: normalized.request ?? '',
    budget: normalized.budget ?? '',
    timing: normalized.timing ?? '',
  };

  const gasResponse = await fetch(gasUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-portfolio-secret': sharedSecret,
    },
    body: JSON.stringify(payload),
  });

  if (!gasResponse.ok) {
    console.error('Contact forwarding failed', gasResponse.status);
    return json({ ok: false, message: '送信に失敗しました。時間をおいてもう一度お試しください。' }, 502);
  }

  return json({ ok: true, message: 'お問い合わせを受け付けました。' });
};
