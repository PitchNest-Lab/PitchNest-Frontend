import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export interface TourStep {
  title: string;
  body: string;
  /**
   * Optional CSS selector of the element this step points at. When present, the
   * page scrolls the element into view, dims everything else, highlights it, and
   * pins the instruction card next to it. When absent, the step shows as a
   * centered card (used for intro/outro steps).
   */
  target?: string;
}

const KEY_PREFIX = "pn_tour_";
const PAD = 6; // px of breathing room around a highlighted element
const CARD_W = 340;

/**
 * Build the full localStorage key for a tour, scoped to a specific user so
 * different accounts on the same browser each get their own tour state.
 */
function tourStorageKey(tourKey: string, userId?: number | string): string {
  return userId ? `${KEY_PREFIX}${userId}_${tourKey}` : `${KEY_PREFIX}${tourKey}`;
}

/** Has the user already seen (or skipped) this tour? */
export function hasSeenTour(tourKey: string, userId?: number | string): boolean {
  try {
    return (
      localStorage.getItem(tourStorageKey(tourKey, userId)) === "1" ||
      // Legacy completions written before the user became available were
      // stored under the unscoped key — honour them too.
      localStorage.getItem(tourStorageKey(tourKey)) === "1"
    );
  } catch {
    return true; // if storage is unavailable, don't nag
  }
}

/** Record that the user has seen this tour. */
export function markTourSeen(tourKey: string, userId?: number | string): void {
  try {
    localStorage.setItem(tourStorageKey(tourKey, userId), "1");
  } catch {}
}

// Tours already pushed to the account this session — avoids re-PATCHing the
// same key on every page visit while the in-memory user object is stale.
const syncedTours = new Set<string>();

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * A lightweight, skippable "first time on this page" walkthrough. Steps can
 * either point at a real element on the page (spotlight + anchored tip) or show
 * as a centered card. Shown once per `tourKey` per user (remembered in
 * localStorage, scoped by user ID). Purely guided via the controls — it blocks
 * accidental page interaction so a stray tap can't navigate away mid-tour, but
 * Skip/✕ always get you out.
 */
