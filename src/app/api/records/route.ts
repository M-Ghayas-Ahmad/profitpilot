import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canAccessRecords } from "@/lib/access";
import { connectDB } from "@/lib/db";
import { ActivityLog } from "@/models/ActivityLog";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canAccessRecords(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim();
  const moduleFilter = searchParams.get("module")?.trim();
  const status = searchParams.get("status")?.trim();
  const limit = Math.min(Number(searchParams.get("limit") || 100), 300);

  // Activity is shared across accounts, like the business itself.
  const filter: Record<string, unknown> = {};

  if (moduleFilter && moduleFilter !== "all") filter.module = moduleFilter;
  if (status === "Success" || status === "Failed") filter.status = status;
  if (q) {
    filter.$or = [
      { description: new RegExp(q, "i") },
      { action: new RegExp(q, "i") },
      { module: new RegExp(q, "i") },
      { userName: new RegExp(q, "i") },
    ];
  }

  const records = await ActivityLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({
    records: records.map((r, index) => ({
      index: index + 1,
      id: String(r._id),
      dateTime: r.createdAt,
      user: r.userName,
      role: r.role,
      module: r.module,
      action: r.action,
      description: r.description,
      status: r.status,
    })),
    count: records.length,
  });
}
