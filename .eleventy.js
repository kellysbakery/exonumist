const path = require("path");
const fs = require("fs");

module.exports = function (eleventyConfig) {
  // Static assets
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/images": "images" });

  // Generic lookup filter
  eleventyConfig.addFilter("lookup", (code, table) => {
    return table && code ? (table[code] || code) : "";
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
    const variant = record.var
      ? `-${String(record.var).toLowerCase()}`
      : "";

    return `/images/official/${record.sec}/${record.sec}-${code}${variant}_${side}.jpg`;
  });

  // Check if official image exists
  eleventyConfig.addFilter("hasOfficialImage", (record, side) => {
    const code = String(record.code || "").toLowerCase();
    const variant = record.var
      ? `-${String(record.var).toLowerCase()}`
      : "";

    const rel = path.join(
      "src",
      "images",
      "official",
      String(record.sec),
      `${record.sec}-${code}${variant}_${side}.jpg`
    );

    return fs.existsSync(path.join(process.cwd(), rel));
  });

  // Build image path for unlisted / oddities / special
  eleventyConfig.addFilter("fallbackImagePath", (record, type, side) => {
    const key =
      type === "unlisted" || type === "oddities"
        ? String(record.siteId || "").toLowerCase()
        : String(record.displayId || "").toLowerCase();

    return `/images/${type}/${key}_${side}.jpg`;
  });

  // Check if fallback image exists
  eleventyConfig.addFilter("hasFallbackImage", (record, type, side) => {
    const key =
      type === "unlisted" || type === "oddities"
        ? String(record.siteId || "").toLowerCase()
        : String(record.displayId || "").toLowerCase();

    const rel = path.join(
      "src",
      "images",
      type,
      `${key}_${side}.jpg`
    );

    return fs.existsSync(path.join(process.cwd(), rel));
  });

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

    return merged.sort((a, b) =>
      String(a.sort || "").localeCompare(String(b.sort || ""))
    );
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