const path = require("path");
const fs = require("fs");

module.exports = function (eleventyConfig) {
  // Static assets
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/images": "images" });

  // Generic lookup filter
  eleventyConfig.addFilter("lookup", (code, table) => {
    return table && code ? table[code] || code : "";
  });

  // Format numeric values as money with 2 decimals
  eleventyConfig.addFilter("money", (value) => {
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return num.toFixed(2);
  });

  // Resolve nested URLs from site.json refs like catalog.infoUrl
  eleventyConfig.addFilter("resolveUrlRef", (urlRef, site) => {
    if (!urlRef || !site) return "#";

    return (
      urlRef.split(".").reduce((acc, key) => {
        return acc && acc[key] !== undefined ? acc[key] : null;
      }, site) || "#"
    );
  });

    function normalizeImageSide(side) {
    const normalized = String(side || "").toLowerCase();

    if (normalized === "o" || normalized === "obverse") return "o";
    if (normalized === "r" || normalized === "rev" || normalized === "reverse") return "r";

    return normalized;
  }

  function buildTokenImageStem(record) {
    if (!record) return "";

    const status = String(record.status || "").toLowerCase();

    if (status === "listed" && record.sort) {
      return String(record.sort).trim().toLowerCase();
    }

    return String(record.displayId || "").trim().toLowerCase();
  }

  function buildTokenImageFilename(record, side) {
    const stem = buildTokenImageStem(record);
    const normalizedSide = normalizeImageSide(side);

    if (!stem || !normalizedSide) {
      return "";
    }

    return `${stem}_${normalizedSide}.jpg`;
  }

  function buildTokenImageFsPath(record, side) {
    const filename = buildTokenImageFilename(record, side);
    if (!filename) return "";

    return path.join(process.cwd(), "src", "images", filename);
  }

  function buildTokenImageWebPath(record, side) {
    const filename = buildTokenImageFilename(record, side);
    if (!filename) return "";

    return `/images/${filename}`;
  }

  // Canonical generic image helpers
  eleventyConfig.addFilter("tokenImagePath", (record, side) => {
    return buildTokenImageWebPath(record, side);
  });

  eleventyConfig.addFilter("hasTokenImage", (record, side) => {
    const fsPath = buildTokenImageFsPath(record, side);
    return fsPath ? fs.existsSync(fsPath) : false;
  });

  // Temporary compatibility aliases while templates are migrated
  eleventyConfig.addFilter("officialImagePath", (record, side) => {
    return buildTokenImageWebPath(record, side);
  });

  eleventyConfig.addFilter("hasOfficialImage", (record, side) => {
    const fsPath = buildTokenImageFsPath(record, side);
    return fsPath ? fs.existsSync(fsPath) : false;
  });

  eleventyConfig.addFilter("fallbackImagePath", (record, _type, side) => {
    return buildTokenImageWebPath(record, side);
  });

  eleventyConfig.addFilter("hasFallbackImage", (record, _type, side) => {
    const fsPath = buildTokenImageFsPath(record, side);
    return fsPath ? fs.existsSync(fsPath) : false;
  });

  // Catalog-aware sort for keys like:
  // 630-d-a
  // 630-an
  // 630-ar
  // single-letter codes sort before double-letter codes
  const compareSortKeys = (a, b) => {
    const aKey = String(a.sort || "").toLowerCase();
    const bKey = String(b.sort || "").toLowerCase();

    const aParts = aKey.split("-");
    const bParts = bKey.split("-");

    const aSection = aParts[0] || "";
    const bSection = bParts[0] || "";

    // Section numeric compare first
    if (/^\d+$/.test(aSection) && /^\d+$/.test(bSection)) {
      if (Number(aSection) !== Number(bSection)) {
        return Number(aSection) - Number(bSection);
      }
    } else if (aSection !== bSection) {
      return aSection.localeCompare(bSection);
    }

    const aCode = aParts[1] || "";
    const bCode = bParts[1] || "";

    // Shorter code first: A before AA, D before AN
    if (aCode.length !== bCode.length) {
      return aCode.length - bCode.length;
    }

    // Alphabetical within same code length
    if (aCode !== bCode) {
      return aCode.localeCompare(bCode);
    }

    const aVar = aParts.slice(2).join("-");
    const bVar = bParts.slice(2).join("-");

    // No variety before variety
    if (!aVar && bVar) return -1;
    if (aVar && !bVar) return 1;

    // Shorter variety first
    if (aVar.length !== bVar.length) {
      return aVar.length - bVar.length;
    }

    return aVar.localeCompare(bVar);
  };

  // Merge official section JSON files into one collection
  eleventyConfig.addCollection("officialAll", function () {
    const dataDir = path.join(process.cwd(), "src", "_data", "official");

    if (!fs.existsSync(dataDir)) return [];

    const files = fs
      .readdirSync(dataDir)
      .filter((f) => f.endsWith(".json"))
      .sort();

    const merged = [];

    for (const file of files) {
      const fullPath = path.join(dataDir, file);
      const records = JSON.parse(fs.readFileSync(fullPath, "utf8"));

      for (const record of records) {
        if (record.pub !== false) {
          merged.push(record);
        }
      }
    }

    return merged.sort(compareSortKeys);
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    dataTemplateEngine: "njk"
  };
};
