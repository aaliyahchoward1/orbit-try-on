# Orbit Try-On — API spike

Proves the YouCam AI Makeup VTO pipeline end-to-end before the core build:
**task → poll → result image**, for one real OOB shade.

## Run it (Oct 20–21 slot)

1. Register on Devpost → sign up at the YouCam API console → redeem the hackathon
   code for the **1,000 free units**:
   https://youcam-api-skin-ai-ecommerce.devpost.com/
2. Generate an API key: https://yce.makeupar.com/api-console/en/api-keys/
3. First spike — one shade, one unit, pipeline proven:

```bash
cd ~/workspace/youcam-hackathon/spike
export YOUCAM_API_KEY="paste-key-here"   # never commit this
python3 spike.py --shade nebula --url https://<public-selfie-url>
```

4. Result lands in `results/nebula-result.jpg` (+ the raw task JSON).
   **Eyeball it against the real Nebula gloss vial.** If the color lies, tune the hex
   in `shades.json` — shade truth is a judging risk called out in SCOPE.md.

## Local selfie (not a public URL)

The API needs a `file_id` for private files. Two-step, per the docs:

```bash
# 1. ask the File API for an upload URL + file_id
curl -sS -X POST https://yce-api-01.makeupar.com/s2s/v2.0/file/makeup-vto \
  -H "Authorization: Bearer $YOUCAM_API_KEY"
# 2. PUT your selfie bytes to the upload URL in that response (Content-Type: image/jpeg),
#    then rerun the spike with the returned file_id:
python3 spike.py --shade nebula --file-id <FILE_ID>
```

## Burn all four shades (4 units)

```bash
python3 spike.py --shade all --yes --url https://<public-selfie-url>
```

## What this verified (Oct 20, from the official docs)

- V2 endpoints: `POST /s2s/v2.0/task/makeup-vto` → `task_id`;
  poll `GET /s2s/v2.0/task/makeup-vto/<task_id>` until `task_status` is `success`.
- Auth is just `Authorization: Bearer <API_KEY>` — no separate auth call.
- `lip_color` effect schema: `category` / `shape.name` (use `"original"`) /
  `style.type` (`"full"`) / `palettes[]` with `color`, `texture`
  (`matte|gloss|holographic|metallic|satin|sheer|shimmer`), `colorIntensity`,
  plus `gloss` (required for gloss/shimmer textures) and `shimmerColor` /
  `shimmerIntensity` / `shimmerDensity` / `shimmerSize` (required for shimmer).
- Face rules: single front-facing face, face width ≥ 100px, long side < 1920px,
  < 10MB, jpg/jpeg/png.
- **No units are consumed on errors** — safe to iterate on bad params, but still
  cache every success during dev.
- Files retained 24h; the result download link can expire after ~2h, so the
  script saves the image immediately.

Docs: https://yce.perfectcorp.com/document/index.html (AI Makeup Vto section)
Playground (zero-code first test): http://yce.makeupar.com/api-console/en/api-playground/ai-makeup-virtual-try-on/
