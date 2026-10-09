import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function POST() {
  const session = await getSession();
  if (session) {
    await logActivity({
      userId: session.id,
      userName: session.name,
      module: "Auth",
      action: "Logout",
      description: "Logged out successfully",
      status: "Success",
    });
  }

  const res = NextResponse.json({ ok: true });
  return clearSessionCookie(res);
}
