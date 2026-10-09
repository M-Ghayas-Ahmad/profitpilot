"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  {
    href: "/app",
    label: "Overview",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 13h6V4H4v9zm10 7h6V4h-6v16zM4 20h6v-5H4v5z" />
      </svg>
    ),
  },
  {
    href: "/app/expenses",
    label: "Expenses",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/app/add",
    label: "Add expense",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/app/records",
    label: "Records",
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

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const links = NAV.filter(
    (item) => showRecords || item.href !== "/app/records",
  );

  return (
    <div className="app-frame">
      <div
        className={`sidebar-backdrop${open ? " show" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />

      <aside className={`sidebar${open ? " open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">PP</span>
          <div>
            <strong>ProfitPilot</strong>
            <p className="brand-sub">Expense command</p>
          </div>
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
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            Menu
          </button>
        </div>
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
