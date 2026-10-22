# Orbit Try-On

**Virtual lip-color try-on for Odd Orbit Beauty's Renaissance Lipgloss Necklaces — built on the YouCam Makeup VTO API (Perfect Corp).**

Entry for the [YouCam API Skin AI & eCommerce VTO Hackathon](https://youcam-api-skin-ai-ecommerce.devpost.com/) (eCommerce VTO track).

## The idea

Small beauty brands can't offer the try-before-you-buy experience the big houses can. Orbit Try-On closes that gap: upload a selfie, try on Odd Orbit Beauty's four real shades, and see each result beside the actual necklace it belongs to — then tap through to buy it.

## The four shades

| Shade | Color (starting calibration) | Finish |
|---|---|---|
| Black Siren | `#201418` near-black plum | Gloss |
| Aquariosa | `#4A7FB5` celestial blue | Shimmer |
| Nebula | `#5B2A86` deep violet | Gloss |
| Blood Moon | `#B81E4A` raspberry pink-red | Gloss |

Shade definitions live in [`spike/shades.json`](./spike/shades.json), shared between the API spike and the app build.

## Status

- ✅ API spike (`spike/spike.py`) — stdlib-only Python, exercises the Makeup VTO Lip Color task end to end. Exits safely before any network call when no API key is set.
- 🔨 Web app — static front end + one serverless function to hold the API key, Space Baroque styling.

## Run the spike

```bash
export YOUCAM_API_KEY=your_key_here
python3 spike/spike.py --shade nebula --url <public-selfie-url>
```

## Privacy

Selfies are sent to the YouCam API for processing and are never stored.

---
*Odd Orbit Beauty — handmade, vegan lipgloss necklaces. [Etsy](https://www.etsy.com/shop/OddOrbitBeauty) · [@oddorbitbeauty](https://www.instagram.com/oddorbitbeauty)*
