"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { SHARED_SPENDER, formatMoney } from "@/lib/format";
import { useToast } from "@/components/Toast";

type PartnerOption = { id: string; name: string };

type Props = {
  partners?: PartnerOption[];
  defaultSpentBy?: string;
  onDone?: () => void;
};

export function ExpenseForm({
  partners = [],
  defaultSpentBy = "",
  onDone,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const notify = useToast();

  const initialSpentBy =
    defaultSpentBy ||
    (partners.length > 1 ? SHARED_SPENDER : partners[0]?.name) ||
    "";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // React clears e.currentTarget once the handler yields, so keep the form before any await
    const form = e.currentTarget;
    setBusy(true);
    setError("");
    const fd = new FormData(form);
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
      notify(data.error || "Could not save expense", "error");
      return;
    }

    form.reset();
    notify(`Saved “${data.expense.title}” — ${formatMoney(data.expense.amount)}`);
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
          {partners.length > 0 ? (
            <select name="spentBy" required defaultValue={initialSpentBy}>
              {partners.length > 1 ? (
                <option value={SHARED_SPENDER}>
                  {SHARED_SPENDER} (equal share)
                </option>
              ) : null}
              {partners.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              name="spentBy"
              required
              defaultValue={initialSpentBy}
              placeholder="Partner name"
            />
          )}
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

      {partners.length === 0 ? (
        <p className="form-hint">
          Tip: add partners under Capital first so buys use the right names.
        </p>
      ) : null}

      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? "Saving…" : "Save buy"}
      </button>
    </form>
  );
}
