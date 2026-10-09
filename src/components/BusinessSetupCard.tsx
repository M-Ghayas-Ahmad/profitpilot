import Link from "next/link";
import { AnimatedNumber } from "@/components/AnimatedNumber";

export type SetupPartner = {
  id: string;
  name: string;
  committedAmount: number;
  contributedAmount: number;
  pendingAmount: number;
};

type Props = {
  businessName: string;
  partners: SetupPartner[];
  plannedTotal: number;
  contributedTotal: number;
  pendingTotal: number;
  spentTotal?: number;
  cashLeft?: number;
  showCashPosition?: boolean;
  manageHref?: string;
};

function progressPct(part: number, whole: number) {
  if (whole <= 0) return part > 0 ? 100 : 0;
  return Math.min(100, Math.round((part / whole) * 100));
}

export function BusinessSetupCard({
  businessName,
  partners,
  plannedTotal,
  contributedTotal,
  pendingTotal,
  spentTotal = 0,
  cashLeft = 0,
  showCashPosition = true,
  manageHref = "/app/capital",
}: Props) {
  const pct = progressPct(contributedTotal, plannedTotal);

  return (
    <section className="setup-panel">
      <header className="setup-head">
        <div>
          <span className="chip">Business setup</span>
          <h2>{businessName}</h2>
          <p>
            {partners.length} partner{partners.length === 1 ? "" : "s"} · Rs{" "}
            {plannedTotal.toLocaleString("en-PK")} planned investment
          </p>
        </div>
        <div className="setup-actions">
          <Link href={manageHref} className="btn-primary">
            Manage capital
          </Link>
          <Link href="/app/add" className="btn-secondary">
            Log a buy
          </Link>
        </div>
      </header>

      <div className="setup-hero">
        <div className="setup-metric-cards">
          <article className="setup-metric-card is-contributed">
            <span>Actually contributed</span>
            <strong>
              <AnimatedNumber value={contributedTotal} prefix="Rs" />
            </strong>
          </article>
          <article className="setup-metric-card is-planned">
            <span>Total planned investment</span>
            <strong>
              <AnimatedNumber value={plannedTotal} prefix="Rs" />
            </strong>
          </article>
        </div>

        <div className="setup-progress">
          <div className="setup-progress-labels">
            <span>Investment progress</span>
            <strong>{pct}%</strong>
          </div>
          <div
            className="progress-track setup-progress-track"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Investment progress"
          >
            <i style={{ width: `${pct}%` }} />
          </div>
          <div className="setup-legend">
            <span>
              <b className="is-in" /> Cash contributed so far{" "}
              <em>Rs {contributedTotal.toLocaleString("en-PK")}</em>
            </span>
            <span>
              <b className="is-pending" /> Target not yet contributed{" "}
              <em>Rs {pendingTotal.toLocaleString("en-PK")}</em>
            </span>
          </div>
        </div>
      </div>

      {partners.length > 0 ? (
        <div className="setup-partners">
          {partners.map((p) => {
            const partnerPct = progressPct(
              p.contributedAmount,
              p.committedAmount,
            );
            return (
              <div key={p.id} className="setup-partner">
                <div className="setup-partner-top">
                  <span className="avatar-dot" aria-hidden>
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="setup-partner-title">
                    <strong>{p.name}</strong>
                    <span>
                      Target Rs {p.committedAmount.toLocaleString("en-PK")}
                    </span>
                  </div>
                  <span className="setup-partner-pct">{partnerPct}%</span>
                </div>
                <div className="progress-track" aria-hidden>
                  <i style={{ width: `${partnerPct}%` }} />
                </div>
                <div className="progress-meta muted-row">
                  <span>
                    In pot Rs {p.contributedAmount.toLocaleString("en-PK")}
                  </span>
                  <span>
                    Pending Rs {p.pendingAmount.toLocaleString("en-PK")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="setup-empty">
          No partners yet — add them under Capital to set targets.
        </p>
      )}

      {showCashPosition ? (
        <div className="setup-flow">
          <div className="setup-flow-step in">
            <span>Into the pot</span>
            <strong>
              <AnimatedNumber value={contributedTotal} prefix="Rs" />
            </strong>
          </div>
          <div className="setup-flow-step out">
            <span>Spent from the pot</span>
            <strong>
              <AnimatedNumber value={spentTotal} prefix="Rs" />
            </strong>
          </div>
          <div className="setup-flow-step cash">
            <span>Cash left</span>
            <strong>
              <AnimatedNumber value={cashLeft} prefix="Rs" />
            </strong>
          </div>
        </div>
      ) : null}
    </section>
  );
}
