import { createSession, loginBlocked, recordLoginFailure, resetLoginFailures, passcodeMatches, originAllowed, cookieOptions, SESSION_COOKIE } from "../../demo-auth";
export const runtime = "nodejs";
const MAX_LOGIN_BODY_BYTES = 2048;

async function boundedJson(request: Request): Promise<unknown | null> {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_LOGIN_BODY_BYTES) {
        try { await reader.cancel(); } catch { /* The oversized request is already rejected. */ }
        return null;
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function POST(request: Request) {
  try {
    if (!originAllowed(request)) return Response.json({ error: "Request origin is not allowed." }, { status: 403 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "APP_ORIGIN is not configured correctly." }, { status: 503 });
  }
  if (loginBlocked()) return Response.json({ error: "Too many failed attempts. Try again in 15 minutes." }, { status: 429 });

  let input: unknown;
  try { input = await boundedJson(request); }
  catch { return Response.json({ error: "Enter the demo access code." }, { status: 400 }); }
  if (input === null) return Response.json({ error: "Login request exceeds 2 KB." }, { status: 413 });

  try {
    if (typeof input !== "object" || input === null || !passcodeMatches((input as { code?: unknown }).code)) {
      recordLoginFailure();
      return Response.json({ error: "That access code was not accepted." }, { status: 401 });
    }
    const session = createSession();
    resetLoginFailures();
    const response = Response.json({ ok: true });
    const options = cookieOptions(session.maxAge);
    response.headers.append("Set-Cookie", `${SESSION_COOKIE}=${session.value}; Path=${options.path}; HttpOnly; SameSite=Lax; Max-Age=${options.maxAge}${options.secure ? "; Secure" : ""}`);
    return response;
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Server setup is incomplete." }, { status: 503 });
  }
}
