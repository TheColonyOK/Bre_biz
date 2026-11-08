import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "breanna_demo_session";
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const WINDOW_MS = 15 * 60 * 1000;

function sessionSecret() {
  const value = process.env.DEMO_SESSION_SECRET;
  if (!value || Buffer.byteLength(value) < 32) throw new Error("Set DEMO_SESSION_SECRET to a random value of at least 32 bytes before starting the server.");
  return value;
}
function sign(value: string) { return createHmac("sha256", sessionSecret()).update(value).digest("base64url"); }
function secureCookie() {
  const localOptIn = process.env.NODE_ENV !== "production" &&
    process.env.DEMO_INSECURE_COOKIES === "true" &&
    isLoopbackOrigin(process.env.APP_ORIGIN ?? "");
  return !localOptIn;
}
export function isLoopbackOrigin(value: string) {
  try { const url = new URL(value); return url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname); } catch { return false; }
}
export function expectedOrigin() {
  const value = process.env.APP_ORIGIN;
  if (!value) throw new Error("Set APP_ORIGIN to the exact public https origin (or loopback origin for local testing).");
  const url = new URL(value);
  if (url.origin !== value.replace(/\/$/, "")) throw new Error("APP_ORIGIN must contain only an origin, without a path or trailing slash.");
  return url.origin;
}
export function originAllowed(request: Request, requireOrigin = true) {
  const origin = request.headers.get("origin");
  if (!origin) return !requireOrigin;
  const expected = expectedOrigin();
  try { return new URL(origin).origin === expected && origin === expected; } catch { return false; }
}
const MAX_FAILED_LOGINS = 120;
const failedLogins = { count: 0, resetAt: 0 };
export function loginBlocked() {
  const now = Date.now();
  if (failedLogins.resetAt <= now) { failedLogins.count = 0; failedLogins.resetAt = now + WINDOW_MS; }
  return failedLogins.count >= MAX_FAILED_LOGINS;
}
export function recordLoginFailure() {
  if (failedLogins.resetAt <= Date.now()) { failedLogins.count = 0; failedLogins.resetAt = Date.now() + WINDOW_MS; }
  failedLogins.count++;
}
export function resetLoginFailures() {
  failedLogins.count = 0;
  failedLogins.resetAt = Date.now() + WINDOW_MS;
}
export function passcodeMatches(candidate: unknown) {
  const configured = process.env.DEMO_ACCESS_CODE;
  if (!configured || configured.length < 12) throw new Error("Set DEMO_ACCESS_CODE to a passcode of at least 12 characters before starting the server.");
  if (typeof candidate !== "string" || candidate.length > 256) return false;
  const a = Buffer.from(candidate); const b = Buffer.from(configured);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function createSession() {
  const id = randomUUID(); const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `${id}.${expires}`;
  return { value: `${payload}.${sign(payload)}`, maxAge: SESSION_SECONDS };
}
export function verifySession(value: string | undefined) {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3 || !/^[0-9a-f-]{36}$/i.test(parts[0]) || !/^\d+$/.test(parts[1])) return null;
  const payload = `${parts[0]}.${parts[1]}`;
  let expected: Buffer;
  try { expected = Buffer.from(sign(payload)); } catch { return null; }
  const actual = Buffer.from(parts[2]);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  if (Number(parts[1]) <= Math.floor(Date.now() / 1000)) return null;
  return { userId: parts[0] };
}
export async function getDemoUser() {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}
export function cookieOptions(maxAge: number) {
  return { httpOnly: true, sameSite: "lax" as const, secure: secureCookie(), path: "/", maxAge };
}
