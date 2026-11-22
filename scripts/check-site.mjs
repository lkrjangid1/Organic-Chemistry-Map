#!/usr/bin/env node
/**
 * Post-build SEO and integrity checks over dist/:
 * title/description length, canonical, single H1, JSON-LD validity,
 * image alt text, internal links, and sitemap coverage.
 * Exits non-zero on errors (warnings are printed but don't fail the build).
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import process from 'node:process';

const dist = new URL('../dist/', import.meta.url).pathname;
const base = (process.env.BASE_PATH || '/').replace(/\/?$/, '/');
const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const files = walk(dist);
const html = files.filter((f) => f.endsWith('.html'));
const sitemapText = files.filter((f) => /sitemap-\d+\.xml$/.test(f)).map((f) => readFileSync(f, 'utf8')).join('\n');
const sitemapUrls = new Set([...sitemapText.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname));

let errors = 0;
let warnings = 0;
const err = (f, m) => { errors++; console.log(`ERROR ${f}: ${m}`); };
const warn = (f, m) => { warnings++; console.log(`warn  ${f}: ${m}`); };
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const resolves = (href) => {
  const clean = decode(href).split(/[?#]/)[0];
  if (!clean.startsWith(base)) return false;
  const rel = clean.slice(base.length);
  const target = join(dist, rel);
  if (existsSync(target) && statSync(target).isFile()) return true;
  return existsSync(join(target, 'index.html'));
};

for (const file of html) {
  const rel = '/' + relative(dist, file).replace(/index\.html$/, '');
  const s = readFileSync(file, 'utf8');
  if (rel.startsWith('/app/') || rel === '/404.html') continue;
  const isMap = rel === '/map/';
  const title = s.match(/<title>([^<]*)<\/title>/)?.[1];
  const desc = s.match(/<meta name="description" content="([^"]*)"/)?.[1];
  const canonical = s.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  const noindex = /<meta name="robots" content="noindex/.test(s);
  if (!title) err(rel, 'missing <title>');
  else if (decode(title).length > 70) warn(rel, `title ${decode(title).length} chars: ${decode(title)}`);
  if (!desc) err(rel, 'missing meta description');
  else if (decode(desc).length < 50 || decode(desc).length > 170) warn(rel, `description ${decode(desc).length} chars`);
  if (!canonical || !/^https:\/\//.test(canonical)) err(rel, `canonical missing or not absolute https: ${canonical}`);
  if (!isMap) {
    const h1 = (s.match(/<h1[\s>]/g) || []).length;
    if (h1 !== 1) err(rel, `${h1} <h1> elements`);
  }
  for (const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch (e) { err(rel, `invalid JSON-LD: ${e.message}`); }
  }
  for (const m of s.matchAll(/<img\b[^>]*>/g)) if (!/\balt=/.test(m[0])) err(rel, `img without alt: ${m[0].slice(0, 80)}`);
  const markup = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
  for (const m of markup.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|#)/.test(href)) continue;
    if (!resolves(href)) err(rel, `broken internal link: ${href}`);
  }
  if (!noindex && !sitemapUrls.has(new URL(canonical || 'https://x' + rel).pathname)) warn(rel, 'indexable page missing from sitemap');
}
console.log(`\n${html.length} HTML files checked: ${errors} errors, ${warnings} warnings.`);
process.exit(errors ? 1 : 0);
