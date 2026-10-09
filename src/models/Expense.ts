import mongoose, { Schema, model } from "mongoose";

export type ExpenseDoc = {
  _id: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  spentBy: string;
  note?: string;
  date: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const ExpenseSchema = new Schema<ExpenseDoc>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    spentBy: { type: String, required: true, trim: true },
    note: { type: String, trim: true },
    date: { type: Date, required: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true, strict: true },
);

ExpenseSchema.index({ businessId: 1, date: -1 });

// Drop cached model so hot-reload picks up schema changes (e.g. removed category).
if (mongoose.models.Expense) {
  mongoose.deleteModel("Expense");
}

export const Expense = model<ExpenseDoc>("Expense", ExpenseSchema);
