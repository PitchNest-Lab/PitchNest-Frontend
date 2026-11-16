import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Loader2, LockKeyhole } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";

type InviteInfo = { email: string; role: string; organizationName: string };

export default function OrganizationInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { orgLogin } = useAuth();
  const [token] = useState(() => searchParams.get("token") || "");
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) window.history.replaceState(window.history.state, "", "/organization-invite");
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      setError("This invitation link is invalid.");
      setLoading(false);
      return;
    }
    let active = true;
    fetch(`/api/auth/organization-invite?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "This invitation is no longer available.");
        if (active) setInvite(body.data);
      })
      .catch((cause) => active && setError(cause instanceof Error ? cause.message : "Could not load invitation."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [token]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/organization-invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not accept this invitation.");
      await orgLogin(body.user.email, password, false);
      navigate("/organization", { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not accept this invitation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-8 shadow-xl">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white">
          <Building2 aria-hidden="true" />
        </div>
        {loading ? (
          <div className="flex items-center gap-3 text-slate-500"><Loader2 className="animate-spin" size={18} /> Loading invitation…</div>
        ) : invite ? (
          <>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Organization invitation</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Join {invite.organizationName}</h1>
            <p className="mt-2 text-sm text-slate-500">Set up your individual {invite.role} account. This invitation is for <strong>{invite.email}</strong>.</p>
            <form onSubmit={submit} className="mt-7 space-y-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Your name
                <input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={120} required autoComplete="name" className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-800 px-4 py-3" />
              </label>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Password
                <span className="relative mt-1 block">
                  <LockKeyhole size={16} className="absolute left-3 top-3.5 text-slate-400" />
                  <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={10} maxLength={72} required autoComplete="new-password" className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-800 py-3 pl-10 pr-4" />
                </span>
              </label>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Confirm password
                <input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} minLength={10} maxLength={72} required autoComplete="new-password" className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-800 px-4 py-3" />
              </label>
              {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
              <button disabled={submitting} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white disabled:opacity-60">
                {submitting ? "Setting up account…" : "Accept invitation"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Invitation unavailable</h1>
            <p role="alert" className="mt-3 text-sm text-rose-600">{error}</p>
            <Link to="/organization-login" className="mt-6 inline-block text-sm font-semibold text-indigo-600">Go to organization sign in</Link>
          </>
        )}
      </section>
    </main>
  );
}
