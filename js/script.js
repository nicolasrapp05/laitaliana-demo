(function () {
  "use strict";

  /* Números do site oficial. Troque aqui se o cliente confirmar outro CTA. */
  const PHONES = {
    primaryHref: "tel:+554133426160",
    primaryLabel: "(41) 3342-6160",
    primaryCta: "Ligar (41) 3342-6160",
    secondaryHref: "tel:+554130396140",
    secondaryLabel: "(41) 3039-6140",
  };

  /* CLIENTE: cole o ID real (G-xxxxxxx). Enquanto tiver XXXX, o gtag não carrega. */
  const GA_ID = "G-XXXXXXXXXX";

  const root = document.documentElement;
  const menu = document.getElementById("menu-mobile");
  const toggle = document.querySelector("[data-menu-toggle]");
  const themeButtons = document.querySelectorAll("[data-theme-toggle]");
  const themeTexts = document.querySelectorAll("[data-theme-text]");
  const main = document.getElementById("conteudo");
  const footer = document.querySelector(".site-footer");
  const navSocial = document.querySelector("[data-nav-social]");
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function loadGtag() {
    if (!GA_ID || GA_ID.indexOf("XXXX") !== -1) return;
    if (document.getElementById("ga-gtag")) return;
    const src = document.createElement("script");
    src.id = "ga-gtag";
    src.async = true;
    src.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
    document.head.appendChild(src);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
  }

  function applyPhones() {
    document.querySelectorAll("[data-phone-primary]").forEach((el) => {
      if (el.tagName === "A") el.setAttribute("href", PHONES.primaryHref);
    });
    document.querySelectorAll("[data-phone-label]").forEach((el) => {
      el.textContent = PHONES.primaryLabel;
    });
    document.querySelectorAll("[data-phone-cta]").forEach((el) => {
      el.textContent = PHONES.primaryCta;
    });
  }

  function track(eventName, extra) {
    const payload = Object.assign({ event: eventName }, extra || {});
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, extra || {});
    }
  }

  function initTracking() {
    document.addEventListener("click", (event) => {
      const el = event.target.closest("[data-track]");
      if (!el) return;
      const kind = el.getAttribute("data-track");
      if (kind === "tel") {
        track("click_telefone", {
          event_category: "contato",
          event_label: el.getAttribute("href") || PHONES.primaryHref,
        });
      }
      if (kind === "map") {
        track("click_mapa", {
          event_category: "local",
          event_label: el.getAttribute("href") || "",
        });
      }
    });
  }

  function applyTheme(next, persist) {
    root.setAttribute("data-theme", next);
    if (metaTheme) metaTheme.setAttribute("content", next === "dark" ? "#102016" : "#056839");
    if (persist) {
      try {
        localStorage.setItem("li-theme", next);
      } catch (err) {
        /* private mode */
      }
    }
    themeButtons.forEach((btn) => {
      btn.setAttribute("aria-label", next === "dark" ? "Usar tema claro" : "Usar tema escuro");
    });
    themeTexts.forEach((el) => {
      el.textContent = next === "dark" ? "Tema escuro" : "Tema claro";
    });
  }

  function currentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function getFocusable(container) {
    return Array.from(
      container.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter((el) => !el.hasAttribute("hidden") && !el.closest("[inert]"));
  }

  function menuFocusables() {
    const inMenu = menu ? getFocusable(menu) : [];
    return toggle ? [toggle].concat(inMenu) : inMenu;
  }

  function setMenuLabel(open) {
    if (!toggle) return;
    const label = toggle.querySelector(".menu-toggle-label");
    if (label) label.textContent = open ? "Fechar menu" : "Abrir menu";
  }

  function setInert(el, on) {
    if (!el) return;
    el.inert = on;
  }

  function openMenu() {
    if (!menu || !toggle) return;
    menu.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    setMenuLabel(true);
    setInert(main, true);
    setInert(footer, true);
    setInert(navSocial, true);
    const first = menu.querySelector("a");
    if (first) first.focus();
  }

  function closeMenu() {
    if (!menu || !toggle) return;
    menu.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    setMenuLabel(false);
    setInert(main, false);
    setInert(footer, false);
    setInert(navSocial, false);
  }

  function isMenuOpen() {
    return menu && !menu.hidden;
  }

  function initMenu() {
    if (!toggle || !menu) return;

    toggle.addEventListener("click", () => {
      if (isMenuOpen()) closeMenu();
      else openMenu();
    });

    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    menu.addEventListener("click", (event) => {
      if (event.target === menu) {
        closeMenu();
        toggle.focus();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (!isMenuOpen()) return;

      if (event.key === "Escape") {
        closeMenu();
        toggle.focus();
        return;
      }

      if (event.key !== "Tab") return;

      const items = menuFocusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  function initTheme() {
    themeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        applyTheme(currentTheme() === "dark" ? "light" : "dark", true);
      });
    });
    applyTheme(currentTheme(), false);

    try {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = (event) => {
        try {
          if (localStorage.getItem("li-theme")) return;
        } catch (err) {
          return;
        }
        applyTheme(event.matches ? "dark" : "light", false);
      };
      if (typeof mq.addEventListener === "function") mq.addEventListener("change", onChange);
    } catch (err) {
      /* matchMedia ausente */
    }
  }

  function initMenuBoard() {
    const board = document.querySelector("[data-menu-board]");
    const dock = document.querySelector("[data-menu-dock]");
    if (!board || !dock) return;

    const tabs = Array.from(dock.querySelectorAll('[role="tab"]'));
    const panels = Array.from(board.querySelectorAll("[data-menu-panel]"));
    if (!tabs.length || !panels.length) return;

    board.classList.add("is-live");

    function showPanel(panel, on) {
      panel.classList.toggle("is-on", on);
      panel.hidden = !on;
    }

    function pinCategory(tab, panel) {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          if (scroller && tab) {
            const tabBox = tab.getBoundingClientRect();
            const scrollerBox = scroller.getBoundingClientRect();
            scroller.scrollTo({
              left:
                scroller.scrollLeft +
                tabBox.left -
                scrollerBox.left -
                (scrollerBox.width - tabBox.width) / 2,
              behavior: reduceMotion ? "auto" : "smooth",
            });
          }

          const heading = panel && panel.querySelector("h2");
          if (heading) {
            const dockBottom = dock.getBoundingClientRect().bottom;
            const headingTop = heading.getBoundingClientRect().top;
            if (headingTop < dockBottom + 8) {
              window.scrollTo({
                top: Math.max(0, window.scrollY + headingTop - dockBottom - 10),
                behavior: reduceMotion ? "auto" : "smooth",
              });
            }
          }

          syncRail();
        });
      });
    }

    function selectTab(tab, writeHash, pinTitle) {
      tabs.forEach((item) => {
        const on = item === tab;
        item.setAttribute("aria-selected", on ? "true" : "false");
        item.tabIndex = on ? 0 : -1;
      });

      const id = tab.getAttribute("aria-controls");
      panels.forEach((panel) => showPanel(panel, panel.id === id));

      if (writeHash && id && window.history && history.replaceState) {
        history.replaceState(null, "", "#" + id);
      }

      if (pinTitle) {
        pinCategory(
          tab,
          panels.find(function (panel) {
            return panel.id === id;
          })
        );
      }
    }

    const scroller = dock.querySelector("[data-menu-scroller]");
    const rail = dock.querySelector("[data-menu-rail]");
    const nextStep = dock.querySelector("[data-menu-next]");
    let dragged = false;
    let peekTimer = 0;

    function syncRail() {
      if (!scroller || !rail) return;
      const max = Math.max(scroller.scrollWidth - scroller.clientWidth, 0);
      const overflowing = max > 12;
      rail.classList.toggle("is-overflow", overflowing);
      rail.classList.toggle("is-start", scroller.scrollLeft <= 8);
      rail.classList.toggle("is-end", !overflowing || scroller.scrollLeft >= max - 8);
    }

    function markRailMoved() {
      if (rail) rail.classList.add("has-moved");
      if (peekTimer) {
        window.clearTimeout(peekTimer);
        peekTimer = 0;
      }
    }

    function stepRail(dir) {
      if (!scroller) return;
      const amount = Math.max(Math.round(scroller.clientWidth * 0.62), 148);
      scroller.scrollBy({
        left: dir * amount,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    }

    if (scroller) {
      let pressing = false;
      let startX = 0;
      let startLeft = 0;

      scroller.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        pressing = true;
        dragged = false;
        startX = event.clientX;
        startLeft = scroller.scrollLeft;
        markRailMoved();
      });

      scroller.addEventListener("pointermove", (event) => {
        if (!pressing) return;
        const dx = event.clientX - startX;
        if (!dragged && Math.abs(dx) > 8) {
          dragged = true;
          scroller.classList.add("is-dragging");
          try {
            scroller.setPointerCapture(event.pointerId);
          } catch (err) {
            /* capture opcional */
          }
        }
        if (dragged) scroller.scrollLeft = startLeft - dx;
      });

      ["pointerup", "pointercancel"].forEach((name) => {
        scroller.addEventListener(name, () => {
          pressing = false;
          scroller.classList.remove("is-dragging");
        });
      });

      scroller.addEventListener(
        "click",
        (event) => {
          if (!dragged) return;
          event.preventDefault();
          event.stopPropagation();
        },
        true
      );

      scroller.addEventListener("scroll", syncRail, { passive: true });
      window.addEventListener("resize", syncRail);
    }

    if (nextStep) {
      nextStep.addEventListener("click", () => {
        markRailMoved();
        stepRail(1);
      });
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", (event) => {
        event.preventDefault();
        if (dragged) return;
        selectTab(tab, true, true);
      });
      tab.addEventListener("keydown", (event) => {
        let next = index;
        if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        else return;
        event.preventDefault();
        tabs[next].focus();
        selectTab(tabs[next], true, true);
      });
    });

    window.addEventListener("hashchange", () => {
      const id = (location.hash || "").replace("#", "");
      const tab = tabs.find((item) => item.getAttribute("aria-controls") === id);
      if (tab) selectTab(tab, false, true);
    });

    const fromHash = tabs.find((tab) => tab.getAttribute("aria-controls") === (location.hash || "").replace("#", ""));
    selectTab(fromHash || tabs[0], false);

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        syncRail();
        if (fromHash && scroller) {
          fromHash.scrollIntoView({ inline: "center", block: "nearest", behavior: "auto" });
          syncRail();
          return;
        }
        if (reduceMotion || !scroller || !rail || !rail.classList.contains("is-overflow")) return;
        const start = scroller.scrollLeft;
        scroller.scrollTo({ left: start + 56, behavior: "smooth" });
        peekTimer = window.setTimeout(function () {
          scroller.scrollTo({ left: start, behavior: "smooth" });
          peekTimer = 0;
        }, 700);
      });
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(syncRail);
    }
  }

  function initReveal() {
    const targets = document.querySelectorAll(
      ".pedido, .dia, .pillar, .cardapio, .quotes blockquote, .casa-copy, .faq-list, .onde-card, .close-inner, .menu-intro, .menu-dia, .menu-dock, .menu-board"
    );
    if (reduceMotion) return;
    targets.forEach((el) => el.classList.add("reveal"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );
    targets.forEach((el) => io.observe(el));
  }

  function syncHeaderHeight() {
    const header = document.querySelector(".site-header");
    if (!header) return;
    const height = Math.round(header.getBoundingClientRect().height);
    if (height > 0) {
      root.style.setProperty("--header-h", height + "px");
    }
  }

  loadGtag();
  applyPhones();
  initTracking();
  initMenu();
  initTheme();
  initMenuBoard();
  initReveal();
  syncHeaderHeight();
  const header = document.querySelector(".site-header");
  if (header && typeof ResizeObserver !== "undefined") {
    new ResizeObserver(syncHeaderHeight).observe(header);
  } else {
    window.addEventListener("resize", syncHeaderHeight, { passive: true });
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(syncHeaderHeight);
  }
})();
