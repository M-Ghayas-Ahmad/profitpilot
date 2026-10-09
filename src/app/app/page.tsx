import Link from "next/link";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { Expense } from "@/models/Expense";
import { redirect } from "next/navigation";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { DashboardCharts } from "@/components/DashboardCharts";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const userId = new mongoose.Types.ObjectId(session.id);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [totals, monthAgg, byPerson, recent, monthlyRaw] = await Promise.all([
    Expense.aggregate([
      { $match: { createdBy: userId } },
      {
        $group: {
          _id: null,
          allTime: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    Expense.aggregate([
      { $match: { createdBy: userId, date: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Expense.aggregate([
      { $match: { createdBy: userId } },
      {
        $group: {
          _id: "$spentBy",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 8 },
    ]),
    Expense.find({ createdBy: userId }).sort({ date: -1 }).limit(6).lean(),
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

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyMap = new Map(
    monthlyRaw.map((r) => [
      `${r._id.y}-${r._id.m}`,
      r.total as number,
    ]),
  );

  const monthly = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    return {
      label: monthLabels[d.getMonth()],
      total: monthlyMap.get(key) || 0,
    };
  });

  const stats = {
    allTime: totals[0]?.allTime || 0,
    count: totals[0]?.count || 0,
    thisMonth: monthAgg[0]?.total || 0,
    byPerson: byPerson.map((r) => ({
      name: r._id as string,
      total: r.total as number,
      count: r.count as number,
    })),
    recent: recent.map((e) => ({
      id: String(e._id),
      title: e.title,
      amount: e.amount,
      spentBy: e.spentBy,
      date: e.date,
    })),
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Overview</h1>
          <p>Live totals, charts, and recent activity.</p>
        </div>
        <Link href="/app/add" className="btn-primary btn-pulse">
          Add expense
        </Link>
      </div>

      <div className="stats">
        <div className="stat">
          <span>This month</span>
          <strong>
            <AnimatedNumber value={stats.thisMonth} prefix="Rs" />
          </strong>
        </div>
        <div className="stat">
          <span>All time</span>
          <strong>
            <AnimatedNumber value={stats.allTime} prefix="Rs" />
          </strong>
        </div>
        <div className="stat">
          <span>Entries</span>
          <strong>
            <AnimatedNumber value={stats.count} />
          </strong>
        </div>
      </div>

      <DashboardCharts monthly={monthly} byPerson={stats.byPerson} />

      <div className="panels" style={{ marginTop: "1rem" }}>
        <section className="panel">
          <h2>Recent expenses</h2>
          {!stats.recent.length ? (
            <div className="empty soft">
              Nothing logged yet — add your first spend to wake the charts.
            </div>
          ) : (
            <ul className="mini-list">
              {stats.recent.map((e) => (
                <li key={e.id}>
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
          <h2>Top spenders</h2>
          {!stats.byPerson.length ? (
            <div className="empty soft">
              People will rank here after you log expenses.
            </div>
          ) : (
            <ul className="mini-list">
              {stats.byPerson.map((p) => (
                <li key={p.name}>
                  <div>
                    <strong>{p.name}</strong>
                    <p>
                      {p.count} expense{p.count === 1 ? "" : "s"}
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
