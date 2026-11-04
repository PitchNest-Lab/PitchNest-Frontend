import type { AuthFetch } from "./businesses";

/** Challenges PitchNest hosts itself, a founder's entry, and the staff tools. */

export const DEFAULT_CHALLENGE_POSTER_URL = "/pitchnest-challenge-poster-1600.jpg";

/** Prefer the staff-uploaded image, then the bundled poster for the seeded challenge. */
export function challengePosterUrl(challenge: {
  slug: string;
  bannerUrl?: string | null;
  imageUrl?: string | null;
}): string | null {
  return challenge.bannerUrl ?? challenge.imageUrl ?? (
    challenge.slug === "pitchnest-challenge" ? DEFAULT_CHALLENGE_POSTER_URL : null
  );
}

export type ChallengePhase = "draft" | "upcoming" | "open" | "closed" | "judging" | "completed" | "cancelled";
export type ChallengeStatus = "draft" | "published" | "open" | "closed" | "judging" | "completed" | "cancelled";
export type EntryStatus = "in_progress" | "submitted" | "needs_correction" | "approved" | "rejected" | "disqualified";
export type SocialPlatform = "instagram" | "facebook" | "x";
export type ChecklistStatus = "not_started" | "in_progress" | "completed" | "pending_verification" | "needs_correction";
export type ConfirmationItem = "prizes" | "dates" | "discount" | "social" | "judging" | "terms";

export const SOCIAL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "x"];
export const PLATFORM_LABELS: Record<SocialPlatform, string> = { instagram: "Instagram", facebook: "Facebook", x: "X (Twitter)" };
export const PROFILE_CRITERIA = [
  ["completeness", "Completeness"],
  ["problem", "Problem clarity"],
  ["solution", "Solution clarity"],
  ["market", "Target market"],
  ["model", "Business model"],
  ["traction", "Traction and support"],
] as const;
export type ProfileCriterion = (typeof PROFILE_CRITERIA)[number][0];
export const SOCIAL_CHECKS = [
  ["postPublic", "The post is public and opens"],
  ["scoreScreenshot", "It shows a PitchNest score screenshot"],
  ["profileLink", "The caption links the Discover profile"],
  ["tagged", "PitchNest is tagged"],
  ["collaboration", "Collaboration requested (where the platform allows)"],
  ["follows", "The founder follows PitchNest"],
] as const;
export type SocialCheck = (typeof SOCIAL_CHECKS)[number][0];

export interface Prize {
  place: number;
  amount: number;
}

export interface PublicResult {
  place: number;
  prize: number;
  businessName: string;
  businessSlug: string | null;
  founderName: string | null;
}

export interface PublicChallenge {
  id: string;
  slug: string;
  title: string;
  organizer: string;
  tagline: string;
  description: string;
  region: string;
  websiteUrl: string | null;
  bannerUrl: string | null;
  prizeCurrency: string;
  prizes: Prize[];
  prizePool: number;
  startsAt: string | null;
  submissionDeadline: string | null;
  winnersAnnouncedOn: string | null;
  eligibility: string;
  requirements: string;
  judgingCriteria: string;
  terms: string;
  pitchWeight: number;
  profileWeight: number;
  eligibleSessionModes: string[];
  minCompletedSessions: number;
  requiredPlan: string | null;
  socialHandles: Array<{ platform: SocialPlatform; label: string; handle: string; url: string; collaboration: "supported" | "limited" | "unsupported" }>;
  discount: { code: string; percentOff: number; plans: string[]; terms: string[]; periods: number; endsAt: string | null; active: boolean } | null;
  phase: ChallengePhase;
  participantCount: number;
  resultsPublished: boolean;
  results: PublicResult[] | null;
  /** Set only when staff open a challenge that is not public yet. */
  preview?: boolean;
}

export interface ChallengePromo {
  slug: string;
  title: string;
  tagline: string;
  imageUrl: string | null;
  prizePool: number;
  prizeCurrency: string;
  phase: ChallengePhase;
  submissionDeadline: string | null;
}

