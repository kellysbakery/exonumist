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

/**
 * Resolve image path for a token side.
 */
function buildImagePath(token, side, options = {}) {
  const { hasTokenImage, tokenImagePath } = options;

  if (hasTokenImage && hasTokenImage(token, side)) {
    return tokenImagePath(token, side);
  }

  return "";
}

/**
 * Build the Quick Facts rows shown on detail pages.
 * Canonical schema only.
 */
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
    addRow("ID", token.displayId);

    if (Array.isArray(token.rel) && token.rel.length) {
      addRow("Related A/C", token.rel.join(", "));
    }
  } else {
    addRow("Catalogue ID", token.displayId);
    addRow("Minor Variety", token.var);

    const price = formatPrice(token.val);
    if (price) {
      addRow("A/C Value", price);
    }
  }

  const status = String(token.status || "").toLowerCase();
  const section = String(detailSectionTitle || "").toLowerCase();

  const statusIsRedundant =
    !status ||
    status === "listed" ||
    status === "official" ||
    status === section;

  if (!statusIsRedundant) {
    addRow("Status", token.status);
  }

  addRow("Material", lookupValue(token.mat, lookups.materials));
  addRow("Size", hasMeaningfulValue(token.size) ? `${token.size} mm` : "");
  addRow("Shape", lookupValue(token.form, lookups.forms));
  addRow("Symbol", lookupValue(token.symbol, lookups.symbols));
  addRow("Borough", token.borough);

  return rows;
}

/**
 * Build compact metadata shown near the page title.
 */
function buildMetaParts(token, context = {}) {
  const {
    isUnlisted = false,
    lookups = {},
    detailSectionTitle = ""
  } = context;

  const parts = [];

  if (detailSectionTitle) {
    parts.push(detailSectionTitle);
  } else if (!isUnlisted && token.sec) {
    parts.push(`Section ${token.sec}`);
  }

  if (token.mat) parts.push(lookupValue(token.mat, lookups.materials));
  if (token.size) parts.push(`${token.size} mm`);
  if (token.form) parts.push(lookupValue(token.form, lookups.forms));
  if (token.symbol) parts.push(String(lookupValue(token.symbol, lookups.symbols)));

  return parts.filter(Boolean);
}

/**
 * Build badge chips shown near the title.
 */
function buildBadges(token, context = {}) {
  const {
    lookups = {},
    isUnlisted = false,
    detailSectionTitle = ""
  } = context;

  const badges = [];

  if (token.status) {
    const status = String(token.status).toLowerCase();
    const section = String(detailSectionTitle).toLowerCase();

    const redundant =
      status === "listed" ||
      status === "official" ||
      status === section;

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
    breadcrumbItems = null,
    detailSectionTitle = "Tokens",
    detailSectionUrl = "/",
    tokenId = ""
  } = context;

  if (Array.isArray(breadcrumbItems) && breadcrumbItems.length) {
    return breadcrumbItems;
  }

  return [
    { label: "Home", url: "/" },
    { label: detailSectionTitle, url: detailSectionUrl },
    { label: tokenId, url: "" }
  ];
}

function findPrevNext(items = [], currentToken) {
  if (!Array.isArray(items) || !currentToken) {
    return { prev: null, next: null };
  }

  const currentId = String(currentToken.displayId || "").toLowerCase();

  const index = items.findIndex(
    (item) =>
      String(item.displayId || "").toLowerCase() === currentId
  );

  if (index === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: index > 0 ? items[index - 1] : null,
    next: index < items.length - 1 ? items[index + 1] : null
  };
}

