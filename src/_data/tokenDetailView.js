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

function formatTokenType(token, lookups = {}) {
  const value = lookupValue(token.type, lookups.type);
  return value ? String(value).toLowerCase() : "collection";
}

function buildDisplayDescription(token, context = {}) {
  const { lookups = {} } = context;
  const rawDescription = String(token.desc || "").trim();

  if (
    rawDescription &&
    !/^(listed|unlisted)\b/i.test(rawDescription)
  ) {
    return rawDescription;
  }

  const area = token.borough || "Collection";
  const type = formatTokenType(token, lookups);
  const title = String(token.title || "").replace(/\.$/, "");

  if (token.catalogStatus === "unlisted" || token.status === "unlisted") {
    return title
      ? `Documented variety in this collection: ${title}.`
      : `${area} ${type} from this collection.`;
  }

  return title
    ? `${area} ${type} associated with ${title}.`
    : `${area} ${type} from this collection.`;
}

function normalizeCatalogCrossReferences(token = {}) {
  const seen = new Set();

  const normalizeEntry = (entry) => {
    if (!entry) return null;

    if (typeof entry === "string") {
      const id = entry.trim();
      return id ? { catalog: "Atwood-Coffee", id } : null;
    }

    const id = String(entry.id || entry.number || entry.value || "").trim();
    if (!id) return null;

    const catalog = String(entry.catalog || entry.name || "Catalog").trim();

    return {
      catalog: catalog || "Catalog",
      id
    };
  };

  const addEntry = (refs, entry) => {
    const normalized = normalizeEntry(entry);
    if (!normalized) return;

    const key = `${normalized.catalog.toLowerCase()}::${normalized.id.toLowerCase()}`;
    if (seen.has(key)) return;

    seen.add(key);
    refs.push(normalized);
  };

  const refs = [];

  if (Array.isArray(token.catalogRefs) && token.catalogRefs.length) {
    token.catalogRefs.forEach((entry) => addEntry(refs, entry));
    return refs;
  }

  if (Array.isArray(token.catalogCrossReferences)) {
    token.catalogCrossReferences.forEach((entry) => addEntry(refs, entry));
  }

  if (refs.length) {
    return refs;
  }

  if (isCatalogStyleDisplayId(token.displayId)) {
    addEntry(refs, { catalog: "Atwood-Coffee", id: token.displayId });
  }

  return refs;
}

function isCatalogStyleDisplayId(value) {
  const id = String(value || "").trim();
  if (!id) return false;

  if (/^(odd|unl|cf)-/i.test(id)) return false;

  return /^(NY\d|PP-|CT-|FF-|TR-)/i.test(id);
}

function formatCatalogCrossReferences(token) {
  return formatCatalogCrossReferenceLines(token).join("\n");
}

function formatCatalogCrossReferenceLines(token) {
  return normalizeCatalogCrossReferences(token).map(
    (ref) => `${ref.catalog}: ${ref.id}`
  );
}

/**
 * Build the Quick Facts rows shown on detail pages.
 * Canonical schema only.
 */
