/**
 * The page someone opened before they had to log in or sign up, so they land
 * there afterwards: after logging in (password or Google), or after signing
 * up, verifying their email and onboarding. Kept in this browser for a day,
 * which survives moving between log-in and sign-up and a verification email
 * opened in another tab. Only ever a page of this site, never an auth step,
 * so it can't be used to send someone elsewhere.
 */

const KEY = "pitchnest.returnTo";
// Written by earlier versions for challenge pages only; read once, then dropped.
const LEGACY_KEY = "pitchnest.challengeReturn";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const AUTH_STEPS = /^\/(?:login|signup|verify|onboarding|forgot-password|reset-password|organization-login|organization|delete-account|billing\/return)(?:[/?#]|$)/;

/** A path of this site worth returning to, or null. */
export function safeReturnPath(path: unknown): string | null {
  if (typeof path !== "string" || path.length > 512) return null;
  // "/x" only: not "//host", not "/\host", no control characters.
  if (!/^\/(?![/\\])/.test(path) || /[\\\u0000-\u001f\u007f]/.test(path)) return null;
  if (path === "/" || AUTH_STEPS.test(path)) return null;
  return path;
}

/** A router location (pathname, search, hash) as a path. */
export function locationPath(location: { pathname?: string; search?: string; hash?: string } | null | undefined): string | null {
  if (!location?.pathname) return null;
  return safeReturnPath(`${location.pathname}${location.search || ""}${location.hash || ""}`);
}

export function rememberReturnTo(path: string | null | undefined): void {
  const safe = safeReturnPath(path);
  if (!safe) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ path: safe, at: Date.now() }));
  } catch {
    // Private mode or storage blocked: the person lands on the default page.
  }
}

function read(key: string): string | null {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || "null");
    if (stored && Date.now() - Number(stored.at) < MAX_AGE_MS) return safeReturnPath(stored.path);
  } catch {
    // Unreadable: treat as nothing stored.
  }
  return null;
}

export function peekReturnTo(): string | null {
  return read(KEY) ?? read(LEGACY_KEY);
}

export function clearReturnTo(): void {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Nothing to clear.
  }
}

/** The stored page, once. */
export function takeReturnTo(): string | null {
  const path = peekReturnTo();
  clearReturnTo();
  return path;
}
