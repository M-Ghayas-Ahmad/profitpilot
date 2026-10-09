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
    router.replace("/app/capital");
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
        <h2>Start the ledger before the first rupee moves.</h2>
        <p>
          Perfect for sheds, stalls, and two-person startups — like an egg
          business where both partners put money in as needed.
        </p>
        <ol className="auth-flow">
          <li>
            <strong>1</strong> Name the business
          </li>
          <li>
            <strong>2</strong> Add partners + commitments
          </li>
          <li>
            <strong>3</strong> Record money put in
          </li>
          <li>
            <strong>4</strong> Log every buy from the pot
          </li>
        </ol>
      </aside>

      <div className="auth-panel">
        <form className="auth-card" onSubmit={onSubmit}>
          <h1>Create account</h1>
          <p>Then set up partners and capital in one minute.</p>

          <label>
            Your name
            <input
              name="name"
              required
              autoComplete="name"
              placeholder="Ali"
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
