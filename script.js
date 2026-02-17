(() => {
  // -----------------------------
  // Mobile menu (igual robusto)
  // -----------------------------
  const body = document.body;

  const openBtn = document.getElementById("menu-open");
  const closeBtn = document.getElementById("menu-close");
  const menu = document.getElementById("mobileMenu");
  const overlay = document.getElementById("menuOverlay");

  if (openBtn && closeBtn && menu && overlay) {
    const focusableSelector = 'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])';
    let lastFocus = null;

    const openMenu = () => {
      lastFocus = document.activeElement;

      overlay.hidden = false;
      menu.style.right = "0";
      menu.setAttribute("aria-hidden", "false");
      openBtn.setAttribute("aria-expanded", "true");
      body.style.overflow = "hidden";

      const first = menu.querySelector(".mobile-link");
      first?.focus({ preventScroll: true });
    };

    const closeMenu = () => {
      menu.style.right = "-110%";
      menu.setAttribute("aria-hidden", "true");
      openBtn.setAttribute("aria-expanded", "false");
      overlay.hidden = true;
      body.style.overflow = "";

      if (lastFocus && typeof lastFocus.focus === "function") {
        lastFocus.focus({ preventScroll: true });
      }
    };

    openBtn.addEventListener("click", openMenu);
    closeBtn.addEventListener("click", closeMenu);
    overlay.addEventListener("click", closeMenu);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.hidden === false) closeMenu();
    });

    menu.querySelectorAll(".mobile-link").forEach((link) => {
      link.addEventListener("click", () => closeMenu());
    });

    // Focus trap básico
    document.addEventListener("keydown", (e) => {
      if (overlay.hidden) return;
      if (e.key !== "Tab") return;

      const focusables = Array.from(menu.querySelectorAll(focusableSelector))
        .filter(el => !el.hasAttribute("disabled"));

      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  // -----------------------------
  // Parallax HERO (suave)
  // -----------------------------
  const hero = document.getElementById("hero");
  if (!hero) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) return;

  const layers = Array.from(hero.querySelectorAll(".p-layer"));
  if (!layers.length) return;

  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const onMove = (e) => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;  // 0..1
    const y = (e.clientY - rect.top) / rect.height;  // 0..1

    // -1..1
    targetX = clamp((x - 0.5) * 2, -1, 1);
    targetY = clamp((y - 0.5) * 2, -1, 1);
  };

  // fallback para touch: usa scroll como parallax leve
  const onScroll = () => {
    const rect = hero.getBoundingClientRect();
    const progress = clamp(1 - (rect.bottom / (window.innerHeight + rect.height)), 0, 1);
    targetY = (progress - 0.5) * 0.9;
  };

  const animate = () => {
    // easing
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;

    layers.forEach((layer) => {
      const depth = parseFloat(layer.getAttribute("data-depth") || "0.2");
      const moveX = currentX * depth * 20; // px
      const moveY = currentY * depth * 20; // px
      layer.style.setProperty("--px", `${moveX}px`);
      layer.style.setProperty("--py", `${moveY}px`);
    });

    requestAnimationFrame(animate);
  };

  hero.addEventListener("mousemove", onMove, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });

  onScroll();
  requestAnimationFrame(animate);

})();

// -----------------------------
// i18n (ES / EN) translator
// -----------------------------

const I18N_PATH = "./lang"; // carpeta /lang
const DEFAULT_LANG = "es";

function getNested(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

async function loadLang(lang) {
  const res = await fetch(`${I18N_PATH}/${lang}.json`, { cache: "no-store" });
  if (!res.ok) throw new Error(`No pude cargar ${lang}.json`);
  return res.json();
}

function applyTranslations(dict, lang) {
  // Cambia atributo lang del HTML
  document.documentElement.lang = lang;

  // Textos por innerHTML
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const value = getNested(dict, key);

    if (typeof value === "string") {
      // Permitimos HTML (para iconos dentro del texto)
      el.innerHTML = value;
    }
  });

  // Placeholders
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    const value = getNested(dict, key);
    if (typeof value === "string") el.setAttribute("placeholder", value);
  });
}

async function setLanguage(lang) {
  try {
    const dict = await loadLang(lang);
    applyTranslations(dict, lang);
    localStorage.setItem("lang", lang);
  } catch (err) {
    console.error(err);
  }
}

// Click handlers (desktop + mobile buttons)
document.querySelectorAll("[data-language]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const lang = btn.dataset.language;
    setLanguage(lang);
  });
});

// Init on load
document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("lang") || DEFAULT_LANG;
  setLanguage(saved);
});
