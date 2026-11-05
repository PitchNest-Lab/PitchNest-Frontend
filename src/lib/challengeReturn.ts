import { clearReturnTo, peekReturnTo, rememberReturnTo } from "./returnTo";

/**
 * Brings a founder back to a challenge page after a detour, such as paying
 * for the plan the challenge needs. Uses the same one-day, this-browser store
 * as the return after logging in (lib/returnTo), limited to challenge pages.
 */

const CHALLENGE_PATH = /^\/opportunities\/challenges\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function rememberChallengeReturn(path: string): void {
  if (CHALLENGE_PATH.test(path)) rememberReturnTo(path);
}

export function peekChallengeReturn(): string | null {
  const path = peekReturnTo();
  return path && CHALLENGE_PATH.test(path) ? path : null;
}

export function clearChallengeReturn(): void {
  if (peekChallengeReturn()) clearReturnTo();
}

/** The stored challenge page, once. */
export function takeChallengeReturn(): string | null {
  const path = peekChallengeReturn();
  if (path) clearReturnTo();
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
