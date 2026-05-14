const allTokens = require("./allTokens");
const collectionTokenUrls = require("./collectionTokenUrls");
const lookups = require("./lookups.json");

const GROUP_BROWSE_TYPES = {
  errors: "error",
  counterfeit: "counterfeit"
};

const TYPE_ORDER = [
  "transit",
  "error",
  "pattern",
  "timetable",
  "counterfeit",
  "fantasy",
  "presentation",
  "club",
  "zonecheck",
  "transportation-related"
];

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
}

function uniqueTypeSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => {
    const aIndex = TYPE_ORDER.indexOf(a);
    const bIndex = TYPE_ORDER.indexOf(b);

    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }

    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;

    return a.localeCompare(b);
  });
}

function buildBrowseTypes(token) {
  const types = new Set();

  if (token.type) {
    types.add(token.type);
  }

  for (const group of token.groups || []) {
    if (GROUP_BROWSE_TYPES[group]) {
      types.add(GROUP_BROWSE_TYPES[group]);
    }
  }

  return [...types];
}

function buildBrowseUrl(token) {
  const keys = [token.id, token.displayId];

  for (const key of keys) {
    if (!key) continue;

    const url = collectionTokenUrls[String(key).trim().toLowerCase()];
    if (url) return url;
  }

  return "/";
}

function buildSearchText(token) {
  const parts = [
    token.displayId || "",
    token.title || "",
    token.borough || "",
    token.type ? lookups.type[token.type] || token.type : "",
    token.mat ? lookups.materials[token.mat] || token.mat : "",
    token.counterstamp || "",
    token.obv || "",
    token.rev || ""
  ];

  return parts.join(" ").toLowerCase();
}

const tokens = allTokens.map((token) => ({
  ...token,
  url: buildBrowseUrl(token),
  browseTypes: buildBrowseTypes(token),
  searchText: buildSearchText(token)
}));

module.exports = {
  tokens,
  filters: {
    boroughs: uniqueSorted(tokens.map((t) => t.borough)),
    types: uniqueTypeSorted(tokens.flatMap((t) => t.browseTypes))
  }
};
