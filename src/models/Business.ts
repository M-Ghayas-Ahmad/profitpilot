import mongoose, { Schema, model } from "mongoose";

export type BusinessDoc = {
  _id: mongoose.Types.ObjectId;
  name: string;
  currency: string;
  /** Planned total capital for the venture (e.g. 50_000). */
  targetCapital: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const BusinessSchema = new Schema<BusinessDoc>(
  {
    name: { type: String, required: true, trim: true },
    currency: { type: String, required: true, default: "Rs", trim: true },
    targetCapital: { type: Number, required: true, min: 0, default: 0 },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
  },
  { timestamps: true, strict: true },
);

if (mongoose.models.Business) {
  mongoose.deleteModel("Business");
}

export const Business = model<BusinessDoc>("Business", BusinessSchema);
