export const shadeVibes = ["everyday", "soft glam", "bold", "space baroque"] as const;
export type ShadeVibe = typeof shadeVibes[number];
export type Undertone = "cool" | "neutral" | "warm";
export type SkinDepth = "light" | "medium" | "deep";
export interface FaceColors {
  skin: string;
  lips: string;
  eyes: string;
  eyebrows: string;
  hair: string;
  hairColorName: string;
}
export interface ColorEstimate {
  depth: SkinDepth;
  undertone: Undertone;
  lightness: number;
  warmth: number;
}
export interface LipProduct {
  id: string;
  name: string;
  placeholder: boolean;
  vibes: ShadeVibe[];
  undertones: Undertone[];
  depths: SkinDepth[];
  hex: string;
  finish: "gloss";
  intensity: number;
  gloss: number;
  transparency: number;
  productUrl: string | null;
}
export interface ShadeRecommendation {
  product: LipProduct;
  score: number;
  reason: string;
}
export interface ShadeScan {
  scanToken: string;
  colors: FaceColors;
  estimate: ColorEstimate;
  recommendations: ShadeRecommendation[];
  demo: boolean;
  expiresAt: number;
}
export interface ShadePreview {
  demo: boolean;
  imageUrl: string | null;
  expiresAt: number;
}
