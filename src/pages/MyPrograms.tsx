import React, { useEffect, useState } from "react";
import { ArrowRight, Building2, ClipboardList, FileUp, Loader2, Send, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  createProgramSubmissionDraft,
  fetchFounderPrograms,
  fetchFounderSubmissions,
  submitProgramAnswers,
  uploadProgramSubmissionFile,
  type FounderProgram,
  type FounderProgramForm,
  type FounderProgramSubmission,
  type ProgramFormField,
} from "../api/founderPrograms";

function fieldLabel(field: ProgramFormField) {
  return <>{field.label}{field.required && <span className="ml-1 text-rose-500">*</span>}</>;
}

export default function MyPrograms() {
  const { authFetch } = useAuth();
  const [programs, setPrograms] = useState<FounderProgram[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const [selectedForm, setSelectedForm] = useState<FounderProgramForm | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [submissions, setSubmissions] = useState<FounderProgramSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refreshPrograms = async () => {
    const result = await fetchFounderPrograms(authFetch);
    setPrograms(result);
    setSelectedOrganizationId((current) => current && result.some((item) => String(item.organizationId) === current)
      ? current
      : result.length === 1 ? String(result[0].organizationId) : "");
    return result;
  };

  useEffect(() => {
    refreshPrograms()
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load your programs."))
      .finally(() => setLoading(false));
  }, [authFetch]);

  const program = programs.find((item) => String(item.organizationId) === selectedOrganizationId) ?? null;

  useEffect(() => {
    if (!program) {
      setSubmissions([]);
      return;
    }
    fetchFounderSubmissions(authFetch, program.organizationId)
      .then(setSubmissions)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load your submissions."));
  }, [authFetch, program?.organizationId]);

  const openForm = (form: FounderProgramForm) => {
    setSelectedForm(form);
    setAnswers(Object.fromEntries(form.fields.filter((field) => field.type === "checkbox").map((field) => [field.id, false])));
    setFiles({});
    setError("");
    setNotice("");
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!program || !selectedForm) return;
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const draft = await createProgramSubmissionDraft(authFetch, program.organizationId, selectedForm.id);
      const nextAnswers: Record<string, unknown> = { ...answers };
      for (const field of selectedForm.fields) {
        const file = files[field.id];
        if (field.type === "file" && file) {
          const uploaded = await uploadProgramSubmissionFile(authFetch, program.organizationId, draft.submissionId, field.id, file);
          nextAnswers[field.id] = uploaded.fileId;
        }
      }
      await submitProgramAnswers(authFetch, program.organizationId, draft.submissionId, nextAnswers);
      const updated = await fetchFounderSubmissions(authFetch, program.organizationId);
      setSubmissions(updated);
      setSelectedForm(null);
      setAnswers({});
      setFiles({});
      setNotice(`“${selectedForm.title}” was submitted to ${program.organizationName}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not submit this form.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-12 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading your programs…</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 lg:px-0">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300"><Building2 size={22} /></div><div><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Founder programs</p><h1 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">My programs</h1><p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">Join a program through its organization invitation, then submit that program’s forms here. Each organization receives only the submissions and pitch sessions you associate with that program.</p></div></div>
        <div className="mt-5 flex items-start gap-2 rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-600" />Use this page to submit forms and documents your organization requests. Organizations can also see scores from sessions you assign to that program; transcripts stay private. A recording is shared only when you opt in for that session in Pre-Pitch Configuration.</div>
        <Link to={program ? `/setup?program=${program.organizationId}` : "/setup"} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Set up a program pitch <ArrowRight size={15} /></Link>
      </header>

      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">{notice}</p>}

      {!programs.length ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900"><Building2 className="mx-auto text-slate-400" /><h2 className="mt-3 font-bold text-slate-900 dark:text-white">No organization programs yet</h2><p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">An organization must invite your PitchNest account. Open its invitation while signed in with the invited email to join. You can join more than one organization using the same founder account.</p></section>
      ) : (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <label htmlFor="program-select" className="block text-xs font-bold uppercase tracking-wider text-slate-500">Choose a program</label>
            <select id="program-select" value={selectedOrganizationId} onChange={(event) => { setSelectedOrganizationId(event.target.value); setSelectedForm(null); setError(""); setNotice(""); }} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
              <option value="">Select an organization</option>
              {programs.map((item) => <option key={item.membershipId} value={item.organizationId}>{item.organizationName}{item.cohort ? ` · ${item.cohort}` : ""}</option>)}
            </select>
            {program && <p className="mt-2 text-xs text-slate-500">Member since {new Date(program.joinedAt).toLocaleDateString()}{program.cohort ? ` · Cohort ${program.cohort}` : ""}</p>}
          </section>

          {program && <>
            <section className="space-y-3">
              <div className="flex items-center gap-2"><ClipboardList className="text-indigo-600" size={18} /><h2 className="text-lg font-bold text-slate-900 dark:text-white">Forms from {program.organizationName}</h2></div>
              {!program.forms.length ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500 dark:border-zinc-700 dark:bg-zinc-900">This organization has not published a form yet.</p> : <div className="grid gap-3 md:grid-cols-2">{program.forms.map((form) => {
                const expired = !!form.due_at && new Date(form.due_at).getTime() < Date.now();
                return <article key={form.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><h3 className="font-bold text-slate-900 dark:text-white">{form.title}</h3><p className="mt-1 text-sm text-slate-500">{form.description || "No additional instructions."}</p>{form.due_at && <p className={`mt-3 text-xs ${expired ? "text-rose-600" : "text-slate-500"}`}>{expired ? "Deadline passed" : "Due"} {new Date(form.due_at).toLocaleString()}</p>}<button type="button" disabled={expired} onClick={() => openForm(form)} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Open form</button></article>;
              })}</div>}
            </section>

            {selectedForm && <form onSubmit={submit} className="space-y-5 rounded-2xl border border-indigo-200 bg-white p-5 dark:border-indigo-900 dark:bg-zinc-900 sm:p-6">
              <div><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">{program.organizationName}</p><h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{selectedForm.title}</h2>{selectedForm.description && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-500">{selectedForm.description}</p>}</div>
              <div className="space-y-4">{selectedForm.fields.map((field) => <label key={field.id} className="block space-y-1.5 text-sm font-semibold text-slate-700 dark:text-zinc-200">{fieldLabel(field)}{field.helpText && <span className="block text-xs font-normal text-slate-500">{field.helpText}</span>}
                {field.type === "short_text" && <input required={field.required} maxLength={1000} value={String(answers[field.id] ?? "")} onChange={(event) => setAnswers((current) => ({ ...current, [field.id]: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />}
                {field.type === "long_text" && <textarea required={field.required} maxLength={10000} rows={4} value={String(answers[field.id] ?? "")} onChange={(event) => setAnswers((current) => ({ ...current, [field.id]: event.target.value }))} className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />}
                {field.type === "url" && <input required={field.required} type="url" value={String(answers[field.id] ?? "")} onChange={(event) => setAnswers((current) => ({ ...current, [field.id]: event.target.value }))} placeholder="https://" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />}
                {field.type === "number" && <input required={field.required} type="number" value={String(answers[field.id] ?? "")} onChange={(event) => setAnswers((current) => ({ ...current, [field.id]: event.target.value === "" ? "" : Number(event.target.value) }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />}
                {field.type === "date" && <input required={field.required} type="date" value={String(answers[field.id] ?? "")} onChange={(event) => setAnswers((current) => ({ ...current, [field.id]: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />}
                {field.type === "select" && <select required={field.required} value={String(answers[field.id] ?? "")} onChange={(event) => setAnswers((current) => ({ ...current, [field.id]: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"><option value="">Choose an option</option>{(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}</select>}
                {field.type === "checkbox" && <span className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-normal dark:border-zinc-700 dark:bg-zinc-800"><input type="checkbox" checked={answers[field.id] === true} onChange={(event) => setAnswers((current) => ({ ...current, [field.id]: event.target.checked }))} />Yes</span>}
                {field.type === "file" && <span className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm font-normal dark:border-zinc-700 dark:bg-zinc-800"><FileUp size={17} className="shrink-0 text-slate-500" /><input required={field.required} type="file" accept=".pdf,.docx,.png,.jpg,.jpeg,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,text/plain" onChange={(event) => setFiles((current) => ({ ...current, [field.id]: event.target.files?.[0] ?? null }))} className="min-w-0 text-xs" /></span>}
              </label>)}</div>
              <div className="flex flex-wrap gap-2"><button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Send size={15} />{submitting ? "Submitting…" : "Submit to organization"}</button><button type="button" disabled={submitting} onClick={() => setSelectedForm(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:border-zinc-700 dark:text-zinc-300">Cancel</button></div>
            </form>}

            <section className="space-y-3"><h2 className="text-lg font-bold text-slate-900 dark:text-white">Your submissions</h2>{!submissions.length ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500 dark:border-zinc-700 dark:bg-zinc-900">No submissions to this program yet.</p> : submissions.map((submission) => <article key={submission.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-semibold text-slate-900 dark:text-white">{submission.formTitle}</h3><p className="text-xs text-slate-500">Submitted {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : "—"}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">{submission.status}</span></div>{submission.reviewerFeedback && <p className="mt-3 rounded-lg bg-indigo-50 p-3 text-sm text-slate-700 dark:bg-indigo-950/30 dark:text-zinc-200"><strong>Organization feedback:</strong> {submission.reviewerFeedback}</p>}</article>)}</section>
          </>}
        </>
      )}
    </div>
  );
}
