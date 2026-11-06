/* ============================================================================
   roblox.js — pulls live visits / CCU / thumbnails for a list of Universe IDs.

   Roblox's own API doesn't send CORS headers, so a browser can't call it
   directly from your domain. We try each host in CONFIG.api.hosts in order
   (a public read-only mirror first, Roblox direct second) and fall back to
   cached, then to the `fallback` values in config.js.

   Nothing here needs an API key — this is all public game data.
   ========================================================================= */

window.RobloxStats = (function () {
  "use strict";

  const CACHE_KEY = "rbx-portfolio-stats-v1";
  const TIMEOUT_MS = 8000;

  /* ---- helpers --------------------------------------------------------- */

  function fetchJSON(url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    return fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } })
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .finally(() => clearTimeout(timer));
  }

  /* The configured universe IDs, in a stable order — used as a cache key so a
     stale entry can never outlive the games list that produced it. */
  function configuredIds() {
    return (window.CONFIG.games || [])
      .map((g) => g.universeId)
      .filter((id) => typeof id === "number" && id > 0)
      .sort((a, b) => a - b);
  }

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.key !== configuredIds().join(",")) return null;   // games changed
      const ageMin = (Date.now() - parsed.at) / 60000;
      return { ...parsed, stale: ageMin > (window.CONFIG.api.cacheMinutes || 10) };
    } catch (_) {
      return null;
    }
  }

  function writeCache(games) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        at: Date.now(), key: configuredIds().join(","), games,
      }));
    } catch (_) { /* private mode — not fatal */ }
  }

  /* The numbers tools/prerender.mjs saved last time it ran, limited to the
     games still in config. Better than nothing when Roblox can't be reached. */
  function fromSnapshot() {
    const snap = window.SNAPSHOT;
    if (!snap || !Array.isArray(snap.games)) return null;
    const ids = new Set(configuredIds());
    const games = snap.games.filter((g) => ids.has(g.universeId));
    return games.length ? games : null;
  }

  /* Build the shape the UI consumes, from config alone. */
  function fromFallback() {
    const snap = fromSnapshot();
    if (snap) return snap;
    return (window.CONFIG.games || []).map((g, i) => ({
      universeId: g.universeId || -(i + 1),
      rootPlaceId: null,
      name: (g.fallback && g.fallback.name) || "Untitled game",
      visits: (g.fallback && g.fallback.visits) || 0,
      playing: (g.fallback && g.fallback.playing) || 0,
      favorites: (g.fallback && g.fallback.favorites) || 0,
      thumb: g.thumb || null,
    }));
  }

  /* ---- network --------------------------------------------------------- */

  /* Roblox caps both endpoints at 50 universe IDs per request. */
  async function fetchFromHost(host, ids) {
    const parts = [];
    for (let i = 0; i < ids.length; i += 50) parts.push(fetchChunk(host, ids.slice(i, i + 50)));
    return (await Promise.all(parts)).flat();
  }

  async function fetchChunk(host, ids) {
    const idParam = ids.join(",");

    const details = await fetchJSON(`${host.games}/v1/games?universeIds=${idParam}`);
    if (!details || !Array.isArray(details.data)) throw new Error("Unexpected payload");

    // Thumbnails are a bonus — a failure here must not sink the whole load.
    let thumbMap = {};
    try {
      const thumbs = await fetchJSON(
        `${host.thumbs}/v1/games/multiget/thumbnails?universeIds=${idParam}` +
        `&countPerUniverse=1&defaults=true&size=768x432&format=Png&isCircular=false`
      );
      (thumbs.data || []).forEach((entry) => {
        const first = (entry.thumbnails || [])[0];
        if (first && first.state === "Completed") thumbMap[entry.universeId] = first.imageUrl;
      });
    } catch (_) { /* keep going without art */ }

    return details.data.map((g) => ({
      universeId: g.id,
      rootPlaceId: g.rootPlaceId,
      name: g.name,
      visits: g.visits || 0,
      playing: g.playing || 0,
      favorites: g.favoritedCount || 0,
      thumb: thumbMap[g.id] || null,
    }));
  }

  /* ---- public API ------------------------------------------------------ */

  /**
   * Resolves to { games, totals, status }
   * status: "live" | "cached" | "fallback" | "empty"
   */
  async function load() {
    const ids = (window.CONFIG.games || [])
      .map((g) => g.universeId)
      .filter((id) => typeof id === "number" && id > 0);

    if (!ids.length) {
      const games = fromFallback();
      return { games, totals: totalsOf(games), status: "empty" };
    }

    for (const host of window.CONFIG.api.hosts) {
      try {
        const games = await fetchFromHost(host, ids);
        if (games.length) {
          writeCache(games);
          return { games, totals: totalsOf(games), status: "live" };
        }
      } catch (err) {
        console.warn("[stats] host failed:", host.games, err.message);
      }
    }

    const cached = readCache();
    if (cached && cached.games && cached.games.length) {
      return { games: cached.games, totals: totalsOf(cached.games), status: "cached" };
    }

    const games = fromFallback();
    return { games, totals: totalsOf(games), status: "fallback" };
  }

  function totalsOf(games) {
    return games.reduce(
      (acc, g) => ({
        visits: acc.visits + (g.visits || 0),
        playing: acc.playing + (g.playing || 0),
        favorites: acc.favorites + (g.favorites || 0),
        count: acc.count + 1,
      }),
      { visits: 0, playing: 0, favorites: 0, count: 0 }
    );
  }

  /* Read the instantly-available cache (or the saved snapshot on a first
     visit) so the first paint isn't a dash. */
  function peekCache() {
    const cached = readCache();
    const games = (cached && cached.games && cached.games.length) ? cached.games : fromSnapshot();
    if (!games) return null;
    return { games, totals: totalsOf(games), status: "cached" };
  }

  return { load, peekCache };
})();
