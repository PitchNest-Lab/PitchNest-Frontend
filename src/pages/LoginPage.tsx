import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  MailCheck,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { LogoLink } from "../components/Logo";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { GoogleSignInButton } from "../components/GoogleSignInButton";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const SLIDES = [
  {
    image:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&w=800&q=80",
    title: "The AI Pitch Deck Evolution",
    desc: "Join 10,000+ founders using PitchNest to refine their narratives with real-time AI feedback.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80",
    title: "Nail Your Delivery",
    desc: "Practice with multimodal AI investors that simulate high-pressure venture capital environments.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
    title: "Actionable Insights",
    desc: "Get deep analytics on your pacing, clarity, and scalability after every single session.",
  },
];

// ─── Email Not Verified Popup ───────────────────────────────────────────────
function EmailNotVerifiedPopup({
  email,
  onClose,
  onResendAndRedirect,
}: {
  email: string;
  onClose: () => void;
  onResendAndRedirect: () => Promise<void>;
}) {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [timer, setTimer] = useState(0);

  const handleResend = async () => {
    setResending(true);
    await onResendAndRedirect();
    setResending(false);
    setResent(true);
    setTimer(60);
  };
  useEffect(() => {
    if (timer <= 0) {
      setResent(false);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  return (
    // Backdrop
    <motion.div
      key="backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
    >
      {/* Card — stop click propagation so clicking inside doesn't close */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-[420px] card rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-black/40 p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mx-auto mb-5">
          <MailCheck className="text-amber-500" size={30} strokeWidth={1.5} />
        </div>

        {/* Text */}
        <h3 className="text-xl font-semibold text-slate-900 dark:text-zinc-100 mb-2 tracking-tight">
          Verify your email first
        </h3>
        <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed mb-1">
          We sent a verification link to
        </p>
        <p className="text-sky-500 font-bold text-sm mb-6">{email}</p>

        <p className="text-xs text-slate-400 dark:text-zinc-500 leading-relaxed mb-7">
          Check your inbox (and spam folder) for the link. Click below to resend
          it and we'll take you straight to the verify screen.
        </p>

        {/* Resend + redirect CTA */}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || resent}
          className="w-full flex items-center justify-center gap-2 py-3.5 btn-primary text-sm rounded-xl mb-3 disabled:opacity-60"
        >
          {resending ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Sending...
            </>
          ) : timer > 0 ? (
            <>
              <CheckCircle size={15} />
              Resend in {timer}s
            </>
          ) : (
            <>
              <RefreshCw size={15} />
              Resend verification email
            </>
          )}
        </button>

        {/* Dismiss */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 text-sm text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
        >
          I'll do it later
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Login Page ──────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

  // Unverified popup state
  const [showUnverifiedPopup, setShowUnverifiedPopup] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    const timer = setInterval(
      () => setCurrentSlide((prev) => (prev + 1) % SLIDES.length),
      5000,
    );
    return () => clearInterval(timer);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setServerError("");
    try {
      // Clear only auth-related keys — preserve tour flags (pn_tour_*) so
      // returning users don't get re-shown the walkthrough on every login.
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("pitchnest_onboarding_complete");
      localStorage.removeItem("pitchnest_startup_name");
      localStorage.removeItem("pitchnest_funding_stage");
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (error: any) {
      // Check if the error is about email not being verified
      if (
        error.message?.toLowerCase().includes("not verified") ||
        error.isEmailVerified === false
      ) {
        setUnverifiedEmail(data.email);
        setShowUnverifiedPopup(true);
      } else {
        setServerError(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend verification email then redirect to /verify
  const handleResendAndRedirect = async () => {
    console.log("Before resend");
    let res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email: unverifiedEmail }),
      headers: { "Content-Type": "application/json" },
    });
    console.log("After resend", res.status);
    console.log(showUnverifiedPopup);
    // // Small delay so user sees "Sent!" state before redirect
    // await new Promise((r) => setTimeout(r, 900));
    // sessionStorage.setItem("verifyEmail", unverifiedEmail);
    // navigate("/verify", { state: { email: unverifiedEmail } });
  };

  return (
    <>
      {/* ── Email not verified popup ── */}
      <AnimatePresence>
        {showUnverifiedPopup && (
          <EmailNotVerifiedPopup
            email={unverifiedEmail}
            onClose={() => setShowUnverifiedPopup(false)}
            onResendAndRedirect={handleResendAndRedirect}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-[#FAFBFC] dark:bg-[#09090B] flex items-center justify-center p-6 font-sans transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[1000px] card rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden flex flex-col lg:flex-row transition-colors"
        >
          <div className="flex-1 p-8 md:p-16">
            <LogoLink showText size="md" className="mb-12" />

            <h2 className="text-3xl font-semibold text-slate-900 dark:text-zinc-100 mb-2 tracking-tight">
              Welcome back
            </h2>
            <p className="text-slate-500 dark:text-zinc-500 mb-10">
              Sign in to continue to your workspace
            </p>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {serverError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-sm font-bold">
                  {serverError}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500"
                    size={18}
                  />
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="you@startup.com"
                    className={cn(
                      "w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-zinc-800 border rounded-2xl focus:outline-none focus:ring-2 transition-all dark:text-zinc-100",
                      errors.email
                        ? "border-rose-500 focus:ring-rose-500/20"
                        : "border-slate-200 dark:border-zinc-700 focus:ring-sky-500/20",
                    )}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs font-bold text-rose-500">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-sky-500 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500"
                    size={18}
                  />
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={cn(
                      "w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-zinc-800 border rounded-2xl focus:outline-none focus:ring-2 transition-all dark:text-zinc-100",
                      errors.password
                        ? "border-rose-500 focus:ring-rose-500/20"
                        : "border-slate-200 dark:border-zinc-700 focus:ring-sky-500/20",
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs font-bold text-rose-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 btn-primary text-base group disabled:opacity-50 disabled:hover:transform-none"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    Login{" "}
                    <ArrowRight
                      size={18}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100 dark:border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold text-slate-400 dark:text-zinc-500">
                <span className="bg-white dark:bg-zinc-900 px-4">
                  Or continue with
                </span>
              </div>
            </div>

            <GoogleSignInButton
              onCredential={async (credential) => {
                setServerError("");
                try {
                  // Clear only auth-related keys — preserve tour flags
                  localStorage.removeItem("user");
                  localStorage.removeItem("token");
                  localStorage.removeItem("pitchnest_onboarding_complete");
                  localStorage.removeItem("pitchnest_startup_name");
                  localStorage.removeItem("pitchnest_funding_stage");
                  const data = await loginWithGoogle(credential);
                  // New Google users land on onboarding (server decides via
                  // redirectTo); returning users go to their intended page.
                  navigate(data?.redirectTo || from, { replace: true });
                } catch (error: any) {
                  setServerError(error.message || "Google sign-in failed.");
                }
              }}
              onError={(message) => setServerError(message)}
            />

            <p className="text-center mt-10 text-sm text-slate-500 dark:text-zinc-500">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-700"
              >
                Sign up
              </Link>
            </p>
            <p className="text-center mt-4 text-[10px] text-slate-400 dark:text-zinc-600 leading-relaxed">
              <Link to="/privacy" className="hover:underline">
                Privacy
              </Link>
              {" · "}
              <Link to="/terms" className="hover:underline">
                Terms
              </Link>
              {" · "}
              <Link to="/support" className="hover:underline">
                Support
              </Link>
            </p>
          </div>

          {/* Right Side: Image Carousel */}
          <div className="hidden lg:flex flex-1 gradient-mesh dark:from-zinc-800 dark:to-zinc-900 items-center justify-center p-16 relative overflow-hidden border-l border-slate-100 dark:border-zinc-800">
            <div className="relative z-10 text-center max-w-sm">
              <div className="rounded-[40px] overflow-hidden shadow-2xl shadow-sky-200 dark:shadow-black/20 border-8 border-white dark:border-zinc-900 mb-8 relative aspect-[3/4]">
                {SLIDES.map((slide, i) => (
                  <img
                    key={i}
                    src={slide.image}
                    alt="Slide"
                    referrerPolicy="no-referrer"
                    className={cn(
                      "absolute inset-0 w-full h-full object-cover transition-opacity duration-1000",
                      i === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0",
                    )}
                  />
                ))}
              </div>
              <div className="h-24">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-3">
                  {SLIDES[currentSlide].title}
                </h3>
                <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed">
                  {SLIDES[currentSlide].desc}
                </p>
              </div>
              <div className="mt-8 flex justify-center gap-2">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentSlide(i)}
                    className={cn(
                      "h-2 rounded-full transition-all outline-none",
                      i === currentSlide
                        ? "w-6 gradient-brand"
                        : "w-2 bg-slate-200 dark:bg-zinc-700",
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />
          </div>
        </motion.div>
      </div>
    </>
  );
}
