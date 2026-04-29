const tokenDetailView = require("./tokenDetailView");

const allTokens = require("./allTokens");

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
  return tokenDetailView.buildTokenUrl(token);
}

const tokens = allTokens.map((token) => ({
  ...token,
  url: buildBrowseUrl(token),
  browseTypes: buildBrowseTypes(token)
}));

module.exports = {
  tokens,
  filters: {
    boroughs: uniqueSorted(tokens.map((t) => t.borough)),
    types: uniqueTypeSorted(tokens.flatMap((t) => t.browseTypes))
  }
};
