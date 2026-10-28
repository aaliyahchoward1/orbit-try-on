# Devpost submission — copy/paste fields

Deadline: **Monday, Nov 2, 2026, 11:45am ET**. Submit Sunday Nov 1.

---

## Project name
Orbit Try-On

## Elevator pitch (under 200 characters)
See a handmade brand's real lip glosses on your own lips, then buy the necklace they live in. YouCam skin-tone analysis + lip try-on for a one-woman beauty shop.

## Try it out (links)
- (Orbit Try-On live link: add after publishing)
- https://github.com/aaliyahchoward1/orbit-try-on
- https://www.etsy.com/shop/OddOrbitBeauty

## Built with
youcam-api, makeup-vto, skin-tone-analysis, typescript, react, node.js, express, postgresql, zod, replit

## Video demo link
(YouTube link after upload: public, 1–3 minutes)

---

## About the project

### Inspiration
I run Odd Orbit Beauty by myself: Renaissance-style lip gloss necklaces, with real vegan gloss sealed inside a baroque filigree vial. It's jewelry and makeup in one piece. My shop has had 33 orders, and more people leave items in their cart than buy them. The question I kept getting is the one a listing photo can't answer: what will this gloss look like on me? Big beauty brands solve that with virtual try-on. A handmade shop on Etsy usually can't. The YouCam API made it possible for a one-person brand to offer the same thing.

### What it does
Orbit Try-On turns one selfie into a try-on for my four real shades: Black Siren, Aquariosa, Nebula's Gaze, and Blood Moon.

1. Upload a selfie or use the front camera. Nothing leaves the page until you tap analyze.
2. YouCam AI Skin Tone Analysis reads your skin, lip, eye, brow, and hair colors.
3. The app estimates your skin depth and undertone and ranks all four shades for the mood you pick: everyday, soft glam, bold, or space baroque.
4. YouCam Makeup VTO applies the chosen gloss to your lips, with an optional matching liner.
5. Flip before and after, try every shade, then tap "wear this shade" to go to that necklace's Etsy listing.

### How I built it
- **YouCam File API** registers each selfie and uploads it to a signed URL.
- **AI Skin Tone Analysis** (`skin-tone-analysis`) returns five face colors.
- **Makeup VTO** (`makeup-vto`) applies `lip_color` with gloss texture, color intensity, gloss level, and transparency, plus optional `lip_liner` in the same task.
- The shade colors came from sampling pixels in my real product photos, then lightening them slightly, because a thin film of gloss on lips reads lighter than a full vial.
- Skin depth and undertone come from converting the measured skin hex to CIELAB. It's a simple, documented estimate, and the app says so on screen.
- The server is Express and TypeScript, the client is React, and it runs on Replit. The API key stays on the server.

### Challenges I ran into
- **Making colors honest.** A gloss in a vial photographs much darker than it looks on lips, and warm lighting pushed Blood Moon toward orange. I compared photos under different light and chose the most neutral readings. A try-on that lies about color would hurt a small brand more than having no try-on at all.
- **Protecting a small API budget.** Every analysis and try-on costs units. Tasks are created once and only polled after a network error, so a dropped response never charges twice. Identical photos share one analysis, and a database counter enforces a daily cap that shuts off rather than overspends.
- **Privacy with no accounts.** Shoppers don't sign in, so scan results ride in an encrypted, expiring token instead of a database. Photos are never saved to disk, the database, logs, or browser storage.

### Accomplishments that I'm proud of
- It sells real products. Every shade links to a real listing in a real shop.
- It explains itself. Error messages tell people how to fix their photo, like "look straight at the camera" or "move a little closer," instead of returning a code.
- It looks like my brand, not a template: the same Space Baroque world as my shop and my Zenithia brand site.

### What I learned
How YouCam's async task flow works (upload, create, poll), how much lighting and camera processing shift color, and that keeping a paid API safe to put in front of the public is as much work as the feature itself.

### What's next for Orbit Try-On
- Add the try-on to my brand site and Instagram link-in-bio so it works as a shopping tool year-round.
- Add Venus, a new cherry-red shade, plus product photos next to each result.
- Offer the same try-on to other small handmade beauty sellers, who have the same problem I do.

---

## Screenshots to upload (take these after live mode is on)
1. Landing: "orbit try-on" heading with upload and camera buttons.
2. Color map: the five face-color chips and the depth/undertone estimate.
3. All four shade cards ranked, with match percentages.
4. The try-on result on a selfie (after), with the before/after toggle visible.
5. The same face in two different shades, side by side (combine two screenshots).
6. The Etsy listing that "wear this shade" opens.

Use your own selfie or one you have permission to use. Do not use a stranger's photo.
