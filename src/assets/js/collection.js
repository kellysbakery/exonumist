(function () {
  function initCollectionFilters() {
    const filterPanel = document.querySelector("[data-collection-status-filters]");
    if (!filterPanel) return;

    const buttons = [...filterPanel.querySelectorAll("[data-status-filter]")];
    const cards = [...document.querySelectorAll("[data-collection-token-card]")];

    function updateCounts() {
      buttons.forEach((button) => {
        const status = button.dataset.statusFilter;
        const count = button.querySelector("[data-status-count]");

        if (!count) return;

        count.textContent = cards.filter((card) => {
          return status === "all" || card.dataset.status === status;
        }).length;
      });
    }

    function applyFilter(status) {
      cards.forEach((card) => {
        const shouldHide = status !== "all" && card.dataset.status !== status;
        card.classList.toggle("is-filter-hidden", shouldHide);
        card.setAttribute("aria-hidden", shouldHide ? "true" : "false");
      });

      buttons.forEach((button) => {
        button.classList.toggle(
          "is-active",
          button.dataset.statusFilter === status
        );
      });
    }

    filterPanel.addEventListener("click", (event) => {
      const button = event.target.closest("[data-status-filter]");
      if (!button) return;

      event.preventDefault();
      applyFilter(button.dataset.statusFilter);
    });

    updateCounts();
    applyFilter("all");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCollectionFilters);
  } else {
    initCollectionFilters();
  }
})();
