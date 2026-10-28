import express, { type Request, type Response, type NextFunction } from "express";
import { createHmac, randomBytes } from "node:crypto";
import { z } from "zod";
import { shadeVibes, type FaceColors, type ShadePreview, type ShadeScan, type ShadeVibe } from "../shared/shadeFinder";
import { analyzeColors, demoMode, tryMakeup, uploadPhoto } from "./youcam";
import { limitIp, reserveDaily } from "./limits";
import { validatePhoto, MAX_PHOTO_BYTES } from "./image";
import { estimateSkin, rankShades } from "./scoring";
import { lipProducts } from "./products";
import { ShadeError } from "./errors";
import { openSession, sealSession } from "./session";

const DEMO_COLORS: FaceColors = {
  skin: "#B9947C", lips: "#AC6472", eyes: "#49382D",
  eyebrows: "#48352E", hair: "#352820", hairColorName: "brown",
};
const SESSION_MS = 100 * 60_000; // less than provider's ~2-hour result lifetime
const vibeSchema = z.enum(shadeVibes);
const tokenSchema = z.string().min(40).max(2500).regex(/^[A-Za-z0-9_-]+$/);
interface ScanState { scan: ShadeScan; fileId?: string }

// Dependencies can be replaced by deterministic transport/budget fakes in tests.
export function createShadeFinderRouter(dependencies = {
  demoMode, uploadPhoto, analyzeColors, tryMakeup, reserveDaily, limitIp,
}) {
  const router = express.Router();
  const analyses = new Map<string, { result: Promise<ScanState>; expiresAt: number }>();
  const previews = new Map<string, { result: Promise<ShadePreview>; expiresAt: number }>();
  const salt = randomBytes(32);
  const cleanup = () => {
    const now = Date.now();
    analyses.forEach((entry, id) => { if (entry.expiresAt <= now) analyses.delete(id); });
    previews.forEach((entry, id) => { if (entry.expiresAt <= now) previews.delete(id); });
  };
  const timer = setInterval(cleanup, 60_000);
  timer.unref();

  router.use((req, res, next) => {
    res.set({ "Cache-Control": "no-store, private", Pragma: "no-cache", "X-Content-Type-Options": "nosniff" });
    // Don't change global proxy/login settings. setupAuth's existing trusted-hop
    // configuration determines req.ip at request time.
    const origin = req.get("origin");
    try {
      if (origin && new URL(origin).host !== req.get("host"))
        throw new ShadeError("origin", "please open shade finder directly to continue.", 403);
      cleanup();
      next();
    } catch (error) { next(error); }
  });

  const handle = (fn: (req: Request, res: Response) => Promise<unknown>) =>
    (req: Request, res: Response, next: NextFunction) => {
      fn(req, res).catch(next).finally(() => { req.body = undefined; });
    };

  router.get("/status", (req, res, next) => {
    try {
      dependencies.limitIp(req.ip ?? req.socket.remoteAddress ?? "unknown", "read");
      res.json({ demo: dependencies.demoMode() });
    } catch (error) { next(error); }
  });

  router.post("/analyze", (req, _res, next) => {
    try {
      dependencies.limitIp(req.ip ?? req.socket.remoteAddress ?? "unknown", "scan");
      if (!req.is("image/jpeg")) throw new ShadeError("image_format", "please upload a jpeg photo.", 415);
      next();
    } catch (error) { next(error); }
  }, express.raw({ type: "image/jpeg", limit: MAX_PHOTO_BYTES - 1 }), handle(async (req, res) => {
    const vibe = vibeSchema.parse(req.query.vibe ?? "everyday");
    validatePhoto(req.body);
    // Photo digest is salted, process-local, never logged/persisted. Deduplicate
    // in-flight and completed scans; store no image bytes in either map.
    const digest = createHmac("sha256", salt).update(req.body).digest("hex");
    let analysis = analyses.get(digest);
    if (!analysis) {
      if (analyses.size >= 200) throw new ShadeError("busy", "shade finder is busy. please come back shortly.", 429);
      const demo = dependencies.demoMode();
      // This function holds bytes only until THIS analysis request completes.
      const process = async (photo: Buffer): Promise<ScanState> => {
        let fileId: string | undefined;
        let colors = DEMO_COLORS;
        if (!demo) {
          await dependencies.reserveDaily("scan");
          fileId = await dependencies.uploadPhoto(photo);
          colors = await dependencies.analyzeColors(fileId);
        }
        const expiresAt = Date.now() + SESSION_MS;
        const scan: ShadeScan = {
          scanToken: sealSession({ colors, fileId, demo, expiresAt }),
          colors, estimate: estimateSkin(colors.skin),
          recommendations: rankShades(colors, vibe), demo, expiresAt,
        };
        const state = { scan, fileId };
        return state;
      };
      const result = process(req.body);
      analysis = { result, expiresAt: Date.now() + SESSION_MS };
      analyses.set(digest, analysis);
      // Keep rejected promise (without photo) to avoid an automatic repeat of a
      // potentially paid task after ambiguous upstream failure.
    }
    const { scan } = await analysis.result;
    res.json({ ...scan, recommendations: rankShades(scan.colors, vibe) });
  }));

  const findScan = (token: string): ScanState => {
    const session = openSession(token);
    return {
      fileId: session.fileId,
      scan: { ...session, scanToken: token, estimate: estimateSkin(session.colors.skin), recommendations: [] },
    };
  };

  router.use(express.json({ limit: "4kb" }));
  router.post("/rank", handle(async (req, res) => {
    dependencies.limitIp(req.ip ?? req.socket.remoteAddress ?? "unknown", "read");
    const body = z.object({ scanToken: tokenSchema, vibe: vibeSchema }).strict().parse(req.body);
    const { scan } = findScan(body.scanToken);
    res.json({ recommendations: rankShades(scan.colors, body.vibe) });
  }));

  router.post("/try-on", handle(async (req, res) => {
    dependencies.limitIp(req.ip ?? req.socket.remoteAddress ?? "unknown", "preview");
    const body = z.object({ scanToken: tokenSchema, productId: z.string().max(80), liner: z.boolean() }).strict().parse(req.body);
    const state = findScan(body.scanToken);
    const product = lipProducts.find(item => item.id === body.productId);
    if (!product) throw new ShadeError("shade", "please choose one of the four shades.");
    const key = `${body.scanToken}:${product.id}:${body.liner}`;
    let preview = previews.get(key);
    if (!preview) {
      const process = async (): Promise<ShadePreview> => {
        if (state.scan.demo) return { demo: true, imageUrl: null, expiresAt: state.scan.expiresAt };
        if (!state.fileId) throw new ShadeError("expired", "please choose your photo again.", 410);
        await dependencies.reserveDaily("preview");
        const imageUrl = await dependencies.tryMakeup(state.fileId, product, body.liner);
        return { demo: false, imageUrl, expiresAt: Math.min(state.scan.expiresAt, Date.now() + SESSION_MS) };
      };
      const result = process();
      preview = { result, expiresAt: state.scan.expiresAt };
      previews.set(key, preview);
      // A failed try-on can be explicitly retried; never re-run analysis.
      void result.catch(() => previews.delete(key));
    }
    res.json(await preview.result);
  }));

  router.use((_req, _res, next) => next(new ShadeError("not_found", "this shade finder request wasn't found.", 404)));
  router.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
    req.body = undefined;
    const typed = error as { type?: string };
    const safe = error instanceof ShadeError ? error : error instanceof z.ZodError
      ? new ShadeError("invalid_request", "please check your photo, vibe and shade selection.")
      : typed?.type === "entity.too.large"
        ? new ShadeError("image_large", "this upload is too large. please choose a photo under 10 mb.", 413)
        : new ShadeError("unavailable", "we couldn't finish this preview. please try again shortly.", 503);
    // This router deliberately lives before the global JSON-response logger.
    // Never log errors, raw provider responses, images or temporary image URLs.
    if (!res.headersSent) res.status(safe.status).json({ code: safe.code, message: safe.message });
  });
  return router;
}
