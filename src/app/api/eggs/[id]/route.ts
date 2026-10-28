import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { connectDB } from "@/lib/db";
import { getOrCreateBusiness } from "@/lib/business";
import { formatDate } from "@/lib/format";
import { EggLog } from "@/models/EggLog";
import { eggCount, eggDate, isDuplicateDay, toEggJson } from "@/lib/eggs";

const updateSchema = z.object({
  date: eggDate.optional(),
  count: eggCount.optional(),
  note: z.string().trim().max(300).optional(),
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
    const before = await EggLog.findOne({ _id: id, businessId: business._id }).lean();
    const log = await EggLog.findOneAndUpdate(
      { _id: id, businessId: business._id },
      { $set: update },
      { new: true, runValidators: true },
    );

    if (!log || !before) {
      return NextResponse.json({ error: "Egg entry not found" }, { status: 404 });
    }

    await logActivity({
      userId: session.id,
      userName: session.name,
      module: "Eggs",
      action: "Updated",
      description: `Updated eggs for ${formatDate(log.date)}: ${before.count} → ${log.count}`,
      status: "Success",
    });

    return NextResponse.json({ log: toEggJson(log) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }
    if (isDuplicateDay(err)) {
      return NextResponse.json(
        { error: "Another entry already exists for that date" },
        { status: 409 },
      );
    }
    console.error(err);
    await logActivity({
      userId: session.id,
      userName: session.name,
      module: "Eggs",
      action: "Updated",
      description: "Failed to update egg entry",
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
  const deleted = await EggLog.findOneAndDelete({ _id: id, businessId: business._id });

  if (!deleted) {
    return NextResponse.json({ error: "Egg entry not found" }, { status: 404 });
  }

  await logActivity({
    userId: session.id,
    userName: session.name,
    module: "Eggs",
    action: "Deleted",
    description: `Deleted egg entry for ${formatDate(deleted.date)} (${deleted.count} eggs)`,
    status: "Success",
  });

  return NextResponse.json({ ok: true });
}
