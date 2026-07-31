# Media folder

Drop your screenshots and video clips in here, then list them in
`assets/js/config.js` under `media`.

## Supported

| Type | Config | Notes |
|------|--------|-------|
| Image | `{ type: "image", src: "assets/media/shot-01.png" }` | PNG / JPG / WebP. WebP is smallest. |
| YouTube | `{ type: "youtube", src: "dQw4w9WgXcQ" }` | Just the video ID from the URL, not the whole link. |
| Local video | `{ type: "video", src: "assets/media/clip.mp4", poster: "assets/media/clip.png" }` | MP4 (H.264). Always add a `poster` — without one the tile is blank until it loads. |

## Sizing

Tiles are cropped to 16:10, and the lightbox shows the full image.
- Screenshots: export at **1600×900** or larger.
- Keep each file under ~1 MB so the site stays fast. Videos over ~10 MB should
  go on YouTube instead and be embedded with `type: "youtube"`.

## Naming

Anything works, but lowercase-with-dashes avoids problems on Linux hosts
(GitHub Pages, Netlify): `combat-system-demo.png`, not `Combat System Demo.PNG`.
