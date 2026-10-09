import { getSession } from "@/lib/auth";
import { ExpenseForm } from "@/components/ExpenseForm";

export default async function AddExpensePage() {
  const session = await getSession();

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Add expense</h1>
          <p>Example: John bought glass — amount Rs 100, person John.</p>
        </div>
      </div>
      <ExpenseForm defaultSpentBy={session?.name || ""} />
    </>
  );
}
