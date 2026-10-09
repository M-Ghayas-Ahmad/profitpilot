import mongoose from "mongoose";
import { Business } from "@/models/Business";
import { Contribution } from "@/models/Contribution";
import { Expense } from "@/models/Expense";
import { Partner } from "@/models/Partner";
import { ensureEggShedExample } from "@/lib/seedExample";

/**
 * The app runs one shared business: every account sees and edits the same
 * partners, contributions and buys. The first account to sign in creates it.
 */
export async function getOrCreateBusiness(
  userId: string,
  name = "Egg Shed Co",
) {
  let business = await Business.findOne().sort({ createdAt: 1 });
  if (!business) {
    business = await Business.create({
      name,
      currency: "Rs",
      targetCapital: 50_000,
      createdBy: new mongoose.Types.ObjectId(userId),
    });
  }
  return business;
}

export type PartnerSummary = {
  id: string;
  name: string;
  committedAmount: number;
  contributedAmount: number;
  pendingAmount: number;
};

export type BusinessSummary = {
  business: {
    id: string;
    name: string;
    currency: string;
    targetCapital: number;
  };
  committedTotal: number;
  contributedTotal: number;
  pendingCapital: number;
  spentTotal: number;
  cashLeft: number;
  partners: PartnerSummary[];
};

export async function getBusinessSummary(
  userId: string,
): Promise<BusinessSummary> {
  await ensureEggShedExample(userId);
  const business = await getOrCreateBusiness(userId);
  const businessId = business._id;

  const [partners, contribAgg, spentAgg] = await Promise.all([
    Partner.find({ businessId }).sort({ name: 1 }).lean(),
    Contribution.aggregate([
      { $match: { businessId } },
      {
        $group: {
          _id: "$partnerId",
          total: { $sum: "$amount" },
        },
      },
    ]),
    Expense.aggregate([
      { $match: { businessId } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const contribByPartner = new Map(
    contribAgg.map((r) => [String(r._id), r.total as number]),
  );

  const partnerRows: PartnerSummary[] = partners.map((p) => {
    const contributedAmount = contribByPartner.get(String(p._id)) || 0;
    const committedAmount = p.committedAmount;
    return {
      id: String(p._id),
      name: p.name,
      committedAmount,
      contributedAmount,
      pendingAmount: Math.max(0, committedAmount - contributedAmount),
    };
  });

  const committedTotal = partnerRows.reduce((s, p) => s + p.committedAmount, 0);
  const contributedTotal = partnerRows.reduce(
    (s, p) => s + p.contributedAmount,
    0,
  );
  const spentTotal = spentAgg[0]?.total || 0;

  return {
    business: {
      id: String(business._id),
      name: business.name,
      currency: business.currency,
      targetCapital: business.targetCapital || committedTotal,
    },
    committedTotal,
    contributedTotal,
    pendingCapital: Math.max(0, committedTotal - contributedTotal),
    spentTotal,
    cashLeft: contributedTotal - spentTotal,
    partners: partnerRows,
  };
}
