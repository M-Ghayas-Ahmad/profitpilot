import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { connectDB } from "@/lib/db";
import { getOrCreateBusiness } from "@/lib/business";
import { formatDate } from "@/lib/format";
import { EggLog } from "@/models/EggLog";
import { eggCount, eggDate, isDuplicateDay, toEggJson } from "@/lib/eggs";

const createSchema = z.object({
  date: eggDate,
  count: eggCount,
  note: z.string().trim().max(300).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const business = await getOrCreateBusiness(session.id);
  const filter: Record<string, unknown> = { businessId: business._id };
  if (from || to) {
    filter.date = {};
    if (from) (filter.date as Record<string, Date>).$gte = new Date(from);
    if (to) (filter.date as Record<string, Date>).$lte = new Date(to);
  }

  const logs = await EggLog.find(filter).sort({ date: -1 }).lean();
  const total = logs.reduce((s, e) => s + e.count, 0);
  const best = logs.reduce<(typeof logs)[number] | null>((b, e) => (!b || e.count > b.count ? e : b), null);

  return NextResponse.json({
    logs: logs.map(toEggJson),
    total,
    count: logs.length,
    average: logs.length ? Math.round(total / logs.length) : 0,
    best: best ? { date: best.date, count: best.count } : null,
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
    const log = await EggLog.create({
      ...body,
      businessId: business._id,
      date: new Date(body.date),
      createdBy: session.id,
    });

    await logActivity({
      userId: session.id,
      userName: session.name,
      module: "Eggs",
      action: "Created",
      description: `Logged ${log.count} eggs for ${formatDate(log.date)}`,
      status: "Success",
    });

    return NextResponse.json({ log: toEggJson(log) }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }
    if (isDuplicateDay(err)) {
      return NextResponse.json(
        { error: "Eggs are already logged for this date — edit that entry instead" },
        { status: 409 },
      );
    }
    console.error(err);
    await logActivity({
      userId: session.id,
      userName: session.name,
      module: "Eggs",
      action: "Created",
      description: "Failed to log eggs",
      status: "Failed",
    });
    return NextResponse.json({ error: "Could not save egg count" }, { status: 500 });
  }
}
