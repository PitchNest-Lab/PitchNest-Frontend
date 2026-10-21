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
  "Europe/London": "GBP",
};
const REGION_CURRENCY: Record<string, string> = {
  NG: "NGN",
  KE: "KES",
  GH: "GHS",
  ZA: "ZAR",
  GB: "GBP",
  UG: "UGX",
  RW: "RWF",
  TZ: "TZS",
  MW: "MWK",
  EG: "EGP",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  BE: "EUR",
  PT: "EUR",
  IE: "EUR",
  AT: "EUR",
  FI: "EUR",
  GR: "EUR",
};
const CODE = /^[A-Z]{3}$/;

function guessFromLocale(): string | null {
  try {
    const region = new Intl.Locale(navigator.language || "").region;
    return region ? REGION_CURRENCY[region] ?? null : null;
  } catch {
    return null;
  }
}

function guessFromTimeZone(): string {
  try {
    return ZONE_CURRENCY[Intl.DateTimeFormat().resolvedOptions().timeZone] ?? guessFromLocale() ?? "USD";
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
