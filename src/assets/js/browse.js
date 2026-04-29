(function () {
  const chips = [...document.querySelectorAll(".browse-chip")];
  const groupActions = [...document.querySelectorAll(".browse-group-action")];
  const cards = [...document.querySelectorAll(".browse-card")];
  const count = document.getElementById("browse-count");
  const reset = document.getElementById("browse-reset");

  function groupChips(filterName) {
    return chips.filter(chip => chip.dataset.filter === filterName);
  }

  function activeValues(filterName) {
    return groupChips(filterName)
      .filter(chip => chip.classList.contains("is-active"))
      .map(chip => chip.dataset.value);
  }

  function allInGroupActive(filterName) {
    return groupChips(filterName).every(chip =>
      chip.classList.contains("is-active")
    );
  }

  function selections() {
    return {
      borough: activeValues("borough"),
      type: activeValues("type")
    };
  }

  function cardTypes(card) {
    return (card.dataset.types || "").split(" ").filter(Boolean);
  }

  function cardMatches(card, selected) {
    return (
      selected.borough.includes(card.dataset.borough) &&
      cardTypes(card).some(type => selected.type.includes(type))
    );
  }

  function updateChipCounts(selected) {
    chips.forEach(chip => {
      const filterName = chip.dataset.filter;
      const value = chip.dataset.value;
      const countEl = chip.querySelector(".browse-chip-count");

      const test = {
        borough: filterName === "borough" ? [value] : selected.borough,
        type: filterName === "type" ? [value] : selected.type
      };

      countEl.textContent =
        cards.filter(card => cardMatches(card, test)).length;
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

    ["borough", "type"].forEach(filterName => {
      const values = (params.get(filterName) || "")
        .split(",")
        .filter(Boolean);

      if (!values.length) return;

      groupChips(filterName).forEach(chip => {
        chip.classList.toggle(
          "is-active",
          values.includes(chip.dataset.value)
        );
      });
    });
  }

  function applyFilters(updateUrl = true) {
    const selected = selections();
    let visible = 0;

    cards.forEach(card => {
      const match = cardMatches(card, selected);
      card.style.display = match ? "" : "none";

      if (match) visible++;
    });

    count.textContent =
      `${visible} of ${cards.length} shown`;

    updateChipCounts(selected);

    if (updateUrl) {
      writeHash();
    }
  }

  chips.forEach(chip => {
    chip.addEventListener("click", function () {
      const filterName = chip.dataset.filter;

      if (allInGroupActive(filterName)) {
        groupChips(filterName).forEach(other =>
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

  groupActions.forEach(button => {
    button.addEventListener("click", function () {
      groupChips(button.dataset.filter).forEach(chip =>
        chip.classList.add("is-active")
      );

      applyFilters();
    });
  });

  reset.addEventListener("click", function () {
    chips.forEach(chip => chip.classList.add("is-active"));
    applyFilters();
  });

  readHash();
  applyFilters(false);
})();

