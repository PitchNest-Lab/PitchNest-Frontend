/** Public legal / support contact — used in policies and store listings */
export const CONTACT_EMAIL = 'pitchnestapp@gmail.com';
export const APP_NAME = 'PitchNest';
export const MIN_AGE = 13;
export const LEGAL_LAST_UPDATED = 'October 17, 2026';
/** The Terms and the refund policy changed after the other legal pages. */
export const TERMS_LAST_UPDATED = 'October 21, 2026';
/** The Privacy Policy added opt-in Google Ads cookies. */
export const PRIVACY_LAST_UPDATED = 'November 1, 2026';

/** Public legal page paths (for store console URLs: https://YOUR_DOMAIN + path) */
export const LEGAL_PATHS = {
  privacy: '/privacy',
  terms: '/terms',
  deleteAccount: '/delete-account',
  support: '/support',
  refunds: '/refunds',
} as const;
