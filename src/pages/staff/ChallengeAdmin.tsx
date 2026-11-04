import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Copy,
  ExternalLink,
  ImageUp,
  Loader2,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "../../lib/utils";
import { EntryReviewDrawer } from "../../components/challenges/admin/EntryReviewDrawer";
import { CHALLENGE_STATUS_STYLES, StaffNav } from "./ChallengesAdmin";
import {
  confirmStaffChallenge,
  challengePosterUrl,
  ENTRY_STATUS_LABELS,
  fetchStaffAudit,
  fetchStaffChallenge,
  fetchStaffDiscounts,
  fetchStaffParticipants,
  formatPrize,
  PHASE_LABELS,
  placeLabel,
  PLATFORM_LABELS,
  publishStaffResults,
  removeStaffChallengeImage,
  saveStaffDiscount,
  setStaffChallengeStatus,
  setStaffWinners,
  SOCIAL_PLATFORMS,
  updateStaffChallenge,
  uploadStaffChallengeImage,
  type AuditEntry,
  type ChallengeStatus,
  type ConfirmationItem,
  type PublicResult,
  type StaffChallenge,
  type StaffDiscount,
  type StaffParticipant,
} from "../../api/challenges";

type Tab = "setup" | "launch" | "discount" | "entries" | "winners" | "activity";
const TABS: Array<[Tab, string]> = [
  ["setup", "Setup"],
  ["launch", "Launch checklist"],
  ["discount", "Discount"],
  ["entries", "Entries"],
  ["winners", "Winners"],
  ["activity", "Activity"],
];

function Field({ label, hint, className, children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn("block text-xs font-bold text-slate-600 dark:text-zinc-300", className)}>
      {label}
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-[11px] font-normal text-slate-400">{hint}</span>}
    </label>
  );
}

