import type { LucideIcon } from "lucide-react";
import { Sparkles, Building2 } from "lucide-react";

/**
 * Single source of truth for the three public tiers.
 *
 * Feature rows are static; the Pro PRICE comes from the server at runtime
 * (BillingContext -> /api/billing/plan -> PRO_PLAN_AMOUNT/CURRENCY/DAYS env), so
 * a price change is an env var, not a code deploy that can drift from what the
 * checkout actually charges. Until billing responds, the price column falls back
 * to a neutral placeholder rather than hardcoding a number that could lie.
 */

export interface Plan {
  id: "free" | "pro" | "enterprise";
  name: string;
  tagline: string;
  /** Set by the pricing pages — see withPrice(). */
  price: string;
  /** Static rows common to both the landing summary and the /pricing page. */
  features: string[];
  featured: boolean;
  cta: { label: string; href: string };
  icon: LucideIcon;
}

const base: Omit<Plan, "price">[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Find out if it's for you",
    features: [
      "2 pitch sessions per week",
      "10-minute sessions",
      "Full scorecard on screen",
    ],
    featured: false,
    cta: { label: "Start free", href: "/signup" },
    icon: Sparkles,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For an active raise",
    features: [
      "Unlimited pitch sessions",
      "Longer pitch durations",
      "Full downloadable PDF report",
      "Live market research in your panel",
    ],
    featured: true,
    cta: { label: "Upgrade", href: "/settings?tab=subscription" },
    icon: Sparkles,
  },
  {
    id: "enterprise",
    name: "Enterprise / Organization",
    tagline: "For accelerators and programmes",
    features: [
      "Cohort dashboard and analytics",
      "Team seats and shared branding",
      "Org visibility and reporting",
    ],
    featured: false,
    cta: { label: "Coming soon", href: "#pricing" },
    icon: Building2,
  },
];

/** Renders a price line. Server price wins; fallback for pre-fetch. */
export function formatPrice(
  amount: number | null | undefined,
  currency: string | null | undefined,
  days: number | null | undefined,
): string {
  if (typeof amount === "number" && amount > 0 && currency) {
    const symbol = currency.toUpperCase() === "USD" ? "$" : `${currency} `;
    return `${symbol}${amount} / ${days ?? 30} days`;
  }
  return "See pricing";
}

/**
 * The plan catalogue, with the Pro price injected from the live billing info
 * when it has loaded. Call once in the component and re-run when `price` lands.
 */
export function getPlans(price: {
  amount: number | null;
  currency: string | null;
  days: number | null;
}): Plan[] {
  return base.map((p) => {
    if (p.id === "pro") return { ...p, price: formatPrice(price.amount, price.currency, price.days) };
    if (p.id === "enterprise") return { ...p, price: "Custom" };
    return { ...p, price: "$0" };
  });
}