export interface EntryBusiness {
  id: string;
  slug: string;
  name: string;
  role: string;
  published: boolean;
  isExample: boolean;
  missingRequired: string[];
  missingRecommended: string[];
  complete: boolean;
  percent: number;
  eligible: boolean;
  publicUrl: string | null;
}

export interface ChecklistItem {
  key: string;
  label: string;
  status: ChecklistStatus;
  detail?: string;
}

export interface ChallengeEntry {
  joined: true;
  id: string;
  phase: ChallengePhase;
  status: EntryStatus;
  editable: boolean;
  joinedAt: string | null;
  submittedAt: string | null;
  reviewNote: string | null;
  bestScore: number | null;
  bestScoreAt: string | null;
  bestSessionId: number | null;
  completedSessions: number;
  minSessions: number;
  scoreFrozen: boolean;
  scoreFresh: boolean;
  subscription: { state: "verified" | "pending" | "missing" | "not_required"; plan: string | null; expiresAt: string | null };
  businesses: EntryBusiness[];
  businessId: string | null;
  social: { platform: SocialPlatform | null; url: string | null; evidenceUploaded: boolean };
  profileLinkConfirmed: boolean;
  publicNameConsent: boolean;
  placement: number | null;
  checklist: ChecklistItem[];
  readyToSubmit: boolean;
  blockers: string[];
}

export type EntryState = ChallengeEntry | { joined: false; phase: ChallengePhase; canJoin: boolean };

export class ApiError extends Error {
  status: number;
  details: string[];
  reason?: string;
  constructor(message: string, status: number, details: string[] = [], reason?: string) {
    super(message);
    this.status = status;
    this.details = details;
    this.reason = reason;
  }
}

async function read<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      body?.message || body?.error || `Request failed (${response.status}).`,
      response.status,
      Array.isArray(body?.missing) ? body.missing : Array.isArray(body?.pending) ? body.pending : [],
      typeof body?.reason === "string" ? body.reason : undefined,
    );
  }
  return (body as { data: T }).data;
}

