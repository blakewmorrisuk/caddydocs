// Emits the frozen No Gravity composition as static markup, so the hero exists
// with JavaScript off and never depends on script to be beautiful.
// Tab placement is authored by hand below. Confetti is seeded, so the same
// "impossible instant" comes out of every run.
import { writeFileSync } from 'node:fs';

const TINT = {
  green:'#1c4429', fairway:'#2f6b3a', blue:'#1f4e8c', teal:'#146c74', plum:'#5b2d6e',
  coral:'#b6473a', amber:'#a8631a', graphite:'#3a3f44', navy:'#1c2b4a', rose:'#9c3457',
  sky:'#2a6f97', indigo:'#3b3f8f', orchid:'#8c2f6b', walnut:'#6b4a2a', cherry:'#8b1e2b',
  olive:'#55672a',
};

// Depth reads from the middle outward: the pieces nearest the centre are the ones
// furthest from the camera, so the tagline sits in clear air by construction.
// x/y are percentages of the hero box, r is degrees, and no two rotations repeat.
// drop: the width at which this piece leaves the composition, so smaller screens
// thin the cluster instead of shrinking it into illegibility.
const TABS = [
  // band 3, far: small, dim, soft
  { n:'research',  t:'teal',    b:3, x:31, y:21, r:-24, sm:[67, 24] },
  { n:'bio101',    t:'navy',    b:3, x:69, y:77, r: 33, drop:'sm' },
  { n:'contracts', t:'olive',   b:3, x:64, y:19, r: 58, drop:'lg' },
  { n:'msj',       t:'coral',   b:3, x:35, y:75, r:-49, sm:[72, 93] },
  { n:'bio101',    t:'orchid',  b:3, x:49, y:11, r:  9, drop:'md' },
  { n:'research',  t:'walnut',  b:3, x:52, y:87, r:-16, drop:'lg' },
  // band 2, middle
  { n:'research',  t:'green',   b:2, x:19, y:34, r:-37, sm:[25, 27] },
  { n:'contracts', t:'sky',     b:2, x:81, y:59, r: 17, sm:[84, 76] },
  { n:'bio101',    t:'amber',   b:2, x:77, y:31, r: 68, drop:'sm' },
  { n:'msj',       t:'indigo',  b:2, x:23, y:65, r: 79, sm:[16, 80] },
  { n:'contracts', t:'fairway', b:2, x:62, y:92, r:-71, drop:'lg' },
  // band 1, near: large, sharp, heavy shadow, two of them cropped by the frame
  { n:'msj',       t:'graphite',b:1, x: 9, y:80, r:-63, sm:[45, 92] },
  { n:'bio101',    t:'cherry',  b:1, x:91, y:17, r: 41, sm:[89, 14] },
  { n:'contracts', t:'plum',    b:1, x: 3, y:21, r: 86, sm:[ 5, 13] },
];

// tiny seeded PRNG so the composition is reproducible
let seed = 0x2026_0818 >>> 0;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const between = (a, b) => a + rnd() * (b - a);
const pick = a => a[Math.floor(rnd() * a.length)];

const CONFETTI_COLORS = [
  TINT.cherry, TINT.sky, TINT.green, TINT.amber, TINT.plum, TINT.teal,
  TINT.rose, TINT.fairway, TINT.orchid, TINT.coral, '#f2f5ef', '#ff7a52',
];

// the tagline's air: nothing sharp lands inside this ellipse
const clearOfType = (x, y) => (((x - 50) / 30) ** 2 + ((y - 47) / 19) ** 2) > 1;

const confetti = [];
for (let i = 0; confetti.length < 62 && i < 6000; i++) {
  const band = confetti.length % 4 === 0 ? 1 : confetti.length % 5 < 3 ? 2 : 3;
  const x = between(-2, 102), y = between(-2, 102);
  if (band < 3 && !clearOfType(x, y)) continue;
  if (band === 3 && (((x - 50) / 16) ** 2 + ((y - 47) / 11) ** 2) < 1) continue;
  const sliver = rnd() < 0.42;                       // a piece caught nearly edge-on
  confetti.push({
    x: +x.toFixed(2), y: +y.toFixed(2), b: band,
    w: +between(band === 1 ? 8 : band === 2 ? 5.5 : 3.5, band === 1 ? 15 : band === 2 ? 10 : 6.5).toFixed(1),
    h: +between(2.5, 5).toFixed(1),
    r: Math.round(between(-180, 180)),
    sx: sliver ? +between(0.18, 0.55).toFixed(2) : 1,
    o: +between(band === 1 ? 0.62 : band === 2 ? 0.4 : 0.16,
                band === 1 ? 0.9  : band === 2 ? 0.66 : 0.34).toFixed(2),
    c: pick(CONFETTI_COLORS),
    p: Math.round(between(0, 9999)),                  // its own drift phase
  });
}

