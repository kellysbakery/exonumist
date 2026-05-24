(() => {
  const STORAGE_KEY = "exonumistForSaleInquiry";
  const MAX_EMAIL_TOKENS = 50;
  const EMAIL_ADDRESS = "contact@exonumist.com";
  const EMAIL_SUBJECT = "Token availability inquiry";

  const selected = new Map();

  function loadSelections() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

      if (!Array.isArray(parsed)) return;

      parsed.forEach((item) => {
        if (!item || !item.catalogId) return;

        selected.set(item.catalogId, {
          catalogId: String(item.catalogId),
          catalogValue: String(item.catalogValue || ""),
          groupName: String(item.groupName || "")
        });
      });
    } catch {
      selected.clear();
    }
  }

  function saveSelections() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...selected.values()]));
    } catch {
      // If storage is unavailable, keep the in-page inquiry list working.
    }
  }

  function pluralizeToken(count) {
    return `${count} ${count === 1 ? "token" : "tokens"} selected`;
  }

  function pluralize(count, singular, plural) {
    return `${count} ${count === 1 ? singular : plural}`;
  }

  function normalizeCatalogId(value) {
    return String(value || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  }

  function getRowToken(row) {
    return {
      catalogId: row.dataset.catalogId || "",
      catalogValue: row.dataset.catalogValue || "",
      groupName: row.dataset.groupName || ""
    };
  }

  function setButtonState(button, catalogId, isSelected) {
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", isSelected ? "true" : "false");
    button.setAttribute(
      "aria-label",
      `${isSelected ? "Remove" : "Add"} ${catalogId} ${isSelected ? "from" : "to"} inquiry list`
    );
    button.textContent = isSelected ? "Added ✓" : "Add";
  }

  function getAvailableTokenMap() {
    const available = new Map();

    document.querySelectorAll("[data-sale-item]").forEach((row) => {
      const token = getRowToken(row);
      const normalized = normalizeCatalogId(token.catalogId);

      if (normalized && !available.has(normalized)) {
        available.set(normalized, token);
      }
    });

    return available;
  }

  function parseWantListEntries(value) {
    const candidates = new Set();
    const catalogPattern =
      /\b[A-Za-z]{1,3}[\s._,-]*\d{1,5}[\s._,-]*[A-Za-z]{0,4}\b/g;
    const matches = String(value || "").match(catalogPattern) || [];

    matches.forEach((match) => {
      const normalized = normalizeCatalogId(match);

      if (/^[A-Z]{1,3}\d{1,5}[A-Z]{0,4}$/.test(normalized)) {
        candidates.add(normalized);
      }
    });

    return [...candidates];
  }

  function formatNotFound(candidates) {
    if (!candidates.length) return "";

    const visible = candidates.slice(0, 20).join(", ");
    const remaining = candidates.length - 20;

    return remaining > 0
      ? ` Not found: ${visible}, and ${remaining} more.`
      : ` Not found: ${visible}.`;
  }

  function buildMailtoUrl() {
    const lines = [...selected.values()].map(
      (item) => `- ${item.catalogId} — Catalog value: ${item.catalogValue}`
    );
    const body = [
      "Hello,",
      "",
      "I am interested in the following duplicate transportation tokens listed on exonumist.com:",
      "",
      ...lines,
      "",
      "Please let me know whether these are currently available and what the total would be.",
      "",
      "Thank you."
    ].join("\n");

    return `mailto:${EMAIL_ADDRESS}?subject=${encodeURIComponent(
      EMAIL_SUBJECT
    )}&body=${encodeURIComponent(body)}`;
  }

  function render() {
    const count = selected.size;
    const countText = pluralizeToken(count);
    const isOverLimit = count > MAX_EMAIL_TOKENS;
    const canEmail = count > 0 && !isOverLimit;

    document.querySelectorAll("[data-inquiry-count]").forEach((element) => {
      element.textContent = countText;
    });

    document.querySelectorAll("[data-inquiry-bar-count]").forEach((element) => {
      element.textContent = countText;
    });

    document
      .querySelectorAll("[data-inquiry-email], [data-inquiry-bar-email]")
      .forEach((button) => {
        button.disabled = !canEmail;
      });

    document
      .querySelectorAll("[data-inquiry-clear], [data-inquiry-bar-clear]")
      .forEach((button) => {
        button.disabled = count === 0;
      });

    document.querySelectorAll("[data-inquiry-warning]").forEach((warning) => {
      warning.hidden = !isOverLimit;
    });

    document.querySelectorAll("[data-inquiry-bar]").forEach((bar) => {
      bar.hidden = count === 0;
      bar.classList.toggle("is-visible", count > 0);
    });

    document.querySelectorAll("[data-sale-item]").forEach((row) => {
      const token = getRowToken(row);
      const button = row.querySelector("[data-inquiry-toggle]");

      if (!button || !token.catalogId) return;

      setButtonState(button, token.catalogId, selected.has(token.catalogId));
    });
  }

  function toggleSelection(row) {
    const token = getRowToken(row);

    if (!token.catalogId) return;

    if (selected.has(token.catalogId)) {
      selected.delete(token.catalogId);
    } else {
      selected.set(token.catalogId, token);
    }

    saveSelections();
    render();
  }

  function matchWantList() {
    const input = document.querySelector("[data-want-list-input]");
    const result = document.querySelector("[data-want-list-result]");

    if (!input || !result) return;

    const available = getAvailableTokenMap();
    const candidates = parseWantListEntries(input.value);
    let matched = 0;
    let alreadySelected = 0;
    let added = 0;
    const unmatched = [];

    candidates.forEach((candidate) => {
      const token = available.get(candidate);

      if (!token) {
        unmatched.push(candidate);
        return;
      }

      matched += 1;

      if (selected.has(token.catalogId)) {
        alreadySelected += 1;
        return;
      }

      selected.set(token.catalogId, token);
      added += 1;
    });

    if (added > 0) {
      saveSelections();
      render();
    }

    if (matched > 0 && alreadySelected > 0) {
      result.textContent = `Matched ${pluralize(
        matched,
        "token",
        "tokens"
      )}. ${alreadySelected} ${alreadySelected === 1 ? "was" : "were"} already in your inquiry list.${formatNotFound(
        unmatched
      )}`;
      return;
    }

    if (matched > 0) {
      result.textContent = `Matched ${pluralize(
        matched,
        "token",
        "tokens"
      )} and added ${added === 1 ? "it" : "them"} to your inquiry list.${formatNotFound(
        unmatched
      )}`;
      return;
    }

    result.textContent = `No available tokens matched your want list.${formatNotFound(
      unmatched
    )}`;
  }

  function clearWantList() {
    const input = document.querySelector("[data-want-list-input]");
    const result = document.querySelector("[data-want-list-result]");

    if (input) {
      input.value = "";
    }

    if (result) {
      result.textContent = "";
    }
  }

  function clearSelections() {
    selected.clear();
    saveSelections();
    render();
  }

  function emailInquiry() {
    if (!selected.size || selected.size > MAX_EMAIL_TOKENS) return;

    window.location.href = buildMailtoUrl();
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!document.querySelector("[data-inquiry-bar]")) return;

    loadSelections();

    document.querySelectorAll("[data-inquiry-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        const row = button.closest("[data-sale-item]");

        if (row) {
          toggleSelection(row);
        }
      });
    });

    document
      .querySelectorAll("[data-inquiry-clear], [data-inquiry-bar-clear]")
      .forEach((button) => {
        button.addEventListener("click", clearSelections);
      });

    document.querySelectorAll("[data-want-list-match]").forEach((button) => {
      button.addEventListener("click", matchWantList);
    });

    document.querySelectorAll("[data-want-list-clear]").forEach((button) => {
      button.addEventListener("click", clearWantList);
    });

    document
      .querySelectorAll("[data-inquiry-email], [data-inquiry-bar-email]")
      .forEach((button) => {
        button.addEventListener("click", emailInquiry);
      });

    render();
  });
})();
