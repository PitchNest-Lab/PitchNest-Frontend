import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const vercel = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
const manifest = JSON.parse(
  await readFile(new URL("../public/manifest.json", import.meta.url), "utf8"),
);
const serviceWorker = await readFile(
  new URL("../public/sw.js", import.meta.url),
  "utf8",
);
const surveyHtml = await readFile(
  new URL("../public/survey.html", import.meta.url),
  "utf8",
);
const surveyScript = await readFile(
  new URL("../public/survey.js", import.meta.url),
  "utf8",
);

const globalRule = vercel.headers?.find((rule) => rule.source === "/(.*)");
assert(globalRule, "vercel.json must define global response headers");
const headers = new Map(
  globalRule.headers.map((header) => [header.key.toLowerCase(), header.value]),
);
const csp = headers.get("content-security-policy") || "";

for (const required of [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "wss://pitchnest-live.onrender.com",
  "https://accounts.google.com",
  "https://oyztdulmyuklorbudcgb.supabase.co",
  // DEV: the dev branch builds against the DEV API, live-pitch server and database.
  "https://l5isutzx18.execute-api.eu-west-2.amazonaws.com",
  "wss://pitchnest-backend-dev.onrender.com",
  "https://ueqwulsbbcvnduhepimh.supabase.co",
  // Vercel injects its feedback toolbar on preview deployments.
  "https://vercel.live",
  "wss://ws-us3.pusher.com",
  "https://assets.vercel.com",
]) {
  assert(csp.includes(required), `Content-Security-Policy is missing: ${required}`);
}
const scriptPolicy = csp
  .split(";")
  .map((directive) => directive.trim())
  .find((directive) => directive.startsWith("script-src")) || "";
assert(!scriptPolicy.includes("'unsafe-inline'"), "script-src must not allow inline JavaScript");
// src/lib/adsConsent.ts loads gtag.js after the visitor accepts ad cookies.
assert(
  scriptPolicy.includes("https://www.googletagmanager.com"),
  "script-src must allow the Google Ads tag (https://www.googletagmanager.com)",
);

// Link previews: crawlers on a business or challenge page get the backend's
// share document (PitchNest-Backend publicBusinessMetadata.ts and
// publicChallengeMetadata.ts); everyone else gets the app. The CDN never
// caches it, so a crawler's copy can never reach a visitor.
const previewPages = [
  ["/businesses/:slug", /^https:\/\/[^/]+\/api\/public\/businesses\/:slug\/share-html$/],
  ["/opportunities/challenges/:slug", /^https:\/\/[^/]+\/api\/public\/challenges\/:slug\/share-html$/],
];
let crawlerAgents;
for (const [source, destination] of previewPages) {
  const previewRewrite = vercel.rewrites?.find((rule) => rule.source === source);
  assert(previewRewrite, `vercel.json must forward link-preview crawlers on ${source}`);
  assert.match(previewRewrite.destination, destination);
  assert(
    vercel.rewrites.indexOf(previewRewrite) < vercel.rewrites.findIndex((rule) => rule.source === "/(.*)"),
    `the crawler rewrite for ${source} must come before the app fallback`,
  );
  const agents = previewRewrite.has?.find(
    (condition) => condition.type === "header" && condition.key === "user-agent",
  )?.value;
  assert(agents, `the crawler rewrite for ${source} must be limited by user agent`);
  crawlerAgents ??= agents;
  assert.equal(agents, crawlerAgents, "every preview rewrite must match the same crawlers");
  const previewHeaders = vercel.headers.find((rule) => rule.source === source);
  assert.equal(previewHeaders?.has?.[0]?.value, crawlerAgents, `the no-cache rule for ${source} must cover the same user agents`);
  assert(
    previewHeaders.headers.some((header) => header.key === "x-vercel-enable-rewrite-caching" && header.value === "0"),
    `crawler responses on ${source} must not be cached on the CDN`,
  );
}
// Whether Vercel anchors the pattern or searches with it, crawlers match and people do not.
for (const pattern of [new RegExp(`^(?:${crawlerAgents})$`), new RegExp(crawlerAgents)]) {
  for (const agent of [
    "WhatsApp/2.23.20.0 A",
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    // iMessage
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/601.2.4 (KHTML, like Gecko) Version/9.0.1 Safari/601.2.4 facebookexternalhit/1.1 Facebot Twitterbot/1.0",
    "LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)",
    "Twitterbot/1.0",
    "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
    "TelegramBot (like TwitterBot)",
    "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
  ]) {
    assert.match(agent, pattern, `crawler not forwarded: ${agent}`);
  }
  for (const agent of [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
    // In-app browsers are people, even when the app's name is in the user agent.
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WhatsApp/2.23.20.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/440.0]",
    "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36 LinkedInApp/9.29",
    "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36 Telegram-Android/11.2",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Snapchat/12.90",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [Pinterest/iOS]",
  ]) {
    assert.doesNotMatch(agent, pattern, `person sent the crawler page: ${agent}`);
  }
}

assert.equal(headers.get("x-content-type-options"), "nosniff");
assert.equal(headers.get("x-frame-options"), "SAMEORIGIN");
assert.equal(headers.get("x-xss-protection"), "0");
assert.equal(manifest.id, "/", "installed app identity must be stable at the root");
assert.equal(manifest.start_url, "/", "installed app must not always open on login");
assert.match(serviceWorker, /cache\.put\(['"]\/index\.html['"], copy\)/);
assert.doesNotMatch(
  serviceWorker,
  /cache\.put\(event\.request, copy\)/,
  "HTML navigations must not persist query-bearing request URLs as cache keys",
);
assert.match(surveyHtml, /<script src=["']\/survey\.js["'] defer><\/script>/);
assert.match(surveyHtml, /<meta name=["']referrer["'] content=["']no-referrer["']/);
assert.doesNotMatch(
  surveyHtml,
  /<script(?![^>]*\bsrc=)[^>]*>/i,
  "standalone pages must not depend on inline JavaScript blocked by the CSP",
);
new Function(surveyScript);
assert.match(surveyScript, /history\.replaceState\(/);

console.log("Deployment configuration checks passed.");
