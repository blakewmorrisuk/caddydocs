#!/bin/bash
# Prepares every raster the site uses from the No Gravity marketing kit.
# Nothing is upscaled and nothing is redrawn: these are Caddy's own captures and
# its shipping app icon, resized with sips only where the page displays them smaller.
set -euo pipefail
KIT="/Users/blakewilliammorris/Desktop/M/Caddy Ads/Caddy_NoGravity_Marketing_Kit_FLAT"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/assets/img"
mkdir -p "$OUT"

# --- expanded Caddies, full size, for the explanation sections (640 x 1048 native)
cp "$KIT/Product_01_BIO101_Library_with_PDF_reader_alpha.png" "$OUT/caddy-library.png"
cp "$KIT/Product_04_BIO101_Notes_populated_alpha.png"         "$OUT/caddy-notes.png"
cp "$KIT/Product_07_Research_topEdge_Library_alpha.png"        "$OUT/caddy-topedge.png"

# --- the same captures at half size for the hero, where they sit far back,
#     dimmed and blurred. Half of native is still above their rendered size there.
for pair in "caddy-library:library" "caddy-notes:notes" "caddy-topedge:topedge"; do
  src="${pair%%:*}"; name="${pair##*:}"
  cp "$OUT/$src.png" "$OUT/hero-$name.png"
  sips -Z 320 "$OUT/hero-$name.png" >/dev/null
done

# --- icons from the shipping app icon (1024, the one in the archive)
ICON="$KIT/Brand_Icon_CaddyIcon_1024_shipping.png"
for s in 32 180 512; do
  cp "$ICON" "$OUT/icon-$s.png"; sips -Z $s "$OUT/icon-$s.png" >/dev/null
done

echo "--- built ---"
/bin/ls -l "$OUT" | awk '{printf "%8s  %s\n", $5, $9}'
