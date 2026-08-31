import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "../contexts/AuthContext";

/**
 * Loads what the current account is entitled to and wires the "Upgrade" action
 * to a real checkout.
 *
 * Upgrade is deliberately a single function on one context rather than an
 * inline fetch in each paywall surface. Several places raise it (Pre-Pitch
 * Setup, the report page, Settings), and they all need the same behaviour:
 * ask the server to start a checkout for a chosen SKU, redirect to Flutterwave's
 * hosted page, and surface a failure without dumping the user at a dead end.
 */

export type PaidPlan = "prep" | "pro";
export type BillingTerm = "monthly" | "annual";

/** One purchasable SKU, priced server-side. */
export interface CatalogItem {
  plan: PaidPlan;
  term: BillingTerm;
  amount: number;
  currency: string;
  days: number;
}

interface BillingInfo {
  /** What the server says we have right now. */
  plan: "free" | "prep" | "pro";
  /** ISO timestamp when the paid period ends, or null if it never expires. */
  expiresAt: string | null;
  /** Whether a real checkout is even possible (FLW keys configured). */
  billingEnabled: boolean;
  /** Headline price (Pro monthly), for single-number surfaces. */
  price: {
    amount: number;
    currency: string;
    days: number;
  } | null;
  /** Every purchasable SKU (plan × term), for the pricing selector. */
  catalog: CatalogItem[];
}

const DEFAULT_INFO: BillingInfo = {
  plan: "free",
  expiresAt: null,
  billingEnabled: false,
  price: null,
  catalog: [],
};

interface BillingContextValue {
  info: BillingInfo;
  /** True once the plan endpoint has answered (so we never flash "free"). */
  loaded: boolean;
  /**
   * Starts a purchase. Defaults to the headline Pro monthly; pass a selection to
   * buy a different SKU. Returns false if it couldn't, having already told the
   * user why. When true the caller should expect a redirect.
   */
  upgrade: (selection?: { plan?: PaidPlan; term?: BillingTerm }) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const BillingContext = createContext<BillingContextValue>({
  info: DEFAULT_INFO,
  loaded: false,
  upgrade: async () => false,
  refresh: async () => {},
});

export function useBilling() {
  return useContext(BillingContext);
}

export const BillingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, authFetch } = useAuth();
  const [info, setInfo] = useState<BillingInfo>(DEFAULT_INFO);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await authFetch("/api/billing/plan");
      if (!res.ok) {
        console.warn("billing/plan failed with", res.status);
        setInfo(DEFAULT_INFO);
        return;
      }
      const body = await res.json();
      setInfo({
        plan: body.plan ?? "free",
        expiresAt: body.expiresAt ?? null,
        billingEnabled: !!body.billingEnabled,
        price: body.price ?? null,
        catalog: Array.isArray(body.catalog) ? body.catalog : [],
      });
    } catch (err) {
      console.warn("billing/plan threw:", err);
      setInfo(DEFAULT_INFO);
    } finally {
      setLoaded(true);
    }
  }, [authFetch]);

  // Keep the context in step with /me: the plan changes after checkout, on
  // expiry, and when an admin comps or revokes access. Skipped while logged
  // out — /api/billing/plan is an authenticated route, so an anonymous refresh
  // could only ever 401 (and did, on every landing-page load).
  useEffect(() => {
    if (!user?.id) {
      setInfo(DEFAULT_INFO);
      setLoaded(true);
      return;
    }
    refresh();
  }, [user?.id, user?.plan, refresh]);

  const upgrade = useCallback(
    async (selection?: { plan?: PaidPlan; term?: BillingTerm }): Promise<boolean> => {
      try {
        // Only send keys the caller set; the server defaults the rest to the
        // headline Pro monthly. The amount is NEVER sent — the server prices the
        // SKU itself.
        const payload: Record<string, string> = {};
        if (selection?.plan) payload.plan = selection.plan;
        if (selection?.term) payload.term = selection.term;
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

        if (!body?.paymentLink) {
          console.error("checkout returned no paymentLink:", body);
          window.alert("Couldn't start checkout. Please try again in a moment.");
          return false;
        }

        // Deliberately NO optimistic upgrade: nothing is paid yet. Pro/Prep is
        // granted only by the verified webhook, which the return page picks up.
        window.location.href = body.paymentLink;
        return true;
      } catch (err) {
        console.error("upgrade threw:", err);
        window.alert("Couldn't start checkout. Please try again in a moment.");
        return false;
      }
    },
    [authFetch],
  );

  const value = useMemo(
    () => ({ info, loaded, upgrade, refresh }),
    [info, loaded, upgrade, refresh],
  );

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
};
