#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "src", "_data");
const OFFICIAL_DIR = path.join(DATA_DIR, "official");
const UNOFFICIAL_DIR = path.join(DATA_DIR, "unofficial");

const REQUIRED_FIELDS = [
  "id",
  "displayId",
  "status",
  "type",
  "groups",
  "title",
  "mat",
  "form",
  "symbol",
  "size",
  "obv",
  "rev",
  "desc",
  "notes",
  "rel",
  "home",
  "pub",
  "sort"
];

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getJsonFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => path.join(dir, file));
}

function fail(errors) {
  console.error("");
  console.error("❌ Data validation failed");
  console.error("");

  for (const error of errors) {
    console.error(`- ${error}`);
  }

  console.error("");
  process.exit(1);
}

function success() {
  console.log("✅ Data validation passed");
}

function main() {
  const errors = [];

  // Load lookup data
  const lookups = loadJson(path.join(DATA_DIR, "lookups.json"));
  const groups = loadJson(path.join(DATA_DIR, "groups.json"));

  const validStatuses = new Set(Object.keys(lookups.status || {}));
  const validTypes = new Set(Object.keys(lookups.type || {}));
  const validMaterials = new Set(Object.keys(lookups.materials || {}));
  const validForms = new Set(Object.keys(lookups.forms || {}));
  const validSymbols = new Set(Object.keys(lookups.symbols || {}));
  const validGroups = new Set(groups.map((g) => g.key));

  // Gather all token files
  const tokenFiles = [
    ...getJsonFiles(OFFICIAL_DIR),
    ...getJsonFiles(UNOFFICIAL_DIR)
  ];

  const seenIds = new Map();
  const seenDisplayIds = new Map();

  for (const filePath of tokenFiles) {
    const fileName = path.relative(ROOT, filePath);
    const tokens = loadJson(filePath);

    if (!Array.isArray(tokens)) {
      errors.push(`${fileName}: root must be an array`);
      continue;
    }

    tokens.forEach((token, index) => {
      const label = `${fileName}[${index}] (${token.displayId || token.id || "unknown"})`;

      // Required fields
      for (const field of REQUIRED_FIELDS) {
        if (!(field in token)) {
          errors.push(`${label}: missing required field '${field}'`);
        }
      }

      // id uniqueness
      if (token.id) {
        if (seenIds.has(token.id)) {
          errors.push(
            `${label}: duplicate id '${token.id}' (already used in ${seenIds.get(token.id)})`
          );
        } else {
          seenIds.set(token.id, fileName);
        }
      }

      // displayId uniqueness
      if (token.displayId) {
        if (seenDisplayIds.has(token.displayId)) {
          errors.push(
            `${label}: duplicate displayId '${token.displayId}' (already used in ${seenDisplayIds.get(token.displayId)})`
          );
        } else {
          seenDisplayIds.set(token.displayId, fileName);
        }
      }

      // status
      if (token.status && !validStatuses.has(token.status)) {
        errors.push(`${label}: invalid status '${token.status}'`);
      }

      // type
      if (token.type && !validTypes.has(token.type)) {
        errors.push(`${label}: invalid type '${token.type}'`);
      }

      // material
      if (token.mat && !validMaterials.has(token.mat)) {
        errors.push(`${label}: invalid material '${token.mat}'`);
      }

      // form
      if (token.form && !validForms.has(token.form)) {
        errors.push(`${label}: invalid form '${token.form}'`);
      }

      // symbol
      if (token.symbol && !validSymbols.has(token.symbol)) {
        errors.push(`${label}: invalid symbol '${token.symbol}'`);
      }

      // groups
      if (!Array.isArray(token.groups)) {
        errors.push(`${label}: groups must be an array`);
      } else {
        for (const group of token.groups) {
          if (!validGroups.has(group)) {
            errors.push(`${label}: invalid group '${group}'`);
          }
        }
      }

      // rel
      if (!Array.isArray(token.rel)) {
        errors.push(`${label}: rel must be an array`);
      }

      // data types
      if (typeof token.home !== "boolean") {
        errors.push(`${label}: home must be boolean`);
      }

      if (typeof token.pub !== "boolean") {
        errors.push(`${label}: pub must be boolean`);
      }

      if (token.size !== null && typeof token.size !== "number") {
        errors.push(`${label}: size must be numeric or null`);
      }

    });
  }

  if (errors.length > 0) {
    fail(errors);
  }

  success();
}

main();
