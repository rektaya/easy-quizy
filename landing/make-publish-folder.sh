#!/bin/sh
# Builds ../landing-publish: exactly the files the website needs, nothing else (no sample-data script, no unused pictures).
# That folder is what goes to Netlify (drag it onto https://app.netlify.com/drop). Run again after every change to the page:
#   sh landing/make-publish-folder.sh
set -e
cd "$(dirname "$0")"
OUT=../landing-publish

# the privacy page has two places to fill in (your name and your email, written [[like this]]): do not build a site that still has them
# (an older build is removed too, so there is nothing stale to drag to Netlify by mistake)
rm -rf "$OUT"
if grep -q "\[\[" privacy.html; then
  echo "STOP: landing/privacy.html still has [[...]] places to fill in (your name and your email). Fill them in, then run this again."
  grep -n "\[\[" privacy.html
  exit 1
fi
rm -rf "$OUT"
mkdir -p "$OUT/img" "$OUT/fonts"

# a new version number on the style and script links on every build, so visitors never get an old copy from their browser cache
V=$(date +%Y%m%d%H%M)
sed -E "s/\?v=[0-9]+/?v=$V/g" index.html > "$OUT/index.html"
sed -E "s/\?v=[0-9]+/?v=$V/g" privacy.html > "$OUT/privacy.html"
cp style.css main.js "$OUT/"
cp fonts/Satoshi-Regular.woff2 fonts/Satoshi-Medium.woff2 fonts/FFL.txt "$OUT/fonts/"
cp img/star-big.svg img/star-small.svg img/screen-explore.webp img/screen-study.webp img/screen-map.webp "$OUT/img/"

cat > "$OUT/_headers" <<'EOF'
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
/fonts/*
  Cache-Control: public, max-age=31536000, immutable
EOF

echo "Built $(cd "$OUT" && pwd)"
du -sh "$OUT" | cut -f1
find "$OUT" -type f | sed "s#^$OUT/##" | sort
