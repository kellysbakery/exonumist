(() => {
  const STORAGE_KEY = "exonumistForSaleInquiry";
    const EMAIL_ADDRESS = "contact@exonumist.com";
  const EMAIL_SUBJECT = "Token availability inquiry";
  const GENERAL_EMAIL_SUBJECT = "Exonumist inquiry";
  const LETTERS = "abcdefghijklmnopqrstuvwxyz";

  const selected = new Map();
  let lastReviewTrigger = null;
  let copyStatusTimer = null;

  function loadSelections() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

      if (!Array.isArray(parsed)) return;

      parsed.forEach((item) => {
        if (!item || !item.catalogId) return;

        selected.set(item.catalogId, {
          catalogId: String(item.catalogId),
          catalogValue: String(item.catalogValue || ""),
          box: String(item.box || ""),
          displayPlace: String(item.displayPlace || ""),
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

  function selectedTokenPhrase(count) {
    return `${count} selected ${count === 1 ? "token" : "tokens"}`;
  }

  function pluralize(count, singular, plural) {
    return `${count} ${count === 1 ? singular : plural}`;
  }

  function parsePrice(value) {
    const amount = Number.parseFloat(String(value || "").replace(/[^0-9.-]/g, ""));

    return Number.isFinite(amount) ? amount : 0;
  }

  function getEstimatedTotal() {
    return [...selected.values()].reduce(
      (total, item) => total + parsePrice(item.catalogValue),
      0
    );
  }

  function formatCurrency(value) {
    return `$${value.toFixed(2)}`;
  }

  function normalizeCatalogId(value) {
    return String(value || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  }

  function normalizeSortValue(value) {
    return String(value || "").trim();
  }

  function catalogSortKey(catalogId) {
    const normalized = normalizeSortValue(catalogId).toLowerCase();
    const compactMatch = normalized.match(/^([a-z]+)(\d+)([a-z]*)$/);

    if (!compactMatch) return normalized;

    return compactMatch.slice(1).filter(Boolean).join(" ");
  }

  function splitSort(value) {
    return catalogSortKey(value)
      .split(/[-_\s]+/)
      .filter(Boolean);
  }

  function letterRank(part) {
    if (!/^[a-z]+$/.test(part)) return null;

    let rank = 0;

    for (let i = 0; i < part.length; i += 1) {
      const index = LETTERS.indexOf(part[i]);
      if (index === -1) return null;
      rank = rank * 26 + index;
    }

    return part.length === 1 ? rank : 26 + rank;
  }

  function comparePart(a, b) {
    if (a === b) return 0;

    const aNumber = /^\d+$/.test(a) ? Number(a) : null;
    const bNumber = /^\d+$/.test(b) ? Number(b) : null;

    if (aNumber !== null && bNumber !== null) {
      return aNumber - bNumber;
    }

    if (aNumber !== null) return -1;
    if (bNumber !== null) return 1;

    const aLetterRank = letterRank(a);
    const bLetterRank = letterRank(b);

    if (aLetterRank !== null && bLetterRank !== null) {
      return aLetterRank - bLetterRank;
    }

    if (aLetterRank !== null) return -1;
    if (bLetterRank !== null) return 1;

    return a.localeCompare(b);
  }

  function compareSortKeys(aKey, bKey) {
    const aParts = splitSort(aKey);
    const bParts = splitSort(bKey);
    const maxLength = Math.max(aParts.length, bParts.length);

    for (let i = 0; i < maxLength; i += 1) {
      const aPart = aParts[i];
      const bPart = bParts[i];

      if (aPart === undefined) return -1;
      if (bPart === undefined) return 1;

      const result = comparePart(aPart, bPart);
      if (result !== 0) return result;
    }

    return 0;
  }

  function compareInquiryItems(a, b) {
    const aCatalogId = normalizeSortValue(a.catalogId);
    const bCatalogId = normalizeSortValue(b.catalogId);
    const result = compareSortKeys(aCatalogId, bCatalogId);

    if (result !== 0) return result;

    return aCatalogId.localeCompare(bCatalogId, undefined, {
      numeric: true,
      sensitivity: "base"
    });
  }

  function getRowToken(row) {
    return {
      catalogId: row.dataset.catalogId || "",
      catalogValue: row.dataset.catalogValue || "",
      box: row.dataset.box || "",
      displayPlace: row.dataset.displayPlace || "",
      groupName: row.dataset.groupName || ""
    };
  }

  function hydrateSelectionsFromRows() {
    const available = getAvailableTokenMap();

    selected.forEach((item, catalogId) => {
      const normalized = normalizeCatalogId(catalogId);
      const fresh = available.get(normalized);

      if (!fresh) return;

      selected.set(catalogId, {
        ...item,
        catalogValue: item.catalogValue || fresh.catalogValue,
        box: item.box || fresh.box,
        displayPlace: item.displayPlace || fresh.displayPlace,
        groupName: item.groupName || fresh.groupName
      });
    });
  }

  function setButtonState(button, catalogId, isSelected) {
    button.closest("[data-sale-item]")?.classList.toggle("is-selected", isSelected);
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", isSelected ? "true" : "false");
    button.setAttribute(
      "aria-label",
      `${isSelected ? "Remove" : "Add"} ${catalogId} ${isSelected ? "from" : "to"} inquiry list`
    );
    button.textContent = isSelected ? "Added ✓" : "Add";
  }

  function getTokenTargetId(catalogId) {
    return `available-token-${String(catalogId || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}`;
  }

  function createInquiryRow(item) {
    const row = document.createElement("div");
    const catalogId = document.createElement("a");
    const meta = document.createElement("span");
    const groupName = document.createElement("span");
    const value = document.createElement("span");
    const price = document.createElement("span");
    const remove = document.createElement("button");

    row.className = "inquiry-list-row";

    catalogId.className = "inquiry-list-token";
    catalogId.href = `#${getTokenTargetId(item.catalogId)}`;
    catalogId.textContent = item.catalogId;

    meta.className = "inquiry-list-meta";

    groupName.className = "inquiry-list-region";
    groupName.textContent =
      item.displayPlace || item.groupName || "Area unavailable";

    price.className = "inquiry-list-price";
    price.textContent = item.catalogValue || "Price unavailable";

    value.className = "inquiry-list-value";
    value.append(price);

    if (item.box) {
      const box = document.createElement("span");

      box.className = "inquiry-list-box";
      box.textContent = `Box ${item.box}`;
      value.append(box);
    }

    remove.className = "inquiry-list-remove";
    remove.type = "button";
    remove.dataset.inquiryRemove = item.catalogId;
    remove.setAttribute("aria-label", `Remove ${item.catalogId} from inquiry list`);
    remove.textContent = "Remove";

    meta.append(groupName, value);
    row.append(catalogId, meta, remove);

    return row;
  }

  function createInquiryListHeader() {
    const header = document.createElement("div");

    header.className = "inquiry-list-header";
    header.setAttribute("aria-hidden", "true");

    ["Catalog ID", "Place", "Price", "Remove"].forEach((label) => {
      const span = document.createElement("span");

      span.textContent = label;
      header.append(span);
    });

    return header;
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

  function buildGeneralMailtoUrl() {
    const body = [
      "Hello,",
      "",
      "I have a question about available duplicate transportation tokens listed on exonumist.com.",
      "",
      "Thank you."
    ].join("\n");

    return `mailto:${EMAIL_ADDRESS}?subject=${encodeURIComponent(
      GENERAL_EMAIL_SUBJECT
    )}&body=${encodeURIComponent(body)}`;
  }

  function buildSelectedInquiryBody() {
    const lines = [...selected.values()].map(
      (item) => {
        const box = item.box ? ` - Box ${item.box}` : "";

        return `- ${item.catalogId} - ${
          item.displayPlace || item.groupName || "Area unavailable"
        } - Price: ${item.catalogValue || "unavailable"}${box}`;
      }
    );
    const estimatedTotal = formatCurrency(getEstimatedTotal());

    return [
      "Hello,",
      "",
      "I am interested in the following duplicate transportation tokens listed on exonumist.com:",
      "",
      ...lines,
      "",
      `Estimated total: ${estimatedTotal}`,
      "",
      "Please confirm whether these are currently available.",
      "",
      "Thank you."
    ].join("\n");
  }

  function buildSelectedMailtoUrl() {
    return `mailto:${EMAIL_ADDRESS}?subject=${encodeURIComponent(
      EMAIL_SUBJECT
    )}&body=${encodeURIComponent(buildSelectedInquiryBody())}`;
  }

  function buildMailtoUrl() {
    return selected.size ? buildSelectedMailtoUrl() : buildGeneralMailtoUrl();
  }

  function render() {
    const count = selected.size;
    const countText = pluralizeToken(count);
    const estimatedTotalText = `Estimated total: ${formatCurrency(getEstimatedTotal())}`;
    const countWithTotalText = `${countText} · ${estimatedTotalText}`;
    const isOverLimit = false;
    const canEmail = true;
    const mailtoUrl = buildMailtoUrl();

    document.querySelectorAll("[data-inquiry-count]").forEach((element) => {
      element.textContent = countText;
    });

    document.querySelectorAll("[data-inquiry-bar-count]").forEach((element) => {
      element.replaceChildren();

      const countSpan = document.createElement("span");
      const totalSpan = document.createElement("span");

      countSpan.className = "inquiry-count-selected";
      countSpan.textContent = countText;

      totalSpan.className = "inquiry-count-total";
      totalSpan.textContent = estimatedTotalText;

      element.append(countSpan, totalSpan);
    });

    document.querySelectorAll("[data-inquiry-sticky-count]").forEach((element) => {
      element.textContent = countWithTotalText;
    });

    document
      .querySelectorAll("[data-inquiry-email], [data-inquiry-bar-email]")
      .forEach((control) => {
        if (control.tagName.toLowerCase() === "a") {
          control.toggleAttribute("href", canEmail);

          if (canEmail) {
            control.href = mailtoUrl;
            control.removeAttribute("tabindex");
          } else {
            control.removeAttribute("href");
            control.setAttribute("tabindex", "-1");
          }

          control.setAttribute("aria-disabled", canEmail ? "false" : "true");
          return;
        }

        control.disabled = !canEmail;
      });

    document.querySelectorAll("[data-inquiry-email-label]").forEach((label) => {
      label.textContent = count > 0 ? "Confirm availability" : "Contact me";
    });

    document
      .querySelectorAll("[data-inquiry-clear], [data-inquiry-bar-clear]")
      .forEach((button) => {
        button.disabled = count === 0;
      });

    document.querySelectorAll("[data-inquiry-copy]").forEach((button) => {
      button.disabled = count === 0;
    });

    document.querySelectorAll("[data-inquiry-warning]").forEach((warning) => {
      warning.hidden = true;
    });

    document.querySelectorAll("[data-inquiry-clear-confirm-text]").forEach((text) => {
      text.textContent = `Clear ${selectedTokenPhrase(count)} from your inquiry list?`;
    });

    if (count === 0) {
      hideClearConfirmation();
      setCopyStatus("");
    }

    document.querySelectorAll("[data-inquiry-panel-title]").forEach((title) => {
      title.textContent = count > 0 ? "Review selected tokens" : "Inquiry list";
    });

    document.querySelectorAll("[data-inquiry-panel-help]").forEach((help) => {
      help.textContent =
        count > 0
          ? "Review your selected tokens below, then email me to confirm current availability."
          : "Select tokens to build an inquiry list. Availability will be confirmed by email.";
    });

    document.querySelectorAll("[data-inquiry-sticky]").forEach((tray) => {
      tray.hidden = count === 0;
    });

    document.body.classList.toggle("has-inquiry-sticky", count > 0);

    document.querySelectorAll("[data-inquiry-list]").forEach((list) => {
      list.innerHTML = "";

      if (count > 0) {
        list.append(createInquiryListHeader());
      }

      [...selected.values()].sort(compareInquiryItems).forEach((item) => {
        list.append(createInquiryRow(item));
      });
      list.hidden = count === 0;
    });

    document.querySelectorAll("[data-inquiry-empty]").forEach((empty) => {
      empty.hidden = count !== 0;
    });

    document.querySelectorAll("[data-sale-item]").forEach((row) => {
      const token = getRowToken(row);
      const button = row.querySelector("[data-inquiry-toggle]");

      if (!button || !token.catalogId) return;

      setButtonState(button, token.catalogId, selected.has(token.catalogId));
    });
  }

  function setSelections(tokens) {
    selected.clear();

    tokens.forEach((token) => {
      if (token.catalogId) {
        selected.set(token.catalogId, token);
      }
    });

    saveSelections();
    render();
  }

  function toggleSelection(row) {
    const token = getRowToken(row);

    if (!token.catalogId) return;

    const wasSelected = selected.has(token.catalogId);

    if (wasSelected) {
      selected.delete(token.catalogId);
    } else {
      selected.set(token.catalogId, token);
    }

    saveSelections();
    render();

    if (!wasSelected) {
      document.dispatchEvent(
        new CustomEvent("available:inquiry-token-added", {
          detail: {
            catalogId: token.catalogId
          }
        })
      );
    }
  }

  function matchWantList() {
    const input = document.querySelector("[data-want-list-input]");
    const result = document.querySelector("[data-want-list-result]");

    if (!input || !result) return;

    const available = getAvailableTokenMap();
    const candidates = parseWantListEntries(input.value);

    if (!candidates.length) {
      clearWantListMatch();
      return;
    }

    let matched = 0;
    const matchedCatalogIds = [];
    const matchedTokens = [];
    const unmatched = [];

    candidates.forEach((candidate) => {
      const token = available.get(candidate);

      if (!token) {
        unmatched.push(candidate);
        return;
      }

      matched += 1;
      matchedCatalogIds.push(token.catalogId);
      matchedTokens.push(token);
    });

    setSelections(matchedTokens);

    document.dispatchEvent(
      new CustomEvent("available:want-list-matched", {
        detail: {
          catalogIds: matchedCatalogIds
        }
      })
    );

    if (matched > 0) {
      result.textContent = `${pluralize(
        matched,
        "available token",
        "available tokens"
      )} matched your want list and ${matched === 1 ? "was" : "were"} added to your inquiry list.${formatNotFound(
        unmatched
      )}`;
      return;
    }

    result.textContent = `No available tokens matched your want list.${formatNotFound(
      unmatched
    )}`;
  }

  function clearWantListMatch({ clearInput = false } = {}) {
    const input = document.querySelector("[data-want-list-input]");
    const result = document.querySelector("[data-want-list-result]");

    if (input && clearInput) {
      input.value = "";
    }

    if (result) {
      result.textContent = "";
    }

    document.dispatchEvent(new CustomEvent("available:want-list-cleared"));
  }

  function clearWantList() {
    clearWantListMatch({ clearInput: true });
  }

  function hideClearConfirmation() {
    document.querySelectorAll("[data-inquiry-clear-confirm]").forEach((panel) => {
      panel.hidden = true;
    });
  }

  function showClearConfirmation(trigger) {
    const panel = document.querySelector("[data-inquiry-clear-confirm]");
    const cancel = document.querySelector("[data-inquiry-clear-cancel]");

    if (!selected.size || !panel) return;

    panel.hidden = false;
    cancel?.focus();
  }

  function requestClearSelections(event) {
    event?.preventDefault();

    if (!selected.size) return;

    showClearConfirmation(event?.currentTarget);
  }

  function clearSelections() {
    selected.clear();
    hideClearConfirmation();
    saveSelections();
    render();

    if (!selected.size) {
      closeInquiryDialog();
    }
  }

  function removeSelection(catalogId) {
    selected.delete(catalogId);
    saveSelections();
    render();

    if (!selected.size) {
      closeInquiryDialog();
    }
  }

  function emailInquiry(event) {
    if (selected.size > MAX_EMAIL_TOKENS) {
      event?.preventDefault();
      return;
    }

    const target = event?.currentTarget;

    if (target?.tagName?.toLowerCase() === "a") return;

    window.location.href = buildMailtoUrl();
  }

  function setCopyStatus(message) {
    document.querySelectorAll("[data-inquiry-copy-status]").forEach((status) => {
      status.textContent = message;
      status.hidden = !message;
    });

    if (copyStatusTimer) {
      window.clearTimeout(copyStatusTimer);
      copyStatusTimer = null;
    }

    if (message) {
      copyStatusTimer = window.setTimeout(() => {
        document.querySelectorAll("[data-inquiry-copy-status]").forEach((status) => {
          status.textContent = "";
          status.hidden = true;
        });
        copyStatusTimer = null;
      }, 4000);
    }
  }

  async function copyInquiryText() {
    if (!selected.size) return;

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(buildSelectedInquiryBody());
      setCopyStatus("Inquiry text copied.");
    } catch {
      setCopyStatus(
        "Could not copy automatically. Please select and copy the inquiry text manually."
      );
    }
  }

  function openInquiryDialog(trigger) {
    const dialog = document.querySelector("[data-inquiry-dialog]");
    const heading = document.querySelector("[data-inquiry-panel-heading]");

    if (!dialog) return;

    lastReviewTrigger = trigger || document.activeElement;
    render();

    dialog.hidden = false;
    document.body.classList.add("has-inquiry-dialog");
    heading?.focus({ preventScroll: true });
  }

  function closeInquiryDialog({ restoreFocus = true } = {}) {
    const dialog = document.querySelector("[data-inquiry-dialog]");

    if (!dialog || dialog.hidden) return;

    dialog.hidden = true;
    document.body.classList.remove("has-inquiry-dialog");
    hideClearConfirmation();
    setCopyStatus("");

    if (
      restoreFocus &&
      lastReviewTrigger &&
      typeof lastReviewTrigger.focus === "function" &&
      document.contains(lastReviewTrigger)
    ) {
      lastReviewTrigger.focus();
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!document.querySelector("[data-inquiry-panel]")) return;

    loadSelections();
    hydrateSelectionsFromRows();
    saveSelections();

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
        button.addEventListener("click", requestClearSelections);
      });

    document.querySelectorAll("[data-inquiry-clear-cancel]").forEach((button) => {
      button.addEventListener("click", hideClearConfirmation);
    });

    document
      .querySelectorAll("[data-inquiry-clear-confirm-action]")
      .forEach((button) => {
        button.addEventListener("click", clearSelections);
      });

    document.querySelectorAll("[data-inquiry-copy]").forEach((button) => {
      button.addEventListener("click", copyInquiryText);
    });

    document.querySelectorAll("[data-inquiry-review]").forEach((button) => {
      button.addEventListener("click", () => {
        openInquiryDialog(button);
      });
    });

    document.querySelectorAll("[data-inquiry-dialog-close]").forEach((control) => {
      control.addEventListener("click", () => {
        closeInquiryDialog();
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeInquiryDialog();
      }
    });

    document.addEventListener("click", (event) => {
      const remove = event.target.closest("[data-inquiry-remove]");

      if (remove) {
        removeSelection(remove.dataset.inquiryRemove || "");
      }
    });

    document.querySelectorAll("[data-want-list-match]").forEach((button) => {
      button.addEventListener("click", matchWantList);
    });

    document.querySelectorAll("[data-want-list-clear]").forEach((button) => {
      button.addEventListener("click", clearWantList);
    });

    document.querySelectorAll("[data-want-list-input]").forEach((input) => {
      input.addEventListener("input", () => {
        if (!input.value.trim()) {
          clearWantListMatch();
        }
      });
    });

    document
      .querySelectorAll("[data-inquiry-email], [data-inquiry-bar-email]")
      .forEach((control) => {
        control.addEventListener("click", emailInquiry);
      });

    render();
  });
})();
