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

function formatNumber(value) {
  if (value === null || value === undefined || value === "") return "";

  const num = Number(value);
  if (Number.isNaN(num)) return value;

  return num.toLocaleString("en-US");
}

/**
 * Build the Quick Facts rows shown on detail pages.
 * Canonical schema only.
 */
function buildQuickFacts(token, context = {}) {
  const { isUnlisted = false, lookups = {}, detailSectionTitle = "" } = context;

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
  addRow("Counterstamp", token.counterstamp);
  addRow("Borough", token.borough);
  addRow("Maker", token.maker);
  addRow("Issued", token.issued);
  addRow("Mintage", formatNumber(token.mintage));
  addRow("Usage", token.usage);

  return rows;
}

/**
 * Build compact metadata shown near the page title.
 */
function buildMetaParts(token, context = {}) {
  const { isUnlisted = false, lookups = {}, detailSectionTitle = "" } = context;

  const parts = [];

  if (detailSectionTitle) {
    parts.push(detailSectionTitle);
  } else if (!isUnlisted && token.sec) {
    parts.push(`Section ${token.sec}`);
  }

  if (token.mat) parts.push(lookupValue(token.mat, lookups.materials));
  if (token.size) parts.push(`${token.size} mm`);
  if (token.form) parts.push(lookupValue(token.form, lookups.forms));
  if (token.symbol)
    parts.push(String(lookupValue(token.symbol, lookups.symbols)));

  return parts.filter(Boolean);
}

/**
 * Build badge chips shown near the title.
 */
function buildBadges(token, context = {}) {
  const { lookups = {}, isUnlisted = false, detailSectionTitle = "" } = context;

  const badges = [];

  if (token.status) {
    const status = String(token.status).toLowerCase();
    const section = String(detailSectionTitle).toLowerCase();

    const redundant =
      status === "listed" || status === "official" || status === section;

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
    (item) => String(item.displayId || "").toLowerCase() === currentId
  );

  if (index === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: index > 0 ? items[index - 1] : null,
    next: index < items.length - 1 ? items[index + 1] : null
  };
}

function buildTokenUrl(token) {
  if (!token || !token.displayId) return "/";

  const slug = String(token.displayId).toLowerCase();

  if (token.status === "listed") {
    return `/official/${slug}/`;
  }

  return `/unlisted/${slug}/`;
}

function buildPagerItem(token, options = {}) {
  if (!token) return null;

  const { urlBuilder, pagerGroupKey, hasTokenImage, tokenImagePath } = options;

  const id = token.displayId || "";
  const slug = id.toLowerCase();

  let url = "";

  if (typeof urlBuilder === "function") {
    url = urlBuilder(token);
  } else if (urlBuilder === "group" && pagerGroupKey && slug) {
    url = `/groups/${pagerGroupKey}/${slug}/`;
  } else {
    url = buildTokenUrl(token);
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

    obverseText: token.obv
      ? token.counterstamp
        ? `${token.obv} (${token.counterstamp} Counterstamp)`
        : token.obv
      : "",

    reverseText: token.rev || "",

    notes: token.notes || "",
    wantedNote: token.wantedNote || "",

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
      (section) => section.pub !== false && String(section.sec) === String(sec)
    ) || null
  );
}

function findListedGroupForSection(sections = [], groups = [], sec = "") {
  const section = findSection(sections, sec);
  if (!section || !Array.isArray(groups)) return null;

  return (
    groups.find(
      (group) =>
        group.pub !== false &&
        group.section === "listed" &&
        group.title === section.title &&
        group.url
    ) || null
  );
}

function buildGroupBreadcrumbItems(group, token, siteSections = []) {
  const items = [{ label: "Home", url: "/" }];

  if (group && group.section && Array.isArray(siteSections)) {
    const matchedSiteSection =
      siteSections.find((siteSection) => siteSection.key === group.section) ||
      null;

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

function buildUnlistedSection(token) {
  const groups = Array.isArray(token?.groups) ? token.groups : [];

  if (groups.includes("counterfeit")) {
    return {
      title: "Counterfeit",
      url: "/groups/counterfeit/"
    };
  }

  if (groups.includes("errors")) {
    return {
      title: "Oddities & Errors",
      url: "/groups/errors/"
    };
  }

  return {
    title: "Unlisted",
    url: "/unlisted/"
  };
}

module.exports = {
  findPrevNext,
  findSection,
  findListedGroupForSection,
  buildGroupBreadcrumbItems,
  findGroupTokens,
  buildPagerItem,
  buildTokenDetailView,
  buildUnlistedSection,
  buildTokenUrl
};
