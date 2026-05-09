const fs = require("fs");
const path = require("path");

const csvPath = path.join(__dirname, "forSale.csv");

function parseCsvLine(line) {
  return line.split(",").map((value) => value.trim());
}

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

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function buildCatalogId(state, number, letter) {
  return `${state || ""}${number || ""}${letter || ""}`;
}

module.exports = function () {
  const csv = fs.readFileSync(csvPath, "utf8").trim();
  const lines = csv.split(/\r?\n/);

  const rows = lines.slice(1).map((line) => {
    const [state, number, letter, value] = parseCsvLine(line);
    const catalogId = buildCatalogId(state, number, letter);

    return {
      state,
      stateName: stateName(state),
      number,
      letter,
      value,
      catalogId,
      searchText:
        `${catalogId} ${state} ${number} ${letter} ${value}`.toLowerCase()
    };
  });

  const groups = {};

  rows.forEach((item) => {
    if (!groups[item.state]) {
      groups[item.state] = {
        state: item.state,
        stateName: item.stateName,
        items: []
      };
    }

    groups[item.state].items.push(item);
  });

  const sortedGroups = Object.values(groups).sort((a, b) =>
    a.stateName.localeCompare(b.stateName)
  );

  const now = new Date();

  return {
    updated: now,
    updatedLabel: formatDate(now),
    total: rows.length,
    groups: sortedGroups
  };
};
