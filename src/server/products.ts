import type { LipProduct } from "../shared/shadeFinder";

/**
 * All four shade colors were sampled from real product photos on Oct 28, 2026.
 */
export const lipProducts: LipProduct[] = [
  { id: "black-siren", name: "Black Siren", placeholder: false, vibes: ["bold", "space baroque"], undertones: ["cool", "neutral"], depths: ["deep", "medium"], hex: "#3B2A20", finish: "gloss", intensity: 55, gloss: 75, transparency: 55, productUrl: "https://www.etsy.com/listing/1757324681/black-siren-renaissance-lip-gloss" },
  { id: "aquariosa", name: "Aquariosa", placeholder: false, vibes: ["everyday", "soft glam"], undertones: ["cool", "neutral"], depths: ["light", "medium"], hex: "#2E6FA8", finish: "gloss", intensity: 60, gloss: 65, transparency: 45, productUrl: "https://www.etsy.com/listing/1861520817/oceana-renaissance-lipgloss-necklace" },
  { id: "nebulas-gaze", name: "Nebula's Gaze", placeholder: false, vibes: ["soft glam", "space baroque"], undertones: ["cool", "neutral"], depths: ["medium", "deep"], hex: "#6E2F68", finish: "gloss", intensity: 60, gloss: 80, transparency: 40, productUrl: "https://www.etsy.com/listing/1808006074/ubelicious-ube-flavored-renaissance-lip" },
  { id: "blood-moon", name: "Blood Moon", placeholder: false, vibes: ["bold", "space baroque"], undertones: ["cool", "neutral", "warm"], depths: ["light", "medium", "deep"], hex: "#7A2E3B", finish: "gloss", intensity: 65, gloss: 75, transparency: 40, productUrl: "https://www.etsy.com/shop/OddOrbitBeauty" },
];
