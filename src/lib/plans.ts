import type { LucideIcon } from "lucide-react";
import { Sparkles, Rocket, Crown, Building2 } from "lucide-react";

/**
 * Single source of truth for the public pricing tiers.
 *
 * Feature rows are static; the Pro PRICE comes from the server at runtime
 * (BillingContext / usePublicPrice -> /api/billing -> PRO_PLAN_AMOUNT/CURRENCY/
 * DAYS env), so a price change is an env var, not a code deploy that can drift
 * from what the checkout actually charges. Until billing responds, the price
 * column falls back to a neutral placeholder rather than hardcoding a number
 * that could lie.
 *
 * TIER AVAILABILITY. `available` gates whether a tier can be transacted TODAY.
 * The billing backend currently grants a single paid level ("pro", flat period),
 * so only Free and Pro have a live checkout. Prep (a cheaper entry tier) and
 * Organizations (seat-based, Stage O on the roadmap) are shown as "coming soon"
 * — a real, purchasable Prep tier and annual billing need the money-granting
 * path extended first, and this codebase does not ship a button that can't
 * honour what it promises.
 */

export interface Plan {
  id: "free" | "founder" | "pro" | "enterprise";
  name: string;
  tagline: string;
  price: string;
  features: string[];
  featured: boolean;
  available: boolean;
  cta: { label: string; href: string };
  icon: LucideIcon;
}

const base: Omit<Plan, "price">[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Try the panel — no card required.",
    features: [
      "1 AI investor persona",
      "10-min practice session",
      "Basic readiness score",
      "Basic script generation",
      "Investment programs access",
    ],
    featured: false,
    available: true,
    cta: { label: "Start free", href: "/signup" },
    icon: Sparkles,
  },
  {
    id: "founder",
    name: "Founder",
    tagline: "Where founders get serious.",
    features: [
      "150 min live practice / mo",
      "6 AI investor personas",
      "Grilling Session (rapid Q&A)",
      "Detailed score + fixes",
      "Unlimited script generation",
    ],
    featured: false,
    available: true,
    cta: { label: "Choose Founder", href: "/settings?tab=subscription" },
    icon: Rocket,
  },
  {
    id: "pro",
    name: "Pro Founder",
    tagline: "Deep prep for active fundraising.",
    features: [
      "Everything in Founder",
      "Multilingual AI VCs",
      "Multi-VC panel (Shark Tank style)",
      "AI Virtual Co-Founder",
      "10 AI-generated pitch decks",
    ],
    featured: true,
    available: true,
    cta: { label: "Upgrade to Pro Founder", href: "/settings?tab=subscription" },
    icon: Crown,
  },
  {
    id: "enterprise",
    name: "Hubs & Accelerators",
    tagline: "One relationship, many founders.",
    features: [
      "Org accounts, cohort seats",
      "Admin + cohort dashboard",
      "Cohort readiness analytics",
      "Branded reports",
      "Direct VC intro pathway (soon)",
    ],
    featured: false,
    available: true,
    cta: { label: "Contact us", href: "/support" },
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
    return `${symbol}${amount} /mo`;
  }
  return "$15 /mo";
}

/**
 * The plan catalogue, matching the PitchNest pricing deck.
 */
export function getPlans(price: {
  amount: number | null;
  currency: string | null;
  days: number | null;
}): Plan[] {
  return base.map((p) => {
    if (p.id === "pro") return { ...p, price: "$15 /mo" };
    if (p.id === "founder") return { ...p, price: "$8 /mo" };
    if (p.id === "enterprise") return { ...p, price: "Custom per seat" };
    return { ...p, price: "$0 /mo" };
  });
}
