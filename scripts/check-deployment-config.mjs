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
]) {
  assert(csp.includes(required), `Content-Security-Policy is missing: ${required}`);
}
const scriptPolicy = csp
  .split(";")
  .map((directive) => directive.trim())
  .find((directive) => directive.startsWith("script-src")) || "";
assert(!scriptPolicy.includes("'unsafe-inline'"), "script-src must not allow inline JavaScript");

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
