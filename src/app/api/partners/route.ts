import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { connectDB } from "@/lib/db";
import { getOrCreateBusiness } from "@/lib/business";
import { Partner } from "@/models/Partner";

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  committedAmount: z.coerce.number().min(0),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const business = await getOrCreateBusiness(session.id);
  const partners = await Partner.find({ businessId: business._id })
    .sort({ name: 1 })
    .lean();

  return NextResponse.json({
    partners: partners.map((p) => ({
      id: String(p._id),
      name: p.name,
      committedAmount: p.committedAmount,
    })),
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

    const partner = await Partner.create({
      businessId: business._id,
      name: body.name,
      committedAmount: body.committedAmount,
      createdBy: session.id,
    });

    // Keep business target in sync with sum of partner commitments when unset/low.
    const all = await Partner.find({ businessId: business._id }).lean();
    const sum = all.reduce((s, p) => s + p.committedAmount, 0);
    if (!business.targetCapital || business.targetCapital < sum) {
      business.targetCapital = sum;
      await business.save();
    }

    await logActivity({
      userId: session.id,
      userName: session.name,
      module: "Capital",
      action: "Created",
      description: `Added partner “${partner.name}” — committed Rs ${partner.committedAmount}`,
      status: "Success",
    });

    return NextResponse.json(
      {
        partner: {
          id: String(partner._id),
          name: partner.name,
          committedAmount: partner.committedAmount,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }
    // duplicate partner name
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: "A partner with this name already exists" },
        { status: 409 },
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Could not save partner" }, { status: 500 });
  }
}
