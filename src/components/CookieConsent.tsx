import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";
import { setAdsChoice, startGoogleAds, useCookieBannerOpen } from "../lib/adsConsent";

/**
 * Opt-in banner for Google Ads cookies (see lib/adsConsent). Shown until the
 * visitor accepts or declines; the Privacy Policy's "Cookie choices" button
 * opens it again. Accept and Decline carry equal weight on purpose.
 */
export function CookieConsent() {
  const open = useCookieBannerOpen();

  useEffect(() => {
    startGoogleAds();
  }, []);

  if (!open) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[60] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none">
      <section
        aria-label="Cookie choices"
        className="pointer-events-auto mx-auto max-w-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
            <Cookie size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">Cookies for our ads</p>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              With your OK, Google Ads cookies tell us which of our ads bring people to PitchNest. They stay off
              unless you accept.{" "}
              <Link to="/privacy" className="font-medium text-sky-600 dark:text-sky-400 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setAdsChoice("denied")}
            className="flex-1 py-2.5 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-sm font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => setAdsChoice("granted")}
            className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold rounded-xl transition-colors"
          >
            Accept
          </button>
        </div>
      </section>
    </div>
  );
}
