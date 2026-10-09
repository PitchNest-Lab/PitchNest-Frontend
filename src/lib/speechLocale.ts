/**
 * Speech-recognition accent for the live pitch. Must match SPEECH_LOCALES in
 * the backend (src/services/speechLocale.ts); unknown values are ignored there.
 */
export const SPEECH_LOCALE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'en-NG', label: 'Nigerian English' },
  { value: 'en-GH', label: 'Ghanaian English' },
  { value: 'en-KE', label: 'Kenyan English' },
  { value: 'en-ZA', label: 'South African English' },
  { value: 'en-TZ', label: 'Tanzanian English' },
  { value: 'en-GB', label: 'British English' },
  { value: 'en-IN', label: 'Indian English' },
  { value: 'en-US', label: 'American English' },
];

const STORAGE_KEY = 'pitchnest_speech_locale';
const VALID = new Set(SPEECH_LOCALE_OPTIONS.map((o) => o.value));

// Timezone → most likely English variant, for a sensible first-time default.
const TIMEZONE_LOCALES: Record<string, string> = {
  'Africa/Lagos': 'en-NG',
  'Africa/Accra': 'en-GH',
  'Africa/Nairobi': 'en-KE',
  'Africa/Kampala': 'en-KE',
  'Africa/Kigali': 'en-KE',
  'Africa/Dar_es_Salaam': 'en-TZ',
  'Africa/Johannesburg': 'en-ZA',
  'Africa/Harare': 'en-ZA',
  'Africa/Lusaka': 'en-ZA',
  'Europe/London': 'en-GB',
  'Asia/Kolkata': 'en-IN',
  'Asia/Calcutta': 'en-IN',
};

/** The founder's saved choice, else a guess from timezone and browser language. */
export function defaultSpeechLocale(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && VALID.has(saved)) return saved;
  } catch {
    // Storage unavailable: fall through to the guess.
  }
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_LOCALES[tz]) return TIMEZONE_LOCALES[tz];
  } catch {
    // No Intl timezone: fall through.
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language : '';
  if (nav && VALID.has(nav)) return nav;
  return 'en-US';
}

export function rememberSpeechLocale(locale: string): void {
  if (!VALID.has(locale)) return;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Non-critical.
  }
}
