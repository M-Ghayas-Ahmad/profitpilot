"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/app";
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        password: fd.get("password"),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Login failed");
      return;
    }
    router.replace(next);
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
        <h2>Know where every rupee went.</h2>
        <p>
          Sign in to your private ledger — spends by person, month totals, and a
          full activity trail.
        </p>
      </aside>

      <div className="auth-panel">
        <form className="auth-card" onSubmit={onSubmit}>
          <h1>Welcome back</h1>
          <p>Sign in to continue to your dashboard.</p>

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
              autoComplete="current-password"
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>

          <p className="auth-foot">
            New here? <Link href="/register">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
