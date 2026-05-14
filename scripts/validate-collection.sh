#!/usr/bin/env bash
set -euo pipefail

echo "== Building site =="
npx @11ty/eleventy

echo
echo "== Checking key generated pages =="

pages=(
  "_site/index.html"
  "_site/collection/index.html"
  "_site/collection/manhattan/index.html"
  "_site/collection/manhattan/unl-man-0001/index.html"
  "_site/groups/manhattan/index.html"
  "_site/official/ny630a/index.html"
  "_site/unlisted/unl-man-0001/index.html"
  "_site/browse/index.html"
  "_site/sitemap.xml"
)

for page in "${pages[@]}"; do
  if [[ -f "$page" ]]; then
    echo "OK: $page"
  else
    echo "MISSING: $page"
    exit 1
  fi
done

echo
echo "== Collection Manhattan counts =="

all_count=$(grep -c 'data-collection-token-card' _site/collection/manhattan/index.html || true)
listed_count=$(grep -c 'data-status="listed"' _site/collection/manhattan/index.html || true)
unlisted_count=$(grep -c 'data-status="unlisted"' _site/collection/manhattan/index.html || true)

echo "All cards:      $all_count"
echo "Listed cards:   $listed_count"
echo "Unlisted cards: $unlisted_count"

if [[ "$all_count" -le 0 ]]; then
  echo "ERROR: No collection cards found."
  exit 1
fi

if [[ "$unlisted_count" -le 0 ]]; then
  echo "ERROR: No unlisted cards found on Manhattan collection page."
  exit 1
fi

echo
echo "== Checking collection filter assets =="

grep -q 'data-collection-status-filters' _site/collection/manhattan/index.html
grep -q '/assets/js/collection.js' _site/collection/manhattan/index.html
grep -q 'is-filter-hidden' _site/assets/js/collection.js
grep -q '.is-filter-hidden' _site/assets/css/site.css

echo "OK: filter markup, JS, and CSS found"

echo
echo "== Checking collection-scoped links =="

grep -q 'href="/collection/manhattan/unl-man-0001/"' _site/collection/manhattan/index.html
grep -q '/collection/manhattan/' _site/collection/manhattan/unl-man-0001/index.html

echo "OK: collection links and collection token page references found"

echo
echo "== Checking legacy routes still exist =="

grep -q '/official/' _site/sitemap.xml
grep -q '/unlisted/' _site/sitemap.xml
grep -q '/groups/manhattan/' _site/sitemap.xml

echo "OK: legacy official/unlisted/group routes still present"

echo
echo "== Git whitespace check =="
git diff --check

echo
echo "✅ Collection validation passed"
