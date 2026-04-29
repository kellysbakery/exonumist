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
})();
