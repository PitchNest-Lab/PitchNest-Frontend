import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  CalendarDays,
  Check,
  Copy,
  Crown,
  ExternalLink,
  Image as ImageIcon,
  Layers,
  Loader2,
  Megaphone,
  Mic,
  Send,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { usePageMetadata } from "../hooks/usePageMetadata";
import { rememberChallengeReturn, markChallengeJoined } from "../lib/challengeReturn";
import { cn } from "../lib/utils";
import { ChallengeEntryPanel } from "../components/challenges/ChallengeEntryPanel";
import {
  ApiError,
  challengePosterUrl,
  fetchChallenge,
  fetchChallengePreview,
  fetchMyEntry,
  formatDateTime,
  formatDay,
  formatPrize,
  joinChallenge,
  PHASE_LABELS,
  placeLabel,
  type ChallengeEntry,
  type EntryState,
  type PublicChallenge,
} from "../api/challenges";

const MEDALS = ["🥇", "🥈", "🥉"];

function useCountdown(deadline: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  if (!deadline) return "";
  const ms = Date.parse(deadline) - now;
  if (ms <= 0) return "";
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  return days > 0 ? `${days} day${days === 1 ? "" : "s"} ${hours} h left` : `${hours} h ${Math.floor((ms % 3_600_000) / 60_000)} min left`;
}

function TextBlock({ text }: { text: string }) {
  return <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600 dark:text-zinc-300">{text}</div>;
}

/**
 * A challenge PitchNest hosts: the rules and prizes for everyone, and, for a
 * signed-in founder, their own entry. Visitors are taken through sign-up or
 * log-in and brought back here.
 */
