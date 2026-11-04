import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, CalendarDays, Trophy, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useCookieBannerOpen } from "../../lib/adsConsent";
import { hasJoinedChallenge } from "../../lib/challengeReturn";
import { challengePosterUrl, fetchChallengePromo, formatPrize, type ChallengePromo as Promo } from "../../api/challenges";

/**
 * The challenge pop-up: when someone opens the app while a challenge is
 * upcoming or open (and staff have its pop-up switched on), the poster appears
 * once per visit. Clicking it opens the challenge page, which takes visitors
 * through sign-up or log-in and back.
 *
 * It stays out of the way where an interruption would hurt: sign-in and
 * payment pages, the live pitch, staff tools, the challenge page itself, and
 * once this browser's founder has joined. On phones it waits for the cookie
 * banner, like Google One Tap, so only one thing asks at a time.
 */

const SEEN_KEY = "pitchnest.challengePromoSeen";
const QUIET_PATHS = [
  /^\/(login|signup|verify|forgot-password|reset-password|onboarding|organization-login|organization|delete-account)(\/|$)/,
  /^\/(room|live|setup|report|replay|billing|pricing|settings|staff|share)(\/|$)/,
  /^\/(privacy|terms|refunds|support)(\/|$)/,
  /^\/opportunities\/challenges\//,
];

function seenThisVisit(slug: string): boolean {
  try {
    return sessionStorage.getItem(SEEN_KEY) === slug;
  } catch {
    return false;
  }
}

function markSeen(slug: string) {
  try {
    sessionStorage.setItem(SEEN_KEY, slug);
  } catch {
    // Shown again on the next page load at worst.
  }
}

export function ChallengePromo() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const cookieBannerOpen = useCookieBannerOpen();
  const [promo, setPromo] = useState<Promo | null>(null);
  const [open, setOpen] = useState(false);
  const requested = useRef(false);
  const ctaRef = useRef<HTMLButtonElement>(null);

  const quietHere = QUIET_PATHS.some((pattern) => pattern.test(location.pathname));
  const organization = user?.accountType === "organization";
  const narrow = typeof window !== "undefined" && window.matchMedia?.("(max-width: 1023px)").matches;

  useEffect(() => {
    if (requested.current || isLoading || organization || quietHere) return;
    requested.current = true;
    const controller = new AbortController();
    fetchChallengePromo(controller.signal)
      .then((data) => {
        if (!data || seenThisVisit(data.slug) || hasJoinedChallenge(data.slug)) return;
        setPromo(data);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [isLoading, organization, quietHere]);

  useEffect(() => {
    if (!promo || open || quietHere || (narrow && cookieBannerOpen) || seenThisVisit(promo.slug)) return;
    const timer = window.setTimeout(() => {
      markSeen(promo.slug);
      setOpen(true);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [promo, open, quietHere, narrow, cookieBannerOpen]);

  useEffect(() => {
    if (!open) return;
    ctaRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open || !promo) return null;

  const posterUrl = challengePosterUrl(promo);
  const go = () => {
    setOpen(false);
    navigate(`/opportunities/challenges/${encodeURIComponent(promo.slug)}`);
  };
  const deadline = promo.submissionDeadline
    ? new Intl.DateTimeFormat(undefined, { day: "numeric", month: "long" }).format(new Date(promo.submissionDeadline))
    : "";

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="challenge-promo-title"
        className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/60 text-white transition hover:bg-slate-950/80"
        >
          <X size={18} />
        </button>
        <button type="button" onClick={go} className="block min-h-0 shrink overflow-hidden" aria-label={`Open the ${promo.title}`}>
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={`${promo.title}: ${promo.tagline}`}
              className="mx-auto max-h-[62vh] w-full object-contain"
            />
          ) : (
            <div className="gradient-brand flex flex-col items-center px-6 py-10 text-center text-white">
              <Trophy size={40} className="text-accent" />
              <p className="mt-4 text-2xl font-extrabold">{promo.title}</p>
              <p className="mt-1 text-sm font-semibold text-white/80">{promo.tagline}</p>
              <p className="mt-4 text-4xl font-extrabold text-accent">{formatPrize(promo.prizePool, promo.prizeCurrency)}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-white/70">in cash prizes</p>
            </div>
          )}
        </button>
        <div className="shrink-0 border-t border-slate-100 p-4 dark:border-zinc-800">
          <p id="challenge-promo-title" className="text-sm font-extrabold text-slate-950 dark:text-white">
            {promo.title} · {formatPrize(promo.prizePool, promo.prizeCurrency)} in prizes
          </p>
          {deadline && (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
              <CalendarDays size={13} />
              {promo.phase === "upcoming" ? "Opening soon" : `Enter by ${deadline}`}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button ref={ctaRef} type="button" onClick={go} className="btn-primary flex-1 px-4 py-2.5">
              {user ? "Join the challenge" : "See how to enter"} <ArrowRight size={16} />
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary px-4 py-2.5">
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
