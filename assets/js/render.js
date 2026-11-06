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

  /* "12.4M" → "12M+": a floor that stays true while the live number grows. */
  function plus(n) {
    if (!n) return "0";
    const mag = n >= 1e6 ? 1e6 : n >= 1e3 ? 1e3 : 1;
    const unit = mag === 1e6 ? "M" : mag === 1e3 ? "K" : "";
    return Math.floor(n / mag) + unit + "+";
  }

  /* {games} and {visits} in headline/subline/bio are filled from real data. */
  function fill(text, vars) {
    return String(text == null ? "" : text).replace(/\{(\w+)\}/g, (m, k) =>
      vars && vars[k] != null ? vars[k] : m);
  }

  /* Anything wrapped in *asterisks* gets the gradient. */
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

  const skills = (groups) => groups.map((g) => `
      <div class="skillgroup">
        <div class="skillgroup__label">${esc(g.label)}</div>
        <div class="chips">${g.items.map((i) => `<span class="chip">${esc(i)}</span>`).join("")}</div>
      </div>`).join("");

  const process = (steps) => steps.map((s) => `
      <div class="step">
        <div class="step__n mono">${esc(s.n)}</div>
        <div>
          <div class="step__title">${esc(s.title)}</div>
          <div class="step__text">${esc(s.text)}</div>
        </div>
      </div>`).join("");

  /* ---- Games ----------------------------------------------------------- */

  function gameRows(config, liveGames) {
    const byId = {};
    (liveGames || []).forEach((g) => (byId[g.universeId] = g));
    return (config.games || []).map((cfg, i) => {
      const l = byId[cfg.universeId] || {};
      const fb = cfg.fallback || {};
      const placeId = l.rootPlaceId || cfg.placeId || null;
      return {
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

  const gameCard = (g, i) => `
      <article class="card game pop-in" style="--i:${i}">
        <div class="game__thumb">
          ${g.thumb
            ? `<img src="${esc(g.thumb)}" alt="${esc(g.name)} thumbnail" loading="lazy" width="768" height="432">`
            : `<div class="thumb-fallback">${icon("ic-cube")}</div>`}
          ${g.playing != null ? `<span class="game__ccu"><i></i>${compact(g.playing)} playing</span>` : ""}
        </div>
        <div class="game__body">
          <h3 class="game__name" title="${esc(g.name)}">${esc(g.name)}</h3>
          ${g.role ? `<div class="game__role">${esc(g.role)}</div>` : ""}
          ${g.contribution ? `<p class="game__does">${esc(g.contribution)}</p>` : ""}
          <div class="game__meta">
            <span>${compact(g.visits)} visits</span>
            ${g.url ? `<a class="game__link" href="${esc(g.url)}" target="_blank" rel="noopener noreferrer"
                         style="margin-left:auto">Play ${icon("ic-external")}</a>`
              : g.closed ? `<span class="game__closed" style="margin-left:auto">Closed</span>` : ""}
          </div>
        </div>
      </article>`;

  function bars(games) {
    const top = (games || []).filter((g) => g.visits > 0).sort((a, b) => b.visits - a.visits).slice(0, 3);
    if (!top.length) return `<p class="stat__note">No games added yet.</p>`;
    const max = top[0].visits || 1;
    return top.map((g) => `
      <div class="bar__row">
        <span class="bar__name" title="${esc(g.name)}">${esc(g.name)}</span>
        <span class="bar__val">${compact(g.visits)}</span>
        <span class="bar__track"><span class="bar__fill" data-w="${Math.round((g.visits / max) * 100)}"></span></span>
      </div>`).join("");
  }

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

  const channels = (items) => items.map((it) => {
    const inner = `
        <span class="channel__icon">${icon(it.icon)}</span>
        <span style="min-width:0">
          <span class="channel__label">${esc(it.label)}</span>
          <span class="channel__val" style="display:block">${esc(it.value)}</span>
          <span class="channel__hint">${esc(it.hint)}</span>
        </span>`;
    return it.href
      ? `<a class="channel" href="${esc(it.href)}" target="_blank" rel="noopener noreferrer">${inner}</a>`
      : `<button class="channel" data-copy="${esc(it.value)}">${inner}</button>`;
  }).join("");

  const pricing = (tiers) => (tiers || []).map((t) => `
      <div class="price${t.featured ? " price--featured" : ""}">
        <div class="price__name">${esc(t.name)}</div>
        <div class="price__val"><span class="num">${esc(t.price)}</span><span class="price__per">${esc(t.per || "")}</span></div>
        <div class="price__text">${esc(t.text)}</div>
      </div>`).join("");

  root.Render = {
    esc, icon, compact, full, plus, fill, emphasise, tokens,
    bio, skills, process, gameRows, gameCard, bars, channelItems, channels, pricing,
  };
})(typeof window !== "undefined" ? window : globalThis);
