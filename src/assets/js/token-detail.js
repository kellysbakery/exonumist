(function () {
  function setupNotes() {
    const grids = document.querySelectorAll(".token-lower-grid");

    grids.forEach((grid) => {
      const quickFactsSection = grid.querySelector(".token-quickfacts");
      const notesSection = grid.querySelector(".token-notes-section");
      const notesFrame = grid.querySelector(".js-notes-frame");
      const notesContent = grid.querySelector(".js-notes-content");
      const notesMore = grid.querySelector(".js-notes-more");

      if (
        !quickFactsSection ||
        !notesSection ||
        !notesFrame ||
        !notesContent ||
        !notesMore
      ) {
        return;
      }

      notesSection.style.minHeight = "";
      notesFrame.style.height = "";
      notesFrame.classList.remove("is-collapsed", "is-expanded");
      notesMore.hidden = true;
      notesMore.setAttribute("aria-expanded", "false");
      notesMore.textContent = "Read more";

      const heading = notesSection.querySelector("h2");
      const headingHeight = heading ? heading.offsetHeight + 14 : 48;

      const isMobile = window.matchMedia("(max-width: 700px)").matches;

      if (isMobile) {
        notesFrame.classList.add("is-expanded");
        notesFrame.classList.remove("is-collapsed");
        notesMore.hidden = true;
        notesFrame.style.height = "auto";
        notesSection.style.minHeight = "";
        return;
      }

      const quickFactsHeight = quickFactsSection.offsetHeight;
      if (!quickFactsHeight) return;

      const frameHeight = Math.max(140, quickFactsHeight - headingHeight - 42);

      notesSection.style.minHeight = quickFactsHeight + "px";
      notesFrame.style.height = frameHeight + "px";

      const needsToggle =
        notesContent.scrollHeight > notesFrame.clientHeight + 2;

      if (needsToggle) {
        notesFrame.classList.add("is-collapsed");
        notesMore.hidden = false;
      } else {
        notesFrame.classList.add("is-expanded");
      }

      notesMore.onclick = function () {
        const isExpanded = notesFrame.classList.contains("is-expanded");

        if (isExpanded) {
          notesFrame.classList.remove("is-expanded");
          notesFrame.classList.add("is-collapsed");
          notesFrame.style.height = frameHeight + "px";
          notesMore.textContent = "Read more";
          notesMore.setAttribute("aria-expanded", "false");
        } else {
          notesFrame.classList.remove("is-collapsed");
          notesFrame.classList.add("is-expanded");
          notesFrame.style.height = notesContent.scrollHeight + 8 + "px";
          notesMore.textContent = "Show less";
          notesMore.setAttribute("aria-expanded", "true");
        }
      };
    });
  }

  window.addEventListener("load", setupNotes);
  window.addEventListener("resize", setupNotes);

  // Image modal functionality
  const modal = document.getElementById("image-modal");
  const modalImg = document.getElementById("modal-image");
  const closeBtn = document.querySelector(".image-modal-close");
  let previouslyFocusedElement = null;

  function openModal(img, trigger) {
    previouslyFocusedElement = trigger || document.activeElement;
    modal.style.display = "flex";
    modalImg.src = img.src;
    modalImg.alt = img.alt;
    closeBtn.focus();
  }

  function closeModal() {
    modal.style.display = "none";
    modalImg.src = "";
    modalImg.alt = "";

    if (
      previouslyFocusedElement &&
      typeof previouslyFocusedElement.focus === "function"
    ) {
      previouslyFocusedElement.focus();
    }
  }

  document.querySelectorAll(".token-image-button").forEach((button) => {
    button.addEventListener("click", function () {
      const img = this.querySelector(".token-image");
      if (!img) return;

      openModal(img, this);
    });
  });

  document.querySelectorAll(".token-image").forEach((img) => {
    img.addEventListener("click", function () {
      if (this.closest(".token-image-button")) return;

      modal.style.display = "flex";
      modalImg.src = this.src;
      modalImg.alt = this.alt;
    });
  });

  closeBtn.addEventListener("click", function () {
    closeModal();
  });

  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && modal.style.display !== "none") {
      closeModal();
    }
  });

  // Preload images for prev/next tokens
  function preloadImage(url) {
    if (url) {
      const img = new Image();
      img.src = url;
    }
  }

  const prevLink = document.querySelector(".token-pager-prev a");
  if (prevLink) {
    preloadImage(prevLink.dataset.prevObverse);
    preloadImage(prevLink.dataset.prevReverse);
  }

  const nextLink = document.querySelector(".token-pager-next a");
  if (nextLink) {
    preloadImage(nextLink.dataset.nextObverse);
    preloadImage(nextLink.dataset.nextReverse);
  }

  // Preload HTML on hover for pagination links
  const prefetchedPages = new Set();
  document.querySelectorAll(".token-pager-link").forEach((link) => {
    link.addEventListener("mouseenter", function () {
      const href = this.href;
      if (!prefetchedPages.has(href)) {
        prefetchedPages.add(href);
        fetch(href).catch(() => {});
      }
    });
  });
})();
