import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getBusinessSummary } from "@/lib/business";
import { formatDate, formatMoney } from "@/lib/format";
import { Expense } from "@/models/Expense";
import { redirect } from "next/navigation";
import { BusinessSetupCard } from "@/components/BusinessSetupCard";
import { DashboardCharts } from "@/components/DashboardCharts";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const userId = new mongoose.Types.ObjectId(session.id);
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [summary, recent, byPerson, monthlyRaw] = await Promise.all([
    getBusinessSummary(session.id),
    Expense.find({ createdBy: userId }).sort({ date: -1 }).limit(6).lean(),
    Expense.aggregate([
      { $match: { createdBy: userId } },
      {
        $group: {
          _id: "$spentBy",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    Expense.aggregate([
      { $match: { createdBy: userId, date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            y: { $year: "$date" },
            m: { $month: "$date" },
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.y": 1, "_id.m": 1 } },
    ]),
  ]);

  const monthLabels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthlyMap = new Map(
    monthlyRaw.map((r) => [`${r._id.y}-${r._id.m}`, r.total as number]),
  );

  const monthly = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    return {
      label: monthLabels[d.getMonth()],
      total: monthlyMap.get(key) || 0,
    };
  });

  // Only current partners are listed, including ones who haven't spent yet.
  const spendByName = new Map(
    byPerson.map((r) => [
      r._id as string,
      { total: r.total as number, count: r.count as number },
    ]),
  );
  const byPersonRows = summary.partners
    .map((p) => {
      const spend = spendByName.get(p.name);
      return { name: p.name, total: spend?.total || 0, count: spend?.count || 0 };
    })
    .sort((a, b) => b.total - a.total);

  const planned =
    summary.business.targetCapital || summary.committedTotal || 0;

  return (
    <>
      <BusinessSetupCard
        businessName={summary.business.name}
        partners={summary.partners}
        plannedTotal={planned}
        contributedTotal={summary.contributedTotal}
        pendingTotal={summary.pendingCapital}
        spentTotal={summary.spentTotal}
        cashLeft={summary.cashLeft}
      />

      <DashboardCharts monthly={monthly} byPerson={byPersonRows} />

      <div className="panels" style={{ marginTop: "1rem" }}>
        <section className="panel">
          <h2>Recent buys</h2>
          {!recent.length ? (
            <div className="empty soft">
              No spends yet — log jali, paint, plastic, feed, and so on.
            </div>
          ) : (
            <ul className="mini-list">
              {recent.map((e) => (
                <li key={String(e._id)}>
                  <div>
                    <strong>{e.title}</strong>
                    <p>
                      {e.spentBy} · {formatDate(e.date)}
                    </p>
                  </div>
                  <span className="amount">{formatMoney(e.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <h2>Who spent from the pot</h2>
          {!byPersonRows.length ? (
            <div className="empty soft">
              Names appear here after you log buys.
            </div>
          ) : (
            <ul className="mini-list">
              {byPersonRows.map((p) => (
                <li key={p.name}>
                  <div>
                    <strong>{p.name}</strong>
                    <p>
                      {p.count} buy{p.count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="amount">{formatMoney(p.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
