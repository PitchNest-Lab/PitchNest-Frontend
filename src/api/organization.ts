import type {
  OrgOverview,
  SeatUsage,
  ActivityOverview,
  FounderDrilldown,
  Member,
  OrganizationDetails,
} from "../pages/organization/dashbaord/Main";

const BASE_URL = "/api/organization"; // adjust to your mount path

async function post<T>(path: string, body: Record<string, any>): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request to ${path} failed (${res.status})`);
  const json = await res.json();
  return json.data as T;
}

export const fetchOrgDetails = (orgId: string) =>
  post<OrganizationDetails>("/details", { orgId });
export const fetchOverview = (orgId: string) => post<OrgOverview>("/overview", { orgId });
export const fetchSeatUsage = (orgId: string) => post<SeatUsage>("/seats", { orgId });
export const fetchActivity = (orgId: string) => post<ActivityOverview>("/activity", { orgId });
export const fetchFounders = (orgId: string) =>
  post<{ founders: FounderDrilldown[] }>("/founder-drill", { orgId }).then((d) => d.founders);
export const fetchMembers = (orgId: string) =>
  post<{ members: Member[] }>("/members", { orgId }).then((d) => d.members);
export const generateWeeklyReport = (orgId: string, date?: string) =>
  post<any>("/reports/weekly", { orgId, date });
export const generateMonthlyReport = (orgId: string, month?: number, year?: number) =>
  post<any>("/reports/monthly", { orgId, month, year });