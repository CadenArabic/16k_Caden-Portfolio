# Roblox Luau Developer — Portfolio

A single-screen, tab-based portfolio. Nothing scrolls: six tabs (Welcome, About,
Live Stats, Games, Media, Contact) swap in place, and visit/CCU numbers are
pulled live from Roblox.

Plain HTML, CSS and JavaScript. No build step, no dependencies, no npm install.

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

`assets/js/config.js`. Nothing else needs touching. It has six sections:

| Section | What it controls |
|---|---|
| `identity` | Your name, role, headline, availability, years of experience |
| `contact` | Discord, X, optional email — feeds every CTA on the site |
| `about` | Bio paragraphs, skill groups, your 3-step process |
| `games` | Universe IDs — this is what makes the live stats work |
| `media` | Your videos and screenshots |
| `api` | Refresh rate and cache |
| `api` | Refresh rate and cache. You shouldn't need to change it. |

### The headline

Whatever you wrap in `*asterisks*` gets the green-to-cyan gradient:

```js
headline: "I build Roblox systems that ship — *and survive live players.*",
```

---

## Games

Your 14 games are already in `config.js`. Visits, CCU, favourites, the name, the
thumbnail and the play link are all fetched live — the only thing written by hand
is `role`, which is set to "Scripter" everywhere. Change any that are wrong:

```js
{ universeId: 10023401715, role: "Lead Scripter" },
```

You can also add `contribution` (one line under the title) and `fallback`
(numbers shown if Roblox is unreachable):

```js
{
  universeId: 10023401715,
  role: "Lead Scripter",
  contribution: "Economy and anti-exploit.",
  fallback: { name: "Bow for Lucky Blocks", visits: 75000, playing: 0 },
},
```

### Adding a new game

The Universe ID is in the game's URL on the Roblox site — the `universeId=`
parameter. Or open your game → **Configure** and read it from
`.../universes/configure?id=XXXXXXXXX`. It is not the place ID.

The headline in `config.js` says "14 of them are live" — update that number when
you add one.

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
| 1440×900 | all 14, no pager |
| 1280×800 | 12 |
| 1024×768 | 10 |
| 768×1024 | 9 |
| 390×844 | 5, as horizontal rows |

### One exception

On phones in portrait, the **About** panel scrolls internally — roughly 80px at
390×844, 130px at 360×740. There is more text in it than a phone screen holds.
Every other panel fits exactly, at every size, including landscape.

To make About fit phones too, shorten `about.bio` to one paragraph or drop a
couple of `about.skills` items in `config.js`.

---

## Layout

```
index.html                 markup + inline SVG icon sprite
assets/css/styles.css      design tokens, layout, animation
assets/js/config.js        ← the only file you edit
assets/js/roblox.js        live stats fetching, caching, fallbacks
assets/js/app.js           tabs, routing, rendering, lightbox
assets/media/              your images and videos
```
