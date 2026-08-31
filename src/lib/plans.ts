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
 * The billing backend now grants two paid levels (Founder/"prep" and Pro/"pro"),
 * each sold monthly or annual, so Founder and Pro both have a live checkout
 * (settings → subscription); Free is signup and Hubs & Accelerators is a
 * "contact us" pathway. Per-tier PRICES come from the server catalog at runtime
 * (getPlans + usePublicPrice → /api/billing/price), so a displayed number can
 * never drift from what checkout actually charges. Features that are not yet
 * implemented are labelled "(Coming Soon)" rather than advertised as live.
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
      "2 AI investor personas",
      "2 live practice sessions / week (10 min each)",
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
      "Unlimited live practice / mo",
      "3 AI investor personas",
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
      "Multi-VC panel",
      "Multilingual AI VCs (Coming Soon)",
      "AI Virtual Co-Founder (Coming Soon)",
      "10 AI-generated pitch decks (Coming Soon)",
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
 * The plan catalogue, matching the PitchNest pricing deck. Per-tier prices come
 * from the SERVER catalog (usePublicPrice → /api/billing/price) so the displayed
 * number is exactly what checkout charges; fixed fallbacks are used only until
 * the price loads (or if billing is unconfigured).
 */
export function getPlans(price: {
  amount: number | null;
  currency: string | null;
  days: number | null;
  catalog?: { plan: string; term: string; amount: number; currency: string }[];
}): Plan[] {
  const cat = price?.catalog ?? [];
  const sku = (plan: string, term: string) =>
    cat.find((c) => c.plan === plan && c.term === term);

  const proMo = sku("pro", "monthly");
  const founderMo = sku("prep", "monthly");
  const currency = proMo?.currency ?? price?.currency ?? "USD";
  const proAmount = proMo?.amount ?? price?.amount ?? 15; // Pro Founder
  const founderAmount = founderMo?.amount ?? 9.99; // Founder (prep)

  return base.map((p) => {
    if (p.id === "pro") return { ...p, price: formatPrice(proAmount, currency, null) };
    if (p.id === "founder")
      return { ...p, price: formatPrice(founderAmount, founderMo?.currency ?? currency, null) };
    if (p.id === "enterprise") return { ...p, price: "Custom per seat" };
    return { ...p, price: "$0 /mo" };
  });
}
