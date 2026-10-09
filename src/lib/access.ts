import type { SessionUser } from "@/lib/auth";

/** Users matching these patterns cannot see Records (nav + page + API). */
const RECORDS_BLOCKED = ["junaid"];

export function canAccessRecords(
  user: Pick<SessionUser, "name" | "email"> | null | undefined,
) {
  if (!user) return false;
  const haystack = `${user.name} ${user.email}`.toLowerCase();
  return !RECORDS_BLOCKED.some((term) => haystack.includes(term));
}
