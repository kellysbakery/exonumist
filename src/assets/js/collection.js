(function () {
  function initCollectionFilters() {
    const filterPanel = document.querySelector("[data-collection-status-filters]");
    const searchInput = document.querySelector("[data-collection-search]");
    const resultCount = document.querySelector("[data-collection-result-count]");
    const resultTotal = document.querySelector("[data-collection-result-total]");
    const buttons = filterPanel
      ? [...filterPanel.querySelectorAll("[data-status-filter]")]
      : [];
    const cards = [...document.querySelectorAll("[data-collection-token-card]")];

    if (!searchInput && !buttons.length) return;

    let activeStatus = "all";
    let searchTerm = "";

    function cardMatchesStatus(card, status) {
      return status === "all" || card.dataset.status === status;
    }

    function cardMatchesSearch(card) {
      return (
        !searchTerm ||
        (card.dataset.search || "").toLowerCase().includes(searchTerm)
      );
    }

    function updateCounts() {
      buttons.forEach((button) => {
        const status = button.dataset.statusFilter;
        const count = button.querySelector("[data-status-count]");

        if (!count) return;

        count.textContent = cards.filter((card) => {
          return cardMatchesStatus(card, status) && cardMatchesSearch(card);
        }).length;
      });

      if (resultCount) {
        resultCount.textContent = cards.filter((card) => {
          return cardMatchesStatus(card, activeStatus) && cardMatchesSearch(card);
        }).length;
      }

      if (resultTotal) {
        resultTotal.textContent = cards.length;
      }
    }

    function applyFilters() {
      cards.forEach((card) => {
        const shouldHide =
          !cardMatchesStatus(card, activeStatus) || !cardMatchesSearch(card);

        card.classList.toggle("is-filter-hidden", shouldHide);
        card.setAttribute("aria-hidden", shouldHide ? "true" : "false");
      });

      buttons.forEach((button) => {
        button.classList.toggle(
          "is-active",
          button.dataset.statusFilter === activeStatus
        );
      });

      updateCounts();
    }

    if (filterPanel) {
      filterPanel.addEventListener("click", (event) => {
        const button = event.target.closest("[data-status-filter]");
        if (!button) return;

        event.preventDefault();
        activeStatus = button.dataset.statusFilter;
        applyFilters();
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        searchTerm = searchInput.value.trim().toLowerCase();
        applyFilters();
      });
    }

    applyFilters();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCollectionFilters);
  } else {
    initCollectionFilters();
  }
})();
