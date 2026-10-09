import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getBusinessSummary, getOrCreateBusiness } from "@/lib/business";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  targetCapital: z.coerce.number().min(0).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const summary = await getBusinessSummary(session.id);
  return NextResponse.json(summary);
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = patchSchema.parse(await req.json());
    await connectDB();
    const business = await getOrCreateBusiness(session.id);

    if (body.name !== undefined) business.name = body.name;
    if (body.targetCapital !== undefined) {
      business.targetCapital = body.targetCapital;
    }
    await business.save();

    const summary = await getBusinessSummary(session.id);
    return NextResponse.json(summary);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Could not update business" }, { status: 500 });
  }
}

/** Ensure a business exists (used after register/login). */
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  await getOrCreateBusiness(session.id);
  const summary = await getBusinessSummary(session.id);
  return NextResponse.json(summary, { status: 201 });
}
