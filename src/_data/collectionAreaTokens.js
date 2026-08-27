const allTokens = require("./allTokens");
const collectionAreas = require("./collectionAreas");
const tokenDetailView = require("./tokenDetailView");
const urlHelpers = require("./urlHelpers");
const tokenSort = require("./tokenSort");

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function tokenInArea(token, area) {
  if (token.collectionArea) {
    return normalize(token.collectionArea) === normalize(area.slug);
  }

  if (area.slug === "specialty") {
    return Array.isArray(token.groups) && token.groups.includes(area.groupKey);
  }

  return normalize(token.borough) === normalize(area.title);
}

function buildPageId(token) {
  return tokenDetailView.publicCollectionId(token)
    .trim()
    .toLowerCase();
}

module.exports = collectionAreas.reduce((result, area) => {
  result[area.slug] = allTokens
    .filter((token) => tokenInArea(token, area))
    .sort(tokenSort.compareTokens)
    .map((token) => ({
      ...token,
      collectionPageId: buildPageId(token),
      collectionUrl: urlHelpers.collectionTokenUrl(area.slug, buildPageId(token))
    }));

  return result;
}, {});
