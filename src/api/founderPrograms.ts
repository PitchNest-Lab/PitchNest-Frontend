export type ProgramFieldType = "short_text" | "long_text" | "url" | "number" | "date" | "select" | "checkbox" | "file";
export interface ProgramFormField {
  id: string;
  label: string;
  type: ProgramFieldType;
  required: boolean;
  helpText?: string;
  options?: string[];
}
export interface FounderProgramForm {
  id: string;
  title: string;
  description: string;
  fields: ProgramFormField[];
  due_at: string | null;
  updated_at: string;
}
export interface FounderProgram {
  membershipId: string;
  organizationId: number;
  orgCode: string;
  organizationName: string;
  websiteUrl: string;
  cohort: string | null;
  joinedAt: string;
  forms: FounderProgramForm[];
}
export interface FounderProgramSubmission {
  id: string;
  formId: string;
  formTitle: string;
  status: "submitted" | "reviewed";
  submittedAt: string;
  reviewerFeedback: string | null;
}

type AuthFetch = (url: string, options?: RequestInit) => Promise<Response>;
const BASE = "/api/founder/programs";

async function request<T>(authFetch: AuthFetch, path: string, options?: RequestInit): Promise<T> {
  const response = await authFetch(`${BASE}${path}`, options);
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(json?.error || "Could not load program information.");
  if (!json || typeof json !== "object" || !json.data || typeof json.data !== "object") {
    throw new Error("The program service returned an unexpected response. Please try again.");
  }
  return json.data as T;
}

export const fetchFounderPrograms = (authFetch: AuthFetch) =>
  request<{ programs: FounderProgram[] }>(authFetch, "").then((result) => result.programs);

export const fetchProgramForms = (authFetch: AuthFetch, organizationId: number) =>
  request<{ forms: FounderProgramForm[] }>(authFetch, `/${organizationId}/forms`).then((result) => result.forms);

export const fetchFounderSubmissions = (authFetch: AuthFetch, organizationId: number) =>
  request<{ submissions: FounderProgramSubmission[] }>(authFetch, `/${organizationId}/submissions`).then((result) => result.submissions);

export const createProgramSubmissionDraft = (authFetch: AuthFetch, organizationId: number, formId: string) =>
  request<{ submissionId: string }>(authFetch, `/${organizationId}/forms/${encodeURIComponent(formId)}/submissions`, { method: "POST" });

export const uploadProgramSubmissionFile = async (
  authFetch: AuthFetch,
  organizationId: number,
  submissionId: string,
  fieldId: string,
  file: File,
) => {
  const body = new FormData();
  body.append("fieldId", fieldId);
  body.append("file", file);
  return request<{ fileId: string; fileName: string }>(authFetch, `/${organizationId}/submissions/${encodeURIComponent(submissionId)}/files`, { method: "POST", body });
};

export const submitProgramAnswers = (authFetch: AuthFetch, organizationId: number, submissionId: string, answers: Record<string, unknown>) =>
  request<{ submitted: boolean; submittedAt: string }>(authFetch, `/${organizationId}/submissions/${encodeURIComponent(submissionId)}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });

export const getFounderProgramFileUrl = async (authFetch: AuthFetch, organizationId: number, submissionId: string, fileId: string) =>
  request<{ url: string }>(authFetch, `/${organizationId}/submissions/${encodeURIComponent(submissionId)}/files/${encodeURIComponent(fileId)}`).then((result) => result.url);
