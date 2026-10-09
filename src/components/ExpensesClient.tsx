"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ConfirmModal } from "@/components/ConfirmModal";
import { formatDate, formatMoney } from "@/lib/format";

type Expense = {
  id: string;
  title: string;
  amount: number;
  spentBy: string;
  note: string;
  date: string;
};

type PartnerOption = { id: string; name: string };

function toDateInput(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export function ExpensesClient({
  partners = [],
}: {
  partners?: PartnerOption[];
}) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [spentBy, setSpentBy] = useState("");
  const [editing, setEditing] = useState<Expense | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState("");
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!editing) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditing(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [editing]);

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

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    const res = await fetch(`/api/expenses/${deleting.id}`, {
      method: "DELETE",
    });
    setDeleteBusy(false);
    if (res.ok) {
      setDeleting(null);
      load();
    }
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

  const editModal =
    editing && mounted
      ? createPortal(
          <div
            className="modal-backdrop"
            onClick={() => setEditing(null)}
            role="presentation"
          >
            <div
              className="modal-card"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-expense-title"
            >
              <div className="modal-head">
                <div>
                  <h2 id="edit-expense-title">Edit buy</h2>
                  <p>Update what left the pot, then save.</p>
                </div>
                <button
                  type="button"
                  className="btn-icon"
                  aria-label="Close"
                  onClick={() => setEditing(null)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={saveEdit}>
                <div className="form-grid">
                  <label>
                    What was bought?
                    <input name="title" required defaultValue={editing.title} />
                  </label>
                  <label>
                    Who spent from the pot?
                    {partners.length > 0 ? (
                      <select
                        name="spentBy"
                        required
                        defaultValue={
                          partners.some((p) => p.name === editing.spentBy)
                            ? editing.spentBy
                            : partners[0].name
                        }
                      >
                        {!partners.some((p) => p.name === editing.spentBy) &&
                        editing.spentBy ? (
                          <option value={editing.spentBy}>
                            {editing.spentBy} (old)
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
                        defaultValue={editing.spentBy}
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
                    <textarea
                      name="note"
                      rows={3}
                      defaultValue={editing.note}
                    />
                  </label>
                </div>

                {editError ? <p className="form-error">{editError}</p> : null}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setEditing(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={editBusy}
                  >
                    {editBusy ? "Saving…" : "Update buy"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="stack-lg">
      <form className="filters" onSubmit={onFilter}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title, person, note…"
        />
        {partners.length > 0 ? (
          <select
            value={spentBy}
            onChange={(e) => setSpentBy(e.target.value)}
          >
            <option value="">All partners</option>
            {partners.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={spentBy}
            onChange={(e) => setSpentBy(e.target.value)}
            placeholder="Filter by partner"
          />
        )}
        <button type="submit" className="btn-secondary">
          Apply
        </button>
      </form>

      <div className="summary-strip">
        <span>
          {expenses.length} buy{expenses.length === 1 ? "" : "s"} from the pot
        </span>
        <strong>{formatMoney(total)}</strong>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="muted">Loading…</p> : null}

      {!loading && expenses.length === 0 ? (
        <div className="empty">
          No buys yet. Log one and pick a partner (e.g.{" "}
          {partners[0]?.name || "Saeed"}).
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
              <div className="action-btns">
                <button
                  type="button"
                  className="btn-action edit"
                  onClick={() => {
                    setEditError("");
                    setEditing(ex);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn-action danger"
                  onClick={() => setDeleting(ex)}
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {editModal}

      <ConfirmModal
        open={Boolean(deleting)}
        title="Delete this buy?"
        message={
          deleting
            ? `Remove “${deleting.title}” (${formatMoney(deleting.amount)}) by ${deleting.spentBy}? Cash left will go back up.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        busy={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => {
          if (!deleteBusy) setDeleting(null);
        }}
      />
    </div>
  );
}
