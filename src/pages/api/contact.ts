import type { APIRoute } from 'astro';
import { getSecret } from 'astro:env/server';
import { normalizeContactInput, validateContactInput, type ContactInput } from '../../utils/contact';

export const prerender = false;

type GasResponse = {
  ok?: boolean;
  message?: string;
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

  const origin = request.headers.get('origin');
  if (origin) {
    const requestOrigin = new URL(request.url).origin;
    if (origin !== requestOrigin) {
      console.warn('Rejected contact request from unexpected origin', origin);
      return json({ ok: false, message: '送信内容を確認してください。' }, 403);
    }
  }

  const gasUrl = getSecret('CONTACT_GAS_URL');
  const sharedSecret = getSecret('CONTACT_SHARED_SECRET');

  if (!gasUrl || !sharedSecret) {
    console.error('Contact environment variables are not configured.');
    return json({ ok: false, message: '問い合わせ機能は現在設定中です。時間をおいてお試しください。' }, 503);
  }

  const normalized = normalizeContactInput(input);
  const payload = {
    _secret: sharedSecret,
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

  let gasResponse: Response;
  try {
    gasResponse = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Contact forwarding request failed', error);
    return json({ ok: false, message: '送信に失敗しました。時間をおいてもう一度お試しください。' }, 502);
  }

  let gasResult: GasResponse;
  try {
    gasResult = (await gasResponse.json()) as GasResponse;
  } catch {
    console.error('Contact forwarding returned a non-JSON response', gasResponse.status);
    return json({ ok: false, message: '送信に失敗しました。時間をおいてもう一度お試しください。' }, 502);
  }

  if (!gasResponse.ok || gasResult.ok !== true) {
    console.error('Contact forwarding failed', gasResponse.status, gasResult.message ?? 'unknown error');
    return json({ ok: false, message: '送信に失敗しました。時間をおいてもう一度お試しください。' }, 502);
  }

  return json({ ok: true, message: 'お問い合わせを受け付けました。' });
};
