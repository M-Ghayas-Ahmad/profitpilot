import { z } from "zod";

export const eggDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date")
  .refine((d) => !Number.isNaN(new Date(d).getTime()), "Pick a valid date")
  .refine((d) => new Date(d).getTime() <= Date.now(), "Date cannot be in the future");

export const eggCount = z.coerce
  .number({ message: "Enter the number of eggs" })
  .int("Egg count must be a whole number")
  .min(0, "Egg count cannot be negative")
  .max(1_000_000, "Egg count looks too large");

/** Mongo duplicate-key error → this business already has an entry for that day. */
export function isDuplicateDay(err: unknown) {
  return (err as { code?: number })?.code === 11000;
}

export function toEggJson(e: { _id: unknown; date: Date; count: number; note?: string; createdAt?: Date }) {
  return { id: String(e._id), date: e.date, count: e.count, note: e.note || "", createdAt: e.createdAt };
}
