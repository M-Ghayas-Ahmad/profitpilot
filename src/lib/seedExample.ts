import mongoose from "mongoose";
import { getOrCreateBusiness } from "@/lib/business";
import { Contribution } from "@/models/Contribution";
import { Expense } from "@/models/Expense";
import { Partner } from "@/models/Partner";
import { SHARED_SPENDER } from "@/lib/format";

/**
 * Golden Egg Farm example:
 * - Partner A + Partner B target 25k each → 50k planned
 * - Each contributes 5k → 10k in pot (20% progress), 40k pending
 * - Buys: jali 2k, oil paint 350, gola 300, plastic 720, gloves 50, spray 1000
 * - Cash left: 10_000 − 4_420 = 5_580
 */
export async function seedEggShedExample(
  userId: string,
  options: { force?: boolean } = {},
) {
  const createdBy = new mongoose.Types.ObjectId(userId);
  const business = await getOrCreateBusiness(userId);

  const [partnerCount, contribCount, expenseCount] = await Promise.all([
    Partner.countDocuments({ businessId: business._id }),
    Contribution.countDocuments({ businessId: business._id }),
    Expense.countDocuments({ businessId: business._id }),
  ]);

  const isEmpty = partnerCount === 0 && contribCount === 0 && expenseCount === 0;
  if (!options.force && !isEmpty) {
    return { seeded: false, reason: "already-has-data" as const };
  }

  if (options.force) {
    await Promise.all([
      Partner.deleteMany({ businessId: business._id }),
      Contribution.deleteMany({ businessId: business._id }),
      Expense.deleteMany({ businessId: business._id }),
    ]);
  }

  // Keep the shared business's own name; only reset the money setup.
  business.currency = "Rs";
  business.targetCapital = 50_000;
  await business.save();

  const today = new Date();
  const dayBefore = new Date(today);
  dayBefore.setDate(dayBefore.getDate() - 1);

  const [partnerA, partnerB] = await Partner.create([
    {
      businessId: business._id,
      name: "Partner A",
      committedAmount: 25_000,
      createdBy,
    },
    {
      businessId: business._id,
      name: "Partner B",
      committedAmount: 25_000,
      createdBy,
    },
  ]);

  await Contribution.create([
    {
      businessId: business._id,
      partnerId: partnerA._id,
      partnerName: "Partner A",
      amount: 5_000,
      note: "First materials — share of 10k need",
      date: dayBefore,
      createdBy,
    },
    {
      businessId: business._id,
      partnerId: partnerB._id,
      partnerName: "Partner B",
      amount: 5_000,
      note: "First materials — share of 10k need",
      date: dayBefore,
      createdBy,
    },
  ]);

  await Expense.create([
    {
      businessId: business._id,
      title: "Jali",
      amount: 2_000,
      spentBy: SHARED_SPENDER,
      note: "Wire mesh for the shed",
      date: today,
      createdBy,
    },
    {
      businessId: business._id,
      title: "Oil paint",
      amount: 350,
      spentBy: SHARED_SPENDER,
      note: "Shed coating",
      date: today,
      createdBy,
    },
    {
      businessId: business._id,
      title: "Gola",
      amount: 300,
      spentBy: SHARED_SPENDER,
      date: today,
      createdBy,
    },
    {
      businessId: business._id,
      title: "Plastic",
      amount: 720,
      spentBy: SHARED_SPENDER,
      date: today,
      createdBy,
    },
    {
      businessId: business._id,
      title: "Gloves",
      amount: 50,
      spentBy: SHARED_SPENDER,
      date: today,
      createdBy,
    },
    {
      businessId: business._id,
      title: "Spray bottle",
      amount: 1_000,
      spentBy: SHARED_SPENDER,
      date: today,
      createdBy,
    },
  ]);

  return {
    seeded: true,
    reason: options.force ? ("forced" as const) : ("empty" as const),
    totals: {
      committed: 50_000,
      contributed: 10_000,
      pending: 40_000,
      progressPct: 20,
      spent: 4_420,
      cashLeft: 5_580,
    },
  };
}

/** Ensure example exists for brand-new / empty ledgers. */
export async function ensureEggShedExample(userId: string) {
  return seedEggShedExample(userId, { force: false });
}
