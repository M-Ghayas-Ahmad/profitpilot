import { redirect } from "next/navigation";
import { EggsClient } from "@/components/EggsClient";
import { getSession } from "@/lib/auth";

export default async function EggsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Egg collection</h1>
          <p>Log how many eggs were collected each day. One entry per date — edit it if the count changes.</p>
        </div>
      </div>
      <EggsClient />
    </>
  );
}
