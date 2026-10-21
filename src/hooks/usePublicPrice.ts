import { useEffect, useState } from "react";
import { usePreferredCurrency } from "../lib/currency";

/**
 * Public Pro price, for surfaces that render while logged out (landing page,
 * /pricing).
 *
 * Deliberately separate from BillingContext: that context is about the CURRENT
 * USER's plan and lives inside the authenticated providers. Pricing pages need
 * the number without a session, so this hits the unauthenticated
 * /api/billing/price endpoint and holds nothing user-specific.
 *
 * Prices come in the visitor's preferred currency when the server offers it,
 * and in dollars otherwise; every amount carries the currency it is in.
 *
 * Falls back to nulls on failure — the pricing UI renders a neutral "See
 * pricing" rather than inventing an amount that might not match checkout.
 */
export interface CatalogItem {
  plan: "prep" | "pro";
  term: "monthly" | "annual";
  amount: number;
  currency: string;
  days: number;
  /** Server-side checkout allow-list; displaying a price does not imply sale. */
  purchasable: boolean;
  billingModes: Array<"auto_renew" | "manual">;
  /** On a converted price only: the dollar price it was converted from. */
  baseAmount?: number;
  baseCurrency?: string;
}

export interface PublicPrice {
  amount: number | null;
  currency: string | null;
  days: number | null;
  /** Every configured (plan, term) SKU; each carries its checkout availability. */
  catalog: CatalogItem[];
  /** Currencies the server can price in right now, dollars first. */
  currencies: string[];
  billingEnabled: boolean;
  /** Free months a first subscription gets; 0 when there is no offer. */
  freeMonths: number;
  loaded: boolean;
}

const EMPTY: PublicPrice = {
  amount: null,
  currency: null,
  days: null,
  catalog: [],
  currencies: [],
  billingEnabled: false,
  freeMonths: 0,
  loaded: false,
};

/** The server's currency list, keeping only well-formed codes. */
export function readCurrencies(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((code): code is string => typeof code === "string" && /^[A-Z]{3}$/.test(code)) : [];
}

export function readBillingModes(raw: unknown): Array<"auto_renew" | "manual"> {
  if (!Array.isArray(raw)) return ["auto_renew"];
  const modes = raw.filter((mode): mode is "auto_renew" | "manual" => mode === "auto_renew" || mode === "manual");
  return modes.length > 0 ? [...new Set(modes)] : ["auto_renew"];
}

export function usePublicPrice(): PublicPrice {
  const [state, setState] = useState<PublicPrice>(EMPTY);
  const preferred = usePreferredCurrency();

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/billing/price?currency=${encodeURIComponent(preferred)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (cancelled) return;
        setState({
          amount: body?.price?.amount ?? null,
          currency: body?.price?.currency ?? null,
          days: body?.price?.days ?? null,
          catalog: Array.isArray(body?.catalog)
            ? body.catalog.map((item: any) => ({
                ...item,
                purchasable: item?.purchasable === true,
                billingModes: readBillingModes(item?.billingModes),
              }))
            : [],
          currencies: readCurrencies(body?.currencies),
          billingEnabled: !!body?.billingEnabled,
          freeMonths: Number.isInteger(body?.offer?.freeMonths) && body.offer.freeMonths > 0 ? body.offer.freeMonths : 0,
          loaded: true,
        });
      })
      .catch(() => {
        if (!cancelled) setState({ ...EMPTY, loaded: true });
      });

    return () => {
      cancelled = true;
    };
  }, [preferred]);

  return state;
}
