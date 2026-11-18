#!/usr/bin/env node
// Site checker for the portfolio.
//
//   node scripts/check-site.mjs          -> check local files before committing
//   node scripts/check-site.mjs --live   -> after pushing, wait for Vercel to publish
//                                           this commit's index.html and check every asset
//
// Exits non-zero on any problem, so nothing broken gets pushed or reported as done.

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LIVE_URL = "https://fahimfaisalncebuet.vercel.app/";
const live = process.argv.includes("--live");

const html = readFileSync(resolve(ROOT, "index.html"), "utf8");
const problems = [];

// 1. Exactly one document, starting with a doctype (catches the preview "wrapper" bug).
const doctypes = (html.match(/<!doctype html>/gi) || []).length;
if (!/^\s*<!doctype html>/i.test(html)) problems.push("index.html must start with <!doctype html>");
if (doctypes !== 1) problems.push(`index.html contains ${doctypes} <!doctype> lines (expected 1). It was probably copied from a preview page.`);
if ((html.match(/<\/html>/gi) || []).length !== 1) problems.push("index.html must contain exactly one </html>");
if (!/<meta charset="utf-8"/i.test(html)) problems.push('missing <meta charset="utf-8">');

// 2. Every local src/href points at a file that exists.
const refs = [...html.matchAll(/\b(?:src|href)="([^"#][^"]*)"/g)]
  .map((m) => m[1])
  .filter((u) => !/^(https?:|mailto:|tel:|data:|\/\/)/i.test(u));
const localRefs = [...new Set(refs)];
for (const ref of localRefs) {
  const clean = decodeURIComponent(ref.split(/[?#]/)[0]);
  if (!existsSync(resolve(ROOT, clean))) problems.push(`missing file for "${ref}"`);
  if (!clean.startsWith("assets/") && /\.(png|jpe?g|svg|webp|gif|pdf)$/i.test(clean))
    problems.push(`"${ref}" should live inside assets/`);
}

// 3. In-page links (#about etc.) point at ids that exist.
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) if (!ids.has(id)) problems.push(`link "#${id}" has no matching id`);

// 4. Images need alt text.
for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) if (!/\balt="/.test(tag)) problems.push(`image without alt: ${tag.slice(0, 80)}`);

if (problems.length) {
  console.error("LOCAL CHECK FAILED:\n - " + problems.join("\n - "));
  process.exit(1);
}
console.log(`Local check passed: 1 document, ${localRefs.length} local files referenced, all present.`);

if (!live) process.exit(0);

// ---------- Live check ----------
const norm = (s) => s.replace(/\r\n/g, "\n").trim();
const want = norm(html);
const deadline = Date.now() + 6 * 60 * 1000; // Vercel normally needs < 1 minute
let served = "";
process.stdout.write("Waiting for Vercel to publish this version");
while (Date.now() < deadline) {
  try {
    const r = await fetch(LIVE_URL + "?check=" + Date.now(), { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
    served = norm(await r.text());
    if (served === want) break;
  } catch {}
  process.stdout.write(".");
  await new Promise((r) => setTimeout(r, 10000));
}
console.log("");
if (served !== want) {
  console.error(
    "LIVE CHECK FAILED: after 6 minutes the live site still serves a different index.html.\n" +
    "Open vercel.com -> this project -> Deployments to see whether the deployment failed or was blocked."
  );
  process.exit(2);
}
const bad = [];
for (const ref of localRefs) {
  const r = await fetch(new URL(ref, LIVE_URL), { method: "GET", cache: "no-store" });
  if (!r.ok) bad.push(`${r.status} ${ref}`);
}
if (bad.length) {
  console.error("LIVE CHECK FAILED, these files do not load:\n - " + bad.join("\n - "));
  process.exit(3);
}
console.log(`Live check passed: ${LIVE_URL} serves this version and all ${localRefs.length} files load.`);