const json = (method: string, payload: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

// ─── Public ──────────────────────────────────────────────────────────────────

export async function fetchChallenge(slug: string, signal?: AbortSignal): Promise<PublicChallenge> {
  return read<PublicChallenge>(await fetch(`/api/public/challenges/${encodeURIComponent(slug)}`, { signal }));
}

export async function fetchChallengePromo(signal?: AbortSignal): Promise<ChallengePromo | null> {
  return read<ChallengePromo | null>(await fetch("/api/public/challenges/promo", { signal }));
}

/** Staff only: the page's data for a challenge that is not public yet. */
export async function fetchChallengePreview(authFetch: AuthFetch, slug: string): Promise<PublicChallenge> {
  return read<PublicChallenge>(await authFetch(`/api/staff/challenges/preview/${encodeURIComponent(slug)}`));
}

// ─── A founder's entry ───────────────────────────────────────────────────────

const entryPath = (slug: string) => `/api/challenges/${encodeURIComponent(slug)}`;

export async function fetchMyEntry(authFetch: AuthFetch, slug: string): Promise<EntryState> {
  return read<EntryState>(await authFetch(`${entryPath(slug)}/entry`));
}

export async function joinChallenge(authFetch: AuthFetch, slug: string): Promise<ChallengeEntry> {
  return read<ChallengeEntry>(await authFetch(`${entryPath(slug)}/join`, { method: "POST" }));
}

export async function updateMyEntry(
  authFetch: AuthFetch,
  slug: string,
  patch: Partial<{
    businessId: string | null;
    socialPlatform: SocialPlatform | null;
    socialPostUrl: string | null;
    profileLinkConfirmed: boolean;
    publicNameConsent: boolean;
  }>,
): Promise<ChallengeEntry> {
  return read<ChallengeEntry>(await authFetch(`${entryPath(slug)}/entry`, json("PATCH", patch)));
}

export async function submitMyEntry(authFetch: AuthFetch, slug: string): Promise<ChallengeEntry> {
  return read<ChallengeEntry>(await authFetch(`${entryPath(slug)}/entry/submit`, json("POST", { acceptRules: true })));
}

export async function uploadEvidence(authFetch: AuthFetch, slug: string, file: File): Promise<void> {
  const form = new FormData();
  form.append("image", file);
  await read(await authFetch(`${entryPath(slug)}/entry/evidence`, { method: "PUT", body: form }));
}

export async function removeEvidence(authFetch: AuthFetch, slug: string): Promise<void> {
  await read(await authFetch(`${entryPath(slug)}/entry/evidence`, { method: "DELETE" }));
}

// ─── Discount preview (pricing page) ─────────────────────────────────────────

export interface DiscountQuote {
  code: string;
  percentOff: number;
  plan: "prep" | "pro";
  term: "monthly" | "annual";
  currency: string;
  listAmount: number;
  amount: number;
  periods: number;
  combineWithOffer: boolean;
  billingMode: "manual";
}

export async function previewDiscount(
  authFetch: AuthFetch,
  input: { code: string; plan: string; term: string; currency: string },
): Promise<DiscountQuote> {
  const query = new URLSearchParams(input);
  return read<DiscountQuote>(await authFetch(`/api/billing/discount?${query.toString()}`));
}

// ─── Staff ───────────────────────────────────────────────────────────────────

export interface StaffDiscount {
  id: string;
  code: string;
  description: string;
  percentOff: number;
  plans: string[];
  terms: string[];
  periods: number;
  startsAt: string | null;
  endsAt: string | null;
  maxRedemptions: number | null;
  newCustomersOnly: boolean;
  combineWithOffer: boolean;
  active: boolean;
  redeemed: number;
  pending: number;
  updatedAt: string | null;
}

export interface ConfirmationState {
  item: ConfirmationItem;
  confirmed: boolean;
  stale: boolean;
  by: number | null;
  at: string | null;
}

export interface StaffChallenge {
  id: string;
  slug: string;
  title: string;
  organizer: string;
  tagline: string;
  description: string;
  region: string;
  websiteUrl: string;
  imageUrl: string | null;
  promoEnabled: boolean;
  prizeCurrency: string;
  prizes: Prize[];
  startsAt: string | null;
  submissionDeadline: string | null;
  winnersAnnouncedOn: string | null;
  eligibility: string;
  requirements: string;
  judgingCriteria: string;
  terms: string;
  pitchWeight: number;
  eligibleSessionModes: string[];
  minCompletedSessions: number;
  requiredPlan: string | null;
  socialHandles: Partial<Record<SocialPlatform, { handle: string; url: string }>>;
  discountCodeId: string | null;
  discount: StaffDiscount | null;
  confirmations: ConfirmationState[];
  status: ChallengeStatus;
  phase: ChallengePhase;
  resultsPublishedAt: string | null;
  counts: Record<string, number>;
  updatedAt: string | null;
  winnersPreview?: PublicResult[];
}

export interface StaffParticipant {
  id: string;
  userId: number;
  name: string;
  email: string;
  joinedAt: string;
  status: EntryStatus;
  subscription: "verified" | "pending" | "missing" | "not_required";
  completedSessions: number;
  bestScore: number | null;
  bestScoreAt: string | null;
  pitchScoreValid: boolean;
  business: { id: string; name: string; slug: string; published: boolean; complete: boolean; percent: number; isExample: boolean } | null;
  socialPlatform: SocialPlatform | null;
  socialPostUrl: string | null;
  submittedAt: string | null;
  eligible: boolean;
  missing: string[];
  profileScore: number | null;
  finalScore: number | null;
  shortlisted: boolean;
  placement: number | null;
  reviewedAt: string | null;
  judgedAt: string | null;
}

export interface StaffParticipantDetail {
  id: string;
  name: string;
  email: string;
  status: EntryStatus;
  joinedAt: string;
  submittedAt: string | null;
  subscription: { state: string; plan: string | null; expiresAt: string | null; txRef: string | null } | null;
  subscriptionVerifiedAt: string | null;
  bestScore: number | null;
  bestScoreAt: string | null;
  bestSessionId: number | null;
  completedSessions: number;
  scoreFrozenAt: string | null;
  sessions: Array<{ id: number; createdAt: string; mode: string; status: string | null; scores: Record<string, number> | null; inWindow: boolean }>;
  business: (StaffParticipant["business"] & { profile: Record<string, any> | null; missingRequired: string[]; missingRecommended: string[] }) | null;
  socialPlatform: SocialPlatform | null;
  socialPostUrl: string | null;
  profileLinkConfirmed: boolean;
  publicNameConsent: boolean;
  evidenceUrl: string | null;
  reviewNote: string;
  socialChecks: Partial<Record<SocialCheck, boolean>>;
  reviewedAt: string | null;
  profileScores: Partial<Record<ProfileCriterion, number>>;
  profileScore: number | null;
  pitchScoreValid: boolean;
  finalScore: number | null;
  judgeNotes: string;
  shortlisted: boolean;
  placement: number | null;
  audit: Array<{ id: number; action: string; metadata: Record<string, any>; created_at: string }>;
}

export interface AuditEntry {
  id: number;
  actor: string;
  action: string;
  subjectType: string;
  subjectId: string;
  metadata: Record<string, any>;
  createdAt: string;
}

const staff = (path = "") => `/api/staff/challenges${path}`;

export async function fetchStaffChallenges(authFetch: AuthFetch): Promise<StaffChallenge[]> {
  return read<StaffChallenge[]>(await authFetch(staff()));
}

export async function fetchStaffChallenge(authFetch: AuthFetch, id: string): Promise<StaffChallenge> {
  return read<StaffChallenge>(await authFetch(staff(`/${encodeURIComponent(id)}`)));
}

export async function createStaffChallenge(authFetch: AuthFetch, input: Record<string, unknown>): Promise<StaffChallenge> {
  return read<StaffChallenge>(await authFetch(staff(), json("POST", input)));
}

export async function updateStaffChallenge(authFetch: AuthFetch, id: string, input: Record<string, unknown>): Promise<StaffChallenge> {
  return read<StaffChallenge>(await authFetch(staff(`/${encodeURIComponent(id)}`), json("PATCH", input)));
}

export async function confirmStaffChallenge(authFetch: AuthFetch, id: string, item: ConfirmationItem, confirmed: boolean): Promise<StaffChallenge> {
  return read<StaffChallenge>(await authFetch(staff(`/${encodeURIComponent(id)}/confirm`), json("POST", { item, confirmed })));
}

export async function setStaffChallengeStatus(authFetch: AuthFetch, id: string, status: ChallengeStatus): Promise<StaffChallenge> {
  return read<StaffChallenge>(await authFetch(staff(`/${encodeURIComponent(id)}/status`), json("POST", { status })));
}

export async function uploadStaffChallengeImage(authFetch: AuthFetch, id: string, file: File): Promise<StaffChallenge> {
  const form = new FormData();
  form.append("image", file);
  return read<StaffChallenge>(await authFetch(staff(`/${encodeURIComponent(id)}/image`), { method: "PUT", body: form }));
}

export async function removeStaffChallengeImage(authFetch: AuthFetch, id: string): Promise<StaffChallenge> {
  return read<StaffChallenge>(await authFetch(staff(`/${encodeURIComponent(id)}/image`), { method: "DELETE" }));
}

export async function fetchStaffParticipants(authFetch: AuthFetch, id: string): Promise<StaffParticipant[]> {
  return read<StaffParticipant[]>(await authFetch(staff(`/${encodeURIComponent(id)}/participants`)));
}

export async function fetchStaffParticipant(authFetch: AuthFetch, id: string, participantId: string): Promise<StaffParticipantDetail> {
  return read<StaffParticipantDetail>(await authFetch(staff(`/${encodeURIComponent(id)}/participants/${encodeURIComponent(participantId)}`)));
}

export async function reviewStaffParticipant(
  authFetch: AuthFetch,
  id: string,
  participantId: string,
  input: { action: "approve" | "request_correction" | "reject" | "disqualify" | "reopen"; note?: string; socialChecks?: Partial<Record<SocialCheck, boolean>> },
): Promise<{ id: string; status: EntryStatus }> {
  return read(await authFetch(staff(`/${encodeURIComponent(id)}/participants/${encodeURIComponent(participantId)}/review`), json("POST", input)));
}

export async function judgeStaffParticipant(
  authFetch: AuthFetch,
  id: string,
  participantId: string,
  input: Partial<{ profileScores: Record<ProfileCriterion, number>; pitchScoreValid: boolean; judgeNotes: string; shortlisted: boolean }>,
): Promise<{ id: string; profileScore: number | null; finalScore: number | null }> {
  return read(await authFetch(staff(`/${encodeURIComponent(id)}/participants/${encodeURIComponent(participantId)}/judging`), json("POST", input)));
}

export async function setStaffWinners(
  authFetch: AuthFetch,
  id: string,
  placements: Array<{ participantId: string; place: number }>,
): Promise<{ placed: number; winnersPreview: PublicResult[] }> {
  return read(await authFetch(staff(`/${encodeURIComponent(id)}/winners`), json("PUT", { placements })));
}

export async function publishStaffResults(authFetch: AuthFetch, id: string, publish: boolean): Promise<StaffChallenge> {
  return read<StaffChallenge>(await authFetch(staff(`/${encodeURIComponent(id)}/results/${publish ? "publish" : "unpublish"}`), { method: "POST" }));
}

export async function fetchStaffAudit(authFetch: AuthFetch, id: string): Promise<AuditEntry[]> {
  return read<AuditEntry[]>(await authFetch(staff(`/${encodeURIComponent(id)}/audit`)));
}

export async function fetchStaffDiscounts(authFetch: AuthFetch): Promise<StaffDiscount[]> {
  return read<StaffDiscount[]>(await authFetch("/api/staff/discounts"));
}

export async function saveStaffDiscount(authFetch: AuthFetch, input: Record<string, unknown>, id?: string): Promise<StaffDiscount> {
  return read<StaffDiscount>(
    await authFetch(id ? `/api/staff/discounts/${encodeURIComponent(id)}` : "/api/staff/discounts", json(id ? "PATCH" : "POST", input)),
  );
}

// ─── Display helpers ─────────────────────────────────────────────────────────

/** "₦200,000" — whole amounts without decimals. */
export function formatPrize(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(date);
}

/** A calendar date (YYYY-MM-DD) as "Saturday, 21 November 2026". */
export function formatDay(day: string | null | undefined): string {
  if (!day) return "";
  const date = new Date(`${day.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

export function placeLabel(place: number): string {
  const suffix = place % 10 === 1 && place % 100 !== 11 ? "st" : place % 10 === 2 && place % 100 !== 12 ? "nd" : place % 10 === 3 && place % 100 !== 13 ? "rd" : "th";
  return `${place}${suffix} place`;
}

export const PHASE_LABELS: Record<ChallengePhase, string> = {
  draft: "Draft",
  upcoming: "Opening soon",
  open: "Open for entries",
  closed: "Entries closed",
  judging: "Judging",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const ENTRY_STATUS_LABELS: Record<EntryStatus, string> = {
  in_progress: "In progress",
  submitted: "Pending verification",
  needs_correction: "Needs correction",
  approved: "Approved",
  rejected: "Not accepted",
  disqualified: "Disqualified",
};
