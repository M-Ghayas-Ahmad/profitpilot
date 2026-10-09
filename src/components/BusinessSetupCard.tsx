import Link from "next/link";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { formatMoney } from "@/lib/format";

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

function progressPct(contributed: number, planned: number) {
  if (planned <= 0) return contributed > 0 ? 100 : 0;
  return Math.min(100, Math.round((contributed / planned) * 100));
}

function partnerPct(contributed: number, committed: number) {
  if (committed <= 0) return contributed > 0 ? 100 : 0;
  return Math.min(100, Math.round((contributed / committed) * 100));
}

function ProgressRing({ pct }: { pct: number }) {
  const size = 132;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="gef-ring" aria-label={`Investment progress ${pct}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="gef-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className="gef-ring-value"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="gef-ring-label">
        <span>Investment progress</span>
        <strong>{pct}%</strong>
      </div>
    </div>
  );
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
  const displayPartners =
    partners.length > 0
      ? partners
      : [
          {
            id: "a",
            name: "Partner A",
            committedAmount: 0,
            contributedAmount: 0,
            pendingAmount: 0,
          },
          {
            id: "b",
            name: "Partner B",
            committedAmount: 0,
            contributedAmount: 0,
            pendingAmount: 0,
          },
        ];

  return (
    <section className="gef-board">
      <div className="gef-hero">
        <div className="gef-hero-copy">
          <span className="gef-badge">Business setup</span>
          <h2>{businessName}</h2>
          <p>
            Imagine two partners start a business called{" "}
            <em>{businessName}</em>. Targets are set, cash enters the pot as
            needed, and every rupee stays visible.
          </p>
          <div className="gef-hero-actions">
            <Link href={manageHref} className="btn-primary">
              Manage capital
            </Link>
            <Link href="/app/add" className="btn-secondary gef-hero-secondary">
              Log a buy
            </Link>
          </div>
        </div>
        <ProgressRing pct={pct} />
        <div className="gef-hero-glow" aria-hidden />
      </div>

      <div className="gef-body">
        <div className="gef-section-label">Partner targets</div>
        <div className="gef-partner-row">
          {displayPartners.map((p, i) => {
            const pPct = partnerPct(p.contributedAmount, p.committedAmount);
            const letter = (p.name?.trim()?.[0] || String.fromCharCode(65 + i)).toUpperCase();
            return (
              <article key={p.id} className="gef-partner-card">
                <div className="gef-partner-top">
                  <span className="gef-mono" aria-hidden>
                    {letter}
                  </span>
                  <div>
                    <span className="gef-soft-label">
                      {p.name}&apos;s target
                    </span>
                    <strong>
                      <AnimatedNumber
                        value={p.committedAmount}
                        prefix="Rs"
                      />
                    </strong>
                  </div>
                </div>
                <div className="gef-mini-bar" aria-hidden>
                  <i style={{ width: `${pPct}%` }} />
                </div>
                <div className="gef-partner-foot">
                  <span>
                    In pot <b>{formatMoney(p.contributedAmount)}</b>
                  </span>
                  <span>
                    Pending <b>{formatMoney(p.pendingAmount)}</b>
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        <div className="gef-section-label">Investment snapshot</div>
        <div className="gef-snapshot">
          <article className="gef-stat-tile">
            <span className="gef-soft-label">Total planned investment</span>
            <strong>
              <AnimatedNumber value={plannedTotal} prefix="Rs" />
            </strong>
            <p>What both partners agreed to put in over time</p>
          </article>
          <article className="gef-stat-tile is-live">
            <span className="gef-soft-label">Actually contributed</span>
            <strong>
              <AnimatedNumber value={contributedTotal} prefix="Rs" />
            </strong>
            <p>Cash that has already entered the pot</p>
          </article>
        </div>

        <div className="gef-compare">
          <article className="gef-compare-card is-in">
            <div className="gef-compare-head">
              <span className="gef-soft-label">Cash contributed so far</span>
              <strong>
                <AnimatedNumber value={contributedTotal} prefix="Rs" />
              </strong>
            </div>
            <div className="gef-compare-track" aria-hidden>
              <i style={{ width: `${pct}%` }} />
            </div>
          </article>
          <article className="gef-compare-card is-pending">
            <div className="gef-compare-head">
              <span className="gef-soft-label">Target not yet contributed</span>
              <strong>
                <AnimatedNumber value={pendingTotal} prefix="Rs" />
              </strong>
            </div>
            <div className="gef-compare-track" aria-hidden>
              <i
                style={{
                  width: `${Math.max(0, 100 - pct)}%`,
                }}
              />
            </div>
          </article>
        </div>

        {showCashPosition ? (
          <>
            <div className="gef-section-label">Cash position</div>
            <div className="gef-cash">
              <article className="gef-cash-tile is-spent">
                <span className="gef-soft-label">Spent from the pot</span>
                <strong>
                  <AnimatedNumber value={spentTotal} prefix="Rs" />
                </strong>
              </article>
              <article className="gef-cash-tile is-left">
                <span className="gef-soft-label">Cash left</span>
                <strong>
                  <AnimatedNumber value={cashLeft} prefix="Rs" />
                </strong>
              </article>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
