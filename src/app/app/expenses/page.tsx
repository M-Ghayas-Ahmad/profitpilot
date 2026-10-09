import Link from "next/link";
import { ExpensesClient } from "@/components/ExpensesClient";

export default function ExpensesPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>All expenses</h1>
          <p>Search by person or what was bought.</p>
        </div>
        <Link href="/app/add" className="btn-primary">
          Add expense
        </Link>
      </div>
      <ExpensesClient />
    </>
  );
}
