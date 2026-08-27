export function trimOuterWhitespace(value: string): string {
  return value.trim();
}

export function collapseSpaces(value: string): string {
  return value.replace(/[ \t]+/g, ' ');
}

export function normalizeAsciiWidth(value: string): string {
  let result = '';
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code === 0x3000) {
      result += ' ';
    } else if (code >= 0xff01 && code <= 0xff5e) {
      result += String.fromCharCode(code - 0xfee0);
    } else {
      result += char;
    }
  }
  return result;
}

export function normalizePhoneCandidate(value: string): string {
  const normalized = normalizeAsciiWidth(trimOuterWhitespace(value));
  if (!/^[+()\-\s\d]+$/.test(normalized)) return normalized;
  const digits = normalized.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return normalized;
  return digits;
}

export function safeVariantKey(value: string): string {
  const normalized = normalizeAsciiWidth(trimOuterWhitespace(value)).toLowerCase();
  return normalizePhoneCandidate(normalized);
}
