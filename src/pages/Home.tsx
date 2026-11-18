import React, { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, History, Mic } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { usePageMetadata } from "../hooks/usePageMetadata";
import { OpportunityCard } from "../components/opportunities/OpportunityCard";
import { fetchOpportunities, type Opportunity } from "../api/opportunities";

export default function Home() {
  const { user } = useAuth();
  const founder = user && user.accountType !== "organization" ? user : null;
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);

  usePageMetadata({
    title: "Home — PitchNest",
    description: "Practise your pitch, get clear feedback, and improve before your next investor meeting.",
    path: "/home",
    robots: "noindex, follow",
  });

  useEffect(() => {
    const controller = new AbortController();
    fetchOpportunities({}, controller.signal)
      .then((items) => setOpportunity(items.find((item) => item.state !== "closed") ?? null))
      .catch((error: unknown) => {
        if (!(error instanceof Error && error.name === "AbortError")) setOpportunity(null);
      });
    return () => controller.abort();
  }, []);

  const firstName = founder?.name?.trim().split(/\s+/)[0];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl gradient-brand text-white shadow-xl shadow-indigo-500/15">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative p-6 sm:p-9 lg:p-11">
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
            {firstName ? `Welcome back, ${firstName}` : "Pitch practice"}
          </p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Pitch. Practise. <span className="text-accent">Improve.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
            Rehearse with AI investors. Get clear feedback on what to fix. Pitch again with confidence.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={founder ? "/setup" : "/signup"} className="btn-accent px-5 py-2.5 text-sm">
              Start a practice pitch <Mic size={16} />
            </Link>
            {founder && (
              <Link
                to="/archive"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Review feedback <History size={16} />
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="opportunities-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">For your next step</p>
            <h2 id="opportunities-title" className="mt-1 font-display text-xl font-semibold text-slate-950 dark:text-white">
              Opportunity Hub
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
              Open grants, accelerators and programmes for founders.
            </p>
          </div>
          <Link to="/opportunities" className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
            View all <ArrowRight size={15} />
          </Link>
        </div>
        {opportunity ? (
          <OpportunityCard opportunity={opportunity} />
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-400">
            <CalendarDays size={18} className="shrink-0 text-slate-300" />
            New opportunities are being curated. <Link to="/opportunities" className="font-bold text-indigo-600 dark:text-indigo-400">Browse the hub</Link>
          </div>
        )}
      </section>
    </div>
  );
}
