import { useSyncExternalStore } from "react";
import { trackingAllowed } from "./analytics";

/**
 * Google Ads tag (gtag.js) behind an opt-in cookie banner (components/CookieConsent).
 *
 * Nothing from Google loads until the visitor accepts, and never when the
 * browser sends Do Not Track or Global Privacy Control. Declining later turns
 * the tag's consent off and deletes its first-party cookies. The Google domains
 * the tag uses are allowed in vercel.json's Content-Security-Policy.
 */

const GOOGLE_ADS_ID = "AW-18545095544";
const STORAGE_KEY = "pn_ads_consent";

export type AdsChoice = "granted" | "denied";

type GtagWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

const CONSENT_GRANTED = { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" };
const CONSENT_DENIED = { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" };

function storedChoice(): AdsChoice | null {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "granted" || saved === "denied" ? saved : null;
  } catch {
    return null;
  }
}

let loaded = false;

function loadGoogleAds(): void {
  if (loaded || !trackingAllowed()) return;
  loaded = true;
  try {
    const win = window as GtagWindow;
    const dataLayer = (win.dataLayer = win.dataLayer || []);
    // gtag.js only reads Arguments objects, so this cannot use rest parameters.
    win.gtag = function gtag() {
      dataLayer.push(arguments);
    };
    win.gtag("consent", "default", CONSENT_GRANTED);
    win.gtag("js", new Date());
    win.gtag("config", GOOGLE_ADS_ID);

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`;
    document.head.appendChild(script);
  } catch {
    // Ads measurement must never affect the page.
  }
}

/** gtag sets its cookies on the widest domain it can, e.g. .pitchnest.app. */
function clearGoogleAdsCookies(): void {
  try {
    const names = document.cookie
      .split(";")
      .map((cookie) => cookie.split("=")[0].trim())
      .filter((name) => name.startsWith("_gcl"));
    const labels = window.location.hostname.split(".");
    const domains = [""];
    for (let i = 0; i < labels.length - 1; i += 1) domains.push(labels.slice(i).join("."));
    for (const name of names) {
      for (const domain of domains) {
        document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ""}`;
      }
    }
  } catch {
    // Nothing to clear.
  }
}

let bannerOpen = trackingAllowed() && storedChoice() === null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

/** Loads the tag on app start when the visitor accepted on an earlier visit. */
export function startGoogleAds(): void {
  if (storedChoice() === "granted") loadGoogleAds();
}

/** Remembers the visitor's answer and closes the banner. */
export function setAdsChoice(choice: AdsChoice): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // Kept for this visit only.
  }
  if (loaded) {
    (window as GtagWindow).gtag?.("consent", "update", choice === "granted" ? CONSENT_GRANTED : CONSENT_DENIED);
  } else if (choice === "granted") {
    loadGoogleAds();
  }
  if (choice === "denied") clearGoogleAdsCookies();
  bannerOpen = false;
  notify();
}

/** False when the browser opts out of tracking, so there is nothing to choose. */
export function adsChoiceAvailable(): boolean {
  return trackingAllowed();
}

/** Opens the banner again (Privacy Policy, "Cookie choices"). */
export function openCookieChoices(): void {
  if (!adsChoiceAvailable()) return;
  bannerOpen = true;
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** True while the cookie banner is on screen. */
export function useCookieBannerOpen(): boolean {
  return useSyncExternalStore(subscribe, () => bannerOpen, () => false);
}
