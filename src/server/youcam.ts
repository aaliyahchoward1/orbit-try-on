import type { FaceColors, LipProduct } from "../shared/shadeFinder";
import { ShadeError, providerError } from "./errors";

const API = "https://yce-api-01.makeupar.com";
type ProviderJson = Record<string, any>;

export function demoMode(): boolean {
  // Explicit opt-in to spend units. A missing key always forces demo mode.
  return !process.env.YOUCAM_API_KEY || process.env.YOUCAM_MOCK_MODE !== "false";
}

async function api(path: string, body?: unknown): Promise<ProviderJson> {
  let response: Response;
  try {
    response = await fetch(`${API}/s2s/v2.0/${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { Authorization: `Bearer ${process.env.YOUCAM_API_KEY}`, "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new ShadeError("network", "the preview service is taking a little longer. please try again shortly.", 503);
  }
  let payload: ProviderJson;
  try { payload = await response.json(); }
  catch { throw new ShadeError("network", "the preview service is temporarily unavailable.", 503); }
  if (!response.ok || (payload.status && payload.status !== 200)) {
    throw providerError(payload.error_code ?? payload.error, response.status);
  }
  return payload;
}

export async function uploadPhoto(photo: Buffer): Promise<string> {
  const payload = await api("file", { files: [{ content_type: "image/jpeg", file_name: "selfie.jpg", file_size: photo.length }] });
  // File API's schema places files at root; some versions wrap it in data.
  const file = (payload.data?.files ?? payload.files)?.[0];
  if (!file?.file_id || !file.requests?.length)
    throw new ShadeError("provider_error", "we couldn't prepare your photo. please try again.", 502);
  for (const upload of file.requests) {
    const url = new URL(upload.url);
    // Provider-issued signed destination only. Never send our API key here.
    if (url.protocol !== "https:" || !["PUT", "POST"].includes(upload.method))
      throw new ShadeError("provider_error", "we couldn't prepare your photo. please try again.", 502);
    let response: Response;
    try {
      response = await fetch(url, {
        method: upload.method, headers: upload.headers,
        body: new Uint8Array(photo), signal: AbortSignal.timeout(30_000), redirect: "error",
      });
    } catch { throw new ShadeError("network", "your photo couldn't reach the preview service. please try again.", 503); }
    if (!response.ok) throw new ShadeError("upload", "your photo couldn't be uploaded. please try again.", 502);
  }
  return file.file_id;
}

const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function runTask(kind: "skin-tone-analysis" | "makeup-vto", body: unknown): Promise<ProviderJson> {
  // Never retry creation: a lost response could otherwise charge twice.
  const created = await api(`task/${kind}`, body);
  const id = created.data?.task_id;
  if (typeof id !== "string") throw new ShadeError("provider_error", "the preview service couldn't start. please try again later.", 502);
  let failures = 0;
  for (;;) {
    // Polling stays alive even if the browser disconnects. A running provider
    // task must not be abandoned just because an HTTP client goes away.
    await pause(Math.min(2000 * 2 ** failures, 15_000));
    let result: ProviderJson;
    try {
      result = await api(`task/${kind}/${encodeURIComponent(id)}`);
      failures = 0;
    } catch (error) {
      if (error instanceof ShadeError && (error.code === "network" || error.code === "provider_busy")) {
        failures = Math.min(failures + 1, 3);
        continue; // transient polling failures do NOT create another paid task
      }
      throw error;
    }
    const task = result.data;
    if (task?.task_status === "success") return task.results;
    if (task?.task_status === "error") throw providerError(task.error_code ?? task.error);
    if (task?.task_status !== "running")
      throw new ShadeError("provider_error", "the preview service returned an unexpected status.", 502);
  }
}

export async function analyzeColors(fileId: string): Promise<FaceColors> {
  const result = await runTask("skin-tone-analysis", { src_file_id: fileId, face_angle_strictness_level: "high" });
  const c = result?.color;
  const values = [c?.skin_color, c?.lip_color, c?.eye_color, c?.eyebrow_color, c?.hair_color];
  if (values.some(value => typeof value !== "string" || !/^#[0-9a-f]{6}$/i.test(value)))
    throw new ShadeError("no_face", "we couldn't read all your face colors. try natural light and a front-facing photo.");
  return { skin: c.skin_color, lips: c.lip_color, eyes: c.eye_color, eyebrows: c.eyebrow_color, hair: c.hair_color,
    hairColorName: typeof c.hair_color_name === "string" ? c.hair_color_name.slice(0, 40) : "unknown" };
}

export function makeupEffects(product: LipProduct, liner: boolean) {
  const effects: ProviderJson[] = [{
    category: "lip_color", shape: { name: "original" }, style: { type: "full" },
    palettes: [{ color: product.hex, texture: product.finish, colorIntensity: product.intensity,
      gloss: product.gloss, transparencyIntensity: product.transparency }],
  }];
  if (liner) effects.push({
    category: "lip_liner", pattern: { name: "Natural1" },
    palettes: [{ color: product.hex, texture: "satin", colorIntensity: product.intensity, thickness: 30, smoothness: 70 }],
  });
  return effects;
}

export async function tryMakeup(fileId: string, product: LipProduct, liner: boolean): Promise<string> {
  const result = await runTask("makeup-vto", { src_file_id: fileId, version: "1.0", effects: makeupEffects(product, liner) });
  if (typeof result?.url !== "string" || !result.url.startsWith("https://"))
    throw new ShadeError("provider_error", "the preview image wasn't available. please try the shade again.", 502);
  return result.url;
}
