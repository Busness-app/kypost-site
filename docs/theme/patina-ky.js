(function () {
  const THEME = "patina-ky";
  const LABEL = "Patina Ky";

  function injectButton() {
    const list = document.getElementById("mdbook-theme-list");
    if (!list || document.getElementById("mdbook-theme-" + THEME)) return;
    const li = document.createElement("li");
    li.setAttribute("role", "none");
    const btn = document.createElement("button");
    btn.setAttribute("role", "menuitem");
    btn.className = "theme";
    btn.id = "mdbook-theme-" + THEME;
    btn.textContent = LABEL;
    li.appendChild(btn);
    list.appendChild(li);
  }

  function fixHighlightForPatina() {
    const hl = document.getElementById("mdbook-highlight-css");
    const tn = document.getElementById("mdbook-tomorrow-night-css");
    const ayu = document.getElementById("mdbook-ayu-highlight-css");
    if (hl && tn && ayu) {
      hl.disabled = true;
      tn.disabled = false;
      ayu.disabled = true;
    }
  }

  function applyRestore() {
    try {
      const saved = localStorage.getItem("mdbook-theme");
      if (saved !== THEME) return;
      const html = document.documentElement;
      // book.js may have fallen back to default because THEME wasn't in themeIds at parse time
      if (!html.classList.contains(THEME)) {
        html.classList.remove("light", "rust", "coal", "navy", "ayu");
        html.classList.add(THEME);
        fixHighlightForPatina();
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
          setTimeout(function () {
            try {
              meta.content = getComputedStyle(document.documentElement).backgroundColor;
            } catch (e) {}
          }, 1);
        }
      } else {
        fixHighlightForPatina();
      }
      const list = document.getElementById("mdbook-theme-list");
      if (list) {
        list.querySelectorAll(".theme-selected").forEach(function (el) {
          el.classList.remove("theme-selected");
        });
        const sel = document.getElementById("mdbook-theme-" + THEME);
        if (sel) sel.classList.add("theme-selected");
      }
    } catch (e) {}
  }

  function init() {
    injectButton();
    applyRestore();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  window.addEventListener("load", init);

  // After a user clicks Patina Ky, book.js will handle the switch but will
  // have enabled the wrong highlight (it treats unknown themes as light).
  // Correct it on the next tick.
  document.addEventListener("click", function (e) {
    const t = e.target.closest ? e.target.closest("#mdbook-theme-" + THEME) : null;
    if (!t) return;
    setTimeout(function () {
      fixHighlightForPatina();
      applyRestore();
    }, 20);
  });
})();
