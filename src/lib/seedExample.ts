import mongoose from "mongoose";
import { Business } from "@/models/Business";
import { Contribution } from "@/models/Contribution";
import { Expense } from "@/models/Expense";
import { Partner } from "@/models/Partner";

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
  let business = await Business.findOne({ createdBy });
  if (!business) {
    business = await Business.create({
      name: "Golden Egg Farm",
      currency: "Rs",
      targetCapital: 50_000,
      createdBy,
    });
  }

  const [partnerCount, contribCount, expenseCount] = await Promise.all([
    Partner.countDocuments({ businessId: business._id }),
    Contribution.countDocuments({ businessId: business._id }),
    Expense.countDocuments({ createdBy }),
  ]);

  const isEmpty = partnerCount === 0 && contribCount === 0 && expenseCount === 0;
  if (!options.force && !isEmpty) {
    return { seeded: false, reason: "already-has-data" as const };
  }

  if (options.force) {
    await Promise.all([
      Partner.deleteMany({ businessId: business._id }),
      Contribution.deleteMany({ businessId: business._id }),
      Expense.deleteMany({ createdBy }),
    ]);
  }

  business.name = "Golden Egg Farm";
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
      title: "Jali",
      amount: 2_000,
      spentBy: "Partner A",
      note: "Wire mesh for the shed",
      date: today,
      createdBy,
    },
    {
      title: "Oil paint",
      amount: 350,
      spentBy: "Partner B",
      note: "Shed coating",
      date: today,
      createdBy,
    },
    {
      title: "Gola",
      amount: 300,
      spentBy: "Partner A",
      date: today,
      createdBy,
    },
    {
      title: "Plastic",
      amount: 720,
      spentBy: "Partner B",
      date: today,
      createdBy,
    },
    {
      title: "Gloves",
      amount: 50,
      spentBy: "Partner A",
      date: today,
      createdBy,
    },
    {
      title: "Spray bottle",
      amount: 1_000,
      spentBy: "Partner B",
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
