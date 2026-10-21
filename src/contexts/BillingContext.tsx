import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "../contexts/AuthContext";
import { readBillingModes, readCurrencies } from "../hooks/usePublicPrice";
import { usePreferredCurrency } from "../lib/currency";

/**
 * Loads what the current account is entitled to and wires the "Upgrade" action
 * to a real checkout.
 *
 * Upgrade is deliberately a single function on one context rather than an
 * inline fetch in each paywall surface. Several places raise it (Pre-Pitch
 * Setup, the report page, Settings), and they all need the same behaviour:
 * ask the server to start a checkout for a chosen SKU, redirect to Flutterwave's
 * hosted page, and surface a failure without dumping the user at a dead end.
 *
 * Prices are loaded in the visitor's preferred currency (lib/currency), and a
 * checkout pays in the currency of the price the buyer was shown.
 */

export type PaidPlan = "prep" | "pro";
export type BillingTerm = "monthly" | "annual";
export type BillingMode = "auto_renew" | "manual";

/** One purchasable SKU, priced server-side. */
export interface CatalogItem {
  plan: PaidPlan;
  term: BillingTerm;
  amount: number;
  currency: string;
  days: number;
  /** True only when the server will currently accept checkout for this SKU. */
  purchasable: boolean;
  billingModes: BillingMode[];
  /** On a converted price only: the dollar price it was converted from. */
  baseAmount?: number;
  baseCurrency?: string;
}

/** The auto-renewing subscription behind a paid plan. */
export interface SubscriptionInfo {
  plan: PaidPlan;
  term: BillingTerm;
  amount: number;
  currency: string;
  status: "active" | "cancelled";
  billingMode: BillingMode;
  lastPaymentStatus: "pending" | "successful" | "failed" | null;
  renewalFailureCount: number;
  /** True while Flutterwave will keep charging. */
  autoRenew: boolean;
  nextChargeAt: string | null;
  cancelledAt: string | null;
}

/** Free months added to a first subscription, and whether this user gets them. */
export interface OfferInfo {
  freeMonths: number;
  eligible: boolean;
}

interface BillingInfo {
  /** What the server says we have right now. */
  plan: "free" | "prep" | "pro";
  /** ISO timestamp when the paid period ends, or null if it never expires. */
  expiresAt: string | null;
  /** The free signup trial (full Pro access, no card). */
  isTrial: boolean;
  trialDaysRemaining: number;
  /** Whether a real checkout is even possible (FLW keys configured). */
  billingEnabled: boolean;
  /** Headline price (Pro monthly), for single-number surfaces. */
  price: {
    amount: number;
    currency: string;
    days: number;
  } | null;
  /** Every configured SKU (plan × term), including checkout availability. */
  catalog: CatalogItem[];
  /** Currencies the server can price in right now, dollars first. */
  currencies: string[];
  /** The active subscription, else the most recent one; null if none ever. */
  subscription: SubscriptionInfo | null;
  offer: OfferInfo;
}

const DEFAULT_INFO: BillingInfo = {
  plan: "free",
  expiresAt: null,
  isTrial: false,
  trialDaysRemaining: 0,
  billingEnabled: false,
  price: null,
  catalog: [],
  currencies: [],
  subscription: null,
  offer: { freeMonths: 0, eligible: false },
};

function readOffer(raw: any): OfferInfo {
  const freeMonths = Number(raw?.freeMonths);
  return {
    freeMonths: Number.isInteger(freeMonths) && freeMonths > 0 ? freeMonths : 0,
    eligible: raw?.eligible === true,
  };
}

interface BillingContextValue {
  info: BillingInfo;
  /** True once the plan endpoint has answered (so we never flash "free"). */
  loaded: boolean;
  /**
   * Starts a purchase. Defaults to the headline Pro monthly in dollars; pass a
   * selection to buy a different SKU, and the currency of the price the buyer
   * was shown. Returns false if it couldn't, having already told the user why.
   * When true the caller should expect a redirect.
   */
  upgrade: (selection?: { plan?: PaidPlan; term?: BillingTerm; currency?: string; billingMode?: BillingMode }) => Promise<boolean>;
  /** Turns off auto-renew. Paid time already bought is kept. */
  cancelSubscription: () => Promise<{ ok: boolean; message?: string }>;
  refresh: () => Promise<void>;
}

const BillingContext = createContext<BillingContextValue>({
  info: DEFAULT_INFO,
  loaded: false,
  upgrade: async () => false,
  cancelSubscription: async () => ({ ok: false }),
  refresh: async () => {},
});

export function useBilling() {
  return useContext(BillingContext);
}

