// Stamps a content hash onto the stylesheet and script URLs in every page.
//
// Why this exists: /caddy.css and /caddy.js have stable filenames, and Cloudflare serves
// them with a four-hour browser TTL, while the HTML revalidates on every request
// (max-age=0, must-revalidate). So a deploy that changes markup and styles together hands
// a returning visitor new HTML with old CSS, and the page renders wrong until their cache
// expires. Measured 2026-08-20, when exactly that happened: the tint field lost its
// height rule and drew sixteen full-size SVGs in a column.
//
// A hash in the query string makes the new HTML ask for a URL the browser has never seen,
// so the fix lands on the next page view with no hard reload and no shortened cache.
// The images are worse, and the same fix covers them. _headers marks /assets/* as
// `immutable` for a year, which is a promise that the bytes at that URL will never change.
// Replacing a file in place breaks that promise: on 2026-08-20 the Cloudflare edge was
// still handing out the previous caddy-notes.png and the retired golf-flag icon nearly
// twelve hours after the deploy, because the URL had not changed so nothing invalidated.
// Hashing the URL makes `immutable` true instead of a lie.
//
// Run this after build-site.mjs, after build-assets.sh, and after any hand edit to
// caddy.css or caddy.js.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const here = new URL('./', import.meta.url);
const pub = f => new URL(`../public/${f}`, here);
const hash = f => createHash('sha256').update(readFileSync(pub(f))).digest('hex').slice(0, 10);

const PAGES = ['index.html', 'privacy.html', 'support.html', 'press.html', '404.html'];

// every versioned URL the pages may reference, relative to public/
const FILES = ['caddy.css', 'caddy.js',
  ...readdirSync(pub('assets/img')).map(f => `assets/img/${f}`),
  ...readdirSync(pub('assets/press')).map(f => `assets/press/${f}`)]
  .filter(f => !f.endsWith('.DS_Store'));

// og:image is read by scrapers that may or may not keep a query string, and it is an
// absolute URL rather than a page asset, so it is deliberately left unstamped.
const SKIP = new Set(['assets/img/og.jpg', 'assets/img/og-2026-08-24.jpg']);

const V = Object.fromEntries(FILES.filter(f => !SKIP.has(f)).map(f => [f, hash(f)]));
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let total = 0;
for (const page of PAGES) {
  const before = readFileSync(pub(page), 'utf8');
  let after = before;
  for (const [file, v] of Object.entries(V)) {
    // matches /path, and /path?v=old, and rewrites either to /path?v=new
    after = after.replace(
      new RegExp(`(["'])/${esc(file)}(?:\\?v=[0-9a-f]+)?\\1`, 'g'),
      `$1/${file}?v=${v}$1`
    );
  }
  if (after !== before) writeFileSync(pub(page), after);
  const n = [...after.matchAll(/\?v=[0-9a-f]{10}(?=["'])/g)].length;
  total += n;
  console.log(`${page.padEnd(14)} ${String(n).padStart(2)} stamped${after === before ? '  (already current)' : ''}`);
}
console.log(`\n${total} versioned URLs across ${PAGES.length} pages`);
for (const [f, v] of Object.entries(V)) console.log(`  ${v}  ${f}`);
