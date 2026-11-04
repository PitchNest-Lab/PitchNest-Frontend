import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, Loader2, Plus, ShieldAlert, Trophy, Users } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { createStaffChallenge, fetchStaffChallenges, formatPrize, PHASE_LABELS, type StaffChallenge } from "../../api/challenges";
import { cn } from "../../lib/utils";

export const CHALLENGE_STATUS_STYLES: Record<StaffChallenge["status"], string> = {
  draft: "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300",
  published: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  open: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  closed: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  judging: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
  completed: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
  cancelled: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
};

export function StaffNav({ current }: { current: "moderation" | "opportunities" | "analytics" | "challenges" }) {
  const links = [
    ["challenges", "/staff/challenges", "Challenges"],
    ["opportunities", "/staff/opportunities", "Opportunities"],
    ["moderation", "/staff/moderation", "Moderation"],
    ["analytics", "/staff/analytics", "Analytics"],
  ] as const;
  return (
    <>
      {links.filter(([key]) => key !== current).map(([key, to, label]) => (
        <Link key={key} to={to} className="btn-secondary px-4 py-2 text-sm">{label}</Link>
      ))}
    </>
  );
}

/** Staff-only list of hosted challenges. The API 404s for everyone else. */
export default function ChallengesAdmin() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<StaffChallenge[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "forbidden" | "error">("loading");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      setItems(await fetchStaffChallenges(authFetch));
      setStatus("ready");
    } catch (err: any) {
      setStatus(err?.status === 404 ? "forbidden" : "error");
    }
  }, [authFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  // A new challenge starts as a draft with placeholders; everything is edited next.
  const create = async () => {
    setCreating(true);
    setError("");
    try {
      const start = new Date(Date.now() + 7 * 86_400_000);
      const deadline = new Date(Date.now() + 21 * 86_400_000);
      const created = await createStaffChallenge(authFetch, {
        title: "New challenge",
        organizer: "PitchNest",
        tagline: "Describe the challenge in one line.",
        description: "Describe the challenge, what founders do and what they can win.",
        prizeCurrency: "NGN",
        prizes: [10000],
        startsAt: start.toISOString(),
        submissionDeadline: deadline.toISOString(),
      });
      navigate(`/staff/challenges/${created.id}`);
    } catch (err: any) {
      setError(err?.message || "Couldn't create a challenge.");
      setCreating(false);
    }
  };

  if (status === "forbidden") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <ShieldAlert size={32} className="mx-auto text-slate-300" />
        <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-zinc-100">This area isn't available</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">Challenges are managed by PitchNest staff.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Staff</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-950 dark:text-white">Challenges</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Competitions PitchNest runs itself: rules, entries, judging and winners.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StaffNav current="challenges" />
          <button type="button" onClick={() => void create()} disabled={creating} className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-60">
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} New challenge
          </button>
        </div>
      </div>
      {error && <p className="mt-4 text-sm text-rose-600" role="alert">{error}</p>}

      <div className="mt-6 space-y-3">
        {status === "loading" && <p className="flex items-center gap-2 py-10 text-sm text-slate-400"><Loader2 size={16} className="animate-spin" /> Loading…</p>}
        {status === "error" && <p className="py-10 text-sm text-rose-600">Challenges couldn't load. If this is a new environment, run migration 0038 first.</p>}
        {status === "ready" && items.length === 0 && <p className="py-10 text-sm text-slate-500 dark:text-zinc-400">No challenges yet.</p>}
        {status === "ready" && items.map((item) => {
          const pool = item.prizes.reduce((sum, prize) => sum + prize.amount, 0);
          const pending = item.confirmations.filter((c) => !c.confirmed).length;
          return (
            <Link
              key={item.id}
              to={`/staff/challenges/${item.id}`}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:p-5"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500">
                {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : <Trophy size={20} className="text-accent" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize", CHALLENGE_STATUS_STYLES[item.status])}>{item.status}</span>
                  {item.phase !== "draft" && <span className="text-[11px] font-semibold text-slate-400">Founders see "{PHASE_LABELS[item.phase]}"</span>}
                  {pending > 0 && item.status === "draft" && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                      {pending} part{pending === 1 ? "" : "s"} of the rules to confirm
                    </span>
                  )}
                  {item.resultsPublishedAt && <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">Results published</span>}
                </div>
                <h2 className="mt-1 truncate text-base font-extrabold text-slate-950 dark:text-white">{item.title}</h2>
                <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-zinc-400">
                  <span>{formatPrize(pool, item.prizeCurrency)} prize pool</span>
                  {item.submissionDeadline && (
                    <span className="inline-flex items-center gap-1"><CalendarDays size={12} /> Deadline {new Date(item.submissionDeadline).toLocaleString()}</span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Users size={12} /> {item.counts.total ?? 0} joined · {(item.counts.submitted ?? 0) + (item.counts.approved ?? 0)} submitted · {item.counts.approved ?? 0} approved
                  </span>
                </p>
              </div>
              <span className="btn-secondary shrink-0 px-4 py-2 text-xs">Manage</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
