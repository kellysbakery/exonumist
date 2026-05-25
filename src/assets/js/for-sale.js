function normalize(value) {
  return value.trim().toLowerCase();
}

function setElementHidden(element, isHidden) {
  element.hidden = isHidden;
}

let availableMode = "search";
let wantListMatches = null;

function setAvailableMode(mode) {
  availableMode = mode;

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
  const emptyMessage = document.querySelector("#for-sale-empty");
  const groups = [...document.querySelectorAll("[data-sale-group]")];

  if (!input || !visibleCount || !emptyMessage) return;

  const query = normalize(input.value);
  const isWantMode = availableMode === "want";
  const hasWantListFilter = wantListMatches instanceof Set;
  let totalVisible = 0;

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

      setElementHidden(item, !isMatch);

      if (isMatch) {
        visibleInGroup += 1;
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
  emptyMessage.textContent =
    isWantMode && hasWantListFilter
      ? "No available tokens matched your want list."
      : "No available tokens match that catalog number.";
  setElementHidden(emptyMessage, totalVisible !== 0);
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
    updateForSaleSearch();
  });

  input.addEventListener("input", updateForSaleSearch);
  setAvailableMode("search");
  updateForSaleSearch();
});
