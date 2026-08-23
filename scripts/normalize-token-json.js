#!/usr/bin/env node
/**
 * normalize-token-json.js
 * ------------------------------------------------------------
 * Purpose:
 * Normalize token data JSON files into the canonical Exonumist
 * schema and consistent field order.
 *
 * Why this exists:
 * Over time, token records evolved with mixed field names such as:
 * - siteId vs displayId
 * - displayTitle vs title
 * - relCatalog vs rel
 *
 * This script converts legacy records into the standardized model,
 * fills missing standard fields, and rewrites records in a clean,
 * predictable order for easier maintenance and cleaner diffs.
 *
 * Canonical field order:
 * ------------------------------------------------------------
 * id
 * displayId
 * sec
 * code
 * var
 *
 * status
 * collectionArea
 * catalogStatus
 * classification
 * type
 * groups
 *
 * title
 * borough
 *
 * mat
 * form
 * symbol
 * size
 *
 * obv
 * rev
 *
 * desc
 * notes
 *
 * rel
 * catalogCrossReferences (optional)
 *
 * home
 * pub
 * sort
 *
 * Legacy field mappings:
 * ------------------------------------------------------------
 * siteId       -> displayId
 * displayTitle -> title
 * relCatalog   -> rel
 *
 * Normalization rules:
 * ------------------------------------------------------------
 * - Missing string fields become ""
 * - Missing arrays become []
 * - Missing booleans become false
 * - Empty numeric values become null
 * - size becomes number or null
 * - Records are rewritten in consistent key order
 *
 * Safe usage:
 * ------------------------------------------------------------
 * Always run with --check first to preview changed files.
 *
 * Example:
 * node scripts/normalize-token-json.js --check \
 *   src/_data/tokens/*.json
 *
 * Then run for real:
 *
 * node scripts/normalize-token-json.js \
 *   src/_data/tokens/*.json
 *
 * Review changes:
 * git diff
 *
 * Notes:
 * ------------------------------------------------------------
 * This script performs structural normalization only.
 * It does NOT intelligently fix semantic data issues such as:
 * - incorrect material codes
 * - bad descriptions
 * - wrong sort values
 * - missing historical notes
 * - image filename mismatches
 *
 * Those should be handled separately as content cleanup.
 * ------------------------------------------------------------
 */

const fs = require("fs");

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const files = args.filter((a) => a !== "--check");

if (!files.length) {
  console.log("Usage:");
  console.log("  node scripts/normalize-token-json.js [--check] <files...>");
  process.exit(1);
}

function normalizeNullableNumber(value) {
  if (value === "" || value === undefined || value === null) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isNaN(value) ? null : value;
  }

  const trimmed = String(value).trim();
  if (trimmed === "") {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? value : parsed;
}

function ordered(record) {
  const rel = Array.isArray(record.rel)
    ? record.rel
    : Array.isArray(record.relCatalog)
      ? record.relCatalog
      : [];

  const displayId = record.displayId || record.siteId || "";
  const title = record.title || record.displayTitle || "";
  const catalogCrossReferences = Array.isArray(record.catalogCrossReferences)
    ? record.catalogCrossReferences
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;

          const id = String(entry.id || "").trim();
          if (!id) return null;

          return {
            catalog: String(entry.catalog || "").trim(),
            id
          };
        })
        .filter(Boolean)
    : [];

  return {
    id: record.id || "",
    displayId,
    sec: record.sec || "",
    code: record.code || "",
    var: record.var || "",

    status: record.status || "",
    collectionArea: record.collectionArea || "",
    catalogStatus: record.catalogStatus || record.status || "",
    classification: record.classification || "regular",
    type: record.type || "",
    groups: Array.isArray(record.groups) ? record.groups : [],

    title,
    borough: record.borough || "",

    mat: record.mat || "",
    form: record.form || "",
    symbol: record.symbol || "",
    size: normalizeNullableNumber(record.size),

    obv: record.obv || "",
    rev: record.rev || "",

    desc: record.desc || "",
    notes: record.notes || "",

    rel,
    ...(catalogCrossReferences.length ? { catalogCrossReferences } : {}),

    home: Boolean(record.home),
    pub: Boolean(record.pub),
    sort: record.sort || ""
  };
}

function normalizeFile(file) {
  const raw = fs.readFileSync(file, "utf8");
  const data = JSON.parse(raw);

  if (!Array.isArray(data)) {
    console.log(`SKIP: ${file} (not an array)`);
    return;
  }

  const normalized = data.map(ordered);
  const output = JSON.stringify(normalized, null, 2) + "\n";

  if (checkOnly) {
    if (raw !== output) {
      console.log(`DIFF: ${file}`);
    }
    return;
  }

  fs.writeFileSync(file, output, "utf8");
  console.log(`UPDATED: ${file}`);
}

for (const file of files) {
  normalizeFile(file);
}
