/**
 * Shared route constants for deep links that carry state in the query string.
 *
 * Literals like "/settings?tab=subscription" were being typed by hand in several
 * components; a typo produced a page that silently opened the wrong tab. Import
 * these instead.
 */

/** Settings, focused on the plan/billing panel. */
export const SUBSCRIPTION_TAB_PATH = "/settings?tab=subscription";

/** Settings, focused on the notification preferences panel. */
export const NOTIFICATIONS_TAB_PATH = "/settings?tab=notifications";

/**
 * The user's own profile.
 *
 * Settings' Profile tab IS the account page — name, avatar, bio, role all live
 * there. A separate /profile route would be a second surface editing the same
 * fields, which is exactly the kind of duplicate control we removed elsewhere.
 */
export const PROFILE_PATH = "/settings";
