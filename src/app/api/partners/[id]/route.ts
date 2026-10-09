import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { connectDB } from "@/lib/db";
import { getOrCreateBusiness } from "@/lib/business";
import { Contribution } from "@/models/Contribution";
import { Expense } from "@/models/Expense";
import { Partner } from "@/models/Partner";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  committedAmount: z.coerce.number().min(0).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

async function loadOwnedPartner(userId: string, id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const business = await getOrCreateBusiness(userId);
  return Partner.findOne({ _id: id, businessId: business._id });
}

async function syncTargetCapital(businessId: mongoose.Types.ObjectId) {
  const all = await Partner.find({ businessId }).lean();
  const sum = all.reduce((s, p) => s + p.committedAmount, 0);
  const Business = (await import("@/models/Business")).Business;
  await Business.findByIdAndUpdate(businessId, { targetCapital: sum });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await ctx.params;
    const body = patchSchema.parse(await req.json());
    await connectDB();

    const partner = await loadOwnedPartner(session.id, id);
    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    const prevName = partner.name;
    if (body.name !== undefined) partner.name = body.name;
    if (body.committedAmount !== undefined) {
      partner.committedAmount = body.committedAmount;
    }
    await partner.save();

    if (body.name !== undefined && body.name !== prevName) {
      await Contribution.updateMany(
        { partnerId: partner._id },
        { $set: { partnerName: partner.name } },
      );
      await Expense.updateMany(
        { createdBy: partner.createdBy, spentBy: prevName },
        { $set: { spentBy: partner.name } },
      );
    }

    await syncTargetCapital(partner.businessId);

    await logActivity({
      userId: session.id,
      userName: session.name,
      module: "Capital",
      action: "Updated",
      description: `Updated partner “${partner.name}” — committed Rs ${partner.committedAmount}`,
      status: "Success",
    });

    return NextResponse.json({
      partner: {
        id: String(partner._id),
        name: partner.name,
        committedAmount: partner.committedAmount,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }
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
    return NextResponse.json(
      { error: "Could not update partner" },
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
    await connectDB();

    const partner = await loadOwnedPartner(session.id, id);
    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    const contribCount = await Contribution.countDocuments({
      partnerId: partner._id,
    });
    if (contribCount > 0) {
      return NextResponse.json(
        {
          error: `Remove or reassign ${contribCount} contribution${contribCount === 1 ? "" : "s"} for this partner first.`,
        },
        { status: 409 },
      );
    }

    const name = partner.name;
    const businessId = partner.businessId;
    await partner.deleteOne();
    await syncTargetCapital(businessId);

    await logActivity({
      userId: session.id,
      userName: session.name,
      module: "Capital",
      action: "Deleted",
      description: `Deleted partner “${name}”`,
      status: "Success",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Could not delete partner" },
      { status: 500 },
    );
  }
}
