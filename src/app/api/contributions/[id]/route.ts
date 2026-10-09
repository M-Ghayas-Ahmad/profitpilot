import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { connectDB } from "@/lib/db";
import { getOrCreateBusiness } from "@/lib/business";
import { Contribution } from "@/models/Contribution";
import { Partner } from "@/models/Partner";

const patchSchema = z.object({
  partnerId: z.string().min(1).optional(),
  amount: z.coerce.number().positive().optional(),
  note: z.string().trim().max(500).optional(),
  date: z.string().min(1).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await ctx.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid contribution" }, { status: 400 });
    }

    const body = patchSchema.parse(await req.json());
    await connectDB();
    const business = await getOrCreateBusiness(session.id);

    const contribution = await Contribution.findOne({
      _id: id,
      businessId: business._id,
    });
    if (!contribution) {
      return NextResponse.json(
        { error: "Contribution not found" },
        { status: 404 },
      );
    }

    if (body.partnerId) {
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
      contribution.partnerId = partner._id;
      contribution.partnerName = partner.name;
    }
    if (body.amount !== undefined) contribution.amount = body.amount;
    if (body.note !== undefined) contribution.note = body.note;
    if (body.date !== undefined) contribution.date = new Date(body.date);
    await contribution.save();

    await logActivity({
      userId: session.id,
      userName: session.name,
      module: "Capital",
      action: "Updated",
      description: `Updated contribution from “${contribution.partnerName}” — Rs ${contribution.amount}`,
      status: "Success",
    });

    return NextResponse.json({
      contribution: {
        id: String(contribution._id),
        partnerId: String(contribution.partnerId),
        partnerName: contribution.partnerName,
        amount: contribution.amount,
        note: contribution.note || "",
        date: contribution.date,
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
    return NextResponse.json(
      { error: "Could not update contribution" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await ctx.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid contribution" }, { status: 400 });
    }

    await connectDB();
    const business = await getOrCreateBusiness(session.id);
    const contribution = await Contribution.findOne({
      _id: id,
      businessId: business._id,
    });
    if (!contribution) {
      return NextResponse.json(
        { error: "Contribution not found" },
        { status: 404 },
      );
    }

    const label = `${contribution.partnerName} — Rs ${contribution.amount}`;
    await contribution.deleteOne();

    await logActivity({
      userId: session.id,
      userName: session.name,
      module: "Capital",
      action: "Deleted",
      description: `Deleted contribution ${label}`,
      status: "Success",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Could not delete contribution" },
      { status: 500 },
    );
  }
}
