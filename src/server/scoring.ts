import type { ColorEstimate, FaceColors, ShadeVibe, ShadeRecommendation } from "../shared/shadeFinder";
import { lipProducts } from "./products";

/**
 * Heuristic, not a clinical undertone measurement or seasonal analysis.
 * Convert sRGB to linear RGB, then D65 XYZ and CIELAB.
 * Depth: L* >= 70 light; 45 <= L* < 70 medium; otherwise deep.
 * Warmth = b* - a*: > 6 warm, < -6 cool, otherwise neutral.
 * Subtracting red/green a* from yellow/blue b* approximates yellow-vs-pink
 * balance; illumination, makeup and camera processing can substantially bias it.
 */
export function estimateSkin(hex: string): ColorEstimate {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error("invalid skin color");
  const [r, g, b] = [1, 3, 5].map(i => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
  });
  const f = (v: number) => v > 216 / 24389 ? Math.cbrt(v) : (24389 / 27 * v + 16) / 116;
  const x = f((.4124564 * r + .3575761 * g + .1804375 * b) / .95047);
  const y = f(.2126729 * r + .7151522 * g + .072175 * b);
  const z = f((.0193339 * r + .119192 * g + .9503041 * b) / 1.08883);
  const lightness = 116 * y - 16;
  const warmth = 200 * (y - z) - 500 * (x - y);
  return {
    depth: lightness >= 70 ? "light" : lightness >= 45 ? "medium" : "deep",
    undertone: warmth > 6 ? "warm" : warmth < -6 ? "cool" : "neutral",
    lightness: Math.round(lightness * 10) / 10,
    warmth: Math.round(warmth * 10) / 10,
  };
}

/** Ranks all four shades (best match first) so shoppers can try every one. */
export function rankShades(colors: FaceColors, vibe: ShadeVibe): ShadeRecommendation[] {
  const estimate = estimateSkin(colors.skin);
  return lipProducts.map(product => ({
    product,
    score: (product.undertones.includes(estimate.undertone) ? 40 : 0)
      + (product.depths.includes(estimate.depth) ? 30 : 0)
      + (product.vibes.includes(vibe) ? 30 : 0),
    reason: `with skin ${colors.skin} (estimated ${estimate.depth} depth, ${estimate.undertone} undertone) and lips ${colors.lips}, ${product.name.toLowerCase()} ranks for your ${vibe} vibe.`,
  })).sort((a, b) => b.score - a.score || a.product.id.localeCompare(b.product.id));
}
