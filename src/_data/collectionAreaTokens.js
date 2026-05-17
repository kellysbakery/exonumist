const allTokens = require("./allTokens");
const collectionAreas = require("./collectionAreas");
const urlHelpers = require("./urlHelpers");

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function tokenInArea(token, area) {
  if (area.slug === "specialty") {
    return Array.isArray(token.groups) && token.groups.includes(area.groupKey);
  }

  return normalize(token.borough) === normalize(area.title);
}

function buildPageId(token) {
  return String(token.displayId || token.id || "")
    .trim()
    .toLowerCase();
}

module.exports = collectionAreas.reduce((result, area) => {
  result[area.slug] = allTokens
    .filter((token) => tokenInArea(token, area))
    .map((token) => ({
      ...token,
      collectionPageId: buildPageId(token),
      collectionUrl: urlHelpers.collectionTokenUrl(area.slug, buildPageId(token))
    }));

  return result;
}, {});
