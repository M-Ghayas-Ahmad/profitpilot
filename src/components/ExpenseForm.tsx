"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Props = {
  defaultSpentBy?: string;
  onDone?: () => void;
};

export function ExpenseForm({ defaultSpentBy = "", onDone }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: String(fd.get("title") || ""),
      amount: Number(fd.get("amount")),
      spentBy: String(fd.get("spentBy") || ""),
      note: String(fd.get("note") || ""),
      date: String(fd.get("date") || ""),
    };

    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      setError(data.error || "Could not save expense");
      return;
    }

    e.currentTarget.reset();
    onDone?.();
    router.push("/app/expenses");
    router.refresh();
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form className="form-card" onSubmit={onSubmit}>
      <div className="form-grid">
        <label>
          What was bought?
          <input
            name="title"
            required
            placeholder="e.g. Jali / wire mesh"
          />
        </label>
        <label>
          Who spent from the pot?
          <input
            name="spentBy"
            required
            defaultValue={defaultSpentBy}
            placeholder="e.g. Ali"
          />
        </label>
        <label>
          Amount (Rs)
          <input
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            placeholder="2000"
          />
        </label>
        <label>
          Date
          <input name="date" type="date" required defaultValue={today} />
        </label>
        <label className="full">
          Note (optional)
          <textarea
            name="note"
            rows={3}
            placeholder="Optional — shop name, receipt, why…"
          />
        </label>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? "Saving…" : "Save buy"}
      </button>
    </form>
  );
}
