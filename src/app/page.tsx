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
            <p>Partner capital ledger</p>
          </div>
        </div>
        <div className="cta-row">
          <Link href="/login" className="btn-secondary">
            Log in
          </Link>
          <Link href="/register" className="btn-primary">
            Start free
          </Link>
        </div>
      </nav>

      <section className="landing-hero">
        <h1>ProfitPilot</h1>
        <p className="landing-lead">
          Two partners. One pot. Every rupee accounted for — from the first
          contribution to the last bag of feed.
        </p>
        <p className="landing-sub">
          Commit capital, record money put in, log buys from the pot, and always
          see cash left. Built for sheds, startups, and co-founder wallets.
        </p>
        <div className="cta-row">
          <Link href="/register" className="btn-primary">
            Open the ledger
          </Link>
          <Link href="/login" className="btn-secondary">
            I have an account
          </Link>
        </div>

        <ol className="landing-steps" aria-label="How money moves">
          <li>
            <span>1</span>
            <strong>Commit</strong>
            <em>Agree each partner’s share</em>
          </li>
          <li>
            <span>2</span>
            <strong>Put in</strong>
            <em>Cash enters the pot</em>
          </li>
          <li>
            <span>3</span>
            <strong>Spend</strong>
            <em>Buys leave the pot</em>
          </li>
          <li>
            <span>4</span>
            <strong>Cash left</strong>
            <em>What you can still use</em>
          </li>
        </ol>
      </section>
    </div>
  );
}
