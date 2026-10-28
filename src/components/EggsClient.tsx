"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useToast } from "@/components/Toast";
import { formatDate } from "@/lib/format";

type EggLog = {
  id: string;
  date: string;
  count: number;
  note: string;
};

type Stats = {
  total: number;
  count: number;
  average: number;
  best: { date: string; count: number } | null;
};

const todayInput = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Stored dates are UTC midnight of the picked day, so read them back in UTC. */
const toDateInput = (value: string) => new Date(value).toISOString().slice(0, 10);
const showDate = (value: string) => formatDate(toDateInput(value) + "T12:00:00");
const eggs = (n: number) => `${n.toLocaleString("en-PK")} egg${n === 1 ? "" : "s"}`;

export function EggsClient() {
  const [logs, setLogs] = useState<EggLog[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, count: 0, average: 0, best: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState("");
  const countRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState<EggLog | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState("");
  const [deleting, setDeleting] = useState<EggLog | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const notify = useToast();

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
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/eggs?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed to load");
      return;
    }
    setLogs(data.logs || []);
    setStats({ total: data.total || 0, count: data.count || 0, average: data.average || 0, best: data.best || null });
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  async function onAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setAddBusy(true);
    setAddError("");
    const fd = new FormData(form);
    const payload = {
      date: String(fd.get("date") || ""),
      count: Number(fd.get("count")),
      note: String(fd.get("note") || ""),
    };

    const res = await fetch("/api/eggs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setAddBusy(false);

    if (!res.ok) {
      setAddError(data.error || "Could not save egg count");
      notify(data.error || "Could not save egg count", "error");
      return;
    }

    notify(`Saved ${eggs(data.log.count)} for ${showDate(data.log.date)}`);
    (form.elements.namedItem("count") as HTMLInputElement).value = "";
    (form.elements.namedItem("note") as HTMLInputElement).value = "";
    countRef.current?.focus();
    load();
  }

  async function saveEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setEditBusy(true);
    setEditError("");
    const fd = new FormData(e.currentTarget);
    const payload = {
      date: String(fd.get("date") || ""),
      count: Number(fd.get("count")),
      note: String(fd.get("note") || ""),
    };

    const res = await fetch(`/api/eggs/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setEditBusy(false);

    if (!res.ok) {
      setEditError(data.error || "Could not update entry");
      return;
    }

    setEditing(null);
    notify(`Updated ${showDate(data.log.date)} to ${eggs(data.log.count)}`);
    load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    const res = await fetch(`/api/eggs/${deleting.id}`, { method: "DELETE" });
    setDeleteBusy(false);
    if (res.ok) {
      notify(`Deleted egg count for ${showDate(deleting.date)}`);
      setDeleting(null);
      load();
    } else {
      notify("Could not delete entry", "error");
    }
  }

  const editModal =
    editing && mounted
      ? createPortal(
          <div className="modal-backdrop" onClick={() => setEditing(null)} role="presentation">
            <div
              className="modal-card"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-eggs-title"
            >
              <div className="modal-head">
                <div>
                  <h2 id="edit-eggs-title">Edit egg count</h2>
                  <p>Correct the date or the number of eggs collected.</p>
                </div>
                <button type="button" className="btn-icon" aria-label="Close" onClick={() => setEditing(null)}>
                  ✕
                </button>
              </div>

              <form onSubmit={saveEdit}>
                <div className="form-grid">
                  <label>
                    Date
                    <input name="date" type="date" required max={todayInput()} defaultValue={toDateInput(editing.date)} />
                  </label>
                  <label>
                    Eggs collected
                    <input name="count" type="number" min="0" step="1" required defaultValue={editing.count} />
                  </label>
                  <label className="full">
                    Note (optional)
                    <textarea name="note" rows={2} defaultValue={editing.note} />
                  </label>
                </div>

                {editError ? <p className="form-error">{editError}</p> : null}

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={editBusy}>
                    {editBusy ? "Saving…" : "Update entry"}
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
      <form className="form-card" onSubmit={onAdd}>
        <div className="form-grid">
          <label>
            Date
            <input name="date" type="date" required max={todayInput()} defaultValue={todayInput()} />
          </label>
          <label>
            Eggs collected
            <input ref={countRef} name="count" type="number" min="0" step="1" required placeholder="e.g. 240" autoFocus />
          </label>
          <label className="full">
            Note (optional)
            <input name="note" placeholder="e.g. 3 broken, shed B" />
          </label>
        </div>
        {addError ? <p className="form-error">{addError}</p> : null}
        <button type="submit" className="btn-primary" disabled={addBusy}>
          {addBusy ? "Saving…" : "Save egg count"}
        </button>
      </form>

      <div className="stats stats-4">
        <div className="stat">
          <span>Total eggs</span>
          <strong>{stats.total.toLocaleString("en-PK")}</strong>
        </div>
        <div className="stat">
          <span>Days logged</span>
          <strong>{stats.count}</strong>
        </div>
        <div className="stat">
          <span>Average / day</span>
          <strong>{stats.average.toLocaleString("en-PK")}</strong>
        </div>
        <div className="stat">
          <span>Best day</span>
          <strong>{stats.best ? `${stats.best.count.toLocaleString("en-PK")} · ${showDate(stats.best.date)}` : "—"}</strong>
        </div>
      </div>

      <form className="filters egg-filters" onSubmit={(e) => { e.preventDefault(); load(); }}>
        <label>
          From
          <input type="date" value={from} max={to || todayInput()} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          To
          <input type="date" value={to} min={from || undefined} max={todayInput()} onChange={(e) => setTo(e.target.value)} />
        </label>
        <button type="button" className="btn-secondary" disabled={!from && !to} onClick={() => { setFrom(""); setTo(""); }}>
          Clear
        </button>
      </form>

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="muted">Loading…</p> : null}

      {!loading && logs.length === 0 ? (
        <div className="empty">No egg counts yet. Enter today&apos;s collection above.</div>
      ) : null}

      <ul className="expense-list">
        {logs.map((log) => (
          <li key={log.id}>
            <div>
              <strong>{showDate(log.date)}</strong>
              {log.note ? <p className="note">{log.note}</p> : null}
            </div>
            <div className="row-actions">
              <span className="amount">{eggs(log.count)}</span>
              <div className="action-btns">
                <button
                  type="button"
                  className="btn-action edit"
                  onClick={() => {
                    setEditError("");
                    setEditing(log);
                  }}
                >
                  Edit
                </button>
                <button type="button" className="btn-action danger" onClick={() => setDeleting(log)}>
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
        title="Delete this egg count?"
        message={deleting ? `Remove ${eggs(deleting.count)} logged for ${showDate(deleting.date)}?` : ""}
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
