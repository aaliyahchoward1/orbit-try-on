import { createHmac, randomBytes } from "node:crypto";
import { pool } from "../db"; // the host app's PostgreSQL pool (node-postgres)
import { ShadeError } from "./errors";

export function positiveSetting(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

const salt = randomBytes(32);
const windows = new Map<string, { count: number; reset: number }>();

export function limitIp(ip: string, category: "scan" | "preview" | "read") {
  const now = Date.now();
  windows.forEach((item, key) => { if (item.reset <= now) windows.delete(key); });
  const key = createHmac("sha256", salt).update(`${category}:${ip}`).digest("hex");
  const item = windows.get(key) ?? { count: 0, reset: now + 60 * 60_000 };
  const limit = category === "scan" ? positiveSetting("SHADE_FINDER_IP_SCANS_PER_HOUR", 5)
    : category === "preview" ? positiveSetting("SHADE_FINDER_IP_TRYONS_PER_HOUR", 24) : 120;
  if (item.count >= limit || (!windows.has(key) && windows.size >= 10_000))
    throw new ShadeError("rate_limit", "a little pause, starfriend. you've reached the hourly limit; please come back later.", 429);
  item.count++;
  windows.set(key, item);
}

/** Only anonymous aggregate counters are persisted, NEVER photos or results.
 * Atomic PostgreSQL reservation works across restarts and multiple instances.
 * Failed/uncertain submissions conservatively keep their reservation.
 */
export function createDailyReservation(query: (text: string, values?: unknown[]) => Promise<{ rows: unknown[] }> = (text, values) => pool.query(text, values)) {
  let ready: Promise<unknown> | undefined;
  return async function reserve(kind: "scan" | "preview") {
  const cap = kind === "scan" ? positiveSetting("SHADE_FINDER_DAILY_SCAN_CAP", 40)
    : positiveSetting("SHADE_FINDER_DAILY_TRYON_CAP", 240);
  try {
    ready ??= query(`CREATE TABLE IF NOT EXISTS shade_finder_daily_usage (
      day date NOT NULL, kind text NOT NULL, used integer NOT NULL DEFAULT 0,
      PRIMARY KEY (day, kind)
    )`).catch(error => { ready = undefined; throw error; });
    await ready;
    const { rows } = await query(
      `INSERT INTO shade_finder_daily_usage (day, kind, used)
       VALUES ((now() AT TIME ZONE 'UTC')::date, $1, 1)
       ON CONFLICT (day, kind) DO UPDATE SET used = shade_finder_daily_usage.used + 1
       WHERE shade_finder_daily_usage.used < $2 RETURNING used`, [kind, cap]);
    if (!rows.length) throw new ShadeError("daily_cap", "today's shade previews are all used up. come back tomorrow for a little more cosmic color.", 429);
  } catch (error) {
    if (error instanceof ShadeError) throw error;
    // Fail closed: a counter outage must never cause unlimited unit spending.
    throw new ShadeError("budget_unavailable", "live shade previews are resting for now. please try again later.", 503);
  }
  };
}
export const reserveDaily = createDailyReservation();
