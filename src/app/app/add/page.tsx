import { getSession } from "@/lib/auth";
import { ExpenseForm } from "@/components/ExpenseForm";
import Link from "next/link";

export default async function AddExpensePage() {
  const session = await getSession();

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Log a buy</h1>
          <p>
            Money leaving the pot. Example: jali for Rs 2,000 — spent by Ali.
          </p>
        </div>
        <Link href="/app/expenses" className="btn-secondary">
          View all buys
        </Link>
      </div>
      <ExpenseForm defaultSpentBy={session?.name || ""} />
    </>
  );
}
