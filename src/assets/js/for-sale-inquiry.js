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
    if (!document.querySelector("[data-inquiry-panel]")) return;

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

    document
      .querySelectorAll("[data-inquiry-email], [data-inquiry-bar-email]")
      .forEach((button) => {
        button.addEventListener("click", emailInquiry);
      });

    render();
  });
})();
