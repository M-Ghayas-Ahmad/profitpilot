import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { connectDB } from "@/lib/db";
import { getOrCreateBusiness } from "@/lib/business";
import { Expense } from "@/models/Expense";

const updateSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  amount: z.coerce.number().positive().optional(),
  spentBy: z.string().trim().min(1).max(80).optional(),
  note: z.string().trim().max(500).optional(),
  date: z.string().min(1).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = updateSchema.parse(await req.json());
    await connectDB();

    const update: Record<string, unknown> = { ...body };
    if (body.date) update.date = new Date(body.date);

    const business = await getOrCreateBusiness(session.id);
    const expense = await Expense.findOneAndUpdate(
      { _id: id, businessId: business._id },
      { $set: update },
      { new: true },
    );

    if (!expense) {
      await logActivity({
        userId: session.id,
        userName: session.name,
        module: "Expenses",
        action: "Updated",
        description: "Failed to update expense — not found",
        status: "Failed",
      });
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    await logActivity({
      userId: session.id,
      userName: session.name,
      module: "Expenses",
      action: "Updated",
      description: `Updated expense “${expense.title}”`,
      status: "Success",
    });

    return NextResponse.json({
      expense: {
        id: String(expense._id),
        title: expense.title,
        amount: expense.amount,
        spentBy: expense.spentBy,
        note: expense.note || "",
        date: expense.date,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
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
      action: "Updated",
      description: "Failed to update expense",
      status: "Failed",
    });
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await connectDB();
  const business = await getOrCreateBusiness(session.id);
  const deleted = await Expense.findOneAndDelete({
    _id: id,
    businessId: business._id,
  });

  if (!deleted) {
    await logActivity({
      userId: session.id,
      userName: session.name,
      module: "Expenses",
      action: "Deleted",
      description: "Failed to delete expense — not found",
      status: "Failed",
    });
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  await logActivity({
    userId: session.id,
    userName: session.name,
    module: "Expenses",
    action: "Deleted",
    description: `Deleted expense “${deleted.title}” — ${deleted.spentBy} / Rs ${deleted.amount}`,
    status: "Success",
  });

  return NextResponse.json({ ok: true });
}
