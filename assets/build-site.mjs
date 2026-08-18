// Assembles index.html from the template plus the generated fragments.
// The output is a plain static file; nothing here runs at request time.
import { readFileSync, writeFileSync } from 'node:fs';

const here = new URL('./', import.meta.url);
const read = f => readFileSync(new URL(f, here), 'utf8');

const TINT = { cherry:'#8b1e2b', graphite:'#3a3f44', green:'#1c4429', sky:'#2a6f97' };
// Blake's own picks in his live Caddy, 2026-08-18 (marketing kit brand.json)
const strip = [['msj','graphite'], ['research','green'], ['contracts','sky'], ['bio101','cherry']]
  .map(([n, t]) => `        <svg class="t-${n}" color="${TINT[t]}"><use href="#tab-${n}"/></svg>`)
  .join('\n') + '\n';

const mark = read('mark.svg').trim();

const html = read('index.tpl.html')
  .replace('{{TAB_SYMBOLS}}', read('tab-symbols.svg'))
  .replace('{{HERO_TABS}}', read('hero-tabs.html').trimEnd())
  .replace('{{HERO_CONFETTI}}', read('hero-confetti.html').trimEnd())
  .replace('{{STRIP}}', strip)
  .replace('{{PANEL}}', read('panel.html').trimEnd())
  .replaceAll('{{MARK}}', mark);

if (html.includes('{{')) throw new Error('unfilled placeholder in template');
writeFileSync(new URL('../index.html', here), html);
console.log('index.html', html.length, 'bytes');
