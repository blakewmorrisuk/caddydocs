#!/bin/bash
# Prepares every raster the site uses. Nothing is upscaled and nothing is redrawn:
# these are Caddy's own screen captures and its shipping app icon, resized with sips
# only where the page displays them smaller.
#
# Two sources, on purpose:
#   KIT  the 2026-08-18 No Gravity marketing kit, captured from a twin of commit c884cfb
#   RC   the release-build captures taken later the same day, which are the newest real
#        pictures of the app that exist. drawer-panes is the only capture anywhere that
#        shows two documents open at once, which is what the page claims.
set -euo pipefail
KIT="/Users/blakewilliammorris/Desktop/M/Caddy Ads/Caddy_NoGravity_Marketing_Kit_FLAT"
RC="/Users/blakewilliammorris/Desktop/M/Caddy/rc/screens/store"
ICONSET="/Users/blakewilliammorris/Desktop/M/Caddy/mac/Resources/Assets.xcassets/AppIcon.appiconset"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/assets/img"
mkdir -p "$OUT"

# --- the open Caddies, native size, for the two explanation sections
cp "$RC/drawer-panes.png"                              "$OUT/caddy-panes.png"    # 572 x 1000
cp "$RC/drawer-notes.png"                              "$OUT/caddy-notes.png"    # 572 x 1000
cp "$KIT/Product_07_Research_topEdge_Library_alpha.png" "$OUT/caddy-topedge.png"  # 588 x 731

# --- icons from the shipping app icon set (build 3, the green tab, not the old flag)
cp "$ICONSET/icon_32.png"  "$OUT/icon-32.png"
cp "$ICONSET/icon_512.png" "$OUT/icon-512.png"
cp "$ICONSET/icon_256.png" "$OUT/icon-180.png"; sips -Z 180 "$OUT/icon-180.png" >/dev/null

echo "--- built ---"
/bin/ls -l "$OUT" | awk '{printf "%8s  %s\n", $5, $9}'
