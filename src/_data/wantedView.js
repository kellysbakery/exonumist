const allTokens = require("./allTokens");
const collectionTokenUrls = require("./collectionTokenUrls");
const lookups = require("./lookups.json");
const wantList = require("./wantList.json");

function lookupValue(code, table) {
  if (!code || !table) return "";
  return table[code] || table[String(code).toLowerCase()] || code;
}

function tokenUrl(token = {}) {
  const keys = [token.id, token.displayId];

  for (const key of keys) {
    if (!key) continue;

    const url = collectionTokenUrls[String(key).trim().toLowerCase()];
    if (url) return url;
  }

  return "/";
}

function buildWantedTokenMetaParts(token = {}) {
  const parts = [];

  if (token.mat) {
    parts.push(lookupValue(token.mat, lookups.materials));
  }

  if (token.counterstamp) {
    parts.push(`${token.counterstamp} counterstamp`);
  }

  if (token.type && token.type !== "transit") {
    parts.push(lookupValue(token.type, lookups.type));
  }

  return parts;
}

const wantedTokens = allTokens
  .filter((token) => token.wanted)
  .map((token) => ({
    id: token.displayId,
    title: token.title,
    url: tokenUrl(token),
    badgeLabel: "Wanted",
    metaParts: buildWantedTokenMetaParts(token)
  }));

const otherWantedItems = [...wantList]
  .sort((a, b) => String(a.sort || "").localeCompare(String(b.sort || "")))
  .filter((item) => item.visibility !== "private" && item.status === "wanted")
  .map((item) => ({
    title: item.title
  }));

module.exports = {
  wantedTokens,
  hasWantList: otherWantedItems.length > 0,
  otherWantedItems
};
