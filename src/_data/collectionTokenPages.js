const collectionAreas = require("./collectionAreas");
const collectionAreaTokens = require("./collectionAreaTokens");

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

module.exports = pages.map((page, index) => {
  return {
    ...page,
    previousToken: index > 0 ? pages[index - 1].token : null,
    nextToken: index < pages.length - 1 ? pages[index + 1].token : null,
    globalPreviousToken: index > 0 ? pages[index - 1].token : null,
    globalNextToken: index < pages.length - 1 ? pages[index + 1].token : null
  };
});
