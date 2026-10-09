"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/ConfirmModal";
import { formatDate, formatMoney } from "@/lib/format";

type Partner = {
  id: string;
  name: string;
  committedAmount: number;
  contributedAmount: number;
  pendingAmount: number;
};

type Contribution = {
  id: string;
  partnerId: string;
  partnerName: string;
  amount: number;
  note: string;
  date: string | Date;
};

type Props = {
  businessName: string;
  targetCapital: number;
  partners: Partner[];
  contributions: Contribution[];
};

type Tab = "partners" | "contributions" | "business";

function toDateInput(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function progressPct(contributed: number, committed: number) {
  if (committed <= 0) return contributed > 0 ? 100 : 0;
  return Math.min(100, Math.round((contributed / committed) * 100));
}

export function CapitalClient({
  businessName,
  targetCapital,
  partners,
  contributions,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("partners");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [deletingPartner, setDeletingPartner] = useState<Partner | null>(null);
  const [editingContribution, setEditingContribution] =
    useState<Contribution | null>(null);
  const [deletingContribution, setDeletingContribution] =
    useState<Contribution | null>(null);
  const [modalError, setModalError] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!editingPartner && !editingContribution) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditingPartner(null);
        setEditingContribution(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [editingPartner, editingContribution]);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  async function refresh() {
    router.refresh();
  }

  async function saveBusiness(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/business", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(fd.get("name") || ""),
        targetCapital: Number(fd.get("targetCapital")),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not update business");
      return;
    }
    await refresh();
  }

  async function addPartner(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(fd.get("name") || ""),
        committedAmount: Number(fd.get("committedAmount")),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not add partner");
      return;
    }
    e.currentTarget.reset();
    await refresh();
  }

  async function savePartner(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingPartner) return;
    setBusy(true);
    setModalError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/partners/${editingPartner.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(fd.get("name") || ""),
        committedAmount: Number(fd.get("committedAmount")),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setModalError(data.error || "Could not update partner");
      return;
    }
    setEditingPartner(null);
    await refresh();
  }

  async function confirmDeletePartner() {
    if (!deletingPartner) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/partners/${deletingPartner.id}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not delete partner");
      setDeletingPartner(null);
      return;
    }
    setDeletingPartner(null);
    await refresh();
  }

  async function addContribution(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/contributions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partnerId: String(fd.get("partnerId") || ""),
        amount: Number(fd.get("amount")),
        note: String(fd.get("note") || ""),
        date: String(fd.get("date") || ""),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not add contribution");
      return;
    }
    e.currentTarget.reset();
    await refresh();
  }

  async function saveContribution(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingContribution) return;
    setBusy(true);
    setModalError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/contributions/${editingContribution.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partnerId: String(fd.get("partnerId") || ""),
        amount: Number(fd.get("amount")),
        note: String(fd.get("note") || ""),
        date: String(fd.get("date") || ""),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setModalError(data.error || "Could not update contribution");
      return;
    }
    setEditingContribution(null);
    await refresh();
  }

  async function confirmDeleteContribution() {
    if (!deletingContribution) return;
    setBusy(true);
    setError("");
    const res = await fetch(
      `/api/contributions/${deletingContribution.id}`,
      { method: "DELETE" },
    );
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not delete contribution");
      setDeletingContribution(null);
      return;
    }
    setDeletingContribution(null);
    await refresh();
  }

  async function loadExample() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/seed-example", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force: true }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not load example");
      return;
    }
    setTab("partners");
    await refresh();
  }

  const partnerModal =
    mounted && editingPartner
      ? createPortal(
          <div
            className="modal-backdrop"
            onClick={() => !busy && setEditingPartner(null)}
            role="presentation"
          >
            <div
              className="modal-card"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-partner-title"
            >
              <div className="modal-head">
                <div>
                  <h2 id="edit-partner-title">Edit partner</h2>
                  <p>Update name or committed capital.</p>
                </div>
                <button
                  type="button"
                  className="btn-icon"
                  aria-label="Close"
                  onClick={() => setEditingPartner(null)}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={savePartner}>
                <div className="form-grid">
                  <label>
                    Partner name
                    <input
                      name="name"
                      required
                      defaultValue={editingPartner.name}
                    />
                  </label>
                  <label>
                    Committed amount (Rs)
                    <input
                      name="committedAmount"
                      type="number"
                      min="0"
                      step="1"
                      required
                      defaultValue={editingPartner.committedAmount}
                    />
                  </label>
                </div>
                <p className="muted" style={{ margin: "0.75rem 0" }}>
                  Already in pot:{" "}
                  {formatMoney(editingPartner.contributedAmount)} · Pending
                  updates after save.
                </p>
                {modalError ? <p className="form-error">{modalError}</p> : null}
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setEditingPartner(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={busy}
                  >
                    {busy ? "Saving…" : "Save partner"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )
      : null;

  const contributionModal =
    mounted && editingContribution
      ? createPortal(
          <div
            className="modal-backdrop"
            onClick={() => !busy && setEditingContribution(null)}
            role="presentation"
          >
            <div
              className="modal-card"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-contrib-title"
            >
              <div className="modal-head">
                <div>
                  <h2 id="edit-contrib-title">Edit contribution</h2>
                  <p>Correct money put into the pot.</p>
                </div>
                <button
                  type="button"
                  className="btn-icon"
                  aria-label="Close"
                  onClick={() => setEditingContribution(null)}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={saveContribution}>
                <div className="form-grid">
                  <label>
                    Partner
                    <select
                      name="partnerId"
                      required
                      defaultValue={editingContribution.partnerId}
                    >
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Amount (Rs)
                    <input
                      name="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      defaultValue={editingContribution.amount}
                    />
                  </label>
                  <label>
                    Date
                    <input
                      name="date"
                      type="date"
                      required
                      defaultValue={toDateInput(editingContribution.date)}
                    />
                  </label>
                  <label className="full">
                    Note
                    <input
                      name="note"
                      defaultValue={editingContribution.note}
                    />
                  </label>
                </div>
                {modalError ? <p className="form-error">{modalError}</p> : null}
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setEditingContribution(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={busy}
                  >
                    {busy ? "Saving…" : "Save contribution"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="capital-layout">
      {error ? <div className="form-error banner-error">{error}</div> : null}

      <div className="capital-tabs" role="tablist" aria-label="Capital sections">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "partners"}
          className={tab === "partners" ? "active" : ""}
          onClick={() => setTab("partners")}
        >
          Partners
          <em>{partners.length}</em>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "contributions"}
          className={tab === "contributions" ? "active" : ""}
          onClick={() => setTab("contributions")}
        >
          Add Money into the pot
          <em>{contributions.length}</em>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "business"}
          className={tab === "business" ? "active" : ""}
          onClick={() => setTab("business")}
        >
          Business
        </button>
      </div>

      {tab === "partners" ? (
        <div className="capital-pane">
          <div className="pane-intro">
            <div>
              <h2>Partners & commitments</h2>
              <p>
                Commitment is the promise. Contribution is cash already in the
                pot. Edit anyone anytime.
              </p>
            </div>
          </div>

          {!partners.length ? (
            <div className="empty soft">
              No partners yet. Add your partners below.
            </div>
          ) : (
            <div className="entity-grid">
              {partners.map((p) => {
                const pct = progressPct(
                  p.contributedAmount,
                  p.committedAmount,
                );
                return (
                  <article key={p.id} className="entity-card">
                    <div className="entity-card-top">
                      <div className="avatar-dot" aria-hidden>
                        {p.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="entity-card-title">
                        <strong>{p.name}</strong>
                        <span>
                          Aim {formatMoney(p.committedAmount)}
                        </span>
                      </div>
                      <div className="action-btns">
                        <button
                          type="button"
                          className="btn-action edit"
                          onClick={() => {
                            setModalError("");
                            setEditingPartner(p);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-action danger"
                          onClick={() => setDeletingPartner(p)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="progress-block">
                      <div className="progress-meta">
                        <span>In pot {formatMoney(p.contributedAmount)}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="progress-track" aria-hidden>
                        <i style={{ width: `${pct}%` }} />
                      </div>
                      <div className="progress-meta muted-row">
                        <span>Pending {formatMoney(p.pendingAmount)}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <section className="panel inset-panel">
            <div className="panel-head-row">
              <h2>Add partner</h2>
              <span className="chip">New</span>
            </div>
            <form className="form-card bare" onSubmit={addPartner}>
              <div className="form-grid">
                <label>
                  Partner name
                  <input name="name" required placeholder="e.g. Junaid" />
                </label>
                <label>
                  Committed amount (Rs)
                  <input
                    name="committedAmount"
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="25000"
                  />
                </label>
              </div>
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? "Saving…" : "Add partner"}
              </button>
            </form>
          </section>
        </div>
      ) : null}

      {tab === "contributions" ? (
        <div className="capital-pane">
          <div className="pane-intro">
            <div>
              <h2>Money into the pot</h2>
              <p>
                Record each time a partner puts cash in. Edit or delete if a
                number was wrong.
              </p>
            </div>
          </div>

          <section className="panel inset-panel">
            <div className="panel-head-row">
              <h2>Record contribution</h2>
              <span className="chip">In</span>
            </div>
            <form className="form-card bare" onSubmit={addContribution}>
              <div className="form-grid">
                <label>
                  Partner
                  <select name="partnerId" required defaultValue="">
                    <option value="" disabled>
                      Select partner
                    </option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · pending {formatMoney(p.pendingAmount)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Amount (Rs)
                  <input
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    placeholder="5000"
                  />
                </label>
                <label>
                  Date
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={today}
                  />
                </label>
                <label>
                  Note
                  <input
                    name="note"
                    placeholder="e.g. First shed materials"
                  />
                </label>
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={busy || !partners.length}
              >
                {busy ? "Saving…" : "Record contribution"}
              </button>
            </form>
          </section>

          {!contributions.length ? (
            <div className="empty soft">
              No contributions yet. Example: each partner puts in Rs 5,000.
            </div>
          ) : (
            <ul className="expense-list capital-list">
              {contributions.map((c) => (
                <li key={c.id}>
                  <div>
                    <strong>{c.partnerName}</strong>
                    <p>
                      {formatDate(c.date)}
                      {c.note ? ` · ${c.note}` : ""}
                    </p>
                  </div>
                  <div className="row-actions">
                    <span className="amount in-amt">
                      +{formatMoney(c.amount)}
                    </span>
                    <div className="action-btns">
                      <button
                        type="button"
                        className="btn-action edit"
                        onClick={() => {
                          setModalError("");
                          setEditingContribution(c);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-action danger"
                        onClick={() => setDeletingContribution(c)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "business" ? (
        <div className="capital-pane">
          <div className="pane-intro">
            <div>
              <h2>Business settings</h2>
              <p>Name the venture and set the overall capital target.</p>
            </div>
          </div>

          <section className="panel inset-panel">
            <form className="form-card bare" onSubmit={saveBusiness}>
              <div className="form-grid">
                <label>
                  Business name
                  <input
                    name="name"
                    required
                    defaultValue={businessName}
                    placeholder="e.g. Egg Shed Co"
                  />
                </label>
                <label>
                  Target capital (Rs)
                  <input
                    name="targetCapital"
                    type="number"
                    min="0"
                    step="1"
                    required
                    defaultValue={targetCapital}
                    placeholder="50000"
                  />
                </label>
              </div>
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? "Saving…" : "Save business"}
              </button>
            </form>
          </section>

          <section className="panel inset-panel demo-panel">
            <div className="panel-head-row">
              <h2>Demo: Golden Egg Farm</h2>
              <span className="chip">Optional</span>
            </div>
            <p className="muted" style={{ marginBottom: "0.85rem" }}>
              Reloads Partner A + Partner B at Rs 25,000 each, Rs 10,000
              contributed (20% progress), sample buys, cash left Rs 5,580.
            </p>
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={loadExample}
            >
              {busy ? "Loading…" : "Reset & load Golden Egg Farm"}
            </button>
          </section>
        </div>
      ) : null}

      {partnerModal}
      {contributionModal}

      <ConfirmModal
        open={Boolean(deletingPartner)}
        title="Delete partner?"
        message={
          deletingPartner
            ? `Remove “${deletingPartner.name}” (aim ${formatMoney(deletingPartner.committedAmount)})? Delete their contributions first if any exist.`
            : ""
        }
        confirmLabel="Delete partner"
        danger
        busy={busy}
        onConfirm={confirmDeletePartner}
        onCancel={() => setDeletingPartner(null)}
      />

      <ConfirmModal
        open={Boolean(deletingContribution)}
        title="Delete contribution?"
        message={
          deletingContribution
            ? `Remove ${formatMoney(deletingContribution.amount)} from ${deletingContribution.partnerName}? The pot and cash left will shrink by that amount.`
            : ""
        }
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={confirmDeleteContribution}
        onCancel={() => setDeletingContribution(null)}
      />
    </div>
  );
}
