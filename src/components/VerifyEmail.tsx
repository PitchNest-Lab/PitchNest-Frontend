import React, { useState, useEffect } from "react";
import { Link, replace, useLocation, useNavigate } from "react-router-dom";
import {
  Mail,
  RefreshCw,
  Clock,
  CheckCircle,
  Loader2,
  XCircle,
} from "lucide-react";
import { LogoLink } from "../components/Logo";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  {
    num: 1,
    label: "Open the email",
    detail: (
      <>
        from <span className="text-sky-500 font-bold">hello@pitchnest.io</span>{" "}
        — check spam if you don't see it
      </>
    ),
  },
  {
    num: 2,
    label: 'Click "Verify my email"',
    detail: "in the email to confirm your address",
  },
  {
    num: 3,
    label: "You'll be logged in",
    detail: "and taken straight to your dashboard",
  },
];

// Full screen loader shown while verifying token
function TokenVerifyingScreen() {
  return (
    <motion.div
      key="verifying"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#FAFBFC] dark:bg-[#09090B] flex flex-col items-center justify-center gap-5 transition-colors duration-300"
    >
      <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center mb-2">
        <Loader2 className="text-sky-500 animate-spin" size={32} />
      </div>
      <h2 className="text-xl font-semibold text-slate-800 dark:text-zinc-100">
        Verifying your email…
      </h2>
      <p className="text-sm text-slate-400 dark:text-zinc-500">
        Hang tight, this takes just a second.
      </p>
    </motion.div>
  );
}

// Shown if token is invalid or expired
function TokenErrorScreen({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const navigate = useNavigate();
  return (
    <motion.div
      key="error"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#FAFBFC] dark:bg-[#09090B] flex items-center justify-center p-6 transition-colors duration-300"
    >
      <div className="w-full max-w-[420px] card rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-black/20 p-8 md:p-10 text-center">
        <LogoLink showText size="md" className="mb-8 justify-center" />

        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mx-auto mb-5">
          <XCircle className="text-rose-500" size={32} strokeWidth={1.5} />
        </div>

        <h2 className="text-2xl font-semibold text-slate-900 dark:text-zinc-100 mb-2 tracking-tight">
          Link{" "}
          {message.toLowerCase().includes("expire") ? "expired" : "invalid"}
        </h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mb-8 leading-relaxed">
          {message}. Request a new verification link below.
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="w-full flex items-center justify-center gap-2 py-3.5 btn-primary text-sm rounded-xl mb-4"
        >
          <RefreshCw size={15} />
          Resend verification email
        </button>

        <button
          type="button"
          onClick={() => navigate("/signup")}
          className="w-full flex items-center justify-center gap-2 py-3 border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 font-semibold text-sm rounded-xl transition-all duration-150"
        >
          Back to sign up
        </button>
      </div>
    </motion.div>
  );
}

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email =
    location.state?.email || sessionStorage.getItem("verifyEmail") || "";

  // "idle"      → no token in URL, show email sent screen
  // "verifying" → token found, API call in progress
  // "error"     → token invalid or expired
  const [status, setStatus] = useState<"idle" | "verifying" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) return; // no token → stay on email sent screen

    setStatus("verifying");

    fetch(`/api/auth/verify-email?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.message === "Email verified successfully") {
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.setItem("token", data.token);
          if (data.onboardingCompleted) {
            navigate("/dashboard", { replace: true });
          } else {
            navigate("/onboarding", { replace: true });
          }
        } else {
          setErrorMessage(data.message);
          setStatus("error");
        }
      })
      .catch(() => {
        setErrorMessage("Something went wrong");
        setStatus("error");
      });
  }, []);

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setResent(true);
        setStatus("idle"); // go back to email sent screen
        setTimeout(() => setResent(false), 4000);
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {status === "verifying" && <TokenVerifyingScreen key="verifying" />}

      {status === "error" && (
        <TokenErrorScreen
          key="error"
          message={errorMessage}
          onRetry={handleResend}
        />
      )}

      {status === "idle" && (
        <motion.div
          key="idle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="min-h-[80vh] bg-[#FAFBFC] dark:bg-[#09090B] flex items-center justify-center p-6 font-sans transition-colors duration-300"
        >
          <div className="w-full max-w-[480px] card rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden transition-colors">
            <div className="px-8 md:p-12">
              <LogoLink showText size="md" className="mb-10" />

              {/* Sent badge */}
              <div className="flex justify-center mb-5">
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full px-3.5 py-1.5">
                  <CheckCircle size={13} />
                  Email sent
                </span>
              </div>

              {/* Heading */}
              <h2 className="text-3xl font-semibold text-slate-900 dark:text-zinc-100 mb-2 tracking-tight text-center">
                Check your inbox
              </h2>
              <p className="text-slate-500 dark:text-zinc-500 text-sm text-center mb-1">
                We sent a verification link to
              </p>
              <p className="text-sky-500 font-bold text-sm text-center mb-8">
                {email}
              </p>

              {/* Steps */}
              <div className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl p-5 mb-6 space-y-4">
                {steps.map((s) => (
                  <div key={s.num} className="flex items-start gap-3">
                    <span className="w-6 h-6 min-w-[24px] rounded-full bg-sky-500 text-white text-[11px] font-bold flex items-center justify-center mt-0.5">
                      {s.num}
                    </span>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                      <span className="font-bold text-slate-700 dark:text-zinc-200">
                        {s.label}
                      </span>{" "}
                      {s.detail}
                    </p>
                  </div>
                ))}
              </div>

              {/* Open Gmail */}
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3.5 btn-primary text-sm mb-4 rounded-xl"
              >
                <Mail size={15} />
                Open Gmail
              </a>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-slate-200 dark:bg-zinc-700" />
                <span className="text-[11px] text-slate-400 dark:text-zinc-600">
                  or
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-zinc-700" />
              </div>

              {/* Resend */}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || resent}
                className="w-full flex items-center justify-center gap-2 py-3 border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 font-semibold text-sm rounded-xl transition-all duration-150 disabled:opacity-60 mb-5"
              >
                {resending ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Sending…
                  </>
                ) : resent ? (
                  <>
                    <CheckCircle size={15} className="text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Sent! Check your inbox
                    </span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={15} />
                    Resend verification email
                  </>
                )}
              </button>

              {/* Footer */}
              <p className="text-center text-xs text-slate-500 dark:text-zinc-500 mb-3">
                Wrong email?{" "}
                <Link
                  to="/signup"
                  className="text-sky-500 font-bold hover:text-sky-600"
                >
                  Change email address
                </Link>
              </p>
              <p className="flex items-center justify-center gap-1 text-[11px] text-slate-400 dark:text-zinc-600 pb-2">
                <Clock size={12} />
                Link expires in 24 hours
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
