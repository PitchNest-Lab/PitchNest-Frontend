import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Loader2, X } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { cn } from "../../../lib/utils";
import {
  ENTRY_STATUS_LABELS,
  fetchStaffParticipant,
  judgeStaffParticipant,
  PLATFORM_LABELS,
  PROFILE_CRITERIA,
  reviewStaffParticipant,
  SOCIAL_CHECKS,
  type ProfileCriterion,
  type SocialCheck,
  type StaffChallenge,
  type StaffParticipantDetail,
} from "../../../api/challenges";

const PROFILE_FIELDS: Array<[string, string]> = [
  ["tagline", "Tagline"],
  ["description", "Description"],
  ["problem", "Problem"],
  ["solution", "Solution"],
  ["targetCustomer", "Target customers"],
  ["industry", "Industry"],
  ["stage", "Stage"],
  ["region", "Region"],
  ["websiteUrl", "Website"],
];

const overall = (scores: Record<string, number> | null) => {
  if (!scores) return null;
  const values = ["delivery", "clarity", "scalability", "readiness"].map((key) => Number(scores[key]));
  return values.every((v) => Number.isFinite(v)) ? Math.round(values.reduce((a, b) => a + b, 0) / 4) : null;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-100 pt-4 dark:border-zinc-800">
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400">{title}</h3>
      <div className="mt-2 text-sm text-slate-700 dark:text-zinc-200">{children}</div>
    </section>
  );
}

