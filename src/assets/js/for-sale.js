function normalize(value) {
  return value.trim().toLowerCase();
}

function updateForSaleSearch() {
  const input = document.querySelector("#for-sale-search-input");
  const visibleCount = document.querySelector("#for-sale-visible-count");
  const emptyMessage = document.querySelector("#for-sale-empty");
  const groups = document.querySelectorAll("[data-sale-group]");

  if (!input || !visibleCount || !emptyMessage) return;

  const query = normalize(input.value);
  let totalVisible = 0;

  groups.forEach((group) => {
    const items = group.querySelectorAll("[data-sale-item]");
    const groupCount = group.querySelector("[data-group-visible-count]");
    let visibleInGroup = 0;

    items.forEach((item) => {
      const searchText = item.dataset.search || "";
      const isMatch = !query || searchText.includes(query);

      item.hidden = !isMatch;

      if (isMatch) {
        visibleInGroup += 1;
      }
    });

    group.hidden = visibleInGroup === 0;

    if (groupCount) {
      groupCount.textContent = visibleInGroup;
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
  emptyMessage.hidden = totalVisible !== 0;
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.querySelector("#for-sale-search-input");

  if (!input) return;

  input.addEventListener("input", updateForSaleSearch);
  updateForSaleSearch();
});
