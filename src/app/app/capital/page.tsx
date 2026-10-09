import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getBusinessSummary } from "@/lib/business";
import { Contribution } from "@/models/Contribution";
import { CapitalClient } from "@/components/CapitalClient";
import { BusinessSetupCard } from "@/components/BusinessSetupCard";
import { redirect } from "next/navigation";
import mongoose from "mongoose";
import Link from "next/link";

export default async function CapitalPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const summary = await getBusinessSummary(session.id);
  const contributions = await Contribution.find({
    businessId: new mongoose.Types.ObjectId(summary.business.id),
  })
    .sort({ date: -1, createdAt: -1 })
    .lean();

  const planned =
    summary.business.targetCapital || summary.committedTotal || 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Capital</h1>
          <p>
            Edit partners, targets, and money put into the pot. The board above
            always shows the live picture.
          </p>
        </div>
        <Link href="/app/add" className="btn-primary">
          Log a buy
        </Link>
      </div>

      <BusinessSetupCard
        businessName={summary.business.name}
        partners={summary.partners}
        plannedTotal={planned}
        contributedTotal={summary.contributedTotal}
        pendingTotal={summary.pendingCapital}
        spentTotal={summary.spentTotal}
        cashLeft={summary.cashLeft}
        manageHref="/app/capital"
      />

      <CapitalClient
        businessName={summary.business.name}
        targetCapital={summary.business.targetCapital || summary.committedTotal}
        partners={summary.partners}
        contributions={contributions.map((c) => ({
          id: String(c._id),
          partnerId: String(c.partnerId),
          partnerName: c.partnerName,
          amount: c.amount,
          note: c.note || "",
          date: c.date,
        }))}
      />
    </>
  );
}
