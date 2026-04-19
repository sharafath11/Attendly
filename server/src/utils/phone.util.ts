/** Normalize to last 10 digits for Indian numbers when possible. */
export function normalizePhoneDigits(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}
