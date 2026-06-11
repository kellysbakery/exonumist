function normalize(value) {
  return value.trim().toLowerCase();
}

function setElementHidden(element, isHidden) {
  element.hidden = isHidden;
}

let availableMode = "search";
let wantListMatches = null;

function getTokenTargetId(catalogId) {
  return `available-token-${String(catalogId || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

function formatTokenCount(count) {
  return `${count} ${count === 1 ? "token" : "tokens"}`;
}

function setCountText(element, count) {
  if (element) {
    element.textContent = count;
  }
}

function setPluralLabel(element, count, singular, plural) {
  if (element) {
    element.textContent = count === 1 ? singular : plural;
  }
}

function updateNoResultsMessage({ mode, query }) {
  const title = document.querySelector("[data-no-results-title]");
  const queryLine = document.querySelector("[data-no-results-query]");
  const help = document.querySelector("[data-no-results-help]");

  if (!title || !queryLine || !help) return;

  if (mode === "want") {
    title.textContent = "No available tokens matched your want list.";
    queryLine.textContent = "";
    setElementHidden(queryLine, true);
    help.textContent =
      "Check catalog numbers, try one per line, or search by city, state, or place name in Search one token mode.";
    return;
  }

  if (query) {
    title.textContent = `No available tokens found for "${query}".`;
  } else {
    title.textContent = "No available tokens found.";
  }

  queryLine.textContent = "";
  setElementHidden(queryLine, true);

  help.textContent =
    "Try a shorter catalog number like NY631, a city or state like Birmingham or Alaska, or alternate spelling with fewer words.";
}

function resetMatchedTokensSummary() {
  const summary = document.querySelector("[data-matched-tokens-summary]");
  const count = document.querySelector("[data-matched-tokens-count]");
  const list = document.querySelector("[data-matched-tokens-list]");

  if (!summary || !count || !list) return;

  count.textContent = "";
  list.innerHTML = "";
  setElementHidden(summary, true);
}

function updateMatchedTokensSummary(matchedCatalogIds) {
  const summary = document.querySelector("[data-matched-tokens-summary]");
  const count = document.querySelector("[data-matched-tokens-count]");
  const list = document.querySelector("[data-matched-tokens-list]");

  if (!summary || !count || !list) return;

  list.innerHTML = "";
  setElementHidden(summary, true);
  setElementHidden(list, true);

  if (!(wantListMatches instanceof Set)) {
    resetMatchedTokensSummary();
    return;
  }

  if (!matchedCatalogIds.size) {
    setElementHidden(summary, false);
    setElementHidden(list, true);
    count.textContent =
      "No available tokens matched your want list. Check catalog numbers, try one per line, or search by city, state, or place name in Search one token mode.";
  }
}

function setAvailableMode(mode) {
  availableMode = mode;

  if (mode !== "want") {
    wantListMatches = null;
    resetMatchedTokensSummary();
  }

  document.querySelectorAll("[data-available-mode-button]").forEach((button) => {
    const isActive = button.dataset.availableModeButton === mode;

    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  document.querySelectorAll("[data-available-panel]").forEach((panel) => {
    setElementHidden(panel, panel.dataset.availablePanel !== mode);
  });

  updateForSaleSearch();
}

function updateForSaleSearch() {
  const input = document.querySelector("#for-sale-search-input");
  const visibleCount = document.querySelector("#for-sale-visible-count");
  const resultsSummary = document.querySelector("#for-sale-results-summary");
  const totalCountPhrase = document.querySelector("#for-sale-total-phrase");
  const emptyMessage = document.querySelector("#for-sale-empty");
  const forSaleList = document.querySelector("[data-for-sale-list]");
  const groups = [...document.querySelectorAll("[data-sale-group]")];

  if (!input || !visibleCount || !emptyMessage) return;

  const query = normalize(input.value);
  const isWantMode = availableMode === "want";
  const hasWantListFilter = wantListMatches instanceof Set;
  const hasActiveFilter = Boolean(query || (isWantMode && hasWantListFilter));
  const totalAvailable = Number(resultsSummary?.dataset.forSaleTotal) || 0;
  let totalVisible = 0;
  const matchedCatalogIds = new Set();

  groups.forEach((group) => {
    const items = group.querySelectorAll("[data-sale-item]");
    const groupCount = group.querySelector("[data-group-visible-count]");
    const groupTokenLabel = group.querySelector("[data-group-token-label]");
    const groupPlaceMeta = group.querySelector("[data-group-place-meta]");
    const groupPlaceCount = group.querySelector("[data-group-visible-place-count]");
    const groupPlaceLabel = group.querySelector("[data-group-place-label]");
    const defaultCount = Number(group.dataset.count) || items.length;
    const defaultPlaceCount = Number(group.dataset.placeCount) || 0;
    let visibleInGroup = 0;
    const visiblePlaces = new Set();

    items.forEach((item) => {
      const searchText = normalize(item.dataset.searchText || "");
      const catalogId = item.dataset.catalogId || "";
      const displayPlace = (item.dataset.displayPlace || "").trim();
      const isMatch = isWantMode
        ? !hasWantListFilter || wantListMatches.has(catalogId)
        : !query || searchText.includes(query);

      if (catalogId && !item.id) {
        item.id = getTokenTargetId(catalogId);
      }

      setElementHidden(item, !isMatch);

      if (isMatch) {
        visibleInGroup += 1;

        if (displayPlace) {
          visiblePlaces.add(displayPlace);
        }

        if (isWantMode && hasWantListFilter && wantListMatches.has(catalogId)) {
          matchedCatalogIds.add(catalogId);
        }
      }
    });

    setElementHidden(group, visibleInGroup === 0);

    const visiblePlaceCount =
      query || (isWantMode && hasWantListFilter)
        ? visiblePlaces.size
        : defaultPlaceCount;
    const displayCount =
      query || (isWantMode && hasWantListFilter) ? visibleInGroup : defaultCount;

    setCountText(groupCount, displayCount);
    setPluralLabel(groupTokenLabel, displayCount, "token", "tokens");
    setCountText(groupPlaceCount, visiblePlaceCount);
    setPluralLabel(groupPlaceLabel, visiblePlaceCount, "place", "places");

    if (groupPlaceMeta) {
      setElementHidden(groupPlaceMeta, visiblePlaceCount === 0);
    }

    if ((query || (isWantMode && hasWantListFilter)) && visibleInGroup > 0) {
      group.open = true;
    }

    if ((!query && !isWantMode) || (isWantMode && !hasWantListFilter)) {
      group.open = false;
    }

    totalVisible += visibleInGroup;
  });

  const shouldHideGroupedResults =
    isWantMode && hasWantListFilter && matchedCatalogIds.size > 0;

  visibleCount.textContent = totalVisible;
  if (totalCountPhrase) {
    totalCountPhrase.textContent = hasActiveFilter ? ` of ${totalAvailable}` : "";
  }

  updateNoResultsMessage({
    mode: isWantMode && hasWantListFilter ? "want" : "search",
    query: input.value.trim()
  });
  setElementHidden(
    emptyMessage,
    totalVisible !== 0 || shouldHideGroupedResults || (isWantMode && hasWantListFilter)
  );

  if (forSaleList) {
    setElementHidden(forSaleList, shouldHideGroupedResults);
  }

  if (isWantMode && hasWantListFilter) {
    updateMatchedTokensSummary(matchedCatalogIds);
  } else {
    resetMatchedTokensSummary();
  }
}

function hasUnselectedSearchMatch(query) {
  return [...document.querySelectorAll("[data-sale-item]")].some((item) => {
    const button = item.querySelector("[data-inquiry-toggle]");
    const searchText = normalize(item.dataset.searchText || "");

    return searchText.includes(query) && button?.getAttribute("aria-pressed") !== "true";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.querySelector("#for-sale-search-input");

  if (!input) return;

  document.querySelectorAll("[data-available-mode-button]").forEach((button) => {
    button.addEventListener("click", () => {
      setAvailableMode(button.dataset.availableModeButton || "search");
    });
  });

  document.addEventListener("available:want-list-matched", (event) => {
    wantListMatches = new Set(event.detail?.catalogIds || []);
    setAvailableMode("want");
  });

  document.addEventListener("available:want-list-cleared", () => {
    wantListMatches = null;
    resetMatchedTokensSummary();
    updateForSaleSearch();
  });

  document.addEventListener("available:inquiry-token-added", () => {
    const query = normalize(input.value);

    if (availableMode !== "search" || !query) return;
    if (hasUnselectedSearchMatch(query)) return;

    input.value = "";
    updateForSaleSearch();
    input.focus({ preventScroll: true });
  });

  input.addEventListener("input", updateForSaleSearch);
  setAvailableMode("search");
  updateForSaleSearch();
});
