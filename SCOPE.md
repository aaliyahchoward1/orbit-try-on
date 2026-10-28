# YouCam API Hackathon — Build Scope
**Contest:** YouCam API Skin AI & eCommerce VTO Hackathon (Perfect Corp, Devpost)
**Track:** eCommerce VTO
**Deadline:** Monday, Nov 2, 2026, 11:45am ET — hard stop
**Prizes in reach:** 1st $2,500 / 2nd $1,000 / 3rd $500 + Women in Tech Award $1,000 (solo woman founder = eligible). Winners also get a feature blog + a product/developer marketing meeting with Perfect Corp.
**Registration:** https://youcam-api-skin-ai-ecommerce.devpost.com/

> SYNC POINT: Mina is also building pieces of this in Claude. Fold that work in here — this scope is the frame, not a competing plan. Update "Current state" below as pieces land.

## The concept — "Orbit Try-On"
A shopper uploads a selfie, tries the actual gloss shades from Odd Orbit Beauty's Renaissance Lipgloss Necklaces on her own lips via the YouCam Makeup VTO API, then taps through to buy the physical necklace on Etsy.

Why it fits this contest specifically:
- It's a *real* product from a *real* micro-brand — judges score "Potential Impact" on a credible case for a real audience. Most entries are hypothetical; ours ships.
- The product is jewelry + gloss in one. Shade uncertainty is the #1 reason gloss doesn't convert online, and you can't swatch a necklace in a listing photo.
- After the contest it lives on as an OOB asset (brand site / link-in-bio), so the build isn't disposable.

## What to submit (verified from Devpost)
- [ ] Public code repo (or private shared with Devpost testing) with README + run instructions
- [ ] Text description — features, functionality, clear consumer/retail value (draft in SUBMISSION_DRAFT.md)
- [ ] Screenshots of the project
- [ ] Demo video, 1–3 minutes, public on YouTube (preferred) — must name the YouCam API used, show the app working end-to-end, NO copyrighted music
- [ ] (If winner) exit interview + agree to a blog article

Judged on: **Technological Implementation** (thorough API integration, non-trivial, working) · **Design** (complete product experience, not a tech demo) · **Potential Impact** (specific problem, real audience) · **Quality of Idea** (creative, non-obvious use of the API).

## API plan
- **Primary: YouCam Makeup & Look Virtual Try-On API — Lip Color category.**
  - Custom shade color + intensity per shade; textures: Gloss (Black Siren, Nebula, Blood Moon), Shimmer (Aquariosa).
  - Photo mode: user uploads a photo → API returns the try-on image. (Live AR Web SDK = stretch goal only if core ships early.)
- **Budget:** 1,000 free units on signup (register on Devpost → redeem code at the YouCam API console). Treat units as scarce: develop against a small set of test selfies, cache results, never loop-test.
- **Stretch (only if core is done by Oct 28):** add a second API for shade matchmaking — skin-tone/facial-color analysis → "your shade is Nebula" recommendation before the try-on. Two APIs reads as non-trivial integration to judges; one done well beats two done shaky.
- **Privacy (put it in the app, judges notice):** photos are processed for the try-on and not stored.

## The four shades (digital starting points — tune against real swatches)
The physical gloss is the truth; these hexes are starting approximations to calibrate on screen against the real product, across light/medium/deep skin tones.
- **Black Siren** — near-black gloss, warm undertone — ~#201418, Gloss texture
- **Aquariosa** — iridescent blue — ~#4A7FB5, Shimmer texture
- **Nebula** — deep purple — ~#5B2A86, Gloss texture
- **Blood Moon** — raspberry pink-red (NOT deep blood-red) — ~#B81E4A, Gloss texture

## App scope (v1 — the smallest thing that wins)
1. Landing: one line of what this is + the four shade cards (real product photos).
2. Upload a selfie (or use camera capture) → privacy line under the button.
3. Shade picker: tap a shade → YouCam lip-color VTO applies it (gloss finish, adjustable intensity if cheap to add).
4. Result screen: before/after toggle or slider; the matching necklace photo beside it.
5. "Wear this shade" button → the shade's Etsy listing. (Jewelry by day, gloss by night.)
6. Save/share the result image (this doubles as the social content for the bonus API units: 500 per qualifying demo post, up to 2).

**Stack (portable, $0):** plain static front end (HTML/CSS/JS) + one tiny serverless function to hold the API key (never expose the key client-side). Deploy on a free tier (Vercel/Netlify/GitHub Pages + functions). Repo public on GitHub from day one — it's a submission requirement, and it feeds the React brand site later.

**Design:** OOB Space Baroque — deep purple/void background, gold accents, Vivaldi for ceremonial headlines, Cormorant for editorial body. It should look like an OOB product, not a hackathon template. That IS the Design score.

## Timeline (13 days, around a day job)
- **Oct 20–21 — Setup + spike.** Register Devpost + YouCam API, redeem 1,000 units. One test call: apply one lip color to one photo, confirm the pipeline. Fold in whatever the Claude sessions have already produced.
- **Oct 22–25 — Core build.** Upload → shade pick → try-on → result → Etsy link. Ugly is fine; working end-to-end is the goal.
- **Oct 26–28 — Brand + polish.** Space Baroque skin, before/after, save/share, mobile pass. Stretch API only if everything above is solid.
- **Oct 29–30 — Submission assets.** Screenshots, repo README, finalize Devpost description.
- **Oct 31–Nov 1 — Demo video.** Screen-record the real flow, voiceover naming the YouCam API, ≤3 min, no copyrighted music. Upload public to YouTube.
- **Nov 2, before 11:45am ET — Submit.** (Buffer is Nov 1; do not plan to build on the 2nd.)
- **After submitting:** post the demo to @oddorbitbeauty → claim bonus API units via the Share & Earn form.

## Risks
- **API units burn:** 1,000 sounds like a lot until a debug loop eats them. Cache every response during dev.
- **Shade truth:** a try-on that lies about the color hurts the brand. Calibrate against real swatches; "close and honest" beats "prettier."
- **Scope creep:** live AR, accounts, carts — all cut. Upload → try-on → buy link is the whole product.
- **The Etsy announcement lesson applies:** after submitting on Devpost, re-open the submission page logged-out and confirm everything is actually there.

## Current state
- Concept approved by founder (Oct 20). GitHub connected to Muse (Oct 19–20) for the repo.
- Founder has parallel work in progress in Claude — sync pending.
- Not yet registered on Devpost / YouCam API (step 1).

### Update — Oct 28, 2026
- Standalone Orbit Try-On app being built on Replit from this repo's `src/` (try-on only, nothing else).
- Uses two YouCam APIs: AI Skin Tone Analysis + Makeup VTO (lip_color + optional lip_liner).
- All four shade hexes sampled from real product photos (see README).
- Devpost text in `SUBMISSION.md`; video script in `DEMO_SCRIPT.md`.
- Left for the founder: add `YOUCAM_API_KEY` + `YOUCAM_MOCK_MODE=false` in the new app's Secrets and publish, test a real selfie, take screenshots, record and upload the video, submit by Sunday Nov 1.
