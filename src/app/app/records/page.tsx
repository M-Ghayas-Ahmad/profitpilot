import { redirect } from "next/navigation";
import { RecordsClient } from "@/components/RecordsClient";
import { getSession } from "@/lib/auth";
import { canAccessRecords } from "@/lib/access";

export default async function RecordsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canAccessRecords(session)) redirect("/app");

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Records</h1>
          <p>
            Full activity trail — who did what, when, and whether it succeeded.
          </p>
        </div>
      </div>
      <RecordsClient />
    </>
  );
}
