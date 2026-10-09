import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { connectDB } from "@/lib/db";
import { getOrCreateBusiness } from "@/lib/business";
import { Expense } from "@/models/Expense";

const createSchema = z.object({
  title: z.string().trim().min(2).max(160),
  amount: z.coerce.number().positive(),
  spentBy: z.string().trim().min(1).max(80),
  note: z.string().trim().max(500).optional(),
  date: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim();
  const spentBy = searchParams.get("spentBy")?.trim();
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const business = await getOrCreateBusiness(session.id);
  const filter: Record<string, unknown> = { businessId: business._id };

  if (spentBy) filter.spentBy = new RegExp(spentBy, "i");
  if (q) {
    filter.$or = [
      { title: new RegExp(q, "i") },
      { spentBy: new RegExp(q, "i") },
      { note: new RegExp(q, "i") },
    ];
  }
  if (from || to) {
    filter.date = {};
    if (from) (filter.date as Record<string, Date>).$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      (filter.date as Record<string, Date>).$lte = end;
    }
  }

  const expenses = await Expense.find(filter).sort({ date: -1, createdAt: -1 }).lean();
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return NextResponse.json({
    expenses: expenses.map((e) => ({
      id: String(e._id),
      title: e.title,
      amount: e.amount,
      spentBy: e.spentBy,
      note: e.note || "",
      date: e.date,
      createdAt: e.createdAt,
    })),
    total,
    count: expenses.length,
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = createSchema.parse(await req.json());
    await connectDB();

    const business = await getOrCreateBusiness(session.id);
    const expense = await Expense.create({
      ...body,
      businessId: business._id,
      date: new Date(body.date),
      createdBy: session.id,
    });

    await logActivity({
      userId: session.id,
      userName: session.name,
      module: "Expenses",
      action: "Created",
      description: `Created expense “${expense.title}” — ${expense.spentBy} spent Rs ${expense.amount}`,
      status: "Success",
    });

    return NextResponse.json(
      {
        expense: {
          id: String(expense._id),
          title: expense.title,
          amount: expense.amount,
          spentBy: expense.spentBy,
          note: expense.note || "",
          date: expense.date,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      await logActivity({
        userId: session.id,
        userName: session.name,
        module: "Expenses",
        action: "Created",
        description: `Failed to create expense — ${err.issues[0]?.message || "invalid input"}`,
        status: "Failed",
      });
      return NextResponse.json(
        { error: err.issues[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }
    console.error(err);
    await logActivity({
      userId: session.id,
      userName: session.name,
      module: "Expenses",
      action: "Created",
      description: "Failed to create expense",
      status: "Failed",
    });
    return NextResponse.json({ error: "Could not save expense" }, { status: 500 });
  }
}
