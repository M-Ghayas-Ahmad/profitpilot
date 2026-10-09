import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect("/app");

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="brand">
          <span className="brand-mark">PP</span>
          <div>
            <strong>ProfitPilot</strong>
            <p>Expense command</p>
          </div>
        </div>
        <div className="cta-row">
          <Link href="/login" className="btn-secondary">
            Log in
          </Link>
          <Link href="/register" className="btn-primary">
            Get started
          </Link>
        </div>
      </nav>

      <section className="landing-hero">
        <span className="eyebrow">Built for real households & teams</span>
        <h1>ProfitPilot</h1>
        <p>
          A clear ledger for every spend — who paid, what they bought, and the
          running total. Fast on phone, sharp on desktop.
        </p>
        <div className="cta-row">
          <Link href="/register" className="btn-primary">
            Open your dashboard
          </Link>
          <Link href="/login" className="btn-secondary">
            I have an account
          </Link>
        </div>
      </section>
    </div>
  );
}
