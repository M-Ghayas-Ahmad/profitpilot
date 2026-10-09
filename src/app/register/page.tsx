"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        password: fd.get("password"),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not create account");
      return;
    }
    router.replace("/app");
    router.refresh();
  }

  return (
    <div className="auth-wrap">
      <aside className="auth-visual">
        <div className="brand">
          <span className="brand-mark">PP</span>
          <div>
            <strong>ProfitPilot</strong>
            <p className="brand-sub">Expense command</p>
          </div>
        </div>
        <h2>Start a ledger in under a minute.</h2>
        <p>
          Each account is private. Log spends like “John bought glass — Rs 100”
          and watch the overview update live.
        </p>
      </aside>

      <div className="auth-panel">
        <form className="auth-card" onSubmit={onSubmit}>
          <h1>Create account</h1>
          <p>Set up your workspace and start tracking.</p>

          <label>
            Your name
            <input
              name="name"
              required
              autoComplete="name"
              placeholder="Ghayas"
            />
          </label>
          <label>
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create account"}
          </button>

          <p className="auth-foot">
            Already tracking? <Link href="/login">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
