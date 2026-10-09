// One-off fix: make "Egg Shed Co" the single shared business.
// - Backs up what it changes to scripts/backup-before-merge.json
// - Removes the duplicate "Golden Egg Farm" business (auto-created for the
//   Ghayas login) with its copy of the partners and contributions
// - Moves every buy into Egg Shed Co
//
// Run from the profitpilot folder:
//   node --env-file=.env.local scripts/merge-into-egg-shed-co.mjs
import fs from "node:fs";
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
const oid = (s) => new mongoose.Types.ObjectId(s);

const keep = oid("6ac94e9c2758a1fc941f5141"); // Egg Shed Co
const drop = oid("6ac9618dd19ff5fe30a4bd6c"); // Golden Egg Farm (duplicate)

const keepDoc = await db.collection("businesses").findOne({ _id: keep });
if (!keepDoc) {
  console.error("Egg Shed Co not found — nothing changed.");
  process.exit(1);
}

const backup = {
  business: await db.collection("businesses").findOne({ _id: drop }),
  partners: await db.collection("partners").find({ businessId: drop }).toArray(),
  contributions: await db
    .collection("contributions")
    .find({ businessId: drop })
    .toArray(),
  expenses: await db.collection("expenses").find({}).toArray(),
};
fs.writeFileSync(
  new URL("./backup-before-merge.json", import.meta.url),
  JSON.stringify(backup, null, 2),
);
console.log("Backup written to scripts/backup-before-merge.json");

const c = await db.collection("contributions").deleteMany({ businessId: drop });
const p = await db.collection("partners").deleteMany({ businessId: drop });
const b = await db.collection("businesses").deleteOne({ _id: drop });
const e = await db
  .collection("expenses")
  .updateMany({}, { $set: { businessId: keep } });

console.log(`Removed duplicate: ${b.deletedCount} business, ${p.deletedCount} partners, ${c.deletedCount} contributions`);
console.log(`Moved ${e.modifiedCount} buys into Egg Shed Co`);

await mongoose.disconnect();
