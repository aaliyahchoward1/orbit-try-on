import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { ShadeError } from "./errors";

const hex = z.string().regex(/^#[0-9a-f]{6}$/i);
const sessionSchema = z.object({
  colors: z.object({ skin: hex, lips: hex, eyes: hex, eyebrows: hex, hair: hex, hairColorName: z.string().max(40) }),
  fileId: z.string().max(500).optional(),
  demo: z.boolean(),
  expiresAt: z.number(),
});
export type ShadeSession = z.infer<typeof sessionSchema>;

function key() {
  // A stable server-only key lets guest sessions work across autoscale instances
  // without storing photos, derived colors or result links in the database.
  if (!process.env.SESSION_SECRET) throw new ShadeError("configuration", "shade finder is temporarily unavailable.", 503);
  return createHash("sha256").update("lunuff-shade-session-v1:").update(process.env.SESSION_SECRET).digest();
}
export function sealSession(session: ShadeSession): string {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), nonce);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(session), "utf8"), cipher.final()]);
  return Buffer.concat([nonce, cipher.getAuthTag(), encrypted]).toString("base64url");
}
export function openSession(token: string): ShadeSession {
  try {
    const bytes = Buffer.from(token, "base64url");
    if (bytes.length < 29) throw new Error();
    const decipher = createDecipheriv("aes-256-gcm", key(), bytes.subarray(0, 12));
    decipher.setAuthTag(bytes.subarray(12, 28));
    const decoded = Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString("utf8");
    const session = sessionSchema.parse(JSON.parse(decoded));
    if (session.expiresAt <= Date.now()) throw new Error();
    return session;
  } catch {
    throw new ShadeError("expired", "your private preview session has ended. please choose your photo again.", 410);
  }
}
