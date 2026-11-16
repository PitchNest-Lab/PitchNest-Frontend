import type {
  OrgOverview,
  SeatUsage,
  ActivityOverview,
  FounderDrilldown,
  Member,
  OrganizationDetails,
  PitchStatus,
} from "../pages/organization/dashbaord/Main";

const BASE_URL = "/api/organization";

export type AuthFetch = (url: string, options?: RequestInit) => Promise<Response>;

export interface OrganizationReport {
  id: string;
  type: "Weekly" | "Monthly";
  title: string;
  generatedAt: string;
  rangeStart: string;
  rangeEnd: string;
  totalPitches: number;
  completionRate: number;
  avgScore: number;
  activeFounders: number;
  status: "ready";
}

export interface OrganizationReplay {
  id: string;
  founderName: string;
  pitchTitle: string;
  date: string;
  panelType: string;
  status: PitchStatus;
  score: number | null;
  replayUrl: string | null;
}

export interface FounderOrganizationInvite {
  id: string;
  email: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  status: "pending" | "accepted" | "revoked" | "expired";
}

export interface OrganizationTeamMember {
  id: number;
  name: string;
  email: string;
  role: "owner" | "admin" | "facilitator";
  status: "active" | "invited" | "revoked";
  created_at: string;
  accepted_at: string | null;
  last_login_at: string | null;
  invite_expires_at: string | null;
}

async function post<T>(
  authFetch: AuthFetch,
  path: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const res = await authFetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.error || `Request to ${path} failed (${res.status})`);
  }
  return json.data as T;
}

async function get<T>(authFetch: AuthFetch, path: string): Promise<T> {
  const res = await authFetch(`${BASE_URL}${path}`);
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error || `Request to ${path} failed (${res.status})`);
  return json.data as T;
}

async function remove(authFetch: AuthFetch, path: string): Promise<void> {
  const res = await authFetch(`${BASE_URL}${path}`, { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.error || `Request to ${path} failed (${res.status})`);
  }
}

// Organization identity and scope are derived from the authenticated token.
// No API accepts an organization id from browser-controlled request data.
export const fetchOrgDetails = (authFetch: AuthFetch) =>
  post<OrganizationDetails>(authFetch, "/details");
export const fetchOverview = (authFetch: AuthFetch) =>
  post<OrgOverview>(authFetch, "/overview");
export const fetchSeatUsage = (authFetch: AuthFetch) =>
  post<SeatUsage>(authFetch, "/seats");
export const fetchActivity = (authFetch: AuthFetch) =>
  post<ActivityOverview>(authFetch, "/activity");
export const fetchFounders = (authFetch: AuthFetch) =>
  post<{ founders: FounderDrilldown[] }>(authFetch, "/founder-drill").then(
    (data) => data.founders,
  );
export const fetchMembers = (authFetch: AuthFetch) =>
  post<{ members: Member[] }>(authFetch, "/members").then(
    (data) => data.members,
  );
export const generateWeeklyReport = (authFetch: AuthFetch, date?: string) =>
  post<any>(authFetch, "/reports/weekly", { date });
export const generateMonthlyReport = (
  authFetch: AuthFetch,
  month?: number,
  year?: number,
) => post<any>(authFetch, "/reports/monthly", { month, year });
export const fetchReports = (authFetch: AuthFetch) =>
  get<{ reports: OrganizationReport[] }>(authFetch, "/reports").then((data) => data.reports);
export const downloadReport = async (authFetch: AuthFetch, id: string) => {
  const res = await authFetch(`${BASE_URL}/reports/${encodeURIComponent(id)}/download`);
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.error || "Report download failed.");
  }
  return res.blob();
};
export const fetchReplays = (authFetch: AuthFetch) =>
  get<{ replays: OrganizationReplay[] }>(authFetch, "/replays").then((data) => data.replays);
export const fetchFounderInvites = (authFetch: AuthFetch) =>
  get<{ invites: FounderOrganizationInvite[] }>(authFetch, "/invites").then((data) => data.invites);
export const createFounderInvite = (authFetch: AuthFetch, email: string) =>
  post<{ invite: FounderOrganizationInvite; inviteUrl: string; emailSent: boolean }>(authFetch, "/invites", { email });
export const revokeFounderInvite = (authFetch: AuthFetch, id: string) =>
  remove(authFetch, `/invites/${encodeURIComponent(id)}`);
export const fetchOrganizationTeam = (authFetch: AuthFetch) =>
  get<{ members: OrganizationTeamMember[] }>(authFetch, "/team").then((data) => data.members);
export const inviteOrganizationTeamMember = (
  authFetch: AuthFetch,
  payload: { name: string; email: string; role: "admin" | "facilitator" },
) => post<{ member: OrganizationTeamMember; inviteUrl: string; emailSent: boolean }>(authFetch, "/team/invites", payload);
export const revokeOrganizationTeamMember = (authFetch: AuthFetch, id: number) =>
  remove(authFetch, `/team/${id}`);
