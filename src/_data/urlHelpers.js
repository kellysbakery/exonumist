function collectionAreaUrl(areaSlug) {
  return `/collection/${areaSlug}/`;
}

function collectionTokenUrl(areaSlug, pageId) {
  return `/collection/${areaSlug}/${pageId}/`;
}

function groupUrl(groupKey) {
  return `/groups/${groupKey}/`;
}

module.exports = {
  collectionAreaUrl,
  collectionTokenUrl,
  groupUrl
};
