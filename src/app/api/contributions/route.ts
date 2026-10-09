import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { connectDB } from "@/lib/db";
import { getOrCreateBusiness } from "@/lib/business";
import { Contribution } from "@/models/Contribution";
import { Partner } from "@/models/Partner";

const createSchema = z.object({
  partnerId: z.string().min(1),
  amount: z.coerce.number().positive(),
  note: z.string().trim().max(500).optional(),
  date: z.string().min(1),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const business = await getOrCreateBusiness(session.id);
  const rows = await Contribution.find({ businessId: business._id })
    .sort({ date: -1, createdAt: -1 })
    .lean();

  const total = rows.reduce((s, r) => s + r.amount, 0);

  return NextResponse.json({
    contributions: rows.map((c) => ({
      id: String(c._id),
      partnerId: String(c.partnerId),
      partnerName: c.partnerName,
      amount: c.amount,
      note: c.note || "",
      date: c.date,
    })),
    total,
    count: rows.length,
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

    if (!mongoose.Types.ObjectId.isValid(body.partnerId)) {
      return NextResponse.json({ error: "Invalid partner" }, { status: 400 });
    }

    const partner = await Partner.findOne({
      _id: body.partnerId,
      businessId: business._id,
    });
    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    const contribution = await Contribution.create({
      businessId: business._id,
      partnerId: partner._id,
      partnerName: partner.name,
      amount: body.amount,
      note: body.note,
      date: new Date(body.date),
      createdBy: session.id,
    });

    await logActivity({
      userId: session.id,
      userName: session.name,
      module: "Capital",
      action: "Created",
      description: `Contribution from “${partner.name}” — Rs ${contribution.amount}`,
      status: "Success",
    });

    return NextResponse.json(
      {
        contribution: {
          id: String(contribution._id),
          partnerId: String(partner._id),
          partnerName: partner.name,
          amount: contribution.amount,
          note: contribution.note || "",
          date: contribution.date,
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
    console.error(err);
    return NextResponse.json(
      { error: "Could not save contribution" },
      { status: 500 },
    );
  }
}
