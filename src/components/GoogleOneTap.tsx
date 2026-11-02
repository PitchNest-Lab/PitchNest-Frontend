import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { clearAuthSession } from "../lib/authStorage";
import { useCookieBannerOpen } from "../lib/adsConsent";
import { GOOGLE_CLIENT_ID, loadGsiScript } from "./GoogleSignInButton";

// Pages with their own Google button, or an auth step in progress.
const SKIPPED_PATHS = new Set([
  "/login",
  "/signup",
  "/organization-login",
  "/forgot-password",
  "/reset-password",
  "/verify",
  "/delete-account",
  "/onboarding",
  "/room",
  "/billing/return",
]);

function skipped(pathname: string): boolean {
  // Shared pitch reports are read by investors, not people joining PitchNest.
  return SKIPPED_PATHS.has(pathname) || pathname.startsWith("/share/");
}

let promptedThisVisit = false;

/**
 * Google One Tap: offers signed-out visitors "Sign up with Google" with the
 * Google accounts already in their browser (top right on desktop). The
 * credential goes through the same /api/auth/google exchange as the Google
 * button, so new accounts land on onboarding and returning founders stay put.
 *
 * Prompted at most once per visit; Google itself backs off after a visitor
 * closes it. On phones it waits for the cookie banner, which Google's bottom
 * sheet would cover.
 */
export function GoogleOneTap() {
  const { user, isLoading, loginWithGoogle } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const cookieBannerOpen = useCookieBannerOpen();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  const eligible = Boolean(GOOGLE_CLIENT_ID) && !isLoading && !user && !skipped(pathname);
  const waitForBanner = cookieBannerOpen && window.matchMedia("(max-width: 1023px)").matches;

  // Google's callback is registered once, so it reads the latest values here.
  const latest = useRef({ eligible, loginWithGoogle, navigate });
  latest.current = { eligible, loginWithGoogle, navigate };

  useEffect(() => {
    if (!eligible) {
      // Close an open prompt when the visitor signs in another way or opens an auth page.
      if (promptedThisVisit) (window as any).google?.accounts?.id?.cancel();
      return;
    }
    if (waitForBanner || promptedThisVisit) return;
    promptedThisVisit = true;

    const signIn = async (credential: string) => {
      setError("");
      setSigningIn(true);
      try {
        // Same clean-up as the Google buttons on the sign-in and sign-up pages.
        clearAuthSession();
        localStorage.removeItem("pitchnest_onboarding_complete");
        localStorage.removeItem("pitchnest_startup_name");
        localStorage.removeItem("pitchnest_funding_stage");
        const data = await latest.current.loginWithGoogle(credential);
        // "/" forwards signed-in founders to /home by itself.
        if (data?.redirectTo === "/onboarding") latest.current.navigate("/onboarding", { replace: true });
      } catch (err: any) {
        setError(err?.message || "Google sign-in failed.");
      } finally {
        setSigningIn(false);
      }
    };

    loadGsiScript()
      .then(() => {
        // Never initialize on a page whose own Google button owns the callback.
        if (!latest.current.eligible) {
          promptedThisVisit = false;
          return;
        }
        const id = (window as any).google.accounts.id;
        id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (resp: { credential?: string }) => {
            if (resp?.credential) void signIn(resp.credential);
          },
          context: "signup",
          cancel_on_tap_outside: true,
          itp_support: true,
          use_fedcm_for_prompt: true,
        });
        id.prompt();
      })
      .catch(() => {
        // Google unavailable: the sign-up page still offers every option.
      });
  }, [eligible, waitForBanner]);

  if (signingIn) {
    return (
      <div
        role="status"
        className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm"
      >
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-zinc-400">Signing in with Google…</p>
      </div>
    );
  }

  if (!error) return null;

  return (
    <div
      role="alert"
      className="fixed top-4 inset-x-4 sm:left-auto sm:w-96 z-[70] bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/50 rounded-2xl shadow-2xl p-4 flex items-start gap-3"
    >
      <p className="flex-1 text-sm font-semibold text-rose-600 dark:text-rose-400">
        {error}{" "}
        <Link
          to="/login"
          onClick={() => setError("")}
          className="text-sky-600 dark:text-sky-400 hover:underline"
        >
          Log in
        </Link>
      </p>
      <button
        type="button"
        onClick={() => setError("")}
        aria-label="Dismiss"
        className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 shrink-0"
      >
        <X size={18} />
      </button>
    </div>
  );
}
