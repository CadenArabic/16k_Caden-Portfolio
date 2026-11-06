# Fullstack Roblox Developer — Portfolio

A single-screen, tab-based portfolio. Nothing scrolls: six tabs (Welcome, About,
Live Stats, Games, Media, Contact) swap in place, and visit/CCU numbers are
pulled live from Roblox.

Plain HTML, CSS and JavaScript. No dependencies, no npm install. One optional
Node script (`tools/prerender.mjs`) bakes the content into `index.html`.

---

## Run it

Double-clicking `index.html` mostly works, but live stats need a real origin.
Serve the folder instead:

```bash
python -m http.server 4321
```

Then open <http://localhost:4321>.

---

## Everything you edit is in one file

`assets/js/config.js`. Nothing else needs touching. It has seven sections:

| Section | What it controls |
|---|---|
| `identity` | Your name, role, headline, meta description, availability, years of experience |
| `contact` | Discord, X, Talent Hub, Roblox profile, optional email — feeds every CTA on the site |
| `pricing` | The monthly price cards on the Contact tab |
| `about` | Bio paragraphs, skill groups, your 3-step process |
| `games` | Universe IDs, place IDs, your role and what you built on each |
| `media` | Your videos and screenshots |
| `api` | Refresh rate and cache. You shouldn't need to change it. |

**After every edit, run the prerender** (next section) so the page source matches.

### The headline

Whatever you wrap in `*asterisks*` gets the green-to-cyan gradient:

```js
headline: "One developer for your *whole Roblox game.*",
```

`{games}`, `{visits}` and `{years}` in the headline, subline, description or bio
are filled in for you: the number of games, their combined visits ("22M+"), and
`yearsExperience`. No more hand-updating "14 of them are live".

---

## Prerender (do this after editing config.js)

```bash
node tools/prerender.mjs
```

The site builds itself with JavaScript, so anything that reads the raw HTML —
portfolio raters like Rohire, search engines, Discord and X link previews — used
to see empty boxes. This script runs the same rendering code (`assets/js/render.js`)
in Node, pulls the current numbers from Roblox, and writes the finished markup
between the `<!--pre:name-->` markers in `index.html`. It also saves those
numbers to `assets/js/snapshot.js`, which the site shows instantly on a first
visit and falls back to if Roblox can't be reached. Commit both files.

---

## Games

Your games are in `config.js`, biggest first. Visits, CCU, favourites, the name
and the thumbnail are fetched live. You write `role` and `contribution` (one line
on what you built — this is the proof clients and raters look for):

```js
{ universeId: 10023401715, placeId: 121627323638824, role: "Scripter",
  contribution: "Bow combat, lucky block rolls, damage and luck upgrades, rebirths." },
```

`placeId` keeps the Play link working even when Roblox is unreachable. A game
that went private gets `closed: true`: it keeps its visits but shows "Closed"
instead of a Play link.

The list holds every game from your groups with 10K+ visits or 1+ playing.

### Adding a new game

The Universe ID is in the game's URL on the Roblox site — the `universeId=`
parameter. Or open your game → **Configure** and read it from
`.../universes/configure?id=XXXXXXXXX`. The place ID is the number in the
normal game link (`roblox.com/games/<placeId>`). Then run the prerender.

---

## Videos and images

Your two X clips were downloaded into `assets/media/` (`clip-01.mp4`,
`clip-02.mp4`) rather than hotlinked. Twitter's `video.twimg.com` URLs expire and
get rate-limited, so self-hosting means they keep working. Give them real titles
in `config.js` when you get a chance.

To add more, drop files in `assets/media/` and list them:

```js
media: [
  { type: "video",   src: "assets/media/clip-01.mp4", title: "Combat demo" },
  { type: "image",   src: "assets/media/tycoon-ui.png", title: "Tycoon UI" },
  { type: "youtube", src: "dQw4w9WgXcQ", title: "Full walkthrough" },
],
```

For YouTube use the **video ID only**, not the full URL. An mp4 without a
`poster` shows a frame from half a second in as its thumbnail. See
[assets/media/README.md](assets/media/README.md) for sizing guidance.

---

## Deploying

Any static host works — there's no server code.

**GitHub Pages**
```bash
git init && git add . && git commit -m "Portfolio"
```
Push to a repo, then Settings → Pages → deploy from `main` / root.

**Netlify or Cloudflare Pages** — drag the folder onto their dashboard. Done.

---

## How the live stats work

Roblox's API doesn't send CORS headers, so a browser can't call it directly from
your domain. Requests go through `roproxy.com`, a public read-only mirror of the
Roblox API. No API key, no login, only public game data.

The order of attempts is:

1. `games.roproxy.com` — the mirror
2. `games.roblox.com` — direct, in case you're hosting somewhere it's allowed
3. `localStorage` cache — the last successful reading
4. The `fallback` numbers in your config

The tab never shows a broken state; it degrades through those four steps and
tells you which one it's on via the pill in the top right.

If roproxy ever goes down, swap the host in `config.js` → `api.hosts`.

---

## Keyboard and accessibility

- `←` / `→` switch tabs from anywhere
- Every tab is deep-linkable: `yoursite.com/#games` opens on that tab
- Proper `tablist` / `tab` / `tabpanel` roles and roving tabindex
- Focus rings on everything, `Esc` closes the media viewer
- `prefers-reduced-motion` disables all animation
- Touch targets grow to 44px on touch devices

---

## Device sizes

Verified with nothing scrolling at 1440×900, 1280×800, 1024×768, 768×1024 and
844×390 (landscape phone). The Games and Media grids measure themselves and pick
how many cards fit, so a page never overflows and never wastes a row:

| Screen | Games per page |
|---|---|
| 1440×900 | 14 |
| 375×812 | 4, as horizontal rows |

Other sizes fit as many as the screen holds; the pager covers the rest.

### One exception

On phones in portrait, the **About** panel scrolls internally — roughly 80px at
390×844, 130px at 360×740. There is more text in it than a phone screen holds.
Every other panel fits exactly, at every size, including landscape.

To make About fit phones too, shorten `about.bio` to one paragraph or drop a
couple of `about.skills` items in `config.js`.

---

## Layout

```
index.html                 markup + inline SVG icon sprite (+ prerendered content)
assets/css/styles.css      design tokens, layout, animation
assets/js/config.js        ← the only file you edit
assets/js/render.js        markup for bio, skills, games, pricing, contact (browser + Node)
assets/js/snapshot.js      last numbers saved by the prerender
assets/js/roblox.js        live stats fetching, caching, fallbacks
assets/js/app.js           tabs, routing, paging, live stats, lightbox
assets/media/              your images and videos
tools/prerender.mjs        bakes content into index.html (node tools/prerender.mjs)
```
