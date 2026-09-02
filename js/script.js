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

  function initReveal() {
    const targets = document.querySelectorAll(
      ".pedido, .dia, .pillar, .cardapio, .quotes blockquote, .casa-copy, .faq-list, .onde-card, .close-inner, .proof"
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

  loadGtag();
  applyPhones();
  initTracking();
  initMenu();
  initTheme();
  initReveal();
})();
