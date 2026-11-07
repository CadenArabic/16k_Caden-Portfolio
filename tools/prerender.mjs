/* ============================================================================
   prerender.mjs — bakes the site's content into index.html.

   The page builds itself with JavaScript, so anything that reads the raw HTML
   (portfolio raters, search engines, Discord/X link previews) used to see
   empty boxes. This script runs config.js and render.js in Node, pulls the
   current numbers from Roblox, and writes the finished markup between the
   <!--pre:name--> markers in index.html. It also saves those numbers to
   assets/js/snapshot.js, which the site paints first on a cold visit and
   falls back to if Roblox can't be reached.

   Run it after editing config.js:   node tools/prerender.mjs
   ========================================================================= */

import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = (p) => path.join(root, p);

const ctx = vm.createContext({ console, Set, Math, JSON, Date });
ctx.window = ctx;
vm.runInContext(await fs.readFile(file("assets/js/config.js"), "utf8"), ctx);
vm.runInContext(await fs.readFile(file("assets/js/render.js"), "utf8"), ctx);
const C = ctx.CONFIG;
const R = ctx.Render;

async function getJSON(url) {
  let last;
  for (let i = 0; i < 8; i++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.ok) return await res.json();
      last = new Error(`HTTP ${res.status} for ${url}`);
      if (res.status !== 429 && res.status < 500) throw last;
    } catch (err) {
      last = err;
    }
    await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
  }
  throw last;
}

/* Same host order as the site: the mirror first, Roblox direct second. */
async function fromHosts(build) {
  let last;
  for (const host of C.api.hosts) {
    try { return await getJSON(build(host)); } catch (err) { last = err; }
  }
  throw last;
}

async function fetchGames(ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50).join(",");
    const details = await fromHosts((h) => `${h.games}/v1/games?universeIds=${chunk}`);
    const thumbs = await fromHosts((h) =>
      `${h.thumbs}/v1/games/multiget/thumbnails?universeIds=${chunk}` +
      `&countPerUniverse=1&defaults=true&size=768x432&format=Png&isCircular=false`);
    const thumbMap = {};
    (thumbs.data || []).forEach((e) => {
      const t = (e.thumbnails || [])[0];
      if (t && t.state === "Completed") thumbMap[e.universeId] = t.imageUrl;
    });
    details.data.filter((g) => g.id > 0).forEach((g) => out.push({
      universeId: g.id,
      rootPlaceId: g.rootPlaceId,
      name: g.name,
      visits: g.visits || 0,
      playing: g.playing || 0,
      favorites: g.favoritedCount || 0,
      thumb: thumbMap[g.id] || null,
    }));
  }
  const order = new Map(ids.map((id, i) => [id, i]));
  return out.sort((a, b) => order.get(a.universeId) - order.get(b.universeId));
}

const ids = C.games.map((g) => g.universeId);
const games = await fetchGames(ids);
const missing = ids.filter((id) => !games.some((g) => g.universeId === id));
if (missing.length) {
  const noFallback = missing.filter((id) => !C.games.find((g) => g.universeId === id).fallback);
  if (noFallback.length) {
    console.error("Roblox returned nothing for these games and they have no `fallback` in config.js:",
      noFallback.join(", "), "\nGive each one closed: true plus fallback { name, visits }, then run this again.");
    process.exit(1);
  }
  C.games.filter((g) => missing.includes(g.universeId)).forEach((g) => games.push({
    universeId: g.universeId, rootPlaceId: g.placeId || null, name: g.fallback.name,
    visits: g.fallback.visits || 0, playing: 0, favorites: g.fallback.favorites || 0, thumb: g.thumb || null,
  }));
  console.warn("Using saved numbers for games Roblox no longer reports:", missing.join(", "));
}

const totals = games.reduce((t, g) => ({
  visits: t.visits + g.visits, playing: t.playing + g.playing,
  favorites: t.favorites + g.favorites, count: t.count + 1,
}), { visits: 0, playing: 0, favorites: 0, count: 0 });

await fs.writeFile(file("assets/js/snapshot.js"),
  "/* Written by tools/prerender.mjs. Last known numbers, painted before the live fetch. */\n" +
  `window.SNAPSHOT = ${JSON.stringify({ at: new Date().toISOString(), games }, null, 1)};\n`);

const id = C.identity;
const vars = R.tokens(C, totals);
let html = await fs.readFile(file("index.html"), "utf8");

function region(name, content) {
  const re = new RegExp(`<!--pre:${name}-->[\\s\\S]*?<!--/pre:${name}-->`);
  if (!re.test(html)) throw new Error(`Marker pre:${name} not found in index.html`);
  html = html.replace(re, `<!--pre:${name}-->${content}\n          <!--/pre:${name}-->`);
}

function bindTo(key, content) {
  const re = new RegExp(`(<(\\w+)[^>]*\\sdata-bind="${key}"[^>]*>)[\\s\\S]*?(</\\2>)`, "g");
  if (!re.test(html)) throw new Error(`data-bind="${key}" not found in index.html`);
  html = html.replace(re, (m, open, tag, close) => open + content + close);
}

function attr(selector, value) {
  html = html.replace(selector, (m, before, after) => before + R.esc(value) + after);
}

const title = `${id.name} | ${id.role}`;
const description = R.fill(id.description || id.subline, vars);
html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${R.esc(title)}</title>`);
attr(/(<meta name="description" content=")[^"]*(")/, description);
attr(/(<meta property="og:title" content=")[^"]*(")/, title);
attr(/(<meta property="og:description" content=")[^"]*(")/, description);

bindTo("name", R.esc(id.name));
bindTo("role", R.esc(id.role));
bindTo("headline", R.emphasise(R.fill(id.headline, vars)));
bindTo("subline", R.esc(R.fill(id.subline, vars)));
bindTo("location", R.esc(id.location));
bindTo("availability", R.esc(id.available ? id.availableText : id.unavailableText));
bindTo("stat-visits", R.short(totals.visits));
bindTo("stat-ccu", R.full(totals.playing));
bindTo("stat-favs", R.short(totals.favorites));
bindTo("stat-games", String(C.games.length));
bindTo("proof-years", id.yearsExperience + "+");
bindTo("games-count", String(C.games.length));
bindTo("response-time", R.esc(C.contact.responseTime || ""));
bindTo("contact-lede", R.esc(C.contact.lede || ""));

/* Same slices as app.js: 4 cards in the hero deck, 5 in the bento, the rest in the grid. */
const rows = R.gameRows(C, games);
region("swap", rows.filter((g) => g.thumb).slice(0, 4).map(R.swapCard).join(""));
region("loop", rows.filter((g) => g.thumb).map(R.loopItem).join(""));
region("featured", rows.slice(0, 5).map(R.featuredCard).join(""));
region("games", rows.slice(5).map(R.gameCard).join(""));
region("bio", R.bio(C.about.bio, vars));
region("skills", R.skills(C.about.skills));
region("process", R.process(C.about.process));
region("media", R.media(C.media));
region("pricing", R.pricing(C.pricing));
region("channels", R.channels(R.channelItems(C.contact)));

await fs.writeFile(file("index.html"), html);

console.log(`Prerendered ${games.length} games: ${R.full(totals.visits)} visits, ` +
  `${totals.playing} playing, ${R.full(totals.favorites)} favourites.`);
