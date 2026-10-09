import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getOrCreateBusiness } from "@/lib/business";
import { Expense } from "@/models/Expense";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const businessId = (await getOrCreateBusiness(session.id))._id;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totals, byPerson, recent] = await Promise.all([
    Expense.aggregate([
      { $match: { businessId } },
      {
        $group: {
          _id: null,
          allTime: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    Expense.aggregate([
      { $match: { businessId } },
      { $group: { _id: "$spentBy", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 8 },
    ]),
    Expense.find({ businessId }).sort({ date: -1 }).limit(6).lean(),
  ]);

  const monthAgg = await Expense.aggregate([
    { $match: { businessId, date: { $gte: monthStart } } },
    { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);

  return NextResponse.json({
    allTime: totals[0]?.allTime || 0,
    count: totals[0]?.count || 0,
    thisMonth: monthAgg[0]?.total || 0,
    thisMonthCount: monthAgg[0]?.count || 0,
    byPerson: byPerson.map((r) => ({
      name: r._id,
      total: r.total,
      count: r.count,
    })),
    recent: recent.map((e) => ({
      id: String(e._id),
      title: e.title,
      amount: e.amount,
      spentBy: e.spentBy,
      date: e.date,
    })),
  });
}
