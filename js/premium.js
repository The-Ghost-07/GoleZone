
/* GoalZone premium entrance/reveal layer. No commerce logic is changed. */
(function () {
  function setupReveal() {
    const targets = [
      ".section", ".results", ".filters", ".auth-card", ".acct", ".order",
      ".detail-section", ".buybox", ".topbar", ".newsletter", ".footer-cols"
    ];
    const cards = [
      ".pcard", ".cat-tile", ".circle", ".brand-strip span"
    ];

    document.querySelectorAll(targets.join(",")).forEach(el => {
      if (!el.classList.contains("hero")) el.classList.add("reveal");
    });
    document.querySelectorAll(cards.join(",")).forEach((el, i) => {
      el.classList.add("stagger-item");
      el.style.transitionDelay = Math.min((i % 6) * 55, 275) + "ms";
    });
    document.querySelectorAll(".hero").forEach(el => {
      el.classList.add("reveal-scale");
      requestAnimationFrame(() => el.classList.add("revealed"));
    });

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      document.querySelectorAll(".reveal,.reveal-scale,.stagger-item")
        .forEach(el => el.classList.add("revealed"));
      return;
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.10, rootMargin: "0px 0px -35px 0px" });

    document.querySelectorAll(".reveal,.reveal-scale,.stagger-item")
      .forEach(el => io.observe(el));

    // Main.js/components.js can populate cards after this script starts.
    const mo = new MutationObserver(() => {
      document.querySelectorAll(".pcard,.cat-tile,.circle").forEach((el, i) => {
        if (!el.classList.contains("stagger-item")) {
          el.classList.add("stagger-item");
          el.style.transitionDelay = Math.min((i % 6) * 55, 275) + "ms";
          io.observe(el);
        }
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupReveal);
  } else {
    setupReveal();
  }
})();
