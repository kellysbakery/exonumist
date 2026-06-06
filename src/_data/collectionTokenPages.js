const collectionAreas = require("./collectionAreas");
const collectionAreaTokens = require("./collectionAreaTokens");
const allTokens = require("./allTokens");
const tokenSort = require("./tokenSort");

const pages = collectionAreas.flatMap((collectionArea) => {
  const tokens = collectionAreaTokens[collectionArea.slug] || [];

  return tokens.map((token, index) => ({
    collectionArea,
    token,
    pageId: token.collectionPageId,
    previousToken: index > 0 ? tokens[index - 1] : null,
    nextToken: index < tokens.length - 1 ? tokens[index + 1] : null
  }));
});

const pageUrls = new Map();
const pageTokens = new Map();

for (const page of pages) {
  const token = page.token || {};
  const keys = [token.id, token.displayId];

  for (const key of keys) {
    if (!key) continue;

    const normalized = String(key).trim().toLowerCase();

    if (!pageUrls.has(normalized)) {
      pageUrls.set(normalized, token.collectionUrl || "");
    }

    if (!pageTokens.has(normalized)) {
      pageTokens.set(normalized, token);
    }
  }
}

const globalTokens = allTokens
  .map((token) => {
    const keys = [token.id, token.displayId]
      .filter(Boolean)
      .map((key) => String(key).trim().toLowerCase());
    const collectionUrl = keys.map((key) => pageUrls.get(key)).find(Boolean);
    const pageToken = keys.map((key) => pageTokens.get(key)).find(Boolean);

    if (!collectionUrl) return null;

    return {
      ...(pageToken || token),
      collectionUrl
    };
  })
  .filter(Boolean)
  .sort(tokenSort.compareTokens);

const globalTokenIndexes = new Map();

globalTokens.forEach((token, index) => {
  const keys = [token.id, token.displayId];

  for (const key of keys) {
    if (!key) continue;
    const normalized = String(key).trim().toLowerCase();

    if (!globalTokenIndexes.has(normalized)) {
      globalTokenIndexes.set(normalized, index);
    }
  }
});

module.exports = pages.map((page) => {
  const token = page.token || {};
  const keys = [token.id, token.displayId]
    .filter(Boolean)
    .map((key) => String(key).trim().toLowerCase());
  const index = keys
    .map((key) => globalTokenIndexes.get(key))
    .find((value) => value !== undefined);

  return {
    ...page,
    globalPreviousToken:
      index !== undefined && index > 0 ? globalTokens[index - 1] : null,
    globalNextToken:
      index !== undefined && index < globalTokens.length - 1
        ? globalTokens[index + 1]
        : null
  };
});
