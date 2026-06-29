import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

export interface TourStep {
  title: string;
  body: string;
}

const KEY_PREFIX = "pn_tour_";

/** Has the user already seen (or skipped) this tour? */
export function hasSeenTour(tourKey: string): boolean {
  try {
    return localStorage.getItem(KEY_PREFIX + tourKey) === "1";
  } catch {
    return true; // if storage is unavailable, don't nag
  }
}

/**
 * A lightweight, skippable "first time on this page" walkthrough. Shows a small
 * stepped card the first time a user lands on a given page, then never again
 * (remembered per `tourKey` in localStorage). Reuse it on any page by passing a
 * unique key + a few short steps. Purely informational — it blocks nothing and
 * can be skipped at any point.
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
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (steps.length > 0 && !hasSeenTour(tourKey)) setOpen(true);
  }, [tourKey, steps.length]);

  const finish = () => {
    try {
      localStorage.setItem(KEY_PREFIX + tourKey, "1");
    } catch {}
    setOpen(false);
  };

  if (steps.length === 0) return null;

  const isLast = index === steps.length - 1;
  const step = steps[index];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={finish}
        >
          <motion.div
            className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
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

            <motion.div
              key={index}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-zinc-100 mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                {step.body}
              </p>
            </motion.div>

            <div className="flex items-center justify-center gap-1.5 my-5">
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
}
