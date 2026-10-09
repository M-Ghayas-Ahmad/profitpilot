"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type RecordRow = {
  index: number;
  id: string;
  dateTime: string;
  user: string;
  role: string;
  module: string;
  action: string;
  description: string;
  status: "Success" | "Failed";
};

function formatDateTime(value: string) {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function RecordsClient() {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [status, setStatus] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (moduleFilter !== "all") params.set("module", moduleFilter);
    if (status !== "all") params.set("status", status);
    const res = await fetch(`/api/records?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed to load records");
      return;
    }
    setRecords(data.records || []);
  }, [q, moduleFilter, status]);

  useEffect(() => {
    load();
  }, [load]);

  function onFilter(e: FormEvent) {
    e.preventDefault();
    load();
  }

  return (
    <div className="stack-lg">
      <form className="filters records-filters" onSubmit={onFilter}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search description, action, module…"
        />
        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
        >
          <option value="all">All modules</option>
          <option value="Auth">Auth</option>
          <option value="Expenses">Expenses</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="Success">Success</option>
          <option value="Failed">Failed</option>
        </select>
        <button type="submit" className="btn-secondary">
          Apply
        </button>
      </form>

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="muted">Loading records…</p> : null}

      {!loading && records.length === 0 ? (
        <div className="empty">
          No activity yet. Login, add, or delete expenses to build your audit
          trail.
        </div>
      ) : null}

      {records.length > 0 ? (
        <div className="records-table-wrap">
          <table className="records-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date &amp; Time</th>
                <th>User</th>
                <th>Role</th>
                <th>Module</th>
                <th>Action</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((row) => (
                <tr key={row.id}>
                  <td>{row.index}</td>
                  <td className="nowrap">{formatDateTime(row.dateTime)}</td>
                  <td>{row.user}</td>
                  <td>{row.role}</td>
                  <td>{row.module}</td>
                  <td>{row.action}</td>
                  <td>{row.description}</td>
                  <td>
                    <span
                      className={
                        row.status === "Success"
                          ? "status-pill ok"
                          : "status-pill bad"
                      }
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
