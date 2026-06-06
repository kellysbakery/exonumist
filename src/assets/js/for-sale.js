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

  if (!(wantListMatches instanceof Set)) {
    resetMatchedTokensSummary();
    return;
  }

  const matchedIds = [...wantListMatches].filter((catalogId) =>
    matchedCatalogIds.has(catalogId)
  );

  if (!matchedIds.length) {
    count.textContent = "No tokens from your list are currently available.";
    setElementHidden(list, true);
    setElementHidden(summary, false);
    return;
  }

  count.textContent = `${formatTokenCount(
    matchedIds.length
  )} from your list ${matchedIds.length === 1 ? "is" : "are"} currently available.`;
  setElementHidden(list, false);

  matchedIds.forEach((catalogId) => {
    const link = document.createElement("a");

    link.className = "matched-token-link";
    link.href = `#${getTokenTargetId(catalogId)}`;
    link.textContent = catalogId;
    list.append(link);
  });

  setElementHidden(summary, false);
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
    const defaultCount = Number(group.dataset.count) || items.length;
    let visibleInGroup = 0;

    items.forEach((item) => {
      const searchText = normalize(item.dataset.searchText || "");
      const catalogId = item.dataset.catalogId || "";
      const isMatch = isWantMode
        ? !hasWantListFilter || wantListMatches.has(catalogId)
        : !query || searchText.includes(query);

      if (catalogId && !item.id) {
        item.id = getTokenTargetId(catalogId);
      }

      setElementHidden(item, !isMatch);

      if (isMatch) {
        visibleInGroup += 1;

        if (isWantMode && hasWantListFilter && wantListMatches.has(catalogId)) {
          matchedCatalogIds.add(catalogId);
        }
      }
    });

    setElementHidden(group, visibleInGroup === 0);

    if (groupCount) {
      groupCount.textContent =
        query || (isWantMode && hasWantListFilter) ? visibleInGroup : defaultCount;
    }

    if ((query || (isWantMode && hasWantListFilter)) && visibleInGroup > 0) {
      group.open = true;
    }

    if ((!query && !isWantMode) || (isWantMode && !hasWantListFilter)) {
      group.open = false;
    }

    totalVisible += visibleInGroup;
  });

  visibleCount.textContent = totalVisible;
  if (totalCountPhrase) {
    totalCountPhrase.textContent = hasActiveFilter ? ` of ${totalAvailable}` : "";
  }

  emptyMessage.textContent =
    isWantMode && hasWantListFilter
      ? "No available tokens matched your want list."
      : "No available tokens match that catalog number.";
  setElementHidden(emptyMessage, totalVisible !== 0);

  if (isWantMode && hasWantListFilter) {
    updateMatchedTokensSummary(matchedCatalogIds);
  } else {
    resetMatchedTokensSummary();
  }
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

  input.addEventListener("input", updateForSaleSearch);
  setAvailableMode("search");
  updateForSaleSearch();
});
