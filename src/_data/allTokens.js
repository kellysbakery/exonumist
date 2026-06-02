const fs = require("fs");
const path = require("path");

const TOKEN_FILE_ORDER = [
  "manhattan.json",
  "bronx.json",
  "brooklyn.json",
  "queens.json",
  "staten-island.json",
  "specialty.json"
];

function loadJsonArray(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return Array.isArray(data) ? data : [];
}

function loadCollectionAreaTokens() {
  const tokensDir = path.join(__dirname, "tokens");
  const files = fs
    .readdirSync(tokensDir)
    .filter((file) => file.endsWith(".json"))
    .sort((a, b) => {
      const aIndex = TOKEN_FILE_ORDER.indexOf(a);
      const bIndex = TOKEN_FILE_ORDER.indexOf(b);

      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      return a.localeCompare(b);
    });

  return files.flatMap((file) => {
    const fullPath = path.join(tokensDir, file);
    return loadJsonArray(fullPath);
  });
}

module.exports = loadCollectionAreaTokens().filter((token) => token.pub !== false);
