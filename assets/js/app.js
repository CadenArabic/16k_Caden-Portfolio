/* ============================================================================
   app.js — tab shell, rendering, live stats binding, lightbox.
   No framework, no build step.
   ========================================================================= */

(function () {
  "use strict";

  const C = window.CONFIG;
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const bind = (key) => $$(`[data-bind="${key}"]`);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const TABS = ["welcome", "about", "stats", "games", "media", "contact"];
  let state = { tab: "welcome", stats: null, gamesPage: 0, mediaPage: 0 };

  /* ======================================================================
     Formatting
     =================================================================== */

  const R = window.Render;
  const { compact, full, esc, icon } = R;

  function relTime(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 10) return "just now";
    if (s < 60) return s + "s ago";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    return Math.floor(s / 3600) + "h ago";
  }

  /* Count-up. Never animates on reduced-motion. */
  function countTo(el, target, format) {
    if (!el) return;
    const fmt = format || compact;
    if (reduceMotion || !target) { el.textContent = fmt(target); return; }
    const from = 0, dur = 850, t0 = performance.now();
    function frame(now) {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);           // ease-out cubic
      el.textContent = fmt(Math.round(from + (target - from) * eased));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ======================================================================
     Static content from config
     =================================================================== */

  const vars = () => R.tokens(C, state.stats && state.stats.totals);

  function renderIdentity() {
    const id = C.identity;
    const v = vars();
    bind("name").forEach((el) => (el.textContent = id.name));
    bind("role").forEach((el) => (el.textContent = id.role));
    bind("role-eyebrow").forEach((el) => (el.textContent = id.role));
    bind("headline").forEach((el) => (el.innerHTML = R.emphasise(R.fill(id.headline, v))));
    bind("subline").forEach((el) => (el.textContent = R.fill(id.subline, v)));
    bind("location").forEach((el) => (el.textContent = id.location));
    bind("proof-years").forEach((el) => (el.textContent = id.yearsExperience + "+"));
    bind("response-time").forEach((el) => (el.textContent = C.contact.responseTime || ""));

    const availEl = $("#status-availability");
    bind("availability").forEach((el) => {
      el.textContent = id.available ? id.availableText : id.unavailableText;
    });
    if (availEl) availEl.style.color = id.available ? "var(--accent)" : "var(--warn)";

    document.title = `${id.name} — ${id.role}`;
  }

  function renderAbout() {
    $("#about-bio").innerHTML = R.bio(C.about.bio, vars());
    $("#about-skills").innerHTML = R.skills(C.about.skills);
    $("#about-process").innerHTML = R.process(C.about.process);
  }

  function renderContact() {
    const c = C.contact;
    bind("contact-lede").forEach((el) => (el.textContent = c.lede || el.textContent));
    const pricing = $("#contact-pricing");
    if (pricing) pricing.innerHTML = R.pricing(C.pricing);
    $("#contact-channels").innerHTML = R.channels(R.channelItems(c));

    $$("#contact-channels [data-copy]").forEach((btn) => {
      btn.addEventListener("click", () => copyText(btn.dataset.copy));
    });
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast(`Copied ${text}`);
    } catch (_) {
      toast("Copy failed — select it manually");
    }
  }

  /* ======================================================================
     Tabs
     =================================================================== */

  function moveIndicator() {
    const ind = $("#tab-indicator");
    const active = $(`.tab[aria-selected="true"]`);
    if (!ind || !active || getComputedStyle(ind).display === "none") return;
    ind.style.width = active.offsetWidth + "px";
    ind.style.transform = `translateX(${active.offsetLeft}px)`;
  }

  function setTab(name, opts = {}) {
    if (!TABS.includes(name)) name = "welcome";

    // Travel direction decides which way panels slide.
    const from = TABS.indexOf(state.tab);
    const to = TABS.indexOf(name);
    const dir = to === from ? 0 : (to > from ? 1 : -1);
    const shift = 40;
    state.tab = name;

    $$(".tab").forEach((t) => {
      const on = t.dataset.tab === name;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
    });

    const incoming = $("#panel-" + name);
    const outgoing = $(".panel.is-active");
    if (outgoing && outgoing !== incoming) {
      outgoing.style.setProperty("--x", (-dir * shift) + "px");
      outgoing.classList.remove("is-active");
    }
    if (!incoming.classList.contains("is-active")) {
      incoming.style.setProperty("--x", (dir * shift) + "px");
      void incoming.offsetWidth;        // flush the start position
      incoming.classList.add("is-active");
    }

    moveIndicator();
    if (history.replaceState) history.replaceState(null, "", "#" + name);

    // Re-layout paged grids: the panel had zero size while hidden.
    if (name === "games") renderGames();
    if (name === "media") renderMedia();

    if (opts.focusPanel) $("#panel-" + name).focus({ preventScroll: true });
  }

  function initTabs() {
    const list = $("#tablist");

    list.addEventListener("click", (e) => {
      const tab = e.target.closest(".tab");
      if (tab) setTab(tab.dataset.tab);
    });

    // Roving tabindex + arrow keys (WAI-ARIA tabs pattern)
    list.addEventListener("keydown", (e) => {
      const i = TABS.indexOf(state.tab);
      let next = null;
      if (e.key === "ArrowRight") next = TABS[(i + 1) % TABS.length];
      if (e.key === "ArrowLeft")  next = TABS[(i - 1 + TABS.length) % TABS.length];
      if (e.key === "Home")       next = TABS[0];
      if (e.key === "End")        next = TABS[TABS.length - 1];
      if (next) {
        e.preventDefault();
        setTab(next);
        $(`#tab-${next}`).focus();
      }
    });

    // Global arrows too — but never while typing or with a modal open.
    document.addEventListener("keydown", (e) => {
      if ($("#lightbox").classList.contains("is-open")) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const i = TABS.indexOf(state.tab);
      if (e.key === "ArrowRight") { e.preventDefault(); setTab(TABS[(i + 1) % TABS.length]); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); setTab(TABS[(i - 1 + TABS.length) % TABS.length]); }
    });

    // Any element with data-goto jumps to a tab.
    document.addEventListener("click", (e) => {
      const go = e.target.closest("[data-goto]");
      if (go) { e.preventDefault(); setTab(go.dataset.goto, { focusPanel: true }); }
    });

    window.addEventListener("hashchange", () => setTab(location.hash.replace("#", "")));
    window.addEventListener("resize", debounce(() => {
      // A new viewport gets a fresh fit: clear the measured heights and the
      // row penalties so grids can grow again, not just shrink.
      state.gameCardH = state.mediaCardH = 0;
      state.gamesPenalty = state.mediaPenalty = 0;
      moveIndicator(); renderGames(); renderMedia();
    }, 150));

    setTab(location.hash.replace("#", "") || "welcome");
    // Fonts change tab widths — reposition once they land.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);
  }

  /* ======================================================================
     Paging — keeps every tab on one screen, no scrollbars
     =================================================================== */

  function columnsOf(grid) {
    const cols = getComputedStyle(grid).gridTemplateColumns;
    return Math.max(1, cols.split(" ").filter(Boolean).length);
  }

  /* How many cards fit on one screen. The first pass uses an estimate; once a
     card is on screen we measure it and re-render if the estimate was wrong.
     That keeps the grid exact at any window size or font scale. */
  function pageSizeFor(grid, cardHeight, penalty) {
    const cols = columnsOf(grid);
    const body = grid.closest(".section__body");
    const avail = body ? body.clientHeight : grid.clientHeight;
    const gap = parseFloat(getComputedStyle(grid).rowGap) || 12;
    const slack = 8;                                // absorb sub-pixel rounding
    let rows = Math.floor((avail - slack + gap) / (cardHeight + gap));
    rows -= (penalty || 0);                         // set by the fit check below
    return Math.max(1, cols * Math.max(1, rows));
  }

  /* Last line of defence: if a grid still overflows its panel after rendering,
     drop a row and try again. Guarantees no scrollbar at any viewport. */
  function overflows(panelId) {
    const p = $("#" + panelId);
    return p && p.scrollHeight - p.clientHeight > 1;
  }

  /* Measure a rendered card; if it differs from the estimate we used, store the
     real height and ask for one more pass. Returns true if a re-render is due. */
  function reconcileCardHeight(grid, sel, key, pass) {
    if (pass > 0) return false;                     // only ever one correction
    const card = grid.querySelector(sel);
    if (!card) return false;
    const h = Math.ceil(card.getBoundingClientRect().height);
    if (!h || Math.abs(h - (state[key] || 0)) <= 2) return false;
    state[key] = h;
    return true;
  }

  function setupPager(pagerId, countId, total, size, page, onChange) {
    const pager = $("#" + pagerId);
    const pages = Math.ceil(total / size);
    if (pages <= 1) { pager.hidden = true; return; }
    pager.hidden = false;
    $("#" + countId).textContent = `${page + 1} / ${pages}`;
    const prev = pager.querySelector('[data-page="prev"]');
    const next = pager.querySelector('[data-page="next"]');
    prev.disabled = page === 0;
    next.disabled = page >= pages - 1;
    prev.onclick = () => onChange(page - 1);
    next.onclick = () => onChange(page + 1);
  }

  function emptyState(text) {
    return `<div class="notice notice--empty" style="grid-column:1/-1">${icon("ic-alert")}<span>${esc(text)}</span></div>`;
  }

  /* A thumbnail that 404s or gets blocked degrades to the placeholder glyph
     instead of a broken-image icon. */
  function attachImgFallback(root) {
    $$("img", root).forEach((img) => {
      img.addEventListener("error", () => {
        const holder = img.parentElement;
        if (!holder) return;
        img.remove();
        if (!holder.querySelector(".thumb-fallback")) {
          holder.insertAdjacentHTML("afterbegin",
            `<div class="thumb-fallback">${icon("ic-cube")}</div>`);
        }
      }, { once: true });
    });
  }

  /* ======================================================================
     Games
     =================================================================== */

  function renderGames(pass = 0) {
    const grid = $("#games-grid");
    if (!grid) return;

    const configured = C.games || [];
    if (!configured.length) {
      grid.innerHTML = emptyState("No games added yet.");
      $("#games-pager").hidden = true;
      return;
    }

    // Merge live data onto the configured order.
    const rows = R.gameRows(C, state.stats && state.stats.games);

    const size = pageSizeFor(grid, state.gameCardH || 236, state.gamesPenalty);
    const pages = Math.ceil(rows.length / size);
    state.gamesPage = Math.min(state.gamesPage, Math.max(0, pages - 1));
    const slice = rows.slice(state.gamesPage * size, state.gamesPage * size + size);

    grid.innerHTML = slice.map(R.gameCard).join("");

    if (reconcileCardHeight(grid, ".game", "gameCardH", pass)) return renderGames(1);
    if (pass < 3 && slice.length > 1 && overflows("panel-games")) {
      state.gamesPenalty = (state.gamesPenalty || 0) + 1;
      return renderGames(pass + 1);
    }

    attachImgFallback(grid);
    setupPager("games-pager", "games-pager-count", rows.length, size, state.gamesPage, (p) => {
      state.gamesPage = p; renderGames();
    });
  }

  /* ======================================================================
     Media
     =================================================================== */

  function mediaThumb(m) {
    if (m.type === "youtube") return `https://img.youtube.com/vi/${m.src}/hqdefault.jpg`;
    if (m.type === "video")   return m.poster || null;
    return m.src;
  }

  function renderMedia(pass = 0) {
    const grid = $("#media-grid");
    if (!grid) return;

    const items = C.media || [];
    if (!items.length) {
      grid.innerHTML = emptyState("No videos or screenshots added yet.");
      $("#media-pager").hidden = true;
      return;
    }

    const size = pageSizeFor(grid, state.mediaCardH || 150, state.mediaPenalty);
    const pages = Math.ceil(items.length / size);
    state.mediaPage = Math.min(state.mediaPage, Math.max(0, pages - 1));
    const start = state.mediaPage * size;
    const slice = items.slice(start, start + size);

    grid.innerHTML = slice.map((m, i) => {
      const t = mediaThumb(m);
      const isVideo = m.type === "youtube" || m.type === "video";
      // An mp4 with no poster still needs a preview: load just enough metadata
      // to paint a frame from half a second in (frame 0 is often black).
      const visual = (m.type === "video" && !m.poster)
        ? `<video src="${esc(m.src)}#t=0.5" preload="metadata" muted playsinline aria-hidden="true"></video>`
        : t ? `<img src="${esc(t)}" alt="${esc(m.title || "Work sample")}" loading="lazy">`
            : `<div class="thumb-fallback">${icon("ic-media")}</div>`;
      return `
        <button class="tile pop-in" style="--i:${i}" data-media="${start + i}" aria-label="Open ${esc(m.title || "media")}">
          ${visual}
          ${isVideo ? `<span class="tile__play">${icon("ic-play")}</span>` : ""}
          <span class="tile__overlay">
            <span class="tile__title">${esc(m.title || "Untitled")}</span>
            ${m.caption ? `<span class="tile__caption">${esc(m.caption)}</span>` : ""}
          </span>
        </button>`;
    }).join("");

    if (reconcileCardHeight(grid, ".tile", "mediaCardH", pass)) return renderMedia(1);
    if (pass < 3 && slice.length > 1 && overflows("panel-media")) {
      state.mediaPenalty = (state.mediaPenalty || 0) + 1;
      return renderMedia(pass + 1);
    }

    attachImgFallback(grid);
    $$("#media-grid [data-media]").forEach((btn) => {
      btn.addEventListener("click", () => openLightbox(Number(btn.dataset.media)));
    });

    setupPager("media-pager", "media-pager-count", items.length, size, state.mediaPage, (p) => {
      state.mediaPage = p; renderMedia();
    });
  }

  /* ======================================================================
     Lightbox
     =================================================================== */

  let lbIndex = 0, lbLastFocus = null;

  function openLightbox(i) {
    const items = C.media || [];
    if (!items.length) return;
    lbIndex = ((i % items.length) + items.length) % items.length;
    lbLastFocus = document.activeElement;

    const lb = $("#lightbox");
    lb.hidden = false;
    // Force a reflow so the transition still runs, without depending on rAF
    // (which never fires in a throttled/backgrounded tab — the dialog would
    // paint its content but stay at opacity 0).
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
      frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${esc(m.src)}?autoplay=1&rel=0"
        title="${esc(m.title || "Video")}" allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
        allowfullscreen></iframe>`;
    } else if (m.type === "video") {
      frame.innerHTML = `<video src="${esc(m.src)}" ${m.poster ? `poster="${esc(m.poster)}"` : ""}
        controls autoplay playsinline style="max-width:100%"></video>`;
    } else {
      frame.innerHTML = `<img src="${esc(m.src)}" alt="${esc(m.title || "Work sample")}">`;
    }

    $("#lightbox-title").textContent   = m.title || "";
    $("#lightbox-caption").textContent = m.caption || "";
    $("#lightbox-count").textContent   = `${lbIndex + 1} / ${items.length}`;
    const multi = items.length > 1;
    $("#lightbox-prev").hidden = !multi;
    $("#lightbox-next").hidden = !multi;
  }

  function closeLightbox() {
    const lb = $("#lightbox");
    lb.classList.remove("is-open");
    $("#lightbox-frame").innerHTML = "";      // stops playback
    setTimeout(() => { lb.hidden = true; }, 240);
    if (lbLastFocus) lbLastFocus.focus();
  }

  function initLightbox() {
    $("#lightbox-close").addEventListener("click", closeLightbox);
    $("#lightbox-prev").addEventListener("click", () => { lbIndex--; wrapLb(); paintLightbox(); });
    $("#lightbox-next").addEventListener("click", () => { lbIndex++; wrapLb(); paintLightbox(); });
    $("#lightbox").addEventListener("click", (e) => { if (e.target.id === "lightbox") closeLightbox(); });

    document.addEventListener("keydown", (e) => {
      if (!$("#lightbox").classList.contains("is-open")) return;
      if (e.key === "Escape")     { e.preventDefault(); closeLightbox(); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); lbIndex--; wrapLb(); paintLightbox(); }
      if (e.key === "ArrowRight") { e.preventDefault(); lbIndex++; wrapLb(); paintLightbox(); }
      if (e.key === "Tab") {                                // simple focus trap
        const f = $$("#lightbox button:not([hidden]), #lightbox a, #lightbox video, #lightbox iframe");
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  function wrapLb() {
    const n = (C.media || []).length;
    lbIndex = ((lbIndex % n) + n) % n;
  }

  /* ======================================================================
     Live stats
     =================================================================== */

  function setPill(status) {
    const pill = $("#livepill"), text = $("#livepill-text");
    const map = {
      live:     ["live",    "Live"],
      cached:   ["live",    "Cached"],
      loading:  ["loading", "Loading"],
      fallback: ["offline", "Offline"],
      empty:    ["offline", "No games"],
    };
    const [stateName, label] = map[status] || map.loading;
    pill.dataset.state = stateName;
    text.textContent = label;
  }

  function paintStats(result, firstPaint) {
    state.stats = result;
    const t = result.totals;
    renderIdentity();
    $("#about-bio").innerHTML = R.bio(C.about.bio, vars());

    $("#stats-root").classList.remove("is-loading");
    setPill(result.status);

    // No games configured yet → show a placeholder dash. Advertising "0 visits"
    // is worse than admitting there's nothing wired up.
    if (result.status === "empty") {
      ["proof-visits", "proof-ccu", "console-ccu", "stat-visits", "stat-ccu", "stat-favs"]
        .forEach((k) => bind(k).forEach((el) => (el.textContent = "—")));
      bind("stat-games")[0].textContent = "—";
      paintBars([]);
      paintNotice("empty");
      lastUpdate = 0;                       // stop the "updated Xs ago" ticker
      bind("updated").forEach((el) => (el.textContent = "not connected"));
      renderGames();
      return;
    }

    // Hero: compact. Stats tab: exact. Two readings of the same truth.
    if (firstPaint) {
      countTo(bind("proof-visits")[0], t.visits, compact);
      countTo(bind("proof-ccu")[0],    t.playing, compact);
      countTo(bind("console-ccu")[0],  t.playing, compact);
      countTo(bind("stat-visits")[0],  t.visits, full);
      countTo(bind("stat-ccu")[0],     t.playing, full);
      countTo(bind("stat-favs")[0],    t.favorites, full);
    } else {
      bind("proof-visits")[0].textContent = compact(t.visits);
      bind("proof-ccu")[0].textContent    = compact(t.playing);
      bind("console-ccu")[0].textContent  = compact(t.playing);
      bind("stat-visits")[0].textContent  = full(t.visits);
      bind("stat-ccu")[0].textContent     = full(t.playing);
      bind("stat-favs")[0].textContent    = full(t.favorites);
    }
    bind("stat-games")[0].textContent = t.count || (C.games || []).length || "0";

    paintBars(result.games);
    paintNotice(result.status);
    bind("updated").forEach((el) => (el.textContent = "updated " + relTime(Date.now())));
    lastUpdate = Date.now();

    renderGames();
  }

  function paintBars(games) {
    const wrap = $("#console-bars");
    if (!wrap) return;
    wrap.innerHTML = R.bars(games);

    $$("#console-bars .bar__fill").forEach((f) => {
      void f.offsetWidth;                    // flush the 0-width start state
      f.style.width = f.dataset.w + "%";
    });
  }

  function paintNotice(status) {
    const el = $("#stats-notice");
    if (status === "live") { el.innerHTML = ""; return; }
    const msg = {
      cached:   "Roblox didn't answer just now, so these are the last numbers I got.",
      fallback: "Can't reach Roblox right now. Try again in a minute.",
      empty:    "No games added yet.",
    }[status];
    el.innerHTML = msg
      ? `<div class="notice${status === "empty" ? " notice--empty" : ""}">${icon("ic-alert")}<span>${esc(msg)}</span></div>`
      : "";
  }

  let lastUpdate = 0;

  async function loadStats(firstPaint) {
    const hasIds = (C.games || []).some((g) => typeof g.universeId === "number" && g.universeId > 0);
    let hadCache = false;
    if (firstPaint && hasIds) {
      $("#stats-root").classList.add("is-loading");
      setPill("loading");
      // Only trust the cache if games are still configured — otherwise a stale
      // entry from a removed game would show numbers that are no longer yours.
      const cached = window.RobloxStats.peekCache();
      if (cached) { hadCache = true; paintStats(cached, true); }  // instant paint, then refresh
    }
    const result = await window.RobloxStats.load();
    // Only animate once: on a cold visit, or on the cached paint above.
    paintStats(result, Boolean(firstPaint) && !hadCache);
  }

  function initStats() {
    loadStats(true);
    const every = (C.api.refreshSeconds || 120) * 1000;
    setInterval(() => { if (!document.hidden) loadStats(false); }, every);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && Date.now() - lastUpdate > every) loadStats(false);
    });
    setInterval(() => {
      if (lastUpdate) bind("updated").forEach((el) => (el.textContent = "updated " + relTime(lastUpdate)));
    }, 20000);
  }

  /* ======================================================================
     Misc
     =================================================================== */

  /* Ripple from the click point on buttons and contact cards. */
  function initRipples() {
    document.addEventListener("pointerdown", (e) => {
      if (reduceMotion) return;
      const host = e.target.closest(".btn, .channel, .pager__btn");
      if (!host) return;
      const r = host.getBoundingClientRect();
      const size = Math.max(r.width, r.height);
      const el = document.createElement("span");
      el.className = "ripple";
      el.style.width = el.style.height = size + "px";
      el.style.left = (e.clientX - r.left - size / 2) + "px";
      el.style.top  = (e.clientY - r.top  - size / 2) + "px";
      host.appendChild(el);
      el.addEventListener("animationend", () => el.remove(), { once: true });
    });
  }

  function toast(msg) {
    const wrap = $("#toasts");
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `${icon("ic-check")}<span>${esc(msg)}</span>`;
    wrap.appendChild(el);
    setTimeout(() => {
      el.classList.add("is-out");
      setTimeout(() => el.remove(), 260);
    }, 2600);
  }

  function initClock() {
    const paint = () => {
      const t = new Date();
      bind("clock").forEach((el) =>
        (el.textContent = String(t.getHours()).padStart(2, "0") + ":" + String(t.getMinutes()).padStart(2, "0")));
    };
    paint();
    setInterval(paint, 30000);
  }

  function debounce(fn, ms) {
    let id;
    return (...a) => { clearTimeout(id); id = setTimeout(() => fn(...a), ms); };
  }

  function renderCounts() {
    bind("games-count").forEach((el) => (el.textContent = (C.games || []).length || ""));
    bind("media-count").forEach((el) => (el.textContent = (C.media || []).length || ""));
  }

  /* ======================================================================
     Boot
     =================================================================== */

  function init() {
    renderIdentity();
    renderAbout();
    renderContact();
    renderCounts();
    initTabs();
    initLightbox();
    initRipples();
    initClock();
    renderGames();
    renderMedia();
    initStats();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
