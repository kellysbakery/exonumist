const allTokens = require("./allTokens");

const GROUP_BROWSE_TYPES = {
  errors: "error",
  counterfeit: "counterfeit"
};

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
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

const tokens = allTokens.map((token) => ({
  ...token,
  browseTypes: buildBrowseTypes(token)
}));

module.exports = {
  tokens,
  filters: {
    boroughs: uniqueSorted(tokens.map((t) => t.borough)),
    types: uniqueSorted(tokens.flatMap((t) => t.browseTypes))
  }
};
