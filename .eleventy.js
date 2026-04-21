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

  // Build official image path
  eleventyConfig.addFilter("officialImagePath", (record, side) => {
    const code = String(record.code || "").toLowerCase();
    const variant = record.var ? `-${String(record.var).toLowerCase()}` : "";

    return `/images/official/${record.sec}/${record.sec}-${code}${variant}_${side}.jpg`;
  });

  // Check if official image exists
  eleventyConfig.addFilter("hasOfficialImage", (record, side) => {
    const code = String(record.code || "").toLowerCase();
    const variant = record.var ? `-${String(record.var).toLowerCase()}` : "";

    const rel = path.join(
      "src",
      "images",
      "official",
      String(record.sec),
      `${record.sec}-${code}${variant}_${side}.jpg`
    );

    return fs.existsSync(path.join(process.cwd(), rel));
  });

  // Build image path for unlisted / oddities / counterfeit
  eleventyConfig.addFilter("fallbackImagePath", (record, type, side) => {
    const key = String(record.displayId || "").toLowerCase();
    return `/images/${type}/${key}_${side}.jpg`;
  });

  // Check if fallback image exists
  eleventyConfig.addFilter("hasFallbackImage", (record, type, side) => {
    const key = String(record.displayId || "").toLowerCase();
    const rel = path.join("src", "images", type, `${key}_${side}.jpg`);

    return fs.existsSync(path.join(process.cwd(), rel));
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
