/* ============================================================================
   app.js — renders the page from config.js, keeps the live numbers fresh,
   and switches on the effects in effects.js. No framework, no build step.
   ========================================================================= */

(function () {
  "use strict";

  const C = window.CONFIG;
  const R = window.Render;
  const FX = window.Effects;
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const bind = (key) => $$(`[data-bind="${key}"]`);
  const setBind = (key, text) => bind(key).forEach((el) => (el.textContent = text));

  const FEATURED = 5;
  const SWAP_CARDS = 4;
  let stats = null;
  let statsSeen = false;
  let lastUpdate = 0;

  const vars = () => R.tokens(C, stats && stats.totals);
  const rows = () => R.gameRows(C, stats && stats.games);

  /* ======================================================================
     Static content (the same markup tools/prerender.mjs bakes in)
     =================================================================== */

  function renderIdentity() {
    const id = C.identity;
    const v = vars();
    setBind("name", id.name);
    setBind("role", id.role);
    setBind("location", id.location);
    setBind("availability", id.available ? id.availableText : id.unavailableText);
    setBind("subline", R.fill(id.subline, v));
    setBind("response-time", C.contact.responseTime || "");
    setBind("contact-lede", C.contact.lede || "");
    setBind("games-count", String((C.games || []).length));
    const head = $("#headline");
    if (head && !head.dataset.blurred) head.innerHTML = R.emphasise(R.fill(id.headline, v));
    document.title = `${id.name} | ${id.role}`;
  }

  function renderStatic() {
    $("#about-bio").innerHTML = R.bio(C.about.bio, vars());
    $("#about-skills").innerHTML = R.skills(C.about.skills);
    $("#about-process").innerHTML = R.process(C.about.process);
    $("#media-grid").innerHTML = R.media(C.media);
    $("#contact-pricing").innerHTML = R.pricing(C.pricing);
    $("#contact-channels").innerHTML = R.channels(R.channelItems(C.contact));
  }

  function renderGames() {
    const all = rows();
    $("#swap").innerHTML = all.filter((g) => g.thumb).slice(0, SWAP_CARDS).map(R.swapCard).join("");
    $("#games-featured").innerHTML = all.slice(0, FEATURED).map(R.featuredCard).join("");
    $("#games-grid").innerHTML = all.slice(FEATURED).map(R.gameCard).join("");
    $("#loop").innerHTML = all.filter((g) => g.thumb).map(R.loopItem).join("");
  }

  /* Live refreshes only patch numbers and thumbnails in place, so nothing
     re-animates or jumps while someone is reading. */
  function patchGames() {
    rows().forEach((g) => {
      $$(`[data-visits="${g.id}"]`).forEach((el) => (el.textContent = R.compact(g.visits) + " visits"));
      $$(`[data-ccu="${g.id}"]`).forEach((el) => {
        el.textContent = R.compact(g.playing) + " playing";
        el.classList.toggle("badge--live", g.playing > 0);
      });
      if (g.thumb) $$(`img[data-thumb="${g.id}"]`).forEach((img) => { if (img.src !== g.thumb) img.src = g.thumb; });
    });
  }

  /* ======================================================================
     Live stats
     =================================================================== */

  function setPill(status) {
    const map = { live: ["live", "Live"], cached: ["live", "Cached"], loading: ["loading", "Connecting"], fallback: ["offline", "Offline"], empty: ["offline", "No games"] };
    const [state, label] = map[status] || map.loading;
    $("#livepill").dataset.state = state;
    $("#livepill-text").textContent = label;
  }

  /* The numbers wait at zero until the row scrolls into view, then count up. */
  const STAT_KEYS = ["stat-visits", "stat-ccu", "stat-favs", "stat-games", "proof-years"];
  function primeNumbers() {
    if (FX.reduce) return;
    STAT_KEYS.forEach((k) => bind(k).forEach((el) => { el.dataset.value = 0; el.textContent = k === "proof-years" ? "0+" : "0"; }));
  }

  function paintNumbers(animate) {
    if (!stats) return;
    const t = stats.totals;
    const put = (key, value, fmt) => bind(key).forEach((el) =>
      animate ? FX.countUp(el, value, fmt) : (el.textContent = fmt(value), el.dataset.value = value));
    put("stat-visits", t.visits, R.short);
    put("stat-ccu", t.playing, R.full);
    put("stat-favs", t.favorites, R.short);
    put("stat-games", (C.games || []).length, String);
    put("proof-years", C.identity.yearsExperience, (n) => n + "+");
  }

  function paintStats(result) {
    stats = result;
    setPill(result.status);
    renderIdentity();
    $("#about-bio").innerHTML = R.bio(C.about.bio, vars());
    patchGames();
    if (statsSeen) paintNumbers(true);
    lastUpdate = Date.now();
    setBind("updated", "just now");
  }

  function relTime(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 30) return "just now";
    if (s < 3600) return Math.max(1, Math.floor(s / 60)) + "m ago";
    return Math.floor(s / 3600) + "h ago";
  }

  async function loadStats() {
    const result = await window.RobloxStats.load();
    paintStats(result);
  }

  function initStats() {
    const cached = window.RobloxStats.peekCache();
    if (cached) paintStats(cached);
    else setPill("loading");

    const row = $(".stats__row");
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      statsSeen = true;
      if (stats) paintNumbers(true);
    }, { threshold: 0.3 });
    io.observe(row);

    loadStats();
    const every = (C.api.refreshSeconds || 120) * 1000;
    setInterval(() => { if (!document.hidden) loadStats(); }, every);
    setInterval(() => { if (lastUpdate) setBind("updated", relTime(lastUpdate)); }, 20000);
  }

  /* ======================================================================
     Navigation
     =================================================================== */

  function initNav() {
    const nav = $("#nav");
    const menu = $("#nav-menu");
    const close = () => { nav.classList.remove("is-open"); menu.setAttribute("aria-expanded", "false"); menu.setAttribute("aria-label", "Open menu"); };
    menu.addEventListener("click", () => {
      const open = !nav.classList.contains("is-open");
      nav.classList.toggle("is-open", open);
      menu.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    $$("#nav-links a").forEach((a) => a.addEventListener("click", close));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

    // Solid pill once the hero is mostly out of view.
    new IntersectionObserver(([e]) => nav.classList.toggle("is-scrolled", !e.isIntersecting), { rootMargin: "-80px 0px 0px 0px", threshold: 0 })
      .observe($(".hero__copy"));

    // Highlight the section being read.
    const links = new Map($$("[data-nav]").map((a) => [a.dataset.nav, a]));
    const seen = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => seen.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0));
      let best = null, ratio = 0;
      seen.forEach((r, id) => { if (r > ratio) { ratio = r; best = id; } });
      links.forEach((a) => a.removeAttribute("aria-current"));
      if (best && links.has(best)) links.get(best).setAttribute("aria-current", "true");
    }, { threshold: [0, 0.15, 0.3, 0.5, 0.75] });
    links.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ======================================================================
     Games: show all
     =================================================================== */

  function initMore() {
    const btn = $("#games-more");
    const grid = $("#games-grid");
    const total = (C.games || []).length;
    if (total <= FEATURED + 8) { btn.parentElement.hidden = true; grid.classList.remove("is-collapsed"); return; }
    btn.addEventListener("click", () => {
      const open = grid.classList.toggle("is-collapsed") === false;
      btn.setAttribute("aria-expanded", String(open));
      btn.innerHTML = open ? "<span>Show fewer games</span>" : `<span>Show all <span data-bind="games-count">${total}</span> games</span>`;
      if (!open) $("#games").scrollIntoView({ behavior: FX.reduce ? "auto" : "smooth" });
    });
  }

  /* ======================================================================
     Contact: copy Discord
     =================================================================== */

  function initCopy() {
    document.addEventListener("click", async (e) => {
      const btn = e.target.closest && e.target.closest("[data-copy]");
      if (!btn) return;
      try { await navigator.clipboard.writeText(btn.dataset.copy); toast(`Copied ${btn.dataset.copy}`); }
      catch (_) { toast("Copy failed, select it manually"); }
    });
  }

  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `${R.icon("ic-check")}<span>${R.esc(msg)}</span>`;
    $("#toasts").appendChild(el);
    setTimeout(() => { el.classList.add("is-out"); setTimeout(() => el.remove(), 260); }, 2600);
  }

  /* ======================================================================
     Lightbox for clips
     =================================================================== */

  let lbIndex = 0, lbLastFocus = null;

  function openLightbox(i) {
    const items = C.media || [];
    if (!items.length) return;
    lbIndex = ((i % items.length) + items.length) % items.length;
    lbLastFocus = document.activeElement;
    const lb = $("#lightbox");
    lb.hidden = false;
    void lb.offsetWidth;
    lb.classList.add("is-open");
    paintLightbox();
    $("#lightbox-close").focus();
  }

  function paintLightbox() {
    const items = C.media || [];
    const m = items[lbIndex];
    const frame = $("#lightbox-frame");
    if (m.type === "youtube") {
      frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${R.esc(m.src)}?autoplay=1&rel=0" title="${R.esc(m.title || "Video")}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    } else if (m.type === "video") {
      frame.innerHTML = `<video src="${R.esc(m.src)}" ${m.poster ? `poster="${R.esc(m.poster)}"` : ""} controls autoplay playsinline></video>`;
    } else {
      frame.innerHTML = `<img src="${R.esc(m.src)}" alt="${R.esc(m.title || "Work sample")}">`;
    }
    $("#lightbox-title").textContent = m.title || "";
    $("#lightbox-caption").textContent = m.caption || "";
    $("#lightbox-count").textContent = `${lbIndex + 1} / ${items.length}`;
    $("#lightbox-prev").hidden = $("#lightbox-next").hidden = items.length < 2;
  }

  function closeLightbox() {
    const lb = $("#lightbox");
    lb.classList.remove("is-open");
    $("#lightbox-frame").innerHTML = "";
    setTimeout(() => { lb.hidden = true; }, 240);
    if (lbLastFocus) lbLastFocus.focus();
  }

  function initLightbox() {
    const step = (d) => { const n = (C.media || []).length; lbIndex = (((lbIndex + d) % n) + n) % n; paintLightbox(); };
    document.addEventListener("click", (e) => {
      const tile = e.target.closest && e.target.closest("[data-media]");
      if (tile) openLightbox(Number(tile.dataset.media));
    });
    $("#lightbox-close").addEventListener("click", closeLightbox);
    $("#lightbox-prev").addEventListener("click", () => step(-1));
    $("#lightbox-next").addEventListener("click", () => step(1));
    $("#lightbox").addEventListener("click", (e) => { if (e.target.id === "lightbox") closeLightbox(); });
    document.addEventListener("keydown", (e) => {
      if (!$("#lightbox").classList.contains("is-open")) return;
      if (e.key === "Escape") { e.preventDefault(); closeLightbox(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
      if (e.key === "Tab") {
        const f = $$("#lightbox button:not([hidden]), #lightbox video, #lightbox iframe");
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* Broken or blocked thumbnails fall back to a placeholder glyph. */
  function initImgFallback() {
    document.addEventListener("error", (e) => {
      const img = e.target;
      if (!(img instanceof HTMLImageElement) || !img.dataset.thumb) return;
      const holder = img.parentElement;
      img.remove();
      if (holder && !holder.querySelector(".thumb-fallback")) holder.insertAdjacentHTML("afterbegin", `<span class="thumb-fallback">${R.icon("ic-cube")}</span>`);
    }, true);
  }

  /* ======================================================================
     Boot
     =================================================================== */

  function init() {
    const snap = window.RobloxStats.peekCache();
    if (snap) stats = snap;
    renderIdentity();
    renderStatic();
    renderGames();
    paintNumbers(false);
    primeNumbers();

    initNav();
    initMore();
    initCopy();
    initLightbox();
    initImgFallback();

    FX.aurora($("#aurora"));
    FX.blurText($("#headline"));
    FX.cardSwap($("#swap"), { dx: 38, dy: 36, dz: 64 });
    FX.logoLoop($("#loop"));
    FX.spotlight();
    FX.magnet($$("[data-magnet]"));
    FX.clickSpark($("#sparks"));
    FX.reveal();

    initStats();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