const tabs = TABS.map((t, i) => {
  const phase = Math.round((i * 2731) % 9000);
  const drop = t.drop ? ` data-drop="${t.drop}"` : '';
  const sm = t.sm ? `--sx:${t.sm[0]}%;--sy:${t.sm[1]}%;` : '';
  return `        <svg class="tab tab--b${t.b} t-${t.n}"${drop} style="--x:${t.x}%;--y:${t.y}%;${sm}--rot:${t.r};--p:${phase}" ` +
         `color="${TINT[t.t]}" aria-hidden="true"><use href="#tab-${t.n}"/></svg>`;
}).join('\n');

const chips = confetti.map(c =>
  `        <i class="chip chip--b${c.b}" data-b="${c.b}" style="--x:${c.x}%;--y:${c.y}%;--w:${c.w}px;--h:${c.h}px;` +
  `--rot:${c.r};--sx:${c.sx};--o:${c.o};--c:${c.c};--p:${c.p}"></i>`
).join('\n');

writeFileSync(new URL('./hero-tabs.html', import.meta.url), tabs + '\n');
writeFileSync(new URL('./hero-confetti.html', import.meta.url), chips + '\n');

/* ── the No Gravity panel further down the page: the same tabs, the same physics,
      composed inside a frame instead of a full screen ─────────────────────────── */
const PANEL = [
  { n:'contracts', t:'olive',   b:3, x:47, y:15, r: 31 },
  { n:'research',  t:'teal',    b:3, x:53, y:86, r:-27 },
  { n:'bio101',    t:'plum',    b:3, x:69, y:45, r: 74 },
  { n:'contracts', t:'navy',    b:3, x:27, y:53, r:-71, drop:'md' },
  { n:'research',  t:'green',   b:2, x:35, y:29, r:-15 },
  { n:'contracts', t:'sky',     b:2, x:62, y:69, r: 22 },
  { n:'bio101',    t:'amber',   b:2, x:90, y:75, r:-59, drop:'md' },
  { n:'msj',       t:'indigo',  b:2, x: 9, y:31, r: 66, drop:'md' },
  { n:'msj',       t:'graphite',b:1, x:19, y:73, r:-38 },
  { n:'bio101',    t:'cherry',  b:1, x:80, y:25, r: 47 },
];
const panelTabs = PANEL.map((t, i) => {
  const drop = t.drop ? ` data-drop="${t.drop}"` : '';
  return `        <svg class="tab tab--b${t.b} t-${t.n}"${drop} style="--x:${t.x}%;--y:${t.y}%;--rot:${t.r};--p:${(i * 1913) % 9000}" ` +
         `color="${TINT[t.t]}" aria-hidden="true"><use href="#tab-${t.n}"/></svg>`;
}).join('\n');

const panelChips = [];
for (let i = 0; panelChips.length < 16 && i < 3000; i++) {
  const band = panelChips.length % 5 === 0 ? 1 : panelChips.length % 2 === 0 ? 2 : 3;
  const x = between(1, 99), y = between(3, 97);
  panelChips.push(
    `        <i class="chip chip--b${band}" data-b="${band}" style="--x:${x.toFixed(2)}%;--y:${y.toFixed(2)}%;` +
    `--w:${between(band === 1 ? 6 : 3.5, band === 1 ? 11 : 7).toFixed(1)}px;--h:${between(2.5, 4.5).toFixed(1)}px;` +
    `--rot:${Math.round(between(-180, 180))};--sx:${rnd() < 0.4 ? between(0.2, 0.55).toFixed(2) : 1};` +
    `--o:${between(band === 1 ? 0.6 : 0.24, band === 1 ? 0.85 : 0.5).toFixed(2)};--c:${pick(CONFETTI_COLORS)};` +
    `--p:${Math.round(between(0, 9999))}"></i>`
  );
}

writeFileSync(new URL('./panel.html', import.meta.url), panelTabs + '\n' + panelChips.join('\n') + '\n');
console.log(`${TABS.length} hero tabs, ${confetti.length} hero confetti, ${PANEL.length} panel tabs, ${panelChips.length} panel confetti`);
