import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { seedEggShedExample } from "@/lib/seedExample";

/** POST — load (or reload) the egg-shed co-founder example into this account. */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const force = Boolean(body?.force);

  await connectDB();
  const result = await seedEggShedExample(session.id, { force });

  await logActivity({
    userId: session.id,
    userName: session.name,
    module: "Capital",
    action: "Seed",
    description: result.seeded
      ? "Loaded egg-shed example (50k aim, 10k in, buys, cash left 5,580)"
      : "Skipped seed — ledger already has data",
    status: "Success",
  });

  return NextResponse.json(result);
}
