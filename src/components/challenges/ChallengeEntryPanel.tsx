import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  CircleDashed,
  Clock,
  ExternalLink,
  ImageUp,
  Loader2,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { rememberChallengeReturn } from "../../lib/challengeReturn";
import { cn } from "../../lib/utils";
import {
  ENTRY_STATUS_LABELS,
  PLATFORM_LABELS,
  removeEvidence,
  SOCIAL_PLATFORMS,
  submitMyEntry,
  updateMyEntry,
  uploadEvidence,
  type ChallengeEntry,
  type ChecklistStatus,
  type PublicChallenge,
  type SocialPlatform,
} from "../../api/challenges";

const STATUS_STYLE: Record<ChallengeEntry["status"], string> = {
  in_progress: "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300",
  submitted: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  needs_correction: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  approved: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  rejected: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  disqualified: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
};

function ChecklistIcon({ status }: { status: ChecklistStatus }) {
  if (status === "completed") return <CheckCircle2 size={18} className="shrink-0 text-emerald-500" aria-label="Completed" />;
  if (status === "pending_verification") return <Clock size={18} className="shrink-0 text-sky-500" aria-label="Pending verification" />;
  if (status === "needs_correction") return <AlertTriangle size={18} className="shrink-0 text-amber-500" aria-label="Needs correction" />;
  if (status === "in_progress") return <CircleDashed size={18} className="shrink-0 text-indigo-500" aria-label="In progress" />;
  return <Circle size={18} className="shrink-0 text-slate-300 dark:text-zinc-600" aria-label="Not started" />;
}

const CHECKLIST_WORDS: Record<ChecklistStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  pending_verification: "Pending verification",
  needs_correction: "Needs correction",
};

