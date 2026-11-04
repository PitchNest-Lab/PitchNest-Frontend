import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, ShieldCheck, Trophy } from "lucide-react";
import type { HostedOpportunity } from "../../api/opportunities";
import { challengePosterUrl, formatPrize, PHASE_LABELS } from "../../api/challenges";
import { cn } from "../../lib/utils";

function deadlineLabel(item: HostedOpportunity): string {
  const iso = item.challenge.submissionDeadline;
  if (!iso) return "";
  const when = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
  if (item.state === "closing_soon" && item.daysLeft !== null) {
    return item.daysLeft === 0 ? `Closes today · ${when}` : `Closes in ${item.daysLeft} day${item.daysLeft === 1 ? "" : "s"} · ${when}`;
  }
  return `Deadline ${when}`;
}

/**
 * A challenge PitchNest runs itself. Unlike an external listing it opens a
 * page on PitchNest, where founders join, enter and follow their status.
 * "featured" leads the Opportunities hub; "compact" fits a list or Home.
 */
export function HostedChallengeCard({ item, variant = "compact" }: { item: HostedOpportunity; variant?: "featured" | "compact" }) {
  const { challenge } = item;
  const posterUrl = challengePosterUrl(challenge);
  const open = challenge.phase === "open";
  const href = `/opportunities/challenges/${encodeURIComponent(challenge.slug)}`;
  const featured = variant === "featured";

  return (
    <article
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white dark:bg-zinc-900",
        "border-indigo-200 shadow-lg shadow-indigo-500/5 dark:border-indigo-900/60",
        featured && "sm:flex-row",
      )}
    >
      <Link
        to={href}
        className={cn(
          "block shrink-0 bg-gradient-to-br from-indigo-700 to-sky-600",
          featured ? "sm:w-[46%] lg:w-[42%]" : "",
        )}
        aria-label={`Open the ${item.title}`}
      >
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={`${item.title} poster`}
            loading="lazy"
            className={cn("h-full w-full object-contain", featured ? "max-h-[420px]" : "max-h-64")}
          />
        ) : (
          <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 p-6 text-center text-white">
            <Trophy size={32} className="text-accent" />
            <p className="text-lg font-extrabold">{item.title}</p>
            <p className="text-2xl font-extrabold text-accent">{formatPrize(challenge.prizePool, challenge.prizeCurrency)}</p>
          </div>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-bold text-accent-text dark:bg-accent/15 dark:text-accent">
            <ShieldCheck size={12} /> Hosted by PitchNest
          </span>
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
            Pitch competition
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
              open ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                : challenge.phase === "upcoming" ? "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                : "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400",
            )}
          >
            {PHASE_LABELS[challenge.phase]}
          </span>
        </div>
        <h2 className={cn("mt-3 font-extrabold text-slate-950 dark:text-white", featured ? "text-xl sm:text-2xl" : "text-base")}>{item.title}</h2>
        <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-zinc-400">by {item.organizer}</p>
        {challenge.tagline && <p className="mt-2 text-sm font-bold text-indigo-700 dark:text-indigo-300">{challenge.tagline}</p>}
        {featured && item.summary && <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-zinc-300">{item.summary}</p>}

        <dl className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-zinc-800/60">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prize pool</dt>
            <dd className="mt-0.5 text-lg font-extrabold text-slate-950 dark:text-white">{formatPrize(challenge.prizePool, challenge.prizeCurrency)}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-zinc-800/60">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Deadline</dt>
            <dd className="mt-0.5 flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-zinc-200">
              <CalendarDays size={13} className="shrink-0" /> <span>{deadlineLabel(item) || "To be announced"}</span>
            </dd>
          </div>
        </dl>

        <div className="mt-auto pt-5">
          <Link to={href} className={cn("w-full px-4 py-2.5", open ? "btn-primary" : "btn-secondary")}>
            {open ? "Participate now" : "View challenge"} <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}