export function FirstTimeTour({
  tourKey,
  steps,
  eyebrow = "Quick tour",
}: {
  tourKey: string;
  steps: TourStep[];
  eyebrow?: string;
}) {
  const { user, authFetch } = useAuth();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Box | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardSize, setCardSize] = useState({ w: CARD_W, h: 200 });

  // Push a completed tour to the user's account settings so it never replays
  // on another device. Fire-and-forget; the server unions the array.
  const persistTourSeen = (key: string, userId: number | string) => {
    const syncKey = `${userId}_${key}`;
    if (syncedTours.has(syncKey)) return;
    syncedTours.add(syncKey);
    authFetch("/api/auth/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: { toursSeen: [key] } }),
    }).catch(() => syncedTours.delete(syncKey));
  };

  useEffect(() => {
    // Wait for the signed-in user to hydrate before deciding: checking while
    // `user` is still undefined reads the wrong (unscoped) key, which is what
    // made the tour reopen on every login.
    if (!user?.id || steps.length === 0) return;

    // Account-level record (cross-device): if this user completed the tour on
    // ANY device, never show it again — cache locally and stop.
    const accountSeen =
      Array.isArray(user.settings?.toursSeen) &&
      user.settings.toursSeen.includes(tourKey);
    if (accountSeen) {
      markTourSeen(tourKey, user.id);
      return;
    }

    if (hasSeenTour(tourKey, user.id)) {
      // Seen on this device before account sync existed — backfill the
      // account so the user's other devices don't replay it.
      persistTourSeen(tourKey, user.id);
      return;
    }

    // Mark seen the moment it opens — seeing a page's tour once is enough; it
    // must never return, however the user leaves it (skip, ✕, refresh, nav).
    markTourSeen(tourKey, user.id);
    persistTourSeen(tourKey, user.id);
    setOpen(true);
  }, [tourKey, steps.length, user?.id]);

  const step = steps[index];
  const target = step?.target;

  // Track the highlighted element's position (it moves while we scroll it into
  // view, and on resize/scroll). Falls back to a centered card if not found.
  useLayoutEffect(() => {
    if (!open) return;

    const read = (): Box | null => {
      if (!target) return null;
      const el = document.querySelector(target) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, left: r.left, width: r.width, height: r.height };
    };

    const update = () => setRect(read());

    if (target) {
      const el = document.querySelector(target) as HTMLElement | null;
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    update();

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    // Keep following during the smooth scroll for a moment.
    const iv = window.setInterval(update, 100);
    const stop = window.setTimeout(() => window.clearInterval(iv), 800);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.clearInterval(iv);
      window.clearTimeout(stop);
    };
  }, [open, index, target]);

  useLayoutEffect(() => {
    if (cardRef.current) {
      const r = cardRef.current.getBoundingClientRect();
      setCardSize({ w: r.width, h: r.height });
    }
  }, [index, rect, open]);

  if (steps.length === 0) return null;

  const finish = () => {
    try {
      localStorage.setItem(tourStorageKey(tourKey, user?.id), "1");
    } catch {}
    setOpen(false);
  };

  const isLast = index === steps.length - 1;

  // Position the instruction card: below the element if there's room, else above;
  // centered when there's no target. Always clamped to the viewport so it can
  // never spill off-screen on small phones.
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;
  // Never wider than the screen (minus a small gutter on each side).
  const cardW = Math.min(CARD_W, vw - 16);
  let cardStyle: React.CSSProperties;
  if (rect) {
    const belowTop = rect.top + rect.height + PAD + 12;
    const fitsBelow = belowTop + cardSize.h < vh - 8;
    const top = fitsBelow
      ? belowTop
      : Math.max(8, Math.min(rect.top - cardSize.h - PAD - 12, vh - cardSize.h - 8));
    let left = rect.left + rect.width / 2 - cardW / 2;
    left = Math.min(Math.max(8, left), Math.max(8, vw - cardW - 8));
    cardStyle = { position: "fixed", top, left, width: cardW };
  } else {
    // Center with px math (not a CSS transform): framer-motion's `y` animation
    // sets its own transform and would wipe out translate(-50%,-50%), pushing
    // the card off-screen on phones.
    cardStyle = {
      position: "fixed",
      top: Math.max(8, vh / 2 - cardSize.h / 2),
      left: Math.max(8, vw / 2 - cardW / 2),
      width: cardW,
    };
  }

  const tour = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          // Block page interaction behind the tour. Tapping the dim area advances
          // to the next step (or finishes on the last one). Skip/✕ exit early.
          onClick={() => (isLast ? finish() : setIndex((i) => i + 1))}
          style={{ background: rect ? "transparent" : "rgba(2,6,23,0.6)" }}
        >
          {/* Spotlight: a box-shadow ring dims everything outside the element. */}
          {rect && (
            <div
              className="pointer-events-none rounded-xl"
              style={{
                position: "fixed",
                top: rect.top - PAD,
                left: rect.left - PAD,
                width: rect.width + PAD * 2,
                height: rect.height + PAD * 2,
                boxShadow: "0 0 0 9999px rgba(2,6,23,0.6)",
                border: "2px solid rgb(56,189,248)",
                transition: "all 0.2s ease",
              }}
            />
          )}

          <motion.div
            ref={cardRef}
            key={index}
            style={cardStyle}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-bold uppercase tracking-widest">
                <Sparkles size={12} /> {eyebrow}
              </span>
              <button
                type="button"
                onClick={finish}
                aria-label="Skip"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X size={18} />
              </button>
            </div>

            <h3 className="text-base font-extrabold text-slate-900 dark:text-zinc-100 mb-1.5">
              {step.title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              {step.body}
            </p>

            <div className="flex items-center justify-center gap-1.5 my-4">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={
                    "h-1.5 rounded-full transition-all " +
                    (i === index
                      ? "w-6 bg-sky-500"
                      : "w-1.5 bg-slate-200 dark:bg-zinc-700")
                  }
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={finish}
                className="text-xs font-bold text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300"
              >
                Skip
              </button>
              <div className="flex items-center gap-2">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => setIndex((i) => i - 1)}
                    className="px-3 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-1"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => (isLast ? finish() : setIndex((i) => i + 1))}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-md flex items-center gap-1"
                >
                  {isLast ? "Got it" : "Next"}
                  {!isLast && <ChevronRight size={16} />}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(tour, document.body);
}
