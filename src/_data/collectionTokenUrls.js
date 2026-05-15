const collectionTokenPages = require("./collectionTokenPages");
const urlHelpers = require("./urlHelpers");

const urls = {};

for (const page of collectionTokenPages) {
  const token = page.token || {};
  const url = urlHelpers.collectionTokenUrl(page.collectionArea.slug, page.pageId);
  const keys = [token.id, token.displayId];

  for (const key of keys) {
    if (!key) continue;

    const normalized = String(key).trim().toLowerCase();
    if (!urls[normalized]) {
      urls[normalized] = url;
    }
  }
}

module.exports = urls;
