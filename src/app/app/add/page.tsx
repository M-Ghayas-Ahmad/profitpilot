import { getSession } from "@/lib/auth";
import { getBusinessSummary } from "@/lib/business";
import { connectDB } from "@/lib/db";
import { ExpenseForm } from "@/components/ExpenseForm";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AddExpensePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const summary = await getBusinessSummary(session.id);
  const partners = summary.partners.map((p) => ({ id: p.id, name: p.name }));
  const exampleName = partners[0]?.name || "a partner";

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Log a buy</h1>
          <p>
            Money leaving the pot. Example: jali for Rs 2,000 — spent by{" "}
            {exampleName}.
          </p>
        </div>
        <Link href="/app/expenses" className="btn-secondary">
          View all buys
        </Link>
      </div>
      <ExpenseForm partners={partners} />
    </>
  );
}
