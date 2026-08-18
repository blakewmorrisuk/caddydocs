# caddydocs.com

The public website for Caddy. Three pages plus a 404, no framework, no build server,
no third-party requests. Everything is static.

```
index.html            the landing page
privacy/index.html    → https://caddydocs.com/privacy
support/index.html    → https://caddydocs.com/support
404.html
caddy.css  caddy.js   one stylesheet, one script
assets/img/           web derivatives of the marketing kit (see assets/build-assets.sh)
_headers              Cloudflare Pages headers, including the CSP
robots.txt  sitemap.xml  favicon.ico
```

**The URL shape is load-bearing.** The app opens `https://caddydocs.com/privacy` and
`https://caddydocs.com/support` from Settings ▸ General
(`~/Desktop/M/Caddy/mac/Sources/Support/Brand.swift:8-9`). Both are directory indexes, so
those exact paths answer 200 with no trailing slash. Do not rename them to `privacy.html`.

---

## Blake's three steps

### 1. blake@caddydocs.com has to deliver mail

It is on every page and it goes into App Store Connect as the support contact, so it must
work before an App Reviewer tries it. Cloudflare dashboard ▸ caddydocs.com ▸ **Email** ▸
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
npx wrangler pages deploy ~/Desktop/M/caddydocs --project-name=caddydocs --commit-dirty=true
```

Then Cloudflare dashboard ▸ Workers & Pages ▸ caddydocs ▸ **Custom domains** ▸ Set up a
custom domain ▸ `caddydocs.com`, and again for `www.caddydocs.com` if you want it. The
nameservers are already Cloudflare's, so it writes the DNS records and issues the
certificate itself. Give it a few minutes.

---

## Verify before you tell Apple about it

```
curl -sI https://caddydocs.com/privacy | head -1     # HTTP/2 200
curl -sI https://caddydocs.com/support | head -1     # HTTP/2 200
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
  name instead, change it here in three places: `index.html`, `privacy/index.html`,
  `support/index.html` (and `404.html`), plus the "made by" line at the top of the policy.
- **The privacy policy is a claim about the shipping binary.** Every sentence on
  `/privacy` was checked against `mac/Caddy.entitlements` (app-sandbox,
  files.user-selected.read-write, files.bookmarks.app-scope, and nothing else, so no
  network entitlement) and `mac/Resources/PrivacyInfo.xcprivacy`. If the app ever gains an
  entitlement, an analytics library, or an update check, the policy has to change first.

## The App Store badge

The store slot on the landing page and in the closing section is plain text,
**Coming to the Mac App Store**. Apple ties the badge artwork to a working store link, so
there is no badge and no fake href. After approval, search `index.html` for
`App Store slot` and swap the `<p class="store">` for Apple's official badge image linked
to the real URL. Two lines, both marked in the HTML.

## Rebuilding the generated parts

`index.html` is assembled from `assets/index.tpl.html` and generated fragments. Editing the
copy in `index.html` directly is fine for a one-off, but it will be overwritten the next
time anyone runs the build. The real source is the template.

```
node assets/build-tabs.mjs     # tab <symbol> set from the kit's vector renders
node assets/build-hero.mjs     # the frozen composition and the No Gravity panel
node assets/build-site.mjs     # index.tpl.html + fragments → index.html
assets/build-assets.sh         # the images, from the marketing kit
```

Preview locally from a `/tmp` mirror, because a local server cannot read `~/Desktop` under
macOS privacy controls:

```
rsync -a --exclude 'assets/*.mjs' --exclude 'assets/*.tpl.html' ~/Desktop/M/caddydocs/ /tmp/caddysite/
cd /tmp/caddysite && python3 -m http.server 8788
```

## Where the pictures came from

Every tab on this site is Caddy's own drawing code. The four `<symbol>` definitions inlined
at the top of `index.html` were lifted from
`~/Desktop/M/Caddy Ads/Caddy_NoGravity_Marketing_Kit_FLAT/Tab_*_floating.svg`, whose
geometry came out of a vector PDF rendered by `EdgeTabView`/`TabFill` with the labels
outlined from SF Pro Rounded Semibold 12 pt. The only change is that the pill fill reads
`currentColor`, so a page instance can carry any of the sixteen real `WorkspaceTint` hex
values. The expanded Caddies are the kit's transparent product captures, unretouched. The
drift in `caddy.js` is scaled down from `Sources/Windows/ZeroGravityMath.swift`; the numbers
are in the comment at the top of the file.
