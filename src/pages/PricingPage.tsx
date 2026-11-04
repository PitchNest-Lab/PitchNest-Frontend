import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Check, Gift, Hammer, Loader2, Minus, Sparkles, Tag, Users, X } from "lucide-react";
import { previewDiscount, type DiscountQuote } from "../api/challenges";
import { cn } from "../lib/utils";
import { ThemeToggle } from "../components/ThemeToggle";
import { LogoLink } from "../components/Logo";
import { getPlans, IN_DEVELOPMENT, type Plan } from "../lib/plans";
import { usePublicPrice } from "../hooks/usePublicPrice";
import { useAuth } from "../contexts/AuthContext";
import { useBilling, type BillingMode, type BillingTerm, type PaidPlan } from "../contexts/BillingContext";
import { currencyName, defaultBillingMode, formatMoney, freeMonthsLabel, hasPaidPlan } from "../lib/billing";
import { setPreferredCurrency } from "../lib/currency";
import { CONTACT_EMAIL } from "../lib/legal";

/**
 * Plans and the first-subscription offer.
 *
 * Public by design — someone deciding whether to sign up must be able to read
 * the full plan comparison without an account. Signed in, each card starts
 * checkout for its plan directly.
 *
 * Every price and the free-month offer come from the server (the public price
 * endpoint, or the signed-in user's plan endpoint, which also says whether
 * THIS user still qualifies). Nothing here can promise what checkout won't
 * record. Prices are in the visitor's currency when the server offers it, and
 * checkout pays in the currency of the price on the card.
 */

/**
 * Rows are explicit rather than derived so the matrix reads like a spec.
 *
 * Every row is verified against what the product actually does today:
 * backend/src/services/entitlementService.ts for the four plan-level gates
 * (weekly session count, session length, the PDF, live market research), and the
 * paywall boundary in pages/PostPitchReport.tsx for the fifth.
 *
 * THE FIFTH DELTA IS EASY TO MISS. On the report, everything down to the score
 * radar, sentiment, strengths and risks is readable on every plan. The
 * prescriptive half — "Reading the Room" and "Actionable Next Steps" — is blurred
 * for anyone without live research, i.e. for Free AND for a paying Founder. So
 * that row is Pro-only, and the score row above it is genuinely open to all.
 */
type Cellv = string | boolean;
const MATRIX: { label: string; free: Cellv; founder: Cellv; pro: Cellv; enterprise: Cellv }[] = [
  { label: "Practice sessions", free: "2 / week", founder: "Unlimited", pro: "Unlimited", enterprise: "Unlimited" },
  { label: "Session length", free: "10 min", founder: "10–20 min", pro: "10–40 min", enterprise: "10–40 min" },
  { label: "AI investor personas", free: "All 10", founder: "All 10", pro: "All 10", enterprise: "All 10" },
  { label: "Multi-VC panel simulation", free: true, founder: true, pro: true, enterprise: true },
  { label: "1-on-1 coach mode", free: true, founder: true, pro: true, enterprise: true },
  { label: "Deck-aware questioning", free: true, founder: true, pro: true, enterprise: true },
  { label: "Readiness score, radar, strengths & risks", free: true, founder: true, pro: true, enterprise: true },
  { label: "Downloadable PDF report", free: false, founder: true, pro: true, enterprise: true },
  { label: "Prioritised next steps & reading the room", free: false, founder: false, pro: true, enterprise: true },
  { label: "Live market research in panel", free: false, founder: false, pro: true, enterprise: true },
  { label: "Organisation account & cohort seats", free: false, founder: false, pro: false, enterprise: true },
  { label: "Cohort dashboard & founder drill-down", free: false, founder: false, pro: false, enterprise: true },
  { label: "Weekly & monthly cohort reports", free: false, founder: false, pro: false, enterprise: true },
  { label: "Enrolment link & QR for your founders", free: false, founder: false, pro: false, enterprise: true },
];

