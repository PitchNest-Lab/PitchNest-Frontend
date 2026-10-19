import { ArrowLeft, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { LogoLink } from "../components/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 dark:bg-zinc-950">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/20 sm:p-12">
        <LogoLink showText size="md" className="mb-10 justify-center" />
        <p className="eyebrow mb-3">404</p>
        <h1 className="font-display text-3xl font-semibold text-slate-950 dark:text-white">
          We couldn&apos;t find that page
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-zinc-400">
          The link may be out of date, or the address may have been typed incorrectly.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="btn-secondary inline-flex items-center justify-center gap-2 px-5 py-3"
          >
            <ArrowLeft size={16} /> Go back
          </button>
          <Link to="/" className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-3">
            <Home size={16} /> Home page
          </Link>
        </div>
      </div>
    </main>
  );
}