export const BillingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, authFetch } = useAuth();
  const preferredCurrency = usePreferredCurrency();
  const [info, setInfo] = useState<BillingInfo>(DEFAULT_INFO);
  const [loaded, setLoaded] = useState(false);
  // The account `info` was loaded for. The signed-out defaults (billing off,
  // no prices) must never stand in for a signed-in account's plan while it loads.
  const loadedFor = useRef<unknown>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await authFetch(`/api/billing/plan?currency=${encodeURIComponent(preferredCurrency)}`);
      if (!res.ok) {
        console.warn("billing/plan failed with", res.status);
        setInfo(DEFAULT_INFO);
        return;
      }
      const body = await res.json();
      setInfo({
        plan: body.plan ?? "free",
        expiresAt: body.expiresAt ?? null,
        isTrial: body.isTrial === true,
        trialDaysRemaining: Number(body.trialDaysRemaining) || 0,
        billingEnabled: !!body.billingEnabled,
        price: body.price ?? null,
        catalog: Array.isArray(body.catalog)
          ? body.catalog.map((item: any) => ({
              ...item,
              purchasable: item?.purchasable === true,
              billingModes: readBillingModes(item?.billingModes),
            }))
          : [],
        currencies: readCurrencies(body.currencies),
        subscription:
          body.subscription && typeof body.subscription === "object"
            ? {
                ...body.subscription,
                status: body.subscription.status === "cancelled" ? "cancelled" : "active",
                billingMode: body.subscription.billingMode === "manual" ? "manual" : "auto_renew",
                lastPaymentStatus:
                  body.subscription.lastPaymentStatus === "failed" || body.subscription.lastPaymentStatus === "pending"
                    ? body.subscription.lastPaymentStatus
                    : body.subscription.lastPaymentStatus === "successful" ? "successful" : null,
                renewalFailureCount: Number(body.subscription.renewalFailureCount) || 0,
              }
            : null,
        offer: readOffer(body.offer),
      });
    } catch (err) {
      console.warn("billing/plan threw:", err);
      setInfo(DEFAULT_INFO);
    } finally {
      setLoaded(true);
    }
  }, [authFetch, preferredCurrency]);

  // Keep the context in step with /me: the plan changes after checkout, on
  // expiry, and when an admin comps or revokes access. Skipped while logged
  // out — /api/billing/plan is an authenticated route, so an anonymous refresh
  // could only ever 401 (and did, on every landing-page load). A change of
  // preferred currency makes a new `refresh`, which re-prices the plan.
  useEffect(() => {
    if (!user?.id) {
      loadedFor.current = null;
      setInfo(DEFAULT_INFO);
      setLoaded(true);
      return;
    }
    if (loadedFor.current !== user.id) {
      // A sign-in (or a restored session): not loaded until this account's
      // plan answers. Later refreshes keep showing the plan they replace.
      loadedFor.current = user.id;
      setLoaded(false);
    }
    refresh();
  }, [user?.id, user?.plan, refresh]);

  const upgrade = useCallback(
    async (selection?: { plan?: PaidPlan; term?: BillingTerm; currency?: string; billingMode?: BillingMode }): Promise<boolean> => {
      try {
        // Only send keys the caller set; the server defaults the rest to the
        // headline Pro monthly in dollars. The amount is NEVER sent — the server
        // prices the SKU itself, in the currency named here.
        const payload: Record<string, string> = {};
        if (selection?.plan) payload.plan = selection.plan;
        if (selection?.term) payload.term = selection.term;
        if (selection?.currency) payload.currency = selection.currency;
        if (selection?.billingMode) payload.billingMode = selection.billingMode;
        const hasBody = Object.keys(payload).length > 0;

        const res = await authFetch("/api/billing/checkout", {
          method: "POST",
          headers: hasBody ? { "Content-Type": "application/json" } : undefined,
          body: hasBody ? JSON.stringify(payload) : undefined,
        });
        const body = await res.json().catch(() => ({}));

        if (!res.ok) {
          console.error("checkout failed:", res.status, body);
          window.alert(
            body?.message ||
              "Couldn't start checkout right now. Please try again in a moment.",
          );
          return false;
        }

        let paymentUrl: URL;
        try {
          paymentUrl = new URL(String(body?.paymentLink || ""));
        } catch {
          console.error("checkout returned an invalid paymentLink");
          window.alert("Couldn't start checkout. Please try again in a moment.");
          return false;
        }
        // The live site only ever leaves for Flutterwave's live checkout. Local
        // and DEV builds use Flutterwave's test mode, whose page is hosted
        // elsewhere, so there any https link from our own API is accepted.
        const liveSite = /(^|\.)pitchnest\.app$/.test(window.location.hostname);
        if (
          paymentUrl.protocol !== "https:" ||
          (liveSite && paymentUrl.hostname !== "checkout.flutterwave.com") ||
          paymentUrl.username ||
          paymentUrl.password
        ) {
          console.error("checkout returned an untrusted paymentLink origin");
          window.alert("Couldn't start checkout. Please try again in a moment.");
          return false;
        }

        // Deliberately NO optimistic upgrade: nothing is paid yet. Pro/Prep is
        // granted only after the server verifies the payment with Flutterwave
        // (on return, or by the webhook).
        window.location.assign(paymentUrl.toString());
        return true;
      } catch (err) {
        console.error("upgrade threw:", err);
        window.alert("Couldn't start checkout. Please try again in a moment.");
        return false;
      }
    },
    [authFetch],
  );

  const cancelSubscription = useCallback(async () => {
    try {
      const res = await authFetch("/api/billing/subscription/cancel", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, message: body?.error || "Couldn't cancel right now. Please try again." };
      await refresh();
      return { ok: true };
    } catch {
      return { ok: false, message: "Couldn't cancel right now. Please try again." };
    }
  }, [authFetch, refresh]);

  const value = useMemo(
    () => ({ info, loaded, upgrade, cancelSubscription, refresh }),
    [info, loaded, upgrade, cancelSubscription, refresh],
  );

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
};
