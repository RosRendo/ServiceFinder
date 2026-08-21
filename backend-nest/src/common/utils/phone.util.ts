/**
 * Phone number normalization + validation.
 *
 * Every OTP / SMS send costs money (Twilio charges per attempt, even for
 * numbers that fail). Validating BEFORE the provider call is the cheapest
 * rate limit that exists.
 *
 * Rules:
 * - Tolerates spaces, dashes, dots and parentheses.
 * - Local Khmer numbers (0XX XXX XXX) are normalized to E.164 (+855…).
 * - Bare country-code digits (85512345678) are normalized too.
 * - Anything else must already be E.164: + followed by 8–15 digits.
 */

export function normalizePhone(input: string): string | null {
  if (!input || typeof input !== 'string') return null;

  let p = input.trim().replace(/[\s\-().]/g, '');

  // Local Cambodian format: 012345678 -> +85512345678
  if (p.startsWith('0') && p.length >= 9) {
    p = '+855' + p.slice(1);
  }
  // Bare country code: 85512345678 -> +85512345678
  else if (p.startsWith('855') && p.length >= 10) {
    p = '+' + p;
  }
  // Assume digits-only input is already an international number
  else if (/^\d+$/.test(p)) {
    p = '+' + p;
  }

  // E.164: '+' + 1 country code + subscriber number (8-15 digits total)
  if (!/^\+[1-9]\d{7,14}$/.test(p)) {
    return null;
  }
  return p;
}

export function isValidPhone(input: string): boolean {
  return normalizePhone(input) !== null;
}
