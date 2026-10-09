import Link from "next/link";
import { redirect } from "next/navigation";
import { ExpensesClient } from "@/components/ExpensesClient";
import { getSession } from "@/lib/auth";
import { getBusinessSummary } from "@/lib/business";
import { connectDB } from "@/lib/db";

export default async function ExpensesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const summary = await getBusinessSummary(session.id);
  const partners = summary.partners.map((p) => ({ id: p.id, name: p.name }));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Buys from the pot</h1>
          <p>
            Every purchase that leaves the cash pot — jali, paint, feed, tools,
            and more.
          </p>
        </div>
        <Link href="/app/add" className="btn-primary">
          Log a buy
        </Link>
      </div>
      <ExpensesClient partners={partners} />
    </>
  );
}