const DESCRIPTIONS: Record<"free" | "founder" | "pro", string> = {
  free: "Rehearse with the full AI investor panel and see where your pitch stands.",
  founder: "Practise as often as you need, with longer sessions and a report to keep.",
  pro: "Everything for an active raise: the longest sessions, live market research and prioritised next steps.",
};

const CARD_PLAN: Record<"founder" | "pro", PaidPlan> = { founder: "prep", pro: "pro" };
const RANK: Record<string, number> = { free: 0, prep: 1, pro: 2 };

function Cell({ value }: { value: string | boolean }) {
  if (value === true) return <Check size={16} className="mx-auto text-emerald-500" aria-label="Included" />;
  if (value === false) return <Minus size={16} className="mx-auto text-slate-300 dark:text-zinc-700" aria-label="Not included" />;
  return <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">{value}</span>;
}

export default function PricingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, authFetch } = useAuth();
  const signedIn = Boolean(user && user.accountType !== "organization");
  const publicPrice = usePublicPrice();
  const { info, loaded, upgrade } = useBilling();
  const [term, setTerm] = useState<BillingTerm>("monthly");
  const [chosenMode, setChosenMode] = useState<BillingMode | null>(null);
  const [starting, setStarting] = useState<PaidPlan | null>(null);
  // A discount code, from ?code= (the challenge page links here with it) or typed in.
  const linkedCode = (searchParams.get("code") || "").trim().toUpperCase().slice(0, 32);
  const [codeInput, setCodeInput] = useState(linkedCode);
  const [appliedCode, setAppliedCode] = useState(linkedCode);
  const [quote, setQuote] = useState<DiscountQuote | null>(null);
  const [codeError, setCodeError] = useState("");
  const [checkingCode, setCheckingCode] = useState(false);

  const useAccount = signedIn && loaded;
  const fromAccount = useAccount && info.catalog.length > 0;
  const catalog = fromAccount ? info.catalog : publicPrice.catalog;
  const currencies = fromAccount ? info.currencies : publicPrice.currencies;
  // The currency the server actually priced in, which may not be the one asked for.
  const shownCurrency = catalog[0]?.currency ?? "USD";
  const converted = catalog.some((item) => item.baseAmount !== undefined);
  const billingEnabled = useAccount ? info.billingEnabled : publicPrice.billingEnabled;
  // Visitors see the offer as it stands for new subscribers; a signed-in user
  // sees it only while they still qualify.
  const freeMonths = useAccount
    ? info.offer.eligible ? info.offer.freeMonths : 0
    : publicPrice.freeMonths;
  const paid = useAccount && hasPaidPlan(info);
  const currentPlan = paid ? info.plan : "free";
  const currentSub = useAccount && info.subscription?.status === "active" ? info.subscription : null;

  const plans = useMemo(() => getPlans({ amount: null, currency: null, days: null }), []);
  const sku = (plan: PaidPlan, t: BillingTerm) => catalog.find((c) => c.plan === plan && c.term === t) ?? null;

  const proMonthly = sku("pro", "monthly");
  const proAnnual = sku("pro", "annual");
  const annualSaving =
    proMonthly && proAnnual && proAnnual.amount < proMonthly.amount * 12
      ? Math.round((1 - proAnnual.amount / (proMonthly.amount * 12)) * 100)
      : 0;
  const modeSku = sku("pro", term) ?? proMonthly;

  // The server prices the code for THIS account, term and currency; what it
  // says is what checkout charges. Codes apply to Pro Founder.
  useEffect(() => {
    if (!appliedCode || !signedIn || !loaded || !modeSku) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    setCheckingCode(true);
    setCodeError("");
    previewDiscount(authFetch, { code: appliedCode, plan: "pro", term, currency: modeSku.currency })
      .then((result) => {
        if (!cancelled) setQuote(result);
      })
      .catch((error) => {
        if (cancelled) return;
        setQuote(null);
        setCodeError(error?.message || "That code can't be used right now.");
      })
      .finally(() => {
        if (!cancelled) setCheckingCode(false);
      });
    return () => {
      cancelled = true;
    };
  }, [appliedCode, signedIn, loaded, term, modeSku?.currency, modeSku?.amount, authFetch]);

  const codeApplies = Boolean(quote && quote.term === term && quote.currency === modeSku?.currency);
  const billingModes = codeApplies ? (["manual"] as BillingMode[]) : modeSku?.billingModes ?? ["auto_renew", "manual"];
  // The buyer's own pick while it is on offer; until then, the default for
  // this price (manual for local currencies, automatic for dollars). A code
  // means a one-time payment.
  const billingMode: BillingMode =
    codeApplies
      ? "manual"
      : chosenMode && billingModes.includes(chosenMode)
        ? chosenMode
        : defaultBillingMode(modeSku, currentSub?.billingMode);

  const close = () => {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate(signedIn ? "/home" : "/");
  };

  const startCheckout = async (plan: PaidPlan) => {
    setStarting(plan);
    const withCode = plan === "pro" && codeApplies && quote ? quote.code : undefined;
    // On success the browser leaves for Flutterwave, so only failure clears this.
    const ok = await upgrade({ plan, term, currency: sku(plan, term)?.currency, billingMode, discountCode: withCode });
    if (!ok) setStarting(null);
  };

  const ctaFor = (plan: Plan) => {
    const buttonBase =
      "flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-colors";
    const quiet = cn(buttonBase, "border border-slate-200 text-slate-400 dark:border-zinc-700 dark:text-zinc-500 cursor-default");

    if (plan.id === "free") {
      if (!signedIn) {
        return <Link to="/signup" className={cn(buttonBase, "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-zinc-700 dark:bg-transparent dark:text-zinc-100 dark:hover:bg-zinc-800")}>Start free</Link>;
      }
      if (!loaded) return <span className={quiet}>Loading…</span>;
      return <span className={quiet}>{currentPlan === "free" ? "Your current plan" : "Included"}</span>;
    }
    if (plan.id === "enterprise") return null;

    const target = CARD_PLAN[plan.id];
    const selectedSku = sku(target, term);
    const featured = plan.id === "pro";
    const action = cn(
      buttonBase,
      featured
        ? "bg-linear-to-r from-indigo-600 to-sky-600 text-white shadow-md shadow-sky-600/25 hover:brightness-110"
        : "border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 dark:border-indigo-500/40 dark:bg-transparent dark:text-indigo-200 dark:hover:bg-indigo-500/10",
    );
    const label =
      plan.id === "pro" && codeApplies && quote
        ? `Pay ${formatMoney(quote.amount, quote.currency)} with ${quote.code}`
        : freeMonths > 0 ? `Claim ${freeMonthsLabel(freeMonths)}` : plan.id === "pro" ? "Upgrade to Pro Founder" : "Get Founder";

    if (!signedIn) return <Link to="/signup" className={action}>{label}</Link>;
    // Until this account's plan answers, no button can say what it would do.
    if (!loaded) return <span className={quiet}>Loading…</span>;
    const sameSubscriptionChoice =
      currentSub &&
      currentSub.plan === target &&
      currentSub.term === term &&
      currentSub.currency === selectedSku?.currency &&
      currentSub.billingMode === billingMode &&
      billingMode !== "manual";
    if (sameSubscriptionChoice) {
      return <span className={quiet}>Your current plan</span>;
    }
    if (paid && RANK[currentPlan] > RANK[target]) return <span className={quiet}>Included in your plan</span>;
    if (!billingEnabled || selectedSku?.purchasable !== true) {
      return <a href={`mailto:${CONTACT_EMAIL}?subject=Upgrade%20my%20PitchNest%20plan`} className={action}>Contact us to upgrade</a>;
    }
    const switching = Boolean(currentSub && currentSub.plan === target);
    const sameManualRenewal = Boolean(
      currentSub &&
      currentSub.billingMode === "manual" &&
      currentSub.plan === target &&
      currentSub.term === term &&
      currentSub.currency === selectedSku?.currency &&
      billingMode === "manual",
    );
    const modeAvailable = selectedSku?.billingModes.includes(billingMode) ?? false;
    if (!modeAvailable) {
      return <span className={quiet}>Choose another renewal option</span>;
    }
    return (
      <button type="button" onClick={() => void startCheckout(target)} disabled={starting !== null} className={cn(action, "cursor-pointer disabled:opacity-60")}>
        {starting === target && <Loader2 size={15} className="animate-spin" />}
        {switching
          ? sameManualRenewal
            ? "Renew now"
            : currentSub?.currency !== selectedSku?.currency
            ? `Switch to ${selectedSku?.currency}`
            : currentSub?.billingMode !== billingMode
              ? billingMode === "manual" ? "Switch to manual renewal" : "Turn on automatic renewal"
              : `Switch to ${term === "annual" ? "yearly" : "monthly"}`
          : label}
      </button>
    );
  };

  const priceFor = (plan: Plan) => {
    if (plan.id === "free") return { amount: formatMoney(0, shownCurrency), unit: "/ month", approx: "" };
    if (plan.id === "enterprise") return { amount: "Custom", unit: "per seat", approx: "" };
    const item = sku(CARD_PLAN[plan.id], term);
    if (!item) {
      const pricingLoaded = useAccount ? loaded : publicPrice.loaded;
      return { amount: pricingLoaded ? "Unavailable" : "Loading…", unit: "", approx: "" };
    }
    if (plan.id === "pro" && codeApplies && quote) {
      return {
        amount: formatMoney(quote.amount, quote.currency),
        unit: `first ${term === "annual" ? "year" : "month"}`,
        approx: `was ${formatMoney(quote.listAmount, quote.currency)}`,
      };
    }
    return {
      amount: formatMoney(item.amount, item.currency),
      unit: term === "annual" ? "/ year" : "/ month",
      approx: item.baseAmount !== undefined && item.baseCurrency ? `≈ ${formatMoney(item.baseAmount, item.baseCurrency)}` : "",
    };
  };

  const cards = plans.filter((p) => p.id !== "enterprise");

  return (
    <div className="gradient-mesh min-h-screen font-sans text-slate-900 dark:text-zinc-100">
      <header className="border-b border-slate-100 dark:border-zinc-800/60">
        <nav className="mx-auto flex h-16 max-w-295 items-center justify-between px-5 sm:px-7">
          <LogoLink showText size="md" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {signedIn ? (
              <button
                type="button"
                onClick={close}
                aria-label="Close plans"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <X size={20} />
              </button>
            ) : (
              <>
                <Link to="/login" className="btn-ghost hidden sm:inline-flex">Log in</Link>
                <Link to="/signup" className="btn-primary px-5 py-2.5 text-sm">Start free</Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-295 px-5 py-10 sm:px-7 sm:py-14">
        <div className="mb-8 text-center">
          <p className="eyebrow mb-3">Plans & pricing</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {freeMonths > 0 ? `Get your first ${freeMonths === 1 ? "month" : `${freeMonths} months`} free` : "Choose your plan"}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500 dark:text-zinc-400 sm:text-base">
            {freeMonths > 0
              ? `Subscribe to any plan and we add ${freeMonthsLabel(freeMonths).replace(" free", "")} on top. Choose automatic renewal or a one-time payment.`
              : "Choose automatic renewal by card or a one-time payment. You can renew manually whenever you are ready."}
          </p>
        </div>

        {/* Discount code */}
        <div className="mx-auto mb-8 max-w-xl rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
          <form
            className="flex flex-col gap-2 sm:flex-row sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              setAppliedCode(codeInput.trim().toUpperCase());
            }}
          >
            <label className="flex-1 text-xs font-bold text-slate-600 dark:text-zinc-300">
              <span className="flex items-center gap-1.5"><Tag size={13} /> Discount code</span>
              <input
                value={codeInput}
                onChange={(event) => setCodeInput(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                maxLength={32}
                placeholder="e.g. PCHU01"
                autoComplete="off"
                className="input-field mt-1.5 text-sm uppercase"
              />
            </label>
            <button type="submit" disabled={!codeInput.trim() || checkingCode} className="btn-secondary px-4 py-3 text-sm disabled:opacity-50">
              {checkingCode && <Loader2 size={14} className="animate-spin" />} Apply
            </button>
          </form>
          {!signedIn && appliedCode && (
            <p className="mt-2 text-xs text-slate-600 dark:text-zinc-300">
              <Link to="/login" state={{ from: location }} className="font-bold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400">Log in</Link>
              {" or "}
              <Link to="/signup" className="font-bold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400">create a free account</Link>
              {` to use ${appliedCode}.`}
            </p>
          )}
          {signedIn && codeApplies && quote && (
            <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {quote.code}: {quote.percentOff}% off your first {term === "annual" ? "year" : "month"} of Pro Founder,{" "}
              {formatMoney(quote.amount, quote.currency)} instead of {formatMoney(quote.listAmount, quote.currency)}. It is a one-time
              payment; you renew manually at the normal price.
              {freeMonths > 0 && !quote.combineWithOffer ? " The code replaces the free-month offer." : ""}
            </p>
          )}
          {signedIn && codeError && !checkingCode && (
            <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400" role="alert">{codeError}</p>
          )}
        </div>

        {/* Billing period and currency */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
          <div role="radiogroup" aria-label="Billing period" className="inline-flex rounded-full border border-slate-200 bg-white/70 p-1 dark:border-zinc-800 dark:bg-zinc-900/70">
            {(["monthly", "annual"] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={term === option}
                onClick={() => setTerm(option)}
                className={cn(
                  "cursor-pointer rounded-full px-5 py-2 text-sm font-medium transition-colors",
                  term === option
                    ? "bg-indigo-50 font-semibold text-indigo-700 shadow-sm dark:bg-indigo-500/20 dark:text-indigo-100"
                    : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200",
                )}
              >
                {option === "monthly" ? "Monthly" : "Yearly"}
                {option === "annual" && annualSaving > 0 && (
                  <span className="ml-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Save {annualSaving}%</span>
                )}
              </button>
            ))}
          </div>
          {currencies.length > 1 && (
            <label className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400">
              Currency
              <select
                value={shownCurrency}
                onChange={(event) => setPreferredCurrency(event.target.value)}
                className="cursor-pointer rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm font-medium text-slate-800 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-100"
              >
                {currencies.map((code) => (
                  <option key={code} value={code}>
                    {code} · {currencyName(code)}
                  </option>
                ))}
              </select>
            </label>
          )}
          {billingModes.length > 1 && (
            <div role="radiogroup" aria-label="Renewal option" className="inline-flex rounded-full border border-slate-200 bg-white/70 p-1 dark:border-zinc-800 dark:bg-zinc-900/70">
              {billingModes.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={billingMode === mode}
                  onClick={() => setChosenMode(mode)}
                  className={cn(
                    "cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    billingMode === mode
                      ? "bg-indigo-50 font-semibold text-indigo-700 shadow-sm dark:bg-indigo-500/20 dark:text-indigo-100"
                      : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200",
                  )}
                >
                  {mode === "auto_renew" ? "Automatic renewal" : "Manual renewal"}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="mx-auto -mt-5 mb-8 max-w-xl text-center text-xs text-slate-500 dark:text-zinc-400">
          {billingMode === "auto_renew"
            ? "Automatic renewal is card-based on Flutterwave; you can cancel before the next charge."
            : "Manual renewal is a one-time checkout. Nothing is charged again without you starting another payment."}
        </p>

        {/* Plan cards */}
        <div className="mx-auto mb-10 grid max-w-5xl items-stretch gap-5 md:grid-cols-3">
          {cards.map((plan) => {
            const featured = plan.id === "pro";
            const price = priceFor(plan);
            const paidCard = plan.id === "founder" || plan.id === "pro";
            const recurring = paidCard ? sku(CARD_PLAN[plan.id as "founder" | "pro"], term) : null;
            const withCode = plan.id === "pro" && codeApplies && quote !== null;
            // A code that doesn't combine with the offer takes the free months' place.
            const cardFreeMonths = withCode && !quote!.combineWithOffer ? 0 : freeMonths;
            return (
              <div
                key={plan.id}
                className={cn(
                  "flex flex-col rounded-3xl border p-6 sm:p-7",
                  // On a phone the offer card leads; side by side it sits last.
                  featured && "order-first md:order-none",
                  featured
                    ? "border-indigo-300 bg-linear-to-b from-indigo-50 to-white shadow-xl shadow-indigo-500/10 dark:border-indigo-500/40 dark:from-indigo-950/60 dark:to-zinc-900/80 dark:shadow-none"
                    : "border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60",
                )}
              >
                <div className="flex h-6 items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">{plan.name}</p>
                  {featured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-ink">
                      {withCode ? <><Tag size={11} /> {quote!.percentOff}% off</> : cardFreeMonths > 0 ? <><Gift size={11} /> {freeMonthsLabel(cardFreeMonths)}</> : "Most popular"}
                    </span>
                  )}
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight">{plan.headline}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-zinc-400 md:min-h-[4.5rem]">
                  {DESCRIPTIONS[plan.id as "free" | "founder" | "pro"]}
                </p>

                <div className="mt-5 flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-4xl font-semibold tracking-tight">{price.amount}</span>
                  <span className="text-sm text-slate-500 dark:text-zinc-400">{price.unit}</span>
                  {price.approx && <span className="text-xs text-slate-400 dark:text-zinc-500">{price.approx}</span>}
                </div>
                <p className="mt-1 h-5 text-xs font-semibold text-accent-text dark:text-accent">
                  {withCode
                    ? `With ${quote!.code}, then the normal price`
                    : paidCard && cardFreeMonths > 0 ? `+ ${freeMonthsLabel(cardFreeMonths)} on your first subscription` : ""}
                </p>

                <div className="mt-5">{ctaFor(plan)}</div>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-zinc-300">
                      <Check size={16} className={cn("mt-0.5 shrink-0", featured ? "text-indigo-600 dark:text-indigo-300" : "text-sky-600/70 dark:text-sky-400/70")} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <p className="mt-6 text-[11px] leading-relaxed text-slate-400 dark:text-zinc-500">
                  {plan.id === "free"
                    ? "No card needed. Every new account starts on the Free plan."
                    : recurring
                      ? billingMode === "auto_renew"
                        ? `${cardFreeMonths > 0 ? "The free month applies to your first subscription only. " : ""}Renews at ${formatMoney(recurring.amount, recurring.currency)} ${term === "annual" ? "a year" : "a month"} until you cancel.`
                        : `${cardFreeMonths > 0 ? "The free month applies to your first subscription only. " : ""}One-time payment. Renew manually${withCode ? ` at ${formatMoney(recurring.amount, recurring.currency)}` : ""} when your paid period ends.`
                      : billingMode === "auto_renew" ? "Renews automatically until you cancel." : "One-time payment. Renew manually when you are ready."}
                </p>
              </div>
            );
          })}
        </div>

        {converted && (
          <p className="mx-auto mb-8 max-w-xl text-center text-xs text-slate-500 dark:text-zinc-400">
            Prices in {currencyName(shownCurrency)} are converted from US dollars at today's exchange rate and rounded up.
            A plan keeps the amount you subscribed at for as long as it renews.
          </p>
        )}

        <p className="mb-16 flex flex-wrap items-center justify-center gap-1.5 text-center text-sm text-slate-500 dark:text-zinc-400">
          <Users size={16} className="text-slate-400" />
          Running an accelerator, hub or cohort?
          <Link to="/support" className="font-semibold text-slate-900 underline underline-offset-4 hover:text-indigo-700 dark:text-zinc-100 dark:hover:text-indigo-300">
            See Hubs & Accelerators
          </Link>
        </p>

        {/* Full comparison */}
        <h2 className="mb-3 text-base font-semibold">Compare plans in detail</h2>
        <p className="mb-2 text-xs text-slate-500 dark:text-zinc-400 sm:hidden">
          Swipe sideways to compare every plan. Feature names stay pinned on the left.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900/60">
                <th scope="col" className="sticky left-0 z-20 min-w-44 bg-slate-50 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-zinc-900 dark:text-zinc-400">Feature</th>
                <th scope="col" className="w-28 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Free</th>
                <th scope="col" className="w-28 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Founder</th>
                <th scope="col" className="w-32 px-4 py-3 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Pro Founder</th>
                <th scope="col" className="w-32 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Hubs & Accelerators</th>
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((row, i) => (
                <tr
                  key={row.label}
                  className={cn(
                    "border-b border-slate-100 last:border-0 dark:border-zinc-800/60",
                    i % 2 === 1 && "bg-slate-50/40 dark:bg-zinc-900/30",
                  )}
                >
                  <th scope="row" className={cn("sticky left-0 z-10 min-w-44 px-4 py-3 text-left font-medium text-slate-700 dark:text-zinc-300", i % 2 === 1 ? "bg-slate-50 dark:bg-zinc-900" : "bg-white dark:bg-zinc-900")}>{row.label}</th>
                  <td className="px-4 py-3 text-center"><Cell value={row.free} /></td>
                  <td className="px-4 py-3 text-center"><Cell value={row.founder} /></td>
                  <td className="bg-indigo-50/40 px-4 py-3 text-center dark:bg-indigo-500/5"><Cell value={row.pro} /></td>
                  <td className="px-4 py-3 text-center"><Cell value={row.enterprise} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-slate-400 dark:text-zinc-500">
          New accounts start on the Free plan: two sessions a week, and every report you generate stays
          readable. Upgrade whenever you need more sessions, longer sessions, the PDF report or the Pro tools.
          Hubs & Accelerators is priced custom per seat or cohort.
        </p>

        {/* Roadmap — deliberately OUTSIDE the comparison table, so nothing here
            sits in a column next to a price. */}
        <section className="mt-8 rounded-2xl border border-dashed border-slate-300 p-6 dark:border-zinc-700 sm:p-7">
          <div className="mb-2 flex items-center gap-2">
            <Hammer size={15} className="text-slate-400 dark:text-zinc-500" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              In development — not included in any plan
            </h2>
          </div>
          <p className="mb-5 max-w-2xl text-xs text-slate-500 dark:text-zinc-400">
            None of this is built yet, none of it is purchasable, and nothing on this page charges you for it.
          </p>
          <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {IN_DEVELOPMENT.map((f) => (
              <li key={f.label} className="flex items-start gap-2.5">
                <Sparkles size={14} className="mt-0.5 shrink-0 text-slate-300 dark:text-zinc-600" />
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">{f.label}</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">{f.blurb}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="mt-10 border-t border-slate-100 dark:border-zinc-800/60">
        <div className="mx-auto flex max-w-295 flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-slate-400 dark:text-zinc-500 sm:flex-row sm:px-7">
          <span>© {new Date().getFullYear()} PitchNest · Payments by Flutterwave</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-sky-600 dark:hover:text-sky-400">Privacy</Link>
            <Link to="/terms" className="hover:text-sky-600 dark:hover:text-sky-400">Terms</Link>
            <Link to="/refunds" className="hover:text-sky-600 dark:hover:text-sky-400">Refunds</Link>
            <Link to="/support" className="hover:text-sky-600 dark:hover:text-sky-400">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
