function lookupValue(code, table) {
  if (!code || !table) return "";
  return table[code] || table[String(code).toLowerCase()] || code;
}

function hasMeaningfulValue(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === "number") return value !== 0;
  const trimmed = String(value).trim();
  return trimmed !== "" && trimmed !== "0" && trimmed !== "$0";
}

function formatPrice(value) {
  if (!hasMeaningfulValue(value)) return "";
  const num = Number(value);
  if (!Number.isNaN(num)) {
    return `$${num.toFixed(2)}`;
  }
  const trimmed = String(value).trim();
  return trimmed.startsWith("$") ? trimmed : `$${trimmed}`;
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
    lookups = {},
    detailSectionTitle = ""
  } = context;

  const rows = [];

  const addRow = (label, value) => {
    if (hasMeaningfulValue(value)) {
      rows.push({ label, value });
    }
  };

  if (isUnlisted) {
    addRow("Site ID", token.siteId);
    if (token.relCatalog && token.relCatalog.length) {
      addRow("Related A/C", token.relCatalog.join(", "));
    }
  } else {
    addRow("Catalogue ID", token.displayId);
    addRow("Minor Variety", token.var);

    const price = formatPrice(token.val ?? token.value ?? token.price);
    if (price) {
      addRow("A/C Value", price);
    }
  }

  const statusIsRedundant =
    !token.status ||
    String(token.status).toLowerCase() === "listed" ||
    String(token.status).toLowerCase() === "official" ||
    String(token.status).toLowerCase() === String(detailSectionTitle).toLowerCase();

  if (!statusIsRedundant) {
    addRow("Status", token.status);
  }

  addRow("Material", lookupValue(token.mat || token.metal, lookups.materials || lookups.metal));
  addRow("Size", hasMeaningfulValue(token.size) ? `${token.size} mm` : "");
  addRow("Form", lookupValue(token.form, lookups.forms || lookups.form));
  addRow("Symbol", lookupValue(token.symbol, lookups.symbols || lookups.shape));

  addRow("Issuer", token.issuer);
  addRow("City", token.city);
  addRow("Line", token.line);
  addRow("Denomination", token.denomination);
  addRow("Fare", token.fare);
  addRow("Color", lookupValue(token.color, lookups.colors || lookups.color));
  addRow("Diameter", hasMeaningfulValue(token.diameter) ? `${token.diameter} mm` : "");
  addRow("Edge", lookupValue(token.edge, lookups.edges || lookups.edge));
  addRow("Punch", token.punch);
  addRow("Reference", token.reference);
  addRow("Catalog", token.catalog);

  return rows;
}

function buildMetaParts(token, context = {}) {
  const {
    isUnlisted = false,
    lookups = {}
  } = context;

  const parts = [];

  if (!isUnlisted && token.sec) parts.push(`Section ${token.sec}`);
  if (token.mat) parts.push(lookupValue(token.mat, lookups.materials || lookups.metal));
  if (token.size) parts.push(`${token.size} mm`);
  if (token.form) parts.push(lookupValue(token.form, lookups.forms || lookups.form));
  if (token.symbol) {
    parts.push(String(lookupValue(token.symbol, lookups.symbols || lookups.shape)).toLowerCase());
  }

  return parts.filter(Boolean);
}

function buildBadges(token, context = {}) {
  const { lookups = {}, isUnlisted = false, detailSectionTitle = "" } = context;
  const badges = [];

  if (token.status) {
    const status = String(token.status);
    const redundant =
      status.toLowerCase() === "listed" ||
      status.toLowerCase() === "official" ||
      status.toLowerCase() === String(detailSectionTitle).toLowerCase();

    if (!redundant) {
      badges.push(lookupValue(token.status, lookups.status) || token.status);
    }
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
    pagerGroupKey,
    hasOfficialImage,
    officialImagePath
  } = options;

  const id = token.displayId || token.siteId || "";
  const slug = (token.displayId || token.siteId || "").toLowerCase();

  let url = "";
  if (typeof urlBuilder === "function") {
    url = urlBuilder(token);
  } else if (urlBuilder === "group" && pagerGroupKey && slug) {
    url = `/groups/${pagerGroupKey}/${slug}/`;
  } else if (token.displayId) {
    url = `/official/${token.displayId.toLowerCase()}/`;
  } else if (token.siteId) {
    url = `/unlisted/${token.siteId.toLowerCase()}/`;
  }

  return {
    id,
    title: token.title || token.displayTitle || "",
    url,
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
    detailShowPager = false,
    pagerUrlBuilder = null,
    pagerGroupKey = "",
    isUnlisted = false,
    lookups = {}
  } = context;

  const helperFns = context.helperFns || {};
  const obverseText = token.obv || token.obverse || "";
  const reverseText = token.rev || token.reverse || "";

  return {
    token,
    tokenId,
    tokenTitle,
    detailSectionTitle,
    detailSectionUrl,
    detailImageDataset,
    detailImageIsOfficial,
    detailShowPager,
    isUnlisted,
    breadcrumbItems: buildBreadcrumbItems({
      detailSectionTitle,
      detailSectionUrl,
      tokenId
    }),
    metaParts: buildMetaParts(token, { isUnlisted, lookups }),
    badges: buildBadges(token, { lookups, isUnlisted, detailSectionTitle }),
    quickFacts: buildQuickFacts(token, { isUnlisted, lookups, detailSectionTitle }),
    obverseText,
    reverseText,
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
          prev: buildPagerItem(prevToken, {
            urlBuilder: pagerUrlBuilder,
            pagerGroupKey,
            hasOfficialImage: helperFns.hasOfficialImage,
            officialImagePath: helperFns.officialImagePath
          }),
          next: buildPagerItem(nextToken, {
            urlBuilder: pagerUrlBuilder,
            pagerGroupKey,
            hasOfficialImage: helperFns.hasOfficialImage,
            officialImagePath: helperFns.officialImagePath
          })
        }
      : null
  };
}

module.exports = {
  buildPagerItem,
  buildTokenDetailView
};
