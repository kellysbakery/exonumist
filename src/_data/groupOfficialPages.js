const fs = require("fs");
const path = require("path");

const groups = require("./groups.json");
const oddities = require("./oddities.json");
const unlisted = require("./unlisted.json");
const counterfeit = require("./counterfeit.json");

function loadOfficialTokens() {
  const officialDir = path.join(__dirname, "official");
  const files = fs.readdirSync(officialDir).filter((file) => file.endsWith(".json"));

  const tokens = [];

  for (const file of files) {
    const fullPath = path.join(officialDir, file);
    const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));

    if (Array.isArray(data)) {
      tokens.push(...data);
    }
  }

  return tokens;
}

const officialAll = loadOfficialTokens();

function buildGroupTokens(group) {
  const tokens = [];

  for (const token of officialAll) {
    if (token.pub && token.groups && token.groups.includes(group.key)) {
      tokens.push({
        group,
        token,
        dataset: "official",
        pageId: token.displayId
      });
    }
  }

  for (const token of oddities) {
    if (token.pub && token.groups && token.groups.includes(group.key)) {
      tokens.push({
        group,
        token,
        dataset: "oddities",
        pageId: token.siteId
      });
    }
  }

  for (const token of unlisted) {
    if (token.pub && token.groups && token.groups.includes(group.key)) {
      tokens.push({
        group,
        token,
        dataset: "unlisted",
        pageId: token.siteId
      });
    }
  }

  for (const token of counterfeit) {
    if (token.pub && token.groups && token.groups.includes(group.key)) {
      tokens.push({
        group,
        token,
        dataset: "counterfeit",
        pageId: token.siteId
      });
    }
  }

  return tokens;
}

module.exports = groups.flatMap((group) => buildGroupTokens(group));
