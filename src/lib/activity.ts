import { connectDB } from "@/lib/db";
import { ActivityLog, ActivityStatus } from "@/models/ActivityLog";

type LogInput = {
  userId?: string;
  userName: string;
  role?: string;
  module: string;
  action: string;
  description: string;
  status?: ActivityStatus;
};

/** Fire-and-forget safe logger — never throws to callers. */
export async function logActivity(input: LogInput) {
  try {
    await connectDB();
    await ActivityLog.create({
      userId: input.userId || undefined,
      userName: input.userName,
      role: input.role || "User",
      module: input.module,
      action: input.action,
      description: input.description,
      status: input.status || "Success",
    });
  } catch (err) {
    console.error("activity log failed", err);
  }
}
