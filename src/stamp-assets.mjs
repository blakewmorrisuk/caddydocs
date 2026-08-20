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
// Run this after build-site.mjs, and after any hand edit to caddy.css or caddy.js.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const here = new URL('./', import.meta.url);
const pub = f => new URL(`../public/${f}`, here);
const hash = f => createHash('sha256').update(readFileSync(pub(f))).digest('hex').slice(0, 10);

const V = { 'caddy.css': hash('caddy.css'), 'caddy.js': hash('caddy.js') };
const PAGES = ['index.html', 'privacy.html', 'support.html', '404.html'];

for (const page of PAGES) {
  const before = readFileSync(pub(page), 'utf8');
  let after = before;
  for (const [file, v] of Object.entries(V)) {
    // matches /caddy.css, /caddy.css?v=old, and rewrites either to /caddy.css?v=new
    after = after.replace(
      new RegExp(`(["'])/${file.replace('.', '\\.')}(?:\\?v=[0-9a-f]+)?\\1`, 'g'),
      `$1/${file}?v=${v}$1`
    );
  }
  if (after !== before) writeFileSync(pub(page), after);
  const stamped = [...after.matchAll(/\/caddy\.(?:css|js)\?v=([0-9a-f]+)/g)].length;
  console.log(`${page.padEnd(14)} ${stamped} stamped${after === before ? ' (already current)' : ''}`);
}
console.log('css', V['caddy.css'], ' js', V['caddy.js']);