function buildPagerItem(token, options = {}) {
  if (!token) return null;

const {
  urlBuilder,
  pagerGroupKey,
  hasTokenImage,
  tokenImagePath
} = options;

  const id = token.displayId || "";
  const slug = id.toLowerCase();

  let url = "";

  if (typeof urlBuilder === "function") {
    url = urlBuilder(token);
  } else if (urlBuilder === "group" && pagerGroupKey && slug) {
    url = `/groups/${pagerGroupKey}/${slug}/`;
  } else if (token.status === "listed") {
    url = `/official/${slug}/`;
  } else {
    url = `/unlisted/${slug}/`;
  }

  return {
    id,
    title: token.title || "",
    url,
    image:
      hasTokenImage && hasTokenImage(token, "o")
        ? tokenImagePath(token, "o")
        : ""
  };
}

/**
 * Main page view model for token detail templates.
 */
function buildTokenDetailView(token, context = {}) {
  const {
    tokenId = "",
    tokenTitle = "",
    detailSectionTitle = "Tokens",
    detailSectionUrl = "/",
    breadcrumbItems = null,
    prevToken = null,
    nextToken = null,
    detailShowPager = false,
    pagerUrlBuilder = null,
    pagerGroupKey = "",
    isUnlisted = false,
    lookups = {}
  } = context;

  const helperFns = context.helperFns || {};

  return {
    token,
    tokenId,
    tokenTitle,
    detailSectionTitle,
    detailSectionUrl,
    detailShowPager,
    isUnlisted,

    breadcrumbItems: buildBreadcrumbItems({
      breadcrumbItems,
      detailSectionTitle,
      detailSectionUrl,
      tokenId
    }),

    metaParts: buildMetaParts(token, {
      isUnlisted,
      lookups,
      detailSectionTitle
    }),

    badges: buildBadges(token, {
      lookups,
      isUnlisted,
      detailSectionTitle
    }),

    quickFacts: buildQuickFacts(token, {
      isUnlisted,
      lookups,
      detailSectionTitle
    }),

    obverseText: token.obv || "",
    reverseText: token.rev || "",

    obverseImage: buildImagePath(token, "o", helperFns),

    reverseImage: buildImagePath(token, "r", helperFns),

    notes: token.notes || "",

    pager: detailShowPager
    ? {
        prev: buildPagerItem(prevToken, {
          urlBuilder: pagerUrlBuilder,
          pagerGroupKey,
          hasTokenImage: helperFns.hasTokenImage,
          tokenImagePath: helperFns.tokenImagePath
        }),
        next: buildPagerItem(nextToken, {
          urlBuilder: pagerUrlBuilder,
          pagerGroupKey,
          hasTokenImage: helperFns.hasTokenImage,
          tokenImagePath: helperFns.tokenImagePath
        })
      }
    : null
  };
}

function findSection(sections = [], sec = "") {
  if (!Array.isArray(sections) || !sec) return null;

  return (
    sections.find(
      (section) =>
        section.pub &&
        String(section.sec) === String(sec)
    ) || null
  );
}

function buildGroupBreadcrumbItems(group, token, siteSections = []) {
  const items = [{ label: "Home", url: "/" }];

  if (group && group.section && Array.isArray(siteSections)) {
    const matchedSiteSection =
      siteSections.find(
        (siteSection) => siteSection.key === group.section
      ) || null;

    if (matchedSiteSection) {
      items.push({
        label: matchedSiteSection.title,
        url: `/${matchedSiteSection.key}/`
      });
    }
  }

  if (group) {
    items.push({
      label: group.title || "",
      url: `/groups/${group.key}/`
    });
  }

  items.push({
    label: token?.displayId || "",
    url: ""
  });

  return items;
}

function findGroupTokens(groupTokenPages = [], groupKey = "") {
  if (!Array.isArray(groupTokenPages) || !groupKey) {
    return [];
  }

  return groupTokenPages
    .filter((item) => item.group && item.group.key === groupKey)
    .map((item) => item.token);
}

module.exports = {
  findPrevNext,
  findSection,
  buildGroupBreadcrumbItems,
  findGroupTokens,
  buildPagerItem,
  buildTokenDetailView
};
