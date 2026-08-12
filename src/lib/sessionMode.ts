export type SessionMode = "panel" | "coach" | "solo";

/**
 * Resolve a session's mode. Newer rows carry a dedicated `mode` column;
 * older rows may only have it inside evaluation_report; oldest rows have
 * neither and are treated as panel sessions (the original default).
 */
export function getSessionMode(session: any): SessionMode {
  const raw = session?.mode || session?.evaluation_report?.mode;
  if (raw === "coach" || raw === "solo" || raw === "panel") return raw;
  return "panel";
}

export const MODE_LABELS: Record<SessionMode, string> = {
  panel: "VC Panel",
  coach: "Practice Coach",
  solo: "Solo Practice",
};

/** Tailwind classes for the mode pill, per mode. */
export const MODE_BADGE_CLASSES: Record<SessionMode, string> = {
  panel: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  coach: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  solo: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

/**
 * Verdict label for the report header. Only the investor Panel talks in
 * invest/pass terms — Coach and Solo are practice, so their "verdict" is a
 * readiness read, never a funding decision. This mirrors the backend, where the
 * coach/solo evaluation prompt is explicitly forbidden from using invest/pass/fund.
 */
export function verdictLabel(mode: SessionMode, score: number): string {
  if (mode === "panel") {
    return score >= 80 ? "Strong Buy (Invest)" : score >= 60 ? "Consideration (Follow Up)" : "Decline to Invest";
  }
  // coach + solo — readiness framing
  return score >= 80 ? "Pitch-Ready" : score >= 60 ? "Nearly There" : "Keep Practicing";
}

/** Heading for the sentiment/feedback section. Panel = investors; coach/solo = coach. */
export const SENTIMENT_HEADING: Record<SessionMode, string> = {
  panel: "Investor Sentiment",
  coach: "Coach's Read",
  solo: "Practice Read",
};

/** Label under each sentiment card's avatar. */
export const SENTIMENT_ROLE_LABEL: Record<SessionMode, string> = {
  panel: "AI Panelist",
  coach: "Your Coach",
  solo: "Practice Note",
};
