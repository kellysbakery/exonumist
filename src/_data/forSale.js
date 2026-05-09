// =========================================================
// forSale.js
//
// Reads src/_data/forSale.csv and converts it into a
// structured data object that Eleventy exposes as "forSale".
//
// Input CSV format:
// State,Number,Letter,Value
// AL,120,G,$0.35
// NY,630,AN,$1.00
//
// Available in templates as:
// - forSale.total
// - forSale.updated
// - forSale.updatedLabel
// - forSale.groups
// =========================================================

const fs = require("fs");
const path = require("path");

// Full path to the CSV file that contains the sales inventory.
const csvPath = path.join(__dirname, "forSale.csv");

// ---------------------------------------------------------
// parseCsvLine(line)
//
// Splits a CSV line into fields and trims whitespace.
//
// Example:
// "NY,630,AN,$1.00"
// -> ["NY", "630", "AN", "$1.00"]
//
// Note:
// This is intentionally simple and assumes there are no
// commas embedded inside field values.
// ---------------------------------------------------------
function parseCsvLine(line) {
  return line.split(",").map((value) => value.trim());
}

// ---------------------------------------------------------
// stateName(code)
//
// Converts a state/province abbreviation into a friendly
// display name used as the collapsible group heading.
//
// Includes U.S. states and Canadian provinces because
// transportation token catalogs include both.
// ---------------------------------------------------------
function stateName(code) {
  const states = {
    AL: "Alabama",
    AK: "Alaska",
    AR: "Arkansas",
    AZ: "Arizona",
    CA: "California",
    CO: "Colorado",
    CT: "Connecticut",
    DC: "District of Columbia",
    DE: "Delaware",
    FL: "Florida",
    GA: "Georgia",
    HI: "Hawaii",
    IA: "Iowa",
    ID: "Idaho",
    IL: "Illinois",
    IN: "Indiana",
    KS: "Kansas",
    KY: "Kentucky",
    LA: "Louisiana",
    MA: "Massachusetts",
    MD: "Maryland",
    ME: "Maine",
    MI: "Michigan",
    MN: "Minnesota",
    MO: "Missouri",
    MS: "Mississippi",
    MT: "Montana",
    NC: "North Carolina",
    ND: "North Dakota",
    NE: "Nebraska",
    NH: "New Hampshire",
    NJ: "New Jersey",
    NM: "New Mexico",
    NV: "Nevada",
    NY: "New York",
    OH: "Ohio",
    OK: "Oklahoma",
    OR: "Oregon",
    PA: "Pennsylvania",
    PR: "Puerto Rico",
    RI: "Rhode Island",
    SC: "South Carolina",
    SD: "South Dakota",
    TN: "Tennessee",
    TX: "Texas",
    UT: "Utah",
    VA: "Virginia",
    VT: "Vermont",
    WA: "Washington",
    WI: "Wisconsin",
    WV: "West Virginia",
    WY: "Wyoming",

    // Canadian provinces / territories
    AB: "Alberta",
    BC: "British Columbia",
    MB: "Manitoba",
    NB: "New Brunswick",
    NL: "Newfoundland",
    NS: "Nova Scotia",
    ON: "Ontario",
    PE: "Prince Edward Island",
    PQ: "Quebec",
    SK: "Saskatchewan",

    // Countries
    PI: "Philippines",

    // Special
    CC: "Club Tour",
    FF: "Fantasy",
    PP: "Presentation Pieces"
  };

  return states[code] || code;
}

// ---------------------------------------------------------
// formatDate(date)
//
// Formats a JavaScript Date object as:
//
// "May 9, 2026"
//
// This avoids needing a custom Nunjucks filter.
// ---------------------------------------------------------
function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

// ---------------------------------------------------------
// Main export
//
// Eleventy executes this function during the build and makes
// the returned object available to templates as "forSale".
// ---------------------------------------------------------
module.exports = function () {
  // Read the CSV file into memory.
  const csv = fs.readFileSync(csvPath, "utf8").trim();

  // Split the file into individual lines.
  const lines = csv.split(/\r?\n/);

  // Skip the header row and convert each data row into a
  // normalized JavaScript object.
  const rows = lines.slice(1).map((line) => {
    const [state, number, letter, value] = parseCsvLine(line);

    return {
      // Original CSV values.
      state,
      number,
      letter,
      value,

      // Human-readable state name.
      stateName: stateName(state),

      // Combined Atwood-Coffee catalog identifier.
      // Example: NY + 630 + AN -> NY630AN
      catalogId: `${state}${number}${letter}`,

      // Internal sort key.
      sort: `${state}-${number}-${letter}`
    };
  });

  // Group all rows by state abbreviation.
  //
  // Example:
  // {
  //   NY: {
  //     state: "NY",
  //     stateName: "New York",
  //     items: [...]
  //   }
  // }
  const groups = {};

  rows.forEach((item) => {
    // Create the state group if it doesn't exist yet.
    if (!groups[item.state]) {
      groups[item.state] = {
        state: item.state,
        stateName: item.stateName,
        items: []
      };
    }

    // Add this token to the appropriate state group.
    groups[item.state].items.push(item);
  });

  // Convert the grouped object into an array and sort by
  // state name (Alabama, New York, etc.).
  const sortedGroups = Object.values(groups).sort((a, b) =>
    a.stateName.localeCompare(b.stateName)
  );

  // Create a single timestamp used for both:
  // - updated (raw Date object)
  // - updatedLabel (formatted string)
  const now = new Date();

  // Return the data object that Eleventy exposes as "forSale".
  return {
    // Raw JavaScript Date object.
    updated: now,

    // Human-friendly formatted date string.
    // Example: "May 9, 2026"
    updatedLabel: formatDate(now),

    // Total number of rows in the CSV file.
    total: rows.length,

    // Array of state groups, each containing its items.
    groups: sortedGroups
  };
};