/** ISO → the value a datetime-local input shows, in this browser's time zone. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null);
const TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

const Banner = ({ tone, children }: { tone: "error" | "ok" | "warn"; children: React.ReactNode }) => (
  <p
    className={cn(
      "rounded-xl p-3 text-sm",
      tone === "error" && "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
      tone === "ok" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
      tone === "warn" && "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200",
    )}
    role={tone === "error" ? "alert" : "status"}
  >
    {children}
  </p>
);

/** Staff editor for one hosted challenge. The API 404s for non-staff. */
export default function ChallengeAdmin() {
  const { id = "" } = useParams();
  const { authFetch } = useAuth();
  const [challenge, setChallenge] = useState<StaffChallenge | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "forbidden" | "error">("loading");
  const [tab, setTab] = useState<Tab>("setup");

  const load = useCallback(async () => {
    try {
      setChallenge(await fetchStaffChallenge(authFetch, id));
      setStatus("ready");
    } catch (err: any) {
      setStatus(err?.status === 404 ? "forbidden" : "error");
    }
  }, [authFetch, id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (status === "forbidden") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <ShieldAlert size={32} className="mx-auto text-slate-300" />
        <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-zinc-100">This challenge isn't available</h1>
        <Link to="/staff/challenges" className="btn-secondary mt-6 px-4 py-2 text-sm">All challenges</Link>
      </div>
    );
  }
  if (status !== "ready" || !challenge) {
    return (
      <p className="flex items-center gap-2 px-4 py-16 text-sm text-slate-400">
        {status === "loading" ? <><Loader2 size={16} className="animate-spin" /> Loading…</> : "The challenge couldn't load."}
      </p>
    );
  }

  const pending = challenge.confirmations.filter((c) => !c.confirmed).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link to="/staff/challenges" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600">
        <ArrowLeft size={14} /> All challenges
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize", CHALLENGE_STATUS_STYLES[challenge.status])}>{challenge.status}</span>
            {challenge.phase !== "draft" && <span className="text-[11px] font-semibold text-slate-400">Founders see "{PHASE_LABELS[challenge.phase]}"</span>}
            {pending > 0 && <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">{pending} to confirm</span>}
          </div>
          <h1 className="mt-1 truncate text-2xl font-extrabold text-slate-950 dark:text-white">{challenge.title}</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {challenge.counts.total ?? 0} joined · {challenge.counts.submitted ?? 0} awaiting review · {challenge.counts.approved ?? 0} approved
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/opportunities/challenges/${challenge.slug}`} target="_blank" className="btn-secondary inline-flex items-center gap-1.5 px-4 py-2 text-sm">
            View page <ExternalLink size={14} />
          </Link>
          <StaffNav current="challenges" />
        </div>
      </div>

      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-zinc-800" aria-label="Challenge sections">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-current={tab === key ? "page" : undefined}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2 text-sm font-bold transition",
              tab === key ? "border-indigo-600 text-indigo-700 dark:text-indigo-300" : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400",
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "setup" && <SetupTab challenge={challenge} onSaved={setChallenge} />}
        {tab === "launch" && <LaunchTab challenge={challenge} onSaved={setChallenge} />}
        {tab === "discount" && <DiscountTab challenge={challenge} onChanged={load} />}
        {tab === "entries" && <EntriesTab challenge={challenge} onChanged={load} />}
        {tab === "winners" && <WinnersTab challenge={challenge} onChanged={load} />}
        {tab === "activity" && <ActivityTab challenge={challenge} />}
      </div>
    </div>
  );
}

// ─── Setup ───────────────────────────────────────────────────────────────────

function SetupTab({ challenge, onSaved }: { challenge: StaffChallenge; onSaved: (c: StaffChallenge) => void }) {
  const { authFetch } = useAuth();
  const initial = useMemo(() => ({
    title: challenge.title,
    slug: challenge.slug,
    organizer: challenge.organizer,
    tagline: challenge.tagline,
    description: challenge.description,
    region: challenge.region,
    websiteUrl: challenge.websiteUrl,
    prizeCurrency: challenge.prizeCurrency,
    prizes: challenge.prizes.map((p) => String(p.amount)),
    startsAt: toLocalInput(challenge.startsAt),
    submissionDeadline: toLocalInput(challenge.submissionDeadline),
    winnersAnnouncedOn: challenge.winnersAnnouncedOn ?? "",
    eligibility: challenge.eligibility,
    requirements: challenge.requirements,
    judgingCriteria: challenge.judgingCriteria,
    terms: challenge.terms,
    pitchWeight: String(challenge.pitchWeight),
    eligibleSessionModes: challenge.eligibleSessionModes,
    minCompletedSessions: String(challenge.minCompletedSessions),
    requiredPlan: challenge.requiredPlan ?? "none",
    socialHandles: Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p, { handle: challenge.socialHandles[p]?.handle ?? "", url: challenge.socialHandles[p]?.url ?? "" }])) as Record<string, { handle: string; url: string }>,
    promoEnabled: challenge.promoEnabled,
  }), [challenge]);
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  useEffect(() => setForm(initial), [initial]);

  const posterUrl = challengePosterUrl(challenge);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const pool = form.prizes.reduce((sum, value) => sum + (Number(value) || 0), 0);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const updated = await updateStaffChallenge(authFetch, challenge.id, {
        title: form.title,
        ...(challenge.status === "draft" && form.slug !== challenge.slug ? { slug: form.slug } : {}),
        organizer: form.organizer,
        tagline: form.tagline,
        description: form.description,
        region: form.region,
        websiteUrl: form.websiteUrl,
        prizeCurrency: form.prizeCurrency,
        prizes: form.prizes.map((value) => Number(value)),
        startsAt: fromLocalInput(form.startsAt),
        submissionDeadline: fromLocalInput(form.submissionDeadline),
        winnersAnnouncedOn: form.winnersAnnouncedOn || null,
        eligibility: form.eligibility,
        requirements: form.requirements,
        judgingCriteria: form.judgingCriteria,
        terms: form.terms,
        pitchWeight: Number(form.pitchWeight),
        eligibleSessionModes: form.eligibleSessionModes,
        minCompletedSessions: Number(form.minCompletedSessions),
        requiredPlan: form.requiredPlan,
        socialHandles: form.socialHandles,
        promoEnabled: form.promoEnabled,
      });
      onSaved(updated);
      const stale = updated.confirmations.filter((c) => c.stale).map((c) => c.item);
      const visibilityMessage = updated.status === "draft"
        ? "Saved as a draft. It won't appear publicly until every Launch checklist item is confirmed and you publish it."
        : "Saved. Public challenge details updated.";
      setMessage({ tone: "ok", text: stale.length ? `${visibilityMessage} Confirm these changed parts again: ${stale.join(", ")}.` : visibilityMessage });
    } catch (err: any) {
      setMessage({ tone: "error", text: err?.message || "Couldn't save." });
    } finally {
      setSaving(false);
    }
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setMessage({ tone: "error", text: "Use an image under 4 MB. The 1600 px poster file (pitchnest-challenge-poster-1600.jpg) is about 0.4 MB." });
      return;
    }
    setImageBusy(true);
    setMessage(null);
    try {
      onSaved(await uploadStaffChallengeImage(authFetch, challenge.id, file));
      setMessage({ tone: "ok", text: "Image saved. It shows on the hub card, the challenge page and the pop-up." });
    } catch (err: any) {
      setMessage({ tone: "error", text: err?.message || "Couldn't upload the image." });
    } finally {
      setImageBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <form onSubmit={(event) => void save(event)} className="space-y-6">
        <fieldset className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-2">
          <legend className="px-1 text-sm font-extrabold text-slate-950 dark:text-white">Basics</legend>
          <Field label="Challenge name"><input value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={140} required className="input-field text-sm" /></Field>
          <Field label="Organizer"><input value={form.organizer} onChange={(e) => set("organizer", e.target.value)} maxLength={120} required className="input-field text-sm" /></Field>
          <Field label="Tagline" className="sm:col-span-2"><input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} maxLength={300} required className="input-field text-sm" /></Field>
          <Field label="Description" className="sm:col-span-2"><textarea value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={5000} rows={5} required className="input-field resize-y text-sm" /></Field>
          <Field label="Page address" hint={challenge.status === "draft" ? `/opportunities/challenges/${form.slug}` : "Fixed once the challenge is public, so links keep working."}>
            <input value={form.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} disabled={challenge.status !== "draft"} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} className="input-field text-sm disabled:opacity-60" />
          </Field>
          <Field label="Where (shown on the card)"><input value={form.region} onChange={(e) => set("region", e.target.value)} maxLength={120} className="input-field text-sm" /></Field>
          <Field label="Website (optional)"><input type="url" value={form.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} maxLength={500} className="input-field text-sm" /></Field>
          <label className="flex items-center gap-2 self-end text-xs font-bold text-slate-600 dark:text-zinc-300">
            <input type="checkbox" checked={form.promoEnabled} onChange={(e) => set("promoEnabled", e.target.checked)} className="accent-indigo-600" />
            Show as a pop-up when people open the app (while upcoming or open)
          </label>
        </fieldset>

        <fieldset className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <legend className="px-1 text-sm font-extrabold text-slate-950 dark:text-white">Prizes</legend>
          <div className="grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
            <Field label="Currency"><input value={form.prizeCurrency} onChange={(e) => set("prizeCurrency", e.target.value.toUpperCase())} maxLength={3} className="input-field text-sm uppercase" /></Field>
            <div className="space-y-2">
              {form.prizes.map((value, index) => (
                <div key={index} className="flex items-end gap-2">
                  <Field label={placeLabel(index + 1)} className="flex-1">
                    <input type="number" min={1} step="0.01" value={value} onChange={(e) => set("prizes", form.prizes.map((v, i) => (i === index ? e.target.value : v)))} required className="input-field text-sm" />
                  </Field>
                  {form.prizes.length > 1 && (
                    <button type="button" onClick={() => set("prizes", form.prizes.filter((_, i) => i !== index))} className="mb-1 rounded-lg p-2 text-slate-400 hover:text-rose-600" aria-label={`Remove ${placeLabel(index + 1)}`}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              {form.prizes.length < 10 && (
                <button type="button" onClick={() => set("prizes", [...form.prizes, ""])} className="btn-ghost px-2 py-1 text-xs"><Plus size={14} /> Add a place</button>
              )}
            </div>
          </div>
          <p className="mt-3 text-sm font-bold text-slate-800 dark:text-zinc-100">Total prize pool: {formatPrize(pool, form.prizeCurrency || "NGN")}</p>
        </fieldset>

        <fieldset className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-3">
          <legend className="px-1 text-sm font-extrabold text-slate-950 dark:text-white">Dates ({TIME_ZONE})</legend>
          <Field label="Start" hint="Sessions count from here."><input type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} required className="input-field text-sm" /></Field>
          <Field label="Submission deadline" hint="Entries close; scores freeze."><input type="datetime-local" value={form.submissionDeadline} onChange={(e) => set("submissionDeadline", e.target.value)} required className="input-field text-sm" /></Field>
          <Field label="Winners announced"><input type="date" value={form.winnersAnnouncedOn} onChange={(e) => set("winnersAnnouncedOn", e.target.value)} className="input-field text-sm" /></Field>
        </fieldset>

        <fieldset className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-2">
          <legend className="px-1 text-sm font-extrabold text-slate-950 dark:text-white">Rules and judging</legend>
          <Field label="Required plan">
            <select value={form.requiredPlan} onChange={(e) => set("requiredPlan", e.target.value)} className="input-field text-sm">
              <option value="pro">Pro Founder (paid)</option>
              <option value="prep">Founder or higher (paid)</option>
              <option value="none">No plan required</option>
            </select>
          </Field>
          <Field label="Minimum complete sessions"><input type="number" min={1} max={20} value={form.minCompletedSessions} onChange={(e) => set("minCompletedSessions", e.target.value)} className="input-field text-sm" /></Field>
          <div className="text-xs font-bold text-slate-600 dark:text-zinc-300">
            Session types that count
            <div className="mt-2 flex flex-wrap gap-3">
              {[["panel", "VC panel"], ["solo", "Solo investor"], ["coach", "Coach"]].map(([mode, label]) => (
                <label key={mode} className="flex items-center gap-1.5 font-semibold">
                  <input
                    type="checkbox"
                    checked={form.eligibleSessionModes.includes(mode)}
                    onChange={(e) => set("eligibleSessionModes", e.target.checked ? [...form.eligibleSessionModes, mode] : form.eligibleSessionModes.filter((m) => m !== mode))}
                    className="accent-indigo-600"
                  />
                  {label}
                </label>
              ))}
            </div>
            <span className="mt-1 block text-[11px] font-normal text-slate-400">Coach sessions score more gently than investor sessions.</span>
          </div>
          <Field label="Pitch weight (%)" hint={`Business profile gets the remaining ${100 - (Number(form.pitchWeight) || 0)}%.`}>
            <input type="number" min={0} max={100} value={form.pitchWeight} onChange={(e) => set("pitchWeight", e.target.value)} className="input-field text-sm" />
          </Field>
          <Field label="Who can enter" className="sm:col-span-2"><textarea value={form.eligibility} onChange={(e) => set("eligibility", e.target.value)} maxLength={3000} rows={4} className="input-field resize-y text-sm" /></Field>
          <Field label="Extra requirements (optional)" className="sm:col-span-2"><textarea value={form.requirements} onChange={(e) => set("requirements", e.target.value)} maxLength={5000} rows={3} className="input-field resize-y text-sm" /></Field>
          <Field label="Judging criteria" className="sm:col-span-2"><textarea value={form.judgingCriteria} onChange={(e) => set("judgingCriteria", e.target.value)} maxLength={3000} rows={4} className="input-field resize-y text-sm" /></Field>
          <Field label="Terms and conditions" className="sm:col-span-2"><textarea value={form.terms} onChange={(e) => set("terms", e.target.value)} maxLength={15000} rows={10} className="input-field resize-y text-sm" /></Field>
        </fieldset>

        <fieldset className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <legend className="px-1 text-sm font-extrabold text-slate-950 dark:text-white">Official social media accounts</legend>
          <div className="space-y-3">
            {SOCIAL_PLATFORMS.map((platform) => (
              <div key={platform} className="grid gap-2 sm:grid-cols-[140px_minmax(0,1fr)_minmax(0,1.4fr)] sm:items-end">
                <p className="text-sm font-bold text-slate-700 dark:text-zinc-200">{PLATFORM_LABELS[platform]}</p>
                <Field label="Handle">
                  <input value={form.socialHandles[platform].handle} onChange={(e) => set("socialHandles", { ...form.socialHandles, [platform]: { ...form.socialHandles[platform], handle: e.target.value } })} maxLength={61} placeholder="@pitchnestapp" className="input-field text-sm" />
                </Field>
                <Field label="Profile link">
                  <input type="url" value={form.socialHandles[platform].url} onChange={(e) => set("socialHandles", { ...form.socialHandles, [platform]: { ...form.socialHandles[platform], url: e.target.value } })} maxLength={500} placeholder="https://" className="input-field text-sm" />
                </Field>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Leave a platform empty to leave it out. Use only the verified official accounts.</p>
        </fieldset>

        <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
          <button type="submit" disabled={saving} className="btn-primary px-5 py-2.5 text-sm disabled:opacity-60">
            {saving && <Loader2 size={15} className="animate-spin" />} Save changes
          </button>
          {message && <span className={cn("text-sm", message.tone === "error" ? "text-rose-600" : "text-emerald-700 dark:text-emerald-400")}>{message.text}</span>}
        </div>
      </form>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-extrabold text-slate-950 dark:text-white">Challenge image</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">The poster on the hub card, the challenge page and the pop-up. Kept whole, never cropped. PNG, JPEG or WebP, under 4 MB.</p>
          <div className="mt-3 overflow-hidden rounded-xl bg-slate-100 dark:bg-zinc-800">
            {posterUrl ? <img src={posterUrl} alt="Challenge poster" className="w-full object-contain" /> : <p className="p-6 text-center text-xs text-slate-400">No image yet</p>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <label className={cn("btn-secondary cursor-pointer px-3 py-2 text-xs", imageBusy && "pointer-events-none opacity-60")}>
              {imageBusy ? <Loader2 size={13} className="animate-spin" /> : <ImageUp size={13} />} {challenge.imageUrl ? "Replace" : "Upload"}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; void upload(f); }} />
            </label>
            {challenge.imageUrl && (
              <button
                type="button"
                disabled={imageBusy}
                onClick={() => { if (window.confirm("Remove the challenge image?")) void removeStaffChallengeImage(authFetch, challenge.id).then(onSaved).catch((err) => setMessage({ tone: "error", text: err?.message || "Couldn't remove it." })); }}
                className="inline-flex items-center gap-1 px-2 py-2 text-xs font-semibold text-rose-600"
              >
                <Trash2 size={13} /> Remove
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

// ─── Launch checklist and status ─────────────────────────────────────────────

const CONFIRMATION_COPY: Record<ConfirmationItem, [string, string]> = {
  prizes: ["Prize distribution", "Prize amounts, places and currency."],
  dates: ["Dates", "Start, submission deadline and winner announcement date."],
  discount: ["Discount", "The linked code and its settings (percentage, plan, term, limits, dates)."],
  social: ["Social handles", "The official accounts founders must tag and follow."],
  judging: ["Judging", "Criteria, weights, session types and minimum sessions."],
  terms: ["Terms", "Terms and conditions, eligibility, extra requirements and the required plan."],
};

const TRANSITIONS: Array<{ to: ChallengeStatus; label: string; confirm: string; from: ChallengeStatus[]; tone?: "danger" | "primary" }> = [
  { to: "published", label: "Publish (announce, entries not open yet)", confirm: "Publish this challenge? It appears in the Opportunities hub; founders can't join yet.", from: ["draft"] },
  { to: "open", label: "Open for entries", confirm: "Open the challenge for entries? Founders can join and submit until the deadline.", from: ["draft", "published", "closed"], tone: "primary" },
  { to: "closed", label: "Close entries", confirm: "Close entries now? Founders can no longer join or submit (requested corrections stay open).", from: ["open"] },
  { to: "judging", label: "Start judging", confirm: "Mark the challenge as being judged?", from: ["open", "closed"] },
  { to: "completed", label: "Mark completed", confirm: "Mark the challenge completed?", from: ["judging", "closed"] },
  { to: "judging", label: "Back to judging", confirm: "Move the challenge back to judging?", from: ["completed"] },
  { to: "draft", label: "Back to draft", confirm: "Hide the challenge again? Only possible before anyone joins.", from: ["published", "open"] },
  { to: "cancelled", label: "Cancel challenge", confirm: "Cancel this challenge? It disappears from the hub and nothing more can be entered.", from: ["draft", "published", "open", "closed", "judging"], tone: "danger" },
];

function LaunchTab({ challenge, onSaved }: { challenge: StaffChallenge; onSaved: (c: StaffChallenge) => void }) {
  const { authFetch } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error" | "warn"; text: string } | null>(null);

  const run = async (key: string, action: () => Promise<StaffChallenge>, done: string) => {
    setBusy(key);
    setMessage(null);
    try {
      onSaved(await action());
      setMessage({ tone: "ok", text: done });
    } catch (err: any) {
      setMessage({ tone: "error", text: err?.message || "That didn't work." });
    } finally {
      setBusy(null);
    }
  };

  const allConfirmed = challenge.confirmations.every((c) => c.confirmed);
  const discountInactive = challenge.discount && !challenge.discount.active;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-extrabold text-slate-950 dark:text-white">Confirm the rules before going public</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
          Read each part on the Setup and Discount tabs, then confirm it. Editing a part after confirming it asks you to confirm it again.
        </p>
        <ul className="mt-4 space-y-2">
          {challenge.confirmations.map((c) => (
            <li key={c.item} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 dark:border-zinc-800">
              {c.confirmed ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" /> : c.stale ? <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500" /> : <Circle size={18} className="mt-0.5 shrink-0 text-slate-300" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">{CONFIRMATION_COPY[c.item][0]}</p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">{CONFIRMATION_COPY[c.item][1]}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {c.confirmed && c.at ? `Confirmed ${new Date(c.at).toLocaleString()}` : c.stale ? "Changed since it was confirmed" : "Not confirmed"}
                </p>
              </div>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void run(c.item, () => confirmStaffChallenge(authFetch, challenge.id, c.item, !c.confirmed), c.confirmed ? "Confirmation removed." : "Confirmed.")}
                className={cn("shrink-0 px-3 py-1.5 text-xs", c.confirmed ? "btn-ghost" : "btn-secondary")}
              >
                {busy === c.item && <Loader2 size={12} className="animate-spin" />} {c.confirmed ? "Undo" : "Confirm"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-extrabold text-slate-950 dark:text-white">Status</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-zinc-300">
            Now <strong className="capitalize">{challenge.status}</strong> · founders see "{PHASE_LABELS[challenge.phase]}".
          </p>
          {!allConfirmed && <div className="mt-3"><Banner tone="warn">Publishing and opening stay locked until every part of the rules is confirmed.</Banner></div>}
          {discountInactive && <div className="mt-3"><Banner tone="warn">The discount code {challenge.discount!.code} is not active. Test it on DEV, then activate it on the Discount tab.</Banner></div>}
          <div className="mt-4 flex flex-col gap-2">
            {TRANSITIONS.filter((t) => t.from.includes(challenge.status)).map((t) => (
              <button
                key={`${t.to}-${t.label}`}
                type="button"
                disabled={busy !== null || ((t.to === "published" || t.to === "open") && !allConfirmed)}
                onClick={() => {
                  if (window.confirm(t.confirm)) void run(t.to, () => setStaffChallengeStatus(authFetch, challenge.id, t.to), `Status changed to ${t.to}.`);
                }}
                className={cn(
                  "px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50",
                  t.tone === "primary" ? "btn-primary" : t.tone === "danger" ? "rounded-xl border border-rose-200 font-bold text-rose-700 hover:bg-rose-50 dark:border-rose-900" : "btn-secondary",
                )}
              >
                {busy === t.to && <Loader2 size={14} className="animate-spin" />} {t.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">An open challenge stops taking entries at its deadline by itself; closing it is for tidiness and for ending early.</p>
        </div>
        {message && <Banner tone={message.tone}>{message.text}</Banner>}
      </section>
    </div>
  );
}

// ─── Discount ────────────────────────────────────────────────────────────────

function DiscountTab({ challenge, onChanged }: { challenge: StaffChallenge; onChanged: () => Promise<void> }) {
  const { authFetch } = useAuth();
  const [codes, setCodes] = useState<StaffDiscount[] | null>(null);
  const code = challenge.discount;
  const blank = { code: "", description: "", percentOff: "50", plans: ["pro"], terms: ["monthly"], periods: "1", startsAt: "", endsAt: "", maxRedemptions: "", newCustomersOnly: false, combineWithOffer: false };
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    void fetchStaffDiscounts(authFetch).then(setCodes).catch(() => setCodes([]));
  }, [authFetch, challenge.discount?.updatedAt]);
  useEffect(() => {
    setForm(code ? {
      code: code.code,
      description: code.description,
      percentOff: String(code.percentOff),
      plans: code.plans,
      terms: code.terms,
      periods: String(code.periods),
      startsAt: toLocalInput(code.startsAt),
      endsAt: toLocalInput(code.endsAt),
      maxRedemptions: code.maxRedemptions === null ? "" : String(code.maxRedemptions),
      newCustomersOnly: code.newCustomersOnly,
      combineWithOffer: code.combineWithOffer,
    } : blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code?.id, code?.updatedAt]);

  const run = async (key: string, action: () => Promise<unknown>, done: string) => {
    setBusy(key);
    setMessage(null);
    try {
      await action();
      await onChanged();
      setMessage({ tone: "ok", text: done });
    } catch (err: any) {
      setMessage({ tone: "error", text: err?.message || "That didn't work." });
    } finally {
      setBusy(null);
    }
  };

  const payload = () => ({
    code: form.code,
    description: form.description,
    percentOff: Number(form.percentOff),
    plans: form.plans,
    terms: form.terms,
    periods: Number(form.periods),
    startsAt: fromLocalInput(form.startsAt),
    endsAt: fromLocalInput(form.endsAt),
    maxRedemptions: form.maxRedemptions === "" ? null : Number(form.maxRedemptions),
    newCustomersOnly: form.newCustomersOnly,
    combineWithOffer: form.combineWithOffer,
  });
  const toggle = (key: "plans" | "terms", value: string, on: boolean) =>
    setForm((f) => ({ ...f, [key]: on ? [...new Set([...f[key], value])] : f[key].filter((v) => v !== value) }));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <form
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          void run("save", async () => {
            const saved = await saveStaffDiscount(authFetch, payload(), code?.id);
            if (!code) await updateStaffChallenge(authFetch, challenge.id, { discountCodeId: saved.id });
          }, code ? "Discount saved. Confirm the discount part of the rules again." : "Code created and linked to this challenge.");
        }}
      >
        <h2 className="text-sm font-extrabold text-slate-950 dark:text-white sm:col-span-2">{code ? `Code ${code.code}` : "Create the challenge's code"}</h2>
        <Field label="Code"><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} maxLength={32} required className="input-field font-mono text-sm uppercase" /></Field>
        <Field label="Percent off" hint="1 to 90. Applies to the first period only."><input type="number" min={1} max={90} value={form.percentOff} onChange={(e) => setForm({ ...form, percentOff: e.target.value })} required className="input-field text-sm" /></Field>
        <Field label="Description (staff only)" className="sm:col-span-2"><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={300} className="input-field text-sm" /></Field>
        <div className="text-xs font-bold text-slate-600 dark:text-zinc-300">
          Plans
          <div className="mt-2 flex gap-4 font-semibold">
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.plans.includes("pro")} onChange={(e) => toggle("plans", "pro", e.target.checked)} className="accent-indigo-600" /> Pro Founder</label>
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.plans.includes("prep")} onChange={(e) => toggle("plans", "prep", e.target.checked)} className="accent-indigo-600" /> Founder</label>
          </div>
        </div>
        <div className="text-xs font-bold text-slate-600 dark:text-zinc-300">
          Billing periods
          <div className="mt-2 flex gap-4 font-semibold">
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.terms.includes("monthly")} onChange={(e) => toggle("terms", "monthly", e.target.checked)} className="accent-indigo-600" /> Monthly</label>
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.terms.includes("annual")} onChange={(e) => toggle("terms", "annual", e.target.checked)} className="accent-indigo-600" /> Yearly</label>
          </div>
        </div>
        <Field label="Discounted payments per founder" hint="1 = the first period only. Each discounted payment is a one-time (manual) payment."><input type="number" min={1} max={12} value={form.periods} onChange={(e) => setForm({ ...form, periods: e.target.value })} className="input-field text-sm" /></Field>
        <Field label="Usage limit (all founders)" hint="Empty for no limit."><input type="number" min={1} value={form.maxRedemptions} onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })} className="input-field text-sm" /></Field>
        <Field label={`Valid from (${TIME_ZONE})`} hint="Empty: from activation."><input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="input-field text-sm" /></Field>
        <Field label="Valid until" hint="Empty: no end date."><input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className="input-field text-sm" /></Field>
        <label className="flex items-start gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-300 sm:col-span-2">
          <input type="checkbox" checked={form.newCustomersOnly} onChange={(e) => setForm({ ...form, newCustomersOnly: e.target.checked })} className="mt-0.5 accent-indigo-600" />
          First-time subscribers only (anyone who has paid before can't use it)
        </label>
        <label className="flex items-start gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-300 sm:col-span-2">
          <input type="checkbox" checked={form.combineWithOffer} onChange={(e) => setForm({ ...form, combineWithOffer: e.target.checked })} className="mt-0.5 accent-indigo-600" />
          Also give the first-subscription free month (off: the code replaces that offer)
        </label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button type="submit" disabled={busy !== null} className="btn-primary px-5 py-2.5 text-sm disabled:opacity-60">
            {busy === "save" && <Loader2 size={15} className="animate-spin" />} {code ? "Save code" : "Create and link code"}
          </button>
          {message && <span className={cn("text-sm", message.tone === "error" ? "text-rose-600" : "text-emerald-700 dark:text-emerald-400")}>{message.text}</span>}
        </div>
      </form>

      <aside className="space-y-4">
        {code && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-extrabold text-slate-950 dark:text-white">{code.active ? "Active" : "Not active"}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">{code.redeemed} paid with the code · {code.pending} checkout{code.pending === 1 ? "" : "s"} in progress</p>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => {
                const text = code.active
                  ? `Deactivate ${code.code}? Checkouts with it stop working at once; payments already made are unaffected.`
                  : `Activate ${code.code}? Founders can pay ${code.percentOff}% less with it. Do this only after a test payment on DEV.`;
                if (window.confirm(text)) void run("active", () => saveStaffDiscount(authFetch, { active: !code.active }, code.id), code.active ? "Code deactivated." : "Code activated.");
              }}
              className={cn("mt-3 w-full px-4 py-2 text-sm", code.active ? "btn-secondary" : "btn-accent")}
            >
              {busy === "active" && <Loader2 size={14} className="animate-spin" />} {code.active ? "Deactivate" : "Activate code"}
            </button>
          </div>
        )}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <p className="font-bold text-slate-700 dark:text-zinc-200">How codes work</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>The pricing page shows the discounted price; the server prices and checks the code again at checkout.</li>
            <li>A discounted payment is one-time (manual renewal), so it can never renew at the discounted price.</li>
            <li>Access starts only when Flutterwave confirms the payment. A failed or abandoned checkout frees the code again.</li>
          </ul>
          {codes && codes.length > 1 && (
            <label className="mt-3 block font-bold">
              Linked code
              <select
                value={challenge.discountCodeId ?? ""}
                onChange={(e) => void run("link", () => updateStaffChallenge(authFetch, challenge.id, { discountCodeId: e.target.value || null }), "Linked code changed.")}
                className="input-field mt-1.5 text-sm"
              >
                <option value="">None</option>
                {codes.map((c) => <option key={c.id} value={c.id}>{c.code} ({c.percentOff}%{c.active ? ", active" : ""})</option>)}
              </select>
            </label>
          )}
        </div>
      </aside>
    </div>
  );
}

// ─── Entries ─────────────────────────────────────────────────────────────────

const SUBSCRIPTION_LABELS: Record<StaffParticipant["subscription"], string> = {
  verified: "Verified",
  pending: "Pending",
  missing: "None",
  not_required: "Not required",
};

function EntriesTab({ challenge, onChanged }: { challenge: StaffChallenge; onChanged: () => Promise<void> }) {
  const { authFetch } = useAuth();
  const [rows, setRows] = useState<StaffParticipant[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [subscription, setSubscription] = useState("");
  const [sort, setSort] = useState("final");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await fetchStaffParticipants(authFetch, challenge.id));
      setError("");
    } catch (err: any) {
      setError(err?.message || "Entries couldn't load.");
    }
  }, [authFetch, challenge.id]);
  useEffect(() => {
    void load();
  }, [load]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (rows ?? []).filter((row) =>
      (!q || [row.name, row.email, row.business?.name ?? ""].some((v) => v.toLowerCase().includes(q))) &&
      (!statusFilter || row.status === statusFilter) &&
      (!eligibility || (eligibility === "eligible" ? row.eligible : !row.eligible)) &&
      (!subscription || row.subscription === subscription),
    );
    const by = (value: number | null) => (value === null ? -1 : value);
    return [...list].sort((a, b) =>
      sort === "final" ? by(b.finalScore) - by(a.finalScore) || by(b.bestScore) - by(a.bestScore)
      : sort === "score" ? by(b.bestScore) - by(a.bestScore)
      : sort === "name" ? a.name.localeCompare(b.name)
      : sort === "oldest" ? a.joinedAt.localeCompare(b.joinedAt)
      : b.joinedAt.localeCompare(a.joinedAt),
    );
  }, [rows, query, statusFilter, eligibility, subscription, sort]);

  const exportCsv = () => {
    const header = ["Name", "Email", "Joined", "Subscription", "Sessions", "Best score", "Business", "Post", "Status", "Eligible", "Profile score", "Final score", "Place"];
    const lines = shown.map((r) => [r.name, r.email, r.joinedAt, r.subscription, r.completedSessions, r.bestScore ?? "", r.business?.name ?? "", r.socialPostUrl ?? "", r.status, r.eligible ? "yes" : "no", r.profileScore ?? "", r.finalScore ?? "", r.placement ?? ""]);
    const csv = [header, ...lines].map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${challenge.slug}-entries.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="relative min-w-52 flex-1">
          <span className="sr-only">Search entries</span>
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or business" className="input-field py-2 pl-9 text-sm" />
        </label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-auto py-2 text-sm" aria-label="Status">
          <option value="">Any status</option>
          {Object.entries(ENTRY_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select value={eligibility} onChange={(e) => setEligibility(e.target.value)} className="input-field w-auto py-2 text-sm" aria-label="Eligibility">
          <option value="">Any eligibility</option>
          <option value="eligible">Meets every requirement</option>
          <option value="incomplete">Missing something</option>
        </select>
        <select value={subscription} onChange={(e) => setSubscription(e.target.value)} className="input-field w-auto py-2 text-sm" aria-label="Subscription">
          <option value="">Any plan</option>
          <option value="verified">Plan verified</option>
          <option value="pending">Payment pending</option>
          <option value="missing">No plan</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-field w-auto py-2 text-sm" aria-label="Sort">
          <option value="final">Final score</option>
          <option value="score">Best pitch score</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name">Name</option>
        </select>
        <button type="button" onClick={exportCsv} disabled={!shown.length} className="btn-secondary px-3 py-2 text-xs disabled:opacity-50">Export CSV</button>
      </div>
      {error && <div className="mt-3"><Banner tone="error">{error}</Banner></div>}
      {rows === null && !error && <p className="mt-6 flex items-center gap-2 text-sm text-slate-400"><Loader2 size={16} className="animate-spin" /> Loading entries and refreshing scores…</p>}
      {rows && (
        <p className="mt-3 text-xs text-slate-500 dark:text-zinc-400">{shown.length} of {rows.length} entr{rows.length === 1 ? "y" : "ies"} · scores refreshed just now</p>
      )}
      {rows && shown.length > 0 && (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-zinc-800/60 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2">Founder</th>
                <th className="px-3 py-2">Joined</th>
                <th className="px-3 py-2">Plan</th>
                <th className="px-3 py-2">Sessions</th>
                <th className="px-3 py-2">Best</th>
                <th className="px-3 py-2">Business</th>
                <th className="px-3 py-2">Post</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Eligible</th>
                <th className="px-3 py-2">Judging</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr key={row.id} onClick={() => setOpenId(row.id)} className="cursor-pointer border-t border-slate-100 hover:bg-indigo-50/40 dark:border-zinc-800 dark:hover:bg-indigo-500/5">
                  <td className="px-3 py-2">
                    <p className="font-bold text-slate-900 dark:text-zinc-100">{row.name}</p>
                    <p className="text-xs text-slate-500">{row.email}</p>
                  </td>
                  <td className="px-3 py-2 text-xs">{new Date(row.joinedAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-xs">{SUBSCRIPTION_LABELS[row.subscription]}</td>
                  <td className="px-3 py-2 text-xs">{row.completedSessions}</td>
                  <td className="px-3 py-2 font-bold">{row.bestScore ?? "—"}{!row.pitchScoreValid && <span className="ml-1 text-[10px] text-rose-600">invalid</span>}</td>
                  <td className="px-3 py-2 text-xs">
                    {row.business ? <>{row.business.name}<span className="block text-slate-400">{row.business.published ? `${row.business.percent}%` : "not published"}</span></> : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">{row.socialPlatform ? PLATFORM_LABELS[row.socialPlatform] : "—"}</td>
                  <td className="px-3 py-2 text-xs font-semibold">{ENTRY_STATUS_LABELS[row.status]}</td>
                  <td className="px-3 py-2 text-xs">{row.eligible ? <span className="font-bold text-emerald-600">Yes</span> : <span className="text-slate-500">Missing {row.missing.join(", ")}</span>}</td>
                  <td className="px-3 py-2 text-xs">
                    {row.finalScore !== null ? <strong>{row.finalScore}</strong> : "—"}
                    {row.shortlisted && <span className="ml-1 rounded bg-indigo-50 px-1 text-[10px] font-bold text-indigo-700">shortlist</span>}
                    {row.placement && <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] font-bold text-amber-800">#{row.placement}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows && rows.length === 0 && <p className="mt-6 text-sm text-slate-500">No one has joined yet.</p>}
      {openId && (
        <EntryReviewDrawer
          challenge={challenge}
          participantId={openId}
          onClose={() => setOpenId(null)}
          onChanged={() => { void load(); void onChanged(); }}
        />
      )}
    </div>
  );
}

// ─── Winners and results ─────────────────────────────────────────────────────

function WinnersTab({ challenge, onChanged }: { challenge: StaffChallenge; onChanged: () => Promise<void> }) {
  const { authFetch } = useAuth();
  const [rows, setRows] = useState<StaffParticipant[] | null>(null);
  const [picks, setPicks] = useState<Record<number, string>>({});
  const [preview, setPreview] = useState<PublicResult[]>(challenge.winnersPreview ?? []);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const published = Boolean(challenge.resultsPublishedAt);

  useEffect(() => {
    void fetchStaffParticipants(authFetch, challenge.id).then((data) => {
      setRows(data);
      setPicks(Object.fromEntries(data.filter((r) => r.placement).map((r) => [r.placement!, r.id])));
    });
  }, [authFetch, challenge.id]);

  const approved = (rows ?? [])
    .filter((r) => r.status === "approved")
    .sort((a, b) => (b.finalScore ?? -1) - (a.finalScore ?? -1) || (b.bestScore ?? -1) - (a.bestScore ?? -1));
  const chosen = Object.values(picks).filter(Boolean);
  const duplicate = chosen.length !== new Set(chosen).size;
  const allPlaced = challenge.prizes.every((p) => picks[p.place]);

  const saveWinners = async () => {
    setBusy("save");
    setMessage(null);
    try {
      const result = await setStaffWinners(
        authFetch,
        challenge.id,
        Object.entries(picks).filter(([, participantId]) => participantId).map(([place, participantId]) => ({ participantId, place: Number(place) })),
      );
      setPreview(result.winnersPreview);
      setMessage({ tone: "ok", text: "Winners saved. Check the preview, then publish." });
      await onChanged();
    } catch (err: any) {
      setMessage({ tone: "error", text: err?.message || "Couldn't save the winners." });
    } finally {
      setBusy(null);
    }
  };

  const publish = async (on: boolean) => {
    const text = on
      ? "Publish the results? Winners appear on the challenge page and every participant is notified. Prize money is NOT paid by this; pay it through your approved process."
      : "Unpublish the results? They disappear from the challenge page.";
    if (!window.confirm(text)) return;
    setBusy("publish");
    setMessage(null);
    try {
      await publishStaffResults(authFetch, challenge.id, on);
      await onChanged();
      setMessage({ tone: "ok", text: on ? "Results published." : "Results unpublished." });
    } catch (err: any) {
      setMessage({ tone: "error", text: err?.message || "That didn't work." });
    } finally {
      setBusy(null);
    }
  };

  const origin = window.location.origin;
  const announcement = [
    `🏆 ${challenge.title}: the winners!`,
    "",
    ...preview.map((w) => {
      const medal = ["🥇", "🥈", "🥉"][w.place - 1] ?? "🏅";
      const who = w.founderName ? `${w.businessName} (${w.founderName})` : w.businessName;
      const link = w.businessSlug ? ` ${origin}/businesses/${w.businessSlug}` : "";
      return `${medal} ${placeLabel(w.place)} (${formatPrize(w.prize, challenge.prizeCurrency)}): ${who}${link}`;
    }),
    "",
    "Congratulations, and thank you to every founder who practised, pitched and showcased on PitchNest.",
    `${origin}/opportunities/challenges/${challenge.slug}`,
    "#PitchNestChallenge",
  ].join("\n");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-extrabold text-slate-950 dark:text-white">Choose the winners</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
          Only approved entries can win, one place each. They are listed by final score (pitch {challenge.pitchWeight}%, profile {100 - challenge.pitchWeight}%);
          the highest AI score alone doesn't decide.
        </p>
        {rows === null ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-slate-400"><Loader2 size={15} className="animate-spin" /> Loading…</p>
        ) : approved.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No approved entries yet. Approve entries on the Entries tab.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {challenge.prizes.map((prize) => (
              <Field key={prize.place} label={`${placeLabel(prize.place)} · ${formatPrize(prize.amount, challenge.prizeCurrency)}`}>
                <select value={picks[prize.place] ?? ""} onChange={(e) => setPicks({ ...picks, [prize.place]: e.target.value })} disabled={published} className="input-field text-sm">
                  <option value="">Choose an approved entry…</option>
                  {approved.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.business?.name ?? r.name} — final {r.finalScore ?? "not judged"} · pitch {r.bestScore ?? "—"}{r.shortlisted ? " · shortlisted" : ""}
                    </option>
                  ))}
                </select>
              </Field>
            ))}
            {duplicate && <Banner tone="error">One entry is chosen for two places. Each founder can win once.</Banner>}
            <button type="button" onClick={() => void saveWinners()} disabled={busy !== null || duplicate || published} className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50">
              {busy === "save" && <Loader2 size={15} className="animate-spin" />} Save winners
            </button>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-extrabold text-slate-950 dark:text-white">{published ? "Published results" : "Preview (not public yet)"}</h2>
          {preview.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Save winners to see the preview.</p>
          ) : (
            <ol className="mt-3 space-y-2">
              {preview.map((w) => (
                <li key={w.place} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-zinc-800/60">
                  <span><strong>{placeLabel(w.place)}</strong> · {w.businessName}{w.founderName ? ` (${w.founderName})` : ""}</span>
                  <span className="font-bold">{formatPrize(w.prize, challenge.prizeCurrency)}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-2 text-[11px] text-slate-400">The public sees business names and Discover links; a founder's name only if they agreed. Never emails.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {!published ? (
              <button type="button" disabled={busy !== null || !allPlaced || preview.length === 0} onClick={() => void publish(true)} className="btn-accent px-4 py-2 text-sm disabled:opacity-50">
                {busy === "publish" && <Loader2 size={14} className="animate-spin" />} Publish results
              </button>
            ) : (
              <button type="button" disabled={busy !== null} onClick={() => void publish(false)} className="btn-secondary px-4 py-2 text-sm">Unpublish results</button>
            )}
          </div>
          {!allPlaced && !published && <p className="mt-2 text-[11px] text-slate-400">Choose and save a winner for every prize place first.</p>}
        </div>
        {preview.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-extrabold text-slate-950 dark:text-white">Announcement for social media</h2>
            <textarea readOnly value={announcement} rows={9} className="input-field mt-3 font-mono text-xs" />
            <button
              type="button"
              onClick={() => void navigator.clipboard.writeText(announcement).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 2000); })}
              className="btn-secondary mt-2 px-4 py-2 text-xs"
            >
              <Copy size={13} /> {copied ? "Copied" : "Copy announcement"}
            </button>
          </div>
        )}
        <p className="text-[11px] text-slate-400">Prize money is never transferred from PitchNest. Pay winners through your separately approved process.</p>
        {message && <Banner tone={message.tone}>{message.text}</Banner>}
      </section>
    </div>
  );
}

// ─── Activity ────────────────────────────────────────────────────────────────

function describe(entry: AuditEntry): string {
  const m = entry.metadata ?? {};
  switch (entry.action) {
    case "challenge.created": return "Created the challenge";
    case "challenge.updated": return `Edited ${Array.isArray(m.fields) ? m.fields.join(", ") : "the challenge"}`;
    case "challenge.confirmed": return `Confirmed ${m.item}`;
    case "challenge.unconfirmed": return `Removed the confirmation of ${m.item}`;
    case "challenge.status": return `Status ${m.from} → ${m.to}`;
    case "challenge.image": return "Uploaded the challenge image";
    case "challenge.image_removed": return "Removed the challenge image";
    case "challenge.placements_set": return "Saved the winners";
    case "challenge.results_published": return "Published the results";
    case "challenge.results_unpublished": return "Unpublished the results";
    case "participant.judged": return "Scored an entry";
    default:
      if (entry.action.startsWith("participant.")) {
        return `${entry.action.replace("participant.", "").replace("_", " ")} an entry${m.note ? `: "${m.note}"` : ""}`;
      }
      return entry.action;
  }
}

function ActivityTab({ challenge }: { challenge: StaffChallenge }) {
  const { authFetch } = useAuth();
  const [rows, setRows] = useState<AuditEntry[] | null>(null);
  useEffect(() => {
    void fetchStaffAudit(authFetch, challenge.id).then(setRows).catch(() => setRows([]));
  }, [authFetch, challenge.id]);
  if (rows === null) return <p className="flex items-center gap-2 text-sm text-slate-400"><Loader2 size={15} className="animate-spin" /> Loading…</p>;
  if (rows.length === 0) return <p className="text-sm text-slate-500">No decisions recorded yet.</p>;
  return (
    <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {rows.map((row) => (
        <li key={row.id} className="flex flex-col gap-0.5 px-4 py-3 text-sm sm:flex-row sm:items-center sm:gap-4">
          <span className="w-44 shrink-0 text-xs text-slate-400">{new Date(row.createdAt).toLocaleString()}</span>
          <span className="w-36 shrink-0 text-xs font-bold text-slate-600 dark:text-zinc-300">{row.actor}</span>
          <span className="min-w-0 break-words text-slate-800 dark:text-zinc-100">{describe(row)}</span>
        </li>
      ))}
    </ul>
  );
}