function shortDate(iso: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

/** A founder's own entry: what is verified, what is missing, and the few things only they choose. */
export function ChallengeEntryPanel({
  slug,
  challenge,
  entry,
  onChange,
}: {
  slug: string;
  challenge: PublicChallenge;
  entry: ChallengeEntry;
  onChange: (entry: ChallengeEntry) => void;
}) {
  const { authFetch } = useAuth();
  const location = useLocation();
  const [platform, setPlatform] = useState<SocialPlatform | "">(entry.social.platform ?? "");
  const [postUrl, setPostUrl] = useState(entry.social.url ?? "");
  const [captionConfirmed, setCaptionConfirmed] = useState(entry.profileLinkConfirmed);
  const [acceptRules, setAcceptRules] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [missing, setMissing] = useState<string[]>([]);

  useEffect(() => {
    setPlatform(entry.social.platform ?? "");
    setPostUrl(entry.social.url ?? "");
    setCaptionConfirmed(entry.profileLinkConfirmed);
  }, [entry.social.platform, entry.social.url, entry.profileLinkConfirmed]);

  const run = async (key: string, action: () => Promise<ChallengeEntry | void>) => {
    setBusy(key);
    setError("");
    setMissing([]);
    try {
      const next = await action();
      if (next) onChange(next);
    } catch (err: any) {
      setError(err?.message || "That didn't work. Please try again.");
      if (Array.isArray(err?.details)) setMissing(err.details);
    } finally {
      setBusy(null);
    }
  };

  const editable = entry.editable;
  const selected = entry.businesses.find((b) => b.id === entry.businessId) ?? null;
  const subscription = entry.subscription;
  const discount = challenge.discount;
  const requiredPlanLabel = challenge.requiredPlan === "prep" ? "Founder" : "Pro Founder";
  const pricingPlan = challenge.requiredPlan === "prep" ? "founder" : "pro";
  const pricingLink = `/pricing?plan=${pricingPlan}${discount?.active ? `&code=${encodeURIComponent(discount.code)}` : ""}`;
  const socialDirty = (platform || null) !== entry.social.platform || (postUrl.trim() || null) !== entry.social.url || captionConfirmed !== entry.profileLinkConfirmed;

  return (
    <section id="my-entry" className="scroll-mt-24 rounded-3xl border border-indigo-200 bg-white p-5 shadow-sm dark:border-indigo-900/60 dark:bg-zinc-900 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Your entry</p>
          <h2 className="mt-1 text-xl font-extrabold text-slate-950 dark:text-white">My challenge dashboard</h2>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-bold", STATUS_STYLE[entry.status])}>
          {ENTRY_STATUS_LABELS[entry.status]}
        </span>
      </div>

      {entry.reviewNote && (
        <div
          className={cn(
            "mt-4 rounded-2xl border p-4 text-sm",
            entry.status === "needs_correction"
              ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
              : "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200",
          )}
          role="status"
        >
          <p className="font-bold">{entry.status === "needs_correction" ? "Please correct your entry" : "From the reviewers"}</p>
          <p className="mt-1 whitespace-pre-wrap">{entry.reviewNote}</p>
        </div>
      )}

      {/* Verified facts */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-600 p-4 text-white">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Best verified score</p>
          <p className="mt-1 text-4xl font-extrabold">
            {entry.bestScore ?? "—"}
            {entry.bestScore !== null && <span className="text-base font-bold text-white/70">/100</span>}
          </p>
          <p className="mt-1 text-[11px] text-white/80">
            {entry.bestScore !== null
              ? `From your session on ${shortDate(entry.bestScoreAt)}${entry.scoreFrozen ? " · final" : ""}`
              : "Complete a full AI investor session to get one."}
          </p>
          {entry.bestSessionId !== null && (
            <Link to={`/report?session=${entry.bestSessionId}`} className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-accent underline-offset-2 hover:underline">
              Open that report <ExternalLink size={11} />
            </Link>
          )}
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-zinc-800/60">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Completed sessions</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-950 dark:text-white">{entry.completedSessions}</p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
            In the challenge period. {entry.completedSessions < entry.minSessions ? `${entry.minSessions} needed.` : "Practise again to raise your best score."}
          </p>
          {editable && (
            <Link to="/setup" className="mt-2 inline-flex text-[11px] font-bold text-indigo-600 hover:underline dark:text-indigo-400">
              Start a session →
            </Link>
          )}
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-zinc-800/60">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{requiredPlanLabel} plan</p>
          <p className="mt-1 text-sm font-extrabold text-slate-950 dark:text-white">
            {subscription.state === "verified" ? "Verified"
              : subscription.state === "not_required" ? "Not required"
              : subscription.state === "pending" ? "Payment being confirmed"
              : "Not subscribed yet"}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
            {subscription.state === "verified" && subscription.expiresAt ? `Paid access until ${shortDate(subscription.expiresAt)}.`
              : subscription.state === "pending" ? "This updates by itself once Flutterwave confirms it."
              : subscription.state === "missing" ? "A paid plan is needed; the free trial doesn't count." : ""}
          </p>
          {subscription.state === "missing" && editable && (
            <Link
              to={pricingLink}
              onClick={() => rememberChallengeReturn(location.pathname)}
              className="btn-accent mt-2 px-3 py-1.5 text-xs"
            >
              {discount?.active ? `Subscribe with ${discount.code}` : `Subscribe to ${requiredPlanLabel}`}
            </Link>
          )}
        </div>
      </div>

      {/* Checklist */}
      <h3 className="mt-7 text-sm font-extrabold text-slate-950 dark:text-white">Challenge progress</h3>
      <ul className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 dark:divide-zinc-800 dark:border-zinc-800">
        {entry.checklist.map((item) => (
          <li key={item.key} className="flex items-start gap-3 px-4 py-3">
            <ChecklistIcon status={item.status} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100">{item.label}</p>
              {item.detail && <p className="mt-0.5 break-words text-xs text-slate-500 dark:text-zinc-400">{item.detail}</p>}
            </div>
            <span className="hidden shrink-0 text-[11px] font-semibold text-slate-400 sm:inline">{CHECKLIST_WORDS[item.status]}</span>
          </li>
        ))}
      </ul>

      {/* Business */}
      <h3 className="mt-7 text-sm font-extrabold text-slate-950 dark:text-white">Your Discover business</h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
        Choose the published profile you are entering. Judges read the public profile: the problem, solution, target customers,
        market, business model and traction.
      </p>
      {entry.businesses.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-slate-300 p-4 text-sm dark:border-zinc-700">
          <p className="text-slate-600 dark:text-zinc-300">You don't have a business on PitchNest yet.</p>
          <Link to="/workspace/businesses?new=1" className="btn-secondary mt-3 px-4 py-2 text-xs">Create your business profile</Link>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {entry.businesses.map((business) => {
            const isSelected = business.id === entry.businessId;
            const blocked = !business.published || business.isExample;
            return (
              <li
                key={business.id}
                className={cn(
                  "rounded-2xl border p-3 sm:p-4",
                  isSelected ? "border-indigo-400 bg-indigo-50/60 dark:border-indigo-500/60 dark:bg-indigo-500/10" : "border-slate-200 dark:border-zinc-800",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900 dark:text-zinc-100">{business.name}</p>
                  {business.isExample ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-zinc-800">Example</span>
                  ) : business.published ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">Published · {business.percent}% complete</span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">Not published</span>
                  )}
                </div>
                {business.missingRequired.length > 0 && business.published && (
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Add before entering: {business.missingRequired.join(", ")}</p>
                )}
                {business.missingRecommended.length > 0 && business.published && business.missingRequired.length === 0 && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">Recommended: {business.missingRecommended.join(", ")}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {editable && !isSelected && !blocked && (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void run("business", () => updateMyEntry(authFetch, slug, { businessId: business.id }))}
                      className="btn-primary px-3 py-1.5 text-xs disabled:opacity-60"
                    >
                      {busy === "business" && <Loader2 size={13} className="animate-spin" />} Enter this business
                    </button>
                  )}
                  {isSelected && <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 dark:text-indigo-300"><CheckCircle2 size={14} /> Entered</span>}
                  {!business.isExample && (
                    <Link to={`/workspace/businesses?business=${encodeURIComponent(business.id)}`} className="btn-secondary px-3 py-1.5 text-xs">
                      {business.published && business.missingRequired.length === 0 ? "Edit profile" : "Complete business profile"}
                    </Link>
                  )}
                  {business.publicUrl && (
                    <Link to={business.publicUrl} className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      View public profile <ExternalLink size={12} />
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {selected?.publicUrl && (
        <p className="mt-2 break-all text-xs text-slate-500 dark:text-zinc-400">
          Link for your caption: <span className="font-semibold text-slate-700 dark:text-zinc-200">{window.location.origin}{selected.publicUrl}</span>
        </p>
      )}

      {/* Social post */}
      <h3 className="mt-7 text-sm font-extrabold text-slate-950 dark:text-white">Your social media post</h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
        Post a screenshot of your best score with your Discover profile link in the caption, tag and follow PitchNest, then paste the
        post's public link here.
      </p>
      <form
        className="mt-3 grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]"
        onSubmit={(event) => {
          event.preventDefault();
          void run("social", () =>
            updateMyEntry(authFetch, slug, {
              socialPlatform: platform || null,
              socialPostUrl: postUrl.trim() || null,
              profileLinkConfirmed: captionConfirmed,
            }),
          );
        }}
      >
        <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300">
          Platform
          <select value={platform} onChange={(e) => setPlatform(e.target.value as SocialPlatform | "")} disabled={!editable} className="input-field mt-1.5 text-sm">
            <option value="">Choose…</option>
            {SOCIAL_PLATFORMS.map((value) => <option key={value} value={value}>{PLATFORM_LABELS[value]}</option>)}
          </select>
        </label>
        <label className="block text-xs font-bold text-slate-600 dark:text-zinc-300">
          Public post link
          <input
            type="url"
            inputMode="url"
            value={postUrl}
            onChange={(e) => setPostUrl(e.target.value)}
            disabled={!editable}
            maxLength={500}
            placeholder="https://www.instagram.com/p/…"
            className="input-field mt-1.5 text-sm"
          />
        </label>
        <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-zinc-300 sm:col-span-2">
          <input type="checkbox" checked={captionConfirmed} onChange={(e) => setCaptionConfirmed(e.target.checked)} disabled={!editable} className="mt-0.5 accent-indigo-600" />
          My caption includes the link to my Discover business profile.
        </label>
        {editable && (
          <div className="sm:col-span-2">
            <button type="submit" disabled={busy !== null || !socialDirty} className="btn-secondary px-4 py-2 text-xs disabled:opacity-50">
              {busy === "social" && <Loader2 size={13} className="animate-spin" />} Save post details
            </button>
          </div>
        )}
      </form>

      {/* Optional screenshot */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 p-3 text-xs dark:bg-zinc-800/60">
        <ImageUp size={16} className="text-slate-400" />
        <span className="min-w-0 flex-1 text-slate-600 dark:text-zinc-300">
          {entry.social.evidenceUploaded
            ? "Screenshot uploaded. Only reviewers can see it."
            : "Optional: upload the screenshot you posted (PNG, JPEG or WebP, up to 4 MB). Your score always comes from PitchNest's records."}
        </span>
        {editable && (
          <>
            <label className={cn("btn-secondary cursor-pointer px-3 py-1.5 text-xs", busy !== null && "pointer-events-none opacity-60")}>
              {busy === "evidence" ? <Loader2 size={13} className="animate-spin" /> : null}
              {entry.social.evidenceUploaded ? "Replace" : "Upload"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  if (file.size > 4 * 1024 * 1024) {
                    setError("That image is over 4 MB. Please choose a smaller screenshot.");
                    return;
                  }
                  void run("evidence", async () => {
                    await uploadEvidence(authFetch, slug, file);
                    onChange({ ...entry, social: { ...entry.social, evidenceUploaded: true } });
                  });
                }}
              />
            </label>
            {entry.social.evidenceUploaded && (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void run("evidence", async () => {
                  await removeEvidence(authFetch, slug);
                  onChange({ ...entry, social: { ...entry.social, evidenceUploaded: false } });
                })}
                className="inline-flex items-center gap-1 px-2 py-1.5 font-semibold text-rose-600"
              >
                <Trash2 size={13} /> Remove
              </button>
            )}
          </>
        )}
      </div>

      <label className="mt-4 flex items-start gap-2 text-xs text-slate-600 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={entry.publicNameConsent}
          disabled={busy !== null}
          onChange={(e) => void run("consent", () => updateMyEntry(authFetch, slug, { publicNameConsent: e.target.checked }))}
          className="mt-0.5 accent-indigo-600"
        />
        If I win, PitchNest may show my name next to my business. (Without this, winners are shown by business only.)
      </label>

      {/* Submit */}
      <div className="mt-7 rounded-2xl border border-slate-200 p-4 dark:border-zinc-800">
        {!editable ? (
          <p className="text-sm text-slate-600 dark:text-zinc-300">
            {entry.placement !== null
              ? "Your entry has been selected. It can no longer be changed."
              : entry.status === "disqualified"
                ? "This entry was disqualified."
                : "Submissions for this challenge have closed. Your entry is as shown above."}
          </p>
        ) : entry.status === "submitted" || entry.status === "approved" ? (
          <p className="flex items-start gap-2 text-sm text-slate-700 dark:text-zinc-200">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
            <span>
              {entry.status === "approved"
                ? "Your entry is approved."
                : `Submitted on ${shortDate(entry.submittedAt)}. Our team is verifying your post.`}{" "}
              Your best score keeps updating until the deadline, so keep practising. Changing your business or post takes the
              entry back for you to submit again.
            </span>
          </p>
        ) : (
          <>
            <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">
              {entry.status === "needs_correction" ? "Resubmit your corrected entry" : "Submit your entry"}
            </h3>
            {entry.blockers.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-zinc-300">
                {entry.blockers.map((blocker) => (
                  <li key={blocker} className="flex items-start gap-1.5"><XCircle size={13} className="mt-0.5 shrink-0 text-slate-400" /> {blocker}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">Every requirement is verified. You can submit.</p>
            )}
            <label className="mt-3 flex items-start gap-2 text-xs text-slate-600 dark:text-zinc-300">
              <input type="checkbox" checked={acceptRules} onChange={(e) => setAcceptRules(e.target.checked)} className="mt-0.5 accent-indigo-600" />
              I confirm my entry follows the challenge rules and terms, and my post stays public until winners are announced.
            </label>
            <button
              type="button"
              disabled={busy !== null || !entry.readyToSubmit || !acceptRules}
              onClick={() => void run("submit", () => submitMyEntry(authFetch, slug))}
              className="btn-primary mt-3 w-full px-4 py-2.5 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {busy === "submit" ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {entry.status === "needs_correction" || entry.status === "rejected" ? "Resubmit entry" : "Submit entry"}
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" role="alert">
          {error}
          {missing.length > 0 && (
            <ul className="mt-1 list-disc pl-5 text-xs">
              {missing.map((item) => <li key={item}>{item}</li>)}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
