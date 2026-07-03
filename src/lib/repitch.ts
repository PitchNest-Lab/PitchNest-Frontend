import { getSessionMode } from "./sessionMode";

export interface RepitchState {
  parentSessionId: number;
  config: {
    mode: string;
    businessName: string;
    description?: string;
    industry?: string;
    investorArchetype?: string;
    fundingStage?: string;
    aggressiveness?: number | null;
    riskAppetite?: number | null;
    duration?: number | null;
    deckId?: number | null;
    deckName?: string | null;
  };
  previousSession: {
    sessionId: number;
    date: string;
    overallScore: number;
    scores: {
      delivery: number;
      clarity: number;
      scalability: number;
      readiness: number;
    };
    summary: string;
    topRisks: string[];
  };
}

/**
 * Build the navigation state for "Pitch Again" from a completed session row.
 * Newer sessions carry a pitch_config snapshot for full setup prefill; older
 * rows fall back to just business name + mode.
 */
export function buildRepitchState(session: any): RepitchState {
  const report = session?.evaluation_report || {};
  const s = report.scores || {};
  const scores = {
    delivery: Number(s.delivery) || 0,
    clarity: Number(s.clarity) || 0,
    scalability: Number(s.scalability) || 0,
    readiness: Number(s.readiness) || 0,
  };
  const overallScore = Math.round(
    (scores.delivery + scores.clarity + scores.scalability + scores.readiness) / 4,
  );

  return {
    parentSessionId: session.id,
    config: session.pitch_config || {
      mode: getSessionMode(session),
      businessName: session.business_name || "",
    },
    previousSession: {
      sessionId: session.id,
      date: session.created_at || "",
      overallScore,
      scores,
      summary: report.summary || "",
      topRisks: (Array.isArray(report.risks) ? report.risks : []).slice(0, 3),
    },
  };
}
