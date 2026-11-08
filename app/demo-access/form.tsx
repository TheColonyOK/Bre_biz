"use client";
import { useState } from "react";
export default function AccessForm() {
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/demo-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: form.get("code") }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) { setError(data.error ?? "Access could not be verified."); return; }
      location.assign("/");
    } catch { setError("Could not connect. Please try again."); }
    finally { setBusy(false); }
  }
  return <form className="access-form" onSubmit={submit}><label htmlFor="access-code">Demo access code</label><input id="access-code" name="code" type="password" autoComplete="current-password" required maxLength={256}/><button className="button primary" disabled={busy}>{busy ? "Checking…" : "Enter the demo"}</button>{error && <p role="alert" className="access-error">{error}</p>}<span>This is a concept demo. Submissions do not create real bookings or send messages.</span></form>;
}
