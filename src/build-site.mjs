// Assembles index.html from the template plus the generated fragments.
// The output is a plain static file; nothing here runs at request time.
import { readFileSync, writeFileSync } from 'node:fs';

const here = new URL('./', import.meta.url);
const read = f => readFileSync(new URL(f, here), 'utf8');

const { _note, ...TINT } = JSON.parse(read('tints.json'));

// All sixteen WorkspaceTints, in the app's own order, carried by the four tab shapes.
// Blake's live picks sit on their real tints: Research green, Draft for MSJ graphite,
// Contracts sky, BIO 101 cherry. The rest rotate so no two neighbours share a width.
const TINT_ORDER = [
  ['green', 'research'],   ['fairway', 'contracts'], ['blue', 'bio101'],     ['teal', 'msj'],
  ['plum', 'research'],    ['coral', 'bio101'],      ['amber', 'contracts'], ['graphite', 'msj'],
  ['navy', 'research'],    ['rose', 'bio101'],       ['sky', 'contracts'],   ['indigo', 'msj'],
  ['orchid', 'research'],  ['walnut', 'contracts'],  ['cherry', 'bio101'],   ['olive', 'msj'],
];
if (TINT_ORDER.length !== Object.keys(TINT).length) throw new Error('tint count drifted');

const tints = TINT_ORDER
  .map(([t, n]) => `        <svg class="tint t-${n}" color="${TINT[t]}"><use href="#tab-${n}"/></svg>`)
  .join('\n') + '\n';

// The three Caddies parked on the right edge of the display in section 1. Ratios come
// from tab-meta.json, which build-tabs.mjs measures off the real vector geometry, so a
// rotated tab can never be drawn at the wrong proportion.
const META = JSON.parse(read('tab-meta.json'));
const RAIL = [['contracts', '#2a6f97'], ['msj', '#3a3f44'], ['bio101', '#8b1e2b']];
const rail = RAIL
  .map(([n, c]) => `          <i class="rail__tab" style="--ratio:${META[n].ratio}">` +
                   `<svg class="t-${n}" color="${c}"><use href="#tab-${n}"/></svg></i>`)
  .join('\n') + '\n';

const mark = read('mark.svg').trim();

const html = read('index.tpl.html')
  .replace('{{TAB_SYMBOLS}}', read('tab-symbols.svg'))
  .replace('{{HERO_TABS}}', read('hero-tabs.html').trimEnd())
  .replace('{{HERO_CONFETTI}}', read('hero-confetti.html').trimEnd())
  .replace('{{TINTS}}', tints)
  .replace('{{RAIL}}', rail)
  .replace('{{PANEL}}', read('panel.html').trimEnd())
  .replaceAll('{{MARK}}', mark);

if (html.includes('{{')) throw new Error('unfilled placeholder in template');
writeFileSync(new URL('../public/index.html', here), html);
console.log('index.html', html.length, 'bytes');

// The template links /caddy.css and /caddy.js unstamped, so a rebuild always hands
// index.html back the un-versioned URLs. Cloudflare caches those for four hours and the
// wrangler token on this Mac cannot purge, so an unstamped deploy ships new markup that
// the edge dresses in old CSS. That happened on 2026-08-24 with the App Store badge.
// Stamping is not an optional follow-up step; run it here so it cannot be forgotten.
await import('./stamp-assets.mjs');
