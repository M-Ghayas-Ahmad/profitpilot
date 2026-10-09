import Link from "next/link";
import { ExpensesClient } from "@/components/ExpensesClient";

export default function ExpensesPage() {
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
      <ExpensesClient />
    </>
  );
}
