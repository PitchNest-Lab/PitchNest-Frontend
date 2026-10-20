import { useSyncExternalStore } from "react";

/**
 * The currency a visitor wants prices in.
 *
 * It starts as a guess from the device's time zone (Lagos → naira, Nairobi →
 * shillings, Accra → cedis, Johannesburg → rand, anywhere else dollars) and
 * becomes the visitor's own choice once they pick one on the pricing page.
 * This is only a request: the server answers in the currency it actually
 * priced in, and in dollars for any currency it does not offer.
 */

const STORAGE_KEY = "pitchnest.currency";
const ZONE_CURRENCY: Record<string, string> = {
  "Africa/Lagos": "NGN",
  "Africa/Nairobi": "KES",
  "Africa/Accra": "GHS",
  "Africa/Johannesburg": "ZAR",
};
const CODE = /^[A-Z]{3}$/;

function guessFromTimeZone(): string {
  try {
    return ZONE_CURRENCY[Intl.DateTimeFormat().resolvedOptions().timeZone] ?? "USD";
  } catch {
    return "USD";
  }
}

function initialCurrency(): string {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && CODE.test(saved)) return saved;
  } catch {
    // Storage blocked: fall through to the guess.
  }
  return guessFromTimeZone();
}

let current = initialCurrency();
const listeners = new Set<() => void>();

/** Remembers the visitor's choice and re-prices every surface showing a price. */
export function setPreferredCurrency(code: string): void {
  if (!CODE.test(code) || code === current) return;
  current = code;
  try {
    window.localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Kept for this visit only.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The preferred currency; components re-render when the visitor changes it. */
export function usePreferredCurrency(): string {
  return useSyncExternalStore(subscribe, () => current, () => "USD");
}
