(function () {
  const chips = [...document.querySelectorAll(".browse-chip")];
  const groupActions = [...document.querySelectorAll(".browse-group-action")];
  const cards = [...document.querySelectorAll(".browse-card")];
  const count = document.getElementById("browse-count");
  const reset = document.getElementById("browse-reset");
  const searchInput = document.getElementById("browse-search");
  const emptyState = document.getElementById("browse-empty-state");

  let searchTerm = "";
  let searchTimeout;

  function groupChips(filterName) {
    return chips.filter((chip) => chip.dataset.filter === filterName);
  }

  function activeValues(filterName) {
    return groupChips(filterName)
      .filter((chip) => chip.classList.contains("is-active"))
      .map((chip) => chip.dataset.value);
  }

  function allInGroupActive(filterName) {
    return groupChips(filterName).every((chip) =>
      chip.classList.contains("is-active")
    );
  }

  function allFiltersActive() {
    return ["borough", "type"].every((filterName) => allInGroupActive(filterName));
  }

  function selections() {
    return {
      borough: activeValues("borough"),
      type: activeValues("type")
    };
  }

  function updateCountText(visible) {
    const query = searchTerm.trim();
    const tokenLabel = visible === 1 ? "collection token" : "collection tokens";

    if (query) {
      count.textContent = `Showing ${visible} ${tokenLabel} for "${query}".`;
      return;
    }

    if (visible === cards.length && allFiltersActive()) {
      count.textContent = "Showing all collection tokens.";
      return;
    }

    count.textContent = `Showing ${visible} of ${cards.length} collection tokens.`;
  }

  function updateEmptyState(visible) {
    if (!emptyState) return;

    const title = emptyState.querySelector("[data-browse-empty-title]");
    const query = searchTerm.trim();

    emptyState.hidden = visible > 0;

    if (!title) return;

    if (query) {
      title.textContent = `No collection tokens found for "${query}".`;
    } else {
      title.textContent = "No collection tokens matched the selected filters.";
    }
  }

  function cardTypes(card) {
    return (card.dataset.types || "").split(" ").filter(Boolean);
  }

  function cardMatches(card, selected, search = "") {
    const matchesFilters =
      selected.borough.includes(card.dataset.borough) &&
      cardTypes(card).some((type) => selected.type.includes(type));

    if (!search) {
      return matchesFilters;
    }

    const cardSearch = card.dataset.search || "";
    return matchesFilters && cardSearch.includes(search.toLowerCase());
  }

  function updateChipCounts(selected) {
    chips.forEach((chip) => {
      const filterName = chip.dataset.filter;
      const value = chip.dataset.value;
      const countEl = chip.querySelector(".browse-chip-count");

      const test = {
        borough: filterName === "borough" ? [value] : selected.borough,
        type: filterName === "type" ? [value] : selected.type
      };

      const chipCount = cards.filter((card) =>
        cardMatches(card, test, searchTerm)
      ).length;
      const groupIsNarrowed = !allInGroupActive(filterName);
      const chipIsSelectedInNarrowedGroup =
        groupIsNarrowed && chip.classList.contains("is-active");
      const shouldHide = chipCount === 0 && !chipIsSelectedInNarrowedGroup;

      countEl.textContent = chipCount;
      chip.hidden = shouldHide;
      chip.style.display = shouldHide ? "none" : "";
    });
  }

  function syncChipPressedState() {
    chips.forEach((chip) => {
      chip.setAttribute(
        "aria-pressed",
        chip.classList.contains("is-active") ? "true" : "false"
      );
    });
  }

  function ensureAtLeastOneActive(filterName, fallbackChip) {
    if (!activeValues(filterName).length) {
      fallbackChip.classList.add("is-active");
    }
  }

  function writeHash() {
    const selected = selections();
    const params = new URLSearchParams();

    params.set("borough", selected.borough.join(","));
    params.set("type", selected.type.join(","));

    history.replaceState(null, "", "#" + params.toString());
  }

  function readHash() {
    if (!location.hash || location.hash.length < 2) {
      return;
    }

    const params = new URLSearchParams(location.hash.slice(1));

    ["borough", "type"].forEach((filterName) => {
      const values = (params.get(filterName) || "").split(",").filter(Boolean);

      if (!values.length) return;

      groupChips(filterName).forEach((chip) => {
        chip.classList.toggle("is-active", values.includes(chip.dataset.value));
      });
    });
  }

  function applyFilters(updateUrl = true) {
    const selected = selections();
    let visible = 0;

    cards.forEach((card) => {
      const match = cardMatches(card, selected, searchTerm);
      card.style.display = match ? "" : "none";

      if (match) visible++;
    });

    updateCountText(visible);
    updateEmptyState(visible);

    updateChipCounts(selected);
    syncChipPressedState();

    if (updateUrl) {
      writeHash();
    }
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", function () {
      const filterName = chip.dataset.filter;

      if (allInGroupActive(filterName)) {
        groupChips(filterName).forEach((other) =>
          other.classList.remove("is-active")
        );
        chip.classList.add("is-active");
      } else {
        chip.classList.toggle("is-active");
        ensureAtLeastOneActive(filterName, chip);
      }

      applyFilters();
    });
  });

  groupActions.forEach((button) => {
    button.addEventListener("click", function () {
      groupChips(button.dataset.filter).forEach((chip) =>
        chip.classList.add("is-active")
      );

      applyFilters();
    });
  });

  reset.addEventListener("click", function () {
    chips.forEach((chip) => chip.classList.add("is-active"));
    searchTerm = "";
    searchInput.value = "";
    applyFilters();
  });

  // Search input with debouncing
  searchInput.addEventListener("input", function () {
    clearTimeout(searchTimeout);
    searchTerm = this.value;

    searchTimeout = setTimeout(() => {
      applyFilters();
    }, 150);
  });

  readHash();
  applyFilters(false);
})();
