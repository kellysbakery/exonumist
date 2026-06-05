const allTokens = require("./allTokens");
const collectionTokenUrls = require("./collectionTokenUrls");
const lookups = require("./lookups.json");
const tokenDetailView = require("./tokenDetailView");
const tokenSort = require("./tokenSort");

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
}

function uniqueTypeSorted(values) {
  const typeOrder = Array.isArray(lookups.typeOrder) ? lookups.typeOrder : [];

  return [...new Set(values.filter(Boolean))].sort((a, b) => {
    const aIndex = typeOrder.indexOf(a);
    const bIndex = typeOrder.indexOf(b);

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

  if (token.classification === "error" || token.classification === "oddity") {
    types.add("error");
  }

  if (token.classification === "counterfeit") {
    types.add("counterfeit");
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
  const displayDescription = tokenDetailView.buildDisplayDescription(token, {
    lookups
  });
  const catalogCrossReferences = tokenDetailView.normalizeCatalogCrossReferences(
    token
  );

  const parts = [
    token.collectionId || "",
    token.displayId || "",
    Array.isArray(token.rel) ? token.rel.join(" ") : "",
    catalogCrossReferences
      .flatMap((ref) => [ref.catalog, ref.id])
      .join(" "),
    token.title || "",
    token.borough || "",
    displayDescription,
    token.desc || "",
    token.notes || "",
    token.classification
      ? lookups.classification[token.classification] || token.classification
      : "",
    token.type ? lookups.type[token.type] || token.type : "",
    token.mat ? lookups.materials[token.mat] || token.mat : "",
    token.counterstamp || "",
    token.obv || "",
    token.rev || ""
  ];

  return parts.join(" ").toLowerCase();
}

const tokens = allTokens
  .map((token) => ({
    ...token,
    url: buildBrowseUrl(token),
    browseTypes: buildBrowseTypes(token),
    displayDescription: tokenDetailView.buildDisplayDescription(token, { lookups }),
    catalogCrossReferences: tokenDetailView.normalizeCatalogCrossReferences(token),
    searchText: buildSearchText(token)
  }))
  .sort(tokenSort.compareTokens);

module.exports = {
  tokens,
  filters: {
    boroughs: uniqueSorted(tokens.map((t) => t.borough)),
    types: uniqueTypeSorted(tokens.flatMap((t) => t.browseTypes))
  }
};
