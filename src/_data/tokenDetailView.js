function lookupValue(code, table) {
  if (!code || !table) return "";
  return table[code] || code;
}

function buildImagePath(token, side, options = {}) {
  const {
    detailImageIsOfficial = true,
    detailImageDataset = "official",
    hasOfficialImage,
    officialImagePath,
    hasFallbackImage,
    fallbackImagePath
  } = options;

  if (detailImageIsOfficial) {
    if (hasOfficialImage && hasOfficialImage(token, side)) {
      return officialImagePath(token, side);
    }
    return "";
  }

  if (hasFallbackImage && hasFallbackImage(token, detailImageDataset, side)) {
    return fallbackImagePath(token, detailImageDataset, side);
  }

  return "";
}

function buildQuickFacts(token, context = {}) {
  const {
    isUnlisted = false,
    lookups = {}
  } = context;

  const rows = [];

  if (isUnlisted) {
    if (token.siteId) rows.push({ label: "Site ID", value: token.siteId });
    if (token.relCatalog && token.relCatalog.length) {
      rows.push({ label: "Related A/C", value: token.relCatalog.join(", ") });
    }
  } else {
    if (token.displayId) rows.push({ label: "Catalogue ID", value: token.displayId });
    if (token.sec) rows.push({ label: "Section", value: token.sec });
    if (token.code) rows.push({ label: "Code", value: token.code });
    if (token.var) rows.push({ label: "Minor Variety", value: token.var });
    if (token.val !== undefined && token.val !== null) {
      rows.push({ label: "A/C Value", value: `$${Number(token.val).toFixed(2)}` });
    }
  }

  if (token.status) {
    rows.push({
      label: "Status",
      value: token.status === "listed"
        ? "Listed"
        : lookupValue(token.status, lookups.status)
    });
  }

  if (token.type) {
    rows.push({ label: "Type", value: lookupValue(token.type, lookups.type) });
  }

  if (token.mat) {
    rows.push({ label: "Material", value: lookupValue(token.mat, lookups.materials) });
  }

  if (token.size) {
    rows.push({ label: "Size", value: `${token.size} mm` });
  }

  if (token.form) {
    rows.push({ label: "Form", value: lookupValue(token.form, lookups.forms) });
  }

  if (token.symbol) {
    rows.push({ label: "Symbol", value: lookupValue(token.symbol, lookups.symbols) });
  }

  return rows;
}

function buildMetaParts(token, context = {}) {
  const {
    isUnlisted = false,
    lookups = {}
  } = context;

  const parts = [];

  if (!isUnlisted && token.sec) parts.push(`Section ${token.sec}`);
  if (token.mat) parts.push(lookupValue(token.mat, lookups.materials));
  if (token.size) parts.push(`${token.size} mm`);
  if (token.form) parts.push(lookupValue(token.form, lookups.forms));
  if (token.symbol) parts.push(String(lookupValue(token.symbol, lookups.symbols)).toLowerCase());

  return parts;
}

function buildBadges(token, context = {}) {
  const { lookups = {}, isUnlisted = false } = context;
  const badges = [];

  if (token.status) {
    badges.push(token.status === "listed" ? "Listed" : lookupValue(token.status, lookups.status));
  }

  if (token.type) {
    badges.push(lookupValue(token.type, lookups.type));
  }

  if (!isUnlisted && token.var) {
    badges.push(`Var. ${token.var}`);
  }

  return badges.filter(Boolean);
}

function buildBreadcrumbItems(context = {}) {
  const {
    detailSectionTitle = "Tokens",
    detailSectionUrl = "/",
    tokenId = ""
  } = context;

  return [
    { label: "Home", url: "/" },
    { label: detailSectionTitle, url: detailSectionUrl },
    { label: tokenId, url: "" }
  ];
}

function buildPagerItem(token, options = {}) {
  if (!token) return null;

  const {
    urlBuilder,
    hasOfficialImage,
    officialImagePath
  } = options;

  const id = token.displayId || token.siteId || "";

  return {
    id,
    title: token.title || "",
    url: urlBuilder
      ? urlBuilder(token)
      : (token.displayId ? `/official/${token.displayId.toLowerCase()}/` : ""),
    image: hasOfficialImage && hasOfficialImage(token, "o")
      ? officialImagePath(token, "o")
      : ""
  };
}

function buildTokenDetailView(token, context = {}) {
  const {
    tokenId = "",
    detailSectionTitle = "Tokens",
    detailSectionUrl = "/",
    tokenTitle = "",
    prevToken = null,
    nextToken = null,
    detailImageIsOfficial = true,
    detailImageDataset = "official",
    detailShowPager = false
  } = context;

  const helperFns = context.helperFns || {};

  return {
    tokenId,
    tokenTitle,
    breadcrumbItems: buildBreadcrumbItems({
      detailSectionTitle,
      detailSectionUrl,
      tokenId
    }),
    metaParts: buildMetaParts(token, context),
    badges: buildBadges(token, context),
    quickFacts: buildQuickFacts(token, context),
    obverseImage: buildImagePath(token, "o", {
      detailImageIsOfficial,
      detailImageDataset,
      ...helperFns
    }),
    reverseImage: buildImagePath(token, "r", {
      detailImageIsOfficial,
      detailImageDataset,
      ...helperFns
    }),
    notes: token.notes || "",
    market: token.market || "",
    pager: detailShowPager
      ? {
          prev: buildPagerItem(prevToken, helperFns),
          next: buildPagerItem(nextToken, helperFns)
        }
      : null
  };
}

module.exports = {
  buildTokenDetailView
};
