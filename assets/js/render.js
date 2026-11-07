/* ============================================================================
   render.js — every piece of markup built from config.js lives here.

   The browser uses it through app.js, and tools/prerender.mjs runs the same
   functions in Node to write that markup straight into index.html. That way
   the games, bio, skills and contact details are in the page source even for
   readers that never run JavaScript (portfolio raters, search engines, link
   previews), and the two can never drift apart.
   ========================================================================= */

(function (root) {
  "use strict";

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const icon = (id, cls) =>
    `<svg class="${cls || ""}" aria-hidden="true"><use href="#${id}"/></svg>`;

  function compact(n) {
    if (n === null || n === undefined || isNaN(n)) return "—";
    if (n >= 1e9) return (n / 1e9).toFixed(n >= 1e10 ? 0 : 1).replace(/\.0$/, "") + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "M";
    if (n >= 1e4) return (n / 1e3).toFixed(0) + "K";
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  }
  const full = (n) => (n === null || n === undefined || isNaN(n) ? "—" : n.toLocaleString("en-US"));

  /* One decimal at every size: 22.8M, 142.2K. Used for the headline stats. */
  function short(n) {
    if (n === null || n === undefined || isNaN(n)) return "—";
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  }

  /* "22.8M" → "22M+": a floor that stays true while the live number grows. */
  function plus(n) {
    if (!n) return "0";
    const mag = n >= 1e6 ? 1e6 : n >= 1e3 ? 1e3 : 1;
    const unit = mag === 1e6 ? "M" : mag === 1e3 ? "K" : "";
    return Math.floor(n / mag) + unit + "+";
  }

  /* {games}, {visits} and {years} in any config text are filled from real data. */
  function fill(text, vars) {
    return String(text == null ? "" : text).replace(/\{(\w+)\}/g, (m, k) =>
      vars && vars[k] != null ? vars[k] : m);
  }

  /* Anything wrapped in *asterisks* gets the accent colour. */
  const emphasise = (text) => esc(text).replace(/\*(.+?)\*/g, "<em>$1</em>");

  function tokens(config, totals) {
    return {
      games: (config.games || []).length,
      visits: totals && totals.visits ? plus(totals.visits) : "",
      years: config.identity.yearsExperience,
    };
  }

  /* ---- About ----------------------------------------------------------- */

  const bio = (paras, vars) => paras.map((p) => `<p>${esc(fill(p, vars))}</p>`).join("");

  const skills = (groups) => groups.map((g, i) => `
      <div class="skills__group" data-reveal style="--d:${i}">
        <h3 class="skills__label">${esc(g.label)}</h3>
        <ul class="chips">${g.items.map((it) => `<li class="chip">${esc(it)}</li>`).join("")}</ul>
      </div>`).join("");

  const process = (steps) => steps.map((s, i) => `
      <li class="timeline__step" data-reveal style="--d:${i + 1}">
        <span class="timeline__node" aria-hidden="true"></span>
        <h4 class="timeline__title">${esc(s.title)}</h4>
        <p class="timeline__text">${esc(s.text)}</p>
      </li>`).join("");

  /* ---- Games ----------------------------------------------------------- */

  function gameRows(config, liveGames) {
    const byId = {};
    (liveGames || []).forEach((g) => (byId[g.universeId] = g));
    return (config.games || []).map((cfg, i) => {
      const l = byId[cfg.universeId] || {};
      const fb = cfg.fallback || {};
      const placeId = l.rootPlaceId || cfg.placeId || null;
      return {
        id: cfg.universeId,
        name: l.name || fb.name || "Game " + (i + 1),
        visits: l.visits != null ? l.visits : fb.visits,
        playing: cfg.closed ? null : (l.playing != null ? l.playing : fb.playing),
        favorites: l.favorites != null ? l.favorites : fb.favorites,
        thumb: l.thumb || cfg.thumb || null,
        role: cfg.role || "",
        contribution: cfg.contribution || "",
        closed: Boolean(cfg.closed),
        url: placeId && !cfg.closed ? "https://www.roblox.com/games/" + placeId : null,
      };
    });
  }

  const thumb = (g, eager) => g.thumb
    ? `<img src="${esc(g.thumb)}" alt="${esc(g.name)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} width="768" height="432" data-thumb="${g.id}">`
    : `<span class="thumb-fallback">${icon("ic-cube")}</span>`;

  const ccu = (g) => g.closed
    ? `<span class="badge badge--muted">Closed</span>`
    : g.playing != null
      ? `<span class="badge${g.playing > 0 ? " badge--live" : ""}" data-ccu="${g.id}">${compact(g.playing)} playing</span>`
      : "";

  /* A card is one link to the game when it has one, so the whole tile is the
     click target and there is never a link inside a link. */
  const wrapLink = (g, cls, attrs, inner) => g.url
    ? `<a class="${cls}" href="${esc(g.url)}" target="_blank" rel="noopener noreferrer" ${attrs}>${inner}</a>`
    : `<div class="${cls}" ${attrs}>${inner}</div>`;

  /* Top games: a bento with one large tile and four small ones. */
  const featuredCard = (g, i) => wrapLink(g, `feat spot${i === 0 ? " feat--lead" : ""}`,
    `data-reveal style="--d:${i}"`, `
        <span class="feat__media">${thumb(g, i === 0)}${ccu(g)}</span>
        <span class="feat__body">
          <span class="feat__name">${esc(g.name)}</span>
          <span class="feat__meta"><span>${esc(g.role)}</span><span class="num" data-visits="${g.id}">${compact(g.visits)} visits</span></span>
          ${g.contribution ? `<span class="feat__does">${esc(g.contribution)}</span>` : ""}
        </span>`);

  const gameCard = (g, i) => wrapLink(g, "game spot", `style="--d:${i % 4}"`, `
        <span class="game__media">${thumb(g)}${ccu(g)}</span>
        <span class="game__body">
          <span class="game__name" title="${esc(g.name)}">${esc(g.name)}</span>
          ${g.contribution ? `<span class="game__does">${esc(g.contribution)}</span>` : ""}
          <span class="game__meta"><span>${esc(g.role)}</span><span class="num" data-visits="${g.id}">${compact(g.visits)} visits</span></span>
        </span>`);

  /* The 3D deck in the hero (a port of React Bits' Card Swap). */
  const swapCard = (g, i) => wrapLink(g, "swap__card", `style="--i:${i}" aria-label="${esc(g.name)}"`, `
        <span class="swap__head">
          <span class="swap__icon">${icon("ic-gamepad")}</span>
          <span class="swap__title">${esc(g.name)}</span>
          <span class="swap__visits num">${compact(g.visits)}</span>
        </span>
        <span class="swap__media">${thumb(g, i === 0)}</span>`);

  /* The endless strip of every game (a port of React Bits' Logo Loop). */
  const loopItem = (g) => `
        <li class="loop__item">
          <span class="loop__thumb">${thumb(g)}</span>
          <span class="loop__name">${esc(g.name)}</span>
        </li>`;

  function bars(games) {
    const top = (games || []).filter((g) => g.visits > 0).sort((a, b) => b.visits - a.visits).slice(0, 3);
    if (!top.length) return "";
    return top.map((g) => `<li><span>${esc(g.name)}</span><span class="num">${compact(g.visits)}</span></li>`).join("");
  }

  /* ---- Media ----------------------------------------------------------- */

  const mediaTile = (m, i) => {
    const isVideo = m.type === "youtube" || m.type === "video";
    const visual = m.type === "video" && !m.poster
      ? `<video src="${esc(m.src)}#t=0.5" preload="metadata" muted playsinline aria-hidden="true"></video>`
      : `<img src="${esc(m.type === "youtube" ? `https://img.youtube.com/vi/${m.src}/hqdefault.jpg` : (m.poster || m.src))}" alt="${esc(m.title || "Work sample")}" loading="lazy">`;
    return `
      <button class="clip spot" data-media="${i}" data-reveal style="--d:${i}" aria-label="Play ${esc(m.title || "clip")}">
        <span class="clip__media">${visual}${isVideo ? `<span class="clip__play">${icon("ic-play")}</span>` : ""}</span>
        <span class="clip__title">${esc(m.title || "Untitled")}</span>
        ${m.caption ? `<span class="clip__caption">${esc(m.caption)}</span>` : ""}
      </button>`;
  };
  const media = (items) => (items || []).map(mediaTile).join("");

  /* ---- Contact --------------------------------------------------------- */

  function channelItems(c) {
    const items = [];
    if (c.discord) items.push({
      icon: "ic-discord", label: "Discord", value: c.discord,
      hint: "Click to copy", action: "copy",
    });
    if (c.discordServer) items.push({
      icon: "ic-discord", label: "Server", value: "Join my server",
      hint: c.discordServer.replace(/^https?:\/\//, ""), href: c.discordServer,
    });
    if (c.x) items.push({
      icon: "ic-x", label: "X / Twitter", value: "@" + c.x,
      hint: "DMs open", href: "https://x.com/" + encodeURIComponent(c.x),
    });
    if (c.talentHub) items.push({
      icon: "ic-user", label: "Talent Hub", value: c.talentHub.label,
      hint: "Hire me on Roblox", href: c.talentHub.url,
    });
    if (c.roblox) items.push({
      icon: "ic-cube", label: "Roblox", value: c.roblox.label,
      hint: "My Roblox profile", href: c.roblox.url,
    });
    if (c.email) items.push({
      icon: "ic-envelope", label: "Email", value: c.email,
      hint: "For longer briefs", href: "mailto:" + c.email,
    });
    return items;
  }

  const channels = (items) => items.map((it, i) => {
    const inner = `
        <span class="channel__icon">${icon(it.icon)}</span>
        <span class="channel__text">
          <span class="channel__label">${esc(it.label)}</span>
          <span class="channel__val">${esc(it.value)}</span>
        </span>`;
    const attrs = `data-reveal style="--d:${i}" title="${esc(it.hint)}"`;
    return it.href
      ? `<a class="channel spot" href="${esc(it.href)}" target="_blank" rel="noopener noreferrer" ${attrs}>${inner}</a>`
      : `<button class="channel spot" data-copy="${esc(it.value)}" data-spark ${attrs}>${inner}</button>`;
  }).join("");

  const pricing = (tiers) => (tiers || []).map((t, i) => `
      <div class="price spot${t.featured ? " price--featured" : ""}" data-reveal style="--d:${i}">
        <div class="price__name">${esc(t.name)}</div>
        <div class="price__val"><span class="num">${esc(t.price)}</span><span class="price__per">${esc(t.per || "")}</span></div>
        <div class="price__text">${esc(t.text)}</div>
      </div>`).join("");

  root.Render = {
    esc, icon, compact, full, short, plus, fill, emphasise, tokens,
    bio, skills, process, gameRows, featuredCard, gameCard, swapCard, loopItem, bars,
    media, channelItems, channels, pricing,
  };
})(typeof window !== "undefined" ? window : globalThis);
