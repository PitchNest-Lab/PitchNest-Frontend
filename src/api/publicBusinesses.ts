export type PublicBusinessType =
  | "software"
  | "services"
  | "physical"
  | "traditional"
  | "other";

export interface PublicBusinessSummary {
  slug: string;
  name: string;
  tagline: string;
  businessType: PublicBusinessType;
  industry: string;
  stage: string;
  region: string;
  /** Approved images; null when the business has none. */
  logoUrl: string | null;
  coverUrl: string | null;
  publishedAt: string | null;
  /** A sample profile that shows what a complete business page looks like. */
  isExample?: boolean;
  /** Present only while Discover engagement is enabled on the server. */
  engagement?: { supportCount: number; commentCount: number };
}

export interface PublicTeamMember {
  name: string;
  title: string;
  avatarUrl: string | null;
  /** Their founder page, when they have one. */
  handle: string | null;
}

export interface PublicBusinessProfile extends PublicBusinessSummary {
  description: string;
  problem: string;
  solution: string;
  targetCustomer: string;
  websiteUrl: string;
  /** Members who chose to appear publicly. */
  team: PublicTeamMember[];
}

export interface PublicDirectoryFilters {
  q?: string;
  industry?: string;
  type?: PublicBusinessType | "";
  stage?: string;
  region?: string;
  cursor?: string;
  limit?: number;
}

/** Most supported first while Discover engagement is on, otherwise newest first. */
export type PublicDirectoryOrder = "most_supported" | "newest";

export interface PublicDirectoryPage {
  data: PublicBusinessSummary[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
  /** Absent from servers that predate it; those list newest first. */
  order?: PublicDirectoryOrder;
}

export class PublicBusinessApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PublicBusinessApiError";
    this.status = status;
  }
}

async function readResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new PublicBusinessApiError(
      body?.error || `Request failed (${response.status}).`,
      response.status,
    );
  }
  return body as T;
}

export async function fetchPublicBusinesses(
  filters: PublicDirectoryFilters,
  signal?: AbortSignal,
): Promise<PublicDirectoryPage> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "" && value !== null) {
      query.set(key, String(value));
    }
  }
  const response = await fetch(`/api/public/businesses?${query.toString()}`, { signal });
  return readResponse<PublicDirectoryPage>(response);
}

export async function fetchPublicBusiness(
  slug: string,
  signal?: AbortSignal,
): Promise<PublicBusinessProfile> {
  const response = await fetch(`/api/public/businesses/${encodeURIComponent(slug)}`, { signal });
  const body = await readResponse<{ data: PublicBusinessProfile }>(response);
  return body.data;
}
