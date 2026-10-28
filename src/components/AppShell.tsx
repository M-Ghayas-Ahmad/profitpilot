"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  {
    href: "/app",
    label: "The pot",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 13h6V4H4v9zm10 7h6V4h-6v16zM4 20h6v-5H4v5z" />
      </svg>
    ),
  },
  {
    href: "/app/capital",
    label: "Capital",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3v18M7 8h8a3 3 0 010 6H9a3 3 0 000 6h8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/app/expenses",
    label: "Buys",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/app/add",
    label: "Log a buy",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/app/eggs",
    label: "Eggs",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3c-3.5 0-6.5 5.2-6.5 10a6.5 6.5 0 0013 0C18.5 8.2 15.5 3 12 3z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/app/records",
    label: "Activity",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 9h8M8 13h8M8 17h5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function AppShell({
  userName,
  showRecords = true,
  children,
}: {
  userName: string;
  showRecords?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function logout() {
    setBusy(true);
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const links = NAV.filter(
    (item) => showRecords || item.href !== "/app/records",
  );

  return (
    <div className="app-frame">
      <button
        type="button"
        className={`sidebar-backdrop${open ? " show" : ""}`}
        aria-label="Close menu"
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
      />

      <aside className={`sidebar${open ? " open" : ""}`}>
        <div className="sidebar-top">
          <div className="brand">
            <span className="brand-mark">PP</span>
            <div>
              <strong>ProfitPilot</strong>
              <p className="brand-sub">Partner capital ledger</p>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-close"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Primary">
          {links.map((item) => {
            const active =
              item.href === "/app"
                ? pathname === "/app"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "active" : ""}
                onClick={() => setOpen(false)}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <span className="name">{userName}</span>
          <button type="button" onClick={logout} disabled={busy}>
            {busy ? "Signing out…" : "Log out"}
          </button>
        </div>
      </aside>

      <div className="content-col">
        <div className="mobile-bar">
          <div className="brand">
            <span className="brand-mark">PP</span>
            <div>
              <strong>ProfitPilot</strong>
            </div>
          </div>
          <button
            type="button"
            className="nav-toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
