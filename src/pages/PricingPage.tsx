import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Minus } from "lucide-react";
import { cn } from "../lib/utils";
import { ThemeToggle } from "../components/ThemeToggle";
import { LogoLink } from "../components/Logo";
import { getPlans } from "../lib/plans";
import { usePublicPrice } from "../hooks/usePublicPrice";

/**
 * Standalone pricing page.
 *
 * The landing page carries a condensed three-card summary; this is the detail
 * view it links into. Both read the same catalogue (lib/plans.ts) and the same
 * server-provided price, so they cannot drift apart.
 *
 * Public by design — someone deciding whether to sign up must be able to read
 * the full plan comparison without an account.
 */

/** Rows are explicit rather than derived so the matrix reads like a spec. */
const MATRIX: { label: string; free: string | boolean; pro: string | boolean; enterprise: string | boolean }[] = [
  { label: "Pitch sessions", free: "2 per week", pro: "Unlimited", enterprise: "Unlimited" },
  { label: "Session length", free: "10 minutes", pro: "Longer pitch durations", enterprise: "Longer pitch durations" },
  { label: "AI investor panel", free: true, pro: true, enterprise: true },
  { label: "On-screen scorecard", free: true, pro: true, enterprise: true },
  { label: "Deck-aware questioning", free: true, pro: true, enterprise: true },
  { label: "Downloadable PDF report", free: false, pro: true, enterprise: true },
  { label: "Live market research in panel", free: false, pro: true, enterprise: true },
  { label: "Pitch history and replays", free: true, pro: true, enterprise: true },
  { label: "Cohort dashboard", free: false, pro: false, enterprise: true },
  { label: "Team seats", free: false, pro: false, enterprise: true },
  { label: "Shared branding", free: false, pro: false, enterprise: true },
  { label: "Priority support", free: false, pro: true, enterprise: true },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true) return <Check size={16} className="mx-auto text-emerald-500" aria-label="Included" />;
  if (value === false) return <Minus size={16} className="mx-auto text-slate-300 dark:text-zinc-700" aria-label="Not included" />;
  return <span className="text-xs text-slate-600 dark:text-zinc-400">{value}</span>;
}

export default function PricingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const publicPrice = usePublicPrice();
  const plans = useMemo(() => getPlans(publicPrice), [publicPrice]);

  useEffect(() => {
    if (localStorage.getItem("user")) setIsLoggedIn(true);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090B] font-sans text-slate-900 dark:text-zinc-100">
      <header className="border-b border-slate-100 dark:border-zinc-800/60">
        <nav className="max-w-295 mx-auto px-5 sm:px-7 h-16 flex justify-between items-center">
          <LogoLink showText size="md" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isLoggedIn ? (
              <Link to="/dashboard" className="btn-primary text-sm px-5 py-2.5">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost hidden sm:inline-flex">Log in</Link>
                <Link to="/signup" className="btn-primary text-sm px-5 py-2.5">Start free</Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="max-w-295 mx-auto px-5 sm:px-7 py-10 sm:py-14">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 mb-6">
          <ArrowLeft size={14} /> Back to home
        </Link>

        <div className="text-center mb-9">
          <p className="section-label mb-2">Pricing</p>
          <h1 className="section-heading mb-3">Plans that scale with your raise</h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Start free and upgrade when you're actively raising. No contract, and
            you can stop at any time.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "rounded-2xl border p-6 flex flex-col bg-white dark:bg-zinc-900",
                plan.featured
                  ? "border-sky-500 ring-1 ring-sky-500/30 shadow-lg shadow-sky-500/5"
                  : "border-slate-200 dark:border-zinc-800",
              )}
            >
              <div className="flex items-baseline justify-between mb-1">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-zinc-100">{plan.name}</h2>
                {plan.featured && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                    Popular
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-1">{plan.price}</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-5">{plan.tagline}</p>

              <ul className="space-y-2 text-sm text-slate-600 dark:text-zinc-400 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={15} className="shrink-0 mt-0.5 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                {plan.id === "enterprise" ? (
                  <span className="block w-full py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-center text-xs font-bold text-slate-400 dark:text-zinc-500 cursor-default">
                    Coming soon
                  </span>
                ) : (
                  <Link
                    to={plan.cta.href}
                    className={cn(
                      "flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-xs font-bold transition-colors",
                      plan.featured
                        ? "gradient-brand text-white hover:opacity-95"
                        : "border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800",
                    )}
                  >
                    {plan.cta.label} <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Full comparison */}
        <h2 className="text-base font-extrabold text-slate-900 dark:text-zinc-100 mb-3">Compare in detail</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-zinc-800">
          <table className="w-full min-w-140 text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800">
                <th scope="col" className="text-left font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400 px-4 py-3">Feature</th>
                <th scope="col" className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400 px-4 py-3 w-32">Free</th>
                <th scope="col" className="font-bold text-xs uppercase tracking-wider text-sky-600 dark:text-sky-400 px-4 py-3 w-40">Pro</th>
                <th scope="col" className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400 px-4 py-3 w-40">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((row, i) => (
                <tr
                  key={row.label}
                  className={cn(
                    "border-b border-slate-100 dark:border-zinc-800/60 last:border-0",
                    i % 2 === 1 && "bg-slate-50/40 dark:bg-zinc-900/30",
                  )}
                >
                  <th scope="row" className="text-left font-medium text-slate-700 dark:text-zinc-300 px-4 py-3">{row.label}</th>
                  <td className="text-center px-4 py-3"><Cell value={row.free} /></td>
                  <td className="text-center px-4 py-3 bg-sky-50/40 dark:bg-sky-500/5"><Cell value={row.pro} /></td>
                  <td className="text-center px-4 py-3"><Cell value={row.enterprise} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-4">
          Enterprise / Organization accounts are in development. Pricing will be
          announced when cohort features ship.
        </p>

        <div className="mt-12 rounded-2xl gradient-brand p-8 text-center text-white relative overflow-hidden">
          <div className="relative z-10 max-w-xl mx-auto">
            <h2 className="font-display text-xl sm:text-2xl font-semibold mb-2">Still deciding?</h2>
            <p className="text-sm text-white/75 mb-5">
              Run two full pitch sessions this week on the free plan. No card required.
            </p>
            <Link
              to={isLoggedIn ? "/setup" : "/signup"}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-white/95 transition-all shadow-lg text-sm"
            >
              {isLoggedIn ? "Start a pitch" : "Start free"} <ArrowRight size={16} />
            </Link>
          </div>
          <div className="absolute -top-16 -right-16 w-52 h-52 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        </div>
      </main>

      <footer className="border-t border-slate-100 dark:border-zinc-800/60 mt-10">
        <div className="max-w-295 mx-auto px-5 sm:px-7 py-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-400 dark:text-zinc-500">
          <span>© {new Date().getFullYear()} PitchNest</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-sky-600 dark:hover:text-sky-400">Privacy</Link>
            <Link to="/terms" className="hover:text-sky-600 dark:hover:text-sky-400">Terms</Link>
            <Link to="/support" className="hover:text-sky-600 dark:hover:text-sky-400">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
