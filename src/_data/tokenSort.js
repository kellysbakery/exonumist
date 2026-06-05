const LETTERS = "abcdefghijklmnopqrstuvwxyz";

function normalize(value) {
  return String(value || "").trim();
}

function displayIdKey(token) {
  return normalize(token.displayId || token.id);
}

function effectiveSort(token) {
  const displayId = displayIdKey(token);
  return normalize(token.displaySort || token.sort || displayId);
}

function splitSort(value) {
  return normalize(value)
    .toLowerCase()
    .split(/[-_\s]+/)
    .filter(Boolean);
}

function letterRank(part) {
  // Collector-style order:
  // a, b, c ... z, aa, ab, ac ... az, ba...
  if (!/^[a-z]+$/.test(part)) return null;

  let rank = 0;

  for (let i = 0; i < part.length; i += 1) {
    const index = LETTERS.indexOf(part[i]);
    if (index === -1) return null;
    rank = rank * 26 + index;
  }

  if (part.length === 1) {
    return rank;
  }

  // All two-letter values sort after all one-letter values.
  // aa becomes 26, ab 27, etc.
  return 26 + rank;
}

function comparePart(a, b) {
  if (a === b) return 0;

  const aNumber = /^\d+$/.test(a) ? Number(a) : null;
  const bNumber = /^\d+$/.test(b) ? Number(b) : null;

  if (aNumber !== null && bNumber !== null) {
    return aNumber - bNumber;
  }

  if (aNumber !== null) return -1;
  if (bNumber !== null) return 1;

  const aLetterRank = letterRank(a);
  const bLetterRank = letterRank(b);

  if (aLetterRank !== null && bLetterRank !== null) {
    return aLetterRank - bLetterRank;
  }

  if (aLetterRank !== null) return -1;
  if (bLetterRank !== null) return 1;

  return a.localeCompare(b);
}

function compareSortKeys(aKey, bKey) {
  const aParts = splitSort(aKey);
  const bParts = splitSort(bKey);
  const maxLength = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < maxLength; i += 1) {
    const aPart = aParts[i];
    const bPart = bParts[i];

    if (aPart === undefined) return -1;
    if (bPart === undefined) return 1;

    const result = comparePart(aPart, bPart);
    if (result !== 0) return result;
  }

  return 0;
}

function compareTokens(a, b) {
  const result = compareSortKeys(effectiveSort(a), effectiveSort(b));

  if (result !== 0) {
    return result;
  }

  return displayIdKey(a).localeCompare(displayIdKey(b), undefined, {
    numeric: true,
    sensitivity: "base"
  });
}

module.exports = {
  compareTokens,
  effectiveSort
};
