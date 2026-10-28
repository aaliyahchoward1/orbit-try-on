# Orbit Try-On

**See Odd Orbit Beauty's real lip glosses on your own lips before you buy the necklace they live in.**

Entry for the [YouCam API Skin AI & eCommerce VTO Hackathon](https://youcam-api-skin-ai-ecommerce.devpost.com/) (Perfect Corp · eCommerce VTO).

**Try it:** https://lunuff-astro-podra-2.replit.app/shade-finder

## What it does

[Odd Orbit Beauty](https://www.etsy.com/shop/OddOrbitBeauty) is a one-woman, handmade brand: Renaissance-style lip gloss necklaces, with real vegan gloss inside a baroque filigree vial. Shoppers can't swatch a necklace through a listing photo, so they can't tell how the gloss inside will look on them.

Orbit Try-On fixes that in one flow:

1. **Upload a selfie or use the front camera.** Nothing is sent until you tap analyze.
2. **YouCam AI Skin Tone Analysis** reads five face colors: skin, lips, eyes, brows, hair.
3. The app estimates skin depth and undertone in CIELAB, then **ranks all four shades** against a mood you pick (everyday, soft glam, bold, space baroque).
4. **YouCam Makeup VTO (lip_color)** puts the chosen gloss on your lips, with an optional matching lip liner in the same task.
5. Flip **before / after**, try every shade, then tap **wear this shade** to go straight to the Etsy listing.

## The four shades

All colors were sampled from real product photos (Oct 28, 2026), then lightened slightly for how a thin gloss film reads on lips.

| Shade | Hex | Necklace |
|---|---|---|
| Black Siren | `#3B2A20` (sheer bronze-brown) | Silver-tone cage, best seller |
| Aquariosa | `#2E6FA8` (ocean blue) | Silver-tone cage |
| Nebula's Gaze | `#6E2F68` (plum-magenta) | Gold-tone cage |
| Blood Moon | `#7A2E3B` (deep oxblood) | Gold-tone cage |

Catalog: [`src/server/products.ts`](./src/server/products.ts) · calibration for the API spike: [`spike/shades.json`](./spike/shades.json)

## YouCam APIs used

| API | Endpoint | Used for |
|---|---|---|
| File API | `POST /s2s/v2.0/file` | Register the selfie and upload it to YouCam's signed URL |
| AI Skin Tone Analysis | `task/skin-tone-analysis` | Five face colors + hair color name |
| Makeup VTO | `task/makeup-vto` | `lip_color` (gloss, intensity, gloss level, transparency) + optional `lip_liner` |

All calls are server-side with v2 bearer auth. The API key never reaches the browser. See [`src/server/youcam.ts`](./src/server/youcam.ts).

## Architecture

```
browser (React)                       server (Express)                     YouCam
-------------------------------       ---------------------------------    ----------------------
resize to ≤1600px JPEG, strip EXIF -> /analyze  validate JPEG, rate limit -> File API upload
                                      reserve daily unit budget         -> skin-tone-analysis task
                                      encrypt scan in AES-GCM token  <-   poll until success
pick mood                          -> /rank     re-rank, no API call
pick shade                         -> /try-on   cached per shade/liner  -> makeup-vto task
before/after, "wear this shade"  <-            result URL (memory only) <-
```

Design choices worth noting:

- **Units are protected.** Tasks are created once and only *polled* on transient errors, so a lost response never charges twice. Identical photos share one analysis. A PostgreSQL counter enforces a daily cap and fails closed.
- **No photo storage.** Selfies are never written to disk, the database, logs, or browser storage. Session state lives in an encrypted, expiring token (`src/server/session.ts`), so the server stores nothing per user.
- **Friendly errors.** Provider error codes map to plain-language fixes ("look straight at the camera", "move a little closer") in `src/server/errors.ts`.
- **Demo mode by default.** Live spending requires an explicit `YOUCAM_MOCK_MODE=false` plus a key.

## Source layout

This repo mirrors the try-on module. The running app (Lunuff, Odd Orbit Beauty's companion app) is hosted on Replit, where this module is mounted at `/api/shade-finder` and served at `/shade-finder`.

```
src/server/youcam.ts    YouCam File API, task creation, polling, effect payloads
src/server/routes.ts    /status, /analyze, /rank, /try-on
src/server/scoring.ts   CIELAB skin estimate + shade ranking
src/server/products.ts  the four shades
src/server/session.ts   encrypted, expiring scan tokens
src/server/limits.ts    per-IP limits + atomic daily unit budget
src/server/image.ts     JPEG validation without decoding
src/shared/             types shared with the React client
spike/                  stdlib-only Python spike for the lip_color task
```

## Run it

In the host Express app (Node 20+, PostgreSQL):

```bash
# required
export SESSION_SECRET=any-long-random-string
export DATABASE_URL=postgres://...
# live mode (omit both to stay in free demo mode)
export YOUCAM_API_KEY=your_key
export YOUCAM_MOCK_MODE=false
```

```ts
import { createShadeFinderRouter } from "./src/server/routes";
app.use("/api/shade-finder", createShadeFinderRouter()); // mount before global JSON logging
```

Optional caps: `SHADE_FINDER_DAILY_SCAN_CAP` (40), `SHADE_FINDER_DAILY_TRYON_CAP` (240), `SHADE_FINDER_IP_SCANS_PER_HOUR` (5), `SHADE_FINDER_IP_TRYONS_PER_HOUR` (24).

Python spike:

```bash
export YOUCAM_API_KEY=your_key
python3 spike/spike.py --shade nebula --url <public-selfie-url>
```

## Privacy

Photos are processed for the try-on and not stored by this app. In live mode they are sent to YouCam, whose own API privacy policy governs provider-side processing.

---
*Odd Orbit Beauty: handmade, vegan lipgloss necklaces from New Jersey. [Etsy](https://www.etsy.com/shop/OddOrbitBeauty) · [@oddorbitbeauty](https://www.instagram.com/oddorbitbeauty) · [Zenithia](https://aaliyahchoward1.github.io/zenithia-web/)*
