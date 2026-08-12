/**
 * M-Pesa utility functions — ported from the standalone Daraja demo.
 * Kept separate from lib/utils.ts (which only has cn()) to avoid mixing concerns.
 */

/** Normalise any Kenyan phone format to 2547XXXXXXXX. */
export function normalizeMsisdn(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return digits;
}

/** Masks a phone number (e.g. 254712345678 → 254712***678) */
export function maskPhone(input: string): string {
  if (input.length < 9) return input; // too short to safely mask
  return input.slice(0, 6) + "***" + input.slice(-3);
}

/** Validate that a string looks like a Kenyan MSISDN. */
export function isValidKenyanPhone(input: string): boolean {
  const normalized = normalizeMsisdn(input);
  return /^254[17]\d{8}$/.test(normalized);
}
