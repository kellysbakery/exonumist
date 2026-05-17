function collectionAreaUrl(areaSlug) {
  return `/collection/${areaSlug}/`;
}

function collectionTokenUrl(areaSlug, pageId) {
  return `/collection/${areaSlug}/${pageId}/`;
}

function groupUrl(groupKey) {
  return `/groups/${groupKey}/`;
}

function groupTokenUrl(groupKey, pageId) {
  return `/groups/${groupKey}/${pageId}/`;
}

module.exports = {
  collectionAreaUrl,
  collectionTokenUrl,
  groupUrl,
  groupTokenUrl
};
