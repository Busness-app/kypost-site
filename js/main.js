(() => {
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  const setNavOpen = (open) => {
    navLinks?.classList.toggle("open", open);
    navToggle?.setAttribute("aria-expanded", String(open));
    navToggle?.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  };

  navToggle?.addEventListener("click", () => {
    setNavOpen(!navLinks?.classList.contains("open"));
  });

  navLinks?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setNavOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navLinks?.classList.contains("open")) {
      setNavOpen(false);
      navToggle?.focus();
    }
  });

  const sections = [...document.querySelectorAll("main section[id]")];
  const navAnchors = [...document.querySelectorAll(".nav-links a")];

  const spyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navAnchors.forEach((a) => {
          a.classList.toggle("active", a.getAttribute("href") === `#${id}`);
        });
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );

  sections.forEach((section) => spyObserver.observe(section));

  const scroller = document.querySelector(".theme-demo-scroller");
  const layers = [...document.querySelectorAll(".theme-layer")];
  const dots = [...document.querySelectorAll(".theme-dots span")];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (scroller && layers.length) {
    const steps = layers.length - 1;

    const update = () => {
      const rect = scroller.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const overall = total > 0 ? scrolled / total : 0;
      const stepProgress = overall * steps;

      layers.forEach((layer, i) => {
        if (i === 0) return;
        const localProgress = Math.min(Math.max(stepProgress - (i - 1), 0), 1);
        const leftInset = reduceMotion ? (localProgress >= 1 ? 0 : 100) : (1 - localProgress) * 100;
        layer.style.clipPath = `inset(0 0 0 ${leftInset}%)`;
      });

      const nearestLayer = Math.min(Math.round(stepProgress), steps);
      dots.forEach((dot, i) => dot.classList.toggle("active", i === nearestLayer));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }
})();
