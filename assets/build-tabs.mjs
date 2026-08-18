// Builds the inline <symbol> set for Caddy's floating tabs from the marketing kit's
// vector renders. Geometry is untouched: it came out of Caddy's own tab view
// (EdgeTabView/TabFill via SwiftUI ImageRenderer) and the label glyphs are outlined
// from SF Pro Rounded Semibold 12pt. The only edit is the pill fill, which becomes
// currentColor so a page instance can carry any real WorkspaceTint.
import { readFileSync, writeFileSync } from 'node:fs';

const KIT = '/Users/blakewilliammorris/Desktop/M/Caddy Ads/Caddy_NoGravity_Marketing_Kit_FLAT';
const TABS = [
  { slug: 'bio101',    file: 'Tab_BIO101_floating.svg',     label: 'BIO 101' },
  { slug: 'msj',       file: 'Tab_DraftForMSJ_floating.svg', label: 'Draft for MSJ' },
  { slug: 'research',  file: 'Tab_Research_floating.svg',    label: 'Research' },
  { slug: 'contracts', file: 'Tab_Contracts_floating.svg',   label: 'Contracts' },
];

const PAD = 1.5; // points of breathing room around the pill inside the viewBox

function pillExtent(d) {
  const n = d.match(/-?\d+(?:\.\d+)?/g).map(Number);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < n.length; i += 2) {
    minX = Math.min(minX, n[i]);   maxX = Math.max(maxX, n[i]);
    minY = Math.min(minY, n[i+1]); maxY = Math.max(maxY, n[i+1]);
  }
  return { minX, maxX, minY, maxY };
}

const out = [];
const meta = {};
for (const t of TABS) {
  const src = readFileSync(`${KIT}/${t.file}`, 'utf8');
  const body = src.match(/<g transform="matrix\(1 0 0 -1 0 200\)">([\s\S]*?)<\/g>\s*<\/svg>/)[1];
  const pillD = body.match(/id="pill" d="([^"]+)"/)[1];
  const e = pillExtent(pillD);

  // the group flips y (y' = 200 - y); the pill is symmetric about y=100 so the
  // extents survive the flip unchanged.
  const vb = [
    (e.minX - PAD).toFixed(2),
    (200 - e.maxY - PAD).toFixed(2),
    (e.maxX - e.minX + PAD * 2).toFixed(2),
    (e.maxY - e.minY + PAD * 2).toFixed(2),
  ].join(' ');

  const cleaned = body
    .replace(/id="pill" d="([^"]+)" fill="#[0-9a-f]{6}"/i, 'd="$1" fill="currentColor"')
    .replace(/\sid="(inner-highlight|label|ball)"/g, '')
    .replace(/\n\s{4}/g, '\n      ')
    .trim();

  out.push(
    `    <symbol id="tab-${t.slug}" viewBox="${vb}">\n` +
    `      <g transform="matrix(1 0 0 -1 0 200)">\n        ${cleaned}\n      </g>\n` +
    `    </symbol>`
  );
  meta[t.slug] = {
    label: t.label,
    length: +(e.maxX - e.minX).toFixed(1),
    ratio: +((e.maxX - e.minX + PAD * 2) / (e.maxY - e.minY + PAD * 2)).toFixed(4),
  };
}

writeFileSync(new URL('./tab-symbols.svg', import.meta.url), out.join('\n') + '\n');
writeFileSync(new URL('./tab-meta.json', import.meta.url), JSON.stringify(meta, null, 2) + '\n');
console.log(JSON.stringify(meta, null, 2));
