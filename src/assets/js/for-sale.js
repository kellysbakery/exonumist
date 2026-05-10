function normalize(value) {
  return value.trim().toLowerCase();
}

function setElementHidden(element, isHidden) {
  element.hidden = isHidden;
}

function updateForSaleSearch() {
  const input = document.querySelector("#for-sale-search-input");
  const visibleCount = document.querySelector("#for-sale-visible-count");
  const emptyMessage = document.querySelector("#for-sale-empty");
  const groups = [...document.querySelectorAll("[data-sale-group]")];

  if (!input || !visibleCount || !emptyMessage) return;

  const query = normalize(input.value);
  let totalVisible = 0;

  groups.forEach((group) => {
    const items = group.querySelectorAll("[data-sale-item]");
    const groupCount = group.querySelector("[data-group-visible-count]");
    const defaultCount = Number(group.dataset.count) || items.length;
    let visibleInGroup = 0;

    items.forEach((item) => {
      const searchText = normalize(item.dataset.searchText || "");
      const isMatch = !query || searchText.includes(query);

      setElementHidden(item, !isMatch);

      if (isMatch) {
        visibleInGroup += 1;
      }
    });

    setElementHidden(group, visibleInGroup === 0);

    if (groupCount) {
      groupCount.textContent = query ? visibleInGroup : defaultCount;
    }

    if (query && visibleInGroup > 0) {
      group.open = true;
    }

    if (!query) {
      group.open = false;
    }

    totalVisible += visibleInGroup;
  });

  visibleCount.textContent = totalVisible;
  setElementHidden(emptyMessage, totalVisible !== 0);
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.querySelector("#for-sale-search-input");

  if (!input) return;

  input.addEventListener("input", updateForSaleSearch);
  updateForSaleSearch();
});
