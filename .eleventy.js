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

  eleventyConfig.addFilter("isRoundToken", (record) => {
    const form = String(record?.form || record || "").trim().toLowerCase();
    return form === "r" || form === "round";
  });

  // Format whole numbers with commas
  eleventyConfig.addFilter("formatNumber", (value) => {
    if (value === null || value === undefined || value === "") return "";

    const num = Number(value);
    if (Number.isNaN(num)) return value;

    return num.toLocaleString("en-US");
  });

  // Format token issue dates for display
  eleventyConfig.addFilter("formatDateUS", (value) => {
    if (!value) return "";

    const text = String(value);

    const fullDate = /^(\d{4})-(\d{2})-(\d{2})$/;
    const yearMonth = /^(\d{4})-(\d{2})$/;

    if (fullDate.test(text)) {
      const [, year, month, day] = text.match(fullDate);
      return `${month}/${day}/${year}`;
    }

    if (yearMonth.test(text)) {
      const [, year, month] = text.match(yearMonth);
      return `${month}/${year}`;
    }

    return text;
  });

  // Resolve nested URLs from site.json refs like catalog.infoUrl
  eleventyConfig.addFilter("resolveUrlRef", (urlRef, site) => {
    if (!urlRef) return "#";

    // If it's already a full URL, return it as-is
    if (urlRef.startsWith("http://") || urlRef.startsWith("https://")) {
      return urlRef;
    }

    // Otherwise, try to resolve it from the site object
    if (!site) return "#";

    return (
      urlRef.split(".").reduce((acc, key) => {
        return acc && acc[key] !== undefined ? acc[key] : null;
      }, site) || "#"
    );
  });

  eleventyConfig.addFilter("absoluteUrl", (urlPath, site) => {
    const baseUrl = site?.siteUrl || site?.url || site?.baseUrl || "";
    if (!urlPath) return baseUrl;

    if (/^https?:\/\//.test(urlPath)) {
      return urlPath;
    }

    if (!baseUrl) {
      return urlPath;
    }

    return new URL(urlPath, baseUrl).href;
  });

  function normalizeImageSide(side) {
    const normalized = String(side || "").toLowerCase();

    if (normalized === "o" || normalized === "obverse") return "o";
    if (normalized === "r" || normalized === "rev" || normalized === "reverse")
      return "r";

    return normalized;
  }

  function buildTokenImageStem(record) {
    if (!record) return "";

    // imageKey is the explicit filename base for token images. The derived
    // displayId/sort fallback remains for backward compatibility during migration.
    const imageKey = String(record.imageKey || "").trim();

    if (imageKey) {
      return imageKey.toLowerCase();
    }

    const status = String(record.status || "").toLowerCase();

    if (status === "listed" && record.sort) {
      return String(record.sort).trim().toLowerCase();
    }

    return String(record.displayId || "")
      .trim()
      .toLowerCase();
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

    return path.join(
      process.cwd(),
      "src",
      "assets",
      "images",
      "token",
      filename
    );
  }

  function buildTokenImageWebPath(record, side) {
    const filename = buildTokenImageFilename(record, side);
    if (!filename) return "";

    return `/assets/images/token/${filename}`;
  }

  function buildTokenThumbWebPath(record, side) {
    const filename = buildTokenImageFilename(record, side);
    if (!filename) return "";

    const thumbFilename = filename.replace(".jpg", ".webp");
    return `/assets/images/thumb/${thumbFilename}`;
  }

  // Canonical generic image helpers
  eleventyConfig.addFilter("tokenImagePath", (record, side) => {
    return buildTokenImageWebPath(record, side);
  });

  eleventyConfig.addFilter("tokenThumbPath", (record, side) => {
    return buildTokenThumbWebPath(record, side);
  });

  eleventyConfig.addFilter("hasTokenImage", (record, side) => {
    const fsPath = buildTokenImageFsPath(record, side);
    return fsPath ? fs.existsSync(fsPath) : false;
  });

  eleventyConfig.addFilter("hasTokenThumb", (record, side) => {
    const filename = buildTokenImageFilename(record, side);
    if (!filename) return false;

    const thumbFilename = filename.replace(".jpg", ".webp");
    const fsPath = path.join(
      process.cwd(),
      "src",
      "assets",
      "images",
      "thumb",
      thumbFilename
    );
    return fs.existsSync(fsPath);
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
