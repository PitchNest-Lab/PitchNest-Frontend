/**
 * Frontend mirror of the server entitlement matrix (backend
 * services/entitlementService.ts). The SERVER is authoritative — it clamps
 * duration, meters sessions, and gates the PDF regardless of what the client
 * does. These helpers exist only so the UI does not promise a paid tier
 * something and then visibly block it (e.g. hiding the PDF button from a Prep
 * user who paid for it), and so paywall nudges point at the right upgrade.
 *
 * Keep in step with the backend matrix. If the two drift, the server wins and
 * the only symptom is a cosmetic mismatch, never a security hole.
 */

export type UiPlan = "free" | "founder" | "prep" | "pro";

function normalize(plan: string | null | undefined): UiPlan {
  if (plan === "pro") return "pro";
  if (plan === "founder" || plan === "prep") return "founder";
  return "free";
}

/** Session durations (minutes) the plan may select. */
const DURATIONS: Record<UiPlan, number[]> = {
  free: [10],
  founder: [10, 20],
  prep: [10, 20],
  pro: [10, 20, 30, 40],
};

export function planDurations(plan: string | null | undefined, isTrial: boolean = false): number[] {
  if (isTrial) return DURATIONS.pro;
  return DURATIONS[normalize(plan)];
}

/** Any paid or active trial tier. */
export function isPaidPlan(plan: string | null | undefined, isTrial: boolean = false): boolean {
  if (isTrial) return true;
  const p = normalize(plan);
  return p === "founder" || p === "prep" || p === "pro";
}

/** Full downloadable PDF report — unlocked during the free trial. */
export function planCanPdf(plan: string | null | undefined, isTrial: boolean = false): boolean {
  if (isTrial) return true;
  return isPaidPlan(plan, false);
}

/** Live market research in the panel — unlocked during the free trial. */
export function planCanResearch(plan: string | null | undefined, isTrial: boolean = false): boolean {
  if (isTrial) return true;
  return normalize(plan) === "pro";
}

/**
 * Human label for the current plan. `trialDaysRemaining` comes from the server
 * (/api/billing/plan or /me); the trial length itself is server config
 * (FREE_TRIAL_DAYS), so the label never hardcodes a number of days.
 */
export function planLabel(
  plan: string | null | undefined,
  isTrial: boolean = false,
  trialDaysRemaining?: number | null,
): string {
  if (isTrial) {
    const d = typeof trialDaysRemaining === "number" ? Math.max(0, trialDaysRemaining) : null;
    if (d === null) return "Free Trial (Pro Full Access)";
    return `Free Trial — ${d} day${d === 1 ? "" : "s"} left (Pro Full Access)`;
  }
  const p = normalize(plan);
  return p === "pro" ? "Pro Founder" : p === "founder" ? "Founder" : "Free";
}
