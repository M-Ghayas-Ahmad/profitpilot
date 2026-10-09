"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { formatDate, formatMoney } from "@/lib/format";

type Expense = {
  id: string;
  title: string;
  amount: number;
  spentBy: string;
  note: string;
  date: string;
};

function toDateInput(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export function ExpensesClient() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [spentBy, setSpentBy] = useState("");
  const [editing, setEditing] = useState<Expense | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (spentBy) params.set("spentBy", spentBy);
    const res = await fetch(`/api/expenses?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed to load");
      return;
    }
    setExpenses(data.expenses || []);
    setTotal(data.total || 0);
  }, [q, spentBy]);

  useEffect(() => {
    load();
  }, [load]);

  function onFilter(e: FormEvent) {
    e.preventDefault();
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this expense?")) return;
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  async function saveEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setEditBusy(true);
    setEditError("");
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: String(fd.get("title") || ""),
      amount: Number(fd.get("amount")),
      spentBy: String(fd.get("spentBy") || ""),
      note: String(fd.get("note") || ""),
      date: String(fd.get("date") || ""),
    };

    const res = await fetch(`/api/expenses/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setEditBusy(false);

    if (!res.ok) {
      setEditError(data.error || "Could not update expense");
      return;
    }

    setEditing(null);
    load();
  }

  return (
    <div className="stack-lg">
      <form className="filters" onSubmit={onFilter}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title, person, note…"
        />
        <input
          value={spentBy}
          onChange={(e) => setSpentBy(e.target.value)}
          placeholder="Filter by person (John…)"
        />
        <button type="submit" className="btn-secondary">
          Apply
        </button>
      </form>

      <div className="summary-strip">
        <span>
          {expenses.length} expense{expenses.length === 1 ? "" : "s"}
        </span>
        <strong>{formatMoney(total)}</strong>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="muted">Loading…</p> : null}

      {!loading && expenses.length === 0 ? (
        <div className="empty">
          No expenses yet. Add one like “John bought glass — Rs 100”.
        </div>
      ) : null}

      <ul className="expense-list">
        {expenses.map((ex) => (
          <li key={ex.id}>
            <div>
              <strong>{ex.title}</strong>
              <p>
                {ex.spentBy} · {formatDate(ex.date)}
              </p>
              {ex.note ? <p className="note">{ex.note}</p> : null}
            </div>
            <div className="row-actions">
              <span className="amount">{formatMoney(ex.amount)}</span>
              <button type="button" className="link-edit" onClick={() => setEditing(ex)}>
                Edit
              </button>
              <button type="button" onClick={() => remove(ex.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {editing ? (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Edit expense"
          >
            <div className="page-head" style={{ marginBottom: "1rem" }}>
              <div>
                <h1 style={{ fontSize: "1.45rem" }}>Edit expense</h1>
                <p>Update the details, then save.</p>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEditing(null)}
              >
                Close
              </button>
            </div>

            <form className="form-card" onSubmit={saveEdit} style={{ boxShadow: "none", border: 0, padding: 0 }}>
              <div className="form-grid">
                <label>
                  What was bought?
                  <input name="title" required defaultValue={editing.title} />
                </label>
                <label>
                  Who spent?
                  <input name="spentBy" required defaultValue={editing.spentBy} />
                </label>
                <label>
                  Amount (Rs)
                  <input
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    defaultValue={editing.amount}
                  />
                </label>
                <label>
                  Date
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={toDateInput(editing.date)}
                  />
                </label>
                <label className="full">
                  Note (optional)
                  <textarea name="note" rows={3} defaultValue={editing.note} />
                </label>
              </div>

              {editError ? <p className="form-error">{editError}</p> : null}

              <button type="submit" className="btn-primary" disabled={editBusy}>
                {editBusy ? "Saving…" : "Update expense"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
