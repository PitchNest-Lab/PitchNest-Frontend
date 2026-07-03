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
