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
 * inline fetch in each paywall surface. Three different places raise it
 * (Pre-Pitch Setup, the report page, Settings), and they all need the same
 * three behaviours: refresh the plan optimistically, redirect to Flutterwave's
 * hosted page, and surface a failure without dumping the user at a dead end.
 */

interface BillingInfo {
  /** What the server says we have right now. */
  plan: "free" | "pro";
  /** ISO timestamp when the paid period ends, or null if it never expires. */
  expiresAt: string | null;
  /** Whether a real checkout is even possible (FLW keys configured). */
  billingEnabled: boolean;
  price: {
    amount: number;
    currency: string;
    days: number;
  } | null;
}

const DEFAULT_INFO: BillingInfo = {
  plan: "free",
  expiresAt: null,
  billingEnabled: false,
  price: null,
};

interface BillingContextValue {
  info: BillingInfo;
  /** True once the plan endpoint has answered (so we never flash "free"). */
  loaded: boolean;
  /**
   * Starts the Pro purchase. Returns false if it couldn't, having already told
   * the user why. When true the caller should redirect to window.location.
   */
  upgrade: () => Promise<boolean>;
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
      });
    } catch (err) {
      console.warn("billing/plan threw:", err);
      setInfo(DEFAULT_INFO);
    } finally {
      setLoaded(true);
    }
  }, [authFetch]);

  // Keep the context in step with /me: the plan changes after checkout, on
  // expiry, and when an admin comps or revokes access.
  useEffect(() => {
    refresh();
  }, [user?.id, user?.plan, refresh]);

  const upgrade = useCallback(async (): Promise<boolean> => {
    try {
      const res = await authFetch("/api/billing/checkout", { method: "POST" });
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

      // Deliberately NO optimistic upgrade here. Nothing has been paid yet —
      // the user is about to be sent to a hosted page they may well abandon.
      // Pro is granted only by the verified webhook, and the return page picks
      // that up. Flipping the UI early would show paid features to someone who
      // never paid and then snatch them back.
      window.location.href = body.paymentLink;
      return true;
    } catch (err) {
      console.error("upgrade threw:", err);
      window.alert("Couldn't start checkout. Please try again in a moment.");
      return false;
    }
  }, [authFetch]);

  const value = useMemo(
    () => ({ info, loaded, upgrade, refresh }),
    [info, loaded, upgrade, refresh],
  );

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
};