export default function ChallengePage() {
  const { slug = "" } = useParams();
  const { user, authFetch, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const founder = Boolean(user && user.accountType !== "organization");

  const [challenge, setChallenge] = useState<PublicChallenge | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [entry, setEntry] = useState<EntryState | null>(null);
  const [entryError, setEntryError] = useState("");
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const countdown = useCountdown(challenge?.phase === "open" ? challenge.submissionDeadline : null);
  const posterUrl = challenge ? challengePosterUrl(challenge) : null;

  usePageMetadata({
    title: challenge ? `${challenge.title} — PitchNest` : "Challenge — PitchNest",
    description: challenge?.tagline || "A pitch competition hosted by PitchNest.",
    path: `/opportunities/challenges/${slug}`,
    robots: challenge?.preview ? "noindex, nofollow" : "index, follow",
    ...(posterUrl ? { image: posterUrl } : {}),
  });

  useEffect(() => {
    if (authLoading) return;
    const controller = new AbortController();
    setStatus("loading");
    fetchChallenge(slug, controller.signal)
      .then((data) => {
        setChallenge(data);
        setStatus("ready");
      })
      .catch(async (error) => {
        if (error?.name === "AbortError") return;
        // Staff may open a challenge before it is public.
        if (error instanceof ApiError && error.status === 404 && founder) {
          try {
            setChallenge(await fetchChallengePreview(authFetch, slug));
            setStatus("ready");
            return;
          } catch {
            // Not staff, or not there.
          }
        }
        setStatus(error instanceof ApiError && error.status === 404 ? "missing" : "error");
      });
    return () => controller.abort();
  }, [slug, authLoading, founder, authFetch]);

  const loadEntry = useCallback(async () => {
    if (!founder || !challenge || challenge.preview) {
      setEntry(null);
      return;
    }
    try {
      const data = await fetchMyEntry(authFetch, slug);
      setEntry(data);
      setEntryError("");
      if (data.joined) markChallengeJoined(slug);
    } catch (error: any) {
      setEntryError(error?.message || "Your entry couldn't load.");
    }
  }, [founder, challenge, authFetch, slug]);

  useEffect(() => {
    void loadEntry();
  }, [loadEntry]);

  // A visitor who signs up from here, by any route (the buttons, the header,
  // Google One Tap), comes back here after onboarding.
  useEffect(() => {
    if (!authLoading && !founder && challenge && !challenge.preview) rememberChallengeReturn(location.pathname);
  }, [authLoading, founder, challenge, location.pathname]);

  // Opened from a notification or a link to #my-entry or #results.
  useEffect(() => {
    if (!location.hash || status !== "ready") return;
    const target = document.getElementById(location.hash.slice(1));
    if (target) window.setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  }, [location.hash, status, entry?.joined]);

  const join = async () => {
    setJoining(true);
    setEntryError("");
    try {
      const data = await joinChallenge(authFetch, slug);
      setEntry(data);
      markChallengeJoined(slug);
      window.setTimeout(() => document.getElementById("my-entry")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (error: any) {
      setEntryError(error?.message || "Couldn't join. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  const signUp = () => {
    rememberChallengeReturn(location.pathname);
    navigate("/signup");
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the code is on screen to type.
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-slate-400">
        <Loader2 size={18} className="mr-2 animate-spin" /> Loading the challenge…
      </div>
    );
  }
  if (status !== "ready" || !challenge) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <Trophy size={32} className="mx-auto text-slate-300" />
        <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-zinc-100">
          {status === "missing" ? "This challenge isn't available" : "The challenge couldn't load"}
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
          {status === "missing" ? "It may not be announced yet." : "Please check your connection and try again."}
        </p>
        <Link to="/opportunities" className="btn-secondary mt-6 px-5 py-2.5 text-sm">See all opportunities</Link>
      </div>
    );
  }

  const joined = entry?.joined === true ? (entry as ChallengeEntry) : null;
  const open = challenge.phase === "open";
  const discount = challenge.discount;
  const pricingLink = `/pricing?plan=pro${discount?.active ? `&code=${encodeURIComponent(discount.code)}` : ""}`;
  const firstHandle = challenge.socialHandles[0]?.handle;

  const cta = (() => {
    if (challenge.preview) return null;
    if (!founder) {
      if (!open) return null;
      return (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={signUp} className="btn-primary px-6 py-3">
            Sign up to join <ArrowRight size={16} />
          </button>
          <Link to="/login" state={{ from: location }} className="btn-secondary px-6 py-3">
            I have an account — log in
          </Link>
        </div>
      );
    }
    if (joined) {
      return (
        <a href="#my-entry" className="btn-primary px-6 py-3">
          View my entry <ArrowRight size={16} />
        </a>
      );
    }
    if (open) {
      return (
        <button type="button" onClick={() => void join()} disabled={joining || entry === null} className="btn-primary px-6 py-3 disabled:opacity-60">
          {joining ? <Loader2 size={16} className="animate-spin" /> : <Trophy size={16} />} Join challenge
        </button>
      );
    }
    return null;
  })();

  const steps = [
    {
      icon: Crown,
      title: "Subscribe to Pro Founder",
      body: discount ? (
        <>
          Subscribe to PitchNest Pro Founder with code{" "}
          <button
            type="button"
            onClick={() => void copyCode(discount.code)}
            className="inline-flex items-center gap-1 rounded-md bg-accent px-1.5 py-0.5 font-mono text-xs font-extrabold text-accent-ink"
            title="Copy the code"
          >
            {discount.code} {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>{" "}
          for {discount.percentOff}% off your first {discount.terms.includes("annual") && !discount.terms.includes("monthly") ? "year" : "month"}.
          {!discount.active && " The code isn't active yet."}
        </>
      ) : (
        "Subscribe to PitchNest Pro Founder. The free trial doesn't count."
      ),
      action: founder && joined?.subscription.state === "missing" && joined.editable ? (
        <Link to={pricingLink} onClick={() => rememberChallengeReturn(location.pathname)} className="btn-accent px-4 py-2 text-xs">
          {discount?.active ? `Subscribe with ${discount.code}` : "See plans"}
        </Link>
      ) : null,
    },
    {
      icon: Mic,
      title: "Practise your pitch",
      body: `Complete at least ${challenge.minCompletedSessions === 1 ? "one full AI investor pitch session" : `${challenge.minCompletedSessions} full AI investor pitch sessions`} (${challenge.eligibleSessionModes.map((m) => (m === "panel" ? "VC panel" : m === "solo" ? "solo investor" : "coach")).join(" or ")}). Practise as often as you like: your highest verified score counts.`,
      action: founder ? <Link to="/setup" className="btn-secondary px-4 py-2 text-xs">Start practising</Link> : null,
    },
    {
      icon: Layers,
      title: "Showcase your business",
      body: "Publish your business profile on PitchNest Discover with as much as you can: the problem, solution, target customers, market, business model, traction and anything else that helps.",
      action: founder ? <Link to="/workspace/businesses" className="btn-secondary px-4 py-2 text-xs">Open your workspace</Link> : null,
    },
    {
      icon: ImageIcon,
      title: "Share your best score",
      body: "Take a screenshot of your highest readiness score from a challenge session, on its PitchNest report.",
      action: null,
    },
    {
      icon: Megaphone,
      title: "Post it on social media",
      body: (
        <>
          Post the screenshot on Instagram, Facebook or X with your Discover profile link in the caption. Tag and follow PitchNest
          {firstHandle ? ` (${firstHandle})` : ""}, and invite PitchNest as a collaborator where the platform allows it.
        </>
      ),
      action: null,
    },
    {
      icon: Send,
      title: "Submit your entry",
      body: "Come back here, paste the public link to your post and submit. You can follow your status here.",
      action: null,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Link to="/opportunities" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-zinc-400">
        <ArrowLeft size={14} /> Opportunities
      </Link>

      {challenge.preview && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          Staff preview — this challenge isn't public yet ({PHASE_LABELS[challenge.phase]}). Founders can't see or join it.
        </div>
      )}

      {/* Hero */}
      <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-sm dark:border-indigo-950/60 dark:bg-zinc-900">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div className="bg-gradient-to-br from-indigo-700 to-sky-600">
            {posterUrl ? (
              <a href={posterUrl} target="_blank" rel="noopener noreferrer" aria-label="Open the poster full size">
                <img src={posterUrl} alt={`${challenge.title} poster`} className="mx-auto h-full max-h-[640px] w-full object-contain" />
              </a>
            ) : (
              <div className="flex h-full min-h-56 flex-col items-center justify-center gap-3 p-8 text-center text-white">
                <Trophy size={44} className="text-accent" />
                <p className="text-2xl font-extrabold">{challenge.title}</p>
                <p className="text-sm font-semibold text-white/80">{challenge.tagline}</p>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-5 p-5 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-bold text-accent-text dark:bg-accent/15 dark:text-accent">
                <ShieldCheck size={12} /> Hosted by {challenge.organizer}
              </span>
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">Pitch competition</span>
              <span className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                open ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300",
              )}>
                {PHASE_LABELS[challenge.phase]}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">{challenge.title}</h1>
              <p className="mt-2 text-lg font-bold text-indigo-700 dark:text-indigo-300">{challenge.tagline}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">{challenge.region}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-r from-amber-300 to-yellow-300 p-4 text-slate-950">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-800">Total prize pool</p>
              <p className="text-4xl font-extrabold">{formatPrize(challenge.prizePool, challenge.prizeCurrency)}</p>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-3 dark:bg-zinc-800/60">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Entry deadline</dt>
                <dd className="mt-0.5 font-bold text-slate-900 dark:text-zinc-100">{formatDateTime(challenge.submissionDeadline)}</dd>
                {countdown && <dd className="mt-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">{countdown}</dd>}
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 dark:bg-zinc-800/60">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Winners announced</dt>
                <dd className="mt-0.5 font-bold text-slate-900 dark:text-zinc-100">{formatDay(challenge.winnersAnnouncedOn) || "To be announced"}</dd>
                <dd className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">On PitchNest's official social media</dd>
              </div>
            </dl>
            {challenge.participantCount > 0 && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                <Users size={14} /> {challenge.participantCount} founder{challenge.participantCount === 1 ? " has" : "s have"} joined
              </p>
            )}
            {cta}
            {!open && !joined && !challenge.preview && (
              <p className="text-sm font-semibold text-slate-600 dark:text-zinc-300">
                {challenge.phase === "upcoming" ? "Entries open soon. Check back here." : challenge.phase === "cancelled" ? "This challenge was cancelled." : "Entries for this challenge have closed."}
              </p>
            )}
            {entryError && <p className="text-sm text-rose-600 dark:text-rose-400" role="alert">{entryError}</p>}
          </div>
        </div>
      </section>

      {/* Prizes */}
      <section>
        <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Prizes</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {challenge.prizes.map((prize) => (
            <div key={prize.place} className="rounded-2xl border border-slate-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-2xl" aria-hidden="true">{MEDALS[prize.place - 1] ?? "🏅"}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">{placeLabel(prize.place)}</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-950 dark:text-white">{formatPrize(prize.amount, challenge.prizeCurrency)}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">One prize per founder and per business.</p>
      </section>

      {joined && <ChallengeEntryPanel slug={slug} challenge={challenge} entry={joined} onChange={setEntry} />}

      {/* How to take part */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-7">
        <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">How to participate</h2>
        <ol className="mt-4 space-y-4">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-3 sm:gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-brand text-sm font-extrabold text-white">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-extrabold text-slate-950 dark:text-white">
                  <step.icon size={15} className="text-indigo-500" /> {step.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-zinc-300">{step.body}</p>
                {step.action && <div className="mt-2">{step.action}</div>}
              </div>
            </li>
          ))}
        </ol>
        {challenge.socialHandles.length > 0 && (
          <div className="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-zinc-800/60">
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Official PitchNest accounts</p>
            <ul className="mt-2 space-y-2">
              {challenge.socialHandles.map((handle) => (
                <li key={handle.platform} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <a href={handle.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400">
                    <AtSign size={14} /> {handle.label}: {handle.handle} <ExternalLink size={12} />
                  </a>
                  <span className="text-xs text-slate-500 dark:text-zinc-400">
                    {handle.collaboration === "supported"
                      ? "Tag, follow, and invite PitchNest as a collaborator."
                      : handle.collaboration === "limited"
                        ? "Tag and follow. Invite PitchNest as a collaborator if your post offers it."
                        : "Tag and follow. X has no collaborator posts, so we check your post by hand."}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {!founder && open && (
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={signUp} className="btn-primary px-5 py-2.5 text-sm">Create a free account to join</button>
            <Link to="/login" state={{ from: location }} className="btn-secondary px-5 py-2.5 text-sm">Log in</Link>
          </div>
        )}
        {founder && !joined && open && entry !== null && (
          <button type="button" onClick={() => void join()} disabled={joining} className="btn-primary mt-6 px-5 py-2.5 text-sm disabled:opacity-60">
            {joining ? <Loader2 size={15} className="animate-spin" /> : <Trophy size={15} />} Join challenge
          </button>
        )}
      </section>

      {/* Rules */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <h2 className="text-base font-extrabold text-slate-950 dark:text-white">About the challenge</h2>
          <div className="mt-2"><TextBlock text={challenge.description} /></div>
          {challenge.eligibility && (
            <>
              <h3 className="mt-5 text-sm font-extrabold text-slate-950 dark:text-white">Who can enter</h3>
              <div className="mt-1"><TextBlock text={challenge.eligibility} /></div>
            </>
          )}
          {challenge.requirements && (
            <>
              <h3 className="mt-5 text-sm font-extrabold text-slate-950 dark:text-white">Good to know</h3>
              <div className="mt-1"><TextBlock text={challenge.requirements} /></div>
            </>
          )}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <h2 className="text-base font-extrabold text-slate-950 dark:text-white">How winners are selected</h2>
          <div className="mt-3 flex h-3 overflow-hidden rounded-full" aria-hidden="true">
            <span className="bg-indigo-500" style={{ width: `${challenge.pitchWeight}%` }} />
            <span className="bg-amber-400" style={{ width: `${challenge.profileWeight}%` }} />
          </div>
          <p className="mt-2 text-xs font-bold text-slate-600 dark:text-zinc-300">
            <span className="text-indigo-600 dark:text-indigo-400">Pitch performance {challenge.pitchWeight}%</span> ·{" "}
            <span className="text-amber-600 dark:text-amber-400">Business profile {challenge.profileWeight}%</span>
          </p>
          {challenge.judgingCriteria && <div className="mt-3"><TextBlock text={challenge.judgingCriteria} /></div>}
          <p className="mt-3 text-xs text-slate-500 dark:text-zinc-400">
            Your pitch score is read from PitchNest's own reports. A screenshot is supporting evidence only and never changes your score.
          </p>
        </div>
      </section>

      {challenge.terms && (
        <details className="group rounded-3xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <summary className="cursor-pointer list-none text-base font-extrabold text-slate-950 marker:hidden dark:text-white">
            Terms and conditions <span className="text-xs font-semibold text-indigo-600 group-open:hidden dark:text-indigo-400">(read)</span>
          </summary>
          <div className="mt-3"><TextBlock text={challenge.terms} /></div>
        </details>
      )}

      {/* Results */}
      <section id="results" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-7">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-950 dark:text-white"><Trophy size={18} className="text-amber-500" /> Results</h2>
        {challenge.results && challenge.results.length > 0 ? (
          <ol className="mt-4 space-y-3">
            {challenge.results.map((result) => (
              <li key={result.place} className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-zinc-800/60">
                <span className="text-2xl" aria-hidden="true">{MEDALS[result.place - 1] ?? "🏅"}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">{placeLabel(result.place)}</p>
                  <p className="text-base font-extrabold text-slate-950 dark:text-white">
                    {result.businessSlug ? (
                      <Link to={`/businesses/${encodeURIComponent(result.businessSlug)}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                        {result.businessName}
                      </Link>
                    ) : result.businessName}
                  </p>
                  {result.founderName && <p className="text-xs text-slate-500 dark:text-zinc-400">{result.founderName}</p>}
                </div>
                <span className="text-lg font-extrabold text-slate-950 dark:text-white">{formatPrize(result.prize, challenge.prizeCurrency)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-slate-600 dark:text-zinc-300">
            Winners will be announced on PitchNest's official social media handles
            {challenge.winnersAnnouncedOn ? ` on ${formatDay(challenge.winnersAnnouncedOn)}` : ""}.
          </p>
        )}
      </section>
    </div>
  );
}