/** One complete entry, its verification and its judging, for staff. */
export function EntryReviewDrawer({
  challenge,
  participantId,
  onClose,
  onChanged,
}: {
  challenge: StaffChallenge;
  participantId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { authFetch } = useAuth();
  const [detail, setDetail] = useState<StaffParticipantDetail | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [checks, setChecks] = useState<Partial<Record<SocialCheck, boolean>>>({});
  const [rubric, setRubric] = useState<Partial<Record<ProfileCriterion, string>>>({});
  const [pitchValid, setPitchValid] = useState(true);
  const [judgeNotes, setJudgeNotes] = useState("");
  const [shortlisted, setShortlisted] = useState(false);
  const locked = Boolean(challenge.resultsPublishedAt);

  const load = async () => {
    try {
      const data = await fetchStaffParticipant(authFetch, challenge.id, participantId);
      setDetail(data);
      setNote(data.reviewNote || "");
      setChecks(data.socialChecks || {});
      setRubric(Object.fromEntries(PROFILE_CRITERIA.map(([key]) => [key, data.profileScores?.[key] !== undefined ? String(data.profileScores[key]) : ""])));
      setPitchValid(data.pitchScoreValid);
      setJudgeNotes(data.judgeNotes || "");
      setShortlisted(data.shortlisted);
    } catch (err: any) {
      setError(err?.message || "The entry couldn't load.");
    }
  };

  useEffect(() => {
    void load();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantId]);

  const act = async (key: string, action: () => Promise<unknown>) => {
    setBusy(key);
    setError("");
    try {
      await action();
      await load();
      onChanged();
    } catch (err: any) {
      setError(err?.message || "That didn't work.");
    } finally {
      setBusy(null);
    }
  };

  const review = (action: "approve" | "request_correction" | "reject" | "disqualify" | "reopen") => {
    if (action === "disqualify" && !window.confirm("Disqualify this entry? The founder sees the reason you wrote.")) return;
    void act(action, () => reviewStaffParticipant(authFetch, challenge.id, participantId, { action, note, socialChecks: checks }));
  };

  const rubricComplete = PROFILE_CRITERIA.every(([key]) => /^(10|\d)$/.test(rubric[key] ?? ""));
  const saveJudging = () =>
    void act("judging", () =>
      judgeStaffParticipant(authFetch, challenge.id, participantId, {
        ...(rubricComplete ? { profileScores: Object.fromEntries(PROFILE_CRITERIA.map(([key]) => [key, Number(rubric[key])])) as Record<ProfileCriterion, number> } : {}),
        pitchScoreValid: pitchValid,
        judgeNotes,
        shortlisted,
      }),
    );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50" onClick={onClose}>
      <aside
        className="h-full w-full max-w-2xl overflow-y-auto bg-white p-5 shadow-2xl dark:bg-zinc-900 sm:p-6"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Entry review"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Entry</p>
            <h2 className="truncate text-xl font-extrabold text-slate-950 dark:text-white">{detail?.name ?? "…"}</h2>
            {detail && <p className="text-xs text-slate-500 dark:text-zinc-400">{detail.email} · joined {new Date(detail.joinedAt).toLocaleDateString()}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {!detail && !error && <p className="mt-8 flex items-center gap-2 text-sm text-slate-400"><Loader2 size={16} className="animate-spin" /> Loading…</p>}
        {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" role="alert">{error}</p>}

        {detail && (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-zinc-800">{ENTRY_STATUS_LABELS[detail.status]}</span>
              {detail.submittedAt && <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-zinc-800">Submitted {new Date(detail.submittedAt).toLocaleString()}</span>}
              {detail.placement && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">Place {detail.placement}</span>}
            </div>

            <Section title="Pitch (verified by PitchNest)">
              <p>
                Best score <strong>{detail.bestScore ?? "none yet"}</strong>
                {detail.bestScoreAt ? ` from ${new Date(detail.bestScoreAt).toLocaleString()}` : ""} · {detail.completedSessions} eligible complete
                session{detail.completedSessions === 1 ? "" : "s"}
                {detail.scoreFrozenAt ? " · frozen at the deadline" : ""}
              </p>
              {detail.sessions.length > 0 && (
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-xs">
                    <thead className="text-slate-400">
                      <tr><th className="py-1 pr-3">Session</th><th className="py-1 pr-3">When</th><th className="py-1 pr-3">Mode</th><th className="py-1 pr-3">Status</th><th className="py-1">Score</th></tr>
                    </thead>
                    <tbody>
                      {detail.sessions.map((session) => (
                        <tr key={session.id} className={cn("border-t border-slate-100 dark:border-zinc-800", session.id === detail.bestSessionId && "font-bold text-indigo-700 dark:text-indigo-300")}>
                          <td className="py-1 pr-3">#{session.id}</td>
                          <td className="py-1 pr-3">{new Date(session.createdAt).toLocaleString()}{!session.inWindow && " (after deadline)"}</td>
                          <td className="py-1 pr-3">{session.mode}</td>
                          <td className="py-1 pr-3">{session.status ?? "—"}</td>
                          <td className="py-1">{overall(session.scores) ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-1 text-[11px] text-slate-400">Only {challenge.eligibleSessionModes.join(" and ")} sessions with a complete evaluation inside the challenge window count.</p>
                </div>
              )}
            </Section>

            <Section title="Subscription">
              <p>
                {detail.subscription?.state === "verified" ? "Verified paid plan" : detail.subscription?.state === "pending" ? "Payment pending" : detail.subscription?.state === "not_required" ? "Not required" : "No paid plan"}
                {detail.subscription?.plan ? ` · ${detail.subscription.plan}` : ""}
                {detail.subscription?.expiresAt ? ` · until ${new Date(detail.subscription.expiresAt).toLocaleDateString()}` : ""}
              </p>
              {detail.subscriptionVerifiedAt && <p className="text-xs text-slate-500">First verified {new Date(detail.subscriptionVerifiedAt).toLocaleString()}</p>}
            </Section>

            <Section title="Discover business">
              {detail.business ? (
                <>
                  <p className="flex flex-wrap items-center gap-2">
                    <strong>{detail.business.name}</strong>
                    {detail.business.published ? (
                      <Link to={`/businesses/${encodeURIComponent(detail.business.slug)}`} target="_blank" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600">
                        Public profile <ExternalLink size={11} />
                      </Link>
                    ) : <span className="text-xs font-bold text-amber-600">Not published</span>}
                    <span className="text-xs text-slate-500">{detail.business.percent}% complete</span>
                  </p>
                  {detail.business.missingRequired?.length > 0 && <p className="mt-1 text-xs text-amber-700">Missing: {detail.business.missingRequired.join(", ")}</p>}
                  {detail.business.profile && (
                    <dl className="mt-2 space-y-2">
                      {PROFILE_FIELDS.map(([key, label]) => (
                        <div key={key}>
                          <dt className="text-[11px] font-bold text-slate-400">{label}</dt>
                          <dd className="whitespace-pre-wrap break-words text-xs">{String(detail.business!.profile![key] ?? "") || "—"}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </>
              ) : <p>No business chosen yet.</p>}
            </Section>

            <Section title="Social media post">
              {detail.socialPostUrl ? (
                <p className="break-all">
                  {detail.socialPlatform ? PLATFORM_LABELS[detail.socialPlatform] : ""}:{" "}
                  <a href={detail.socialPostUrl} target="_blank" rel="noopener noreferrer nofollow" className="font-bold text-indigo-600">{detail.socialPostUrl}</a>
                </p>
              ) : <p>No post yet.</p>}
              <p className="mt-1 text-xs text-slate-500">
                Caption link confirmed by the founder: {detail.profileLinkConfirmed ? "yes" : "no"} · Name may be shown if they win: {detail.publicNameConsent ? "yes" : "no"}
              </p>
              {detail.evidenceUrl && (
                <a href={detail.evidenceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                  <img src={detail.evidenceUrl} alt="Screenshot the founder uploaded" className="max-h-64 rounded-xl border border-slate-200 object-contain dark:border-zinc-700" />
                </a>
              )}
            </Section>

            <Section title="Verification">
              <div className="grid gap-1.5 sm:grid-cols-2">
                {SOCIAL_CHECKS.map(([key, label]) => (
                  <label key={key} className="flex items-start gap-2 text-xs">
                    <input type="checkbox" checked={checks[key] === true} onChange={(e) => setChecks((c) => ({ ...c, [key]: e.target.checked }))} className="mt-0.5 accent-indigo-600" />
                    {label}
                  </label>
                ))}
              </div>
              <label className="mt-3 block text-xs font-bold text-slate-600 dark:text-zinc-300">
                Note to the founder (required to ask for a correction, reject or disqualify)
                <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={3} className="input-field mt-1.5 text-sm" />
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={busy !== null || locked} onClick={() => review("approve")} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                  {busy === "approve" && <Loader2 size={12} className="mr-1 inline animate-spin" />}Approve
                </button>
                <button type="button" disabled={busy !== null || locked} onClick={() => review("request_correction")} className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-50">Request correction</button>
                <button type="button" disabled={busy !== null || locked} onClick={() => review("reject")} className="btn-secondary px-3 py-2 text-xs disabled:opacity-50">Reject</button>
                <button type="button" disabled={busy !== null || locked} onClick={() => review("disqualify")} className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50">Disqualify</button>
                <button type="button" disabled={busy !== null || locked} onClick={() => review("reopen")} className="btn-ghost px-3 py-2 text-xs disabled:opacity-50">Reopen</button>
              </div>
              {locked && <p className="mt-2 text-xs text-slate-500">Results are published. Unpublish them to change reviews or scores.</p>}
            </Section>

            <Section title={`Judging (pitch ${challenge.pitchWeight}% · profile ${100 - challenge.pitchWeight}%)`}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PROFILE_CRITERIA.map(([key, label]) => (
                  <label key={key} className="block text-[11px] font-bold text-slate-600 dark:text-zinc-300">
                    {label} (0-10)
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step={1}
                      inputMode="numeric"
                      value={rubric[key] ?? ""}
                      onChange={(e) => setRubric((r) => ({ ...r, [key]: e.target.value }))}
                      className="input-field mt-1 px-3 py-2 text-sm"
                    />
                  </label>
                ))}
              </div>
              <label className="mt-3 flex items-center gap-2 text-xs">
                <input type="checkbox" checked={pitchValid} onChange={(e) => setPitchValid(e.target.checked)} className="accent-indigo-600" />
                The pitch score is valid (untick to count it as zero, and say why in the notes)
              </label>
              <label className="mt-2 flex items-center gap-2 text-xs">
                <input type="checkbox" checked={shortlisted} onChange={(e) => setShortlisted(e.target.checked)} className="accent-indigo-600" />
                Shortlisted
              </label>
              <label className="mt-2 block text-xs font-bold text-slate-600 dark:text-zinc-300">
                Judge notes (staff only)
                <textarea value={judgeNotes} onChange={(e) => setJudgeNotes(e.target.value)} maxLength={3000} rows={3} className="input-field mt-1.5 text-sm" />
              </label>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button type="button" disabled={busy !== null || locked} onClick={saveJudging} className="btn-primary px-4 py-2 text-xs disabled:opacity-50">
                  {busy === "judging" && <Loader2 size={12} className="animate-spin" />} Save judging
                </button>
                <span className="text-xs text-slate-500">
                  Profile score {detail.profileScore ?? "—"} · Final score <strong>{detail.finalScore ?? "—"}</strong>
                </span>
              </div>
              {!rubricComplete && <p className="mt-1 text-[11px] text-slate-400">Score all six criteria (whole numbers 0-10) to record the profile score.</p>}
            </Section>

            {detail.audit.length > 0 && (
              <Section title="Decisions on this entry">
                <ul className="space-y-1 text-xs">
                  {detail.audit.map((row) => (
                    <li key={row.id}>
                      {new Date(row.created_at).toLocaleString()} · {row.action.replace("participant.", "").replace("_", " ")}
                      {row.metadata?.note ? ` — "${row.metadata.note}"` : ""}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
