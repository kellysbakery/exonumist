const fs = require("fs");
const path = require("path");

const csvPath = path.join(__dirname, "forSale.csv");
const catalogPlacesPath = path.join(__dirname, "catalogPlaces.csv");

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());

  return values;
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

function buildDisplayCatalogId(state, number, letter) {
  return [state, number, letter].filter(Boolean).join(" ");
}

function normalizePlaceKey(state, number) {
  return `${String(state || "").trim().toUpperCase()}::${String(number || "").trim()}`;
}

function loadCatalogPlaces() {
  if (!fs.existsSync(catalogPlacesPath)) {
    return new Map();
  }

  const csv = fs.readFileSync(catalogPlacesPath, "utf8").trim();
  if (!csv) return new Map();

  const lines = csv.split(/\r?\n/);
  const headers = parseCsvLine(lines[0]);
  const indexFor = (name) => headers.indexOf(name);
  const stateIndex = indexFor("StateCode");
  const numberIndex = indexFor("Number");
  const displayPlaceIndex = indexFor("DisplayPlace");
  const cityIndex = indexFor("City");
  const catalogLocationIndex = indexFor("CatalogLocation");
  const regionIndex = indexFor("Region");
  const countryIndex = indexFor("Country");
  const places = new Map();

  lines.slice(1).forEach((line) => {
    if (!line.trim()) return;

    const values = parseCsvLine(line);
    const state = values[stateIndex] || "";
    const number = values[numberIndex] || "";
    const key = normalizePlaceKey(state, number);

    if (!key || places.has(key)) return;

    places.set(key, {
      displayPlace: values[displayPlaceIndex] || "",
      city: values[cityIndex] || "",
      catalogLocation: values[catalogLocationIndex] || "",
      region: values[regionIndex] || "",
      country: values[countryIndex] || ""
    });
  });

  return places;
}

module.exports = function () {
  const csv = fs.readFileSync(csvPath, "utf8").trim();
  const lines = csv.split(/\r?\n/);
  const catalogPlaces = loadCatalogPlaces();

  const rows = lines.slice(1).map((line) => {
    const [state, number, letter, value, , box = ""] = parseCsvLine(line);
    const catalogId = buildCatalogId(state, number, letter);
    const catalogPlace = catalogPlaces.get(normalizePlaceKey(state, number));
    const displayPlace =
      catalogPlace?.displayPlace ||
      catalogPlace?.catalogLocation ||
      catalogPlace?.city ||
      "";

    return {
      state,
      stateName: stateName(state),
      number,
      letter,
      value,
      box,
      catalogId,
      displayPlace,
      catalogPlace,
      displayCatalogId: buildDisplayCatalogId(state, number, letter),
      searchText:
        `${catalogId} ${state} ${number} ${letter} ${value} ${displayPlace} ${
          catalogPlace?.city || ""
        } ${catalogPlace?.catalogLocation || ""} ${catalogPlace?.region || ""}`.toLowerCase()
    };
  });

  const groups = {};

  rows.forEach((item) => {
    if (!groups[item.state]) {
      groups[item.state] = {
        state: item.state,
        stateName: item.stateName,
        placeCount: 0,
        items: []
      };
    }

    groups[item.state].items.push(item);
  });

  Object.values(groups).forEach((group) => {
    group.placeCount = new Set(
      group.items
        .map((item) => String(item.displayPlace || "").trim())
        .filter(Boolean)
    ).size;
  });

  const sortedGroups = Object.values(groups).sort((a, b) =>
    a.stateName.localeCompare(b.stateName)
  );

  const now = new Date();

  return {
    updated: now,
    updatedLabel: formatDate(now),
    total: rows.length,
    items: rows,
    groups: sortedGroups
  };
};
