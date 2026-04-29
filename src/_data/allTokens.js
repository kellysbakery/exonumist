const fs = require("fs");
const path = require("path");

const oddities = require("./unofficial/oddities.json");
const unlisted = require("./unofficial/unlisted.json");
const counterfeit = require("./unofficial/counterfeit.json");

function loadJsonArray(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return Array.isArray(data) ? data : [];
}

function loadOfficialTokens() {
  const officialDir = path.join(__dirname, "official");
  const files = fs
    .readdirSync(officialDir)
    .filter((file) => file.endsWith(".json"));

  return files.flatMap((file) => {
    const fullPath = path.join(officialDir, file);
    return loadJsonArray(fullPath);
  });
}

function withSource(tokens, sourceType) {
  return tokens.map((token) => ({
    ...token,
    sourceType
  }));
}

module.exports = [
  ...withSource(loadOfficialTokens(), "official"),
  ...withSource(oddities, "oddities"),
  ...withSource(unlisted, "unlisted"),
  ...withSource(counterfeit, "counterfeit")
].filter((token) => token.pub);
