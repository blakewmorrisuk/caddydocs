# caddydocs.com

The public website for Caddy. Three pages plus a 404, no framework, no build server,
no third-party requests. Everything is static.

```
public/                 ← THE DEPLOY ROOT. Only this folder goes to Cloudflare.
  index.html            the landing page
  privacy.html          → https://caddydocs.com/privacy
  support.html          → https://caddydocs.com/support
  404.html
  caddy.css  caddy.js   one stylesheet, one script
  assets/img/           web derivatives of the marketing kit
  _headers              Cloudflare Pages headers, including the CSP
  robots.txt  sitemap.xml
src/                    build scripts, the page template, generated fragments
DEPLOY.md  README.md
```

**Deploy `public/`, never the repository root.** `wrangler pages deploy` uploads whatever
directory you point it at, so pointing it here would publish this file, with its map of your
Desktop and your release process, at `caddydocs.com/DEPLOY.md`. Checked, not assumed: before
the split, `curl http://127.0.0.1:8791/DEPLOY.md` returned 200.

**The URL shape is load-bearing.** The app opens `https://caddydocs.com/privacy` and
`https://caddydocs.com/support` from Settings ▸ General
(`~/Desktop/M/Caddy/mac/Sources/Support/Brand.swift:8-9`), and those two strings also go
into App Store Connect. They are flat `.html` files on purpose. Measured against
`wrangler pages dev`, which is the real Pages router:

| file layout | `/privacy` |
|---|---|
| `public/privacy.html` | **200** |
| `public/privacy/index.html` | 308 redirect to `/privacy/` |

So `privacy.html` it is. `/privacy/` and `/privacy.html` both 308 to the canonical
`/privacy`. Do not move these into folders.

---

## Blake's three steps, in this order

### 1. blake@caddydocs.com has to deliver mail. This is the gate.

The address does not exist yet. It is printed on all four pages and it goes into App Store
Connect as the support contact, which means an App Reviewer will try it. A support address
that bounces is a rejection, so make this deliver **before** you attach the custom domain. Cloudflare dashboard ▸ caddydocs.com ▸ **Email** ▸
Email Routing ▸ enable ▸ **Create address** `blake` ▸ forward to the inbox you actually read
▸ confirm the verification mail Cloudflare sends to that inbox. Cloudflare adds the MX and
TXT records itself. Five minutes, free.

### 2. Log wrangler in, once

```
npx wrangler login
```

A browser tab opens, you click Allow, and it stores the token. Nothing else needs it.

### 3. Deploy

```
npx wrangler pages deploy ~/Desktop/M/caddydocs/public --project-name=caddydocs --commit-dirty=true
```

Then Cloudflare dashboard ▸ Workers & Pages ▸ caddydocs ▸ **Custom domains** ▸ Set up a
custom domain ▸ `caddydocs.com`, and again for `www.caddydocs.com` if you want it. The
nameservers are already Cloudflare's, so it writes the DNS records and issues the
certificate itself. Give it a few minutes.

---

## Verify before you tell Apple about it

```
curl -sI https://caddydocs.com/privacy | head -1     # HTTP/2 200, not a redirect
curl -sI https://caddydocs.com/support | head -1     # HTTP/2 200, not a redirect
curl -sI https://caddydocs.com/        | head -1     # HTTP/2 200
```

Then open Caddy ▸ Settings ▸ General ▸ **Privacy Policy…** and **Support…** and watch the
real pages open in your browser. That is exactly the path App Review takes under Guideline
5.1.1(i).

---

## Two things that must stay in step with the app

- **The copyright holder.** Every page footer and the privacy policy say
  **Caddy Legal LLC**. The build still says `© 2026 Blake Morris`. Change
  `~/Desktop/M/Caddy/mac/project.yml` line 56 to
  `NSHumanReadableCopyright: "© 2026 Caddy Legal LLC"`, rerun `scripts/archive.sh`, and put
  the same string in App Store Connect ▸ Copyright. If you decide to keep it in your own
  name instead, change it in `src/index.tpl.html` (then rebuild) and in `public/privacy.html`,
  `public/support.html` and `public/404.html`, plus the "made by" line at the top of the policy.
- **The privacy policy is a claim about the shipping binary.** Every sentence on
  `/privacy` was checked against `mac/Caddy.entitlements` (app-sandbox,
  files.user-selected.read-write, files.bookmarks.app-scope, and nothing else, so no
  network entitlement) and `mac/Resources/PrivacyInfo.xcprivacy`. If the app ever gains an
  entitlement, an analytics library, or an update check, the policy has to change first.

## Checking the router before you ship a change

`wrangler pages dev` runs the same routing Pages runs, which is how the flat-file decision
above was made rather than guessed:

```
npx wrangler pages dev ~/Desktop/M/caddydocs/public --port 8791
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8791/privacy   # 200
```

## The App Store badge

The store slot on the landing page and in the closing section is plain text,
**Coming to the Mac App Store**. Apple ties the badge artwork to a working store link, so
there is no badge and no fake href. After approval, search `public/index.html` for
`App Store slot` and swap the `<p class="store">` for Apple's official badge image linked
to the real URL. Two lines, both marked in the HTML.

## Rebuilding the generated parts

`public/index.html` is assembled from `src/index.tpl.html` and generated fragments. Editing
the copy in `public/index.html` directly is fine for a one-off, but it will be overwritten
the next time anyone runs the build. The real source is the template.

```
node src/build-tabs.mjs     # tab <symbol> set from the kit's vector renders
node src/build-hero.mjs     # the frozen composition and the No Gravity panel
node src/build-site.mjs     # index.tpl.html + fragments → public/index.html
src/build-assets.sh         # the images, from the marketing kit
```

Preview locally from a `/tmp` mirror, because a local server cannot read `~/Desktop` under
macOS privacy controls:

```
rsync -a ~/Desktop/M/caddydocs/public/ /tmp/caddysite/
cd /tmp/caddysite && python3 -m http.server 8788
```

Note that `python3 -m http.server` gets the extensionless URLs wrong in the other
direction (it 301s `/privacy` to `/privacy/`). Use `wrangler pages dev` whenever the answer
matters.

## Where the pictures came from

Every tab on this site is Caddy's own drawing code. The four `<symbol>` definitions inlined
at the top of `public/index.html` were lifted from
`~/Desktop/M/Caddy Ads/Caddy_NoGravity_Marketing_Kit_FLAT/Tab_*_floating.svg`, whose
geometry came out of a vector PDF rendered by `EdgeTabView`/`TabFill` with the labels
outlined from SF Pro Rounded Semibold 12 pt. The only change is that the pill fill reads
`currentColor`, so a page instance can carry any of the sixteen real `WorkspaceTint` hex
values. The expanded Caddies are the kit's transparent product captures, unretouched. The
drift in `caddy.js` is scaled down from `Sources/Windows/ZeroGravityMath.swift`; the numbers
are in the comment at the top of the file.
