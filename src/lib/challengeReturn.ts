/**
 * Brings a founder back to a challenge page after a detour: signing up (and
 * onboarding), or paying for the plan the challenge needs. Kept in this
 * browser for a day, and only ever a challenge page, so it can't be used to
 * send someone elsewhere.
 */

const KEY = "pitchnest.challengeReturn";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const CHALLENGE_PATH = /^\/opportunities\/challenges\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function rememberChallengeReturn(path: string): void {
  if (!CHALLENGE_PATH.test(path)) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ path, at: Date.now() }));
  } catch {
    // Private mode or storage blocked: the founder can still find the challenge.
  }
}

export function peekChallengeReturn(): string | null {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || "null");
    if (stored && CHALLENGE_PATH.test(stored.path) && Date.now() - Number(stored.at) < MAX_AGE_MS) return stored.path;
  } catch {
    // Unreadable: treat as nothing stored.
  }
  return null;
}

export function clearChallengeReturn(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}

/** The stored challenge page, once. */
export function takeChallengeReturn(): string | null {
  const path = peekChallengeReturn();
  clearChallengeReturn();
  return path;
}

const joinedKey = (slug: string) => `pitchnest.challengeJoined.${slug}`;

/** This browser's founder has an entry: the pop-up has nothing left to ask. */
export function markChallengeJoined(slug: string): void {
  try {
    localStorage.setItem(joinedKey(slug), "1");
  } catch {
    // Not remembered; the pop-up may show once more.
  }
}

export function hasJoinedChallenge(slug: string): boolean {
  try {
    return localStorage.getItem(joinedKey(slug)) === "1";
  } catch {
    return false;
  }
}
