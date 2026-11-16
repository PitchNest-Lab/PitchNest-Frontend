import React, { useEffect, useState } from "react";
import { ClipboardList, Plus, Save, Send, Archive, FileText, ExternalLink, Loader2 } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  archiveOrganizationProgramForm,
  fetchOrganizationFormSubmissions,
  fetchOrganizationProgramForms,
  getOrganizationSubmissionFileUrl,
  reviewOrganizationSubmission,
  saveOrganizationProgramForm,
  type OrganizationProgramForm,
  type OrganizationProgramSubmission,
} from "../../../api/organization";
import type { ProgramFieldType, ProgramFormField } from "../../../api/founderPrograms";

const FIELD_TYPES: { value: ProgramFieldType; label: string }[] = [
  { value: "short_text", label: "Short answer" },
  { value: "long_text", label: "Long answer" },
  { value: "url", label: "Link" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "select", label: "Choose from a list" },
  { value: "checkbox", label: "Yes / no" },
  { value: "file", label: "File upload" },
];

const fieldId = () => `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const toLocalDateTime = (value: string) => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

export default function ProgramFormsPanel() {
  const { authFetch } = useAuth();
  const [forms, setForms] = useState<OrganizationProgramForm[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [submissions, setSubmissions] = useState<OrganizationProgramSubmission[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [fields, setFields] = useState<ProgramFormField[]>([]);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = async () => {
    const next = await fetchOrganizationProgramForms(authFetch);
    setForms(next);
    return next;
  };

  useEffect(() => {
    fetchOrganizationProgramForms(authFetch)
      .then(setForms)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load program forms."))
      .finally(() => setLoading(false));
  }, [authFetch]);

  useEffect(() => {
    if (!selectedId) {
      setSubmissions([]);
      return;
    }
    fetchOrganizationFormSubmissions(authFetch, selectedId)
      .then(setSubmissions)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load submissions."));
  }, [authFetch, selectedId]);

  const startNew = () => {
    setSelectedId("");
    setTitle("");
    setDescription("");
    setDueAt("");
    setFields([{ id: fieldId(), label: "", type: "short_text", required: true }]);
    setError("");
    setNotice("");
  };

  const editForm = (form: OrganizationProgramForm) => {
    setSelectedId(form.id);
    setTitle(form.title);
    setDescription(form.description);
    setDueAt(form.due_at ? toLocalDateTime(form.due_at) : "");
    setFields(form.fields);
    setError("");
    setNotice("");
  };

  const updateField = (id: string, patch: Partial<ProgramFormField>) => {
    setFields((current) => current.map((field) => field.id === id ? { ...field, ...patch } : field));
  };

  const save = async (status: "draft" | "published") => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const form = await saveOrganizationProgramForm(authFetch, {
        ...(selectedId ? { id: selectedId } : {}),
        title,
        description,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        fields,
        status,
      });
      setSelectedId(form.id);
      await refresh();
      setNotice(status === "published" ? "Form published. Members of this organization can now submit it." : "Draft saved.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save this form.");
    } finally {
      setSaving(false);
    }
  };

  const archive = async (form: OrganizationProgramForm) => {
    if (!window.confirm(`Archive “${form.title}”? Founders will no longer be able to submit it.`)) return;
    try {
      await archiveOrganizationProgramForm(authFetch, form.id);
      setForms((current) => current.filter((item) => item.id !== form.id));
      if (selectedId === form.id) startNew();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not archive this form.");
    }
  };

  const review = async (submission: OrganizationProgramSubmission) => {
    try {
      const updated = await reviewOrganizationSubmission(authFetch, submission.id, feedback[submission.id] ?? submission.reviewerFeedback ?? "");
      setSubmissions((current) => current.map((item) => item.id === submission.id ? { ...item, ...updated.submission } : item));
      setNotice("Review saved and shared with the founder.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save this review.");
    }
  };

  const openFile = async (submissionId: string, fileId: string) => {
    try {
      const url = await getOrganizationSubmissionFileUrl(authFetch, submissionId, fileId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not open this file.");
    }
  };

  if (loading) return <div className="flex items-center gap-2 p-8 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading program forms…</div>;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Founder submissions</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">Program forms</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">Collect applications, progress updates, links, dates, choices, and private file attachments from founders in this organization.</p>
          </div>
          <button type="button" onClick={startNew} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16} />New form</button>
        </div>
        <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {forms.map((form) => (
            <div key={form.id} className={`rounded-xl border p-4 ${selectedId === form.id ? "border-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/20" : "border-slate-200 dark:border-zinc-800"}`}>
              <button type="button" onClick={() => editForm(form)} className="w-full text-left">
                <div className="flex items-start justify-between gap-2"><span className="font-semibold text-slate-900 dark:text-white">{form.title}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${form.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{form.status}</span></div>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{form.description || "No description"}</p>
                <p className="mt-3 text-xs text-slate-500">{form.total} submissions · {form.pending} awaiting review</p>
              </button>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-zinc-800">
                <button type="button" onClick={() => editForm(form)} className="text-xs font-semibold text-indigo-600">Edit form</button>
                <button type="button" onClick={() => void archive(form)} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600"><Archive size={13} />Archive</button>
              </div>
            </div>
          ))}
          {!forms.length && <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-zinc-700">No forms yet. Create one to start collecting founder submissions.</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2"><ClipboardList className="text-indigo-600" size={18} /><h3 className="font-bold text-slate-900 dark:text-white">{selectedId ? "Edit form" : "Create a form"}</h3></div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-zinc-300">Form name<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="e.g. Monthly founder update" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" /></label>
          <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-zinc-300">Deadline (optional)<input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" /></label>
          <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-zinc-300 md:col-span-2">Instructions<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} maxLength={2000} placeholder="Tell founders what this submission is for." className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" /></label>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between"><h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100">Questions</h4><button type="button" onClick={() => setFields((current) => [...current, { id: fieldId(), label: "", type: "short_text", required: false }])} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600"><Plus size={14} />Add question</button></div>
          {fields.map((field, index) => (
            <div key={field.id} className="grid gap-2 rounded-xl border border-slate-200 p-3 dark:border-zinc-800 md:grid-cols-[minmax(0,1fr)_190px_auto]">
              <label className="space-y-1 text-[11px] font-semibold text-slate-500">Question {index + 1}<input value={field.label} onChange={(event) => updateField(field.id, { label: event.target.value })} maxLength={120} placeholder="What should the founder submit?" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" /></label>
              <label className="space-y-1 text-[11px] font-semibold text-slate-500">Answer type<select value={field.type} onChange={(event) => updateField(field.id, { type: event.target.value as ProgramFieldType, options: event.target.value === "select" ? field.options?.length ? field.options : ["Option 1"] : undefined })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">{FIELD_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
              <label className="flex items-center gap-2 self-end pb-2 text-xs text-slate-600 dark:text-zinc-300"><input type="checkbox" checked={field.required} onChange={(event) => updateField(field.id, { required: event.target.checked })} />Required</label>
              <label className="space-y-1 text-[11px] font-semibold text-slate-500 md:col-span-2">Help text (optional)<input value={field.helpText ?? ""} onChange={(event) => updateField(field.id, { helpText: event.target.value })} maxLength={500} placeholder="Explain what a good answer should include." className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" /></label>
              {field.type === "select" && <label className="space-y-1 text-[11px] font-semibold text-slate-500 md:col-span-2">Options, one per line<textarea value={(field.options ?? []).join("\n")} onChange={(event) => updateField(field.id, { options: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean).slice(0, 30) })} rows={2} placeholder="Option 1\nOption 2" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" /></label>}
              <button type="button" onClick={() => setFields((current) => current.filter((item) => item.id !== field.id))} className="justify-self-end text-xs text-rose-600">Remove</button>
            </div>
          ))}
          {!fields.length && <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">Add at least one question before saving.</p>}
        </div>
        {error && <p role="alert" className="mt-4 text-sm text-rose-600">{error}</p>}
        {notice && <p role="status" className="mt-4 text-sm text-emerald-700">{notice}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" disabled={saving} onClick={() => void save("draft")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200"><Save size={15} />Save draft</button>
          <button type="button" disabled={saving} onClick={() => void save("published")} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Send size={15} />{saving ? "Saving…" : "Publish form"}</button>
        </div>
      </section>

      {selectedId && (
        <section className="space-y-3">
          <div><h3 className="text-lg font-bold text-slate-900 dark:text-white">Founder submissions</h3><p className="text-sm text-slate-500">Only founders in this organization can submit or see their own feedback.</p></div>
          {!submissions.length && <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-zinc-700">No submissions yet.</div>}
          {submissions.map((submission) => (
            <article key={submission.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="font-bold text-slate-900 dark:text-white">{submission.founder.name || "Founder"}</h4><p className="text-xs text-slate-500">{submission.founder.email} · Submitted {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : "—"}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${submission.status === "reviewed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{submission.status}</span></div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">{submission.fields.map((field) => {
                const value = submission.answers?.[field.id];
                if (value == null || value === "") return null;
                if (field.type === "file" && typeof value === "string") return <div key={field.id} className="rounded-xl bg-slate-50 p-3 dark:bg-zinc-800"><p className="text-[11px] font-bold uppercase text-slate-500">{field.label}</p><button type="button" onClick={() => void openFile(submission.id, value)} className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600"><FileText size={14} />Open attachment <ExternalLink size={13} /></button></div>;
                return <div key={field.id} className="rounded-xl bg-slate-50 p-3 dark:bg-zinc-800"><p className="text-[11px] font-bold uppercase text-slate-500">{field.label}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800 dark:text-zinc-100">{field.type === "checkbox" ? value ? "Yes" : "No" : String(value)}</p></div>;
              })}</div>
              <div className="mt-4 border-t border-slate-100 pt-4 dark:border-zinc-800"><label className="block text-xs font-semibold text-slate-600 dark:text-zinc-300">Feedback for founder<textarea value={feedback[submission.id] ?? submission.reviewerFeedback ?? ""} onChange={(event) => setFeedback((current) => ({ ...current, [submission.id]: event.target.value }))} rows={2} maxLength={5000} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" /></label><button type="button" onClick={() => void review(submission)} className="mt-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900">Save review</button></div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
