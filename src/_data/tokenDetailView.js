const fs = require("fs");
const path = require("path");

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

function formatMaterialDisplay(token, lookups = {}) {
  const material = lookupValue(token.mat, lookups.materials);
  if (!material) return "";

  const finish = String(token.finish || "").trim();
  return finish ? `${material} (${finish})` : material;
}

function sentenceStyle(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return "";

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatVariantLineMaterial(token, lookups = {}) {
  const material = sentenceStyle(lookupValue(token.mat, lookups.materials));
  if (!material) return "";

  const finish = String(token.finish || "").trim();
  return finish ? `${material}, ${finish}` : material;
}

function lowercaseFirst(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  return text.charAt(0).toLowerCase() + text.slice(1);
}

function formatCounterstampTrait(value) {
  const counterstamp = String(value || "").trim();
  if (!counterstamp) return "";

  return `${lowercaseFirst(counterstamp)} counterstamp`;
}

function normalizeInscriptionCaption(value) {
  return String(value || "")
    .replace(/\//g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildVariantLine(token, context = {}) {
  const { lookups = {} } = context;
  const parts = [];

  if (token.mat) parts.push(formatVariantLineMaterial(token, lookups));
  if (token.variantTrait) {
    parts.push(String(token.variantTrait).trim().toLowerCase());
  } else if (token.counterstamp) {
    parts.push(formatCounterstampTrait(token.counterstamp));
  }
  if (hasMeaningfulValue(token.size)) parts.push(`${token.size} mm`);
  if (token.form) {
    const shape = String(lookupValue(token.form, lookups.forms)).trim();
    if (shape && shape.toLowerCase() !== "round") {
      parts.push(shape.toLowerCase());
    }
  }

  return parts.filter(Boolean).join(" · ");
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
  const title = publicCollectionTitle(token, context).replace(/\.$/, "");

  if (token.catalogStatus === "unlisted" || token.status === "unlisted") {
    return title
      ? `Documented variety in this collection: ${title}.`
      : `${area} ${type} from this collection.`;
  }

  return title
    ? `${area} ${type} associated with ${title}.`
    : `${area} ${type} from this collection.`;
}

/** Keep identifying facts intact; omit optional dates rather than cutting text. */
function buildMetaDescription(token = {}, { lookups = {} } = {}) {
  const title = publicCollectionTitle(token).trim();
  const catalogId = formatCatalogCrossReferenceLines(token)[0] || publicCollectionId(token);
  const identity = [title, catalogId ? `(${catalogId})` : ""].filter(Boolean).join(" ");
  const category = [token.borough, formatTokenType(token, lookups), "token"].filter(Boolean).join(" ");
  const variant = buildVariantLine(token, { lookups });
  let description = `${identity}. ${category}.${variant ? ` ${variant}.` : ""}`;
  const reverse = normalizeInscriptionCaption(token.rev);
  const optional = [
    hasMeaningfulValue(token.issued) ? `Issued ${token.issued}.` : "",
    /\b(fare|zone|ride|transfer)\b/i.test(reverse) &&
      !normalizeComparisonText(title).includes(normalizeComparisonText(reverse))
      ? `Reverse: ${reverse}${/[.!?]$/.test(reverse) ? "" : "."}` : ""
  ];

  for (const fact of optional) {
    if (fact && description.length + fact.length + 1 <= 160) description += ` ${fact}`;
  }

  // Short records can still offer useful shape/cutout identification, without padding.
  for (const [label, value] of [
    ["Shape", lookupValue(token.form, lookups.forms)],
    ["Symbol", lookupValue(token.symbol, lookups.symbols)]
  ]) {
    const fact = value ? `${label}: ${value}.` : "";
    if (description.length < 120 && fact && description.length + fact.length + 1 <= 160) {
      description += ` ${fact}`;
    }
  }

  return description;
}

function referenceText(value) {
  return typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";
}

function normalizeComparisonText(value) {
  return referenceText(value).toLowerCase().replace(/\s+/g, " ").trim();
}

function buildUsage(token = {}) {
  const usage = referenceText(token.usage);
  const comparable = normalizeComparisonText(usage).replace(/[.!?]+$/, "");
  if (!comparable) return "";

  // Suppress only a complete matching phrase, not a speculative semantic match.
  const visible = [token.notes, token.desc].map(normalizeComparisonText);
  const alreadyVisible = visible.some((text) => {
    const index = text.indexOf(comparable);
    return index !== -1 &&
      (index === 0 || !/[\p{L}\p{N}]/u.test(text[index - 1])) &&
      (index + comparable.length === text.length ||
        !/[\p{L}\p{N}]/u.test(text[index + comparable.length]));
  });

  return alreadyVisible ? "" : usage;
}

function safeSourceUrl(value) {
  const url = referenceText(value);
  if (!url || /[\s\u0000-\u001f\u007f\\]/.test(url)) return "";

  try {
    const parsed = new URL(url, "https://exonumist.com");
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) {
      return "";
    }
    if (/^https?:\/\//i.test(url)) return url;
    if (!url.startsWith("/") || url.startsWith("//")) return "";

    // Do not turn missing local bibliography assets into broken links.
    const sourceRoot = path.resolve(__dirname, "..");
    const file = path.resolve(sourceRoot, `.${decodeURIComponent(parsed.pathname)}`);
    return file.startsWith(sourceRoot + path.sep) &&
      fs.existsSync(file) && fs.statSync(file).isFile() ? url : "";
  } catch {
    return "";
  }
}

function buildReferences(token = {}) {
  if (!Array.isArray(token.sources)) return [];

  return token.sources.flatMap((source) => {
    if (typeof source === "string") {
      const citation = source.trim();
      return citation ? [{ citation, note: "", url: "" }] : [];
    }
    if (!source || typeof source !== "object") return [];

    const title = referenceText(source.title);
    const issue = referenceText(source.issue);
    const page = referenceText(source.page);
    const citation = [title, issue, page ? `p. ${page}` : ""].filter(Boolean).join(", ");
    const note = referenceText(source.note);
    const url = safeSourceUrl(source.url);
    if (!citation && !note) return [];

    return [{ citation, note, url: citation ? url : "" }];
  });
}

function normalizeCatalogCrossReferences(token = {}) {
  const seen = new Set();

  const normalizeEntry = (entry) => {
    if (!entry) return null;

    if (typeof entry === "string") {
      const id = entry.trim();
      return id ? { catalog: "Catalog", id } : null;
    }

    const id = String(entry.id || entry.number || entry.value || "").trim();
    if (!id) return null;

    const catalog = String(
      entry.catalog || entry.source || entry.name || "Catalog"
    ).trim();

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

  return refs;
}

function publicCollectionId(token = {}) {
  return String(token.collectionId || "").trim();
}

function publicCollectionTitle(token = {}, options = {}) {
  return token.title || "";
}

function formatCatalogCrossReferences(token) {
  return formatCatalogCrossReferenceLines(token).join(" / ");
}

function formatCatalogCrossReferenceLines(token) {
  return normalizeCatalogCrossReferences(token).map((ref) => ref.id);
}

function tokenCatalogUrlForReference(value) {
  const match = String(value || "").trim().match(/^TC-(\d+)$/);
  if (!match) return "";

  return `https://tokencatalog.com/token_record_forms.php?action=DisplayTokenRecord&td_id=${match[1]}`;
}

function buildCatalogCrossReferenceParts(token) {
  return formatCatalogCrossReferenceLines(token).flatMap((reference, index) => {
    const parts = [];
    const text = String(reference || "");
    const url = tokenCatalogUrlForReference(text);

    if (index > 0) {
      parts.push({ text: " / " });
    }

    parts.push(
      url
        ? {
            text,
            url,
            ariaLabel: `${text} on TokenCatalog, opens in a new tab`
          }
        : { text }
    );

    return parts;
  });
}

/**
 * Build the Quick Facts rows shown on detail pages.
 * Canonical schema only.
 */
function buildQuickFacts(token, context = {}) {
  const { lookups = {} } = context;

  const rows = [];

  const addRow = (label, value, extra = {}) => {
    if (hasMeaningfulValue(value)) {
      rows.push({ label, value, ...extra });
    }
  };

  addRow("Exonumist ID", publicCollectionId(token));

  const catalogLines = formatCatalogCrossReferenceLines(token);
  if (catalogLines.length) {
    addRow("Catalog X-Refs", catalogLines.join(" / "), {
      valueParts: buildCatalogCrossReferenceParts(token)
    });
  }

  if (
    token.classification &&
    String(token.classification).trim().toLowerCase() !== "regular"
  ) {
    addRow("Classification", lookupValue(token.classification, lookups.classification));
  }
  addRow("Material", formatMaterialDisplay(token, lookups));
  addRow("Size", hasMeaningfulValue(token.size) ? `${token.size} mm` : "");
  addRow("Shape", lookupValue(token.form, lookups.forms));
  addRow("Symbol", lookupValue(token.symbol, lookups.symbols));
  addRow("Counterstamp", token.counterstamp);
  addRow("Borough", token.borough);
  addRow("Maker", token.maker);
  addRow("Issued", token.issued);
  addRow("Mintage", formatNumber(token.mintage));

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

  if (token.mat) parts.push(formatMaterialDisplay(token, lookups));
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

  if (token.mat) parts.push(formatMaterialDisplay(token, lookups));
  if (token.size) parts.push(`${token.size} mm`);
  if (token.form) parts.push(lookupValue(token.form, lookups.forms));
  if (token.symbol) parts.push(lookupValue(token.symbol, lookups.symbols));

  return parts.filter(Boolean);
}

function buildCollectionCardSearchText(token, context = {}) {
  const { lookups = {} } = context;
  const displayDescription = buildDisplayDescription(token, { lookups });
  const catalogLines = formatCatalogCrossReferenceLines(token);

  const parts = [
    token.collectionId || "",
    catalogLines.join(" "),
    Array.isArray(token.rel) ? token.rel.join(" ") : "",
    publicCollectionTitle(token, context),
    displayDescription,
    token.desc || "",
    token.obv || "",
    token.rev || "",
    token.notes || "",
    token.catalogStatus || token.status || "",
    token.classification || "",
    token.type || "",
    token.borough || "",
    formatMaterialDisplay(token, lookups),
    token.finish || "",
    lookupValue(token.form, lookups.forms),
    lookupValue(token.symbol, lookups.symbols)
  ];

  return parts.filter(Boolean).join(" ");
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

  const currentId = String(publicCollectionId(currentToken)).toLowerCase();

  const index = items.findIndex(
    (item) => String(publicCollectionId(item)).toLowerCase() === currentId
  );

  if (index === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: index > 0 ? items[index - 1] : null,
    next: index < items.length - 1 ? items[index + 1] : null
  };
}

function normalizePagerArea(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getPagerAreaKey(token = {}) {
  return String(token.collectionArea || token.borough || "").trim();
}

function getPagerBoroughLabel(token = {}) {
  return String(token.borough || token.collectionArea || "")
    .trim()
    .toUpperCase();
}

function buildPagerItem(token, options = {}) {
  if (!token) return null;

  const {
    urlBuilder,
    hasTokenImage,
    tokenImagePath,
    currentToken = null,
    direction = ""
  } = options;

  const id = publicCollectionId(token);
  const slug = id.toLowerCase();
  const currentArea = getPagerAreaKey(currentToken || {});
  const targetArea = getPagerAreaKey(token);
  const targetBorough = getPagerBoroughLabel(token);
  const crossesBorough =
    Boolean(currentArea && targetArea) &&
    normalizePagerArea(currentArea) !== normalizePagerArea(targetArea);
  const directionText = direction === "prev" ? "Previous" : "Next";

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
    title: publicCollectionTitle(token),
    url,
    crossesBorough,
    targetBorough,
    directionLabel: crossesBorough
      ? `${directionText} borough`
      : directionText,
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
  const obverseText = token.obv
    ? token.counterstamp
      ? `${token.obv} (${token.counterstamp} Counterstamp)`
      : token.obv
    : "";
  const reverseText = token.rev || "";

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

    displayHeading: tokenTitle || tokenId,
    materialDisplay: formatMaterialDisplay(token, lookups),
    variantLine: buildVariantLine(token, { lookups }),

    quickFacts: buildQuickFacts(token, {
      isUnlisted,
      lookups,
      detailSectionTitle
    }),

    obverseText,
    obverseCaption: normalizeInscriptionCaption(obverseText),

    reverseText,
    reverseCaption: normalizeInscriptionCaption(reverseText),

    notes: token.notes || "",
    usage: buildUsage(token),
    references: buildReferences(token),
    wantedNote: token.wantedNote || "",
    summaryDescription: buildDisplayDescription(token, { lookups }),

    pager: detailShowPager
      ? {
          prev: buildPagerItem(prevToken, {
            hasTokenImage: helperFns.hasTokenImage,
            tokenImagePath: helperFns.tokenImagePath,
            currentToken: token,
            direction: "prev"
          }),
          next: buildPagerItem(nextToken, {
            hasTokenImage: helperFns.hasTokenImage,
            tokenImagePath: helperFns.tokenImagePath,
            currentToken: token,
            direction: "next"
          })
        }
      : null,

    browsePager: detailShowPager
      ? {
          prev: buildPagerItem(globalPrevToken, {
            hasTokenImage: helperFns.hasTokenImage,
            tokenImagePath: helperFns.tokenImagePath,
            currentToken: token,
            direction: "prev"
          }),
          next: buildPagerItem(globalNextToken, {
            hasTokenImage: helperFns.hasTokenImage,
            tokenImagePath: helperFns.tokenImagePath,
            currentToken: token,
            direction: "next"
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
                tokenImagePath: helperFns.tokenImagePath,
                currentToken: token,
                direction: "prev"
              }
            ),
            next: buildPagerItemWithUrl(
              groupPager.nextToken,
              groupPager.nextUrl,
              {
                hasTokenImage: helperFns.hasTokenImage,
                tokenImagePath: helperFns.tokenImagePath,
                currentToken: token,
                direction: "next"
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
  buildMetaDescription,
  formatMaterialDisplay,
  formatCatalogCrossReferences,
  formatCatalogCrossReferenceLines,
  buildCatalogCrossReferenceParts,
  normalizeCatalogCrossReferences,
  publicCollectionId,
  publicCollectionTitle,
  buildTokenDetailView
};
