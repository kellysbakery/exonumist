#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "src", "_data");
const OFFICIAL_DIR = path.join(DATA_DIR, "official");
const UNOFFICIAL_DIR = path.join(DATA_DIR, "unofficial");
const ALLOWED_IMAGE_FORMS = new Set(["R", "Oc"]);
const urlHelpers = require("../src/_data/urlHelpers");

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

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function describeToken(token) {
  return [
    `id=${token.id || "missing"}`,
    `displayId=${token.displayId || "missing"}`,
    `title=${token.title || "missing"}`,
    `borough=${token.borough || "missing"}`,
    `groups=${Array.isArray(token.groups) ? token.groups.join(",") : "missing"}`
  ].join("; ");
}

function assetExists(webPath) {
  if (!webPath || /^https?:\/\//i.test(webPath)) {
    return true;
  }

  if (!webPath.startsWith("/")) {
    return false;
  }

  return fs.existsSync(path.join(ROOT, "src", webPath.replace(/^\/+/, "")));
}

function validateImageReference(errors, sourceLabel, fieldName, webPath) {
  if (!webPath) return;

  if (!assetExists(webPath)) {
    errors.push(
      `${sourceLabel}: ${fieldName} references missing image '${webPath}'`
    );
  }
}

function validateImageForm(errors, sourceLabel, fieldName, value) {
  if (value === undefined || value === null || value === "") return;

  if (!ALLOWED_IMAGE_FORMS.has(value)) {
    errors.push(
      `${sourceLabel}: ${fieldName} has invalid image form '${value}'`
    );
  }
}

function validateCollectionCoverage(errors, allTokens) {
  const collectionAreaTokens = require("../src/_data/collectionAreaTokens");
  const collectionTokenPages = require("../src/_data/collectionTokenPages");
  const collectionTokenUrls = require("../src/_data/collectionTokenUrls");

  const pagesByTokenKey = new Map();
  const urlOwners = new Map();
  const lookupKeyOwners = new Map();

  for (const page of collectionTokenPages) {
    const token = page.token || {};
    const areaSlug = page.collectionArea?.slug || "unknown";
    const url = urlHelpers.collectionTokenUrl(areaSlug, page.pageId);
    const owner = `${token.id || "missing"} (${token.displayId || "missing"}) in ${areaSlug}`;
    const keys = [token.id, token.displayId].filter(Boolean).map(normalizeKey);

    if (urlOwners.has(url) && urlOwners.get(url) !== owner) {
      errors.push(
        `Collection URL collision '${url}': ${urlOwners.get(url)} and ${owner}`
      );
    } else {
      urlOwners.set(url, owner);
    }

    for (const key of keys) {
      if (!pagesByTokenKey.has(key)) {
        pagesByTokenKey.set(key, []);
      }

      pagesByTokenKey.get(key).push({ url, areaSlug, owner });
    }
  }

  for (const [key, url] of Object.entries(collectionTokenUrls)) {
    const pages = pagesByTokenKey.get(key) || [];
    const matchingPage = pages.find((page) => page.url === url);

    if (!matchingPage) {
      errors.push(
        `Collection lookup key '${key}' maps to '${url}', but no matching collection token page exists`
      );
      continue;
    }

    if (lookupKeyOwners.has(key) && lookupKeyOwners.get(key) !== url) {
      errors.push(
        `Collection lookup key '${key}' maps inconsistently to '${lookupKeyOwners.get(key)}' and '${url}'`
      );
    } else {
      lookupKeyOwners.set(key, url);
    }
  }

  for (const token of allTokens) {
    const idKey = normalizeKey(token.id);
    const displayIdKey = normalizeKey(token.displayId);
    const idUrl = idKey ? collectionTokenUrls[idKey] : "";
    const displayIdUrl = displayIdKey ? collectionTokenUrls[displayIdKey] : "";
    const membershipCount = Object.values(collectionAreaTokens).filter((tokens) =>
      tokens.some((item) => item.id === token.id)
    ).length;

    if (!membershipCount) {
      errors.push(
        `Public token has no Collection area membership: ${describeToken(token)}`
      );
    }

    if (!idUrl && !displayIdUrl) {
      errors.push(
        `Public token has no canonical Collection URL: ${describeToken(token)}`
      );
    }

    if (idUrl && displayIdUrl && idUrl !== displayIdUrl) {
      errors.push(
        `Public token Collection URL mismatch for ${describeToken(token)}: id maps to '${idUrl}', displayId maps to '${displayIdUrl}'`
      );
    }
  }
}

function validateGroups(errors, groups) {
  const seenGroupKeys = new Map();

  groups.forEach((group, index) => {
    const label = `src/_data/groups.json[${index}] (${group.key || "missing"})`;

    if (!group.key) {
      errors.push(`${label}: missing group key`);
    } else if (seenGroupKeys.has(group.key)) {
      errors.push(
        `${label}: duplicate group key '${group.key}' (already used at index ${seenGroupKeys.get(group.key)})`
      );
    } else {
      seenGroupKeys.set(group.key, index);
    }

    if (!group.url || group.url !== urlHelpers.groupUrl(group.key)) {
      errors.push(
        `${label}: group.url must be '${urlHelpers.groupUrl(group.key)}'`
      );
    }

    validateImageReference(errors, label, "cardImage", group.cardImage);
    validateImageReference(errors, label, "heroImage", group.heroImage);
    validateImageForm(errors, label, "cardImageForm", group.cardImageForm);
    validateImageForm(errors, label, "heroImageForm", group.heroImageForm);
  });
}

function validateCollectionAreas(errors) {
  const collectionAreas = require("../src/_data/collectionAreas");

  collectionAreas.forEach((area, index) => {
    const label = `collectionAreas[${index}] (${area.slug || "missing"})`;

    validateImageReference(errors, label, "cardImage", area.cardImage);
    validateImageForm(errors, label, "cardImageForm", area.cardImageForm);
  });
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
  const allTokens = require("../src/_data/allTokens");

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

  validateGroups(errors, groups);

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

  validateCollectionAreas(errors);
  validateCollectionCoverage(errors, allTokens);

  if (errors.length > 0) {
    fail(errors);
  }

  success();
}

main();
