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
            <p className="brand-sub">Partner capital ledger</p>
          </div>
        </div>
        <h2>See the pot, not a mystery spreadsheet.</h2>
        <p>
          Commitments, money put in, buys out, and cash left — one clear picture
          for co-founders.
        </p>
        <ol className="auth-flow">
          <li>
            <strong>1</strong> Partners commit capital
          </li>
          <li>
            <strong>2</strong> Cash enters the pot
          </li>
          <li>
            <strong>3</strong> Buys leave the pot
          </li>
          <li>
            <strong>4</strong> Cash left stays honest
          </li>
        </ol>
      </aside>

      <div className="auth-panel">
        <form className="auth-card" onSubmit={onSubmit}>
          <h1>Welcome back</h1>
          <p>Sign in to your business money ledger.</p>

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
