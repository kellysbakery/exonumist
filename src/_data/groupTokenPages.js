const groups = require("./groups.json");
const allTokens = require("./allTokens");

module.exports = groups.flatMap((group) =>
  allTokens
    .filter((token) => Array.isArray(token.groups) && token.groups.includes(group.key))
    .map((token) => ({
      group,
      token,
      pageId: token.displayId
    }))
);
