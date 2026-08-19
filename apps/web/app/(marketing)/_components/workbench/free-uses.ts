/**
 * The free allowance, and an honest note about what it is worth.
 *
 * This is browser storage. A private window, cleared site data, or a second
 * device all reset it, and anyone who wants to get around it will. That is true
 * of every tool in this category and it is fine here, because the exposure is
 * tiny: layers A and provenance call no model at all, and a rewrite costs about
 * 0.06 cents per thousand words. Five gamed resets cost pennies.
 *
 * The real gate is an account, and after that credits. 06 row 37. This exists so
 * the shape of the product is right and the paywall is real, not so it is
 * airtight.
 */
const KEY = 'uc.free-sanitises.v1';

export const FREE_SANITISES = 3;

export function usedCount(): number {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(KEY);
  const value = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function remaining(): number {
  return Math.max(0, FREE_SANITISES - usedCount());
}

export function recordUse(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, String(usedCount() + 1));
}
