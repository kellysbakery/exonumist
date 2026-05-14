const collectionAreas = require("./collectionAreas");
const collectionAreaTokens = require("./collectionAreaTokens");

module.exports = collectionAreas.flatMap((collectionArea) => {
  const tokens = collectionAreaTokens[collectionArea.slug] || [];

  return tokens.map((token, index) => ({
    collectionArea,
    token,
    pageId: token.collectionPageId,
    previousToken: index > 0 ? tokens[index - 1] : null,
    nextToken: index < tokens.length - 1 ? tokens[index + 1] : null
  }));
});