function buildQuickFacts(token, context = {}) {
  const { isUnlisted = false, lookups = {} } = context;

  const rows = [];

  const addRow = (label, value, extra = {}) => {
    if (hasMeaningfulValue(value)) {
      rows.push({ label, value, ...extra });
    }
  };

  if (token.collectionId) {
    addRow("Collection ID", token.collectionId);
  }

  if (!token.collectionId && isUnlisted) {
    addRow("Collection ID", token.displayId);
  }

  const catalogCrossReferenceLines = formatCatalogCrossReferenceLines(token);
  addRow(
    "Cat. X-Ref.",
    catalogCrossReferenceLines[0] || "",
    catalogCrossReferenceLines.length > 1
      ? { valueLines: catalogCrossReferenceLines }
      : {}
  );

  if (
    token.classification &&
    String(token.classification).trim().toLowerCase() !== "regular"
  ) {
    addRow("Classification", lookupValue(token.classification, lookups.classification));
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
 * Build compact metadata shown on token listing cards.
 */
function buildCardMetaParts(token, context = {}) {
  const { lookups = {} } = context;
  const parts = [];

  if (token.mat) parts.push(lookupValue(token.mat, lookups.materials));
  if (token.size) parts.push(`${token.size} mm`);
  if (token.form) parts.push(lookupValue(token.form, lookups.forms));
  if (token.symbol) parts.push(lookupValue(token.symbol, lookups.symbols));

  return parts.filter(Boolean);
}

function buildCollectionCardSearchText(token, context = {}) {
  const { lookups = {} } = context;
  const catalogCrossReferences = normalizeCatalogCrossReferences(token);
  const displayDescription = buildDisplayDescription(token, { lookups });

  const parts = [
    token.collectionId || "",
    token.displayId || "",
    Array.isArray(token.rel) ? token.rel.join(" ") : "",
    catalogCrossReferences
      .flatMap((ref) => [ref.catalog, ref.id])
      .join(" "),
    token.title || "",
    displayDescription,
    token.desc || "",
    token.obv || "",
    token.rev || "",
    token.notes || "",
    token.catalogStatus || token.status || "",
    token.classification || "",
    token.type || "",
    token.borough || "",
    lookupValue(token.mat, lookups.materials),
    lookupValue(token.form, lookups.forms),
    lookupValue(token.symbol, lookups.symbols)
  ];

  return parts.filter(Boolean).join(" ");
}

/**
 * Build badge chips shown near the title.
 */
function buildBadges(token, context = {}) {
  const { isUnlisted = false } = context;

  const badges = [];

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

function buildPagerItem(token, options = {}) {
  if (!token) return null;

  const { urlBuilder, hasTokenImage, tokenImagePath } = options;

  const id = token.displayId || "";
  const slug = id.toLowerCase();

  let url = "";

  if (token.collectionUrl) {
    url = token.collectionUrl;
  } else if (typeof urlBuilder === "function") {
    url = urlBuilder(token);
  } else {
    url = "/";
  }

  return {
    token,
    id,
    title: token.title || "",
    url,
    image:
      hasTokenImage && hasTokenImage(token, "o")
        ? tokenImagePath(token, "o")
        : ""
  };
}

function buildPagerItemWithUrl(token, url, options = {}) {
  const item = buildPagerItem(token, options);
  if (!item) return null;

  if (url) {
    item.url = url;
  }

  return item;
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
    globalPrevToken = null,
    globalNextToken = null,
    groupPagerContexts = [],
    detailShowPager = false,
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
    summaryDescription: buildDisplayDescription(token, { lookups }),
    catalogCrossReferences: normalizeCatalogCrossReferences(token),

    pager: detailShowPager
      ? {
          prev: buildPagerItem(prevToken, {
            hasTokenImage: helperFns.hasTokenImage,
            tokenImagePath: helperFns.tokenImagePath
          }),
          next: buildPagerItem(nextToken, {
            hasTokenImage: helperFns.hasTokenImage,
            tokenImagePath: helperFns.tokenImagePath
          })
        }
      : null,

    browsePager: detailShowPager
      ? {
          prev: buildPagerItem(globalPrevToken, {
            hasTokenImage: helperFns.hasTokenImage,
            tokenImagePath: helperFns.tokenImagePath
          }),
          next: buildPagerItem(globalNextToken, {
            hasTokenImage: helperFns.hasTokenImage,
            tokenImagePath: helperFns.tokenImagePath
          })
        }
      : null,

    groupPagers: detailShowPager
      ? groupPagerContexts
          .filter((groupPager) => groupPager && groupPager.key)
          .map((groupPager) => ({
            key: groupPager.key,
            title: groupPager.title || groupPager.key,
            url: groupPager.url || "",
            prev: buildPagerItemWithUrl(
              groupPager.prevToken,
              groupPager.prevUrl,
              {
                hasTokenImage: helperFns.hasTokenImage,
                tokenImagePath: helperFns.tokenImagePath
              }
            ),
            next: buildPagerItemWithUrl(
              groupPager.nextToken,
              groupPager.nextUrl,
              {
                hasTokenImage: helperFns.hasTokenImage,
                tokenImagePath: helperFns.tokenImagePath
              }
            )
          }))
      : []
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

module.exports = {
  findPrevNext,
  findSection,
  buildPagerItem,
  buildCardMetaParts,
  buildCollectionCardSearchText,
  buildDisplayDescription,
  formatCatalogCrossReferences,
  normalizeCatalogCrossReferences,
  buildTokenDetailView
};
