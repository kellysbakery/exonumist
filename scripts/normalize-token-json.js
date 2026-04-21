#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const files = args.filter(a => a !== "--check");

if (!files.length) {
  console.log("Usage:");
  console.log("  node scripts/normalize-token-json.js [--check] <files...>");
  process.exit(1);
}

function ordered(record) {
  const rel =
    Array.isArray(record.rel) ? record.rel :
    Array.isArray(record.relCatalog) ? record.relCatalog :
    [];

  const displayId =
    record.displayId ||
    record.siteId ||
    "";

  const title =
    record.title ||
    record.displayTitle ||
    "";

  const val =
    record.val === "" || record.val === undefined
      ? null
      : record.val;

  const size =
    record.size === "" || record.size === undefined
      ? null
      : record.size;

  return {
    id: record.id || "",
    displayId,
    sec: record.sec || "",
    code: record.code || "",
    var: record.var || "",

    status: record.status || "",
    type: record.type || "",
    groups: Array.isArray(record.groups) ? record.groups : [],

    title,
    city: record.city || "",
    borough: record.borough || "",
    state: record.state || "",

    mat: record.mat || "",
    form: record.form || "",
    symbol: record.symbol || "",
    size,

    obv: record.obv || "",
    rev: record.rev || "",

    desc: record.desc || "",
    notes: record.notes || "",

    val,
    market: record.market || "",
    rel,

    baseId: record.baseId || "",
    oddityType: record.oddityType || "",
    confidence: record.confidence || "",

    home: Boolean(record.home),
    pub: Boolean(record.pub),
    sort: record.sort || ""
  };
}

function normalizeFile(file) {
  const raw = fs.readFileSync(file, "utf8");
  const data = JSON.parse(raw);

  if (!Array.isArray(data)) {
    throw new Error(`${file} is not an array`);
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
